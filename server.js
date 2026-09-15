const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Always load the project-local .env first. This keeps developer/API codes working
// even when the process was started from a different working directory.
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

function envValue(name) {
    return String(process.env[name] ?? "").replace(/^\uFEFF/, "").trim();
}

const ENV_DEV_CODE = envValue("DEV_CODE") || envValue("ADMIN_CODE");
const ENV_ADMIN_CODE = envValue("ADMIN_CODE");

console.log(`[ENV] NEIS_API_KEY=${envValue("NEIS_API_KEY") ? "loaded" : "missing"}`);
console.log(`[ENV] GEMINI_API_KEY=${envValue("GEMINI_API_KEY") ? "loaded" : "missing"}`);
console.log(`[ENV] YOUTUBE_API_KEY=${envValue("YOUTUBE_API_KEY") ? "loaded" : "missing"}`);
console.log(`[ENV] ADMIN_CODE=${ENV_ADMIN_CODE ? "loaded" : "missing"}`);
console.log(`[ENV] DEV_CODE=${ENV_DEV_CODE ? "loaded" : "missing"}`);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: true, methods: ["GET", "POST", "PUT", "DELETE"] },
    connectionStateRecovery: { maxDisconnectionDuration: 5 * 60 * 1000, skipMiddlewares: true },
    pingInterval: 25000,
    pingTimeout: 20000
});
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = process.env.COMTIME_DATA_DIR ? path.resolve(process.env.COMTIME_DATA_DIR) : path.join(__dirname, "data");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public"), { index: "index.html", extensions: ["html"] }));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// ==================================================
// AUTH / USER DATA / DETAILED LOGGING
// ==================================================
const USER_FILE = path.join(DATA_DIR, "users.json");
const MESSAGE_FILE = path.join(DATA_DIR, "messages.json");
const LOG_FILE = path.join(DATA_DIR, "activity.ndjson");

function ensureUserStore() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(USER_FILE)) fs.writeFileSync(USER_FILE, "[]", "utf8");
    if (!fs.existsSync(MESSAGE_FILE)) fs.writeFileSync(MESSAGE_FILE, "[]", "utf8");
    if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, "", "utf8");
}

function backupCorruptJson(file) {
    try {
        if (!fs.existsSync(file)) return null;
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backup = `${file}.corrupt-${stamp}-${process.pid}`;
        fs.copyFileSync(file, backup);
        return backup;
    } catch (error) {
        console.error(`[데이터 백업 오류] ${path.basename(file)}`, error);
        return null;
    }
}

function readJsonFile(file, fallback) {
    ensureUserStore();
    const safeFallback = fallback === undefined ? null : fallback;
    const name = path.basename(file);
    try {
        const raw = fs.readFileSync(file, "utf8");
        // Render 재시작/이전 버전의 부분 쓰기로 0바이트 파일이 남아도
        // 모든 요청마다 JSON.parse 예외를 발생시키지 않습니다.
        if (!raw.trim()) {
            writeJsonFile(file, safeFallback);
            return safeFallback;
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(safeFallback) && !Array.isArray(parsed)) throw new SyntaxError("JSON root must be an array");
        return parsed;
    } catch (error) {
        const backup = backupCorruptJson(file);
        console.warn(`[데이터 복구] ${name}의 JSON을 복구합니다.`, error.message || error);
        if (backup) console.warn(`[데이터 백업] ${path.basename(backup)}`);
        try {
            writeJsonFile(file, safeFallback);
        } catch (writeError) {
            console.error(`[데이터 복구 저장 오류] ${name}`, writeError);
        }
        return safeFallback;
    }
}

function writeJsonFile(file, value) {
    ensureUserStore();
    const directory = path.dirname(file);
    const base = path.basename(file);
    const temp = path.join(directory, `.${base}.${process.pid}.${Date.now()}.tmp`);
    const json = JSON.stringify(value, null, 2);
    fs.writeFileSync(temp, json, "utf8");
    try {
        // Readers only ever see the old complete file or the new complete file.
        fs.renameSync(temp, file);
    } catch (error) {
        try { fs.rmSync(temp, { force: true }); } catch (_) {}
        throw error;
    }
}

function appendActivityLog(type, payload = {}) {
    ensureUserStore();
    const entry = { timestamp: new Date().toISOString(), type, ...payload };
    try { fs.appendFileSync(LOG_FILE, `${JSON.stringify(entry)}\n`, "utf8"); } catch (error) { console.error("[상세 로그 저장 오류]", error); }
    console.log(`[활동로그] ${type}`, payload);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
    return { salt, hash: crypto.scryptSync(String(password), salt, 64).toString("hex") };
}

function verifyPassword(password, salt, expectedHash) {
    const actual = crypto.scryptSync(String(password), salt, 64).toString("hex");
    const expected = Buffer.from(String(expectedHash), "hex");
    const actualBuffer = Buffer.from(actual, "hex");
    return expected.length === actualBuffer.length && crypto.timingSafeEqual(actualBuffer, expected);
}

function createSessionToken() { return crypto.randomBytes(32).toString("hex"); }
function tokenHash(token) { return crypto.createHash("sha256").update(String(token)).digest("hex"); }
function normalizeUsername(value) { return String(value || "").trim().toLowerCase(); }

