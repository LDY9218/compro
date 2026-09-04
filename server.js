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
    const adminCode = String(process.env.ADMIN_CODE || "").trim();
    const userId = String(
        req.headers["x-comtime-user-id"] ||
        req.body?.userId ||
        req.query?.userId ||
        ""
    ).trim();
    return userId === adminCode;
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
    console.log(`[Gemini 사용자 메시지] ${message}`);
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
    const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey || !Array.isArray(history) || history.length === 0) {
        return {
            query: "한국어 쇼츠 재미있는 영상",
            keywords: ["한국어", "쇼츠"],
            koreanPriority: 0.9
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
  "interestSummary": "사용자가 현재 좋아하는 콘텐츠를 기록에 근거해 한 문장으로 요약",
  "koreanPriority": 0.0
}

koreanPriority는 0~1 사이 숫자이며, 한국어 영상 우선 정도다.
interestSummary는 시청 기록에서 실제로 확인되는 관심사만 요약하고, 근거가 부족하면 추측하지 말고 "아직 충분한 데이터 없음"이라고 쓴다.

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
            interestSummary: String(
                profile.interestSummary || "아직 충분한 데이터 없음"
            ).trim().slice(0, 300),
            koreanPriority: Math.max(0, Math.min(1, Number(profile.koreanPriority) || 0.9))
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

app.post("/api/shorts/recommendation-profile", async (req, res) => {
    const history = Array.isArray(req.body?.history) ? req.body.history : [];
    const profile = await askGeminiForShortsProfile(history);

    const keywords = profile.keywords.length
        ? profile.keywords.join(", ")
        : "없음";

    console.log("[Shorts 알고리즘 사용자 취향 분석]");
    console.log(`  관심 알고리즘: ${profile.interestSummary}`);
    console.log(`  선호 키워드: ${keywords}`);
    console.log(`  추천 검색어: ${profile.query}`);
    console.log(`  한국어 우선도: ${(profile.koreanPriority * 100).toFixed(0)}%`);
    console.log(`  분석 기록 수: ${history.length}개`);

    return res.json({ ok: true, profile });
});

app.get("/api/shorts", async (req, res) => {
    const apiKey = String(process.env.YOUTUBE_API_KEY || "").trim();
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
        order: "relevance",
        regionCode: "KR",
        relevanceLanguage: "ko",
        safeSearch: "moderate",
        q: query,
        key: apiKey
    });
    if (pageToken) params.set("pageToken", pageToken);

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

io.on("connection", (socket) => {
    socket.emit("notices:update", { notices: getSortedNotices(), updatedAt: new Date().toISOString() });

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
