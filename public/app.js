console.log("======================================");
console.log(" COMTIME PRO APP START");
console.log("======================================");


// ==================================================
// DOM
// ==================================================

const schoolInput = document.getElementById("schoolInput");
const schoolSearchBtn = document.getElementById("schoolSearchBtn");
const schoolResults = document.getElementById("schoolResults");

const schoolNameEl = document.getElementById("schoolName");
const schoolInfoEl = document.getElementById("schoolInfo");

const gradeSelect = document.getElementById("gradeSelect");
const classSelect = document.getElementById("classSelect");

const timetableGrid = document.getElementById("timetableGrid");

const mealBox = document.getElementById("mealBox");

const clockEl = document.getElementById("clock");
const todayDateEl = document.getElementById("todayDate");

const currentSubjectEl = document.getElementById("currentSubject");
const currentTeacherEl = document.getElementById("currentTeacher");
const nextSubjectEl = document.getElementById("nextSubject");


// ==================================================
// 상태
// ==================================================

let selectedSchool = null;
let currentTimetable = null;


// ==================================================
// 반 선택
// ==================================================

function createClassOptions() {

    classSelect.innerHTML = "";

    for (let i = 1; i <= 20; i++) {

        const option = document.createElement("option");

        option.value = i;
        option.textContent = `${i}반`;

        classSelect.appendChild(option);
    }
}


// ==================================================
// 한국 시간 기준 날짜
// ==================================================