function parseCookies(req) {
    const raw=String(req.headers.cookie||"");
    const out={};
    raw.split(";").forEach(part=>{
        const i=part.indexOf("=");
        if(i<0)return;
        const k=part.slice(0,i).trim();
        const v=part.slice(i+1).trim();
        if(k) out[k]=decodeURIComponent(v);
    });
    return out;
}
function getAuthToken(req) {
    const header = String(req.headers.authorization || "");
    if (header.startsWith("Bearer ")) return header.slice(7).trim();
    const legacy=String(req.headers["x-comtime-auth-token"] || "").trim();
    if(legacy) return legacy;
    return String(parseCookies(req).comtime_auth || "").trim();
}
function setAuthCookie(res, token) {
    res.setHeader("Set-Cookie", `comtime_auth=${encodeURIComponent(String(token||""))}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`);
}
function clearAuthCookie(res) {
    res.setHeader("Set-Cookie", "comtime_auth=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
}

function findUserByToken(token) {
    if (!token) return null;
    const hash = tokenHash(token);
    const users = readJsonFile(USER_FILE, []);
    return users.find((user) => Array.isArray(user.sessions) && user.sessions.some((session) => session.hash === hash)) || null;
}

function publicUser(user) {
    if (!user) return null;
    return {
        username: user.username,
        displayName: user.displayName || user.username,
        createdAt: user.createdAt,
        profile: user.profile || { school: null, grade: "", classNum: "" },
        algorithm: user.algorithm || { profile: null, history: [], updatedAt: null }
    };
}

function requireAuth(req, res, next) {
    const user = findUserByToken(getAuthToken(req));
    if (!user) return res.status(401).json({ ok: false, message: "로그인이 필요합니다." });
    req.comtimeUser = user;
    next();
}

function saveUser(user) {
    const users = readJsonFile(USER_FILE, []);
    const index = users.findIndex((item) => item.username === user.username);
    if (index < 0) return false;
    users[index] = user;
    writeJsonFile(USER_FILE, users);
    return true;
}

function sanitizeProfile(profile) {
    const school = profile?.school && profile.school.code ? {
        code: Number(profile.school.code),
        name: String(profile.school.name || "").slice(0, 120),
        region: String(profile.school.region || "").slice(0, 120),
        officeCode: profile.school.officeCode ? String(profile.school.officeCode).slice(0, 30) : null,
        neisSchoolCode: profile.school.neisSchoolCode ? String(profile.school.neisSchoolCode).slice(0, 30) : null
    } : null;
    const themes=["white","blue","purple","black","yellow"];
    return {
        school,
        grade: String(profile?.grade || "").slice(0, 10),
        classNum: String(profile?.classNum || "").slice(0, 10),
        theme: themes.includes(String(profile?.theme)) ? String(profile.theme) : "white",
        profileImage: String(profile?.profileImage || "").slice(0, 900000),
        profileFrame: ["none","gold","silver","season"].includes(String(profile?.profileFrame)) ? String(profile.profileFrame) : "none"
    };
}

function sanitizeAlgorithm(profile) {
    return {
        profile: profile?.profile ? {
            query: String(profile.profile.query || "").slice(0, 200),
            keywords: Array.isArray(profile.profile.keywords) ? profile.profile.keywords.map((x) => String(x).slice(0, 60)).slice(0, 10) : [],
            koreanPriority: Math.max(0, Math.min(1, Number(profile.profile.koreanPriority) || 0)),
            summary: String(profile.profile.summary || "").slice(0, 500)
        } : null,
        history: Array.isArray(profile?.history) ? profile.history.slice(-100) : [],
        updatedAt: profile?.updatedAt || null
    };
}

app.use((req, res, next) => {
    const started = Date.now();
    const requestId = crypto.randomBytes(6).toString("hex");
    req.requestId = requestId;
    res.on("finish", () => {
        const user = findUserByToken(getAuthToken(req));
        appendActivityLog("http", { requestId, method: req.method, path: req.originalUrl, status: res.statusCode, durationMs: Date.now() - started, user: user?.username || null, ip: req.ip });
    });
    next();
});

ensureUserStore();

function wordChainRemovePlayer(room,socket){
    if(!room)return;
    const idx=room.players.findIndex(p=>p.id===socket.id);
    if(idx<0){ if(socket.data.wordChainRoom===room.code)socket.data.wordChainRoom=null; return; }
    const wasTurn=room.turnPlayerId===socket.id;
    room.players.splice(idx,1);
    socket.leave(`wordchain:${room.code}`);
    socket.data.wordChainRoom=null;

    if(room.players.length===0){
        wordChainRooms.delete(room.code);
        wordChainBroadcastRooms();
        return;
    }
    if(room.hostId===socket.id) room.hostId=room.players[0].id;

    if(room.status==="playing"){
        const alive=room.players.filter(p=>p.alive);
        if(alive.length<=1){
            room.status="ended";
            room.turnPlayerId=null;
            room.turnDeadline=0;
            room.winnerId=alive[0]?.id||null;
            wordChainAddLog(room,alive[0]?`${alive[0].nickname} 승리!`:'게임 종료','win');
            wordChainBroadcast(room);
        }else if(wasTurn){
            wordChainAdvanceTurn(room);
        }else{
            wordChainBroadcast(room);
        }
    }else{
        wordChainBroadcast(room);
    }
}

io.on("connection", (socket) => {
    socket.on("auth:identify", ({ token } = {}) => {
        const user = findUserByToken(String(token || ""));
        if (!user) return socket.emit("auth:error", { message: "로그인이 필요합니다." });
        socket.data.username = user.username;
        socket.join(`user:${user.username}`);
        appendActivityLog("socket_identify", { user: user.username, socketId: socket.id });
    });

    socket.emit("notices:update", { notices: getSortedNotices(), updatedAt: new Date().toISOString() });
});


// ==================================================
// ACCOUNT / PROFILE / FRIENDS / MESSAGES
// ==================================================
app.post("/api/auth/register", (req, res) => {
    const username = normalizeUsername(req.body?.username);
    const password = String(req.body?.password || "");
    const displayName = String(req.body?.displayName || username).trim().slice(0, 40) || username;

    if (!/^[a-z0-9가-힣_]{3,24}$/.test(username)) return res.status(400).json({ ok: false, message: "아이디는 3~24자의 영문 소문자, 숫자, 한글, _만 사용할 수 있습니다." });
    if (password.length < 6 || password.length > 128) return res.status(400).json({ ok: false, message: "비밀번호는 6~128자로 입력해주세요." });

    const users = readJsonFile(USER_FILE, []);
    if (users.some((user) => user.username === username)) return res.status(409).json({ ok: false, message: "이미 사용 중인 아이디입니다." });

    const passwordData = hashPassword(password);
    const now = new Date().toISOString();
    const user = {
        username, displayName, passwordHash: passwordData.hash, passwordSalt: passwordData.salt,
        createdAt: now, lastLoginAt: null, sessions: [],
        profile: { school: null, grade: "", classNum: "" },
        algorithm: { profile: null, history: [], updatedAt: null },
        geminiConversations: [],
        friends: []
    };
    const token = createSessionToken();
    user.sessions.push({ hash: tokenHash(token), createdAt: now });
    users.push(user);
    writeJsonFile(USER_FILE, users);
    appendActivityLog("register", { user: username, displayName });
    setAuthCookie(res, token);
    return res.json({ ok: true, token, user: publicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
    const username = normalizeUsername(req.body?.username);
    const password = String(req.body?.password || "");
    const users = readJsonFile(USER_FILE, []);
    const user = users.find((item) => item.username === username);
    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
        appendActivityLog("login_failed", { user: username || null });
        return res.status(401).json({ ok: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." });
    }
    const token = createSessionToken();
    user.sessions = Array.isArray(user.sessions) ? user.sessions : [];
    user.sessions.push({ hash: tokenHash(token), createdAt: new Date().toISOString() });
    user.sessions = user.sessions.slice(-5);
    user.lastLoginAt = new Date().toISOString();
    saveUser(user);
    appendActivityLog("login", { user: username });
    setAuthCookie(res, token);
    return res.json({ ok: true, token, user: publicUser(user) });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
    const tokenHashValue = tokenHash(getAuthToken(req));
    req.comtimeUser.sessions = (req.comtimeUser.sessions || []).filter((session) => session.hash !== tokenHashValue);
    saveUser(req.comtimeUser);
    clearAuthCookie(res);
    appendActivityLog("logout", { user: req.comtimeUser.username });
    res.json({ ok: true });
});

app.get("/api/me", requireAuth, (req, res) => res.json({ ok: true, user: publicUser(req.comtimeUser) }));

app.put("/api/me/profile", requireAuth, (req, res) => {
    req.comtimeUser.profile = sanitizeProfile(req.body?.profile || {});
    saveUser(req.comtimeUser);
    appendActivityLog("profile_update", { user: req.comtimeUser.username, profile: req.comtimeUser.profile });
    res.json({ ok: true, profile: req.comtimeUser.profile });
});

app.put("/api/me/account", requireAuth, (req, res) => {
    const nextUsername = normalizeUsername(req.body?.username ?? req.comtimeUser.username);
    const displayName = String(req.body?.displayName ?? req.comtimeUser.displayName ?? nextUsername).trim().slice(0,40) || nextUsername;
    const password = req.body?.password === undefined ? "" : String(req.body.password);
    if (!/^[a-z0-9가-힣_]{3,24}$/.test(nextUsername)) return res.status(400).json({ok:false,message:"아이디는 3~24자의 영문 소문자, 숫자, 한글, _만 사용할 수 있습니다."});
    if (password && (password.length<6 || password.length>128)) return res.status(400).json({ok:false,message:"비밀번호는 6~128자로 입력해주세요."});
    const users=readJsonFile(USER_FILE,[]);
    if(nextUsername!==req.comtimeUser.username && users.some(u=>u.username===nextUsername)) return res.status(409).json({ok:false,message:"이미 사용 중인 아이디입니다."});
    const oldUsername=req.comtimeUser.username;
    req.comtimeUser.username=nextUsername; req.comtimeUser.displayName=displayName;
    if(password){const pd=hashPassword(password);req.comtimeUser.passwordHash=pd.hash;req.comtimeUser.passwordSalt=pd.salt;}
    const newToken=createSessionToken(); req.comtimeUser.sessions=Array.isArray(req.comtimeUser.sessions)?req.comtimeUser.sessions:[];
    req.comtimeUser.sessions.push({hash:tokenHash(newToken),createdAt:new Date().toISOString()});
    if(nextUsername!==oldUsername){
        req.comtimeUser.friends=(req.comtimeUser.friends||[]).map(x=>x===oldUsername?nextUsername:x);
        for(const u of users){u.friends=(u.friends||[]).map(x=>x===oldUsername?nextUsername:x);}
    }
    const idx=users.findIndex(u=>u.username===oldUsername);
    if(idx>=0)users[idx]=req.comtimeUser; else users.push(req.comtimeUser);
    writeJsonFile(USER_FILE,users);
    appendActivityLog("account_update",{user:nextUsername,previousUsername:oldUsername});
    setAuthCookie(res,newToken);
    res.json({ok:true,token:newToken,user:publicUser(req.comtimeUser)});
});

app.post("/api/me/reset-data", requireAuth, (req,res)=>{
    const u=req.comtimeUser;
    /* Credentials and active login sessions are intentionally preserved. */
    u.profile={school:null,grade:"",classNum:"",theme:"white",profileImage:"",profileFrame:"none"};
    u.algorithm={profile:null,history:[],updatedAt:null};
    u.geminiConversations=[];
    u.friends=[];
    u.shortsHistory=[];
    u.messages=[];
    const messages=readJsonFile(MESSAGE_FILE,[]).filter(m=>m.from!==u.username&&m.to!==u.username);
    writeJsonFile(MESSAGE_FILE,messages);
    saveUser(u);
    appendActivityLog("data_reset",{user:u.username});
    res.json({ok:true,user:publicUser(u)});
});

app.put("/api/me/algorithm", requireAuth, (req, res) => {
    req.comtimeUser.algorithm = sanitizeAlgorithm(req.body?.algorithm || {});
    saveUser(req.comtimeUser);
    appendActivityLog("algorithm_update", { user: req.comtimeUser.username, algorithm: req.comtimeUser.algorithm });
    res.json({ ok: true, algorithm: req.comtimeUser.algorithm });
});

app.get("/api/friends", requireAuth, (req, res) => {
    const users = readJsonFile(USER_FILE, []);
    const friends = (req.comtimeUser.friends || []).map((username) => users.find((u) => u.username === username)).filter(Boolean).map((u) => ({ username: u.username, displayName: u.displayName || u.username }));
    friends.sort((a, b) => a.displayName.localeCompare(b.displayName, "ko"));
    res.json({ ok: true, friends });
});

app.post("/api/friends/add", requireAuth, (req, res) => {
    const target = normalizeUsername(req.body?.username);
    if (!target || target === req.comtimeUser.username) return res.status(400).json({ ok: false, message: "추가할 친구 아이디를 확인해주세요." });
    const users = readJsonFile(USER_FILE, []);
    const friend = users.find((u) => u.username === target);
    if (!friend) return res.status(404).json({ ok: false, message: "해당 아이디의 사용자를 찾을 수 없습니다." });
    req.comtimeUser.friends = Array.isArray(req.comtimeUser.friends) ? req.comtimeUser.friends : [];
    if (!req.comtimeUser.friends.includes(target)) req.comtimeUser.friends.push(target);
    friend.friends = Array.isArray(friend.friends) ? friend.friends : [];
    if (!friend.friends.includes(req.comtimeUser.username)) friend.friends.push(req.comtimeUser.username);
    saveUser(req.comtimeUser); saveUser(friend);
    appendActivityLog("friend_add", { user: req.comtimeUser.username, friend: target });
    res.json({ ok: true, friend: { username: friend.username, displayName: friend.displayName || friend.username } });
});

app.get("/api/messages/:username", requireAuth, (req, res) => {
    const target = normalizeUsername(req.params.username);
    if (!(req.comtimeUser.friends || []).includes(target)) return res.status(403).json({ ok: false, message: "친구만 대화할 수 있습니다." });
    const messages = readJsonFile(MESSAGE_FILE, []).filter((m) => (m.from === req.comtimeUser.username && m.to === target) || (m.from === target && m.to === req.comtimeUser.username)).slice(-200);
    res.json({ ok: true, messages });
});

app.post("/api/messages/send", requireAuth, (req, res) => {
    const to = normalizeUsername(req.body?.to);
    const text = String(req.body?.text || "").trim().slice(0, 2000);
    if (!to || !text) return res.status(400).json({ ok: false, message: "받는 사람과 메시지를 입력해주세요." });
    if (!(req.comtimeUser.friends || []).includes(to)) return res.status(403).json({ ok: false, message: "친구만 대화할 수 있습니다." });
    const users = readJsonFile(USER_FILE, []);
    if (!users.some((u) => u.username === to)) return res.status(404).json({ ok: false, message: "상대 사용자를 찾을 수 없습니다." });
    const message = { id: crypto.randomUUID(), from: req.comtimeUser.username, to, text, createdAt: new Date().toISOString() };
    const messages = readJsonFile(MESSAGE_FILE, []);
    messages.push(message);
    writeJsonFile(MESSAGE_FILE, messages.slice(-10000));
    appendActivityLog("message_send", { user: req.comtimeUser.username, to, messageId: message.id, length: text.length });
    io.to(`user:${to}`).emit("chat:message", message);
    io.to(`user:${req.comtimeUser.username}`).emit("chat:message", message);
    res.json({ ok: true, message });
});

app.get("/api/gemini/history", requireAuth, (req, res) => {
    const conversations = Array.isArray(req.comtimeUser.geminiConversations) ? req.comtimeUser.geminiConversations : [];
    res.json({ ok: true, conversations: conversations.slice(-30) });
});

app.post("/api/gemini/new", requireAuth, (req, res) => {
    const id = crypto.randomUUID();
    req.comtimeUser.geminiConversations = Array.isArray(req.comtimeUser.geminiConversations) ? req.comtimeUser.geminiConversations : [];
    req.comtimeUser.geminiConversations.push({ id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), previousInteractionId: null, messages: [] });
    req.comtimeUser.geminiConversations = req.comtimeUser.geminiConversations.slice(-30);
    saveUser(req.comtimeUser);
    appendActivityLog("gemini_new_chat", { user: req.comtimeUser.username, conversationId: id });
    res.json({ ok: true, conversationId: id });
});

// ==================================================
// NOTICE BOARD
// ==================================================
const NOTICE_FILE = path.join(DATA_DIR, "notices.json");

function ensureNoticeStore() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(NOTICE_FILE)) fs.writeFileSync(NOTICE_FILE, "[]", "utf8");
}

function readNotices() {
    ensureNoticeStore();
    try {
        const data = JSON.parse(fs.readFileSync(NOTICE_FILE, "utf8"));
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("[공지 읽기 오류]", error);
        return [];
    }
}

function writeNotices(notices) {
    ensureNoticeStore();
    const tempFile = `${NOTICE_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(notices, null, 2), "utf8");
    fs.renameSync(tempFile, NOTICE_FILE);
}

function getSortedNotices() {
    return readNotices().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function broadcastNotices() {
    io.emit("notices:update", { notices: getSortedNotices(), updatedAt: new Date().toISOString() });
}

function isAdmin(req) {
    const adminCode = ENV_ADMIN_CODE;
    const authenticatedUser = findUserByToken(getAuthToken(req));
    const userId = String(
        authenticatedUser?.username ||
        req.headers["x-comtime-user-id"] ||
        req.body?.userId ||
        req.query?.userId ||
        ""
    ).trim();
    return userId === normalizeUsername(adminCode);
}

app.get("/api/notices", (req, res) => {
    const notices = getSortedNotices();
    res.json({ ok: true, notices });
});

app.get("/api/admin/check", (req, res) => {
    res.json({ ok: true, isAdmin: isAdmin(req) });
});
app.post("/api/developer/verify",(req,res)=>{const configured=ENV_DEV_CODE;const supplied=String(req.body?.code||"").trim();if(!configured||!supplied||supplied!==configured)return res.status(403).json({ok:false,message:"개발자 코드가 올바르지 않습니다."});res.json({ok:true});});

app.post("/api/notices", (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ ok: false, message: "관리자 권한이 없습니다." });
    const title = String(req.body?.title || "").trim();
    const content = String(req.body?.content || "").trim();
    if (!title || !content) return res.status(400).json({ ok: false, message: "제목과 내용을 입력해주세요." });
    const notices = readNotices();
    const notice = { id: Date.now(), title, content, createdAt: new Date().toISOString(), updatedAt: null };
    notices.push(notice);
    writeNotices(notices);
    broadcastNotices();
    res.json({ ok: true, notice });
});

app.put("/api/notices/:id", (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ ok: false, message: "관리자 권한이 없습니다." });
    const id = Number(req.params.id);
    const title = String(req.body?.title || "").trim();
    const content = String(req.body?.content || "").trim();
    if (!title || !content) return res.status(400).json({ ok: false, message: "제목과 내용을 입력해주세요." });
    const notices = readNotices();
    const index = notices.findIndex(n => Number(n.id) === id);
    if (index < 0) return res.status(404).json({ ok: false, message: "공지를 찾을 수 없습니다." });
    notices[index] = { ...notices[index], title, content, updatedAt: new Date().toISOString() };
    writeNotices(notices);
    broadcastNotices();
    res.json({ ok: true, notice: notices[index] });
});

app.delete("/api/notices/:id", (req, res) => {
    if (!isAdmin(req)) return res.status(403).json({ ok: false, message: "관리자 권한이 없습니다." });
    const id = Number(req.params.id);
    const notices = readNotices();
    const filtered = notices.filter(n => Number(n.id) !== id);
    if (filtered.length === notices.length) return res.status(404).json({ ok: false, message: "공지를 찾을 수 없습니다." });
    writeNotices(filtered);
    broadcastNotices();
    res.json({ ok: true });
});

let Comcigan = null;

async function loadComcigan() {
    if (Comcigan) return Comcigan;

    const module = await import("parse-comcigan");

    console.log("[컴시간 모듈 로드]");
    console.log("module keys:", Object.keys(module));

    Comcigan = module.default || module.Comcigan || module;

    console.log("Comcigan type:", typeof Comcigan);
    console.log("Comcigan keys:", Object.getOwnPropertyNames(Comcigan));

    if (!Comcigan || typeof Comcigan.search !== "function") {
        throw new Error("parse-comcigan의 Comcigan.search()를 찾을 수 없습니다.");
    }

    return Comcigan;
}

app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        message: "COMTIME PRO SERVER OK",
        time: new Date().toISOString()
    });
});

app.get("/api/search-school", async (req, res) => {
    const q = String(req.query.q || "").trim();

    console.log(`[학교검색] "${q}" 검색 시작`);

    if (!q) {
        return res.json({ ok: true, schools: [] });
    }

    try {
        const Comcigan = await loadComcigan();
        const result = await Comcigan.search(q);

        console.log(`[학교검색] 검색 결과 ${result.length}개`);

        const schools = result.map((school) => ({
            code: Number(school.code),
            name: school.name,
            region: school.region
        }));

        return res.json({ ok: true, schools });
    } catch (error) {
        console.error("[학교검색 오류]");
        console.error(error);

        return res.status(500).json({
            ok: false,
            message: error.message,
            schools: []
        });
    }
});

app.get("/api/timetable", async (req, res) => {
    const schoolCode = Number(req.query.schoolCode);
    const grade = Number(req.query.grade);
    const classNum = Number(req.query.classNum);

    console.log(`[시간표] school=${schoolCode}, grade=${grade}, class=${classNum}`);

    if (!schoolCode || !grade || !classNum) {
        return res.status(400).json({
            ok: false,
            message: "schoolCode, grade, classNum이 필요합니다."
        });
    }

    try {
        const Comcigan = await loadComcigan();
        const comci = new Comcigan(schoolCode);

        const timetable = await comci.timetable({
            grade,
            classNum
        });

        console.log("[시간표] 불러오기 성공");

        return res.json({ ok: true, timetable });
    } catch (error) {
        console.error("[시간표 오류]");
        console.error(error);

        return res.status(500).json({
            ok: false,
            message: error.message
        });
    }
});

app.get("/api/neis-school", async (req, res) => {
    const name = String(req.query.name || "").trim();

    if (!name) {
        return res.status(400).json({
            ok: false,
            message: "학교 이름이 필요합니다."
        });
    }

    const apiKey = envValue("NEIS_API_KEY");

    if (!apiKey) {
        return res.status(500).json({
            ok: false,
            message: "NEIS_API_KEY가 .env에 없습니다."
        });
    }

    try {
        const url =
            "https://open.neis.go.kr/hub/schoolInfo" +
            `?KEY=${encodeURIComponent(apiKey)}` +
            "&Type=json" +
            "&pIndex=1" +
            "&pSize=100" +
            `&SCHUL_NM=${encodeURIComponent(name)}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`NEIS HTTP ${response.status}`);
        }

        const data = await response.json();
        const rows = data?.schoolInfo?.[1]?.row || [];

        const schools = rows.map((school) => ({
            schoolName: school.SCHUL_NM,
            officeCode: school.ATPT_OFCDC_SC_CODE,
            schoolCode: school.SD_SCHUL_CODE,
            schoolType: school.SCHUL_KND_SC_NM,
            address: school.ORG_RDNMA
        }));

        return res.json({ ok: true, schools });
    } catch (error) {
        console.error("[NEIS 학교검색 오류]");
        console.error(error);

        return res.status(500).json({
            ok: false,
            message: error.message
        });
    }
});

