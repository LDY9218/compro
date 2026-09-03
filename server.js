const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true, methods: ["GET", "POST", "PUT", "DELETE"] } });
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

io.on("connection", (socket) => {
    socket.emit("notices:update", { notices: getSortedNotices(), updatedAt: new Date().toISOString() });
});


// ==================================================
// NOTICE BOARD
// ==================================================
const DATA_DIR = path.join(__dirname, "data");
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
    const adminId = String(process.env.ADMIN_ID || "dnjstnddl!23").trim();
    const userId = String(req.headers["x-comtime-user-id"] || req.body?.userId || req.query?.userId || "").trim();
    return Boolean(adminId && userId && adminId === userId);
}

app.get("/api/notices", (req, res) => {
    const notices = getSortedNotices();
    res.json({ ok: true, notices });
});

app.get("/api/admin/check", (req, res) => {
    res.json({ ok: true, isAdmin: isAdmin(req) });
});

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

    const apiKey = process.env.NEIS_API_KEY;

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
    const apiKey = process.env.NEIS_API_KEY;

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

app.post("/api/gemini", async (req, res) => {
    const message = String(req.body?.message || "").trim();
    const previousInteractionId = String(
        req.body?.previousInteractionId || ""
    ).trim();
    const context = req.body?.context || {};
    const apiKey = process.env.GEMINI_API_KEY;

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
            sendEvent("done", { interactionId });
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

            sendEvent("done", {
                interactionId
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
