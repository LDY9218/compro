const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

/*
==================================================
 parse-comcigan
 ES Module을 dynamic import()로 불러옴
==================================================
*/
let Comcigan = null;

async function loadComcigan() {
    if (Comcigan) {
        return Comcigan;
    }

    const module = await import("parse-comcigan");

    console.log("[컴시간 모듈 로드]");
    console.log("module keys:", Object.keys(module));

    Comcigan = module.default || module.Comcigan || module;

    console.log("Comcigan type:", typeof Comcigan);
    console.log(
        "Comcigan keys:",
        Object.getOwnPropertyNames(Comcigan)
    );

    if (
        !Comcigan ||
        typeof Comcigan.search !== "function"
    ) {
        throw new Error(
            "parse-comcigan의 Comcigan.search()를 찾을 수 없습니다."
        );
    }

    return Comcigan;
}


/*
==================================================
 서버 상태 확인
==================================================
*/
app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        message: "COMTIME PRO SERVER OK",
        time: new Date().toISOString()
    });
});


/*
==================================================
 학교 검색
==================================================
*/
app.get("/api/search-school", async (req, res) => {
    const q = String(req.query.q || "").trim();

    console.log(`[학교검색] "${q}" 검색 시작`);

    if (!q) {
        return res.json({
            ok: true,
            schools: []
        });
    }

    try {
        const Comcigan = await loadComcigan();

        console.log("[학교검색] Comcigan.search 실행");

        const result = await Comcigan.search(q);

        console.log(
            `[학교검색] 검색 결과 ${result.length}개`
        );

        const schools = result.map((school) => ({
            code: Number(school.code),
            name: school.name,
            region: school.region
        }));

        console.log("[학교검색] 결과:", schools);

        return res.json({
            ok: true,
            schools
        });

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


/*
==================================================
 시간표
==================================================
*/
app.get("/api/timetable", async (req, res) => {

    const schoolCode = Number(req.query.schoolCode);
    const grade = Number(req.query.grade);
    const classNum = Number(req.query.classNum);

    console.log(
        `[시간표] school=${schoolCode}, grade=${grade}, class=${classNum}`
    );

    if (
        !schoolCode ||
        !grade ||
        !classNum
    ) {
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

        return res.json({
            ok: true,
            timetable
        });

    } catch (error) {

        console.error("[시간표 오류]");
        console.error(error);

        return res.status(500).json({
            ok: false,
            message: error.message
        });
    }
});


/*
==================================================
 NEIS 학교 검색
==================================================
*/
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
            throw new Error(
                `NEIS HTTP ${response.status}`
            );
        }

        const data = await response.json();

        const rows =
            data?.schoolInfo?.[1]?.row || [];

        const schools = rows.map((school) => ({
            schoolName: school.SCHUL_NM,
            officeCode: school.ATPT_OFCDC_SC_CODE,
            schoolCode: school.SD_SCHUL_CODE,
            schoolType: school.SCHUL_KND_SC_NM,
            address: school.ORG_RDNMA
        }));

        return res.json({
            ok: true,
            schools
        });

    } catch (error) {

        console.error("[NEIS 학교검색 오류]");
        console.error(error);

        return res.status(500).json({
            ok: false,
            message: error.message
        });
    }
});


/*
==================================================
 NEIS 급식
==================================================
*/
app.get("/api/meal", async (req, res) => {

    const officeCode =
        String(req.query.officeCode || "").trim();

    const schoolCode =
        String(req.query.schoolCode || "").trim();

    const date =
        String(req.query.date || "").trim();

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
            new Date()
                .toISOString()
                .slice(0, 10)
                .replaceAll("-", "");

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
            throw new Error(
                `NEIS HTTP ${response.status}`
            );
        }

        const data = await response.json();

        const rows =
            data?.mealServiceDietInfo?.[1]?.row || [];

        const meals = rows.map((meal) => ({
            date: meal.MLSV_YMD,
            mealType: meal.MMEAL_SC_NM,
            menu: meal.DDISH_NM,
            calories: meal.CAL_INFO,
            origin: meal.ORPLC_INFO,
            nutrition: meal.NTR_INFO
        }));

        return res.json({
            ok: true,
            meals
        });

    } catch (error) {

        console.error("[급식 오류]");
        console.error(error);

        return res.status(500).json({
            ok: false,
            message: error.message
        });
    }
});


/*
==================================================
 존재하지 않는 API
==================================================
*/
app.use("/api", (req, res) => {

    res.status(404).json({
        ok: false,
        message: "존재하지 않는 API입니다."
    });

});


/*
==================================================
 서버 시작
==================================================
*/
app.listen(PORT, () => {

    console.log("");
    console.log("======================================");
    console.log("       COMTIME PRO SERVER");
    console.log("======================================");
    console.log(`http://localhost:${PORT}`);
    console.log("");
    console.log("학교검색 : /api/search-school");
    console.log("시간표   : /api/timetable");
    console.log("급식     : /api/meal");
    console.log("상태     : /api/health");
    console.log("======================================");
    console.log("");

});