app.get("/api/meal", async (req, res) => {
    const officeCode = String(req.query.officeCode || "").trim();
    const schoolCode = String(req.query.schoolCode || "").trim();
    const date = String(req.query.date || "").trim();
    const apiKey = envValue("NEIS_API_KEY");

    if (!apiKey) {
        return res.status(500).json({
            ok: false,
            message: "NEIS_API_KEY가 .env에 없습니다."
        });
    }

    if (!officeCode || !schoolCode) {
        return res.status(400).json({
            ok: false,
            message: "officeCode와 schoolCode가 필요합니다."
        });
    }

    try {
        const targetDate =
            date ||
            new Date().toISOString().slice(0, 10).replaceAll("-", "");

        const url =
            "https://open.neis.go.kr/hub/mealServiceDietInfo" +
            `?KEY=${encodeURIComponent(apiKey)}` +
            "&Type=json" +
            "&pIndex=1" +
            "&pSize=100" +
            `&ATPT_OFCDC_SC_CODE=${encodeURIComponent(officeCode)}` +
            `&SD_SCHUL_CODE=${encodeURIComponent(schoolCode)}` +
            `&MLSV_YMD=${encodeURIComponent(targetDate)}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`NEIS HTTP ${response.status}`);
        }

        const data = await response.json();
        const rows = data?.mealServiceDietInfo?.[1]?.row || [];

        const meals = rows.map((meal) => ({
            date: meal.MLSV_YMD,
            mealType: meal.MMEAL_SC_NM,
            menu: meal.DDISH_NM,
            calories: meal.CAL_INFO,
            origin: meal.ORPLC_INFO,
            nutrition: meal.NTR_INFO
        }));

        return res.json({ ok: true, meals });
    } catch (error) {
        console.error("[급식 오류]");
        console.error(error);

        return res.status(500).json({
            ok: false,
            message: error.message
        });
    }
});

// ==================================================
// GEMINI AI - STREAMING
// ==================================================

app.post("/api/gemini", requireAuth, async (req, res) => {
    const message = String(req.body?.message || "").trim();
    console.log(`[Gemini 사용자 메시지] ${message}`);
    const previousInteractionId = String(
        req.body?.previousInteractionId || ""
    ).trim();
    const conversationId = String(req.body?.conversationId || "").trim();
    const context = req.body?.context || {};

    req.comtimeUser.geminiConversations = Array.isArray(req.comtimeUser.geminiConversations) ? req.comtimeUser.geminiConversations : [];
    let conversation = req.comtimeUser.geminiConversations.find((item) => item.id === conversationId);
    if (!conversation) {
        conversation = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), previousInteractionId: null, messages: [] };
        req.comtimeUser.geminiConversations.push(conversation);
    }
    conversation.messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    conversation.messages.push({ role: "user", text: message, createdAt: new Date().toISOString() });
    conversation.updatedAt = new Date().toISOString();
    appendActivityLog("gemini_user_message", { user: req.comtimeUser.username, conversationId: conversation.id, length: message.length });
    saveUser(req.comtimeUser);
    const apiKey = envValue("GEMINI_API_KEY");

    if (!message) {
        return res.status(400).json({
            ok: false,
            message: "질문을 입력해주세요."
        });
    }

    if (!apiKey) {
        return res.status(500).json({
            ok: false,
            message: "GEMINI_API_KEY가 .env에 없습니다."
        });
    }

    const schoolContext = [
        context.schoolName ? `학교: ${String(context.schoolName)}` : "",
        context.grade ? `학년: ${String(context.grade)}학년` : "",
        context.classNum ? `반: ${String(context.classNum)}반` : ""
    ].filter(Boolean).join(" / ");

    const input = schoolContext
        ? `현재 COMTIME PRO 사용자의 학교 정보는 ${schoolContext}입니다.\n\n사용자 질문:\n${message}`
        : message;

    const body = {
        model: "gemini-3.5-flash-lite",
        input,
        stream: true,
        system_instruction:
            "너는 COMTIME PRO의 빠른 AI 도우미다. " +
            "한국어로 정확하고 간결하게 답한다. " +
            "불필요한 서론과 반복을 줄이고 질문에 바로 답한다. " +
            "모르는 내용은 추측하지 않는다."
    };

    if (previousInteractionId) {
        body.previous_interaction_id = previousInteractionId;
    }

    let upstreamResponse;

    try {
        upstreamResponse = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/interactions?alt=sse",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "text/event-stream",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify(body)
            }
        );
    } catch (error) {
        console.error("[Gemini 연결 오류]");
        console.error(error);

        return res.status(502).json({
            ok: false,
            message: "Gemini 서버에 연결하지 못했습니다."
        });
    }

    if (!upstreamResponse.ok) {
        let errorMessage = `Gemini HTTP ${upstreamResponse.status}`;

        try {
            const errorData = await upstreamResponse.json();
            errorMessage =
                errorData?.error?.message ||
                errorData?.message ||
                errorMessage;
        } catch (_) {
            // JSON이 아닌 오류 응답이면 기본 메시지를 사용합니다.
        }

        console.error("[Gemini API 오류]", errorMessage);

        return res.status(upstreamResponse.status).json({
            ok: false,
            message: errorMessage
        });
    }

    if (!upstreamResponse.body) {
        return res.status(502).json({
            ok: false,
            message: "Gemini 스트리밍 응답을 받을 수 없습니다."
        });
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();
    res.write(`event: conversation\n`);
    res.write(`data: ${JSON.stringify({ conversationId: conversation.id })}\n\n`);

    let assistantText = "";

    const sendEvent = (event, data) => {
        if (res.writableEnded) return;

        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const reader = upstreamResponse.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let interactionId = null;
    let clientClosed = false;

    req.on("close", () => {
        clientClosed = true;
        try {
            reader.cancel();
        } catch (_) {
            // 이미 종료된 스트림이면 무시합니다.
        }
    });

    const processUpstreamEvent = (rawEvent) => {
        const lines = rawEvent.split("\n");
        let eventType = "message";
        const dataLines = [];

        for (const line of lines) {
            if (line.startsWith("event:")) {
                eventType = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
                dataLines.push(line.slice(5).trimStart());
            }
        }

        if (!dataLines.length) return;

        const rawData = dataLines.join("\n");

        if (rawData === "[DONE]") {
            conversation.previousInteractionId = interactionId || conversation.previousInteractionId || null;
            if (assistantText.trim()) {
                conversation.messages.push({ role: "assistant", text: assistantText.slice(0, 20000), createdAt: new Date().toISOString() });
            }
            conversation.messages = conversation.messages.slice(-100);
            conversation.updatedAt = new Date().toISOString();
            saveUser(req.comtimeUser);
            sendEvent("done", { interactionId, conversationId: conversation.id });
            return;
        }

        let data;

        try {
            data = JSON.parse(rawData);
        } catch (error) {
            console.warn("[Gemini SSE JSON 파싱 실패]", rawData);
            return;
        }

        if (eventType === "interaction.created") {
            interactionId = data?.interaction?.id || interactionId;

            sendEvent("interaction", {
                interactionId
            });

            return;
        }

        if (eventType === "step.delta") {
            if (data?.delta?.type === "text" && data.delta.text) {
                assistantText += String(data.delta.text);
                sendEvent("token", {
                    text: data.delta.text
                });
            }

            return;
        }

        if (eventType === "interaction.completed") {
            interactionId =
                data?.interaction?.id ||
                interactionId;

            conversation.previousInteractionId = interactionId || conversation.previousInteractionId || null;
            if (assistantText.trim()) {
                conversation.messages.push({ role: "assistant", text: assistantText.slice(0, 20000), createdAt: new Date().toISOString() });
            }
            conversation.messages = conversation.messages.slice(-100);
            conversation.updatedAt = new Date().toISOString();
            saveUser(req.comtimeUser);
            appendActivityLog("gemini_completed", { user: req.comtimeUser.username, conversationId: conversation.id, interactionId, assistantLength: assistantText.length });

            sendEvent("done", {
                interactionId,
                conversationId: conversation.id
            });

            return;
        }

        if (eventType === "error") {
            sendEvent("error", {
                message:
                    data?.error?.message ||
                    "Gemini 스트리밍 오류가 발생했습니다."
            });
        }
    };

    try {
        while (!clientClosed) {
            const { value, done } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const events = buffer.split("\n\n");
            buffer = events.pop() || "";

            for (const event of events) {
                if (!event.trim()) continue;
                processUpstreamEvent(event);
            }
        }

        buffer += decoder.decode();

        if (buffer.trim() && !clientClosed) {
            processUpstreamEvent(buffer);
        }

    } catch (error) {
        if (!clientClosed) {
            console.error("[Gemini 스트리밍 오류]");
            console.error(error);

            sendEvent("error", {
                message: error.message || "Gemini 스트리밍 중 오류가 발생했습니다."
            });
        }
    } finally {
        if (!res.writableEnded) {
            res.end();
        }
    }
});




// ==================================================
// YOUTUBE SHORTS FEED + PERSONALIZED ALGORITHM
// ==================================================
function containsKorean(text = "") {
    return /[가-힣]/.test(String(text));
}

function normalizeShortVideo(item) {
    return {
        id: item?.id?.videoId || item?.id || "",
        title: item?.snippet?.title || item?.title || "YouTube Short",
        channelTitle: item?.snippet?.channelTitle || item?.channelTitle || "",
        publishedAt: item?.snippet?.publishedAt || item?.publishedAt || ""
    };
}

function shortLanguageScore(video) {
    const title = String(video.title || "");
    const channel = String(video.channelTitle || "");
    let score = 0;

    if (containsKorean(title)) score += 5;
    if (containsKorean(channel)) score += 4;
    if (/[가-힣]{2,}/.test(title)) score += 2;
    if (/[가-힣]{2,}/.test(channel)) score += 2;

    // 한국에서 자주 쓰이는 메타데이터 표현을 추가 가점합니다.
    if (/(한국|대한민국|국내|한국어|먹방|브이로그|일상|게임|개그|예능|뉴스|공부|요리|축구|야구)/i.test(`${title} ${channel}`)) {
        score += 3;
    }

    // 외국어 제목만 있는 영상은 한국어 우선 피드에서 후순위로 보냅니다.
    if (!containsKorean(title) && !containsKorean(channel)) score -= 4;

    return score;
}

async function askGeminiForShortsProfile(history) {
    const apiKey = envValue("GEMINI_API_KEY");
    if (!apiKey || !Array.isArray(history) || history.length === 0) {
        return {
            query: "한국어 쇼츠 재미있는 영상",
            keywords: ["한국어", "쇼츠"],
            koreanPriority: 0.9,
            summary: "아직 충분한 시청 기록이 없습니다."
        };
    }

    const compactHistory = history
        .slice(-40)
        .map((item) => ({
            title: String(item?.title || "").slice(0, 160),
            channelTitle: String(item?.channelTitle || "").slice(0, 80),
            watchSeconds: Math.max(0, Math.min(180, Number(item?.watchSeconds) || 0)),
            action: String(item?.action || "view").slice(0, 20)
        }));

    const prompt = `너는 COMTIME PRO YouTube Shorts 추천 알고리즘 분석 AI다.
사용자의 최근 시청 기록을 분석해서 다음 쇼츠를 찾기 위한 검색 전략을 만들어라.

중요 규칙:
1. 사용자가 오래 본 영상일수록 관심도가 높다고 판단한다.
2. 짧게 보고 넘긴 영상은 관심도가 낮다고 판단한다.
3. 한국어 콘텐츠를 강하게 우선한다. 가능하면 한국어 제목/한국 채널뿐 아니라 실제 한국어 음성이 나올 가능성이 높은 주제와 검색어를 선택한다.
4. 검색어는 YouTube 검색에 바로 넣을 수 있는 자연스러운 한국어 문장으로 만든다.
5. 외국 영상만 반복 추천하지 않도록 한다.
6. 사용자의 취향은 기록에서만 추론하고, 기록에 없는 취향을 임의로 확정하지 않는다.
7. 결과는 반드시 JSON 하나만 출력한다.

JSON 형식:
{
  "query": "YouTube 검색어",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "koreanPriority": 0.0,
  "summary": "현재 사용자가 좋아하는 콘텐츠를 한 문장으로 요약"
}

koreanPriority는 0~1 사이 숫자이며, 한국어 영상 우선 정도다.

사용자 시청 기록:
${JSON.stringify(compactHistory, null, 2)}

추가 판단 규칙:
8. action이 "skip"이고 watchSeconds가 매우 짧은 기록이 연속해서 나타나면 현재 추천 주제가 사용자의 관심사와 맞지 않을 가능성이 높다고 판단한다.
9. 최근 연속으로 넘긴 영상의 제목과 채널을 분석해서 그 영상들과 비슷한 주제는 다음 추천 검색어에서 피한다.
10. 사용자가 갑자기 다른 주제를 오래 본 기록이 생기면 이전 취향보다 최신의 오래 본 시청 기록을 더 강하게 반영한다.
11. 단순히 "쇼츠"라는 단어만 반복해서 검색하지 말고, 실제 관심 주제를 구체적인 한국어 검색어로 만든다.
12. 결과적으로 사용자가 영상을 빠르게 여러 개 넘기면 "관심사가 바뀌었거나 현재 추천이 틀렸다"고 보고 추천 방향을 적극적으로 바꾼다.`;

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify({
                    model: "gemini-3.7-flash",
                    input: prompt
                })
            }
        );

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.error?.message || `Gemini HTTP ${response.status}`);
        }

        let text = data.output_text || "";
        if (!text && Array.isArray(data.steps)) {
            for (const step of data.steps) {
                if (step.type === "model_output" && Array.isArray(step.content)) {
                    const texts = step.content
                        .filter((block) => block.type === "text")
                        .map((block) => block.text);
                    if (texts.length) {
                        text = texts.join("\n");
                        break;
                    }
                }
            }
        }

        const jsonText = String(text)
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        const profile = JSON.parse(jsonText);
        return {
            query: String(profile.query || "한국어 쇼츠 재미있는 영상").trim().slice(0, 200),
            keywords: Array.isArray(profile.keywords)
                ? profile.keywords.map((x) => String(x).trim()).filter(Boolean).slice(0, 8)
                : [],
            koreanPriority: Math.max(0, Math.min(1, Number(profile.koreanPriority) || 0.9)),
            summary: String(profile.summary || "").slice(0, 500)
        };
    } catch (error) {
        console.error("[Shorts Gemini 분석 오류]", error);
        return {
            query: "한국어 쇼츠 재미있는 영상",
            keywords: ["한국어", "쇼츠"],
            koreanPriority: 0.9
        };
    }
}

app.post("/api/shorts/history", requireAuth, (req,res)=>res.json({ok:true,saved:false}));

app.post("/api/shorts/recommendation-profile", async (req, res) => {
    const supplied = Array.isArray(req.body?.history) ? req.body.history : [];
    const history = supplied.filter(item => item && item.id).slice(-100);
    const profile = await askGeminiForShortsProfile(history);
    const shortsUser= req.comtimeUser?.username || "guest";
    console.log(`[Shorts 알고리즘] user=${shortsUser} · 저장하지 않음`);
    appendActivityLog("algorithm_analysis", { user: shortsUser, query: profile.query, keywords: profile.keywords, koreanPriority: profile.koreanPriority, summary: profile.summary || "", historyCount: history.length, persisted:false });
    return res.json({ ok:true, profile });
});

app.get("/api/shorts", async (req, res) => {
    const apiKey = envValue("YOUTUBE_API_KEY");
    if (!apiKey) {
        return res.status(500).json({
            ok: false,
            message: "YOUTUBE_API_KEY가 .env에 없습니다."
        });
    }

    const pageToken = String(req.query.pageToken || "").trim();
    const suppliedQuery = String(req.query.q || "").trim();
    const query = suppliedQuery || "한국어 쇼츠 재미있는 영상";

    const params = new URLSearchParams({
        part: "snippet",
        type: "video",
        videoDuration: "short",
        maxResults: "12",
        order: "date",
        regionCode: "KR",
        relevanceLanguage: "ko",
        safeSearch: "moderate",
        q: query,
        key: apiKey
    });
    if (pageToken) params.set("pageToken", pageToken);
    if (String(req.query.fresh || "") === "1") {
        params.set("publishedAfter", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    }

    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data?.error?.message || `YouTube HTTP ${response.status}`);
        }

        const videos = (data.items || [])
            .map(normalizeShortVideo)
            .filter((video) => video.id)
            .map((video, index) => ({
                ...video,
                koreanScore: shortLanguageScore(video),
                originalIndex: index
            }))
            .sort((a, b) => {
                const scoreDiff = b.koreanScore - a.koreanScore;
                if (scoreDiff !== 0) return scoreDiff;
                return a.originalIndex - b.originalIndex;
            })
            .map(({ koreanScore, originalIndex, ...video }) => video);

        return res.json({
            ok: true,
            videos,
            nextPageToken: data.nextPageToken || null,
            searchQuery: query
        });
    } catch (error) {
        console.error("[YouTube Shorts 오류]", error);
        return res.status(502).json({ ok: false, message: error.message });
    }
});

// ==================================================
// BIRD BUMP SCORE LOG
// ==================================================
app.post("/api/bird-score", (req, res) => {
    const score = Number(req.body?.score);
    const difficulty = String(req.body?.difficulty || "알 수 없음").trim();

    if (!Number.isFinite(score) || score < 0) {
        return res.status(400).json({
            ok: false,
            message: "올바르지 않은 점수입니다."
        });
    }

    console.log(
        `[Bird Bump 점수] SCORE=${Math.floor(score)} / DIFFICULTY=${difficulty}`
    );

    return res.json({ ok: true });
});


// ==================================================
// REALTIME 2-PLAYER CAR GAME
// ==================================================
const carRooms = new Map();
const CAR_TICK_MS = 50; // 20 server updates/sec
const CAR_WIDTH = 8.5;
const CAR_PLAYER_Y = 84;
const CAR_GHOST_Y = 64;
const CAR_SPEED = 2.4;
const CAR_MAX_OBSTACLES = 12;

function createCarRoomCode() {
    let code = "";
    do {
        code = String(Math.floor(1000 + Math.random() * 9000));
    } while (carRooms.has(code));
    return code;
}

function makeCarPlayer(id, slot) {
    return {
        id,
        slot,
        x: slot === 0 ? 32 : 68,
        y: slot === 0 ? CAR_PLAYER_Y : CAR_GHOST_Y,
        hp: 3,
        direction: "none",
        invincibleUntil: 0,
        alive: true
    };
}

function makeCarRoom(code, hostId) {
    return {
        code,
        status: "waiting",
        players: [makeCarPlayer(hostId, 0)],
        obstacles: [],
        nextObstacleId: 1,
        lastSpawnAt: Date.now(),
        spawnDelay: 850,
        countdownEndsAt: 0,
        winnerId: null,
        lastTickAt: Date.now()
    };
}

function publicCarState(room) {
    return {
        roomCode: room.code,
        status: room.status,
        countdown: room.status === "countdown"
            ? Math.max(0, Math.ceil((room.countdownEndsAt - Date.now()) / 1000))
            : 0,
        winnerId: room.winnerId,
        players: room.players.map(p => ({
            id: p.id,
            slot: p.slot,
            x: Number(p.x.toFixed(2)),
            y: p.y,
            hp: p.hp,
            invincibleUntil: p.invincibleUntil,
            alive: p.alive
        })),
        obstacles: room.obstacles.map(o => ({
            id: o.id,
            x: Number(o.x.toFixed(2)),
            y: Number(o.y.toFixed(2))
        }))
    };
}

function emitCarState(room) {
    io.to(room.code).emit("car:state", publicCarState(room));
}

function carOverlap(player, obstacle) {
    if (!player.alive) return false;
    const px = player.x;
    const py = player.y;
    const dx = Math.abs(px - obstacle.x);
    const dy = Math.abs(py - obstacle.y);
    return dx < CAR_WIDTH && dy < 8.8;
}

function startCarRound(room) {
    room.status = "countdown";
    room.countdownEndsAt = Date.now() + 3000;
    room.obstacles = [];
    room.nextObstacleId = 1;
    room.lastSpawnAt = Date.now();
    room.spawnDelay = 850;
    room.winnerId = null;
    room.players.forEach((p, index) => {
        p.slot = index;
        p.x = index === 0 ? 32 : 68;
        p.y = index === 0 ? CAR_PLAYER_Y : CAR_GHOST_Y;
        p.hp = 3;
        p.direction = "none";
        p.invincibleUntil = 0;
        p.alive = true;
    });
    emitCarState(room);
}

function leaveCarRoom(socket, notifyOpponent = true) {
    const code = socket.data.carRoomCode;
    if (!code) return;
    const room = carRooms.get(code);
    socket.leave(code);
    socket.data.carRoomCode = null;
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);
    if (notifyOpponent) {
        io.to(code).emit("car:opponent-left");
    }
    if (room.players.length === 0) {
        carRooms.delete(code);
    } else {
        room.status = "waiting";
        room.obstacles = [];
        room.winnerId = null;
        room.players[0].slot = 0;
        room.players[0].x = 50;
        room.players[0].y = CAR_PLAYER_Y;
        room.players[0].hp = 3;
        room.players[0].alive = true;
        io.to(code).emit("car:waiting");
        emitCarState(room);
    }
}

function startCarGameLoop() {
    setInterval(() => {
        const now = Date.now();

        for (const room of carRooms.values()) {
            if (room.players.length !== 2) continue;

            if (room.status === "countdown") {
                if (now >= room.countdownEndsAt) {
                    room.status = "playing";
                }
                emitCarState(room);
                continue;
            }

            if (room.status !== "playing") continue;

            const dt = Math.min(0.1, Math.max(0.01, (now - room.lastTickAt) / 1000));
            room.lastTickAt = now;

            for (const player of room.players) {
                if (!player.alive) continue;
                if (player.direction === "left") player.x -= CAR_SPEED * (dt * 20);
                if (player.direction === "right") player.x += CAR_SPEED * (dt * 20);
                player.x = Math.max(14, Math.min(86, player.x));
            }

            if (now - room.lastSpawnAt >= room.spawnDelay && room.obstacles.length < CAR_MAX_OBSTACLES) {
                room.lastSpawnAt = now;
                const laneCenters = [20, 35, 50, 65, 80];
                let x = laneCenters[Math.floor(Math.random() * laneCenters.length)];
                if (room.obstacles.length > 0 && Math.random() < 0.45) {
                    const last = room.obstacles[room.obstacles.length - 1];
                    if (Math.abs(last.x - x) < 10) x = laneCenters[(laneCenters.indexOf(x) + 2) % laneCenters.length];
                }
                room.obstacles.push({
                    id: room.nextObstacleId++,
                    x,
                    y: -8,
                    speed: 22 + Math.random() * 10
                });
                room.spawnDelay = Math.max(470, 850 - Math.floor((Date.now() - room.countdownEndsAt) / 10000) * 25);
            }

            for (const obstacle of room.obstacles) {
                obstacle.y += obstacle.speed * dt;
            }

            // 도로 화면을 완전히 벗어난 차량은 즉시 서버 상태에서 제거합니다.
            // CSS transform 중심점 때문에 100%보다 조금 전에 제거해야 화면 아래에 남지 않습니다.
            room.obstacles = room.obstacles.filter(o => Number.isFinite(o.y) && o.y < 103);

            for (const player of room.players) {
                if (!player.alive) continue;
                if (player.invincibleUntil > now) continue;

                for (const obstacle of room.obstacles) {
                    if (!carOverlap(player, obstacle)) continue;
                    player.hp -= 1;
                    player.invincibleUntil = now + 2000;
                    io.to(room.code).emit("car:hit", { playerId: player.id, hp: player.hp });
                    if (player.hp <= 0) {
                        player.hp = 0;
                        player.alive = false;
                    }
                    break;
                }
            }

            room.obstacles = room.obstacles.filter(o => Number.isFinite(o.y) && o.y < 103);

            const alive = room.players.filter(p => p.alive);
            if (alive.length <= 1) {
                room.status = "gameover";
                room.winnerId = alive.length === 1 ? alive[0].id : null;
            }

            emitCarState(room);
        }
    }, CAR_TICK_MS);
}

startCarGameLoop();

// =========================================================
// WORD CHAIN — REALTIME 2P / 4P
// =========================================================
const wordChainRooms = new Map();
const WORD_CHAIN_TURN_MS = 20_000;
const WORD_CHAIN_MAX_MISTAKES = 6;
const WORD_CHAIN_ROOM_TTL_MS = 30 * 60 * 1000;
const WORD_CHAIN_START_WORDS = [
    "사과","학교","자동차","기차","친구","바나나","컴퓨터","우유","나무","고기",
    "토마토","포도","오리","하마","소나무","구두","모자","가방","시계","라디오",
    "피아노","도로","바다","나라","노래","사자","고래","코끼리","거미","나비",
    "두부","김치","치마","의자","소파","전화","비누","커피","오이","배추",
    "딸기","복숭아","고구마","감자","주스","아기","강아지","고양이","토끼","여우",
    "호랑이","코알라","가위","축구","야구","농구","공부","영화","여행","마을",
    "바지","지도","사진","수박","계란","동생","가수","배우","의사","약국","도서관"
];
const WORD_CHAIN_DICT_TTL_MS = 30 * 60 * 1000;
const WORD_CHAIN_CONTINUATION_TTL_MS = 30 * 60 * 1000;
const wordChainDictionaryCache = new Map();
const wordChainContinuationCache = new Map();

// 서버가 외부 사전 없이도 정상 기동하도록 반드시 먼저 정의합니다.
// 실제 대형 사전은 아래 로더가 data/wordchain-words.txt 또는 공개 목록에서 추가합니다.
const WORD_CHAIN_FALLBACK = new Set([
    ...WORD_CHAIN_START_WORDS,
    "과자","차표","표범","범고래","래미안","안경","경찰","찰떡","떡볶이","이불",
    "불꽃","꽃병","병원","원숭이","이름","음식","식당","당근","근육","육상","상어",
    "어항","항구","구름","학교","교실","실내","내일","일기","차량","양말","말미잘",
    "잘생김","김치","치약","약속","속담","담요","요리","리본","본능","능력","역사",
    "사랑","랑종","종이","이야기","기린","린스","스키","키위","위성","성공","공원",
    "이상","상자","자전거","거미","미술","술잔","잔치","치마","마늘","늘보","보리",
    "리더","더위","위험","험담","담배","배추","추억","억울","울음","음료","료리",
    "음악","악기","기분","분필","필통","통나무","무지개","개나리","리모컨","컨트롤",
    "롤러","러시아","아이스크림","림프","프로그램","램프","프린터","터미널","널뛰기",
    "기상","상식","식물","물고기","기차역","역무원","원칙","칙령","영화","화분",
    "분수","수박","박수","수영","영어","어깨","깨소금","금요일","일요일","일기장",
    "장난감","감자","자두","두부","부엌","억새","새우","우산","산책","책상","상추",
    "추리","리더십","십자가","가방","방학","학생","생일","일본","본사","사전","전기",
    "기술","술집","집게","게살","살구","구두","두꺼비","비행기","린넨","넥타이","이발",
    "발목","목걸이","이마","마스크","크레파스","스피커","커피","피아노","노트","트럭",
    "럭비","비누","누나","나비","비상","어묵","묵직","직업","업무","무게","게임","임무",
    "개미","미역","역전","전구","구슬","슬픔"
].filter(w => /^[가-힣]{2,30}$/.test(w)));

function wordChainNormalizeWord(raw){
    return String(raw||"").normalize("NFC").trim().toLowerCase().replace(/[^가-힣]/g,"");
}
function wordChainHangulParts(ch){
    const code=ch.charCodeAt(0)-0xAC00;
    if(code<0||code>11171)return null;
    return {initial:Math.floor(code/588),medial:Math.floor((code%588)/28),final:code%28};
}
function wordChainCompose(initial,medial,final){ return String.fromCharCode(0xAC00+initial*588+medial*28+final); }
function wordChainNextStarts(word){
    const last=word.slice(-1);
    const out=new Set([last]);
    const p=wordChainHangulParts(last);
    if(!p)return [...out];
    const medial=p.medial;
    const isYLike=[2,3,6,7,12,17,20].includes(medial);
    if(p.initial===5){
        if(isYLike) out.add(wordChainCompose(11,medial,p.final));
        else out.add(wordChainCompose(2,medial,p.final));
    }else if(p.initial===2 && isYLike){
        out.add(wordChainCompose(11,medial,p.final));
    }
    return [...out];
}
function wordChainUniqueName(raw,room,socketId){
    const base=String(raw||"Player").replace(/[^\p{L}\p{N}_ -]/gu,"").trim().slice(0,14)||"Player";
    const used=new Set((room?.players||[]).filter(p=>p.id!==socketId).map(p=>p.nickname));
    if(!used.has(base))return base;
    for(let n=2;n<100;n++){
        const suffix=` (${n})`;
        const candidate=base.slice(0,Math.max(1,14-suffix.length))+suffix;
        if(!used.has(candidate))return candidate;
    }
    return `Player${Math.floor(Math.random()*9000+1000)}`.slice(0,14);
}
function wordChainRoomName(raw){
    const clean=String(raw||"새 끝말잇기 방").replace(/[<>]/g,"").trim().slice(0,24);
    return clean||"새 끝말잇기 방";
}
function wordChainRoomCode(){
    let code="";
    do{ code=String(Math.floor(100000+Math.random()*900000)); }while(wordChainRooms.has(code));
    return code;
}
function wordChainPickStarter(room){
    const available=WORD_CHAIN_START_WORDS.filter(w=>{
        const n=wordChainNormalizeWord(w);
        return n.length>=2 && !room?.usedWords?.has(n) && !/[각간값곶꽃낫낮닭밟삶앉없있옷잎젖집]$/.test(n);
    });
    const pool=available.length?available:WORD_CHAIN_START_WORDS;
    return pool[Math.floor(Math.random()*pool.length)];
}
function wordChainPublicRoom(room){
    const mode=Number(room?.mode)===4?4:2;
    const players=Array.isArray(room?.players)?room.players:[];
    return {
        code:String(room?.code||""),
        name:wordChainRoomName(room?.name),
        mode,
        capacity:mode,
        count:players.length,
        hostId:String(room?.hostId||""),
        hostNickname:players.find(p=>p.id===room?.hostId)?.nickname||"방장",
        status:room?.status||"lobby",
        currentWord:room?.currentWord||null,
        requiredStarts:room?.currentWord?wordChainNextStarts(room.currentWord):[],
        turnPlayerId:room?.turnPlayerId||null,
        turnDeadline:Number.isFinite(Number(room?.turnDeadline))?Number(room.turnDeadline):0,
        players:players.map(p=>({id:String(p.id),nickname:String(p.nickname||"Player"),hp:Math.max(0,Math.min(2,Number(p.hp)||0)),mistakes:Math.max(0,Math.min(WORD_CHAIN_MAX_MISTAKES,Number(p.mistakes)||0)),alive:p.alive!==false,ready:p.ready!==false,typing:String(p.typing||"").slice(0,30)})),
        lastResult:room?.lastResult||null,
        winnerId:room?.winnerId||null,
        logs:Array.isArray(room?.logs)?room.logs.slice(-40):[]
    };
}
function wordChainPublicLobbyRoom(room){
    const pub=wordChainPublicRoom(room);
    return {code:pub.code,name:pub.name,mode:pub.mode,capacity:pub.capacity,count:pub.count,status:pub.status,hostId:pub.hostId,hostNickname:pub.hostNickname};
}
function wordChainPublicLobbyRooms(){
    return [...wordChainRooms.values()]
        .filter(r=>r.status==="lobby")
        .map(wordChainPublicLobbyRoom)
        .sort((a,b)=>Number(b.count)-Number(a.count)||a.code.localeCompare(b.code));
}
function wordChainBroadcastRooms(){
    io.emit("wordchain:rooms",wordChainPublicLobbyRooms());
}
function wordChainBroadcast(room){ io.to(`wordchain:${room.code}`).emit("wordchain:state",wordChainPublicRoom(room)); wordChainBroadcastRooms(); }
function wordChainAddLog(room,text,type="system"){ room.logs.push({text:String(text),type,at:Date.now()}); if(room.logs.length>80)room.logs.splice(0,room.logs.length-80); }
function wordChainAdvanceTurn(room,resetStarter=false){
    const alive=room.players.filter(p=>p.alive);
    if(alive.length<=1){
        room.status="ended"; room.turnPlayerId=null; room.turnDeadline=0; room.winnerId=alive[0]?.id||null;
        wordChainAddLog(room,alive[0]?`${alive[0].nickname} 승리!`:`게임 종료`,"win");
        wordChainBroadcast(room); return;
    }
    if(resetStarter){
        const starter=wordChainPickStarter(room);
        room.currentWord=starter;
        room.usedWords.add(starter);
        wordChainAddLog(room,`새 라운드 시작 · 제시어 「${starter}」`,"system");
    }
    const currentIndex=room.players.findIndex(p=>p.id===room.turnPlayerId);
    for(let step=1;step<=room.players.length;step++){
        const p=room.players[(currentIndex+step+room.players.length)%room.players.length];
        if(p?.alive){room.turnPlayerId=p.id;p.mistakes=0;p.typing="";room.turnDeadline=Date.now()+WORD_CHAIN_TURN_MS;break;}
    }
    wordChainBroadcast(room);
}
function wordChainApplyPenalty(room,player,reason="6번 틀림"){
    player.hp=Math.max(0,Number(player.hp)||0); player.hp=Math.max(0,player.hp-1); player.mistakes=0; player.typing="";
    if(player.hp<=0){player.alive=false;wordChainAddLog(room,`${player.nickname} 탈락! (${reason})`,"lose");}
    else wordChainAddLog(room,`${player.nickname} 체력 -1 · 새 제시어로 다음 턴`,"penalty");
    wordChainAdvanceTurn(room,true);
}

// 공개 단어 목록을 서버 시작 시 한 번만 로드합니다. 게임 중에는 네트워크를 사용하지 않습니다.
const WORD_CHAIN_REMOTE_WORDLISTS=[
    "https://raw.githubusercontent.com/acidsound/korean_wordlist/master/wordslistUnique.txt",
    "https://cdn.jsdelivr.net/gh/acidsound/korean_wordlist@master/wordslistUnique.txt"
];
const wordChainDictionary=new Set();
const wordChainStartIndex=new Set();
let wordChainDictionaryReady=false;
let wordChainDictionaryLoading=null;
function wordChainIndexWord(word){
    const normalized=wordChainNormalizeWord(word);
    if(normalized.length<2||normalized.length>30)return;
    wordChainDictionary.add(normalized);
    wordChainStartIndex.add(normalized.slice(0,1));
}
for(const w of WORD_CHAIN_FALLBACK)wordChainIndexWord(w);
async function wordChainLoadLocalDictionary(){
    if(wordChainDictionaryReady)return true;
    if(wordChainDictionaryLoading)return wordChainDictionaryLoading;
    wordChainDictionaryLoading=(async()=>{
        const localFile=path.join(DATA_DIR,"wordchain-words.txt");
        const addText=(text)=>{
            let count=0;
            for(const line of String(text||"").split(/\r?\n/)){
                const word=wordChainNormalizeWord(line);
                if(!/^[가-힣]{2,30}$/.test(word))continue;
                wordChainIndexWord(word);count++;
            }
            return count;
        };
        try{
            if(fs.existsSync(localFile)){
                const count=addText(fs.readFileSync(localFile,"utf8"));
                if(count>1000){wordChainDictionaryReady=true;console.log(`[끝말잇기 사전] 로컬 DB 로드 완료: ${wordChainDictionary.size.toLocaleString()}개`);return true;}
            }
        }catch(error){console.warn(`[끝말잇기 사전] 로컬 DB 읽기 실패: ${error?.message||error}`);}
        for(const url of WORD_CHAIN_REMOTE_WORDLISTS){
            try{
                const response=await fetch(url,{headers:{"user-agent":"COMTIME-PRO-WordChain/8.0"},signal:AbortSignal.timeout(12000)});
                if(!response.ok)throw new Error(`HTTP ${response.status}`);
                const text=await response.text();
                const count=addText(text);
                if(count<1000)throw new Error(`단어 ${count}개만 읽음`);
                try{fs.mkdirSync(DATA_DIR,{recursive:true});fs.writeFileSync(localFile,text,"utf8");}catch(saveError){console.warn(`[끝말잇기 사전] 로컬 캐시 저장 실패: ${saveError?.message||saveError}`);}
                wordChainDictionaryReady=true;console.log(`[끝말잇기 사전] 공개 한국어 DB 로드 완료: ${wordChainDictionary.size.toLocaleString()}개`);return true;
            }catch(error){console.warn(`[끝말잇기 사전] 공개 DB 로드 실패: ${url} · ${error?.message||error}`);}
        }
        wordChainDictionaryReady=true;
        console.warn(`[끝말잇기 사전] 외부 DB를 불러오지 못해 내장 안전 사전 ${wordChainDictionary.size.toLocaleString()}개로 시작합니다.`);
        return false;
    })().finally(()=>{wordChainDictionaryLoading=null;});
    return wordChainDictionaryLoading;
}
wordChainLoadLocalDictionary();
async function wordChainDictionaryCheck(word){
    const normalized=wordChainNormalizeWord(word);
    if(normalized.length<2)return {ok:false,source:"rule",message:"두 글자 이상의 단어를 입력하세요."};
    const cached=wordChainDictionaryCache.get(normalized);
    if(cached&&Date.now()-cached.at<WORD_CHAIN_DICT_TTL_MS)return cached.result;
    await wordChainLoadLocalDictionary();
    const ok=wordChainDictionary.has(normalized);
    const result=ok?{ok:true,source:"local-dictionary",message:"한국어 단어 DB 확인 완료 · 두음법칙 ON"}:{ok:false,source:"local-dictionary",message:"단어사전에 없는 단어입니다."};
    wordChainDictionaryCache.set(normalized,{at:Date.now(),result});
    return result;
}
async function wordChainHasContinuation(word){
    await wordChainLoadLocalDictionary();
    const starts=wordChainNextStarts(word),key=starts.join("|");
    const cached=wordChainContinuationCache.get(key);
    if(cached&&Date.now()-cached.at<WORD_CHAIN_CONTINUATION_TTL_MS)return cached.result;
    const ok=starts.some(start=>wordChainStartIndex.has(start));
    const result=ok?{ok:true,source:"local-dictionary"}:{ok:false,source:"local-dictionary",message:"한방단어는 사용할 수 없습니다."};
    wordChainContinuationCache.set(key,{at:Date.now(),result});
    return result;
}
function wordChainCanStart(word,room){
    if(!room.currentWord)return true;
    return wordChainNextStarts(room.currentWord).includes(word.slice(0,1));
}
function wordChainCleanupRoom(room){
    if(!room)return;
    for(const p of room.players){const s=io.sockets.sockets.get(p.id);if(s){s.leave(`wordchain:${room.code}`);if(s.data.wordChainRoom===room.code)s.data.wordChainRoom=null;}}
    wordChainRooms.delete(room.code);wordChainBroadcastRooms();
}
function wordChainStart(room,hostSocket){
    if(room.status!=="lobby")return;
    if(room.players.length!==room.mode){hostSocket.emit("wordchain:error",{message:`${room.mode}인전은 ${room.mode}명이 모두 입장해야 시작할 수 있습니다.`});return;}
    room.status="playing";room.currentWord=wordChainPickStarter(room);room.usedWords=new Set([room.currentWord]);room.turnPlayerId=room.players[0].id;room.turnDeadline=Date.now()+WORD_CHAIN_TURN_MS;room.lastResult={ok:true,source:"starter",word:room.currentWord};room.winnerId=null;
    room.players.forEach(p=>{p.ready=true;p.mistakes=0;p.hp=2;p.alive=true;p.typing="";});
    wordChainAddLog(room,`게임 시작! 제시어는 「${room.currentWord}」입니다.`);wordChainBroadcast(room);
}

// =========================================================
// WORM ARENA — REALTIME MULTIPLAYER
// =========================================================
const WORM_WORLD = 5200;
const WORM_TICK_MS = 33;
const WORM_STATE_MS = 90;
const WORM_MAX_PLAYERS = 24;
const WORM_BOT_COUNT = 0;
const WORM_FOOD_TARGET = 240;
const WORM_ROOM = "public";
const wormPlayers = new Map();
const wormFood = [];
let wormFoodId = 1;
let wormLastStateAt = 0;
const WORM_COLORS = ["#55f59b","#59b7ff","#ff6e8d","#ffc857","#b98cff","#48e0d1","#ff8b4d","#f26bff","#9be15d","#6dd5ed"];

function wormRand(min,max){ return min + Math.random()*(max-min); }
function wormDist2(ax,ay,bx,by){ const dx=ax-bx,dy=ay-by; return dx*dx+dy*dy; }
function wormSpawnFood(x=wormRand(180,WORM_WORLD-180), y=wormRand(180,WORM_WORLD-180), value=1, color=null){
    wormFood.push({id:wormFoodId++,x,y,r:value>=8?8:value>=3?6:4,value,color:color||["#70ffb0","#ffe56b","#72c7ff","#ff79bd"][Math.floor(Math.random()*4)]});
}
function wormFillFood(){ while(wormFood.length<WORM_FOOD_TARGET) wormSpawnFood(); }
function wormUniqueNickname(rawName, excludeId=null){
    const base=String(rawName||"Player").replace(/[^\p{L}\p{N}_ -]/gu,"").trim().slice(0,14)||"Player";
    const used=new Set([...wormPlayers.values()].filter(p=>p.id!==excludeId && p.alive).map(p=>p.nickname));
    if(!used.has(base))return base;
    for(let n=2;n<=99;n++){
        const suffix=` (${n})`;
        const candidate=base.slice(0,Math.max(1,14-suffix.length))+suffix;
        if(!used.has(candidate))return candidate;
    }
    return `Player ${Math.floor(Math.random()*9000)+1000}`.slice(0,14);
}
function wormMakePlayer(id,nickname, isBot=false){
    const angle=Math.random()*Math.PI*2;
    const x=wormRand(650,WORM_WORLD-650), y=wormRand(650,WORM_WORLD-650);
    const color=WORM_COLORS[Math.floor(Math.random()*WORM_COLORS.length)];
    const trail=[]; for(let i=0;i<80;i++) trail.push({x:x-Math.cos(angle)*i*5,y:y-Math.sin(angle)*i*5});
    const player={id,nickname:wormUniqueNickname(nickname,id),x,y,angle,targetAngle:angle,dirX:Math.cos(angle),dirY:Math.sin(angle),boost:false,mass:isBot?18:12,length:10,radius:12,speed:isBot?178:185,trail,color,alive:true,lastInput:Date.now(),spawnShieldUntil:Date.now()+3000,isBot,segments:[]};
    player.segments=wormPlayerSegments(player);
    return player;
}
function wormEnsureBots(){
    let bots=[...wormPlayers.values()].filter(p=>p.isBot);
    while(bots.length<WORM_BOT_COUNT && wormPlayers.size<WORM_MAX_PLAYERS){
        const id=`bot-${bots.length+1}`;
        if(wormPlayers.has(id)){ bots=[...wormPlayers.values()].filter(p=>p.isBot); continue; }
        const bot=wormMakePlayer(id,`BOT ${bots.length+1}`,true);
        wormPlayers.set(id,bot);
        bots.push(bot);
    }
}
function wormBotThink(p, now){
    if(!p.isBot || !p.alive) return;
    const nearby=wormFood.reduce((best,f)=>{
        const d=wormDist2(p.x,p.y,f.x,f.y);
        return d<(best?.d??Infinity)?{f,d}:best;
    },null);
    if(now-p.lastInput>900 || Math.random()<0.012){
        let tx=p.x+p.dirX*500, ty=p.y+p.dirY*500;
        if(nearby && nearby.d<900*900){ tx=nearby.f.x; ty=nearby.f.y; }
        if(p.x<450) tx+=700; else if(p.x>WORM_WORLD-450) tx-=700;
        if(p.y<450) ty+=700; else if(p.y>WORM_WORLD-450) ty-=700;
        const a=Math.atan2(ty-p.y,tx-p.x);
        p.dirX=Math.cos(a); p.dirY=Math.sin(a); p.targetAngle=a;
        p.boost=p.mass>28 && Math.random()<0.28;
        p.lastInput=now;
    }
}
function wormPlayerSegments(p){
    // Keep the network/render representation compact. The full trail remains server-side,
    // while only a visually sufficient sample is sent to clients.
    const wanted=Math.max(16,Math.min(72,Math.floor(14+p.mass*0.42)));
    const out=[]; const spacing=13; let carry=0; let prev=p.trail?.[0];
    if(!prev) return out;
    out.push({x:prev.x,y:prev.y});
    for(let i=1;i<p.trail.length && out.length<wanted;i++){
        const q=p.trail[i]; const dx=q.x-prev.x,dy=q.y-prev.y;
        const d=Math.sqrt(dx*dx+dy*dy); carry+=d;
        if(carry>=spacing){out.push({x:q.x,y:q.y});carry=0;}
        prev=q;
    }
    return out;
}

function wormTurnToward(p){
    // 커서 방향을 다음 서버 틱에서 즉시 적용한다.
    // 자기 몸과의 충돌 검사는 애초에 하지 않으므로 작은 반경으로도 자유롭게 꺾을 수 있다.
    const desired=Math.atan2(p.dirY,p.dirX);
    p.angle=desired;
    p.dirX=Math.cos(desired);
    p.dirY=Math.sin(desired);
}
function wormDropMass(p){
    // 죽기 직전의 전체 질량을 정확히 보존하되, 오브젝트 수는 최대 64개로 제한합니다.
    const path=p.segments?.length ? p.segments : wormPlayerSegments(p);
    const total=Math.max(0,Math.floor(Number(p.mass)||0));
    if(total<=0)return;
    const drops=Math.min(64,Math.max(1,Math.ceil(total/8)));
    const base=Math.floor(total/drops);
    const remainder=total-base*drops;
    for(let i=0;i<drops;i++){
        const value=base+(i<remainder?1:0);
        const index=Math.floor((i/Math.max(1,drops-1))*Math.max(0,path.length-1));
        const q=path[index]||{x:p.x,y:p.y};
        const prev=path[Math.max(0,index-1)]||q;
        const next=path[Math.min(path.length-1,index+1)]||q;
        const a=Math.atan2(next.y-prev.y,next.x-prev.x)+(Math.random()-.5)*0.45;
        const offset=(Math.random()-.5)*Math.max(8,p.radius*0.8);
        wormSpawnFood(q.x+Math.cos(a+Math.PI/2)*offset,q.y+Math.sin(a+Math.PI/2)*offset,value,p.color);
    }
    // 죽은 지렁이의 경험치가 기존 맵을 압도하지 않도록 서버 보관량만 제한합니다.
    if(wormFood.length>420)wormFood.splice(0,wormFood.length-420);
}

function wormKill(victim,killerName){
    if(!victim || !victim.alive)return;
    victim.alive=false; wormDropMass(victim);
    const sock=io.sockets.sockets.get(victim.id);
    if(sock) sock.emit("worm:died",{mass:victim.mass,killer:killerName||null});
    if(victim.isBot){
        setTimeout(()=>{
            if(!wormPlayers.has(victim.id)) return;
            const bot=wormMakePlayer(victim.id,victim.nickname,true);
            wormPlayers.set(victim.id,bot);
        },1800);
    }
}
let wormCachedState=null;
let wormCachedStateAt=0;
function wormPublicState(){
    const now=Date.now();
    if(wormCachedState && now-wormCachedStateAt<80) return wormCachedState;
    const players=[...wormPlayers.values()].filter(p=>p.alive).map(p=>({
        id:p.id,nickname:p.nickname,x:Math.round(p.x*10)/10,y:Math.round(p.y*10)/10,
        mass:Math.round(p.mass),length:Math.round(p.length),radius:p.radius,
        color:p.color,dirX:Math.round(p.dirX*1000)/1000,dirY:Math.round(p.dirY*1000)/1000,
        isBot:!!p.isBot,segments:p.segments||[]
    }));
    wormCachedState={world:WORM_WORLD,me:null,players,food:wormFood.slice(0,WORM_FOOD_TARGET)};
    wormCachedStateAt=now;
    return wormCachedState;
}
function wormEmitState(){
    const now=Date.now();
    if(now-wormLastStateAt<WORM_STATE_MS)return;
    wormLastStateAt=now;
    const baseState=wormPublicState();
    for(const p of wormPlayers.values()){
        if(!p.alive)continue;
        const sock=io.sockets.sockets.get(p.id);
        if(!sock)continue;
        sock.emit("worm:state",{...baseState,me:p.id});
    }
}

const wordChainTimer=setInterval(()=>{
    const now=Date.now();
    for(const room of wordChainRooms.values()){
        if(now-room.createdAt>WORD_CHAIN_ROOM_TTL_MS){wordChainCleanupRoom(room);continue;}
        if(room.status!=="playing"||!room.turnPlayerId||now<room.turnDeadline)continue;
        const p=room.players.find(x=>x.id===room.turnPlayerId);
        if(!p||!p.alive){wordChainAdvanceTurn(room,true);continue;}
        // 시간 초과는 6회 실수와 별개로 즉시 체력 1을 깎고 다음 생존자에게 턴을 넘깁니다.
        wordChainApplyPenalty(room,p,"20초 시간 초과");
    }
},100);

function wormCellKey(x,y,cell){ return `${Math.floor(x/cell)},${Math.floor(y/cell)}`; }
function wormBuildGrid(cell){
    const grid=new Map();
    for(const p of wormPlayers.values()){
        if(!p.alive)continue;
        const seg=p.segments||[];
        for(let i=4;i<seg.length;i+=2){
            const q=seg[i];
            const key=wormCellKey(q.x,q.y,cell);
            let bucket=grid.get(key);
            if(!bucket){bucket=[];grid.set(key,bucket);}
            bucket.push({p,q});
        }
    }
    return grid;
}
function wormNearbySegments(grid,x,y,cell){
    const cx=Math.floor(x/cell),cy=Math.floor(y/cell);
    const result=[];
    for(let oy=-1;oy<=1;oy++) for(let ox=-1;ox<=1;ox++){
        const bucket=grid.get(`${cx+ox},${cy+oy}`);
        if(bucket) result.push(...bucket);
    }
    return result;
}

function wormTick(){
    const dt=WORM_TICK_MS/1000;
    const now=Date.now();
    wormEnsureBots();
    wormFillFood();
    wormCachedState=null;
    wormCachedStateAt=0;
    for(const p of wormPlayers.values()){
        if(!p.alive)continue;
        wormBotThink(p, now);
        wormTurnToward(p);
        const boost=p.boost && p.mass>5;
        const speed=p.speed*(boost?1.48:1);
        if(boost)p.mass=Math.max(5,p.mass-0.045);
        p.x+=p.dirX*speed*dt; p.y+=p.dirY*speed*dt;
        if(p.x<20||p.x>WORM_WORLD-20||p.y<20||p.y>WORM_WORLD-20){ wormKill(p,"경계"); continue; }
        p.trail.unshift({x:p.x,y:p.y});
        const keep=Math.min(180,Math.max(72,Math.floor(40+p.mass*1.15)));
        if(p.trail.length>keep)p.trail.length=keep;
        p.radius=Math.min(25,10+Math.sqrt(p.mass)*0.7);
        p.length=Math.floor(7+p.mass*0.72);
        p.segments=wormPlayerSegments(p);
        // Food collision is handled with a spatial hash instead of scanning every pellet.
        // The hash is rebuilt once below for all players.

    }
    // Spatial hashing keeps 10+ player games close to O(players + nearby objects) instead
    // of O(players * allFood + players² * allSegments).
    const FOOD_CELL=120;
    const foodGrid=new Map();
    for(let i=0;i<wormFood.length;i++){
        const f=wormFood[i];
        const key=wormCellKey(f.x,f.y,FOOD_CELL);
        let bucket=foodGrid.get(key);
        if(!bucket){bucket=[];foodGrid.set(key,bucket);}
        bucket.push(i);
    }
    const eaten=new Set();
    for(const p of wormPlayers.values()){
        if(!p.alive)continue;
        const cx=Math.floor(p.x/FOOD_CELL),cy=Math.floor(p.y/FOOD_CELL);
        const rr=p.radius+13;
        for(let oy=-1;oy<=1;oy++) for(let ox=-1;ox<=1;ox++){
            const bucket=foodGrid.get(`${cx+ox},${cy+oy}`);
            if(!bucket)continue;
            for(const index of bucket){
                if(eaten.has(index))continue;
                const f=wormFood[index];
                if(!f)continue;
                const reach=rr+f.r;
                if(wormDist2(p.x,p.y,f.x,f.y)<=reach*reach){
                    p.mass+=f.value; eaten.add(index);
                }
            }
        }
    }
    if(eaten.size){
        const next=[];
        for(let i=0;i<wormFood.length;i++) if(!eaten.has(i)) next.push(wormFood[i]);
        wormFood.length=0; wormFood.push(...next);
    }

    const alive=[...wormPlayers.values()].filter(p=>p.alive);
    const SEG_CELL=90;
    const segmentGrid=wormBuildGrid(SEG_CELL);
    for(const p of alive){
        if(Date.now()<p.spawnShieldUntil)continue;
        const headR=p.radius*.78;
        const nearby=wormNearbySegments(segmentGrid,p.x,p.y,SEG_CELL);
        for(const hit of nearby){
            const q=hit.p;
            if(q.id===p.id)continue;
            const r=headR+q.radius*.78;
            if(wormDist2(p.x,p.y,hit.q.x,hit.q.y)<r*r){ wormKill(p,q.nickname); break; }
        }
    }
    wormEmitState();
}
wormEnsureBots();
setInterval(wormTick,WORM_TICK_MS);

io.on("connection", (socket) => {
    socket.emit("notices:update", { notices: getSortedNotices(), updatedAt: new Date().toISOString() });

    socket.on("wordchain:create", ({mode=2,nickname="Player",roomName="새 끝말잇기 방"}={})=>{
        const m=Number(mode)===4?4:2;
        if(socket.data.wordChainRoom){
            const old=wordChainRooms.get(socket.data.wordChainRoom);
            if(old) wordChainRemovePlayer(old,socket);
        }
        const code=wordChainRoomCode();
        const room={code,name:wordChainRoomName(roomName),mode:m,hostId:socket.id,status:"lobby",players:[],currentWord:null,usedWords:new Set(),turnPlayerId:null,turnDeadline:0,lastResult:null,winnerId:null,logs:[],createdAt:Date.now()};
        const player={id:socket.id,nickname:wordChainUniqueName(nickname,room,socket.id),hp:2,mistakes:0,alive:true,ready:true,typing:""};
        room.players.push(player);
        wordChainRooms.set(code,room);
        socket.join(`wordchain:${code}`);
        socket.data.wordChainRoom=code;
        socket.emit("wordchain:created",{code,mode:m,name:room.name});
        wordChainBroadcast(room);
    });

    socket.on("wordchain:list",()=>{
        socket.emit("wordchain:rooms",wordChainPublicLobbyRooms());
    });

    socket.on("wordchain:join", ({code,nickname="Player"}={})=>{
        const target=String(code||"").trim();
        const room=wordChainRooms.get(target);
        if(!room){socket.emit("wordchain:error",{message:"존재하지 않는 방입니다."});return;}
        if(room.status!=="lobby"){socket.emit("wordchain:error",{message:"이미 게임이 시작된 방입니다."});return;}
        if(room.players.length>=room.mode){socket.emit("wordchain:error",{message:`이 방은 ${room.mode}인전이고 이미 가득 찼습니다.`});return;}
        if(socket.data.wordChainRoom){
            const old=wordChainRooms.get(socket.data.wordChainRoom);
            if(old) wordChainRemovePlayer(old,socket);
        }
        const player={id:socket.id,nickname:wordChainUniqueName(nickname,room,socket.id),hp:2,mistakes:0,alive:true,ready:true,typing:""};
        room.players.push(player);
        socket.join(`wordchain:${room.code}`);
        socket.data.wordChainRoom=room.code;
        socket.emit("wordchain:joined",{code:room.code,mode:room.mode,name:room.name});
        wordChainBroadcast(room);
    });

    socket.on("wordchain:start",()=>{
        const room=wordChainRooms.get(socket.data.wordChainRoom);
        if(!room)return;
        if(room.hostId!==socket.id){socket.emit("wordchain:error",{message:"방장만 게임을 시작할 수 있습니다."});return;}
        wordChainStart(room,socket);
    });

    socket.on("wordchain:typing",({text=""}={})=>{
        const room=wordChainRooms.get(socket.data.wordChainRoom);
        if(!room||room.status!=="playing")return;
        const p=room.players.find(x=>x.id===socket.id);
        if(!p||!p.alive||room.turnPlayerId!==socket.id)return;
        p.typing=String(text||"").replace(/[^가-힣]/g,"").slice(0,30);
        io.to(`wordchain:${room.code}`).emit("wordchain:typing",{playerId:p.id,text:p.typing});
    });

    socket.on("wordchain:submit",async({word=""}={})=>{
        const room=wordChainRooms.get(socket.data.wordChainRoom);
        if(!room||room.status!=="playing")return;
        if(room.turnPlayerId!==socket.id){socket.emit("wordchain:error",{message:"지금은 당신의 턴이 아닙니다."});return;}
        const p=room.players.find(x=>x.id===socket.id);
        if(!p||!p.alive)return;

        const normalized=wordChainNormalizeWord(word);
        p.typing="";
        io.to(`wordchain:${room.code}`).emit("wordchain:typing",{playerId:p.id,text:""});
        if(!normalized){socket.emit("wordchain:invalid",{reason:"단어를 입력하세요."});return;}

        let failure="";
        let source="rule";
        if(normalized.length<2){
            failure="두 글자 이상의 단어만 사용할 수 있습니다.";
        }else if(room.usedWords.has(normalized)){
            failure="이미 사용한 단어입니다.";
        }else if(!wordChainCanStart(normalized,room)){
            failure=`${room.currentWord?.slice(-1)||"지정 글자"}로 시작해야 합니다.`;
        }else{
            const check=await wordChainDictionaryCheck(normalized);
            source=check.source;
            if(!check.ok) failure=check.message;
            else{
                // 한방단어는 첫 턴부터 항상 금지합니다. 즉 '처음 5회' 같은 유예가 없습니다.
                const continuation=await wordChainHasContinuation(normalized);
                if(continuation.ok===false){
                    failure=continuation.message||"한방단어는 사용할 수 없습니다.";
                    source=continuation.source;
                }else if(continuation.ok===null){
                    // 한방단어 여부를 확인할 수 없는 상태에서 단어를 통과시키면 규칙이 무너집니다.
                    failure="끄투 사전 연결이 불안정해 한방단어 여부를 확인하지 못했습니다. 잠시 후 다시 시도하세요.";
                    source=continuation.source||"dictionary-unreachable";
                }else{
                    room.usedWords.add(normalized);
                    room.currentWord=normalized;
                    room.lastResult={ok:true,playerId:p.id,word:normalized,source:source};
                    p.mistakes=0;
                    wordChainAddLog(room,`${p.nickname}: ${normalized}`,'good');
                    wordChainAdvanceTurn(room);
                    return;
                }
            }
        }

        p.mistakes+=1;
        room.lastResult={ok:false,playerId:p.id,word:normalized,reason:failure,source};
        wordChainAddLog(room,`${p.nickname}: ${normalized||"(빈 입력)"} · ${failure} (${p.mistakes}/${WORD_CHAIN_MAX_MISTAKES})`,'bad');
        if(p.mistakes>=WORD_CHAIN_MAX_MISTAKES){
            wordChainApplyPenalty(room,p,"6번 틀림");
        }else{
            // 오답 제출은 남은 턴 시간을 그대로 유지합니다. 제출할 때마다 20초가 다시 시작되지 않습니다.
            wordChainBroadcast(room);
        }
    });

    socket.on("wordchain:leave",()=>{
        const room=wordChainRooms.get(socket.data.wordChainRoom);
        if(!room)return;
        wordChainRemovePlayer(room,socket);
    });

    socket.on("worm:join", ({ nickname } = {})=>{
        const existing=wormPlayers.get(socket.id);
        // 죽은 플레이어가 다시 ENTER하면 같은 소켓으로 새 지렁이를 즉시 생성한다.
        if(existing && !existing.alive){
            const p=wormMakePlayer(socket.id,nickname,false);
            wormPlayers.set(socket.id,p);
            socket.emit("worm:joined",{id:socket.id});
            wormEmitState();
            return;
        }
        if(wormPlayers.size>=WORM_MAX_PLAYERS){ socket.emit("worm:error",{message:"현재 아레나가 가득 찼습니다. 잠시 후 다시 시도하세요."}); return; }
        if(existing) return;
        const p=wormMakePlayer(socket.id,nickname,false); wormPlayers.set(socket.id,p);
        wormEnsureBots();
        socket.emit("worm:joined",{id:socket.id});
        wormEmitState();
    });
    socket.on("worm:input", ({x=1,y=0,boost=false}={}) => {
        const p=wormPlayers.get(socket.id); if(!p||!p.alive)return;
        const len=Math.hypot(Number(x),Number(y))||1; p.dirX=Math.max(-1,Math.min(1,Number(x)/len)); p.dirY=Math.max(-1,Math.min(1,Number(y)/len)); p.targetAngle=Math.atan2(p.dirY,p.dirX); p.boost=!!boost; p.lastInput=Date.now();
    });
    socket.on("worm:leave",()=>{ const p=wormPlayers.get(socket.id); if(p){wormPlayers.delete(socket.id); if(p.alive)wormDropMass(p);} });
    const wormPingTimer=setInterval(()=>{ if(socket.connected) socket.emit("worm:ping",{ms:0}); else clearInterval(wormPingTimer); },3000);

    socket.on("car:create-room", () => {
        if (socket.data.carRoomCode) leaveCarRoom(socket, false);
        const code = createCarRoomCode();
        const room = makeCarRoom(code, socket.id);
        carRooms.set(code, room);
        socket.join(code);
        socket.data.carRoomCode = code;
        socket.emit("car:room-created", { roomCode: code });
        emitCarState(room);
    });

    socket.on("car:join-room", ({ roomCode }) => {
        const code = String(roomCode || "").trim();
        if (!/^\d{4}$/.test(code)) {
            socket.emit("car:error", { message: "방 번호는 숫자 4자리여야 합니다." });
            return;
        }
        const room = carRooms.get(code);
        if (!room) {
            socket.emit("car:error", { message: "존재하지 않는 방입니다." });
            return;
        }
        if (room.players.length >= 2) {
            socket.emit("car:room-full");
            return;
        }
        if (socket.data.carRoomCode) leaveCarRoom(socket, false);
        socket.join(code);
        socket.data.carRoomCode = code;
        room.players.push(makeCarPlayer(socket.id, 1));
        socket.emit("car:joined", { roomCode: code });
        startCarRound(room);
    });

    socket.on("car:input", ({ direction }) => {
        const code = socket.data.carRoomCode;
        const room = carRooms.get(code);
        if (!room || room.status !== "playing") return;
        const player = room.players.find(p => p.id === socket.id);
        if (!player || !player.alive) return;
        player.direction = ["left", "right", "none"].includes(direction) ? direction : "none";
    });

    socket.on("car:leave-room", () => leaveCarRoom(socket, true));

    socket.on("disconnect", () => {
        leaveCarRoom(socket, true);
        const wordRoom=wordChainRooms.get(socket.data.wordChainRoom);
        if(wordRoom) wordChainRemovePlayer(wordRoom,socket);
        const p=wormPlayers.get(socket.id);
        if(p && !p.isBot){ if(p.alive)wormDropMass(p); wormPlayers.delete(socket.id); }
    });
});

app.use("/api", (req, res) => {
    res.status(404).json({
        ok: false,
        message: "존재하지 않는 API입니다."
    });
});

server.listen(PORT, () => {
    console.log("");
    console.log("======================================");
    console.log("       COMTIME PRO SERVER");
    console.log("======================================");
    console.log(`http://localhost:${PORT}`);
    console.log("");
    console.log("학교검색 : /api/search-school");
    console.log("시간표   : /api/timetable");
    console.log("급식     : /api/meal");
    console.log("Gemini   : /api/gemini");
    console.log("상태     : /api/health");
    console.log("======================================");
    console.log("");
});