function getKoreaDate() {

    const now = new Date();

    const formatter = new Intl.DateTimeFormat(
        "ko-KR",
        {
            timeZone: "Asia/Seoul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    );

    const parts = formatter.formatToParts(now);

    const year =
        parts.find(p => p.type === "year").value;

    const month =
        parts.find(p => p.type === "month").value;

    const day =
        parts.find(p => p.type === "day").value;

    return `${year}-${month}-${day}`;
}


// ==================================================
// 시계
// ==================================================

function updateClock() {

    const now = new Date();

    const time = now.toLocaleTimeString(
        "ko-KR",
        {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "Asia/Seoul"
        }
    );

    const date = now.toLocaleDateString(
        "ko-KR",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
            timeZone: "Asia/Seoul"
        }
    );

    if (clockEl) {
        clockEl.textContent = time;
    }

    if (todayDateEl) {
        todayDateEl.textContent = date;
    }

    updateCurrentClass();
}


setInterval(updateClock, 1000);
updateClock();


// ==================================================
// HTML escape
// ==================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ==================================================
// 학교 검색
// ==================================================

async function searchSchool() {

    const q = schoolInput.value.trim();

    if (!q) {

        schoolResults.innerHTML = `
            <p class="hint">
                학교 이름을 입력하세요.
            </p>
        `;

        return;
    }

    console.log(`[학교검색] "${q}" 검색`);

    schoolResults.innerHTML = `
        <div class="message">
            학교를 검색하는 중...
        </div>
    `;

    try {

        const response =
            await fetch(
                `/api/search-school?q=${encodeURIComponent(q)}`
            );

        const data = await response.json();

        console.log("[학교검색 결과]", data);

        if (!response.ok || !data.ok) {

            throw new Error(
                data.message || "학교 검색 실패"
            );
        }

        const schools = data.schools || [];

        if (schools.length === 0) {

            schoolResults.innerHTML = `
                <div class="message">
                    검색된 학교가 없습니다.
                </div>
            `;

            return;
        }

        schoolResults.innerHTML = "";

        schools.forEach((school) => {

            const button =
                document.createElement("button");

            button.type = "button";
            button.className = "school-result";

            button.innerHTML = `
                <strong>
                    ${escapeHtml(school.name)}
                </strong>

                <span>
                    ${escapeHtml(school.region || "")}
                </span>
            `;

            button.addEventListener(
                "click",
                () => selectSchool(school)
            );

            schoolResults.appendChild(button);
        });

    } catch (error) {

        console.error("[학교검색 오류]", error);

        schoolResults.innerHTML = `
            <div class="message error">
                학교 검색 중 오류가 발생했습니다.<br>
                ${escapeHtml(error.message)}
            </div>
        `;
    }
}


// ==================================================
// 학교 선택
// ==================================================

async function selectSchool(school) {

    console.log("[학교선택]", school);

    selectedSchool = {
        code: Number(school.code),
        name: school.name,
        region: school.region || "",

        // NEIS 정보는 아직 없을 수 있음
        officeCode: null,
        neisSchoolCode: null
    };

    // 즉시 화면 변경
    schoolNameEl.textContent =
        selectedSchool.name;

    schoolInfoEl.textContent =
        `${selectedSchool.region || "학교"} · 학교 선택 완료`;

    schoolResults.innerHTML = `
        <div class="message">
            <strong>${escapeHtml(selectedSchool.name)}</strong> 학교를 선택했습니다.
        </div>
    `;

    // 저장
    localStorage.setItem(
        "comtime_selected_school",
        JSON.stringify(selectedSchool)
    );

    // 시간표 먼저 불러오기
    await loadTimetable();

    // NEIS 학교코드 찾기 → 급식 불러오기
    await loadMeal();

    console.log(
        "[학교선택 완료]",
        selectedSchool
    );
}


// ==================================================
// 시간표 불러오기
// ==================================================

async function loadTimetable() {

    if (!selectedSchool) {

        timetableGrid.innerHTML = `
            <div class="message">
                학교를 먼저 선택해주세요.
            </div>
        `;

        return;
    }

    const grade =
        Number(gradeSelect.value);

    const classNum =
        Number(classSelect.value);

    timetableGrid.innerHTML = `
        <div class="message">
            시간표를 불러오는 중...
        </div>
    `;

    console.log(
        `[시간표 요청] 학교=${selectedSchool.code}, 학년=${grade}, 반=${classNum}`
    );

    try {

        const response =
            await fetch(
                `/api/timetable` +
                `?schoolCode=${selectedSchool.code}` +
                `&grade=${grade}` +
                `&classNum=${classNum}`
            );

        const data =
            await response.json();

        console.log("[시간표 응답]", data);

        if (!response.ok || !data.ok) {

            throw new Error(
                data.message || "시간표를 가져오지 못했습니다."
            );
        }

        currentTimetable =
            data.timetable;

        renderTimetable(currentTimetable);

        updateCurrentClass();

    } catch (error) {

        console.error("[시간표 오류]", error);

        timetableGrid.innerHTML = `
            <div class="message error">
                시간표를 불러오지 못했습니다.<br>
                ${escapeHtml(error.message)}
            </div>
        `;

        currentTimetable = null;

        currentSubjectEl.textContent =
            "시간표를 불러오지 못했습니다.";

        currentTeacherEl.textContent = "-";
        nextSubjectEl.textContent = "-";
    }
}


// ==================================================
// 시간표 데이터에서 요일 찾기
// ==================================================

function getTodayItems() {

    if (!currentTimetable) {
        return [];
    }

    // 일반적인 parse-comcigan 구조
    if (Array.isArray(currentTimetable)) {

        const dayIndex =
            getKoreanDayIndex();

        const dayData =
            currentTimetable[dayIndex];

        if (dayData) {

            if (Array.isArray(dayData.items)) {
                return dayData.items;
            }

            if (Array.isArray(dayData)) {
                return dayData;
            }
        }

        // 혹시 오늘 데이터만 배열로 오는 경우
        if (
            currentTimetable.length > 0 &&
            currentTimetable[0]?.subject !== undefined
        ) {
            return currentTimetable;
        }
    }

    return [];
}


// ==================================================
// 오늘 요일
// 월요일 = 0
// ==================================================

function getKoreanDayIndex() {

    const now = new Date();

    const koreaString =
        now.toLocaleString(
            "en-US",
            {
                timeZone: "Asia/Seoul"
            }
        );

    const koreaDate =
        new Date(koreaString);

    let day =
        koreaDate.getDay();

    // 일요일 = 0
    // 월요일 = 1
    // ...
    // 토요일 = 6

    if (day === 0) {
        return -1;
    }

    return day - 1;
}


// ==================================================
// 과목 이름
// ==================================================

function getSubject(item) {

    if (!item) {
        return "-";
    }

    return (
        item.subject ||
        item.original?.subject ||
        "수업"
    );
}


// ==================================================
// 선생님 이름
// ==================================================

function getTeacher(item) {

    if (!item) {
        return "";
    }

    return (
        item.teacher ||
        item.original?.teacher ||
        ""
    );
}


// ==================================================
// 시간표 화면
// ==================================================

function renderTimetable(timetable) {

    if (!Array.isArray(timetable)) {

        timetableGrid.innerHTML = `
            <div class="message">
                시간표 데이터가 올바르지 않습니다.
            </div>
        `;

        return;
    }

    const dayNames = [
        "월",
        "화",
        "수",
        "목",
        "금"
    ];

    timetableGrid.innerHTML = "";

    // ==================================================
    // 전체 주간 시간표 표시
    // ==================================================

    timetable.forEach((dayData, dayIndex) => {

        if (!dayData) {
            return;
        }

        const items =
            Array.isArray(dayData.items)
                ? dayData.items
                : Array.isArray(dayData)
                    ? dayData
                    : [];

        if (items.length === 0) {
            return;
        }

        const dayColumn =
            document.createElement("div");

        dayColumn.className =
            "day-column";

        const dayTitle =
            document.createElement("div");

        dayTitle.className =
            "day-title";

        dayTitle.textContent =
            dayNames[dayIndex] ||
            `${dayIndex + 1}일`;

        dayColumn.appendChild(dayTitle);

        items.forEach((item, index) => {

            const subject =
                getSubject(item);

            const teacher =
                getTeacher(item);

            const card =
                document.createElement("div");

            card.className =
                "lesson-card";

            card.innerHTML = `
                <span class="period">
                    ${index + 1}교시
                </span>

                <strong>
                    ${escapeHtml(subject)}
                </strong>

                ${
                    teacher
                        ? `<small>${escapeHtml(teacher)}</small>`
                        : ""
                }
            `;

            dayColumn.appendChild(card);
        });

        timetableGrid.appendChild(dayColumn);
    });

    if (!timetableGrid.children.length) {

        timetableGrid.innerHTML = `
            <div class="message">
                표시할 시간표가 없습니다.
            </div>
        `;
    }
}


// ==================================================
// 교시 시간
// ==================================================

const PERIODS = [
    {
        period: 1,
        start: "08:40",
        end: "09:25"
    },
    {
        period: 2,
        start: "09:35",
        end: "10:20"
    },
    {
        period: 3,
        start: "10:30",
        end: "11:15"
    },
    {
        period: 4,
        start: "11:25",
        end: "12:10"
    },
    {
        period: 5,
        start: "13:10",
        end: "13:55"
    },
    {
        period: 6,
        start: "14:05",
        end: "14:50"
    },
    {
        period: 7,
        start: "15:00",
        end: "15:45"
    },
    {
        period: 8,
        start: "15:55",
        end: "16:40"
    }
];


// ==================================================
// HH:MM → 분
// ==================================================

function timeToMinutes(time) {

    const [hour, minute] =
        time.split(":").map(Number);

    return hour * 60 + minute;
}


// ==================================================
// 현재 한국 시간 → 분
// ==================================================

function getCurrentMinutes() {

    const now = new Date();

    const koreaTime =
        now.toLocaleTimeString(
            "en-US",
            {
                timeZone: "Asia/Seoul",
                hour12: false,
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    const [hour, minute] =
        koreaTime.split(":").map(Number);

    return hour * 60 + minute;
}


// ==================================================
// 현재 수업 계산
// ==================================================

function updateCurrentClass() {

    if (!selectedSchool || !currentTimetable) {

        currentSubjectEl.textContent =
            "학교를 선택해주세요";

        currentTeacherEl.textContent =
            "-";

        nextSubjectEl.textContent =
            "-";

        return;
    }

    const dayIndex =
        getKoreanDayIndex();

    // 주말
    if (dayIndex < 0 || dayIndex > 4) {

        currentSubjectEl.textContent =
            "주말입니다";

        currentTeacherEl.textContent =
            "즐거운 주말 보내세요";

        nextSubjectEl.textContent =
            "월요일 수업";

        return;
    }

    const todayItems =
        getTodayItems();

    const nowMinutes =
        getCurrentMinutes();

    let currentPeriod = null;
    let nextPeriod = null;

    for (let i = 0; i < PERIODS.length; i++) {

        const period =
            PERIODS[i];

        const start =
            timeToMinutes(period.start);

        const end =
            timeToMinutes(period.end);

        if (
            nowMinutes >= start &&
            nowMinutes <= end
        ) {
            currentPeriod = period;

            nextPeriod =
                PERIODS[i + 1] || null;

            break;
        }

        if (
            nowMinutes < start &&
            !nextPeriod
        ) {
            nextPeriod = period;
        }
    }

    // 현재 수업
    if (currentPeriod) {

        const item =
            todayItems[currentPeriod.period - 1];

        const subject =
            getSubject(item);

        const teacher =
            getTeacher(item);

        currentSubjectEl.textContent =
            `${currentPeriod.period}교시 · ${subject}`;

        currentTeacherEl.textContent =
            teacher
                ? `${teacher} 선생님`
                : "담당 선생님 정보 없음";

        const remaining =
            timeToMinutes(currentPeriod.end) -
            nowMinutes;

        const seconds =
            60 -
            new Date().getSeconds();

        const remainText =
            remaining > 0
                ? `${remaining - 1}분 ${seconds}초 남음`
                : "곧 종료";

        nextSubjectEl.textContent =
            nextPeriod
                ? `${getSubject(todayItems[nextPeriod.period - 1])} · 다음`
                : "오늘 마지막 수업";

        // 화면의 next 영역에 남은 시간 표시
        const nextContainer =
            document.querySelector(".next");

        if (nextContainer) {

            nextContainer.innerHTML = `
                현재 수업 종료까지
                <strong>
                    ${escapeHtml(remainText)}
                </strong>
            `;
        }

        return;
    }

    // 수업 시작 전
    if (nextPeriod) {

        const item =
            todayItems[nextPeriod.period - 1];

        const subject =
            getSubject(item);

        const teacher =
            getTeacher(item);

        const remain =
            timeToMinutes(nextPeriod.start) -
            nowMinutes;

        currentSubjectEl.textContent =
            "쉬는 시간";

        currentTeacherEl.textContent =
            "다음 수업 준비하세요";

        nextSubjectEl.textContent =
            `${nextPeriod.period}교시 ${subject}`;

        const nextContainer =
            document.querySelector(".next");

        if (nextContainer) {

            nextContainer.innerHTML = `
                다음 수업까지
                <strong>
                    ${remain}분
                </strong>
            `;
        }

        return;
    }

    // 오늘 수업 끝
    currentSubjectEl.textContent =
        "오늘 수업 끝";

    currentTeacherEl.textContent =
        "수고하셨습니다";

    nextSubjectEl.textContent =
        "내일 수업";

    const nextContainer =
        document.querySelector(".next");

    if (nextContainer) {

        nextContainer.innerHTML = `
            오늘 수업이 모두 끝났습니다.
        `;
    }
}


// ==================================================
// NEIS 학교 검색
// ==================================================

async function findNeisSchool() {

    if (!selectedSchool) {
        return null;
    }

    console.log(
        `[NEIS 학교검색] ${selectedSchool.name}`
    );

    try {

        const response =
            await fetch(
                `/api/neis-school?name=${encodeURIComponent(
                    selectedSchool.name
                )}`
            );

        const data =
            await response.json();

        console.log(
            "[NEIS 학교검색 결과]",
            data
        );

        if (!response.ok || !data.ok) {
            throw new Error(
                data.message || "NEIS 학교 검색 실패"
            );
        }

        const schools =
            data.schools || [];

        if (schools.length === 0) {

            console.warn(
                "[NEIS] 학교를 찾지 못함"
            );

            return null;
        }

        // 이름이 정확히 같은 학교 우선
        let found =
            schools.find(
                school =>
                    school.schoolName ===
                    selectedSchool.name
            );

        // 없으면 첫 번째
        if (!found) {
            found = schools[0];
        }

        console.log(
            "[NEIS 선택 학교]",
            found
        );

        selectedSchool.officeCode =
            found.officeCode;

        selectedSchool.neisSchoolCode =
            found.schoolCode;

        selectedSchool.address =
            found.address || "";

        selectedSchool.schoolType =
            found.schoolType || "";

        // 다시 저장
        localStorage.setItem(
            "comtime_selected_school",
            JSON.stringify(selectedSchool)
        );

        schoolInfoEl.textContent =
            `${selectedSchool.region || ""} · ${
                found.schoolType || "학교"
            }`;

        return found;

    } catch (error) {

        console.error(
            "[NEIS 학교검색 오류]",
            error
        );

        return null;
    }
}


// ==================================================
// 급식 불러오기
// ==================================================

async function loadMeal() {

    if (!selectedSchool) {

        mealBox.innerHTML = `
            <div class="message">
                학교를 먼저 선택해주세요.
            </div>
        `;

        return;
    }

    mealBox.innerHTML = `
        <div class="message">
            급식 정보를 불러오는 중...
        </div>
    `;

    try {

        // NEIS 코드가 없으면 먼저 학교 검색
        if (
            !selectedSchool.officeCode ||
            !selectedSchool.neisSchoolCode
        ) {

            await findNeisSchool();
        }

        if (
            !selectedSchool.officeCode ||
            !selectedSchool.neisSchoolCode
        ) {

            throw new Error(
                "NEIS에서 학교 정보를 찾지 못했습니다."
            );
        }

        const date =
            getKoreaDate()
                .replaceAll("-", "");

        console.log(
            `[급식 요청] ${selectedSchool.officeCode} / ${selectedSchool.neisSchoolCode} / ${date}`
        );

        const url =
            `/api/meal` +
            `?officeCode=${encodeURIComponent(
                selectedSchool.officeCode
            )}` +
            `&schoolCode=${encodeURIComponent(
                selectedSchool.neisSchoolCode
            )}` +
            `&date=${encodeURIComponent(date)}`;

        const response =
            await fetch(url);

        const data =
            await response.json();

        console.log(
            "[급식 응답]",
            data
        );

        if (!response.ok || !data.ok) {

            throw new Error(
                data.message ||
                "급식 정보를 가져오지 못했습니다."
            );
        }

        renderMeal(data.meals || []);

    } catch (error) {

        console.error(
            "[급식 오류]",
            error
        );

        mealBox.innerHTML = `
            <div class="message error">
                급식을 불러오지 못했습니다.<br>
                ${escapeHtml(error.message)}
            </div>
        `;
    }
}


// ==================================================
// 급식 표시
// ==================================================

function renderMeal(meals) {

    if (!meals || meals.length === 0) {

        mealBox.innerHTML = `
            <div class="message">
                오늘 등록된 급식이 없습니다.
            </div>
        `;

        return;
    }

    mealBox.innerHTML = "";

    meals.forEach(meal => {

        const card =
            document.createElement("div");

        card.className =
            "meal-card";

        const menu =
            String(meal.menu || "")
                .replaceAll("<br/>", "\n")
                .replaceAll("<br>", "\n")
                .replaceAll("<br />", "\n");

        const menuItems =
            menu
                .split("\n")
                .map(item => item.trim())
                .filter(Boolean);

        card.innerHTML = `
            <div class="meal-type">
                ${escapeHtml(meal.mealType || "급식")}
            </div>

            <div class="meal-menu">
                ${
                    menuItems.length
                        ? menuItems.map(
                            item =>
                                `<div>• ${escapeHtml(item)}</div>`
                          ).join("")
                        : `<div>급식 메뉴 정보 없음</div>`
                }
            </div>

            ${
                meal.calories
                    ? `
                        <div class="meal-calories">
                            ${escapeHtml(meal.calories)}
                        </div>
                    `
                    : ""
            }
        `;

        mealBox.appendChild(card);
    });
}


// ==================================================
// 검색 버튼
// ==================================================

schoolSearchBtn.addEventListener(
    "click",
    searchSchool
);


// ==================================================
// 엔터로 검색
// ==================================================

schoolInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            searchSchool();
        }
    }
);


// ==================================================
// 학년 / 반 변경
// ==================================================

gradeSelect.addEventListener(
    "change",
    () => {

        if (selectedSchool) {
            loadTimetable();
        }
    }
);


classSelect.addEventListener(
    "change",
    () => {

        if (selectedSchool) {
            loadTimetable();
        }
    }
);


// ==================================================
// 저장된 학교 복구
// ==================================================

async function restoreSchool() {

    const saved =
        localStorage.getItem(
            "comtime_selected_school"
        );

    if (!saved) {
        return;
    }

    try {

        const school =
            JSON.parse(saved);

        if (!school || !school.code) {
            return;
        }

        console.log(
            "[저장 학교 복구]",
            school
        );

        selectedSchool =
            school;

        schoolNameEl.textContent =
            school.name;

        schoolInfoEl.textContent =
            `${school.region || ""} · 저장된 학교`;

        await loadTimetable();

        await loadMeal();

    } catch (error) {

        console.error(
            "[저장 학교 복구 오류]",
            error
        );

        localStorage.removeItem(
            "comtime_selected_school"
        );
    }
}


// ==================================================
// 초기화
// ==================================================

createClassOptions();

restoreSchool();

console.log(
    "COMTIME PRO 초기화 완료"
);