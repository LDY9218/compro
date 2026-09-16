console.log("======================================");
console.log(" COMTIME PRO APP START");
console.log("======================================");


// ==================================================
// DOM
// ==================================================

const schoolInput =
    document.getElementById("schoolInput");

const schoolSearchBtn =
    document.getElementById("schoolSearchBtn");

const schoolResults =
    document.getElementById("schoolResults");

const schoolNameEl =
    document.getElementById("schoolName");

const schoolInfoEl =
    document.getElementById("schoolInfo");

const gradeSelect =
    document.getElementById("gradeSelect");

const classSelect =
    document.getElementById("classSelect");

const timetableGrid =
    document.getElementById("timetableGrid");

const mealBox =
    document.getElementById("mealBox");

const clockEl =
    document.getElementById("clock");

const todayDateEl =
    document.getElementById("todayDate");

const currentSubjectEl =
    document.getElementById("currentSubject");

const currentTeacherEl =
    document.getElementById("currentTeacher");

const nextSubjectEl =
    document.getElementById("nextSubject");
const weekendScheduleInfoEl = document.getElementById("weekendScheduleInfo");


// ==================================================
// GAME HUB / EXISTING GAMES
// ==================================================

const gameHubBtn = document.getElementById("gameHubBtn");
const gameHubModal = document.getElementById("gameHubModal");
const gameHubBackdrop = document.getElementById("gameHubBackdrop");
const closeGameHubBtn = document.getElementById("closeGameHubBtn");
const hubSurvivalGame = document.getElementById("hubSurvivalGame");
const hubBirdGame = document.getElementById("hubBirdGame");
const hubCarGame = document.getElementById("hubCarGame");
const hubWormGame = document.getElementById("hubWormGame");

const wormGameModal = document.getElementById("wormGameModal");
const wormGameBackdrop = document.getElementById("wormGameBackdrop");
const closeWormGameBtn = document.getElementById("closeWormGameBtn");
const closeWormStageBtn = document.getElementById("closeWormStageBtn");
const wormGameCanvas = document.getElementById("wormGameCanvas");
const wormCenterMessage = document.getElementById("wormCenterMessage");
const wormStartBtn = document.getElementById("wormStartBtn");
const wormRestartBtn = document.getElementById("wormRestartBtn");
const wormNickname = document.getElementById("wormNickname");
const wormMassEl = document.getElementById("wormMass");
const wormLengthEl = document.getElementById("wormLength");
const wormOnlineCountEl = document.getElementById("wormOnlineCount");
const wormPingEl = document.getElementById("wormPing");
const wormLeaderboardEl = document.getElementById("wormLeaderboard");
const wormDeathPanel = document.getElementById("wormDeathPanel");
const wormDeathText = document.getElementById("wormDeathText");
const wormJoystick = document.getElementById("wormJoystick");
const wormStick = wormJoystick?.querySelector(".worm-stick");
const wormBoostBtn = document.getElementById("wormBoostBtn");

const birdGameModal = document.getElementById("birdGameModal");
const gameBackdrop = document.getElementById("gameBackdrop");
const closeGameBtn = document.getElementById("closeGameBtn");
const birdGameContainer = document.getElementById("birdGameContainer");
const birdGameCanvas = document.getElementById("birdGameCanvas");
const birdScoreEl = document.getElementById("birdScore");
const birdBestEl = document.getElementById("birdBest");
const birdStartScreen = document.getElementById("birdStartScreen");
const birdStartBtn = document.getElementById("birdStartBtn");
const birdGameOverScreen = document.getElementById("birdGameOverScreen");
const birdRestartBtn = document.getElementById("birdRestartBtn");
const birdFinalScoreEl = document.getElementById("birdFinalScore");
const birdNewBestEl = document.getElementById("birdNewBest");
const birdControlHint = document.getElementById("birdControlHint");

// ==================================================
// 상태
// ==================================================

let selectedSchool = null;

let currentTimetable = null;


// ==================================================
// 반 선택
// ==================================================

function createClassOptions() {

    if (!classSelect) {
        return;
    }

    classSelect.innerHTML = "";

    for (
        let i = 1;
        i <= 20;
        i++
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value = i;

        option.textContent =
            `${i}반`;

        classSelect.appendChild(
            option
        );
    }
}


// ==================================================
// 한국 시간 기준 날짜
// ==================================================

function getKoreaDate() {

    const now =
        new Date();

    const formatter =
        new Intl.DateTimeFormat(
            "ko-KR",
            {
                timeZone:
                    "Asia/Seoul",

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit"
            }
        );

    const parts =
        formatter.formatToParts(
            now
        );

    const year =
        parts.find(
            p => p.type === "year"
        ).value;

    const month =
        parts.find(
            p => p.type === "month"
        ).value;

    const day =
        parts.find(
            p => p.type === "day"
        ).value;

    return `${year}-${month}-${day}`;
}


// ==================================================
// 시계
// ==================================================

function updateClock() {

    const now =
        new Date();

    const time =
        now.toLocaleTimeString(
            "ko-KR",
            {
                hour12:
                    false,

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                second:
                    "2-digit",

                timeZone:
                    "Asia/Seoul"
            }
        );

    const date =
        now.toLocaleDateString(
            "ko-KR",
            {
                year:
                    "numeric",

                month:
                    "long",

                day:
                    "numeric",

                weekday:
                    "long",

                timeZone:
                    "Asia/Seoul"
            }
        );

    if (clockEl) {
        clockEl.textContent =
            time;
    }

    if (todayDateEl) {
        todayDateEl.textContent =
            date;
    }

    updateCurrentClass();
}


setInterval(
    updateClock,
    1000
);

updateClock();


// ==================================================
// HTML escape
// ==================================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


// ==================================================
// 학교 검색
// ==================================================

async function searchSchool() {

    if (
        !schoolInput ||
        !schoolResults
    ) {
        return;
    }

    const q =
        schoolInput.value.trim();

    if (!q) {

        schoolResults.innerHTML = `
            <p class="hint">
                학교 이름을 입력하세요.
            </p>
        `;

        return;
    }

    console.log(
        `[학교검색] "${q}" 검색`
    );

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

        const data =
            await response.json();

        console.log(
            "[학교검색 결과]",
            data
        );

        if (
            !response.ok ||
            !data.ok
        ) {

            throw new Error(
                data.message ||
                "학교 검색 실패"
            );
        }

        const schools =
            data.schools || [];

        if (
            schools.length === 0
        ) {

            schoolResults.innerHTML = `
                <div class="message">
                    검색된 학교가 없습니다.
                </div>
            `;

            return;
        }

        schoolResults.innerHTML = "";

        schools.forEach(
            school => {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "school-result";

                button.innerHTML = `
                    <strong>
                        ${escapeHtml(
                            school.name
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            school.region || ""
                        )}
                    </span>
                `;

                button.addEventListener(
                    "click",
                    () =>
                        selectSchool(
                            school
                        )
                );

                schoolResults.appendChild(
                    button
                );
            }
        );

    } catch (error) {

        console.error(
            "[학교검색 오류]",
            error
        );

        schoolResults.innerHTML = `
            <div class="message error">
                학교 검색 중 오류가 발생했습니다.<br>
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}


// ==================================================
// 학교 선택
// ==================================================

async function selectSchool(
    school
) {

    console.log(
        "[학교선택]",
        school
    );

    selectedSchool = {

        code:
            Number(
                school.code
            ),

        name:
            school.name,

        region:
            school.region || "",

        officeCode:
            null,

        neisSchoolCode:
            null
    };

    if (schoolNameEl) {

        schoolNameEl.textContent =
            selectedSchool.name;
    }

    if (schoolInfoEl) {

        schoolInfoEl.textContent =
            `${selectedSchool.region || "학교"} · 학교 선택 완료`;
    }

    if (schoolResults) {

        schoolResults.innerHTML = `
            <div class="message">
                <strong>
                    ${escapeHtml(
                        selectedSchool.name
                    )}
                </strong>
                학교를 선택했습니다.
            </div>
        `;
    }

    localStorage.setItem(
        "comtime_selected_school",
        JSON.stringify(
            selectedSchool
        )
    );

    await loadTimetable();

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

        if (timetableGrid) {

            timetableGrid.innerHTML = `
                <div class="message">
                    학교를 먼저 선택해주세요.
                </div>
            `;
        }

        return;
    }

    const grade =
        Number(
            gradeSelect?.value || 1
        );

    const classNum =
        Number(
            classSelect?.value || 1
        );

    if (timetableGrid) {

        timetableGrid.innerHTML = `
            <div class="message">
                시간표를 불러오는 중...
            </div>
        `;
    }

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

        console.log(
            "[시간표 응답]",
            data
        );

        if (
            !response.ok ||
            !data.ok
        ) {

            throw new Error(
                data.message ||
                "시간표를 가져오지 못했습니다."
            );
        }

        currentTimetable =
            data.timetable;

        renderTimetable(
            currentTimetable
        );

        updateCurrentClass();

    } catch (error) {

        console.error(
            "[시간표 오류]",
            error
        );

        if (timetableGrid) {

            timetableGrid.innerHTML = `
                <div class="message error">
                    시간표를 불러오지 못했습니다.<br>
                    ${escapeHtml(
                        error.message
                    )}
                </div>
            `;
        }

        currentTimetable =
            null;

        if (currentSubjectEl) {

            currentSubjectEl.textContent =
                "시간표를 불러오지 못했습니다.";
        }

        if (currentTeacherEl) {

            currentTeacherEl.textContent =
                "-";
        }

        if (nextSubjectEl) {

            nextSubjectEl.textContent =
                "-";
        }
    }
}


// ==================================================
// 오늘 시간표
// ==================================================

function getTodayItems() {

    if (!currentTimetable) {
        return [];
    }

    if (
        Array.isArray(
            currentTimetable
        )
    ) {

        const dayIndex =
            getKoreanDayIndex();

        const dayData =
            currentTimetable[
                dayIndex
            ];

        if (dayData) {

            if (
                Array.isArray(
                    dayData.items
                )
            ) {

                return dayData.items;
            }

            if (
                Array.isArray(
                    dayData
                )
            ) {

                return dayData;
            }
        }

        if (
            currentTimetable.length > 0 &&
            currentTimetable[0]?.subject !==
                undefined
        ) {

            return currentTimetable;
        }
    }

    return [];
}


// ==================================================
// 오늘 요일
// ==================================================

function getKoreanDayIndex() {

    const now =
        new Date();

    const koreaString =
        now.toLocaleString(
            "en-US",
            {
                timeZone:
                    "Asia/Seoul"
            }
        );

    const koreaDate =
        new Date(
            koreaString
        );

    const day =
        koreaDate.getDay();

    if (day === 0) {
        return -1;
    }

    return day - 1;
}


// ==================================================
// 과목
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
// 선생님
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
// 시간표 표시
// ==================================================

function renderTimetable(
    timetable
) {

    if (!timetableGrid) {
        return;
    }

    if (
        !Array.isArray(
            timetable
        )
    ) {

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

    timetableGrid.innerHTML =
        "";

    timetable.forEach(
        (
            dayData,
            dayIndex
        ) => {

            if (!dayData) {
                return;
            }

            const items =
                Array.isArray(
                    dayData.items
                )
                    ? dayData.items
                    : Array.isArray(
                        dayData
                    )
                        ? dayData
                        : [];

            if (
                items.length === 0
            ) {
                return;
            }

            const dayColumn =
                document.createElement(
                    "div"
                );

            dayColumn.className =
                "day-column";

            const dayTitle =
                document.createElement(
                    "div"
                );

            dayTitle.className =
                "day-title";

            dayTitle.textContent =
                dayNames[
                    dayIndex
                ] ||
                `${dayIndex + 1}일`;

            dayColumn.appendChild(
                dayTitle
            );

            items.forEach(
                (
                    item,
                    index
                ) => {

                    const subject =
                        getSubject(
                            item
                        );

                    const teacher =
                        getTeacher(
                            item
                        );

                    const card =
                        document.createElement(
                            "div"
                        );

                    card.className =
                        "lesson-card";

                    card.innerHTML = `
                        <span class="period">
                            ${index + 1}교시
                        </span>

                        <strong>
                            ${escapeHtml(
                                subject
                            )}
                        </strong>

                        ${
                            teacher
                                ? `<small>${escapeHtml(
                                    teacher
                                )}</small>`
                                : ""
                        }
                    `;

                    dayColumn.appendChild(
                        card
                    );
                }
            );

            timetableGrid.appendChild(
                dayColumn
            );
        }
    );

    if (
        !timetableGrid.children.length
    ) {

        timetableGrid.innerHTML = `
            <div class="message">
                표시할 시간표가 없습니다.
            </div>
        `;
    }
}


// ==================================================
// 교시
// ==================================================

const PERIODS = [
    { period:1, start:"08:50", end:"09:35" },
    { period:2, start:"09:45", end:"10:30" },
    { period:3, start:"10:40", end:"11:25" },
    { period:4, start:"11:35", end:"12:20" },
    { period:5, start:"13:20", end:"14:05" },
    { period:6, start:"14:15", end:"15:00" },
    { period:7, start:"15:10", end:"15:55" },
];


// ==================================================
// 시간 → 분
// ==================================================

function timeToMinutes(
    time
) {

    const [
        hour,
        minute
    ] =
        time
            .split(":")
            .map(Number);

    return (
        hour * 60 +
        minute
    );
}


// ==================================================
// 현재 한국 시간
// ==================================================

function getCurrentMinutes() {

    const now =
        new Date();

    const koreaTime =
        now.toLocaleTimeString(
            "en-US",
            {
                timeZone:
                    "Asia/Seoul",

                hour12:
                    false,

                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        );

    const [
        hour,
        minute
    ] =
        koreaTime
            .split(":")
            .map(Number);

    return (
        hour * 60 +
        minute
    );
}


// ==================================================
// 현재 수업
// ==================================================

function getNextSchoolDayInfo(){
    const now=new Date();
    const day=now.getDay();
    const labels=["일","월","화","수","목","금","토"];
    let daysAhead=day===6?2:day===0?1:0;
    if(daysAhead===0)return null;
    const first=PERIODS[0];
    const koreaNow=new Date(now.toLocaleString("en-US",{timeZone:"Asia/Seoul"}));
    const target=new Date(koreaNow); target.setDate(target.getDate()+daysAhead);
    const [hh,mm]=first.start.split(":").map(Number);
    target.setHours(hh,mm,0,0);
    const diff=Math.max(0,target-koreaNow);
    const totalMinutes=Math.floor(diff/60000);
    const days=Math.floor(totalMinutes/1440);
    const hours=Math.floor((totalMinutes%1440)/60);
    const mins=totalMinutes%60;
    const parts=[]; if(days)parts.push(`${days}일`); if(hours)parts.push(`${hours}시간`); if(mins||!parts.length)parts.push(`${mins}분`);
    return {day:labels[target.getDay()],start:first.start,remaining:parts.join(" ")};
}

function renderWeekendInfo(){
    if(!weekendScheduleInfoEl)return;
    const info=getNextSchoolDayInfo();
    if(!info){weekendScheduleInfoEl.innerHTML="";return;}
    weekendScheduleInfoEl.innerHTML=`<span>다음 수업</span><strong>${info.day}요일 ${info.start} 첫 수업</strong><small>${escapeHtml(info.remaining)} 뒤 시작</small>`;
}

function updateCurrentClass() {

    if (
        !selectedSchool ||
        !currentTimetable
    ) {

        if (currentSubjectEl) {

            currentSubjectEl.textContent =
                "학교를 선택해주세요";
        }

        if (currentTeacherEl) {

            currentTeacherEl.textContent =
                "-";
        }

        if (nextSubjectEl) {

            nextSubjectEl.textContent =
                "-";
        }

        return;
    }

    const dayIndex =
        getKoreanDayIndex();

    if (
        dayIndex < 0 ||
        dayIndex > 4
    ) {

        currentSubjectEl.textContent = "주말입니다";
        currentTeacherEl.textContent = "즐거운 주말 보내세요";
        nextSubjectEl.textContent = "다음 수업";
        renderWeekendInfo();
        return;
    }

    if(weekendScheduleInfoEl) weekendScheduleInfoEl.innerHTML="";

    const todayItems =
        getTodayItems();

    const nowMinutes =
        getCurrentMinutes();

    let currentPeriod =
        null;

    let nextPeriod =
        null;

    for (
        let i = 0;
        i < PERIODS.length;
        i++
    ) {

        const period =
            PERIODS[i];

        const start =
            timeToMinutes(
                period.start
            );

        const end =
            timeToMinutes(
                period.end
            );

        if (
            nowMinutes >= start &&
            nowMinutes <= end
        ) {

            currentPeriod =
                period;

            nextPeriod =
                PERIODS[
                    i + 1
                ] ||
                null;

            break;
        }

        if (
            nowMinutes < start &&
            !nextPeriod
        ) {

            nextPeriod =
                period;
        }
    }


    if (currentPeriod) {

        const item =
            todayItems[
                currentPeriod.period - 1
            ];

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
            timeToMinutes(
                currentPeriod.end
            ) -
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
                ? `${getSubject(
                    todayItems[
                        nextPeriod.period - 1
                    ]
                )} · 다음`
                : "오늘 마지막 수업";

        const nextContainer =
            document.querySelector(
                ".next"
            );

        if (nextContainer) {

            nextContainer.innerHTML = `
                현재 수업 종료까지
                <strong>
                    ${escapeHtml(
                        remainText
                    )}
                </strong>
            `;
        }

        return;
    }


    if (nextPeriod) {

        const item =
            todayItems[
                nextPeriod.period - 1
            ];

        const subject =
            getSubject(item);

        const remain =
            timeToMinutes(
                nextPeriod.start
            ) -
            nowMinutes;

        currentSubjectEl.textContent =
            "쉬는 시간";

        currentTeacherEl.textContent =
            "다음 수업 준비하세요";

        nextSubjectEl.textContent =
            `${nextPeriod.period}교시 ${subject}`;

        const nextContainer =
            document.querySelector(
                ".next"
            );

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


    currentSubjectEl.textContent =
        "오늘 수업 끝";

    currentTeacherEl.textContent =
        "수고하셨습니다";

    nextSubjectEl.textContent =
        "내일 수업";

    const nextContainer =
        document.querySelector(
            ".next"
        );

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

        if (
            !response.ok ||
            !data.ok
        ) {

            throw new Error(
                data.message ||
                "NEIS 학교 검색 실패"
            );
        }

        const schools =
            data.schools || [];

        if (
            schools.length === 0
        ) {

            console.warn(
                "[NEIS] 학교를 찾지 못함"
            );

            return null;
        }

        let found =
            schools.find(
                school =>
                    school.schoolName ===
                    selectedSchool.name
            );

        if (!found) {

            found =
                schools[0];
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

        localStorage.setItem(
            "comtime_selected_school",
            JSON.stringify(
                selectedSchool
            )
        );

        if (schoolInfoEl) {

            schoolInfoEl.textContent =
                `${selectedSchool.region || ""} · ${
                    found.schoolType ||
                    "학교"
                }`;
        }

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
// 급식
// ==================================================

async function loadMeal() {

    if (!selectedSchool) {

        if (mealBox) {

            mealBox.innerHTML = `
                <div class="message">
                    학교를 먼저 선택해주세요.
                </div>
            `;
        }

        return;
    }

    if (mealBox) {

        mealBox.innerHTML = `
            <div class="message">
                급식 정보를 불러오는 중...
            </div>
        `;
    }

    try {

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
                .replaceAll(
                    "-",
                    ""
                );

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
            `&date=${encodeURIComponent(
                date
            )}`;

        const response =
            await fetch(url);

        const data =
            await response.json();

        console.log(
            "[급식 응답]",
            data
        );

        if (
            !response.ok ||
            !data.ok
        ) {

            throw new Error(
                data.message ||
                "급식 정보를 가져오지 못했습니다."
            );
        }

        renderMeal(
            data.meals || []
        );

    } catch (error) {

        console.error(
            "[급식 오류]",
            error
        );

        if (mealBox) {

            mealBox.innerHTML = `
                <div class="message error">
                    급식을 불러오지 못했습니다.<br>
                    ${escapeHtml(
                        error.message
                    )}
                </div>
            `;
        }
    }
}


// ==================================================
// 급식 표시
// ==================================================

function renderMeal(
    meals
) {

    if (!mealBox) {
        return;
    }

    if (
        !meals ||
        meals.length === 0
    ) {

        mealBox.innerHTML = `
            <div class="message">
                오늘 등록된 급식이 없습니다.
            </div>
        `;

        return;
    }

    mealBox.innerHTML =
        "";

    meals.forEach(
        meal => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "meal-card";

            const menu =
                String(
                    meal.menu || ""
                )
                    .replaceAll(
                        "<br/>",
                        "\n"
                    )
                    .replaceAll(
                        "<br>",
                        "\n"
                    )
                    .replaceAll(
                        "<br />",
                        "\n"
                    );

            const menuItems =
                menu
                    .split("\n")
                    .map(
                        item =>
                            item.trim()
                    )
                    .filter(Boolean);

            card.innerHTML = `
                <div class="meal-type">
                    ${escapeHtml(
                        meal.mealType ||
                        "급식"
                    )}
                </div>

                <div class="meal-menu">
                    ${
                        menuItems.length
                            ? menuItems
                                .map(
                                    item =>
                                        `<div>• ${escapeHtml(
                                            item
                                        )}</div>`
                                )
                                .join("")
                            : `<div>
                                급식 메뉴 정보 없음
                              </div>`
                    }
                </div>

                ${
                    meal.calories
                        ? `
                            <div class="meal-calories">
                                ${escapeHtml(
                                    meal.calories
                                )}
                            </div>
                        `
                        : ""
                }
            `;

            mealBox.appendChild(
                card
            );
        }
    );
}


// ==================================================
// 검색 버튼
// ==================================================

if (schoolSearchBtn) {

    schoolSearchBtn.addEventListener(
        "click",
        searchSchool
    );
}


// ==================================================
// 엔터 검색
// ==================================================

if (schoolInput) {

    schoolInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                searchSchool();
            }
        }
    );
}


// ==================================================
// 학년 변경
// ==================================================

if (gradeSelect) {

    gradeSelect.addEventListener(
        "change",
        () => {

            if (selectedSchool) {

                loadTimetable();
            }
        }
    );
}


// ==================================================
// 반 변경
// ==================================================

if (classSelect) {

    classSelect.addEventListener(
        "change",
        () => {

            if (selectedSchool) {

                loadTimetable();
            }
        }
    );
}


// ==================================================
// 저장 학교 복구
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

        if (
            !school ||
            !school.code
        ) {

            return;
        }

        console.log(
            "[저장 학교 복구]",
            school
        );

        selectedSchool =
            school;

        if (schoolNameEl) {

            schoolNameEl.textContent =
                school.name;
        }

        if (schoolInfoEl) {

            schoolInfoEl.textContent =
                `${school.region || ""} · 저장된 학교`;
        }

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
// GAME HUB / ARCADE
// ==================================================

function openGameHub() {
    if (!gameHubModal) {
        if (typeof openSurvivalGame === "function") openSurvivalGame();
        return;
    }
    gameHubModal.classList.add("active");
    gameHubModal.setAttribute("aria-hidden", "false");
    lockPageScroll();
}

function closeGameHub() {
    if (!gameHubModal) return;
    gameHubModal.classList.remove("active");
    gameHubModal.setAttribute("aria-hidden", "true");
    unlockPageScroll();
}


// ==================================================
// WORM ARENA — REALTIME MULTIPLAYER
// ==================================================
let wormSocket = null;
let wormState = null;
let wormRunning = false;
let wormBoosting = false;
let wormAim = { x: 1, y: 0 };
let wormJoystickActive = false;
let wormJoystickPointer = null;
let wormLastFrame = 0;
let wormLastInputAt = 0;
let wormLastMinimapAt = 0;
let wormJoinWatchdog = null;
let wormLastServerState = 0;
let wormParticles = [];
let wormCamera = {x:2600,y:2600,zoom:1};
let wormLocalMode = false;
let wormLocalLast = performance.now();
let wormBestMass = Number(localStorage.getItem('comtime_worm_best_mass') || 0);

function wormResizeCanvas(){
    if (!wormGameCanvas) return;
    const rect = wormGameCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    wormGameCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
    wormGameCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
}

let wormMinimapCanvas=null;
let wormMinimapCtx=null;
function wormEnsureMinimap(){
    if(!wormGameModal) return;
    if(wormMinimapCanvas && wormMinimapCanvas.isConnected) return;
    const stage=wormGameModal.querySelector('.worm-stage');
    if(!stage) return;
    wormMinimapCanvas=document.createElement('canvas');
    wormMinimapCanvas.className='worm-minimap';
    wormMinimapCanvas.width=180; wormMinimapCanvas.height=180;
    wormMinimapCanvas.setAttribute('aria-label','웜 아레나 미니맵');
    wormMinimapCtx=wormMinimapCanvas.getContext('2d',{alpha:true});
    stage.appendChild(wormMinimapCanvas);
}
function wormDrawMinimap(state,me){
    wormEnsureMinimap();
    const c=wormMinimapCanvas,ctx=wormMinimapCtx;
    if(!c||!ctx||!state)return;
    const size=c.clientWidth||180;
    const dpr=Math.min(window.devicePixelRatio||1,1.5);
    if(c.width!==Math.floor(size*dpr)||c.height!==Math.floor(size*dpr)){c.width=Math.floor(size*dpr);c.height=Math.floor(size*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,size,size);
    ctx.fillStyle='rgba(3,12,8,.78)';ctx.fillRect(0,0,size,size);
    ctx.strokeStyle='rgba(126,255,196,.28)';ctx.lineWidth=1;ctx.strokeRect(.5,.5,size-1,size-1);
    const pad=8,inner=size-pad*2,scale=inner/state.world;
    for(const p of state.players||[]){
        const x=pad+p.x*scale,y=pad+p.y*scale;
        const mine=p.id===state.me;
        ctx.beginPath();ctx.arc(x,y,mine?4:3,0,Math.PI*2);
        ctx.fillStyle=mine?'#45f59b':'#ff465f';ctx.shadowBlur=mine?7:3;ctx.shadowColor=ctx.fillStyle;ctx.fill();ctx.shadowBlur=0;
    }
    if(me){ctx.strokeStyle='rgba(69,245,155,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(pad+me.x*scale,pad+me.y*scale,7,0,Math.PI*2);ctx.stroke();}
}

function wormOpen(){
    if (!wormGameModal) return;
    wormGameModal.classList.add('active');
    wormGameModal.classList.remove('worm-live');
    wormGameModal.setAttribute('aria-hidden','false');
    wormCenterMessage.hidden = false;
    wormDeathPanel.hidden = true;
    wormRunning = false;
    wormLocalMode = false;
    wormState = null;
    wormResizeCanvas();
    wormEnsureMinimap();
    lockPageScroll();
    wormDrawIntro();
    wormPendingJoinName = (wormNickname?.value || 'Player').trim().slice(0,14) || 'Player';
}

function wormClose(){
    if (!wormGameModal) return;
    wormRunning = false;
    wormBoosting = false;
    wormLocalMode = false;
    clearTimeout(wormJoinWatchdog);
    if (wormSocket){
        try { wormSocket.emit('worm:leave'); } catch {}
        wormSocket.disconnect();
        wormSocket = null;
    }
    wormGameModal.classList.remove('active','worm-live');
    wormGameModal.setAttribute('aria-hidden','true');
    unlockPageScroll();
}

function wormDrawIntro(){
    if (!wormGameCanvas) return;
    wormResizeCanvas();
    const ctx=wormGameCanvas.getContext('2d');
    const dpr=Math.min(window.devicePixelRatio||1,1.5);
    const w=wormGameCanvas.width,h=wormGameCanvas.height;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,w,h);
    const g=ctx.createRadialGradient(w*.5,h*.45,0,w*.5,h*.5,Math.max(w,h)*.75);
    g.addColorStop(0,'#0d2419'); g.addColorStop(.48,'#07130e'); g.addColorStop(1,'#020604');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    ctx.save(); ctx.scale(dpr,dpr);
    const vw=w/dpr,vh=h/dpr;
    ctx.strokeStyle='rgba(100,255,180,.055)'; ctx.lineWidth=1;
    const step=72;
    for(let x=0;x<vw;x+=step){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,vh);ctx.stroke();}
    for(let y=0;y<vh;y+=step){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(vw,y);ctx.stroke();}
    ctx.restore();
}

let wormPendingJoinName = null;
let wormJoinSent = false;

function wormStartLocalPractice(){
    wormLocalMode=true;
    wormRunning=true;
    wormCenterMessage.hidden=true;
    wormDeathPanel.hidden=true;
    if(wormPingEl) wormPingEl.textContent='PRACTICE';
    const meId='local-player';
    const me={id:meId,nickname:(wormPendingJoinName||'Player'),x:2600,y:2600,mass:18,length:12,radius:15,color:'#58f5a6',dirX:wormAim.x,dirY:wormAim.y,isBot:false,segments:[],trail:[]};
    wormState={world:5200,me:meId,food:[],players:[me],local:true};
    for(let i=0;i<9;i++){
        const a=i/9*Math.PI*2;
        wormState.players.push({id:`local-bot-${i}`,nickname:['NOVA','MINT','PIXEL','VOLT','MOSS','LUNA','BYTE','ECHO','RUSH'][i],x:2600+Math.cos(a)*900,y:2600+Math.sin(a)*700,mass:22+i*4,length:14+i,radius:16,color:['#61b6ff','#ff7197','#ffd35a','#a989ff','#42dfca','#ff9a5c','#f26bff','#9ee15a','#6dd5ed'][i],dirX:-Math.sin(a),dirY:Math.cos(a),isBot:true,segments:[]});
    }
    for(let i=0;i<420;i++){
        const a=Math.random()*Math.PI*2, r=200+Math.sqrt(Math.random())*2200;
        wormState.food.push({id:i,x:2600+Math.cos(a)*r,y:2600+Math.sin(a)*r*.78,r:3+Math.random()*3,value:1+Math.random()<.08?3:1,color:['#65ffb0','#ffdf63','#66c7ff','#ff78bd'][i%4]});
    }
    wormCamera={x:2600,y:2600,zoom:1};
    wormLocalLast=performance.now();
    if(wormPingEl) wormPingEl.textContent='PRACTICE · 10';
}

function wormJoinWhenConnected(){
    if (!wormSocket?.connected || !wormPendingJoinName || wormJoinSent) return;
    wormJoinSent = true;
    wormSocket.emit('worm:join', {nickname: wormPendingJoinName});
    if (wormPingEl) wormPingEl.textContent = 'JOINING';
    clearTimeout(wormJoinWatchdog);
    wormJoinWatchdog=setTimeout(()=>{
        if(!wormRunning || wormLastServerState===0){
            wormJoinSent=false;
            if(wormPingEl) wormPingEl.textContent='SERVER WAITING';
        }
    },1800);
}

function wormConnect(){
    if (wormSocket) return wormSocket;
    if (typeof window.io !== 'function') {
        if(wormPingEl) wormPingEl.textContent='SERVER ERROR';
        return null;
    }
    wormSocket = window.io(window.location.origin, {
        transports: ['websocket','polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 250,
        reconnectionDelayMax: 2200,
        timeout: 7000
    });
    wormSocket.on('connect', ()=>{
        if (wormPingEl) wormPingEl.textContent='CONNECTED';
        wormJoinWhenConnected();
    });
    wormSocket.on('worm:joined', ({id})=>{
        clearTimeout(wormJoinWatchdog);
        wormLocalMode=false;
        wormRunning=true;
        wormCenterMessage.hidden=true;
        wormDeathPanel.hidden=true;
        wormGameModal?.classList.add('worm-live');
        wormState=wormState||{};
        wormState.me=id;
        wormJoinSent=false;
        if(wormPingEl) wormPingEl.textContent='LIVE';
    });
    wormSocket.on('worm:state', state=>{
        wormLastServerState=performance.now();
        wormLocalMode=false;
        wormState=state;
        wormRunning=true;
        wormCenterMessage.hidden=true;
        wormGameModal?.classList.add('worm-live');
        if(wormPingEl && wormPingEl.textContent.includes('WAITING')) wormPingEl.textContent='LIVE';
    });
    wormSocket.on('worm:died', ({mass=0,killer})=>{
        wormRunning=false; wormBoosting=false;
        wormJoinSent=false;
        clearTimeout(wormJoinWatchdog);
        wormDeathText.textContent=killer?`${killer}에게 길이 막혔습니다. 질량 ${Math.floor(mass)}.`:`질량 ${Math.floor(mass)}로 종료되었습니다.`;
        wormDeathPanel.hidden=false;
        wormGameModal?.classList.add('worm-live');
        wormBurst(wormCamera.x,wormCamera.y,'#ff5e7d',28);
    });
    wormSocket.on('connect_error', ()=>{
        if(wormPingEl) wormPingEl.textContent='RECONNECTING';
    });
    wormSocket.on('disconnect', ()=>{
        if(wormRunning && wormPingEl) wormPingEl.textContent='RECONNECTING';
    });
    wormSocket.on('reconnect', ()=>{
        wormJoinSent=false;
        if(wormPingEl) wormPingEl.textContent='CONNECTED';
        wormJoinWhenConnected();
    });
    wormSocket.on('worm:error', ({message})=>{
        wormJoinSent=false;
        wormRunning=false;
        wormLocalMode=false;
        wormGameModal?.classList.remove('worm-live');
        wormCenterMessage.hidden=false;
        if(wormPingEl) wormPingEl.textContent='SERVER ERROR';
        const panel=wormCenterMessage?.querySelector('.worm-start-panel p');
        if(panel && message) panel.innerHTML=wormEscapeHtml(message);
    });
    wormSocket.on('worm:ping', ({ms})=>{
        if(!wormLocalMode && wormPingEl) wormPingEl.textContent=`${Math.round(ms)}ms`;
    });
    return wormSocket;
}

function wormStart(){
    const name=(wormNickname?.value||'Player').trim().slice(0,14)||'Player';
    wormPendingJoinName=name;
    wormJoinSent=false;
    wormLastServerState=0;
    wormDeathPanel.hidden=true;
    wormLocalMode=false;
    wormRunning=false;
    if(wormPingEl) wormPingEl.textContent='CONNECTING';
    const socket=wormConnect();
    if(socket?.connected) wormJoinWhenConnected();
}

function wormSendInput(){
    if(wormLocalMode){
        const me=wormState?.players?.find(p=>p.id===wormState.me);
        if(me){me.dirX=wormAim.x;me.dirY=wormAim.y;}
        return;
    }
    if(!wormSocket?.connected || !wormRunning) return;
    const now=performance.now();
    if(now-wormLastInputAt<32) return;
    wormLastInputAt=now;
    wormSocket.emit('worm:input',{x:wormAim.x,y:wormAim.y,boost:wormBoosting});
}

function wormSetAimFromPointer(clientX,clientY){
    if(!wormGameCanvas)return;
    const r=wormGameCanvas.getBoundingClientRect();
    const x=clientX-r.left-r.width/2,y=clientY-r.top-r.height/2;
    const len=Math.hypot(x,y)||1;
    wormAim={x:x/len,y:y/len};
    wormSendInput();
}

function wormBurst(x,y,color,count=18){
    for(let i=0;i<count;i++){
        const a=Math.random()*Math.PI*2,s=25+Math.random()*100;
        wormParticles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.45+Math.random()*.6,max:.9,color,size:2+Math.random()*4});
    }
}

function wormUpdateLocal(now){
    if(!wormLocalMode||!wormState?.players)return;
    const dt=Math.min(.035,(now-wormLocalLast)/1000||0); wormLocalLast=now;
    const players=wormState.players;
    for(const p of players){
        if(p.id===wormState.me){
            const len=Math.hypot(p.dirX,p.dirY)||1;p.dirX/=len;p.dirY/=len;
            const speed=(p.mass>5&&wormBoosting)?255:175;
            if(wormBoosting&&p.mass>5)p.mass=Math.max(5,p.mass-dt*1.1);
            p.x+=p.dirX*speed*dt;p.y+=p.dirY*speed*dt;
            p.x=Math.max(90,Math.min(wormState.world-90,p.x));p.y=Math.max(90,Math.min(wormState.world-90,p.y));
        }else{
            const target=wormState.food[Math.floor(Math.random()*wormState.food.length)];
            if(target){const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy)||1;p.dirX=.985*p.dirX+.015*dx/d;p.dirY=.985*p.dirY+.015*dy/d;}
            const d=Math.hypot(p.dirX,p.dirY)||1;p.dirX/=d;p.dirY/=d;
            p.x+=p.dirX*125*dt;p.y+=p.dirY*125*dt;
            if(p.x<100||p.x>wormState.world-100)p.dirX*=-1;
            if(p.y<100||p.y>wormState.world-100)p.dirY*=-1;
        }
        p.radius=Math.min(30,11+Math.sqrt(p.mass)*.72);p.length=Math.floor(8+p.mass*.75);
        if(!p.trail)p.trail=[];p.trail.unshift({x:p.x,y:p.y});const keep=Math.min(220,Math.max(80,Math.floor(42+p.mass*1.55)));if(p.trail.length>keep)p.trail.length=keep;
        if(!p._segmentClock || now-p._segmentClock>=66){
            p._segmentClock=now; p.segments=[];const segCount=Math.min(72,Math.max(18,Math.floor(p.length*1.18)));let carry=0,prev=p.trail[0];p.segments.push({x:prev.x,y:prev.y});for(let i=1;i<p.trail.length&&p.segments.length<segCount;i++){const q=p.trail[i],dd=Math.hypot(q.x-prev.x,q.y-prev.y);carry+=dd;if(carry>=9){p.segments.push({x:q.x,y:q.y});carry=0;}prev=q;}
        }
    }
    const me=players.find(p=>p.id===wormState.me);
    if(me){for(let i=wormState.food.length-1;i>=0;i--){const f=wormState.food[i];if((me.x-f.x)**2+(me.y-f.y)**2<(me.radius+f.r+7)**2){me.mass+=f.value;wormBurst(f.x,f.y,f.color,4);wormState.food.splice(i,1);}}}
    while(wormState.food.length<280) wormState.food.push({id:Math.random(),x:Math.random()*wormState.world,y:Math.random()*wormState.world,r:3+Math.random()*3,value:1,color:['#65ffb0','#ffdf63','#66c7ff','#ff78bd'][Math.floor(Math.random()*4)]});
}

let wormRenderSorted=[];
let wormRenderStateRef=null;
let wormHudRenderAt=0;
function wormGetSortedPlayers(state,now){
    if(wormRenderStateRef!==state || now-wormHudRenderAt>250){
        wormRenderSorted=[...(state.players||[])].sort((a,b)=>(b.mass||0)-(a.mass||0));
        wormRenderStateRef=state;
        wormHudRenderAt=now;
    }
    return wormRenderSorted;
}

function wormRender(now){
    if(!wormGameCanvas)return;
    const ctx=wormGameCanvas.getContext('2d');
    const dpr=Math.min(window.devicePixelRatio||1,2);
    const w=wormGameCanvas.width,h=wormGameCanvas.height;
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);
    if(!wormState?.players){wormMinimapCanvas?.classList.remove("active");wormDrawIntro();requestAnimationFrame(wormRender);return;}
    if(wormLocalMode) wormUpdateLocal(now);
    const state=wormState;
    wormMinimapCanvas?.classList.toggle("active", !!state.players?.length && wormGameModal?.classList.contains("worm-live"));
    const me=state.players.find(p=>p.id===state.me)||state.players[0];
    if(me){wormCamera.x += (me.x-wormCamera.x)*.11;wormCamera.y += (me.y-wormCamera.y)*.11;wormCamera.zoom += (Math.max(.58,Math.min(1.05,1.04-(me.mass||10)/1600))-wormCamera.zoom)*.08;}
    wormParticles=wormParticles.filter(q=>q.life>0);
    for(const q of wormParticles){q.x+=q.vx*(1/60);q.y+=q.vy*(1/60);q.vx*=.97;q.vy*=.97;q.life-=1/60;}
    ctx.save();ctx.scale(dpr,dpr);const vw=w/dpr,vh=h/dpr;ctx.translate(vw/2,vh/2);ctx.scale(wormCamera.zoom,wormCamera.zoom);ctx.translate(-wormCamera.x,-wormCamera.y);
    ctx.fillStyle='#06100b';ctx.fillRect(0,0,state.world,state.world);
    const grid=100;const left=Math.max(0,wormCamera.x-vw/(2*wormCamera.zoom)-grid),right=Math.min(state.world,wormCamera.x+vw/(2*wormCamera.zoom)+grid),top=Math.max(0,wormCamera.y-vh/(2*wormCamera.zoom)-grid),bottom=Math.min(state.world,wormCamera.y+vh/(2*wormCamera.zoom)+grid);
    ctx.lineWidth=1;ctx.strokeStyle='rgba(107,255,177,.055)';for(let x=Math.floor(left/grid)*grid;x<=right;x+=grid){ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bottom);ctx.stroke();}for(let y=Math.floor(top/grid)*grid;y<=bottom;y+=grid){ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();}
    ctx.strokeStyle='rgba(82,255,170,.38)';ctx.lineWidth=8;ctx.shadowBlur=28;ctx.shadowColor='rgba(60,255,160,.2)';ctx.strokeRect(0,0,state.world,state.world);ctx.shadowBlur=0;
    for(const f of state.food||[]){const fd=(f.x-wormCamera.x)**2+(f.y-wormCamera.y)**2;if(fd>3000**2)continue;const rr=f.r;ctx.globalAlpha=.75;ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(f.x,f.y,rr,0,Math.PI*2);ctx.fill();}
    const sorted=wormGetSortedPlayers(state,now);
    for(const p of sorted){
        if(!p.segments?.length)continue;
        const seg=p.segments;
        ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();for(let i=0;i<seg.length;i++){const q=seg[i];if(i===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);}
        ctx.lineWidth=p.radius*2.12;ctx.strokeStyle=p.color;ctx.globalAlpha=.18;ctx.stroke();ctx.globalAlpha=1;ctx.lineWidth=p.radius*1.72;ctx.strokeStyle=p.color;ctx.stroke();
        const head=seg[0];ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(head.x,head.y,p.radius*1.08,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#fff';const px=-p.dirY*p.radius*.36,py=p.dirX*p.radius*.36;ctx.beginPath();ctx.arc(head.x+px,head.y+py,p.radius*.25,0,Math.PI*2);ctx.arc(head.x-px,head.y-py,p.radius*.25,0,Math.PI*2);ctx.fill();ctx.fillStyle='#07100c';ctx.beginPath();ctx.arc(head.x+px+p.dirX*p.radius*.07,head.y+py+p.dirY*p.radius*.07,p.radius*.105,0,Math.PI*2);ctx.arc(head.x-px+p.dirX*p.radius*.07,head.y-py+p.dirY*p.radius*.07,p.radius*.105,0,Math.PI*2);ctx.fill();
        const crownRank=sorted.indexOf(p);if(crownRank<3){ctx.font=`900 ${Math.max(18,p.radius*1.35)}px system-ui,sans-serif`;ctx.textAlign='center';ctx.fillStyle=['#ffd447','#dce5ef','#b9784e'][crownRank];ctx.shadowBlur=18;ctx.shadowColor=ctx.fillStyle;ctx.fillText('♛',head.x,head.y-p.radius*1.9);ctx.shadowBlur=0;}
        if(p.id===state.me){ctx.font=`800 ${Math.max(11,p.radius*1.05)}px system-ui,sans-serif`;ctx.textAlign='center';ctx.fillStyle='rgba(240,255,248,.96)';ctx.shadowBlur=10;ctx.shadowColor='#000';ctx.fillText(p.nickname,head.x,head.y-p.radius*2.15);ctx.shadowBlur=0;}
    }
    for(const q of wormParticles){ctx.globalAlpha=Math.max(0,q.life/q.max);ctx.fillStyle=q.color;ctx.beginPath();ctx.arc(q.x,q.y,q.size,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;ctx.restore();
    if(now-wormLastMinimapAt>100){wormLastMinimapAt=now;wormDrawMinimap(state,me);}
    // HUD
    if(wormMassEl)wormMassEl.textContent=Math.floor(me?.mass||0);
    if(me&&me.mass>wormBestMass){wormBestMass=me.mass;localStorage.setItem('comtime_worm_best_mass',String(Math.floor(wormBestMass)));}
    if(wormLengthEl)wormLengthEl.textContent=Math.floor(me?.length||0);
    if(wormOnlineCountEl){const humans=(state.players||[]).filter(p=>!p.isBot).length;wormOnlineCountEl.textContent=`${humans} ONLINE · ${state.players.length} IN ARENA`;}
    if(wormLeaderboardEl && now-wormLeaderboardEl._renderedAt>500){wormLeaderboardEl._renderedAt=now;const top=(Array.isArray(state.leaderboard)&&state.leaderboard.length?state.leaderboard:sorted).slice(0,8);wormLeaderboardEl.innerHTML='<div class="worm-leader-title">TOP PLAYERS · BEST '+Math.floor(wormBestMass)+'</div>'+top.map((p,i)=>`<div class="worm-row rank-${i+1} ${p.id===state.me?"is-me":""}"><span class="rank">${i<3?'♛':i+1}</span><span class="dot" style="background:${p.color}"></span><span class="name">${wormEscapeHtml(p.nickname)}${p.id===state.me?" <b>YOU</b>":""}</span><span class="mass">${Math.floor(p.mass)}</span></div>`).join('');}
    requestAnimationFrame(wormRender);
}

function wormEscapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]));}

if(wormGameModal){
    window.addEventListener("resize",wormResizeCanvas);
    wormStartBtn?.addEventListener("click",wormStart);
    wormStartBtn?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();wormStart();}});
    window.addEventListener("keydown",e=>{
        if(e.key==="Enter" && wormGameModal.classList.contains("active")){
            if(wormDeathPanel && !wormDeathPanel.hidden){
                e.preventDefault();
                wormDeathPanel.hidden=true;
                wormStart();
                return;
            }
            if(!wormGameModal.classList.contains("worm-live") && wormCenterMessage && !wormCenterMessage.hidden){
                e.preventDefault();
                wormStart();
            }
        }
    });
    wormRestartBtn?.addEventListener("click",()=>{wormDeathPanel.hidden=true;wormStart();});
    closeWormGameBtn?.addEventListener("click",wormClose);
    closeWormStageBtn?.addEventListener("click",wormClose);
    wormGameBackdrop?.addEventListener("click",wormClose);
    wormGameCanvas?.addEventListener("pointermove",e=>{ if(e.pointerType!=="touch") wormSetAimFromPointer(e.clientX,e.clientY); });
    wormGameCanvas?.addEventListener("pointerdown",e=>{ if(e.pointerType!=="touch"){wormBoosting=true;wormBoostBtn?.classList.add("active");wormSendInput();} });
    wormGameCanvas?.addEventListener("pointerup",()=>{wormBoosting=false;wormBoostBtn?.classList.remove("active");wormSendInput();});
    wormGameCanvas?.addEventListener("pointerleave",()=>{wormBoosting=false;wormBoostBtn?.classList.remove("active");wormSendInput();});
    window.addEventListener("keydown",e=>{if(e.code==="Space" && wormGameModal.classList.contains("active")){e.preventDefault();wormBoosting=true;wormBoostBtn?.classList.add("active");wormSendInput();}});
    window.addEventListener("keyup",e=>{if(e.code==="Space"){wormBoosting=false;wormBoostBtn?.classList.remove("active");wormSendInput();}});
    wormBoostBtn?.addEventListener("pointerdown",e=>{e.preventDefault();wormBoosting=true;wormBoostBtn.classList.add("active");wormSendInput();});
    wormBoostBtn?.addEventListener("pointerup",e=>{e.preventDefault();wormBoosting=false;wormBoostBtn.classList.remove("active");wormSendInput();});
    wormJoystick?.addEventListener("pointerdown",e=>{e.preventDefault();wormJoystickActive=true;wormJoystickPointer=e.pointerId;wormJoystick.setPointerCapture(e.pointerId);});
    wormJoystick?.addEventListener("pointermove",e=>{if(!wormJoystickActive||e.pointerId!==wormJoystickPointer)return;const r=wormJoystick.getBoundingClientRect();let x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2);const m=Math.hypot(x,y)||1;const max=r.width*.34;const k=Math.min(1,max/m);x*=k;y*=k;wormStick.style.transform=`translate(${x}px,${y}px)`;const n=Math.hypot(x,y)||1;wormAim={x:x/n,y:y/n};wormSendInput();});
    const joyEnd=e=>{if(e.pointerId!==wormJoystickPointer)return;wormJoystickActive=false;wormJoystickPointer=null;wormStick.style.transform="translate(0,0)";};
    wormJoystick?.addEventListener("pointerup",joyEnd);wormJoystick?.addEventListener("pointercancel",joyEnd);
    requestAnimationFrame(wormRender);
}

// ==================================================
// ==================================================
// BIRD BUMP GAME
// ==================================================
// ==================================================


// ==================================================
// 게임 상태
// ==================================================

let birdGameRunning =
    false;

let birdGameOver =
    false;

let birdAnimationId =
    null;

let birdLastTime =
    0;

let birdScore =
    0;

let birdBestScore =
    Number(
        localStorage.getItem(
            "bird_bump_best"
        ) || 0
    );

let birdWorldWidth =
    900;

let birdWorldHeight =
    520;

let birdScale =
    1;


// ==================================================
// 게임 지형 설정
// ==================================================

// 화면 아래쪽으로 확실하게 내림
const BIRD_GROUND_RATIO =
    0.84;


// 천장
const BIRD_CEILING =
    0;


// ==================================================
// 난이도 설정
// ==================================================

const BIRD_DIFFICULTY = {

    // 기본 속도
    baseSpeed:
        255,

    // 최대 속도
    maxSpeed:
        440,

    // 점수당 속도 증가
    speedPerScore:
        3.8,

    // 기본 통로 크기
    baseGap:
        205,

    // 점수당 통로 감소
    gapShrinkPerScore:
        1.45,

    // 절대 최소 통로
    minGap:
        142,

    // 장애물 기본 폭
    obstacleWidth:
        70,

    // 첫 장애물까지 여유
    firstObstacleDelay:
        1.35,

    // 기본 장애물 간격
    baseObstacleInterval:
        1.52,

    // 점수당 간격 감소
    obstacleIntervalDecrease:
        0.010,

    // 최소 장애물 간격
    minObstacleInterval:
        0.92,

    // 장애물이 움직이기 시작하는 점수
    movingStartScore:
        10,

    // 움직임이 강해지기 시작하는 점수
    hardStartScore:
        20,

    // 이동폭 기본값
    baseMoveRange:
        18,

    // 이동폭 증가
    moveRangePerScore:
        1.6,

    // 장애물 상하 이동속도
    baseMoveSpeed:
        30,

    // 이동속도 증가
    moveSpeedPerScore:
        1.1,

    // 위쪽 최소 여백
    topMargin:
        58,

    // 땅 위 최소 여백
    bottomMargin:
        48
};


// ==================================================
// 게임 객체
// ==================================================

const birdPlayer = {

    x:
        150,

    y:
        240,

    width:
        38,

    height:
        30,

    velocityY:
        0,

    gravity:
        1450,

    jumpPower:
        -470,

    rotation:
        0
};


let birdObstacles = [];

let birdClouds = [];

let birdParticles = [];

let birdObstacleTimer =
    0;

let birdCloudTimer =
    0;

let birdDistance =
    0;

let birdSpeed =
    BIRD_DIFFICULTY.baseSpeed;


// ==================================================
// Canvas
// ==================================================

const birdCtx =
    birdGameCanvas
        ? birdGameCanvas.getContext(
            "2d"
        )
        : null;


// ==================================================
// Canvas 크기
// ==================================================

function resizeBirdCanvas() {

    if (
        !birdGameCanvas ||
        !birdGameContainer ||
        !birdCtx
    ) {

        return;
    }

    const rect =
        birdGameContainer.getBoundingClientRect();

    const width =
        Math.max(
            320,
            rect.width
        );

    const height =
        Math.max(
            400,
            rect.height
        );

    const dpr =
        Math.min(
            window.devicePixelRatio ||
            1,
            2
        );

    birdGameCanvas.width =
        Math.floor(
            width * dpr
        );

    birdGameCanvas.height =
        Math.floor(
            height * dpr
        );

    birdGameCanvas.style.width =
        `${width}px`;

    birdGameCanvas.style.height =
        `${height}px`;

    birdCtx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    birdWorldWidth =
        width;

    birdWorldHeight =
        height;

    birdScale =
        Math.max(
            0.72,
            Math.min(
                1.15,
                width / 800
            )
        );
}


window.addEventListener(
    "resize",
    resizeBirdCanvas
);


// ==================================================
// 실제 땅 위치
// ==================================================

function getBirdGroundY() {

    return (
        birdWorldHeight *
        BIRD_GROUND_RATIO
    );
}


// ==================================================
// 점수 표시
// ==================================================

function updateBirdScore() {

    if (birdScoreEl) {

        birdScoreEl.textContent =
            birdScore;
    }

    if (birdBestEl) {

        birdBestEl.textContent =
            birdBestScore;
    }
}


// ==================================================
// 난이도 표시용
// ==================================================

function getBirdDifficultyLevel() {

    if (
        birdScore >=
        BIRD_DIFFICULTY.hardStartScore
    ) {

        return "HARD";
    }

    if (
        birdScore >=
        BIRD_DIFFICULTY.movingStartScore
    ) {

        return "MOVING";
    }

    return "NORMAL";
}


// ==================================================
// 게임 초기화
// ==================================================

function resetBirdGame() {

    birdGameRunning =
        false;

    birdGameOver =
        false;

    birdLastTime =
        0;

    birdScore =
        0;

    birdObstacleTimer =
        0;

    birdCloudTimer =
        0;

    birdDistance =
        0;

    birdSpeed =
        BIRD_DIFFICULTY.baseSpeed;

    birdPlayer.x =
        Math.max(
            110,
            birdWorldWidth * 0.20
        );

    birdPlayer.y =
        birdWorldHeight * 0.38;

    birdPlayer.velocityY =
        0;

    birdPlayer.rotation =
        0;

    birdObstacles =
        [];

    birdClouds =
        [];

    birdParticles =
        [];

    createInitialBirdClouds();

    updateBirdScore();
}


// ==================================================
// 구름 생성
// ==================================================

function createInitialBirdClouds() {

    birdClouds = [];

    for (
        let i = 0;
        i < 7;
        i++
    ) {

        birdClouds.push({

            x:
                Math.random() *
                birdWorldWidth,

            y:
                55 +
                Math.random() *
                170,

            width:
                60 +
                Math.random() *
                90,

            speed:
                12 +
                Math.random() *
                22,

            opacity:
                0.35 +
                Math.random() *
                0.3
        });
    }
}


// ==================================================
// 점프
// ==================================================

function birdJump() {

    if (
        !birdGameRunning ||
        birdGameOver
    ) {

        return;
    }

    birdPlayer.velocityY =
        birdPlayer.jumpPower;

    createBirdJumpParticles();
}


// ==================================================
// 시작
// ==================================================

function startBirdGame() {

    if (!birdGameCanvas) {
        return;
    }

    resizeBirdCanvas();

    resetBirdGame();

    birdGameRunning =
        true;

    birdGameOver =
        false;

    if (birdStartScreen) {

        birdStartScreen.classList.add(
            "hidden"
        );
    }

    if (birdGameOverScreen) {

        birdGameOverScreen.classList.add(
            "hidden"
        );
    }

    if (birdControlHint) {

        birdControlHint.textContent =
            "클릭 또는 SPACE";
    }

    birdPlayer.velocityY =
        birdPlayer.jumpPower;

    birdLastTime =
        performance.now();

    birdAnimationId =
        requestAnimationFrame(
            birdGameLoop
        );

    console.log(
        "[Bird Bump] 게임 시작"
    );
}


// ==================================================
// 게임 오버
// ==================================================

function endBirdGame() {

    if (birdGameOver) {
        return;
    }

    birdGameRunning =
        false;

    birdGameOver =
        true;

    if (birdAnimationId) {

        cancelAnimationFrame(
            birdAnimationId
        );

        birdAnimationId =
            null;
    }

    createExplosionParticles();

    const oldBest =
        birdBestScore;

    if (
        birdScore >
        birdBestScore
    ) {

        birdBestScore =
            birdScore;

        localStorage.setItem(
            "bird_bump_best",
            String(
                birdBestScore
            )
        );
    }

    updateBirdScore();

    if (birdFinalScoreEl) {

        birdFinalScoreEl.textContent =
            birdScore;
    }

    if (birdNewBestEl) {

        if (
            birdScore > oldBest
        ) {

            birdNewBestEl.textContent =
                "새로운 최고 기록!";
        } else {

            birdNewBestEl.textContent =
                `최고 기록 ${birdBestScore}점`;
        }
    }

    if (birdGameOverScreen) {

        birdGameOverScreen.classList.remove(
            "hidden"
        );
    }

    drawBirdGame();

    console.log(
        `[Bird Bump] GAME OVER / SCORE=${birdScore} / DIFFICULTY=${getBirdDifficultyLevel()}`
    );

    fetch("/api/bird-score", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            score: birdScore,
            difficulty: getBirdDifficultyLevel()
        }),
        keepalive: true
    }).catch(() => {
        // 점수 로그 전송 실패는 게임 진행에 영향을 주지 않습니다.
    });
}


// ==================================================
// 게임 루프
// ==================================================

function birdGameLoop(
    timestamp
) {

    if (!birdGameRunning) {

        drawBirdGame();

        return;
    }

    let delta =
        (
            timestamp -
            birdLastTime
        ) /
        1000;

    birdLastTime =
        timestamp;

    delta =
        Math.min(
            delta,
            0.035
        );

    updateBirdGame(
        delta
    );

    drawBirdGame();

    birdAnimationId =
        requestAnimationFrame(
            birdGameLoop
        );
}


// ==================================================
// 게임 업데이트
// ==================================================

function updateBirdGame(
    delta
) {

    birdDistance +=
        birdSpeed *
        delta;


    // ==================================================
    // 새 물리
    // ==================================================

    birdPlayer.velocityY +=
        birdPlayer.gravity *
        delta;

    birdPlayer.y +=
        birdPlayer.velocityY *
        delta;

    birdPlayer.rotation =
        Math.max(
            -0.45,
            Math.min(
                1.1,
                birdPlayer.velocityY /
                650
            )
        );


    // ==================================================
    // 점수 기반 난이도
    // ==================================================

    birdSpeed =
        Math.min(
            BIRD_DIFFICULTY.maxSpeed,
            BIRD_DIFFICULTY.baseSpeed +
            birdScore *
            BIRD_DIFFICULTY.speedPerScore
        );


    // ==================================================
    // 장애물 생성
    // ==================================================

    birdObstacleTimer +=
        delta;

    const obstacleInterval =
        Math.max(
            BIRD_DIFFICULTY.minObstacleInterval,
            BIRD_DIFFICULTY.baseObstacleInterval -
            birdScore *
            BIRD_DIFFICULTY.obstacleIntervalDecrease
        );

    if (
        birdObstacleTimer >=
        obstacleInterval
    ) {

        birdObstacleTimer =
            0;

        createBirdObstacle();
    }


    // ==================================================
    // 구름
    // ==================================================

    updateBirdClouds(
        delta
    );


    // ==================================================
    // 장애물
    // ==================================================

    updateBirdObstacles(
        delta
    );


    // ==================================================
    // 파티클
    // ==================================================

    updateBirdParticles(
        delta
    );


    // ==================================================
    // 점수
    // ==================================================

    birdObstacles.forEach(
        obstacle => {

            if (
                !obstacle.scored &&
                obstacle.x +
                    obstacle.width <
                    birdPlayer.x
            ) {

                obstacle.scored =
                    true;

                birdScore++;

                updateBirdScore();

                createScoreParticles(
                    obstacle.x,
                    obstacle.gapY +
                    obstacle.gapSize / 2
                );
            }
        }
    );


    // ==================================================
    // 충돌
    // ==================================================

    if (
        checkBirdCollision()
    ) {

        endBirdGame();

        return;
    }
}


// ==================================================
// 장애물 생성
// ==================================================

function createBirdObstacle() {

    const groundY =
        getBirdGroundY();


    // ==================================================
    // 통로 크기
    // ==================================================

    const gapSize =
        Math.max(
            BIRD_DIFFICULTY.minGap,
            BIRD_DIFFICULTY.baseGap -
            birdScore *
            BIRD_DIFFICULTY.gapShrinkPerScore
        );


    // ==================================================
    // 안전 영역
    // ==================================================

    const topMargin =
        BIRD_DIFFICULTY.topMargin;

    const bottomMargin =
        BIRD_DIFFICULTY.bottomMargin;


    const minGapY =
        topMargin;


    const maxGapY =
        Math.max(
            minGapY,
            groundY -
            bottomMargin -
            gapSize
        );


    // ==================================================
    // 랜덤 통로
    // ==================================================

    let gapY =
        minGapY +
        Math.random() *
        Math.max(
            0,
            maxGapY -
            minGapY
        );


    // ==================================================
    // 이동 장애물 설정
    // ==================================================

    const moving =
        birdScore >=
        BIRD_DIFFICULTY.movingStartScore;


    let moveRange =
        0;

    let moveSpeed =
        0;


    if (moving) {

        moveRange =
            Math.min(
                85,
                BIRD_DIFFICULTY.baseMoveRange +
                Math.max(
                    0,
                    birdScore -
                    BIRD_DIFFICULTY.movingStartScore
                ) *
                BIRD_DIFFICULTY.moveRangePerScore
            );

        moveSpeed =
            BIRD_DIFFICULTY.baseMoveSpeed +
            Math.max(
                0,
                birdScore -
                BIRD_DIFFICULTY.movingStartScore
            ) *
            BIRD_DIFFICULTY.moveSpeedPerScore;
    }


    // ==================================================
    // 이동 가능한 범위 계산
    // ==================================================

    const movementMin =
        minGapY;

    const movementMax =
        maxGapY;


    // 이동폭이 실제 가능한 공간보다 크지 않도록 제한
    const availableMovement =
        Math.max(
            0,
            Math.min(
                moveRange,
                (
                    movementMax -
                    movementMin
                ) /
                2
            )
        );


    // ==================================================
    // 이동 시작 위치
    // ==================================================

    if (
        moving &&
        availableMovement > 0
    ) {

        const safeMin =
            movementMin +
            availableMovement;

        const safeMax =
            movementMax -
            availableMovement;

        if (
            safeMax >= safeMin
        ) {

            gapY =
                safeMin +
                Math.random() *
                (
                    safeMax -
                    safeMin
                );
        }

        moveRange =
            availableMovement;
    }


    const width =
        BIRD_DIFFICULTY.obstacleWidth;


    birdObstacles.push({

        x:
            birdWorldWidth +
            35,

        width:
            width,

        gapY:
            gapY,

        gapSize:
            gapSize,

        scored:
            false,

        moving:
            moving &&
            moveRange > 0,

        moveRange:
            moveRange,

        moveSpeed:
            moveSpeed,

        moveDirection:
            Math.random() <
            0.5
                ? -1
                : 1,

        baseGapY:
            gapY
    });
}


// ==================================================
// 장애물 업데이트
// ==================================================

function updateBirdObstacles(
    delta
) {

    const groundY =
        getBirdGroundY();


    for (
        let i =
            birdObstacles.length - 1;
        i >= 0;
        i--
    ) {

        const obstacle =
            birdObstacles[i];


        // ==================================================
        // 좌우 이동
        // ==================================================

        obstacle.x -=
            birdSpeed *
            delta;


        // ==================================================
        // 상하 이동
        // ==================================================

        if (
            obstacle.moving &&
            obstacle.moveRange > 0
        ) {

            obstacle.gapY +=
                obstacle.moveDirection *
                obstacle.moveSpeed *
                delta;


            const minY =
                BIRD_DIFFICULTY.topMargin;

            const maxY =
                groundY -
                BIRD_DIFFICULTY.bottomMargin -
                obstacle.gapSize;


            const lowerLimit =
                Math.max(
                    minY,
                    Math.min(
                        maxY,
                        obstacle.baseGapY -
                        obstacle.moveRange
                    )
                );

            const upperLimit =
                Math.max(
                    lowerLimit,
                    Math.min(
                        maxY,
                        obstacle.baseGapY +
                        obstacle.moveRange
                    )
                );


            if (
                obstacle.gapY <=
                lowerLimit
            ) {

                obstacle.gapY =
                    lowerLimit;

                obstacle.moveDirection =
                    1;
            }


            if (
                obstacle.gapY >=
                upperLimit
            ) {

                obstacle.gapY =
                    upperLimit;

                obstacle.moveDirection =
                    -1;
            }
        }


        // ==================================================
        // 화면 밖 제거
        // ==================================================

        if (
            obstacle.x +
                obstacle.width <
                -120
        ) {

            birdObstacles.splice(
                i,
                1
            );
        }
    }
}


// ==================================================
// 구름 업데이트
// ==================================================

function updateBirdClouds(
    delta
) {

    birdClouds.forEach(
        cloud => {

            cloud.x -=
                cloud.speed *
                delta;

            if (
                cloud.x +
                    cloud.width <
                    -30
            ) {

                cloud.x =
                    birdWorldWidth +
                    40;

                cloud.y =
                    40 +
                    Math.random() *
                    170;

                cloud.opacity =
                    0.25 +
                    Math.random() *
                    0.35;
            }
        }
    );
}


// ==================================================
// 충돌 판정
// ==================================================

function checkBirdCollision() {

    // ==================================================
    // 새 충돌 박스
    // ==================================================

    const paddingX =
        6;

    const paddingY =
        5;

    const bx =
        birdPlayer.x +
        paddingX;

    const by =
        birdPlayer.y +
        paddingY;

    const bw =
        birdPlayer.width -
        paddingX * 2;

    const bh =
        birdPlayer.height -
        paddingY * 2;


    // ==================================================
    // 땅
    // ==================================================

    const groundY =
        getBirdGroundY();


    if (
        by +
        bh >=
        groundY
    ) {

        return true;
    }


    // ==================================================
    // 천장
    // ==================================================

    if (
        by <=
        BIRD_CEILING
    ) {

        return true;
    }


    // ==================================================
    // 장애물
    // ==================================================

    for (
        const obstacle of
            birdObstacles
    ) {

        const ox =
            obstacle.x;

        const ow =
            obstacle.width;


        const topPipeBottom =
            obstacle.gapY;

        const bottomPipeTop =
            obstacle.gapY +
            obstacle.gapSize;


        // 좌우 충돌
        const horizontal =
            bx <
                ox + ow &&
            bx + bw >
                ox;


        if (!horizontal) {
            continue;
        }


        // 위쪽 기둥
        const hitTop =
            by <
                topPipeBottom &&
            by + bh >
                0;


        // 아래쪽 기둥
        const hitBottom =
            by + bh >
                bottomPipeTop &&
            by <
                groundY;


        if (
            hitTop ||
            hitBottom
        ) {

            return true;
        }
    }


    return false;
}


// ==================================================
// 파티클
// ==================================================

function createBirdJumpParticles() {

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        birdParticles.push({

            x:
                birdPlayer.x,

            y:
                birdPlayer.y +
                birdPlayer.height,

            vx:
                -30 -
                Math.random() *
                50,

            vy:
                -10 +
                Math.random() *
                35,

            life:
                0.35,

            maxLife:
                0.35,

            size:
                2 +
                Math.random() *
                3,

            type:
                "jump"
        });
    }
}


function createScoreParticles(
    x,
    y
) {

    for (
        let i = 0;
        i < 9;
        i++
    ) {

        birdParticles.push({

            x:
                x,

            y:
                y,

            vx:
                -50 +
                Math.random() *
                100,

            vy:
                -90 +
                Math.random() *
                40,

            life:
                0.65,

            maxLife:
                0.65,

            size:
                2 +
                Math.random() *
                4,

            type:
                "score"
        });
    }
}


function createExplosionParticles() {

    for (
        let i = 0;
        i < 28;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;

        const speed =
            60 +
            Math.random() *
            230;

        birdParticles.push({

            x:
                birdPlayer.x +
                birdPlayer.width /
                2,

            y:
                birdPlayer.y +
                birdPlayer.height /
                2,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            life:
                0.8 +
                Math.random() *
                0.4,

            maxLife:
                1.2,

            size:
                3 +
                Math.random() *
                6,

            type:
                "explosion"
        });
    }
}


function updateBirdParticles(
    delta
) {

    for (
        let i =
            birdParticles.length - 1;
        i >= 0;
        i--
    ) {

        const particle =
            birdParticles[i];

        particle.life -=
            delta;

        particle.x +=
            particle.vx *
            delta;

        particle.y +=
            particle.vy *
            delta;

        particle.vy +=
            220 *
            delta;

        if (
            particle.life <=
            0
        ) {

            birdParticles.splice(
                i,
                1
            );
        }
    }
}


// ==================================================
// 게임 그리기
// ==================================================

function drawBirdGame() {

    if (
        !birdCtx ||
        !birdGameCanvas
    ) {

        return;
    }

    const width =
        birdWorldWidth;

    const height =
        birdWorldHeight;

    birdCtx.clearRect(
        0,
        0,
        width,
        height
    );


    drawBirdBackground(
        width,
        height
    );

    drawBirdClouds();

    drawBirdObstacles();

    drawBirdParticles();

    drawBirdPlayer();
}


// ==================================================
// 배경
// ==================================================

function drawBirdBackground(
    width,
    height
) {

    const groundY =
        getBirdGroundY();


    const groundRatio =
        groundY /
        height;


    const sky =
        birdCtx.createLinearGradient(
            0,
            0,
            0,
            height
        );


    sky.addColorStop(
        0,
        "#dff2ff"
    );

    sky.addColorStop(
        Math.max(
            0,
            groundRatio - 0.12
        ),
        "#f7fcff"
    );

    sky.addColorStop(
        Math.min(
            1,
            groundRatio
        ),
        "#dcebd4"
    );

    sky.addColorStop(
        1,
        "#cfe2c3"
    );


    birdCtx.fillStyle =
        sky;

    birdCtx.fillRect(
        0,
        0,
        width,
        height
    );


    // ==================================================
    // 먼 산
    // ==================================================

    birdCtx.fillStyle =
        "rgba(155, 187, 155, 0.25)";

    birdCtx.beginPath();

    birdCtx.moveTo(
        0,
        groundY
    );

    for (
        let x = 0;
        x <= width;
        x += 70
    ) {

        const y =
            groundY -
            25 -
            Math.sin(
                x * 0.014
            ) * 18;

        birdCtx.lineTo(
            x,
            y
        );
    }

    birdCtx.lineTo(
        width,
        height
    );

    birdCtx.lineTo(
        0,
        height
    );

    birdCtx.closePath();

    birdCtx.fill();


    // ==================================================
    // 땅
    // ==================================================

    birdCtx.fillStyle =
        "#d2e5c8";

    birdCtx.fillRect(
        0,
        groundY,
        width,
        height -
        groundY
    );


    // ==================================================
    // 잔디 라인
    // ==================================================

    birdCtx.strokeStyle =
        "#b9d2ad";

    birdCtx.lineWidth =
        3;

    birdCtx.beginPath();

    birdCtx.moveTo(
        0,
        groundY
    );

    birdCtx.lineTo(
        width,
        groundY
    );

    birdCtx.stroke();


    // ==================================================
    // 잔디 디테일
    // ==================================================

    birdCtx.strokeStyle =
        "rgba(126, 160, 115, 0.45)";

    birdCtx.lineWidth =
        1.5;

    for (
        let x = 0;
        x < width;
        x += 18
    ) {

        birdCtx.beginPath();

        birdCtx.moveTo(
            x,
            groundY + 2
        );

        birdCtx.lineTo(
            x + 4,
            groundY - 3
        );

        birdCtx.moveTo(
            x + 7,
            groundY + 2
        );

        birdCtx.lineTo(
            x + 10,
            groundY - 2
        );

        birdCtx.stroke();
    }
}


// ==================================================
// 구름 그리기
// ==================================================

function drawBirdClouds() {

    birdClouds.forEach(
        cloud => {

            birdCtx.save();

            birdCtx.globalAlpha =
                cloud.opacity;

            birdCtx.fillStyle =
                "#ffffff";

            const x =
                cloud.x;

            const y =
                cloud.y;

            const w =
                cloud.width;

            birdCtx.beginPath();

            birdCtx.arc(
                x + w * 0.25,
                y + 10,
                15,
                0,
                Math.PI * 2
            );

            birdCtx.arc(
                x + w * 0.45,
                y,
                21,
                0,
                Math.PI * 2
            );

            birdCtx.arc(
                x + w * 0.68,
                y + 8,
                16,
                0,
                Math.PI * 2
            );

            birdCtx.roundRect(
                x,
                y + 8,
                w,
                25,
                15
            );

            birdCtx.fill();

            birdCtx.restore();
        }
    );
}


// ==================================================
// 장애물 그리기
// ==================================================

function drawBirdObstacles() {

    const groundY =
        getBirdGroundY();


    birdObstacles.forEach(
        obstacle => {

            const x =
                obstacle.x;

            const width =
                obstacle.width;

            const topHeight =
                obstacle.gapY;

            const bottomY =
                obstacle.gapY +
                obstacle.gapSize;


            // ==================================================
            // 위쪽 기둥
            // ==================================================

            drawObstaclePipe(
                x,
                0,
                width,
                topHeight,
                true
            );


            // ==================================================
            // 아래쪽 기둥
            // ==================================================

            drawObstaclePipe(
                x,
                bottomY,
                width,
                Math.max(
                    0,
                    groundY -
                    bottomY
                ),
                false
            );
        }
    );
}


// ==================================================
// 장애물 하나
// ==================================================

function drawObstaclePipe(
    x,
    y,
    width,
    height,
    top
) {

    if (
        height <= 0
    ) {

        return;
    }


    // ==================================================
    // 본체
    // ==================================================

    const gradient =
        birdCtx.createLinearGradient(
            x,
            0,
            x + width,
            0
        );


    gradient.addColorStop(
        0,
        "#8b9aff"
    );

    gradient.addColorStop(
        0.45,
        "#697cff"
    );

    gradient.addColorStop(
        1,
        "#5969df"
    );


    birdCtx.fillStyle =
        gradient;


    birdCtx.fillRect(
        x,
        y,
        width,
        height
    );


    // ==================================================
    // 본체 테두리
    // ==================================================

    birdCtx.strokeStyle =
        "rgba(67, 79, 180, 0.48)";

    birdCtx.lineWidth =
        2;

    birdCtx.strokeRect(
        x + 1,
        y + 1,
        width - 2,
        Math.max(
            0,
            height - 2
        )
    );


    // ==================================================
    // 기둥 끝 캡
    // ==================================================

    const capHeight =
        Math.min(
            22,
            Math.max(
                16,
                height * 0.12
            )
        );


    const capWidth =
        width +
        18;


    const capX =
        x -
        9;


    let capY;


    if (top) {

        // 위쪽 기둥은 아래쪽에 캡
        capY =
            y +
            height -
            capHeight;

    } else {

        // 아래쪽 기둥은 위쪽에 캡
        capY =
            y;
    }


    // ==================================================
    // 캡 그림자
    // ==================================================

    birdCtx.fillStyle =
        "rgba(54, 65, 155, 0.18)";

    birdCtx.beginPath();

    birdCtx.roundRect(
        capX + 2,
        capY + 3,
        capWidth,
        capHeight,
        6
    );

    birdCtx.fill();


    // ==================================================
    // 캡 본체
    // ==================================================

    const capGradient =
        birdCtx.createLinearGradient(
            capX,
            0,
            capX + capWidth,
            0
        );


    capGradient.addColorStop(
        0,
        "#8998ff"
    );

    capGradient.addColorStop(
        0.5,
        "#7182ff"
    );

    capGradient.addColorStop(
        1,
        "#6272e9"
    );


    birdCtx.fillStyle =
        capGradient;


    birdCtx.beginPath();

    birdCtx.roundRect(
        capX,
        capY,
        capWidth,
        capHeight,
        6
    );

    birdCtx.fill();


    birdCtx.strokeStyle =
        "rgba(67, 79, 180, 0.55)";

    birdCtx.lineWidth =
        2;

    birdCtx.stroke();


    // ==================================================
    // 본체 하이라이트
    // ==================================================

    birdCtx.fillStyle =
        "rgba(255,255,255,0.19)";

    birdCtx.fillRect(
        x + 8,
        y + 2,
        8,
        Math.max(
            0,
            height -
            4
        )
    );


    // ==================================================
    // 캡 하이라이트
    // ==================================================

    birdCtx.fillStyle =
        "rgba(255,255,255,0.22)";

    birdCtx.beginPath();

    birdCtx.roundRect(
        capX + 7,
        capY + 4,
        8,
        Math.max(
            5,
            capHeight - 8
        ),
        3
    );

    birdCtx.fill();


    // ==================================================
    // 캡 중앙 광택
    // ==================================================

    birdCtx.fillStyle =
        "rgba(255,255,255,0.08)";

    birdCtx.fillRect(
        capX + 18,
        capY + 3,
        capWidth - 36,
        4
    );
}


// ==================================================
// 새 그리기
// ==================================================

function drawBirdPlayer() {

    const x =
        birdPlayer.x;

    const y =
        birdPlayer.y;

    const w =
        birdPlayer.width;

    const h =
        birdPlayer.height;

    birdCtx.save();

    birdCtx.translate(
        x + w / 2,
        y + h / 2
    );

    birdCtx.rotate(
        birdPlayer.rotation
    );


    // ==================================================
    // 그림자
    // ==================================================

    birdCtx.fillStyle =
        "rgba(54, 69, 91, 0.13)";

    birdCtx.beginPath();

    birdCtx.ellipse(
        0,
        h * 0.58,
        w * 0.43,
        5,
        0,
        0,
        Math.PI * 2
    );

    birdCtx.fill();


    // ==================================================
    // 몸
    // ==================================================

    const body =
        birdCtx.createLinearGradient(
            -w / 2,
            -h / 2,
            w / 2,
            h / 2
        );


    body.addColorStop(
        0,
        "#ffd95a"
    );

    body.addColorStop(
        1,
        "#ffb62e"
    );


    birdCtx.fillStyle =
        body;


    birdCtx.beginPath();

    birdCtx.roundRect(
        -w / 2,
        -h / 2,
        w,
        h,
        11
    );

    birdCtx.fill();


    // ==================================================
    // 날개
    // ==================================================

    birdCtx.fillStyle =
        "#f5aa2d";

    birdCtx.beginPath();

    birdCtx.ellipse(
        -5,
        4,
        10,
        7,
        -0.35,
        0,
        Math.PI * 2
    );

    birdCtx.fill();


    // ==================================================
    // 눈
    // ==================================================

    birdCtx.fillStyle =
        "#ffffff";

    birdCtx.beginPath();

    birdCtx.arc(
        9,
        -8,
        7,
        0,
        Math.PI * 2
    );

    birdCtx.fill();


    birdCtx.fillStyle =
        "#222a38";

    birdCtx.beginPath();

    birdCtx.arc(
        11,
        -8,
        3,
        0,
        Math.PI * 2
    );

    birdCtx.fill();


    // ==================================================
    // 부리
    // ==================================================

    birdCtx.fillStyle =
        "#ff8847";

    birdCtx.beginPath();

    birdCtx.moveTo(
        w / 2 - 1,
        -1
    );

    birdCtx.lineTo(
        w / 2 + 13,
        3
    );

    birdCtx.lineTo(
        w / 2 - 1,
        7
    );

    birdCtx.closePath();

    birdCtx.fill();


    // ==================================================
    // 머리 하이라이트
    // ==================================================

    birdCtx.fillStyle =
        "rgba(255,255,255,0.4)";

    birdCtx.beginPath();

    birdCtx.ellipse(
        -7,
        -9,
        8,
        4,
        -0.3,
        0,
        Math.PI * 2
    );

    birdCtx.fill();

    birdCtx.restore();
}


// ==================================================
// 파티클 그리기
// ==================================================

function drawBirdParticles() {

    birdParticles.forEach(
        particle => {

            birdCtx.save();

            birdCtx.globalAlpha =
                Math.max(
                    0,
                    particle.life /
                    particle.maxLife
                );


            if (
                particle.type ===
                "explosion"
            ) {

                birdCtx.fillStyle =
                    "#ffb13b";

            } else if (
                particle.type ===
                "score"
            ) {

                birdCtx.fillStyle =
                    "#6f7fff";

            } else {

                birdCtx.fillStyle =
                    "#ffffff";
            }


            birdCtx.beginPath();

            birdCtx.arc(
                particle.x,
                particle.y,
                particle.size,
                0,
                Math.PI * 2
            );

            birdCtx.fill();

            birdCtx.restore();
        }
    );
}


// ==================================================
// 점프/클릭 입력
// ==================================================

function handleBirdInput(
    event
) {

    if (event) {

        event.preventDefault();
    }

    if (
        birdGameRunning
    ) {

        birdJump();

        return;
    }

    if (
        birdGameOver
    ) {

        startBirdGame();
    }
}


// ==================================================
// Canvas 입력
// ==================================================

if (birdGameCanvas) {

    birdGameCanvas.addEventListener(
        "pointerdown",
        handleBirdInput
    );
}


// ==================================================
// 시작 버튼
// ==================================================

if (birdStartBtn) {

    birdStartBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            startBirdGame();
        }
    );
}


// ==================================================
// 다시하기
// ==================================================

if (birdRestartBtn) {

    birdRestartBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            startBirdGame();
        }
    );
}


// ==================================================
// SPACE
// ==================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.code !==
            "Space"
        ) {

            return;
        }

        if (
            !birdGameModal ||
            !birdGameModal.classList.contains(
                "active"
            )
        ) {

            return;
        }

        event.preventDefault();

        if (
            birdGameRunning
        ) {

            birdJump();

        } else if (
            birdGameOver
        ) {

            startBirdGame();

        } else {

            startBirdGame();
        }
    }
);


// ==================================================
// 게임 모달 열기
// ==================================================

function openGameModal() {

    if (!birdGameModal) {
        return;
    }

    birdGameModal.classList.add(
        "active"
    );

    birdGameModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

    requestAnimationFrame(
        () => {

            resizeBirdCanvas();

            if (
                !birdGameRunning
            ) {

                drawBirdGame();
            }
        }
    );

    console.log(
        "[Bird Bump] 게임 창 열림"
    );
}


// ==================================================
// 게임 모달 닫기
// ==================================================

function closeGameModal() {

    if (!birdGameModal) {
        return;
    }

    birdGameModal.classList.remove(
        "active"
    );

    birdGameModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";

    console.log(
        "[Bird Bump] 게임 창 닫힘"
    );
}


// ==================================================
// 게임 버튼
// ==================================================

if (gameHubBtn) {
    gameHubBtn.addEventListener("click", openGameHub);
}

closeGameHubBtn?.addEventListener("click", closeGameHub);
gameHubBackdrop?.addEventListener("click", closeGameHub);

hubSurvivalGame?.addEventListener("click", () => {
    closeGameHub();
    openSurvivalGame();
});

hubBirdGame?.addEventListener("click", () => {
    closeGameHub();
    openGameModal();
});

hubCarGame?.addEventListener("click", () => {
    closeGameHub();
    openCarGameModal();
});

hubWormGame?.addEventListener("click", () => {
    closeGameHub();
    wormOpen();
});


// ==================================================
// 배경 클릭
// ==================================================

if (gameBackdrop) {

    gameBackdrop.addEventListener(
        "click",
        closeGameModal
    );
}


// ==================================================
// X 버튼
// ==================================================

if (closeGameBtn) {

    closeGameBtn.addEventListener(
        "click",
        closeGameModal
    );
}


// ==================================================
// ESC
// ==================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
                "Escape" &&
            birdGameModal &&
            birdGameModal.classList.contains(
                "active"
            )
        ) {

            closeGameModal();
        }
    }
);


// ==================================================
// 초기화
// ==================================================

createClassOptions();

updateBirdScore();

restoreSchool();

console.log(
    "COMTIME PRO 초기화 완료"
);

console.log(
    "Bird Bump 준비 완료"
);

// ==================================================
// 5-MIN SURVIVAL GAME
// Original COMTIME PRO canvas game inspired by the survivor-roguelite genre.
// ==================================================

const survivalGameModal = document.getElementById("survivalGameModal");
const survivalBackdrop = document.getElementById("survivalBackdrop");
const closeSurvivalBtn = document.getElementById("closeSurvivalBtn");
const survivalGameStage = document.getElementById("survivalGameStage");
const survivalCanvas = document.getElementById("survivalCanvas");
const survivalStartScreen = document.getElementById("survivalStartScreen");
const survivalStartBtn = document.getElementById("survivalStartBtn");
const survivalLevelUp = document.getElementById("survivalLevelUp");
const survivalUpgradeChoices = document.getElementById("survivalUpgradeChoices");
const survivalEndScreen = document.getElementById("survivalEndScreen");
const survivalEndIcon = document.getElementById("survivalEndIcon");
const survivalEndEyebrow = document.getElementById("survivalEndEyebrow");
const survivalEndTitle = document.getElementById("survivalEndTitle");
const survivalEndStats = document.getElementById("survivalEndStats");
const survivalRestartBtn = document.getElementById("survivalRestartBtn");
const survivalTimeEl = document.getElementById("survivalTime");
const survivalWaveEl = document.getElementById("survivalWave");
const survivalKillsEl = document.getElementById("survivalKills");
const survivalHpBar = document.getElementById("survivalHpBar");
const survivalXpBar = document.getElementById("survivalXpBar");
const survivalBossBanner = document.getElementById("survivalBossBanner");
const survivalBossHp = document.getElementById("survivalBossHp");
const survivalBossHpBar = document.getElementById("survivalBossHpBar");
const survivalJoystick = document.getElementById("survivalJoystick");
const survivalJoystickKnob = document.getElementById("survivalJoystickKnob");
const survivalPauseBtn=document.getElementById("survivalPauseBtn");
const survivalPauseOverlay=document.getElementById("survivalPauseOverlay");
const survivalResumeBtn=document.getElementById("survivalResumeBtn");
const survivalQuitBtn=document.getElementById("survivalQuitBtn");
const survivalDeveloperBtn=document.getElementById("survivalDeveloperBtn");

const survivalCtx = survivalCanvas?.getContext("2d");

const survivalState = {
    running: false,
    pausedForLevel: false,
    won: false,
    elapsed: 0,
    last: 0,
    spawnTimer: 0,
    shotTimer: 0,
    kills: 0,
    wave: 1,
    level: 1,
    xp: 0,
    xpNeed: 4,
    score: 0,
    nextBossAt: 120,
    waveDuration: 24,
    bossIntervalWaves: 5,
    bossFenceHalfW: 0,
    bossFenceHalfH: 0,
    bossRewardSkills: [], currentUpgradeChoices: [],
    bossNumber: 0,
    bossActive: false,
    bossFenceRadius: 0,
    bossCenterX: 0,
    bossCenterY: 0,
    bossTransition: 0,
    player: null,
    enemies: [],
    bullets: [],
    gems: [],
    particles: [],
    upgrades: {},
    upgradeLevels: {},
    lightningTimer: 0,
    bombTimer: 0,
    orbitalAngle: 0,
    regenTimer: 0,
    specialTimer: 0,
    repulseTimer: 0,
    pauseMenuOpen: false,
    bestScore: Number(localStorage.getItem("comtime_survival_best_score") || 0),
    bestTime: Number(localStorage.getItem("comtime_survival_best_time") || 0),
    developerCheat: false,
    developerAuthorized: false,
    bossDashTimer: 0, bossDashTime: 0, bossDashVx: 0, bossDashVy: 0,
    fireBottleTimer: 0, laserTimer: 0, meteorTimer: 0, iceNovaTimer: 0, poisonTimer: 0, vortexTimer: 0, pulseTimer: 0, fanShotTimer: 0, stormTimer: 0, quakeTimer: 0, healingRainTimer: 0, vacuumTimer: 0, droneMissileTimer: 0, bladeWaveTimer: 0, railgunTimer: 0,
    emergencyHealReady: true,
    shieldCharges: 0,
    overdriveTimer: 0,
    focusTargetId: null,
    focusStacks: 0,
    joystick: { x: 0, y: 0, active: false, pointerId: null },
    keys: new Set(),
    raf: null,
    dpr: 1,
    width: 0,
    height: 0,
};

// 100개의 성장 선택지. 중복 선택 시 해당 스킬의 레벨이 올라가며 수치가 더 강해집니다.
const SURVIVAL_UPGRADES = [
    { key: "damage", icon: "✦", title: "화력 강화", desc: "모든 무기 피해가 증가합니다." },
    { key: "fireRate", icon: "⚡", title: "연사 강화", desc: "자동 공격 간격이 줄어듭니다." },
    { key: "moveSpeed", icon: "➜", title: "기동력", desc: "이동 속도가 증가합니다." },
    { key: "maxHp", icon: "♥", title: "체력 강화", desc: "최대 체력이 크게 증가하고 회복합니다." },
    { key: "magnet", icon: "◉", title: "자석", desc: "경험치를 끌어당기는 범위가 증가합니다." },
    { key: "projectile", icon: "✹", title: "다중 탄환", desc: "기본 무기가 발사하는 탄환 수가 증가합니다." },
    { key: "crit", icon: "◆", title: "치명타", desc: "치명타 확률이 증가합니다." },
    { key: "bulletSpeed", icon: "➤", title: "탄속 강화", desc: "탄환이 더 빠르게 날아갑니다." },
    { key: "pierce", icon: "↠", title: "관통탄", desc: "탄환이 더 많은 적을 관통합니다." },
    { key: "area", icon: "◎", title: "범위 강화", desc: "투사체와 광역 기술의 범위가 커집니다." },
    { key: "armor", icon: "⬟", title: "방어 장갑", desc: "받는 피해가 감소합니다." },
    { key: "regen", icon: "✚", title: "재생", desc: "시간이 지나면 체력을 회복합니다." },
    { key: "frost", icon: "❄", title: "빙결 탄환", desc: "적의 이동 속도를 낮춥니다." },
    { key: "orbital", icon: "✺", title: "회전 검", desc: "주변을 도는 칼날이 추가됩니다." },
    { key: "lightning", icon: "ϟ", title: "번개", desc: "주변 적에게 번개가 떨어집니다." },
    { key: "bomb", icon: "✹", title: "주변 폭발", desc: "주변 적에게 광역 폭발 피해를 줍니다." },
    { key: "drone", icon: "◈", title: "전투 드론", desc: "보조 자동 공격이 추가됩니다." },
    { key: "lifesteal", icon: "♡", title: "흡혈", desc: "적 처치 시 체력을 회복할 확률이 증가합니다." },
    { key: "xpBoost", icon: "★", title: "성장 촉진", desc: "획득 경험치가 증가합니다." },
    { key: "range", icon: "⌖", title: "사거리", desc: "자동 조준 사거리가 증가합니다." },
    { key: "bulletSize", icon: "●", title: "탄환 대형화", desc: "탄환 크기와 명중 판정이 증가합니다." },
    { key: "damageBoss", icon: "♛", title: "보스 사냥꾼", desc: "보스에게 주는 피해가 증가합니다." },
    { key: "eliteDamage", icon: "☠", title: "정예 사냥꾼", desc: "강한 적에게 주는 피해가 증가합니다." },
    { key: "knockback", icon: "↯", title: "충격탄", desc: "공격이 적을 더 강하게 밀어냅니다." },
    { key: "dash", icon: "➤", title: "순간 가속", desc: "이동 중 잠깐씩 이동 속도가 추가로 상승합니다." },
    { key: "shield", icon: "◇", title: "보호막", desc: "일정 주기로 피해를 막는 보호막을 얻습니다." },
    { key: "thorns", icon: "♢", title: "가시 갑옷", desc: "접촉한 적에게 반사 피해를 줍니다." },
    { key: "pickupXp", icon: "✦", title: "경험치 증폭", desc: "가까운 경험치가 더 빨리 날아옵니다." },
    { key: "vacuum", icon: "◌", title: "진공 수집기", desc: "주기적으로 전장의 경험치를 강하게 끌어당깁니다." },
    { key: "weaponCooldown", icon: "◌", title: "스킬 쿨다운", desc: "특수 기술의 재사용 간격이 감소합니다." },
    { key: "lightningChain", icon: "ϟ", title: "연쇄 번개", desc: "번개가 더 많은 적을 연결합니다." },
    { key: "bombRadius", icon: "✹", title: "폭발 범위", desc: "주변 폭발의 반경이 크게 증가합니다." },
    { key: "bombDamage", icon: "✷", title: "폭발 화력", desc: "주변 폭발의 피해가 증가합니다." },
    { key: "bladeDamage", icon: "✧", title: "회전 검 화력", desc: "회전 검의 피해가 증가합니다." },
    { key: "bladeSpeed", icon: "⟳", title: "회전 속도", desc: "회전 검이 더 빠르게 돕니다." },
    { key: "droneDamage", icon: "◈", title: "드론 화력", desc: "전투 드론의 피해가 증가합니다." },
    { key: "droneCount", icon: "◇", title: "드론 증원", desc: "전투 드론이 추가됩니다." },
    { key: "critDamage", icon: "◆", title: "치명타 피해", desc: "치명타의 위력이 증가합니다." },
    { key: "healthPickup", icon: "❤", title: "회복 증폭", desc: "회복 구슬을 먹었을 때 회복량이 추가로 증가합니다." },
    { key: "precision", icon: "⊙", title: "정밀 조준", desc: "적의 약점을 정확히 맞히면 피해가 크게 증가합니다." },
    { key: "execute", icon: "☄", title: "처형 탄환", desc: "체력이 낮은 적에게 마무리 피해가 크게 증가합니다." },
    { key: "homing", icon: "⌁", title: "유도 탄환", desc: "발사된 탄환이 가까운 적을 향해 휘어집니다." },
    { key: "healthOrb", icon: "♥", title: "회복 구슬", desc: "적이 회복 구슬을 떨어뜨릴 확률이 생기고 구슬 회복량이 증가합니다." },
    { key: "bossXp", icon: "★", title: "보스 보상", desc: "보스 처치 시 황금 경험치가 더 커집니다." },
    { key: "bossSlow", icon: "◒", title: "보스 감속", desc: "보스의 이동 속도가 감소하고 보스전에서 공간을 더 확보합니다." },
    { key: "focus", icon: "⊙", title: "집중 사격", desc: "같은 대상을 연속으로 공격하면 다음 탄환의 피해가 증가합니다." },
    { key: "emergencyHeal", icon: "✚", title: "응급 처치", desc: "체력이 위험 수준으로 내려가면 즉시 큰 회복이 한 번 발동합니다." },
    { key: "dodge", icon: "◇", title: "회피 훈련", desc: "적의 공격을 일정 확률로 완전히 회피합니다." },
    { key: "repulse", icon: "◉", title: "퇴격 장치", desc: "주기적으로 주변 적을 밀어내 공간을 만들어 줍니다." },
    { key: "overdrive", icon: "✪", title: "오버드라이브", desc: "레벨업 직후 공격 속도와 화력이 폭발적으로 상승합니다." },
    { key: "healingRain", icon: "+", title: "회복 비", desc: "주기적으로 주변에 회복 구슬을 생성합니다." },    { key: "fireBottle", icon: "♨", title: "화염병 투척", desc: "적 밀집 지역에 화염병을 던져 지속 화염 지대를 만듭니다." },
    { key: "boomerang", icon: "↩", title: "귀환 칼날", desc: "관통 칼날이 적을 지나간 뒤 플레이어에게 되돌아옵니다." },
    { key: "ricochet", icon: "⤢", title: "반사 충격", desc: "탄환 적중 후 가장 가까운 다른 적에게 직접 추가 피해를 줍니다." },
    { key: "railgun", icon: "▰", title: "레일건", desc: "긴 충전 뒤 전장을 가르는 초장거리 관통 사격을 발사합니다." },
    { key: "laser", icon: "╱", title: "추적 레이저", desc: "가장 가까운 적을 짧은 레이저로 자동 추적합니다." },
    { key: "meteor", icon: "☄", title: "유성 강하", desc: "위험한 적 주변에 유성이 떨어져 넓은 폭발을 일으킵니다." },
    { key: "iceNova", icon: "✣", title: "빙결 폭풍", desc: "주변 전체에 빙결 파동을 일으켜 적을 크게 둔화합니다." },
    { key: "poisonCloud", icon: "☁", title: "독성 구름", desc: "플레이어 주변에 독구름이 생겨 적을 지속적으로 약화합니다." },
    { key: "bleed", icon: "🩸", title: "출혈 표식", desc: "탄환에 맞은 적에게 출혈이 남아 지속 피해를 줍니다." },
    { key: "burn", icon: "♨", title: "작열 표식", desc: "탄환에 맞은 적이 일정 시간 불타며 추가 피해를 받습니다." },
    { key: "shrapnel", icon: "✹", title: "파편 충격", desc: "탄환 적중 순간 주변 적에게 직접 추가 피해를 줍니다." },
    { key: "vortex", icon: "◌", title: "소용돌이", desc: "주기적으로 주변 적을 끌어당긴 뒤 중심에서 폭발합니다." },
    { key: "gravityWell", icon: "⊙", title: "중력 우물", desc: "전장에 중력장이 생겨 적의 이동을 방해합니다." },
    { key: "timeWarp", icon: "◷", title: "시간 왜곡", desc: "적과 보스의 행동 주기를 느리게 만드는 시간장을 만듭니다." },
    { key: "haste", icon: "≫", title: "가속 회로", desc: "짧은 주기로 플레이어에게 순간적인 초가속을 부여합니다." },
    { key: "overheat", icon: "▲", title: "과열 엔진", desc: "연속 공격할수록 화력이 누적되어 상승합니다." },
    { key: "bloodPact", icon: "♱", title: "피의 계약", desc: "최대 체력 일부를 대가로 공격력이 크게 상승합니다." },
    { key: "salvage", icon: "⌂", title: "전리품 회수", desc: "강한 적을 처치하면 추가 경험치 조각이 생성됩니다." },
    { key: "choicePlus", icon: "4", title: "확장 선택", desc: "레벨업 선택지를 3개에서 4개로 확장합니다." },
    { key: "lucky", icon: "♣", title: "행운의 눈", desc: "레벨업 때 더 높은 레벨의 기술이 선택될 확률을 높입니다." },
    { key: "revive", icon: "✚", title: "불사 부활", desc: "치명상을 한 번 버티고 체력을 크게 회복합니다." },
    { key: "clone", icon: "◇", title: "전투 분신", desc: "플레이어를 따라다니며 적을 유인하는 분신이 생성됩니다." },
    { key: "turret", icon: "⌂", title: "자동 포탑", desc: "플레이어 주변에 자동 공격 포탑이 설치됩니다." },
    { key: "sentry", icon: "▣", title: "감시 포대", desc: "전장을 감시하며 가까운 적을 자동 공격합니다." },
    { key: "droneOrbit", icon: "◈", title: "궤도 드론", desc: "보조 드론이 플레이어 주변을 회전하며 적을 베어냅니다." },
    { key: "droneShield", icon: "⬢", title: "드론 방패", desc: "드론이 적의 탄환과 접촉 피해 일부를 대신 막습니다." },
    { key: "droneMissile", icon: "⌁", title: "드론 미사일", desc: "보조 드론이 강한 유도 미사일을 별도로 발사합니다." },
    { key: "bladeWave", icon: "⌁", title: "검기 방출", desc: "회전 검이 일정 주기마다 바깥으로 검기를 발사합니다." },
    { key: "pulse", icon: "◎", title: "공명 파동", desc: "플레이어 중심에서 주기적인 공격 파동이 퍼집니다." },
    { key: "chainShot", icon: "⛓", title: "연쇄 사격", desc: "첫 명중 대상에서 다음 적으로 공격이 연결됩니다." },
    { key: "splitShot", icon: "Y", title: "분산 충격", desc: "탄환 적중 시 주변 적에게 직접 약한 추가 피해를 줍니다." },
    { key: "fanShot", icon: "⌁", title: "부채꼴 사격", desc: "넓은 부채꼴 탄막을 펼쳐 근거리 적을 쓸어냅니다." },
    { key: "sniper", icon: "⊕", title: "저격 조준", desc: "먼 적일수록 더 강한 피해를 주는 장거리 사격입니다." },
    { key: "scatterBomb", icon: "✺", title: "집속 충격", desc: "한 번의 넓은 충격으로 여러 적에게 직접 피해를 줍니다." },
    { key: "minefield", icon: "⌘", title: "지뢰밭", desc: "이동 경로에 잠시 남는 지뢰를 설치합니다." },
    { key: "flameTrail", icon: "═", title: "화염 흔적", desc: "빠르게 이동한 경로에 불길이 남습니다." },
    { key: "acidPool", icon: "◉", title: "산성 웅덩이", desc: "적 처치 지점에 산성 웅덩이가 남아 후속 적을 녹입니다." },
    { key: "storm", icon: "⚡", title: "폭풍권", desc: "전장 곳곳에 무작위 번개가 떨어지는 폭풍을 만듭니다." },
    { key: "quake", icon: "〽", title: "지진파", desc: "주기적으로 전장 전체에 진동 피해를 줍니다." },
    { key: "shockwave", icon: "◉", title: "충격파", desc: "플레이어 중심에서 강한 원형 충격파를 발산합니다." },
    { key: "prism", icon: "◇", title: "프리즘 파동", desc: "명중 순간 주변 여러 방향의 적에게 직접 파동 피해를 줍니다." },
    { key: "voidRift", icon: "◈", title: "공허 균열", desc: "균열이 적을 끌어당기며 지속 피해를 줍니다." },
    { key: "soulHarvest", icon: "☾", title: "영혼 수확", desc: "강한 적을 처치할수록 일시적으로 공격력이 누적됩니다." },
    { key: "executioner", icon: "⚔", title: "처형인", desc: "보스가 아닌 적의 체력이 극도로 낮아지면 즉시 처형합니다." },
    { key: "giantSlayer", icon: "♜", title: "거대 사냥꾼", desc: "덩치가 큰 적일수록 추가 피해를 줍니다." },
    { key: "bossBreaker", icon: "♛", title: "왕의 파괴자", desc: "보스의 돌진과 특수 공격에 강한 대응 피해를 줍니다." },
    { key: "adrenaline", icon: "!", title: "아드레날린", desc: "체력이 낮을수록 공격 속도와 이동 속도가 상승합니다." },
    { key: "secondWind", icon: "↻", title: "두 번째 바람", desc: "보스를 쓰러뜨릴 때마다 체력을 즉시 회복합니다." },
    { key: "phaseShift", icon: "◇", title: "위상 이동", desc: "짧은 주기로 적과 투사체를 통과할 수 있습니다." },    { key: "phaseAnchor", icon: "⟐", title: "위상 닻", desc: "잠깐 멈춘 순간 주변 적의 움직임이 둔해집니다." },
    { key: "echoStep", icon: "◫", title: "메아리 발걸음", desc: "이동 직후 잠시 공격 범위가 넓어집니다." },
    { key: "kineticMemory", icon: "≋", title: "운동 기억", desc: "빠르게 움직인 직후 다음 공격이 강해집니다." },
    { key: "staticField", icon: "⌁", title: "정전기장", desc: "주변 적이 가까워질수록 약한 전기 피해를 받습니다." },
    { key: "orbitCompass", icon: "⊙", title: "궤도 나침반", desc: "자동 조준이 가장 가까운 적 대신 위험한 적을 우선합니다." },
    { key: "glassEdge", icon: "◇", title: "유리날", desc: "체력이 높을 때 공격력이 조금 더 강해집니다." },
    { key: "warmCore", icon: "◉", title: "온기 핵", desc: "가만히 있는 동안 천천히 체력을 회복합니다." },
    { key: "nightVision", icon: "◐", title: "야간 시야", desc: "먼 거리의 적도 안정적으로 조준할 수 있습니다." },
    { key: "pulseMap", icon: "◎", title: "맥박 지도", desc: "주기적으로 주변 적의 위치가 잠시 드러납니다." },
    { key: "anchorWeight", icon: "▾", title: "앵커 웨이트", desc: "적의 밀치기에 덜 흔들리고 접촉 시 반격력이 증가합니다." },
    { key: "mirrorSkin", icon: "◇", title: "거울 피부", desc: "적 탄환을 막아낸 직후 잠깐 화력이 상승합니다." },
    { key: "quietEngine", icon: "∿", title: "정숙 엔진", desc: "공격하지 않는 순간 이동 속도가 조금 빨라집니다." },
    { key: "starChart", icon: "✧", title: "별자리 지도", desc: "화면 가장자리의 적을 상대로 추가 피해를 얻습니다." },
    { key: "redLine", icon: "╱", title: "레드라인", desc: "보스의 돌진 중 약점 피해가 증가합니다." },
    { key: "deepBreath", icon: "⌒", title: "깊은 호흡", desc: "체력이 가득 찬 상태를 오래 유지하면 보호 효과가 쌓입니다." },
    { key: "clockwork", icon: "◷", title: "시계장치", desc: "특수 기술의 발동 주기가 조금씩 안정화됩니다." },
    { key: "blueprint", icon: "▦", title: "청사진", desc: "새로 얻은 기술의 첫 레벨 효과가 조금 강화됩니다." },
    { key: "gravityBoots", icon: "⌄", title: "중력 부츠", desc: "이동 중 적에게 부딪혀도 위치가 크게 밀리지 않습니다." },
    { key: "lastSpark", icon: "⚬", title: "마지막 불꽃", desc: "체력이 위험할수록 다음 공격의 치명타 위력이 높아집니다." },
    { key: "safePocket", icon: "□", title: "안전 주머니", desc: "회복 구슬과 경험치가 플레이어 근처에 더 오래 머뭅니다." },
];

const SURVIVAL_MAX_SKILL_LEVEL = 5;

const SURVIVAL_DEFAULT_UPGRADES = {
    damage: 1, fireRate: 1, moveSpeed: 1, maxHp: 1, magnet: 1, projectile: 1,
    crit: 0, bulletSpeed: 1, pierce: 0, area: 1, armor: 0, regen: 0, frost: 0,
    orbital: 0, lightning: 0, bomb: 0, drone: 0, lifesteal: 0, xpBoost: 1, range: 1,
    bulletSize: 1, damageBoss: 1, eliteDamage: 1, knockback: 0, dash: 0, shield: 0, thorns: 0,
    pickupXp: 1, vacuum: 0, weaponCooldown: 1, lightningChain: 0, bombRadius: 1, bombDamage: 1,
    bladeDamage: 1, bladeSpeed: 1, droneDamage: 1, droneCount: 0, critDamage: 1, healthPickup: 1,
    precision: 0, execute: 0, homing: 0, healthOrb: 0, bossXp: 1, bossSlow: 0,
    focus: 0, emergencyHeal: 0, dodge: 0, repulse: 0, overdrive: 0, healingRain: 0,
    fireBottle: 0, boomerang: 0, ricochet: 0, railgun: 0, laser: 0, meteor: 0, iceNova: 0, poisonCloud: 0, bleed: 0, burn: 0, shrapnel: 0, vortex: 0, gravityWell: 0, timeWarp: 0, haste: 0, overheat: 0, bloodPact: 0, salvage: 0, choicePlus: 0, lucky: 0, revive: 0, clone: 0, turret: 0, sentry: 0, droneOrbit: 0, droneShield: 0, droneMissile: 0, bladeWave: 0, pulse: 0, chainShot: 0, splitShot: 0, fanShot: 0, sniper: 0, scatterBomb: 0, minefield: 0, flameTrail: 0, acidPool: 0, storm: 0, quake: 0, shockwave: 0, prism: 0, voidRift: 0, soulHarvest: 0, executioner: 0, giantSlayer: 0, bossBreaker: 0, adrenaline: 0, secondWind: 0, phaseShift: 0,
    phaseAnchor: 0, echoStep: 0, kineticMemory: 0, staticField: 0, orbitCompass: 0, glassEdge: 0, warmCore: 0,
    nightVision: 0, pulseMap: 0, anchorWeight: 0, mirrorSkin: 0, quietEngine: 0, starChart: 0, redLine: 0,
    deepBreath: 0, clockwork: 0, blueprint: 0, gravityBoots: 0, lastSpark: 0, safePocket: 0,
};

function survivalResize() {
    if (!survivalGameStage || !survivalCanvas) return;
    const rect = survivalGameStage.getBoundingClientRect();
    survivalState.width = Math.max(320, rect.width);
    survivalState.height = Math.max(420, rect.height);
    survivalState.dpr = Math.min(2, window.devicePixelRatio || 1);
    survivalCanvas.width = Math.floor(survivalState.width * survivalState.dpr);
    survivalCanvas.height = Math.floor(survivalState.height * survivalState.dpr);
    survivalCanvas.style.width = `${survivalState.width}px`;
    survivalCanvas.style.height = `${survivalState.height}px`;
    survivalCtx?.setTransform(survivalState.dpr, 0, 0, survivalState.dpr, 0, 0);
}

function survivalRandom(min, max) {
    return min + Math.random() * (max - min);
}

function survivalDist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function survivalClamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function survivalWorldToScreen(x, y) {
    const p = survivalState.player;
    return {
        x: x - p.x + survivalState.width / 2,
        y: y - p.y + survivalState.height / 2,
    };
}

function survivalReset() {
    survivalState.elapsed = 0;
    survivalState.last = performance.now();
    survivalState.spawnTimer = 0;
    survivalState.shotTimer = 0;
    survivalState.kills = 0;
    survivalState.wave = 1;
    survivalState.level = 1;
    survivalState.xp = 0;
    survivalState.xpNeed = 4;
    survivalState.score = 0;
    survivalState.nextBossAt = 120;
    survivalState.bossNumber = 0;
    survivalState.bossActive = false;
    survivalState.bossFenceRadius = 0;
    survivalState.bossCenterX = 0;
    survivalState.bossCenterY = 0;
    survivalState.bossTransition = 0;
    survivalState.lightningTimer = 0;
    survivalState.bombTimer = 0;
    survivalState.orbitalAngle = 0;
    survivalState.regenTimer = 0;
    survivalState.repulseTimer = 0;
    survivalState.pauseMenuOpen = false; survivalState.bossDashTimer=0; survivalState.bossDashTime=0; survivalState.bossDashVx=0; survivalState.bossDashVy=0;
    survivalState.fireBottleTimer=0; survivalState.laserTimer=0; survivalState.meteorTimer=0; survivalState.iceNovaTimer=0; survivalState.poisonTimer=0; survivalState.vortexTimer=0; survivalState.pulseTimer=0; survivalState.fanShotTimer=0; survivalState.stormTimer=0; survivalState.quakeTimer=0; survivalState.healingRainTimer=0; survivalState.vacuumTimer=0; survivalState.droneMissileTimer=0; survivalState.bladeWaveTimer=0; survivalState.railgunTimer=0; survivalState.finalPowerTimer=0; survivalState.finalPowerMultiplier=1; survivalState.finalOverdriveLevel=0; survivalState.specialTimer=0; survivalState.reviveCharges=0; survivalState.soulStacks=0; survivalState.cloneTimer=0; survivalState.phaseShiftTimer=0;
    survivalState.emergencyHealReady = true;
    survivalState.shieldCharges = 0;
    survivalState.overdriveTimer = 0;
    survivalState.focusTargetId = null;
    survivalState.focusStacks = 0;
    survivalState.enemies = [];
    survivalState.bullets = [];
    survivalState.gems = [];
    survivalState.particles = [];
    survivalState.upgrades = { ...SURVIVAL_DEFAULT_UPGRADES, finalOverdrive: 0 };
    survivalState.upgradeLevels = Object.fromEntries(SURVIVAL_UPGRADES.map((item) => [item.key, 0]));
    survivalState.player = {
        x: 0,
        y: 0,
        radius: 17,
        hp: 100,
        maxHp: 100,
        invuln: 0,
        facing: 0,
    };
    survivalState.won = false;
    survivalState.pausedForLevel = false;
    survivalState.joystick.x = 0;
    survivalState.joystick.y = 0;
    survivalState.joystick.active = false;
    if (survivalJoystickKnob) survivalJoystickKnob.style.transform = "translate(-50%, -50%)";
    survivalResize();
    if (survivalState.developerAuthorized) {
        survivalForceMaxBuild();
        survivalState.xp = survivalState.xpNeed;
        survivalState.pausedForLevel = false;
        survivalLevelUp?.classList.add("hidden");
    }
    survivalUpdateHud();
}

function survivalEnemyType() {
    const r = Math.random();
    const t = survivalState.elapsed;
    if (t > 240 && r < 0.08) return "brute";
    if (t > 180 && r < 0.16) return "runner";
    if (t > 110 && r < 0.26) return "tank";
    if (t > 45 && r < 0.38) return "fast";
    if (t > 75 && r < 0.50) return "shooter";
    return "basic";
}

function survivalSpawnEnemy(forceType = null) {
    const p = survivalState.player;
    if (!p) return;
    const angle = survivalRandom(0, Math.PI * 2);
    const distance = Math.max(survivalState.width, survivalState.height) * 0.62 + 80;
    const cycle = Math.max(0, survivalState.wave - 1);
    const scale = 1 + cycle * 0.14 + Math.floor(cycle / 5) * 0.12;
    const type = forceType || survivalEnemyType();
    const base = {
        basic: { r: 13, hp: 24, speed: 38, damage: 8, xp: 2, color: "#65e6a8" },
        fast: { r: 10, hp: 18, speed: 70, damage: 6, xp: 3, color: "#f4d35e" },
        tank: { r: 21, hp: 120, speed: 24, damage: 16, xp: 8, color: "#f28b8b" },
        runner: { r: 11, hp: 38, speed: 94, damage: 10, xp: 6, color: "#b38cff" },
        shooter: { r: 15, hp: 52, speed: 30, damage: 11, xp: 10, color: "#ff9b71" },
        brute: { r: 27, hp: 260, speed: 20, damage: 23, xp: 18, color: "#d96cff" },
    }[type];
    const hpScale = 1 + survivalState.wave * 0.045 + Math.floor(survivalState.wave / 5) * 0.08;
    const xpRoll = base.xp * (0.82 + Math.random() * 0.55);
    survivalState.enemies.push({
        x: p.x + Math.cos(angle) * distance,
        y: p.y + Math.sin(angle) * distance,
        ...base,
        hp: base.hp * hpScale * scale,
        maxHp: base.hp * hpScale * scale,
        speed: base.speed * (1 + survivalState.elapsed * 0.0009),
        damage: base.damage * (1 + survivalState.wave * 0.022 + Math.floor(survivalState.wave / 5) * 0.045),
        xp: Math.max(1, Math.round(xpRoll)),
        type,
        hitFlash: 0,
        boss: false,
        shootTimer: survivalRandom(0, 1.5),
        id: `e_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    });
}

function survivalStartBossWave() {
    const p = survivalState.player;
    if (!p || survivalState.bossActive) return;

    survivalState.bossActive = true;
    survivalState.bossTransition = 2.8;
    survivalState.bossFenceHalfW = Math.max(260, Math.min(760, survivalState.width * 0.56));
    survivalState.bossFenceHalfH = Math.max(240, Math.min(620, survivalState.height * 0.48));
    survivalState.bossFenceRadius = Math.hypot(survivalState.bossFenceHalfW, survivalState.bossFenceHalfH);
    survivalState.bossCenterX = p.x;
    survivalState.bossCenterY = p.y;

    // 보스가 등장하면 현재 화면의 일반 몬스터를 전부 정리하고
    // 지금까지 떨어지지 않았던 경험치를 즉시 바닥에 생성한다.
    const normalEnemies = survivalState.enemies.filter((enemy) => !enemy.boss);
    for (const enemy of normalEnemies) {
        survivalDropGem(enemy);
        survivalAddParticle(enemy.x, enemy.y, enemy.color, 3);
    }
    survivalState.enemies = survivalState.enemies.filter((enemy) => enemy.boss);

    survivalState.bossNumber += 1;
    const cycle = survivalState.bossNumber;
    const angle = survivalRandom(0, Math.PI * 2);
    const distance = Math.max(120, Math.min(survivalState.bossFenceHalfW, survivalState.bossFenceHalfH) * 0.72);
    const hp = 2400 * (1 + cycle * 0.38) * (1 + survivalState.elapsed * 0.0015);
    const finalLook = cycle % 5 === 0;
    survivalState.enemies.push({
        x: p.x + Math.cos(angle) * distance,
        y: p.y + Math.sin(angle) * distance,
        r: finalLook ? 46 : 36,
        hp,
        maxHp: hp,
        speed: finalLook ? 27 : 31,
        damage: (finalLook ? 31 : 23) * (1 + cycle * 0.06) * (1 + Math.max(0, cycle - 2) * 0.035),
        xp: 180 + cycle * 55,
        type: finalLook ? "bossKing" : "boss",
        color: finalLook ? "#ffd447" : "#ff6d61",
        hitFlash: 0,
        boss: true,
        finalBoss: finalLook,
        shootTimer: 0,
        dashTimer: Math.max(1.2, 4.4 - cycle * 0.16), dashTime: 0, dashVx: 0, dashVy: 0,
        bossNumber: cycle,
        id: `boss_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    });
}

function survivalFinishBossWave() {
    survivalState.bossActive = false;
    survivalState.bossFenceRadius = 0;
    survivalState.bossFenceHalfW = 0;
    survivalState.bossFenceHalfH = 0;
    survivalState.bossCenterX = 0;
    survivalState.bossCenterY = 0;
    survivalState.bossTransition = 0;
    survivalState.nextBossAt = Math.ceil((survivalState.elapsed + 0.01) / (survivalState.waveDuration * survivalState.bossIntervalWaves)) * (survivalState.waveDuration * survivalState.bossIntervalWaves);
    if (survivalState.nextBossAt <= survivalState.elapsed) survivalState.nextBossAt += survivalState.waveDuration * survivalState.bossIntervalWaves;
    survivalState.spawnTimer = 0;
    survivalAddParticle(survivalState.player.x, survivalState.player.y, "#ffd447", 45);
}

function survivalSpawnBoss() {
    survivalStartBossWave();
}

function survivalSpawnBurst() {
    const count = Math.min(14, 5 + Math.floor(survivalState.elapsed / 55));
    for (let i = 0; i < count; i += 1) survivalSpawnEnemy();
}

function u_orbitCompassScore(e, d, p) {
    const u = survivalState.upgrades || {};
    if (!u.orbitCompass) return d;
    const danger = e.boss ? 500 : (e.type === "tank" || e.type === "brute" || e.type === "shooter" ? 120 : 0);
    return d - Math.min(360, danger * u.orbitCompass);
}

function survivalNearestEnemy() {
    const p = survivalState.player;
    let best = null;
    let bestD = Infinity;
    const maxRange = 620 * survivalState.upgrades.range * (1 + (survivalState.upgrades.nightVision || 0) * 0.08);
    for (const e of survivalState.enemies) {
        const d = survivalDist(p, e);
        if (d > maxRange) continue;
        const priority = u_orbitCompassScore(e, d, p);
        if (priority < bestD) {
            best = e;
            bestD = priority;
        }
    }
    return best;
}

function survivalShoot(target) {
    if (!target) return;
    const p = survivalState.player;
    const u = survivalState.upgrades;
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const angle = Math.atan2(dy, dx);
    p.facing = angle;
    const count = Math.min(8, u.projectile);
    const spread = count > 1 ? Math.min(0.55, 0.12 + count * 0.025) : 0;
    for (let i = 0; i < count; i += 1) {
        const offset = (i - (count - 1) / 2) * spread;
        const a = angle + offset;
        const critical = Math.random() < u.crit;
        survivalState.bullets.push({
            x: p.x + Math.cos(a) * 21,
            y: p.y + Math.sin(a) * 21,
            vx: Math.cos(a) * 430 * u.bulletSpeed,
            vy: Math.sin(a) * 430 * u.bulletSpeed,
            radius: 5 * Math.sqrt(u.area * u.bulletSize),
            damage: 18 * u.damage * (critical ? 2.2 * u.critDamage : 1) * (survivalState.overdriveTimer > 0 ? (1 + u.overdrive * 0.035) : 1),
            life: 1.9 * u.range,
            pierceLeft: u.pierce,
            critical,
            homing: u.homing,
        });
    }

    if (u.drone > 0) {
        for (let d = 0; d < Math.min(3, u.drone); d += 1) {
            const side = d % 2 === 0 ? 1 : -1;
            const a = angle + side * 0.28;
            survivalState.bullets.push({
                x: p.x + Math.cos(a) * (28 + d * 8),
                y: p.y + Math.sin(a) * (28 + d * 8),
                vx: Math.cos(a) * 360 * u.bulletSpeed,
                vy: Math.sin(a) * 360 * u.bulletSpeed,
                radius: 4.5,
                damage: 11 * u.damage * u.droneDamage,
                life: 1.5 * u.range,
                pierceLeft: Math.max(0, Math.floor(u.pierce / 2)),
                drone: true, homing: u.homing > 0 ? u.homing * 1.35 : 0,
            });
        }
    }
}

function survivalAddParticle(x, y, color, count = 5) {
    for (let i = 0; i < count; i += 1) {
        const a = survivalRandom(0, Math.PI * 2);
        const speed = survivalRandom(20, 100);
        survivalState.particles.push({
            x,
            y,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            life: survivalRandom(0.25, 0.6),
            maxLife: 0.6,
            color,
            size: survivalRandom(2, 5),
        });
    }
}

function survivalDropGem(enemy) {
    const isBoss = !!enemy.boss;
    const base = Math.max(1, enemy.xp || 1);
    const value = isBoss
        ? Math.round(base * 4.2 * survivalState.upgrades.bossXp * Math.max(1, survivalState.upgrades.xpBoost * 0.65))
        : Math.max(1, Math.round(base * survivalState.upgrades.xpBoost));
    survivalState.gems.push({
        x: enemy.x,
        y: enemy.y,
        value,
        radius: isBoss ? 19 + Math.min(10, survivalState.upgrades.bossXp) : (base >= 12 ? 8 : 5),
        color: isBoss ? "#ffd83d" : (base >= 12 ? "#b9f36b" : "#66d9ff"),
        bossGem: isBoss,
        healthGem: false,
    });
    if (!isBoss && survivalState.upgrades.healthOrb > 0 && Math.random() < Math.min(0.10, 0.0025 + survivalState.upgrades.healthOrb * 0.0035 + survivalState.upgrades.healthOrb * survivalState.upgrades.healthOrb * 0.00035)) {
        survivalState.gems.push({
            x: enemy.x + survivalRandom(-8, 8),
            y: enemy.y + survivalRandom(-8, 8),
            value: 0,
            radius: 7,
            color: "#ff6b86",
            bossGem: false,
            healthGem: true,
        });
    }
}

function survivalGrantFinalBossSkill() {
    if ((survivalState.finalOverdriveLevel || 0) >= SURVIVAL_MAX_SKILL_LEVEL) return false;
    survivalState.finalOverdriveLevel = Math.min(SURVIVAL_MAX_SKILL_LEVEL, (survivalState.finalOverdriveLevel || 0) + 1);
    survivalState.finalPowerTimer = 0;
    survivalState.finalPowerMultiplier = Math.max(1, survivalState.finalPowerMultiplier || 1);
    survivalState.upgrades.finalOverdrive = survivalState.finalOverdriveLevel;
    survivalAddParticle(survivalState.player?.x || 0, survivalState.player?.y || 0, "#ffe36b", 120);
    if (survivalLevelUp && survivalUpgradeChoices) {
        survivalState.pausedForLevel = true;
        survivalLevelUp.classList.remove("hidden");
        const eyebrow = survivalLevelUp.querySelector(".survival-eyebrow");
        const title = survivalLevelUp.querySelector("h3");
        if (eyebrow) eyebrow.textContent = "FINAL BOSS REWARD";
        if (title) title.textContent = "초월 폭주를 획득했습니다";
        survivalUpgradeChoices.innerHTML = `<div class="survival-upgrade-btn boss-reward-card final-boss-reward-card"><div class="final-skill-art"><div class="final-skill-core"></div><i></i><i></i><i></i></div><strong>초월 폭주</strong><small>Lv.${survivalState.finalOverdriveLevel} / ${SURVIVAL_MAX_SKILL_LEVEL} · 10초마다 현재 공격력이 2배가 됩니다.</small></div>`;
        setTimeout(() => {
            survivalState.pausedForLevel = false;
            survivalLevelUp.classList.add("hidden");
        }, 2200);
    }
    return true;
}

function survivalKillEnemy(index) {
    const e = survivalState.enemies[index];
    if (!e) return;
    survivalState.kills += 1;
    survivalState.score += e.boss ? 250 : 10;
    if (!e.boss && survivalState.upgrades.focus > 0 && survivalState.focusTargetId === e.id) {
        survivalState.focusStacks = Math.min(8, survivalState.focusStacks + 1);
    }
    survivalDropGem(e);
    if(survivalState.upgrades.salvage>0 && (e.boss || e.type==="tank" || e.type==="brute" || e.type==="shooter") && Math.random()<Math.min(.8,.16*survivalState.upgrades.salvage)) survivalDropGem({...e,boss:false,x:e.x+survivalRandom(-18,18),y:e.y+survivalRandom(-18,18),xp:Math.max(8,(e.xp||10)*.55)});
    if(survivalState.upgrades.soulHarvest>0){survivalState.soulStacks=Math.min(60,survivalState.soulStacks+survivalState.upgrades.soulHarvest);}
    survivalAddParticle(e.x, e.y, e.color, e.boss ? 26 : 6);
    survivalState.enemies.splice(index, 1);
    if (e.boss) {
        const wasFinalBoss = !!e.finalBoss;
        survivalFinishBossWave();
        if (wasFinalBoss && Math.random() < 0.10) survivalGrantFinalBossSkill();
    }
    if (survivalState.upgrades.lifesteal > 0 && Math.random() < Math.min(0.75, survivalState.upgrades.lifesteal * 0.08)) {
        survivalState.player.hp = Math.min(survivalState.player.maxHp, survivalState.player.hp + survivalState.player.maxHp * 0.035);
    }
}

function survivalTakeDamage(amount) {
    const p = survivalState.player;
    if (!p || p.invuln > 0) return;
    if (survivalState.shieldCharges > 0) {
        survivalState.shieldCharges -= 1;
        p._mirrorBoost = 1 + (survivalState.upgrades.mirrorSkin || 0) * 0.08;
        p.invuln = 0.45;
        survivalAddParticle(p.x, p.y, "#8fe7ff", 18);
        return;
    }
    if (survivalState.upgrades.dodge > 0 && Math.random() < Math.min(0.38, survivalState.upgrades.dodge * 0.035)) {
        survivalAddParticle(p.x, p.y, "#d8f6ff", 12);
        return;
    }
    const reduced = amount * Math.max(0.22, 1 - survivalState.upgrades.armor * 0.04) * Math.max(0.62, 1 - (survivalState.upgrades.anchorWeight || 0) * 0.035);
    p.hp -= reduced;
    p.invuln = 0.35;
    survivalAddParticle(p.x, p.y, "#ff6b7a", 8);
    if (p.hp <= 0 && survivalState.reviveCharges > 0) {
        survivalState.reviveCharges -= 1;
        p.hp = p.maxHp * .62;
        p.invuln = 2.2;
        survivalAddParticle(p.x,p.y,"#fff2a4",90);
    } else if (p.hp <= 0) survivalEnd(false);
}

function survivalCollectXp(value) {
    // 모든 기술이 MAX이면 경험치를 받아도 레벨업/선택창을 절대 다시 열지 않는다.
    if (survivalAllSkillsMaxed()) {
        survivalState.xp = survivalState.xpNeed;
        survivalState.pausedForLevel = false;
        survivalLevelUp?.classList.add("hidden");
        survivalUpdateHud();
        return;
    }
    survivalState.xp += Math.max(0, value);
    let safety = 0;
    while (survivalState.xp >= survivalState.xpNeed && safety++ < 12) {
        survivalState.xp -= survivalState.xpNeed;
        survivalState.level += 1;
        survivalState.xpNeed = Math.min(3200, Math.floor(survivalState.xpNeed * 1.14 + 6 + Math.min(18, survivalState.level * 0.12)));
        if (survivalAllSkillsMaxed()) { survivalState.xp = survivalState.xpNeed; survivalState.pausedForLevel=false; survivalLevelUp?.classList.add("hidden"); break; }
        if (survivalOpenLevelUp("LEVEL UP")) break;
    }
}

function survivalEligibleUpgrades() {
    return SURVIVAL_UPGRADES.filter((item) => (survivalState.upgradeLevels[item.key] || 0) < SURVIVAL_MAX_SKILL_LEVEL);
}

function survivalAllSkillsMaxed() {
    return SURVIVAL_UPGRADES.every((item) => (survivalState.upgradeLevels[item.key] || 0) >= SURVIVAL_MAX_SKILL_LEVEL);
}

// 개발자 MAX는 단순히 UI의 Lv.8 표시만 바꾸는 것이 아니라,
// 실제 전투에 사용되는 모든 수치를 최대 상태로 직접 보정한다.
function survivalForceMaxBuild() {
    const u = survivalState.upgrades || (survivalState.upgrades = { ...SURVIVAL_DEFAULT_UPGRADES });
    const maxLevel = SURVIVAL_MAX_SKILL_LEVEL;

    // 100개 기술의 레벨을 예외 없이 실제 MAX(Lv.5)으로 만든다.
    for (const item of SURVIVAL_UPGRADES) {
        survivalState.upgradeLevels[item.key] = maxLevel;
        if (!Number.isFinite(Number(u[item.key]))) u[item.key] = maxLevel;
    }

    // 수치형/확률형 기술의 실제 최대 전투값.
    Object.assign(u, {
        damage: 18, fireRate: 18, moveSpeed: 3.2, magnet: 18, projectile: 16,
        crit: 0.92, bulletSpeed: 18, pierce: 24, area: 18, armor: 24, regen: 24,
        frost: 24, orbital: 12, lightning: 24, bomb: 24, drone: 8, lifesteal: 24,
        xpBoost: 18, range: 18, bulletSize: 18, damageBoss: 18, eliteDamage: 18,
        knockback: 24, dash: 24, shield: 8, thorns: 24, pickupXp: 18, vacuum: 24,
        weaponCooldown: 18, lightningChain: 24, bombRadius: 18, bombDamage: 18,
        bladeDamage: 18, bladeSpeed: 18, droneDamage: 18, droneCount: 8, critDamage: 18,
        healthPickup: 18, precision: 24, execute: 24, homing: 24, healthOrb: 24,
        bossXp: 18, bossSlow: 24, focus: 24, emergencyHeal: 8, dodge: 24, repulse: 24,
        overdrive: 24, healingRain: 8, speedDamage: 18, fireBottle: 8, boomerang: 8, ricochet: 8,
        railgun: 8, laser: 8, meteor: 8, iceNova: 8, poisonCloud: 8, bleed: 8, burn: 8,
        shrapnel: 8, vortex: 8, gravityWell: 8, timeWarp: 8, haste: 8, overheat: 8,
        bloodPact: 8, salvage: 8, choicePlus: 8, lucky: 8, revive: 8, clone: 8,
        turret: 8, sentry: 8, droneOrbit: 8, droneShield: 8, droneMissile: 8,
        bladeWave: 8, pulse: 8, chainShot: 8, splitShot: 8, fanShot: 8, sniper: 8,
        scatterBomb: 8, minefield: 8, flameTrail: 8, acidPool: 8, storm: 8, quake: 8,
        shockwave: 8, prism: 8, voidRift: 8, soulHarvest: 8, executioner: 8,
        giantSlayer: 8, bossBreaker: 8, adrenaline: 8, secondWind: 8, phaseShift: 8,
        
    });

    const p = survivalState.player || (survivalState.player = {
        x: 0, y: 0, radius: 17, hp: 100, maxHp: 100, invuln: 0, facing: 0,
    });
    p.maxHp = 9999;
    p.hp = p.maxHp;
    p.radius = 22;

    survivalState.shieldCharges = 12;
    survivalState.reviveCharges = SURVIVAL_MAX_SKILL_LEVEL;
    survivalState.soulStacks = SURVIVAL_MAX_SKILL_LEVEL * 8;
    survivalState.emergencyHealReady = true;
    survivalState.finalOverdriveLevel = SURVIVAL_MAX_SKILL_LEVEL;
    survivalState.finalPowerTimer = 0;
    survivalState.finalPowerMultiplier = 1;
    u.finalOverdrive = SURVIVAL_MAX_SKILL_LEVEL;
    survivalState.overdriveTimer = 999999;
    survivalState.developerCheat = true;
    survivalState.pausedForLevel = false;
    survivalLevelUp?.classList.add("hidden");
}

function survivalApplyUpgrade(key) {
    const currentLevel = survivalState.upgradeLevels[key] || 0;
    if (currentLevel >= SURVIVAL_MAX_SKILL_LEVEL) return false;
    const u = survivalState.upgrades;
    const level = currentLevel + 1;
    survivalState.upgradeLevels[key] = level;
    const maxed = level === SURVIVAL_MAX_SKILL_LEVEL;
    const maxBoost = maxed ? 1.75 : 1;
    const firstLevelBoost = currentLevel === 0 && u.blueprint > 0 ? 1 + u.blueprint * 0.06 : 1;
    switch (key) {
        case "damage": u.damage *= 1.16 * maxBoost * firstLevelBoost; break;
        case "fireRate": u.fireRate *= 1.17 * maxBoost; break;
        case "moveSpeed": u.moveSpeed *= 1.10 * maxBoost; break;
        case "maxHp": { const player = survivalState.player || (survivalState.player = {x:0,y:0,radius:17,hp:100,maxHp:100,invuln:0,facing:0}); player.maxHp = Number(player.maxHp) || 100; player.maxHp *= 1.16 * maxBoost; player.hp = player.maxHp; break; }
        case "magnet": u.magnet *= 1.25 * maxBoost; break;
        case "projectile": u.projectile = Math.min(16, u.projectile + (maxed ? 3 : 1)); break;
        case "crit": u.crit = Math.min(0.92, u.crit + (maxed ? 0.12 : 0.055)); break;
        case "bulletSpeed": u.bulletSpeed *= 1.16 * maxBoost; break;
        case "pierce": u.pierce += maxed ? 3 : 1; break;
        case "area": u.area *= 1.12 * maxBoost; break;
        case "armor": u.armor += maxed ? 3 : 1; break;
        case "regen": u.regen += maxed ? 3 : 1; break;
        case "frost": u.frost += maxed ? 3 : 1; break;
        case "orbital": u.orbital = Math.min(12, u.orbital + (maxed ? 3 : 1)); break;
        case "lightning": u.lightning += maxed ? 3 : 1; break;
        case "bomb": u.bomb += maxed ? 3 : 1; break;
        case "drone": u.drone = Math.min(8, u.drone + (maxed ? 2 : 1)); break;
        case "lifesteal": u.lifesteal += maxed ? 3 : 1; break;
        case "xpBoost": u.xpBoost *= 1.13 * maxBoost; break;
        case "range": u.range *= 1.18 * maxBoost; break;
        case "bulletSize": u.bulletSize *= 1.12 * maxBoost; break;
        case "damageBoss": u.damageBoss *= 1.12 * maxBoost; break;
        case "eliteDamage": u.eliteDamage *= 1.10 * maxBoost; break;
        case "knockback": u.knockback += maxed ? 3 : 1; break;
        case "dash": u.dash += maxed ? 3 : 1; break;
        case "shield": u.shield += maxed ? 3 : 1; survivalState.shieldCharges = Math.min(12, survivalState.shieldCharges + (maxed ? 4 : 1)); break;
        case "thorns": u.thorns += maxed ? 3 : 1; break;
        case "pickupXp": u.pickupXp *= 1.22 * maxBoost; break;
        case "vacuum": u.vacuum += maxed ? 3 : 1; break;
        case "weaponCooldown": u.weaponCooldown *= 1.12 * maxBoost; break;
        case "lightningChain": u.lightningChain += maxed ? 3 : 1; break;
        case "bombRadius": u.bombRadius *= 1.14 * maxBoost; break;
        case "bombDamage": u.bombDamage *= 1.15 * maxBoost; break;
        case "bladeDamage": u.bladeDamage *= 1.16 * maxBoost; break;
        case "bladeSpeed": u.bladeSpeed *= 1.20 * maxBoost; break;
        case "droneDamage": u.droneDamage *= 1.16 * maxBoost; break;
        case "droneCount": u.droneCount += maxed ? 2 : 1; u.drone = Math.min(8, u.drone + (maxed ? 2 : 1)); break;
        case "critDamage": u.critDamage *= 1.16 * maxBoost; break;
        case "healthPickup": u.healthPickup *= 1.08 * maxBoost; break;
        case "precision": u.precision += maxed ? 3 : 1; break;
        case "execute": u.execute += maxed ? 3 : 1; break;
        case "homing": u.homing += maxed ? 3 : 1; break;
        case "healthOrb": u.healthOrb += maxed ? 2 : 1; break;
        case "bossXp": u.bossXp *= 1.18 * maxBoost; break;
        case "bossSlow": u.bossSlow += maxed ? 3 : 1; break;
        case "focus": u.focus += maxed ? 3 : 1; break;
        case "emergencyHeal": u.emergencyHeal += maxed ? 3 : 1; survivalState.emergencyHealReady = true; break;
        case "dodge": u.dodge += maxed ? 3 : 1; break;
        case "repulse": u.repulse += maxed ? 3 : 1; break;
        case "overdrive": u.overdrive += maxed ? 3 : 1; survivalState.overdriveTimer = 10 + u.overdrive * 1.2; break;
        case "healingRain": u.healingRain += maxed ? 2 : 1; break;
        case "fireBottle": u.fireBottle += 1; break;
        case "boomerang": u.boomerang += 1; break;
        case "ricochet": u.ricochet += 1; break;
        case "railgun": u.railgun += 1; break;
        case "laser": u.laser += 1; break;
        case "meteor": u.meteor += 1; break;
        case "iceNova": u.iceNova += 1; break;
        case "poisonCloud": u.poisonCloud += 1; break;
        case "bleed": u.bleed += 1; break;
        case "burn": u.burn += 1; break;
        case "shrapnel": u.shrapnel += 1; break;
        case "vortex": u.vortex += 1; break;
        case "gravityWell": u.gravityWell += 1; break;
        case "timeWarp": u.timeWarp += 1; break;
        case "haste": u.haste += 1; break;
        case "overheat": u.overheat += 1; break;
        case "bloodPact": { u.bloodPact += 1; const p=survivalState.player; if(p){ p.maxHp=Math.max(40,p.maxHp*(1-0.025)); p.hp=Math.min(p.hp,p.maxHp); } u.damage*=1.16; break; }
        case "salvage": u.salvage += 1; break;
        case "choicePlus": u.choicePlus += 1; break;
        case "lucky": u.lucky += 1; break;
        case "revive": u.revive += 1; survivalState.reviveCharges = Math.min(SURVIVAL_MAX_SKILL_LEVEL,u.revive); break;
        case "clone": u.clone += 1; break;
        case "turret": u.turret += 1; break;
        case "sentry": u.sentry += 1; break;
        case "droneOrbit": u.droneOrbit += 1; break;
        case "droneShield": u.droneShield += 1; survivalState.shieldCharges = Math.min(12,survivalState.shieldCharges + 1); break;
        case "droneMissile": u.droneMissile += 1; break;
        case "bladeWave": u.bladeWave += 1; break;
        case "pulse": u.pulse += 1; break;
        case "chainShot": u.chainShot += 1; break;
        case "splitShot": u.splitShot += 1; break;
        case "fanShot": u.fanShot += 1; break;
        case "sniper": u.sniper += 1; break;
        case "scatterBomb": u.scatterBomb += 1; break;
        case "minefield": u.minefield += 1; break;
        case "flameTrail": u.flameTrail += 1; break;
        case "acidPool": u.acidPool += 1; break;
        case "storm": u.storm += 1; break;
        case "quake": u.quake += 1; break;
        case "shockwave": u.shockwave += 1; break;
        case "prism": u.prism += 1; break;
        case "voidRift": u.voidRift += 1; break;
        case "soulHarvest": u.soulHarvest += 1; break;
        case "executioner": u.executioner += 1; break;
        case "giantSlayer": u.giantSlayer += 1; break;
        case "bossBreaker": u.bossBreaker += 1; break;
        case "adrenaline": u.adrenaline += 1; break;
        case "secondWind": u.secondWind += 1; break;
        case "phaseShift": u.phaseShift += 1; break;
        case "phaseAnchor": u.phaseAnchor += 1; break;
        case "echoStep": u.echoStep += 1; break;
        case "kineticMemory": u.kineticMemory += 1; break;
        case "staticField": u.staticField += 1; break;
        case "orbitCompass": u.orbitCompass += 1; break;
        case "glassEdge": u.glassEdge += 1; break;
        case "warmCore": u.warmCore += 1; break;
        case "nightVision": u.nightVision += 1; break;
        case "pulseMap": u.pulseMap += 1; break;
        case "anchorWeight": u.anchorWeight += 1; break;
        case "mirrorSkin": u.mirrorSkin += 1; break;
        case "quietEngine": u.quietEngine += 1; break;
        case "starChart": u.starChart += 1; break;
        case "redLine": u.redLine += 1; break;
        case "deepBreath": u.deepBreath += 1; break;
        case "clockwork": u.clockwork += 1; break;
        case "blueprint": u.blueprint += 1; break;
        case "gravityBoots": u.gravityBoots += 1; break;
        case "lastSpark": u.lastSpark += 1; break;
        case "safePocket": u.safePocket += 1; break;
        default: return false;
    }
    return true;
}

function survivalCollectBossXp(gem) {
    if (!gem || !gem.bossGem) return;
    survivalState.score=(Number.isFinite(Number(survivalState.score))?Number(survivalState.score):0)+Math.round((Number(gem.value)||0)*3*(1+(Number(survivalState.upgrades.bossXp)||0)*0.08));
    // 황금 경험치는 실제 경험치에도 크게 반영하되, 보스 보상 UI와 일반 레벨업 UI가 겹치지 않도록 즉시 레벨만 계산합니다.
    survivalState.xp += gem.value;
    let bossLevelSafety = 0;
    while (survivalState.xp >= survivalState.xpNeed && survivalEligibleUpgrades().length > 0 && bossLevelSafety++ < 12) {
        survivalState.xp -= survivalState.xpNeed;
        survivalState.level += 1;
        survivalState.xpNeed = Math.min(3200, Math.floor(survivalState.xpNeed * 1.14 + 6 + Math.min(18, survivalState.level * 0.12)));
    }
    if (survivalEligibleUpgrades().length === 0) survivalState.xp = survivalState.xpNeed;
    survivalAddParticle(gem.x, gem.y, "#ffd83d", 48);
    const eligible = survivalEligibleUpgrades();
    const picked = [];
    while (eligible.length && picked.length < 3) {
        const index = Math.floor(Math.random() * eligible.length);
        const [skill] = eligible.splice(index, 1);
        picked.push(skill);
        survivalApplyUpgrade(skill.key);
    }
    survivalState.bossRewardSkills = picked;
    if (survivalLevelUp && survivalUpgradeChoices) {
        survivalState.pausedForLevel = true;
        survivalLevelUp.classList.remove("hidden");
        const eyebrow = survivalLevelUp.querySelector(".survival-eyebrow");
        const title = survivalLevelUp.querySelector("h3");
        if (eyebrow) eyebrow.textContent = "BOSS REWARD";
        if (title) title.textContent = picked.length ? "황금 경험치 보상 — 3개 기술이 동시에 강화되었습니다" : "모든 기술이 최대 레벨입니다";
        survivalUpgradeChoices.innerHTML = picked.map((u) => {
            const lv = survivalState.upgradeLevels[u.key] || 0;
            return `<div class="survival-upgrade-btn boss-reward-card">${survivalSkillIcon(u.key)}<strong>${u.title}</strong><small>Lv.${lv} · ${lv >= SURVIVAL_MAX_SKILL_LEVEL ? "MAX — 최종 강화" : "강화 완료"}</small></div>`;
        }).join("");
        if (!picked.length) {
            survivalUpgradeChoices.innerHTML = `<div class="survival-upgrade-btn boss-reward-card"><strong>MAX BUILD</strong><small>모든 기술이 최대 레벨에 도달했습니다.</small></div>`;
        }
        setTimeout(() => {
            survivalState.pausedForLevel = false;
            survivalLevelUp.classList.add("hidden");
        }, 1400);
    }
}

function survivalSkillIcon(key) {
    const hash = String(key || "skill").split("").reduce((a,c)=>((a*33+c.charCodeAt(0))>>>0),17);
    const n = hash % 10;
    const colors = ["#8de8ff","#9c8cff","#ffd66b","#ff8f9f","#76f0c0"];
    const c = colors[n % colors.length];
    const d = [
        `<path d="M16 3 19.5 12 29 16l-9.5 4L16 29l-3.5-9L3 16l9.5-4L16 3Z"/>`,
        `<circle cx="16" cy="16" r="10"/><path d="M16 6v20M6 16h20M9 9l14 14M23 9 9 23"/>`,
        `<path d="M16 3 19 11l8 3-8 3-3 10-3-10-8-3 8-3 3-8Z"/>`,
        `<path d="M7 23 12 8l4 8 4-10 5 17H7Z"/>`,
        `<rect x="5" y="5" width="22" height="22" rx="6"/><path d="m9 17 4-4 3 3 5-6"/>`,
        `<path d="M6 23 16 5l10 18"/><path d="M10 18h12"/>`,
        `<circle cx="16" cy="16" r="5"/><path d="M16 3v6M16 23v6M3 16h6M23 16h6"/>`,
        `<path d="M5 19c6 0 6-14 12-14 4 0 4 6 10 6"/><path d="M5 23h22"/>`,
        `<path d="M16 4 27 10v12l-11 6L5 22V10L16 4Z"/><path d="m11 16 3 3 6-7"/>`,
        `<path d="m16 4 3.2 7.8L28 13l-6.2 5.1L23 26l-7-4.1L9 26l1.2-7.9L4 13l8.8-1.2L16 4Z"/>`
    ][n];
    return `<span class="skill-vector-icon" style="--skill-icon:${c}"><svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${d}</svg></span>`;
}

function survivalUpgradePreview(key, level) {
    const n = level + 1;
    const text = {
        damage: `Lv.${level} → Lv.${n} · 전체 무기 피해 +16%`,
        fireRate: `Lv.${level} → Lv.${n} · 자동 공격 속도 +17%`,
        moveSpeed: `Lv.${level} → Lv.${n} · 이동 속도 +10%`,
        maxHp: `Lv.${level} → Lv.${n} · 최대 HP +16%`,
        magnet: `Lv.${level} → Lv.${n} · 경험치 흡수 범위 +25%`,
        projectile: `Lv.${level} → Lv.${n} · 기본 탄환 +1`,
        crit: `Lv.${level} → Lv.${n} · 치명타 확률 +5.5%`,
        bulletSpeed: `Lv.${level} → Lv.${n} · 탄속 +16%`,
        pierce: `Lv.${level} → Lv.${n} · 관통 +1`,
        area: `Lv.${level} → Lv.${n} · 공격 범위 +12%`,
        armor: `Lv.${level} → Lv.${n} · 피해 감소 단계 +1`,
        regen: `Lv.${level} → Lv.${n} · 지속 회복 단계 +1`,
        frost: `Lv.${level} → Lv.${n} · 감속 효과 +1`,
        orbital: `Lv.${level} → Lv.${n} · 회전 검 +1`,
        lightning: `Lv.${level} → Lv.${n} · 번개 공격 단계 +1`,
        bomb: `Lv.${level} → Lv.${n} · 폭발 발동 단계 +1`,
        drone: `Lv.${level} → Lv.${n} · 보조 탄환 드론 +1`,
        lifesteal: `Lv.${level} → Lv.${n} · 처치 회복 확률 증가`,
        xpBoost: `Lv.${level} → Lv.${n} · 경험치 획득량 +13%`,
        range: `Lv.${level} → Lv.${n} · 자동 조준 거리 +18%`,
        bulletSize: `Lv.${level} → Lv.${n} · 탄환 크기 +12%`,
        damageBoss: `Lv.${level} → Lv.${n} · 보스 피해 +12%`,
        eliteDamage: `Lv.${level} → Lv.${n} · 정예 피해 +10%`,
        knockback: `Lv.${level} → Lv.${n} · 적 밀쳐내기 +1`,
        dash: `Lv.${level} → Lv.${n} · 이동 가속 단계 +1`,
        shield: `Lv.${level} → Lv.${n} · 보호막 단계 +1`,
        thorns: `Lv.${level} → Lv.${n} · 접촉 반사 피해 +1`,
        pickupXp: `Lv.${level} → Lv.${n} · 경험치 흡수 속도 +22%`,
        vacuum: `Lv.${level} → Lv.${n} · 전장 경험치 강제 흡입력 강화`,
        weaponCooldown: `Lv.${level} → Lv.${n} · 특수 기술 쿨다운 감소`,
        lightningChain: `Lv.${level} → Lv.${n} · 번개 연쇄 대상 +2`,
        bombRadius: `Lv.${level} → Lv.${n} · 폭발 반경 +14%`,
        bombDamage: `Lv.${level} → Lv.${n} · 폭발 피해 +15%`,
        bladeDamage: `Lv.${level} → Lv.${n} · 회전 검 피해 +16%`,
        bladeSpeed: `Lv.${level} → Lv.${n} · 회전 검 속도 +12%`,
        droneDamage: `Lv.${level} → Lv.${n} · 드론 피해 +16%`,
        droneCount: `Lv.${level} → Lv.${n} · 드론 증원 +1`,
        critDamage: `Lv.${level} → Lv.${n} · 치명타 피해 +16%`,
        healthPickup: `Lv.${level} → Lv.${n} · 회복 구슬 회복량 +14%`,
        precision: `Lv.${level} → Lv.${n} · 약점 적중 피해 강화`,
        execute: `Lv.${level} → Lv.${n} · 저체력 적 마무리 피해 +16%`,
        homing: `Lv.${level} → Lv.${n} · 탄환 유도력 강화`,
        healthOrb: `Lv.${level} → Lv.${n} · 회복 구슬 확률/회복량 증가`,
        bossXp: `Lv.${level} → Lv.${n} · 보스 황금 경험치 +18%`,
        bossSlow: `Lv.${level} → Lv.${n} · 보스 이동 속도 -8%`,
        focus: `Lv.${level} → Lv.${n} · 같은 적 연속 공격 보너스 강화`,
        emergencyHeal: `Lv.${level} → Lv.${n} · 위험할 때 응급 회복 강화`,
        dodge: `Lv.${level} → Lv.${n} · 회피 확률 +3.5%`,
        repulse: `Lv.${level} → Lv.${n} · 퇴격 장치 범위/힘 증가`,
        overdrive: `Lv.${level} → Lv.${n} · 강화 후 오버드라이브 지속/화력 증가`,
        healingRain: `Lv.${level} → Lv.${n} · 회복 비 생성량/주기 강화`,
    };
    if (!text[key]) { const skill=SURVIVAL_UPGRADES.find(item=>item.key===key); return `Lv.${level} → Lv.${n} · ${skill?.desc || "고유 효과 강화"}`; }
    return text[key];
}

function survivalOpenLevelUp(reason = "LEVEL UP") {
    if (!survivalState.running || survivalState.won) return false;
    const available = survivalEligibleUpgrades();
    if (!available.length) {
        survivalState.pausedForLevel = false;
        survivalLevelUp?.classList.add("hidden");
        return false;
    }
    survivalState.pausedForLevel = true;
    survivalLevelUp?.classList.remove("hidden");
    const levelUpEyebrow = survivalLevelUp?.querySelector(".survival-eyebrow");
    const levelUpTitle = survivalLevelUp?.querySelector("h3");
    if (levelUpEyebrow) levelUpEyebrow.textContent = reason;
    if (levelUpTitle) levelUpTitle.textContent = "랜덤 3개 중 하나를 선택하세요";

    // Fisher-Yates로 정확히 서로 다른 기술 3개를 뽑습니다. 정렬 comparator에 Math.random을 넣지 않습니다.
    const pool = available.slice();
    for (let i = pool.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const rareKeys = new Set(["railgun","laser","meteor","iceNova","fireBottle","boomerang","gravityWell","voidRift","pulse","sniper"]);
    const rare = pool.filter(item => rareKeys.has(item.key));
    if (rare.length && pool.length >= 3 && Math.random() < 0.78) {
        const rarePick = rare[Math.floor(Math.random() * rare.length)];
        const idx = pool.findIndex(item => item.key === rarePick.key);
        if (idx > 2) [pool[2], pool[idx]] = [pool[idx], pool[2]];
    }
    const choiceCount = Math.min(survivalState.upgrades.choicePlus > 0 ? 4 : 3, pool.length);
    const choices = pool.slice(0, choiceCount);
    survivalState.currentUpgradeChoices = choices.map(item => item.key);

    if (survivalUpgradeChoices) {
        survivalUpgradeChoices.replaceChildren();
        const fragment = document.createDocumentFragment();
        for (const u of choices) {
            const level = survivalState.upgradeLevels[u.key] || 0;
            const button = document.createElement("button");
            button.className = "survival-upgrade-btn";
            button.type = "button";
            button.dataset.upgrade = u.key;
            button.innerHTML = `${survivalSkillIcon(u.key)}<strong>${u.title}</strong><small>${level > 0 ? survivalUpgradePreview(u.key, level) : `Lv.1 · ${u.desc}`}</small>`;
            button.addEventListener("click", () => survivalChooseUpgrade(u.key), { once: true });
            fragment.appendChild(button);
        }
        survivalUpgradeChoices.appendChild(fragment);
    }
    return true;
}

function survivalChooseUpgrade(key) {
    if (!key) return;
    if (!survivalApplyUpgrade(key)) return;
    survivalState.pausedForLevel = false;
    survivalLevelUp?.classList.add("hidden");
    survivalUpdateHud();
}

function survivalUpdateHud() {
    const minutes = Math.floor(survivalState.elapsed / 60);
    const seconds = Math.floor(survivalState.elapsed % 60);
    if (survivalTimeEl) survivalTimeEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    if (survivalWaveEl) survivalWaveEl.textContent = String(survivalState.wave);
    if (survivalKillsEl) survivalKillsEl.textContent = String(survivalState.kills);
    const survivalScoreEl = document.getElementById("survivalScore");
    if (!Number.isFinite(Number(survivalState.score))) survivalState.score=0;
    if (survivalScoreEl) survivalScoreEl.textContent = String(Math.max(0,Math.floor(Number(survivalState.score)||0)));
    if (survivalHpBar && survivalState.player) survivalHpBar.style.width = `${survivalClamp(survivalState.player.hp / survivalState.player.maxHp, 0, 1) * 100}%`;
    if (survivalXpBar) survivalXpBar.style.width = `${survivalClamp(survivalState.xp / survivalState.xpNeed, 0, 1) * 100}%`;
    const boss = survivalState.enemies.find((enemy) => enemy.boss);
    if (boss && survivalState.running) {
        survivalBossBanner?.classList.add("active");
        survivalBossHp?.classList.add("active");
        if (survivalBossBanner) survivalBossBanner.textContent = boss.finalBoss ? "FINAL BOSS" : "BOSS WAVE";
        if (survivalBossHpBar) survivalBossHpBar.style.width = `${survivalClamp(boss.hp / boss.maxHp, 0, 1) * 100}%`;
    } else {
        survivalBossBanner?.classList.remove("active");
        survivalBossHp?.classList.remove("active");
    }
}

function survivalMoveVector() {
    let x = 0;
    let y = 0;
    if (survivalState.keys.has("KeyW") || survivalState.keys.has("ArrowUp")) y -= 1;
    if (survivalState.keys.has("KeyS") || survivalState.keys.has("ArrowDown")) y += 1;
    if (survivalState.keys.has("KeyA") || survivalState.keys.has("ArrowLeft")) x -= 1;
    if (survivalState.keys.has("KeyD") || survivalState.keys.has("ArrowRight")) x += 1;
    if (survivalState.joystick.active || Math.abs(survivalState.joystick.x) + Math.abs(survivalState.joystick.y) > 0) {
        x = survivalState.joystick.x;
        y = survivalState.joystick.y;
    }
    const len = Math.hypot(x, y) || 1;
    return { x: x / len, y: y / len, magnitude: Math.min(1, Math.hypot(x, y)) };
}

async function survivalDeveloperCheat(){
    const code=window.prompt("개발자 코드","");
    if(code===null)return;
    try{
        const r=await fetch("/api/developer/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code})});
        const d=await r.json();
        if(!r.ok||!d.ok)throw new Error(d.message||"개발자 코드가 올바르지 않습니다.");

        // 인증은 다음 게임 시작에도 유지한다.
        // 따라서 인증 후 "게임 시작"을 눌러도 survivalReset() 때문에 MAX가 풀리지 않는다.
        survivalState.developerAuthorized = true;
        survivalForceMaxBuild();

        // MAX 상태에서는 XP가 꽉 차 있어도 어떤 선택창도 열리지 않는다.
        survivalState.xp=survivalState.xpNeed;
        survivalState.pausedForLevel=false;
        survivalLevelUp?.classList.add("hidden");
        survivalUpdateHud();
        survivalAddParticle(survivalState.player.x||0,survivalState.player.y||0,"#ffd83d",120);
        alert("개발자 모드 활성화: 100개 기술 Lv.5 MAX + 실제 능력치 MAX");
    }catch(e){alert(e.message||"개발자 인증 실패");}
}
function survivalPause(){if(!survivalState.running||survivalState.won)return;survivalState.pauseMenuOpen=true;survivalState.pausedForLevel=true;survivalPauseOverlay?.classList.remove("hidden");}
function survivalResume(){survivalState.pauseMenuOpen=false;survivalState.pausedForLevel=false;survivalPauseOverlay?.classList.add("hidden");survivalState.last=performance.now();}
function survivalQuitRun(){survivalState.pauseMenuOpen=false;survivalPauseOverlay?.classList.add("hidden");survivalEnd(false);}

function survivalUpdate(dt) {
    const p = survivalState.player;
    const u = survivalState.upgrades;
    if (!p || !survivalState.running || survivalState.pausedForLevel || survivalState.won) return;

    if (!survivalState.bossActive) survivalState.elapsed += dt;
    survivalState.bossTransition = Math.max(0, survivalState.bossTransition - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    survivalState.wave = 1 + Math.floor(survivalState.elapsed / survivalState.waveDuration);
    survivalState.orbitalAngle += dt * (2.2 * u.bladeSpeed * (1 + Math.max(0, u.bladeSpeed - 1) * 0.35));
    survivalState.lightningTimer += dt;
    survivalState.bombTimer += dt;
    survivalState.regenTimer += dt;
    survivalState.repulseTimer += dt;
    survivalState.overdriveTimer = Math.max(0, survivalState.overdriveTimer - dt);
    if (survivalState.finalOverdriveLevel > 0) {
        survivalState.finalPowerTimer += dt;
        const interval = 10;
        if (survivalState.finalPowerTimer >= interval) {
            const bursts = Math.floor(survivalState.finalPowerTimer / interval);
            survivalState.finalPowerTimer -= bursts * interval;
            for (let i = 0; i < bursts; i += 1) {
                survivalState.finalPowerMultiplier *= 2;
                survivalState.upgrades.damage *= 2;
            }
            survivalAddParticle(p.x, p.y, "#ffe36b", 90 + survivalState.finalOverdriveLevel * 15);
        }
    }
    if (survivalState.upgrades.regen > 0 && survivalState.regenTimer >= 1) {
        survivalState.regenTimer = 0;
        p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.005 * survivalState.upgrades.regen);
    }
    if (survivalState.upgrades.warmCore > 0 && (survivalState.keys.size===0 && Math.hypot(survivalState.joystick.x||0,survivalState.joystick.y||0)<0.08) && survivalState.regenTimer >= 0.5) {
        p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.0025 * survivalState.upgrades.warmCore);
    }
    if (survivalState.upgrades.deepBreath > 0 && p.hp >= p.maxHp * 0.98) p.invuln = Math.max(p.invuln, 0.03 * survivalState.upgrades.deepBreath);

    const move = survivalMoveVector();
    if (u.echoStep > 0 && move.magnitude > 0.75) p._echoTimer = 0.55;
    p._echoTimer = Math.max(0, (p._echoTimer || 0) - dt);
    if (p._echoTimer > 0) p._echoArea = 1 + u.echoStep * 0.08; else p._echoArea = 1;
    if (u.kineticMemory > 0 && move.magnitude > 0.82) p._kineticBonus = Math.min(1.8, (p._kineticBonus || 0) + dt * u.kineticMemory * 0.12);
    else p._kineticBonus = Math.max(0, (p._kineticBonus || 0) - dt * 0.5);
    if (u.quietEngine > 0 && survivalState.shotTimer < 0.02 && move.magnitude > 0.2) p._quietBonus = 1 + u.quietEngine * 0.025; else p._quietBonus = 1;
    const lowHpRatio = p.hp / Math.max(1,p.maxHp);
    const speed = 170 * survivalState.upgrades.moveSpeed * (p._quietBonus || 1) * (1 + survivalState.upgrades.haste * 0.035) * (move.magnitude > 0.82 ? 1 + survivalState.upgrades.dash * 0.035 : 1) * (lowHpRatio < 0.4 ? 1 + survivalState.upgrades.adrenaline * 0.04 : 1);
    p.x += move.x * speed * move.magnitude * dt;
    p.y += move.y * speed * move.magnitude * dt;

    if (survivalState.bossActive) {
        const minX = survivalState.bossCenterX - survivalState.bossFenceHalfW + p.radius + 8;
        const maxX = survivalState.bossCenterX + survivalState.bossFenceHalfW - p.radius - 8;
        const minY = survivalState.bossCenterY - survivalState.bossFenceHalfH + p.radius + 8;
        const maxY = survivalState.bossCenterY + survivalState.bossFenceHalfH - p.radius - 8;
        p.x = survivalClamp(p.x, minX, maxX);
        p.y = survivalClamp(p.y, minY, maxY);
    }

    survivalState.spawnTimer += dt;
    const waveInCycle = ((survivalState.wave - 1) % survivalState.bossIntervalWaves) + 1;
    // 매 5웨이브 사이클의 2번째 웨이브는 대규모 러시.
    // 그 외 웨이브도 초반 1~2웨이브 정도의 밀도를 유지해서 화면이 비지 않게 한다.
    const intenseWave = waveInCycle === 2;
    const maxEnemies = (intenseWave ? 230 : 175) + Math.min(120, survivalState.wave * 4);
    const spawnEvery = intenseWave
        ? Math.max(0.10, 0.22 - survivalState.wave * 0.0018)
        : Math.max(0.25, 0.38 - survivalState.wave * 0.0014);
    if (!survivalState.bossActive && survivalState.enemies.length < maxEnemies && survivalState.spawnTimer >= spawnEvery) {
        survivalState.spawnTimer = 0;
        const amount = intenseWave
            ? Math.min(12, 7 + Math.floor(survivalState.wave / 6))
            : Math.min(6, 3 + Math.floor(survivalState.wave / 10));
        for (let i = 0; i < amount && survivalState.enemies.length < maxEnemies; i += 1) survivalSpawnEnemy();
    }

    if (!survivalState.bossActive && survivalState.elapsed >= survivalState.nextBossAt) {
        survivalSpawnBoss();
    }

    const target = survivalNearestEnemy();
    survivalState.shotTimer += dt;
    const shotDelay = Math.max(0.12, 0.42 / Math.sqrt(survivalState.upgrades.fireRate));
    if (target && survivalState.shotTimer >= shotDelay) {
        survivalState.shotTimer = 0;
        survivalShoot(target);
    }

    for (const b of survivalState.bullets) {
        if (!b.enemyBullet && b.homing > 0) {
            let nearest = null;
            let nearestD = 170 * Math.min(4, b.homing);
            for (const e of survivalState.enemies) {
                const d = Math.hypot(e.x - b.x, e.y - b.y);
                if (d < nearestD) { nearest = e; nearestD = d; }
            }
            if (nearest) {
                const targetAngle = Math.atan2(nearest.y - b.y, nearest.x - b.x);
                const currentAngle = Math.atan2(b.vy, b.vx);
                let delta = Math.atan2(Math.sin(targetAngle - currentAngle), Math.cos(targetAngle - currentAngle));
                const nextAngle = currentAngle + survivalClamp(delta, -2.8 * dt * b.homing, 2.8 * dt * b.homing);
                const speed = Math.hypot(b.vx, b.vy);
                b.vx = Math.cos(nextAngle) * speed;
                b.vy = Math.sin(nextAngle) * speed;
            }
        }
        if (b.boomerang && b.life < 0.95) {
            const ang=Math.atan2(p.y-b.y,p.x-b.x), speed=Math.max(260,Math.hypot(b.vx,b.vy));
            b.vx += Math.cos(ang)*900*dt; b.vy += Math.sin(ang)*900*dt;
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
    }
    const expiredBullets=[];
    for(const b of survivalState.bullets){if(b.life<=0) expiredBullets.push(b);}
    survivalState.bullets = survivalState.bullets.filter((b) => b.life > 0);
    // 안전장치: 어떤 조합에서도 투사체 수가 폭증하지 않도록 상한을 둡니다.
    if (survivalState.bullets.length > 220) survivalState.bullets.splice(220);

    for (let i = survivalState.enemies.length - 1; i >= 0; i -= 1) {
        const e = survivalState.enemies[i];
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        e.hitFlash = Math.max(0, e.hitFlash - dt); if(e.bleed>0){e.bleed-=dt;e.hp-=18*u.damage*u.bleed*dt;} if(e.burn>0){e.burn-=dt;e.hp-=26*u.damage*u.burn*dt;}
        const frostSlow = 1 / (1 + survivalState.upgrades.frost * 0.11);
        const timeSlow = 1 / (1 + survivalState.upgrades.timeWarp * 0.06);
        const bossSlow = e.boss ? (1 / (1 + survivalState.upgrades.bossSlow * 0.08)) : 1;
        if (e.boss) {
            e.shootTimer += dt; e.dashTimer=(e.dashTimer||0)-dt;
            if (e.bossNumber>=2 && e.dashTime<=0 && e.dashTimer<=0) { e.dashTime=Math.max(.34,.75-e.bossNumber*.018); e.dashTimer=Math.max(1.8,4.2-e.bossNumber*.12); const a=Math.atan2(p.y-e.y,p.x-e.x); e.dashVx=Math.cos(a)*(330+e.bossNumber*16); e.dashVy=Math.sin(a)*(330+e.bossNumber*16); survivalAddParticle(e.x,e.y,e.finalBoss?'#ffd447':'#ff647b',34); }
            if(e.dashTime>0){e.dashTime-=dt;e.x+=e.dashVx*dt;e.y+=e.dashVy*dt;} else {e.x+=(dx/d)*e.speed*frostSlow*bossSlow*timeSlow*dt;e.y+=(dy/d)*e.speed*frostSlow*bossSlow*timeSlow*dt;}
            const minX=survivalState.bossCenterX-survivalState.bossFenceHalfW+e.r+6,maxX=survivalState.bossCenterX+survivalState.bossFenceHalfW-e.r-6,minY=survivalState.bossCenterY-survivalState.bossFenceHalfH+e.r+6,maxY=survivalState.bossCenterY+survivalState.bossFenceHalfH-e.r-6;
            e.x=survivalClamp(e.x,minX,maxX);e.y=survivalClamp(e.y,minY,maxY);
            if(e.shootTimer>Math.max(.75,2.2-e.bossNumber*.05)&&d<800){e.shootTimer=0;const count=8+Math.min(8,Math.floor(e.bossNumber/2));for(let n=0;n<count;n++){const a=Math.PI*2*n/count;survivalState.bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*(170+e.bossNumber*4),vy:Math.sin(a)*(170+e.bossNumber*4),radius:8+Math.min(5,e.bossNumber*.15),damage:(12+e.bossNumber*2.4)*(e.finalBoss?1.35:1),life:2.5,enemyBullet:true});}}
        } else { e.x+=(dx/d)*e.speed*frostSlow*timeSlow*dt; e.y+=(dy/d)*e.speed*frostSlow*timeSlow*dt; }
        if (d < p.radius + e.r) {
            const contactMultiplier = 4.15 + Math.min(2.2, survivalState.wave * 0.03);
            const contactDamage = e.damage * dt * contactMultiplier;
            survivalTakeDamage(contactDamage);
            // 몸에 끼어도 적을 튕겨내지 않고, 플레이어가 받는 접촉 피해만큼 적도 함께 피해를 받습니다.
            e.hp -= contactDamage * (e.boss ? 0.72 : 1);
            if (u.thorns > 0) e.hp -= 16 * u.damage * u.thorns * dt * 2.6;
        }
    }

    // 몬스터끼리 겹쳐 한 덩어리처럼 보이지 않도록 인접 셀 기반 분리 물리를 적용합니다.
    const buckets=new Map(),cellSize=64; for(const e of survivalState.enemies){const cx=Math.floor(e.x/cellSize),cy=Math.floor(e.y/cellSize),key=`${cx}:${cy}`;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(e);}
    for(const e of survivalState.enemies){const cx=Math.floor(e.x/cellSize),cy=Math.floor(e.y/cellSize);for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){for(const q of buckets.get(`${cx+ox}:${cy+oy}`)||[]){if(q===e||q.boss||e.boss)continue;const dx=e.x-q.x,dy=e.y-q.y,d=Math.hypot(dx,dy)||.001,minD=e.r+q.r+2;if(d<minD){const push=(minD-d)*.5;e.x+=dx/d*push;e.y+=dy/d*push;q.x-=dx/d*push;q.y-=dy/d*push;}}}}

    for (let bi = survivalState.bullets.length - 1; bi >= 0; bi -= 1) {
        const b = survivalState.bullets[bi];
        if (b.enemyBullet) {
            const d = Math.hypot(b.x - p.x, b.y - p.y);
            if (d < p.radius + b.radius) {
                survivalTakeDamage(b.damage);
                survivalState.bullets.splice(bi, 1);
            }
            continue;
        }
        let hit = false;
        for (let ei = survivalState.enemies.length - 1; ei >= 0; ei -= 1) {
            const e = survivalState.enemies[ei];
            const d = Math.hypot(b.x - e.x, b.y - e.y);
            if (d < e.r + b.radius) {
                let hitDamage = b.damage;
                if (u.glassEdge > 0 && p.hp >= p.maxHp * 0.75) hitDamage *= 1 + u.glassEdge * 0.04;
                if (u.kineticMemory > 0) hitDamage *= 1 + Math.min(0.35, (p._kineticBonus || 0));
                if (u.mirrorSkin > 0) hitDamage *= (p._mirrorBoost || 1);
                p._mirrorBoost = Math.max(1, (p._mirrorBoost || 1) - dt * 0.08);
                if (u.lastSpark > 0 && p.hp <= p.maxHp * 0.28) hitDamage *= 1 + u.lastSpark * 0.06;
                if (u.starChart > 0 && (Math.abs(e.x-p.x)>520 || Math.abs(e.y-p.y)>520)) hitDamage *= 1 + u.starChart * 0.05;
                if (u.redLine > 0 && e.boss && e.dashTime > 0) hitDamage *= 1 + u.redLine * 0.10;

                if (u.soulHarvest > 0) hitDamage *= 1 + Math.min(2.2, survivalState.soulStacks * u.soulHarvest * 0.008);
                if (e.boss) hitDamage *= u.damageBoss;
                else if (e.type === "tank" || e.type === "brute" || e.type === "shooter") hitDamage *= u.eliteDamage;
                if (u.execute > 0 && e.hp / e.maxHp < 0.28) hitDamage *= 1 + Math.min(1.5, u.execute * 0.16);
                if (u.focus > 0) {
                    if (survivalState.focusTargetId === e.id) {
                        survivalState.focusStacks = Math.min(8, survivalState.focusStacks + 1);
                    } else {
                        survivalState.focusTargetId = e.id;
                        survivalState.focusStacks = 1;
                    }
                    hitDamage *= 1 + Math.min(0.75, survivalState.focusStacks * u.focus * 0.018);
                }
                if (u.speedDamage > 1) {
                    const moveVector = survivalMoveVector();
                    hitDamage *= 1 + Math.min(1.8, moveVector.magnitude * (u.speedDamage - 1) * 0.12);
                }
                if(u.sniper>0)hitDamage*=1+Math.min(2.4,d/260*u.sniper*.08);
                if(u.precision>0&&d<e.r*.45+b.radius)hitDamage*=1+Math.min(2.2,u.precision*.12);
                if(u.giantSlayer>0)hitDamage*=1+Math.min(2.5,Math.max(0,e.r-18)*u.giantSlayer*.022);
                if(u.overheat>0)hitDamage*=1+Math.min(1.5,u.overheat*.035);
                if(e.boss&&e.dashTime>0&&u.bossBreaker>0){e.dashTime=0;e.dashTimer=Math.max(e.dashTimer,1.2);hitDamage*=1+u.bossBreaker*.12;}
                if(u.executioner>0 && !e.boss && e.hp/e.maxHp<0.10 && Math.random()<Math.min(.65,u.executioner*.12)) hitDamage=e.hp+999999;
                e.hp -= hitDamage;
                if(u.ricochet>0 && !b.ricochetDepth){
                    const other=survivalState.enemies.filter(q=>q!==e).sort((a,z)=>survivalDist(e,a)-survivalDist(e,z))[0];
                    if(other && survivalDist(e,other)<220+u.ricochet*18) other.hp-=hitDamage*(0.20+u.ricochet*0.035);
                }
                if(u.shrapnel>0 && !b.shrapnel){
                    const radius=52+u.shrapnel*8;
                    for(const other of survivalState.enemies){
                        if(other===e)continue;
                        const d2=survivalDist(e,other);
                        if(d2<radius) other.hp-=hitDamage*(0.08+u.shrapnel*0.018)*(1-d2/radius);
                    }
                }
                if(u.chainShot>0 && !b.chainShot){
                    const chainTargets=survivalState.enemies.filter(q=>q!==e).sort((a,z)=>survivalDist(e,a)-survivalDist(e,z)).slice(0,Math.min(5,u.chainShot+1));
                    for(const q of chainTargets){if(survivalDist(e,q)<180+u.chainShot*24) q.hp-=hitDamage*(.18+.04*u.chainShot);}
                }
                if(u.prism>0 && !b.prism){
                    const rays=Math.min(6,2+u.prism); const radius=150+u.prism*14;
                    for(const other of survivalState.enemies){
                        if(other===e)continue;
                        const d2=survivalDist(e,other); if(d2>radius)continue;
                        const aa=Math.atan2(other.y-e.y,other.x-e.x);
                        const sector=Math.abs(Math.sin(aa*rays*0.5));
                        if(sector<0.32) other.hp-=hitDamage*(0.08+u.prism*0.016);
                    }
                }
                if(u.bleed>0)e.bleed=Math.max(e.bleed||0,1.4+u.bleed*.2); if(u.burn>0)e.burn=Math.max(e.burn||0,1.8+u.burn*.2);
                if (u.knockback > 0) {
                    const push=Math.min(92,8+u.knockback*4),pd=Math.hypot(e.x-p.x,e.y-p.y)||1; e.x+=((e.x-p.x)/pd)*push;e.y+=((e.y-p.y)/pd)*push;
                    if(e.boss&&survivalState.bossActive){e.x=survivalClamp(e.x,survivalState.bossCenterX-survivalState.bossFenceHalfW+e.r+6,survivalState.bossCenterX+survivalState.bossFenceHalfW-e.r-6);e.y=survivalClamp(e.y,survivalState.bossCenterY-survivalState.bossFenceHalfH+e.r+6,survivalState.bossCenterY+survivalState.bossFenceHalfH-e.r-6);}
                }
                e.hitFlash = 0.08;
                survivalAddParticle(b.x, b.y, b.critical ? "#ffe36e" : e.color, b.critical ? 5 : 2);
                hit = true;
                if (e.hp <= 0) survivalKillEnemy(ei);
                if (b.pierceLeft > 0) {
                    b.pierceLeft -= 1;
                    hit = false;
                }
                if (!b.pierceLeft && hit) break;
            }
        }
        if (hit) survivalState.bullets.splice(bi, 1);
    }

    const magnetRadius = 70 * survivalState.upgrades.magnet * survivalState.upgrades.pickupXp;
    for (let gi = survivalState.gems.length - 1; gi >= 0; gi -= 1) {
        const g = survivalState.gems[gi];
        const d = Math.hypot(g.x - p.x, g.y - p.y);
        if (d < magnetRadius) {
            const pull = d < 20 ? 8 : 5;
            g.x += ((p.x - g.x) / (d || 1)) * pull * 55 * dt;
            g.y += ((p.y - g.y) / (d || 1)) * pull * 55 * dt;
        }
        if (d < p.radius + g.radius + 5) {
            if (g.healthGem) {
                const orbLevel=survivalState.upgrades.healthOrb||0; const pickupLevel=survivalState.upgrades.healthPickup||0; const healRatio=Math.min(0.20,(0.0075+orbLevel*0.0065+orbLevel*orbLevel*0.00055)*(0.96+pickupLevel*0.018)); p.hp = Math.min(p.maxHp, p.hp + p.maxHp * healRatio);
            } else if (g.bossGem) {
                survivalCollectBossXp(g);
            } else {
                survivalCollectXp(g.value);
            }
            survivalAddParticle(g.x, g.y, g.color, g.bossGem ? 22 : 3);
            survivalState.gems.splice(gi, 1);
        }
    }

    // Orbital blades
    if (survivalState.upgrades.orbital > 0) {
        const blades = Math.min(12, survivalState.upgrades.orbital);
        const orbitRadius = 66 * Math.sqrt(survivalState.upgrades.area);
        for (let b = 0; b < blades; b += 1) {
            const a = survivalState.orbitalAngle + (Math.PI * 2 * b) / blades;
            const ox = p.x + Math.cos(a) * orbitRadius;
            const oy = p.y + Math.sin(a) * orbitRadius;
            for (const e of survivalState.enemies) {
                if (Math.hypot(e.x - ox, e.y - oy) < e.r + 14) {
                    e.hp -= 34 * survivalState.upgrades.damage * survivalState.upgrades.bladeDamage * dt * 2.2;
                    e.hitFlash = 0.05;
                }
            }
        }
    }

    // Lightning chain
    if (survivalState.upgrades.lightning > 0 && survivalState.lightningTimer >= Math.max(0.55, (3.0 - survivalState.upgrades.lightning * 0.18) / (1 + survivalState.upgrades.weaponCooldown * 0.06))) {
        survivalState.lightningTimer = 0;
        const targets = [...survivalState.enemies].sort((a,b) => survivalDist(p,a) - survivalDist(p,b)).slice(0, Math.min(14, 2 + survivalState.upgrades.lightning + survivalState.upgrades.lightningChain * 2));
        for (const e of targets) {
            e.hp -= 85 * survivalState.upgrades.damage;
            e.hitFlash = 0.14;
            survivalAddParticle(e.x, e.y, "#9be7ff", 10);
        }
        survivalState.lightningFlash = 0.15;
    }

    // Bomb pulse
    if (survivalState.upgrades.bomb > 0 && survivalState.bombTimer >= Math.max(1.8, (8 - survivalState.upgrades.bomb * 0.35) / (1 + survivalState.upgrades.weaponCooldown * 0.07))) {
        survivalState.bombTimer = 0;
        const radius = 150 * Math.sqrt(survivalState.upgrades.area * survivalState.upgrades.bombRadius) + survivalState.upgrades.bomb * 10;
        for (const e of survivalState.enemies) {
            const d = survivalDist(p,e);
            if (d < radius) e.hp -= 150 * survivalState.upgrades.damage * survivalState.upgrades.bombDamage * (1 - d / radius * 0.55);
        }
        survivalAddParticle(p.x, p.y, "#ffb45d", 35);
    }

    if (u.repulse > 0 && survivalState.repulseTimer >= Math.max(1.8, 5.2 - u.repulse * 0.16)) {
        survivalState.repulseTimer = 0;
    survivalState.pauseMenuOpen = false; survivalState.bossDashTimer=0; survivalState.bossDashTime=0; survivalState.bossDashVx=0; survivalState.bossDashVy=0;
    survivalState.fireBottleTimer=0; survivalState.laserTimer=0; survivalState.meteorTimer=0; survivalState.iceNovaTimer=0; survivalState.poisonTimer=0; survivalState.vortexTimer=0; survivalState.pulseTimer=0; survivalState.fanShotTimer=0; survivalState.stormTimer=0; survivalState.quakeTimer=0; survivalState.healingRainTimer=0; survivalState.vacuumTimer=0; survivalState.droneMissileTimer=0; survivalState.bladeWaveTimer=0; survivalState.railgunTimer=0;
        const radius = 120 + u.repulse * 16;
        for (const e of survivalState.enemies) {
            const dx = e.x - p.x;
            const dy = e.y - p.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < radius) {
                const push = (1 - d / radius) * (90 + u.repulse * 14);
                e.x += (dx / d) * push; e.y += (dy / d) * push;
                if(e.boss&&survivalState.bossActive){e.x=survivalClamp(e.x,survivalState.bossCenterX-survivalState.bossFenceHalfW+e.r+6,survivalState.bossCenterX+survivalState.bossFenceHalfW-e.r-6);e.y=survivalClamp(e.y,survivalState.bossCenterY-survivalState.bossFenceHalfH+e.r+6,survivalState.bossCenterY+survivalState.bossFenceHalfH-e.r-6);}
            }
        }
        survivalAddParticle(p.x, p.y, "#a7edff", 24);
    }

    survivalState.fireBottleTimer+=dt;survivalState.laserTimer+=dt;survivalState.meteorTimer+=dt;survivalState.iceNovaTimer+=dt;survivalState.poisonTimer+=dt;survivalState.vortexTimer+=dt;survivalState.pulseTimer+=dt;survivalState.fanShotTimer+=dt;survivalState.stormTimer+=dt;survivalState.quakeTimer+=dt;survivalState.healingRainTimer+=dt;survivalState.vacuumTimer+=dt;survivalState.droneMissileTimer+=dt;survivalState.bladeWaveTimer+=dt;survivalState.railgunTimer+=dt;
    if(u.fireBottle&&survivalState.fireBottleTimer>Math.max(2.5,5.2-u.fireBottle*.18)){survivalState.fireBottleTimer=0;const t=survivalNearestEnemy();if(t){const r=95+u.fireBottle*10;for(const e of survivalState.enemies){const d=survivalDist(t,e);if(d<r)e.hp-=75*u.damage*(1-d/r*.5);}survivalAddParticle(t.x,t.y,'#ff7a3d',45);}}
    if(u.laser&&survivalState.laserTimer>Math.max(.55,1.9-u.laser*.1)){survivalState.laserTimer=0;const t=survivalNearestEnemy();if(t){t.hp-=170*u.damage*(1+u.laser*.08);t.hitFlash=.12;survivalAddParticle(t.x,t.y,'#c6f6ff',18);}}
    if(u.meteor&&survivalState.meteorTimer>Math.max(1.2,4.8-u.meteor*.16)){survivalState.meteorTimer=0;const t=survivalNearestEnemy();if(t){const r=110+u.meteor*8;for(const e of survivalState.enemies){const d=survivalDist(t,e);if(d<r)e.hp-=260*u.damage*(1-d/r*.6);}survivalAddParticle(t.x,t.y,'#ffb24a',65);}}
    if(u.iceNova&&survivalState.iceNovaTimer>Math.max(2.2,7-u.iceNova*.3)){survivalState.iceNovaTimer=0;const r=180+u.iceNova*14;for(const e of survivalState.enemies)if(survivalDist(p,e)<r)e.speed*=Math.max(.4,1-.12*u.iceNova);survivalAddParticle(p.x,p.y,'#9de9ff',55);}
    if(u.poisonCloud&&survivalState.poisonTimer>.5){survivalState.poisonTimer=0;const r=105+u.poisonCloud*9;for(const e of survivalState.enemies)if(survivalDist(p,e)<r)e.hp-=22*u.damage*u.poisonCloud*.2;}
    if(u.vortex&&survivalState.vortexTimer>Math.max(2,5.5-u.vortex*.2)){survivalState.vortexTimer=0;const r=240+u.vortex*15;for(const e of survivalState.enemies){const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;if(d<r){e.x+=dx/d*(1-d/r)*90;e.y+=dy/d*(1-d/r)*90;}}survivalAddParticle(p.x,p.y,'#b88cff',45);}
    if(u.pulse&&survivalState.pulseTimer>Math.max(.9,3.2-u.pulse*.12)){survivalState.pulseTimer=0;const r=135+u.pulse*12;for(const e of survivalState.enemies)if(survivalDist(p,e)<r)e.hp-=110*u.damage;survivalAddParticle(p.x,p.y,'#65e6ff',35);}
    if(u.fanShot&&survivalState.fanShotTimer>Math.max(.7,2.5-u.fanShot*.1)){survivalState.fanShotTimer=0;const t=survivalNearestEnemy();if(t){const a=Math.atan2(t.y-p.y,t.x-p.x);for(let n=-2;n<=2;n++){const aa=a+n*.18;survivalState.bullets.push({x:p.x,y:p.y,vx:Math.cos(aa)*500,vy:Math.sin(aa)*500,radius:5,damage:24*u.damage,life:1.5,pierceLeft:1,homing:u.homing*.7});}}}
    if(u.storm&&survivalState.stormTimer>Math.max(.5,2.8-u.storm*.12)){survivalState.stormTimer=0;for(let n=0;n<Math.min(4+u.storm,12);n++){const t=survivalState.enemies[Math.floor(Math.random()*survivalState.enemies.length)];if(!t)break;t.hp-=90*u.damage;survivalAddParticle(t.x,t.y,'#bfeaff',16);}}
    if(u.quake&&survivalState.quakeTimer>Math.max(2.2,6.5-u.quake*.2)){survivalState.quakeTimer=0;for(const e of survivalState.enemies)e.hp-=95*u.damage;survivalAddParticle(p.x,p.y,'#d6a06b',60);}
    if(u.shockwave&&survivalState.quakeTimer>Math.max(1.5,4.5-u.shockwave*.15)){survivalState.quakeTimer=0;const r=150+u.shockwave*14;for(const e of survivalState.enemies){const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1;if(d<r){e.hp-=70*u.damage;e.x+=dx/d*80;e.y+=dy/d*80;}}}
    if(u.vacuum&&survivalState.vacuumTimer>Math.max(.65,3.8-u.vacuum*.22)){survivalState.vacuumTimer=0;for(const g of survivalState.gems){g.x+=(p.x-g.x)*.35;g.y+=(p.y-g.y)*.35;}}
    if(u.healingRain&&survivalState.healingRainTimer>Math.max(6.2,10.4-u.healingRain*.72)){survivalState.healingRainTimer=0;const rainCount=Math.min(5,u.healingRain);for(let i=0;i<rainCount;i++)survivalState.gems.push({x:p.x+survivalRandom(-180,180),y:p.y+survivalRandom(-180,180),value:0,radius:7,color:'#ff7ea4',bossGem:false,healthGem:true});}
    if(u.droneMissile&&survivalState.droneMissileTimer>Math.max(1,3.8-u.droneMissile*.15)){survivalState.droneMissileTimer=0;const t=survivalNearestEnemy();if(t)survivalState.bullets.push({x:p.x,y:p.y,vx:0,vy:-20,radius:8,damage:95*u.damage*(1+u.droneMissile*.1),life:3,pierceLeft:2,drone:true,homing:Math.max(4,u.homing*1.8),missile:true});}
    if(u.bladeWave&&survivalState.bladeWaveTimer>Math.max(.8,3.2-u.bladeWave*.14)){survivalState.bladeWaveTimer=0;for(let n=0;n<8;n++){const a=n*Math.PI/4;survivalState.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*380,vy:Math.sin(a)*380,radius:6,damage:55*u.damage,life:1.2,pierceLeft:2});}}
    if(u.railgun&&survivalState.railgunTimer>Math.max(1.8,6.5-u.railgun*.25)){survivalState.railgunTimer=0;const t=survivalNearestEnemy();if(t){const a=Math.atan2(t.y-p.y,t.x-p.x);for(const e of survivalState.enemies){const relx=e.x-p.x,rely=e.y-p.y,perp=Math.abs(relx*Math.sin(a)-rely*Math.cos(a));if(perp<22)e.hp-=320*u.damage*(1+u.railgun*.1);}survivalAddParticle(t.x,t.y,'#ffffff',80);}}

    // 5강 특수 기술들의 실제 전투 효과. 모두 공용 bullet/적 시스템을 사용하므로 업그레이드 즉시 체감됩니다.
    survivalState.specialTimer += dt;
    survivalState.cloneTimer += dt;
    survivalState.phaseShiftTimer += dt;
    if(survivalState.specialTimer >= .28){
        const step=survivalState.specialTimer; survivalState.specialTimer=0;
        if (u.staticField > 0) { const r = 54 + u.staticField * 7; for (const e of survivalState.enemies) { const d = survivalDist(p,e); if (d < r) e.hp -= 12 * u.damage * u.staticField * step; } }
        if (u.phaseAnchor > 0 && Math.hypot(move.x,move.y) < 0.05) { const r=80+u.phaseAnchor*10; for(const e of survivalState.enemies) if(survivalDist(p,e)<r) { e.hp -= 10*u.damage*u.phaseAnchor*step; e.speed *= Math.max(.82,1-u.phaseAnchor*.018); } }
        if(u.boomerang>0){const t=survivalNearestEnemy(); if(t){const a=Math.atan2(t.y-p.y,t.x-p.x); for(let q=0;q<Math.min(3,u.boomerang);q++){const aa=a+(q-(Math.min(3,u.boomerang)-1)/2)*.18; survivalState.bullets.push({x:p.x,y:p.y,vx:Math.cos(aa)*560,vy:Math.sin(aa)*560,radius:6,damage:70*u.damage,life:1.9,pierceLeft:2,boomerang:true});}}}
        if(u.gravityWell>0 && Math.floor(survivalState.elapsed*4)!==Math.floor((survivalState.elapsed-step)*4)){const r=170+u.gravityWell*24; for(const e of survivalState.enemies){const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;if(d<r){e.x+=dx/d*(1-d/r)*130*step;e.y+=dy/d*(1-d/r)*130*step;e.hp-=18*u.damage*u.gravityWell*step;}} survivalAddParticle(p.x,p.y,'#8d6dff',18);}
        if(u.clone>0 && survivalState.cloneTimer>Math.max(1.5,4.2-u.clone*.2)){survivalState.cloneTimer=0;const r=90+u.clone*12;for(const e of survivalState.enemies)if(survivalDist(p,e)<r)e.hp-=45*u.damage*u.clone;survivalAddParticle(p.x+survivalRandom(-25,25),p.y+survivalRandom(-25,25),'#7ee7ff',22);}
        if(u.turret>0 && Math.floor(survivalState.elapsed*2)!==Math.floor((survivalState.elapsed-step)*2)){const t=survivalNearestEnemy();if(t){const a=Math.atan2(t.y-p.y,t.x-p.x);survivalState.bullets.push({x:p.x+Math.cos(a+1.57)*35,y:p.y+Math.sin(a+1.57)*35,vx:Math.cos(a)*600,vy:Math.sin(a)*600,radius:5,damage:65*u.damage*u.turret*.35,life:1.6,pierceLeft:1,turret:true});}}
        if(u.sentry>0 && Math.floor(survivalState.elapsed)!==Math.floor(survivalState.elapsed-step)){const t=survivalNearestEnemy();if(t){const a=Math.atan2(t.y-p.y,t.x-p.x);survivalState.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*720,vy:Math.sin(a)*720,radius:4,damage:95*u.damage*u.sentry*.28,life:1.5,pierceLeft:2,sentry:true});}}
        if(u.droneOrbit>0){const r=88;const blades=Math.min(8,u.droneOrbit+1);for(let q=0;q<blades;q++){const a=survivalState.orbitalAngle*1.4+q*Math.PI*2/blades;const ox=p.x+Math.cos(a)*r,oy=p.y+Math.sin(a)*r;for(const e of survivalState.enemies)if(Math.hypot(e.x-ox,e.y-oy)<e.r+12)e.hp-=32*u.damage*u.droneOrbit*step;}}
        if(u.scatterBomb>0 && Math.floor(survivalState.elapsed*2)!==Math.floor((survivalState.elapsed-step)*2)){const t=survivalNearestEnemy();if(t){const r=95+u.scatterBomb*10;for(const e of survivalState.enemies){const d=survivalDist(t,e);if(d<r)e.hp-=34*u.damage*u.scatterBomb*Math.max(.2,1-d/r);}survivalAddParticle(t.x,t.y,'#ffb05c',12);}}
        if(u.minefield>0){const r=70+u.minefield*9;for(const e of survivalState.enemies)if(survivalDist(p,e)<r)e.hp-=16*u.damage*u.minefield*step;}
        if(u.flameTrail>0 && Math.hypot(survivalMoveVector().x,survivalMoveVector().y)>0.1){const r=42+u.flameTrail*6;for(const e of survivalState.enemies)if(survivalDist(p,e)<r)e.hp-=24*u.damage*u.flameTrail*step;}
        if(u.acidPool>0){const r=62+u.acidPool*8;for(const e of survivalState.enemies)if(survivalDist(p,e)<r)e.hp-=20*u.damage*u.acidPool*step;}
        if(u.voidRift>0){const r=120+u.voidRift*14;for(const e of survivalState.enemies){const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;if(d<r){e.x+=dx/d*65*step;e.y+=dy/d*65*step;e.hp-=28*u.damage*u.voidRift*step;}}}
        if(u.secondWind>0 && survivalState.bossNumber>0 && survivalState.enemies.some(e=>e.boss)===false && survivalState.bossActive===false){p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.002*u.secondWind);}
        if(u.phaseShift>0 && survivalState.phaseShiftTimer>Math.max(2.2,6-u.phaseShift*.45)){survivalState.phaseShiftTimer=0;p.invuln=Math.max(p.invuln,0.8+u.phaseShift*.08);survivalAddParticle(p.x,p.y,'#d8f6ff',28);}
    }
    // Remove enemies defeated by special weapons.
    for (let ei = survivalState.enemies.length - 1; ei >= 0; ei -= 1) {
        if (survivalState.enemies[ei].hp <= 0) survivalKillEnemy(ei);
    }

    for (const part of survivalState.particles) {
        part.x += part.vx * dt;
        part.y += part.vy * dt;
        part.vx *= 0.94;
        part.vy *= 0.94;
        part.life -= dt;
    }
    survivalState.particles = survivalState.particles.filter((part) => part.life > 0);

    survivalUpdateHud();
}

function survivalDrawGrid() {
    const ctx = survivalCtx;
    const p = survivalState.player;
    if (!ctx || !p) return;
    ctx.fillStyle = "#071019";
    ctx.fillRect(0, 0, survivalState.width, survivalState.height);
    const grid = 48;
    const ox = ((-p.x % grid) + grid) % grid;
    const oy = ((-p.y % grid) + grid) % grid;
    ctx.strokeStyle = "rgba(120, 180, 210, 0.075)";
    ctx.lineWidth = 1;
    for (let x = ox; x < survivalState.width; x += grid) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, survivalState.height); ctx.stroke();
    }
    for (let y = oy; y < survivalState.height; y += grid) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(survivalState.width, y); ctx.stroke();
    }
    const gradient = ctx.createRadialGradient(survivalState.width / 2, survivalState.height / 2, 30, survivalState.width / 2, survivalState.height / 2, Math.max(survivalState.width, survivalState.height) * 0.7);
    gradient.addColorStop(0, "rgba(20, 60, 90, 0.10)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.45)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, survivalState.width, survivalState.height);
}

function survivalDraw() {
    const ctx = survivalCtx;
    const p = survivalState.player;
    if (!ctx || !p) return;
    survivalDrawGrid();

    for (const g of survivalState.gems) {
        const s = survivalWorldToScreen(g.x, g.y);
        ctx.beginPath();
        ctx.arc(s.x, s.y, g.radius, 0, Math.PI * 2);
        ctx.fillStyle = g.color;
        ctx.shadowBlur = 14;
        ctx.shadowColor = g.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    for (const b of survivalState.bullets) {
        const s = survivalWorldToScreen(b.x, b.y);
        ctx.beginPath();
        ctx.arc(s.x, s.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.enemyBullet ? "#ff758f" : "#f6fbff";
        ctx.shadowBlur = b.enemyBullet ? 12 : 9;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    for (const e of survivalState.enemies) {
        const s = survivalWorldToScreen(e.x, e.y);
        if (s.x < -80 || s.x > survivalState.width + 80 || s.y < -80 || s.y > survivalState.height + 80) continue;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(Math.atan2(p.y - e.y, p.x - e.x));
        ctx.beginPath();
        ctx.arc(0, 0, e.r, 0, Math.PI * 2);
        ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : e.color;
        ctx.shadowBlur = e.boss ? 24 : 8;
        ctx.shadowColor = e.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        if (e.boss) {
            ctx.strokeStyle = "rgba(255,255,255,.85)";
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = "rgba(8,10,18,.65)";
            ctx.fillRect(-e.r, -e.r - 12, e.r * 2, 5);
            ctx.fillStyle = "#ff5478";
            ctx.fillRect(-e.r, -e.r - 12, e.r * 2 * survivalClamp(e.hp / e.maxHp, 0, 1), 5);
        } else {
            ctx.fillStyle = "rgba(8,10,18,.55)";
            ctx.beginPath(); ctx.arc(5, -4, 3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    for (const part of survivalState.particles) {
        const s = survivalWorldToScreen(part.x, part.y);
        ctx.globalAlpha = survivalClamp(part.life / part.maxLife, 0, 1);
        ctx.beginPath(); ctx.arc(s.x, s.y, part.size, 0, Math.PI * 2);
        ctx.fillStyle = part.color;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Orbital blades
    if (survivalState.upgrades.orbital > 0) {
        const blades = Math.min(12, survivalState.upgrades.orbital);
        const orbitRadius = 66 * Math.sqrt(survivalState.upgrades.area);
        for (let b = 0; b < blades; b += 1) {
            const a = survivalState.orbitalAngle + (Math.PI * 2 * b) / blades;
            const ox = survivalState.width / 2 + Math.cos(a) * orbitRadius;
            const oy = survivalState.height / 2 + Math.sin(a) * orbitRadius;
            ctx.save(); ctx.translate(ox, oy); ctx.rotate(a);
            ctx.fillStyle = "#a7edff"; ctx.shadowBlur = 14; ctx.shadowColor = "#55d8ff";
            ctx.beginPath(); ctx.moveTo(13,0); ctx.lineTo(-8,-5); ctx.lineTo(-3,0); ctx.lineTo(-8,5); ctx.closePath(); ctx.fill(); ctx.restore();
        }
    }

    // Boss arena fence: 넓은 사각형 가두리. 보스 처치 전에는 밖으로 나갈 수 없습니다.
    if (survivalState.bossActive && survivalState.bossFenceHalfW > 0) {
        const fenceScreen = survivalWorldToScreen(survivalState.bossCenterX, survivalState.bossCenterY);
        const left = fenceScreen.x - survivalState.bossFenceHalfW;
        const top = fenceScreen.y - survivalState.bossFenceHalfH;
        const width = survivalState.bossFenceHalfW * 2;
        const height = survivalState.bossFenceHalfH * 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(left, top, width, height);
        ctx.strokeStyle = survivalState.bossTransition > 0 ? "rgba(255,214,71,.5)" : "rgba(255,91,115,.94)";
        ctx.lineWidth = 10;
        ctx.shadowBlur = 30;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.setLineDash([18, 12]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.rect(left + 10, top + 10, Math.max(0, width - 20), Math.max(0, height - 20));
        ctx.strokeStyle = "rgba(255,180,90,.30)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "rgba(255,70,90,.035)";
        ctx.fill();
        ctx.restore();
    }

    // Player
    const cx = survivalState.width / 2;
    const cy = survivalState.height / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(p.facing);
    ctx.globalAlpha = p.invuln > 0 && Math.floor(p.invuln * 18) % 2 === 0 ? 0.45 : 1;
    ctx.shadowBlur = 22;
    ctx.shadowColor = "#64d8ff";
    ctx.fillStyle = "#eaf9ff";
    ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#52b8e8";
    ctx.beginPath(); ctx.moveTo(8, -8); ctx.lineTo(28, 0); ctx.lineTo(8, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#0d1720";
    ctx.beginPath(); ctx.arc(-4, -5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    if (survivalState.elapsed > 0) {
        const pulse = 0.12 + Math.sin(performance.now() / 800) * 0.03;
        ctx.fillStyle = `rgba(255, 70, 100, ${pulse * (survivalState.elapsed > 285 ? 1 : 0)})`;
        ctx.fillRect(0, 0, survivalState.width, survivalState.height);
    }
}

function survivalLoop(now) {
    if (!survivalState.running) return;
    const dt = Math.min(0.033, Math.max(0, (now - survivalState.last) / 1000));
    survivalState.last = now;
    survivalUpdate(dt);
    survivalDraw();
    survivalState.raf = requestAnimationFrame(survivalLoop);
}

function survivalStart() {
    const keepDeveloperMode = survivalState.developerAuthorized === true;
    survivalReset();
    survivalState.developerAuthorized = keepDeveloperMode;
    survivalState.keys.clear();
    survivalState.running = true;
    if (keepDeveloperMode) {
        survivalForceMaxBuild();
        survivalState.xp = survivalState.xpNeed;
        survivalState.pausedForLevel = false;
        survivalLevelUp?.classList.add("hidden");
    }
    survivalStartScreen?.classList.add("hidden");
    survivalEndScreen?.classList.add("hidden");
    survivalLevelUp?.classList.add("hidden");
    survivalGameStage?.classList.add("playing");
    survivalState.last = performance.now();
    survivalState.raf = requestAnimationFrame(survivalLoop);
    survivalSpawnBurst();
    survivalUpdateHud();
}

function survivalEnd(won) {
    if (!survivalState.running) return;
    survivalState.running = false;
    if(!Number.isFinite(Number(survivalState.score))) survivalState.score=0;
    if(survivalState.score>survivalState.bestScore){survivalState.bestScore=survivalState.score;localStorage.setItem("comtime_survival_best_score",String(survivalState.bestScore));}
    if(survivalState.elapsed>survivalState.bestTime){survivalState.bestTime=survivalState.elapsed;localStorage.setItem("comtime_survival_best_time",String(survivalState.bestTime));}
    survivalState.won = won;
    if (survivalState.raf) cancelAnimationFrame(survivalState.raf);
    survivalState.raf = null;
    survivalLevelUp?.classList.add("hidden");
    survivalEndScreen?.classList.remove("hidden");
    if (survivalEndIcon) survivalEndIcon.textContent = won ? "★" : "☠";
    if (survivalEndEyebrow) survivalEndEyebrow.textContent = won ? "RUN COMPLETE" : "RUN OVER";
    if (survivalEndTitle) survivalEndTitle.textContent = won ? "생존 성공" : "쓰러졌습니다";
    if (survivalEndStats) survivalEndStats.textContent = `처치 ${survivalState.kills} · 레벨 ${survivalState.level} · 점수 ${survivalState.score} · 최고점수 ${survivalState.bestScore}`;
    survivalGameStage?.classList.remove("playing");
}

function openSurvivalGame() {
    if (!survivalGameModal) return;
    survivalGameModal.classList.add("active");
    survivalGameModal.setAttribute("aria-hidden", "false");
    lockPageScroll();
    survivalResize();
}

function closeSurvivalGame() {
    if (!survivalGameModal) return;
    survivalGameModal.classList.remove("active");
    survivalGameModal.setAttribute("aria-hidden", "true");
    if (survivalState.running) survivalEnd(false);
    unlockPageScroll();
}

function survivalSetJoystick(clientX, clientY) {
    if (!survivalJoystick) return;
    const rect = survivalJoystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const max = rect.width * 0.33;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
    survivalState.joystick.x = dx / max;
    survivalState.joystick.y = dy / max;
    survivalState.joystick.active = true;
    if (survivalJoystickKnob) survivalJoystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

function survivalResetJoystick() {
    survivalState.joystick.x = 0;
    survivalState.joystick.y = 0;
    survivalState.joystick.active = false;
    if (survivalJoystickKnob) survivalJoystickKnob.style.transform = "translate(-50%, -50%)";
}

if (survivalStartBtn) survivalStartBtn.addEventListener("click", survivalStart);
if (survivalRestartBtn) survivalRestartBtn.addEventListener("click", survivalStart);
if(survivalPauseBtn)survivalPauseBtn.addEventListener("click",survivalPause);if(survivalResumeBtn)survivalResumeBtn.addEventListener("click",survivalResume);if(survivalQuitBtn)survivalQuitBtn.addEventListener("click",survivalQuitRun);if(survivalDeveloperBtn)survivalDeveloperBtn.addEventListener("click",survivalDeveloperCheat);
const survivalPauseDeveloperBtn=document.getElementById("survivalPauseDeveloperBtn");
if(survivalPauseDeveloperBtn)survivalPauseDeveloperBtn.addEventListener("click",survivalDeveloperCheat);
if (closeSurvivalBtn) closeSurvivalBtn.addEventListener("click", closeSurvivalGame);
if (survivalBackdrop) survivalBackdrop.addEventListener("click", closeSurvivalGame);
window.addEventListener("resize", survivalResize);
window.addEventListener("keydown", (event) => {
    if (event.code === "Escape" && gameHubModal?.classList.contains("active")) {
        closeGameHub();
        return;
    }
    if (event.code === "Escape" && wormGameModal?.classList.contains("active")) {
        wormClose();
        return;
    }
    if (event.code === "Escape" && survivalGameModal?.classList.contains("active")) {
        closeSurvivalGame();
        return;
    }
    if (!survivalGameModal?.classList.contains("active")) return;
    if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        survivalState.keys.add(event.code);
        event.preventDefault();
    }
});
window.addEventListener("keyup", (event) => survivalState.keys.delete(event.code));

if (survivalJoystick) {
    survivalJoystick.addEventListener("pointerdown", (event) => {
        survivalJoystick.setPointerCapture?.(event.pointerId);
        survivalState.joystick.pointerId = event.pointerId;
        survivalSetJoystick(event.clientX, event.clientY);
    });
    survivalJoystick.addEventListener("pointermove", (event) => {
        if (survivalState.joystick.pointerId === event.pointerId) survivalSetJoystick(event.clientX, event.clientY);
    });
    const release = (event) => {
        if (survivalState.joystick.pointerId === event.pointerId) {
            survivalState.joystick.pointerId = null;
            survivalResetJoystick();
        }
    };
    survivalJoystick.addEventListener("pointerup", release);
    survivalJoystick.addEventListener("pointercancel", release);
    survivalJoystick.addEventListener("lostpointercapture", survivalResetJoystick);
}

// ==================================================
// FREE MAP + CURRENT LOCATION (Leaflet + OpenStreetMap)
// ==================================================

const mapModal = document.getElementById("mapModal");
const mapBackdrop = document.getElementById("mapBackdrop");
const closeMapBtn = document.getElementById("closeMapBtn");
const mapCanvas = document.getElementById("mapCanvas");
const mapStatus = document.getElementById("mapStatus");
const mapMyLocationBtn = document.getElementById("mapMyLocationBtn");
const mapZoomInBtn = document.getElementById("mapZoomInBtn");
const mapZoomOutBtn = document.getElementById("mapZoomOutBtn");

let comtimeLeafletMap = null;
let comtimeLocationMarker = null;
let comtimeLocationAccuracy = null;

function initComtimeMap() {
    if (!mapCanvas || !window.L) return;
    if (!comtimeLeafletMap) {
        comtimeLeafletMap = L.map(mapCanvas, {
            zoomControl: false,
            attributionControl: true,
            minZoom: 2,
            maxZoom: 19,
        }).setView([36.6424, 127.4890], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        }).addTo(comtimeLeafletMap);
    }
    setTimeout(() => comtimeLeafletMap.invalidateSize(), 80);
    if (mapStatus) mapStatus.textContent = "무료 지도 준비 완료 · 내 위치를 누르면 위치 권한을 요청합니다.";
}

function requestCurrentLocation() {
    if (!navigator.geolocation) {
        if (mapStatus) mapStatus.textContent = "이 브라우저에서는 위치 기능을 지원하지 않습니다.";
        return;
    }
    if (mapStatus) mapStatus.textContent = "현재 위치 권한을 요청하는 중...";
    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.max(1, Number(position.coords.accuracy || 30));
        initComtimeMap();
        if (!comtimeLeafletMap) return;
        comtimeLeafletMap.setView([lat, lng], Math.max(16, comtimeLeafletMap.getZoom()));
        if (comtimeLocationMarker) comtimeLocationMarker.remove();
        if (comtimeLocationAccuracy) comtimeLocationAccuracy.remove();
        comtimeLocationAccuracy = L.circle([lat, lng], { radius: accuracy, color: "#4285f4", weight: 1, fillColor: "#4285f4", fillOpacity: 0.12 }).addTo(comtimeLeafletMap);
        comtimeLocationMarker = L.circleMarker([lat, lng], { radius: 9, color: "#ffffff", weight: 3, fillColor: "#4285f4", fillOpacity: 1 }).addTo(comtimeLeafletMap);
        comtimeLocationMarker.bindPopup("<strong>내 위치</strong><br>정확도 약 " + Math.round(accuracy) + "m").openPopup();
        if (mapStatus) mapStatus.textContent = `현재 위치 표시 완료 · 정확도 약 ${Math.round(accuracy)}m`;
    }, (error) => {
        const message = error.code === 1
            ? "위치 권한이 거부되었습니다. 브라우저 주소창의 위치 권한을 허용해주세요."
            : "현재 위치를 가져오지 못했습니다. GPS/위치 서비스를 확인해주세요.";
        if (mapStatus) mapStatus.textContent = message;
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 });
}

function openMapModal() {
    if (!mapModal) return;
    mapModal.classList.add("active");
    mapModal.setAttribute("aria-hidden", "false");
    lockPageScroll();
    if (!window.L) {
        if (mapStatus) mapStatus.textContent = "지도 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인해주세요.";
        return;
    }
    initComtimeMap();
}

function closeMapModal() {
    mapModal?.classList.remove("active");
    mapModal?.setAttribute("aria-hidden", "true");
    unlockPageScroll();
}

mapMyLocationBtn?.addEventListener("click", requestCurrentLocation);
mapZoomInBtn?.addEventListener("click", () => comtimeLeafletMap?.zoomIn());
mapZoomOutBtn?.addEventListener("click", () => comtimeLeafletMap?.zoomOut());
closeMapBtn?.addEventListener("click", closeMapModal);
mapBackdrop?.addEventListener("click", closeMapModal);

// ==================================================
// URL NAVIGATOR
// ==================================================

const urlModal = document.getElementById("urlModal");
const urlBackdrop = document.getElementById("urlBackdrop");
const closeUrlBtn = document.getElementById("closeUrlBtn");
const urlCancelBtn = document.getElementById("urlCancelBtn");
const urlForm = document.getElementById("urlForm");
const urlInput = document.getElementById("urlInput");

function openUrlModal() {
    urlModal?.classList.add("active");
    urlModal?.setAttribute("aria-hidden", "false");
    lockPageScroll();
    setTimeout(() => urlInput?.focus(), 50);
}

function closeUrlModal() {
    urlModal?.classList.remove("active");
    urlModal?.setAttribute("aria-hidden", "true");
    unlockPageScroll();
}

function navigateToUrl(raw) {
    let value = String(raw || "").trim();
    if (!value) return;
    if (!/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) value = `https://${value}`;
    let parsed;
    try { parsed = new URL(value); } catch { return; }
    if (!["http:", "https:"].includes(parsed.protocol)) {
        if (urlInput) urlInput.setCustomValidity("http 또는 https 주소만 사용할 수 있습니다.");
        urlInput?.reportValidity();
        return;
    }
    urlInput?.setCustomValidity("");
    window.open(parsed.href, "_blank", "noopener,noreferrer");
    closeUrlModal();
}

urlForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    navigateToUrl(urlInput?.value);
});
closeUrlBtn?.addEventListener("click", closeUrlModal);
urlCancelBtn?.addEventListener("click", closeUrlModal);
urlBackdrop?.addEventListener("click", closeUrlModal);

// ==================================================
// MENU / GEMINI AI
// ==================================================

const menuBtn = document.getElementById("menuBtn");
const menuModal = document.getElementById("menuModal");
const menuBackdrop = document.getElementById("menuBackdrop");
const closeMenuBtn = document.getElementById("closeMenuBtn");
const openGeminiBtn = document.getElementById("openGeminiBtn");
const openMapBtn = document.getElementById("openMapBtn");
const openUrlBtn = document.getElementById("openUrlBtn");

const geminiModal = document.getElementById("geminiModal");
const geminiBackdrop = document.getElementById("geminiBackdrop");
const closeGeminiBtn = document.getElementById("closeGeminiBtn");
const geminiNewChatBtn = document.getElementById("geminiNewChatBtn");
const geminiInput = document.getElementById("geminiInput");
const geminiSendBtn = document.getElementById("geminiSendBtn");
const geminiMessages = document.getElementById("geminiMessages");
const geminiStatus = document.getElementById("geminiStatus");

let geminiPreviousInteractionId = null;
let geminiStreaming = false;
let geminiAbortController = null;

function lockPageScroll() {
    document.body.style.overflow = "hidden";
}

function unlockPageScroll() {
    const menuOpen = menuModal?.classList.contains("active");
    const geminiOpen = geminiModal?.classList.contains("active");
    const birdOpen = birdGameModal?.classList.contains("active");
    const survivalOpen = survivalGameModal?.classList.contains("active");
    const mapOpen = mapModal?.classList.contains("active");
    const urlOpen = urlModal?.classList.contains("active");
    const gameHubOpen = gameHubModal?.classList.contains("active");

    if (!menuOpen && !geminiOpen && !birdOpen && !survivalOpen && !mapOpen && !urlOpen && !gameHubOpen) {
        document.body.style.overflow = "";
    }
}

function openMenuModal() {
    if (!menuModal) return;

    menuModal.classList.add("active");
    menuModal.setAttribute("aria-hidden", "false");
    lockPageScroll();
}

function closeMenuModal() {
    if (!menuModal) return;

    menuModal.classList.remove("active");
    menuModal.setAttribute("aria-hidden", "true");
    unlockPageScroll();
}

function openGeminiModal() {
    closeMenuModal();

    if (!geminiModal) return;

    geminiModal.classList.add("active");
    geminiModal.setAttribute("aria-hidden", "false");
    lockPageScroll();

    requestAnimationFrame(() => {
        geminiInput?.focus();
    });
}

function closeGeminiModal() {
    if (!geminiModal) return;

    // 창을 닫아도 현재 요청은 취소하지 않습니다.
    // 스트리밍은 백그라운드에서 계속 진행되고, 답변은 숨겨진 메시지 DOM에 누적됩니다.
    // 다시 열면 진행 중인 답변을 그대로 확인할 수 있습니다.
    geminiModal.classList.remove("active");
    geminiModal.setAttribute("aria-hidden", "true");
    unlockPageScroll();
}

function addGeminiMessage(text, type) {
    if (!geminiMessages) return null;

    const message = document.createElement("div");
    message.className = `gemini-message ${type}`;
    message.textContent = text;
    geminiMessages.appendChild(message);
    geminiMessages.scrollTop = geminiMessages.scrollHeight;

    return message;
}

function setGeminiStatus(text = "") {
    if (geminiStatus) {
        geminiStatus.textContent = text;
    }
}

function resetGeminiChat() {
    if (geminiStreaming) return;

    geminiPreviousInteractionId = null;

    if (geminiMessages) {
        geminiMessages.innerHTML =
            '<div class="gemini-message assistant">안녕하세요! 무엇을 도와드릴까요?</div>';
    }

    if (geminiInput) {
        geminiInput.value = "";
        geminiInput.disabled = false;
    }

    if (geminiSendBtn) {
        geminiSendBtn.disabled = false;
        geminiSendBtn.textContent = "전송";
    }

    setGeminiStatus("");
    geminiInput?.focus();
}

function setGeminiSendingState(sending) {
    geminiStreaming = sending;

    if (geminiInput) {
        geminiInput.disabled = sending;
    }

    if (geminiSendBtn) {
        geminiSendBtn.disabled = sending;
        geminiSendBtn.textContent = sending ? "작성 중..." : "전송";
    }
}

function appendGeminiStreamText(element, text) {
    if (!element || !text) return;

    element.textContent += text;
    if (geminiMessages && geminiModal?.classList.contains("active")) {
        geminiMessages.scrollTop = geminiMessages.scrollHeight;
    }
}

async function sendGeminiMessage() {
    if (!geminiInput || !geminiSendBtn || geminiStreaming) return;

    const message = geminiInput.value.trim();

    if (!message) {
        geminiInput.focus();
        return;
    }

    addGeminiMessage(message, "user");
    geminiInput.value = "";

    const assistantMessage = addGeminiMessage("", "assistant");

    setGeminiSendingState(true);
    setGeminiStatus("Gemini가 답변을 작성하고 있습니다...");

    const context = selectedSchool
        ? {
            schoolName: selectedSchool.name,
            grade: gradeSelect?.value || "",
            classNum: classSelect?.value || ""
        }
        : {};

    // 채팅창을 닫아도 Gemini 요청은 백그라운드에서 계속 완료되어야 합니다.
    geminiAbortController = null;

    try {
        const response = await authFetch("/api/gemini", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "text/event-stream"
            },
            body: JSON.stringify({
                message,
                previousInteractionId: geminiPreviousInteractionId,
                conversationId: geminiConversationId,
                context
            })
        });

        if (!response.ok) {
            let errorMessage = `Gemini 요청에 실패했습니다. (HTTP ${response.status})`;

            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (_) {
                // JSON 오류 응답이 아니면 기본 메시지를 사용합니다.
            }

            throw new Error(errorMessage);
        }

        if (!response.body) {
            throw new Error("스트리밍 응답을 받을 수 없습니다.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let receivedText = false;

        const processEvent = (rawEvent) => {
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

            if (rawData === "[DONE]") return;

            let data;

            try {
                data = JSON.parse(rawData);
            } catch (_) {
                return;
            }

            if (eventType === "token") {
                if (data.text) {
                    appendGeminiStreamText(assistantMessage, data.text);
                    receivedText = true;
                    setGeminiStatus("");
                }
                return;
            }

            if (eventType === "conversation") {
                if (data.conversationId) geminiConversationId = data.conversationId;
                return;
            }

            if (eventType === "interaction") {
                if (data.interactionId) {
                    geminiPreviousInteractionId = data.interactionId;
                }
                return;
            }

            if (eventType === "error") {
                throw new Error(data.message || "Gemini 스트리밍 오류가 발생했습니다.");
            }

            if (eventType === "done") {
                if (data.interactionId) {
                    geminiPreviousInteractionId = data.interactionId;
                }
            }
        };

        while (true) {
            const { value, done } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const events = buffer.split("\n\n");
            buffer = events.pop() || "";

            for (const event of events) {
                if (!event.trim()) continue;
                processEvent(event);
            }
        }

        buffer += decoder.decode();

        if (buffer.trim()) {
            processEvent(buffer);
        }

        if (!receivedText) {
            throw new Error("Gemini에서 답변을 받지 못했습니다.");
        }

        setGeminiStatus("");
    } catch (error) {
        if (error.name === "AbortError") {
            if (assistantMessage && !assistantMessage.textContent.trim()) {
                assistantMessage.remove();
            }
            setGeminiStatus("");
            return;
        }

        console.error("[Gemini 클라이언트 오류]", error);

        if (assistantMessage) {
            assistantMessage.textContent =
                `오류가 발생했습니다.\n${error.message}`;
            assistantMessage.classList.add("error");
        } else {
            addGeminiMessage(
                `오류가 발생했습니다.\n${error.message}`,
                "error"
            );
        }

        setGeminiStatus("요청에 실패했습니다.");
    } finally {
        geminiAbortController = null;
        setGeminiSendingState(false);
        geminiInput?.focus();
    }
}

if (menuBtn) {
    menuBtn.addEventListener("click", openMenuModal);
}

const appLogo=document.querySelector(".logo");
const appBrand=document.querySelector(".brand-area");
function reloadComtime(){ window.location.reload(); }
appLogo?.addEventListener("click",reloadComtime);
appBrand?.addEventListener("click",reloadComtime);


if (menuBackdrop) {
    menuBackdrop.addEventListener("click", closeMenuModal);
}

if (closeMenuBtn) {
    closeMenuBtn.addEventListener("click", closeMenuModal);
}

if (openGeminiBtn) {
    openGeminiBtn.addEventListener("click", openGeminiModal);
}

if (openMapBtn) {
    openMapBtn.addEventListener("click", () => {
        closeMenuModal();
        openMapModal();
    });
}

if (openUrlBtn) {
    openUrlBtn.addEventListener("click", () => {
        closeMenuModal();
        openUrlModal();
    });
}

if (geminiBackdrop) {
    geminiBackdrop.addEventListener("click", closeGeminiModal);
}

if (closeGeminiBtn) {
    closeGeminiBtn.addEventListener("click", closeGeminiModal);
}

if (geminiNewChatBtn) {
    geminiNewChatBtn.addEventListener("click", resetGeminiChat);
}

if (geminiSendBtn) {
    geminiSendBtn.addEventListener("click", sendGeminiMessage);
}

if (geminiInput) {
    geminiInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendGeminiMessage();
        }
    });
}

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (geminiModal?.classList.contains("active")) {
        closeGeminiModal();
        return;
    }

    if (survivalGameModal?.classList.contains("active")) {
        closeSurvivalGame();
        return;
    }

    if (mapModal?.classList.contains("active")) {
        closeMapModal();
        return;
    }

    if (urlModal?.classList.contains("active")) {
        closeUrlModal();
        return;
    }

    if (menuModal?.classList.contains("active")) {
        closeMenuModal();
    }
});


// ==================================================
// NOTICE BOARD
// ==================================================
const noticeModal = document.getElementById("noticeModal");
const noticeBackdrop = document.getElementById("noticeBackdrop");
const closeNoticeBtn = document.getElementById("closeNoticeBtn");
const openNoticeBtn = document.getElementById("openNoticeBtn");
const noticeAddBtn = document.getElementById("noticeAddBtn");
const noticeDeveloperAuthBtn = document.getElementById("noticeDeveloperAuthBtn");
const noticeList = document.getElementById("noticeList");
const noticeListView = document.getElementById("noticeListView");
const noticeDetailView = document.getElementById("noticeDetailView");
const noticeDetail = document.getElementById("noticeDetail");
const noticeBackBtn = document.getElementById("noticeBackBtn");
const noticeEditorView = document.getElementById("noticeEditorView");
const noticeEditorTitle = document.getElementById("noticeEditorTitle");
const noticeTitleInput = document.getElementById("noticeTitleInput");
const noticeContentInput = document.getElementById("noticeContentInput");
const noticeEditorCancelBtn = document.getElementById("noticeEditorCancelBtn");
const noticeEditorSaveBtn = document.getElementById("noticeEditorSaveBtn");
const comtimeUserIdInput = document.getElementById("comtimeUserIdInput");
const saveUserIdBtn = document.getElementById("saveUserIdBtn");
const adminModeLabel = document.getElementById("adminModeLabel");

let notices = [];
let isAdminUser = false;
let editingNoticeId = null;
let noticeSocket = null;
let noticeRefreshTimer = null;

function applyNotices(nextNotices) {
    notices = Array.isArray(nextNotices) ? nextNotices : [];
    notices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (!noticeListView?.hidden) renderNoticeList();
}

function startNoticeRealtime() {
    if (window.io && !noticeSocket) {
        noticeSocket = window.io();
        noticeSocket.on("notices:update", (payload) => {
            if (Array.isArray(payload?.notices)) applyNotices(payload.notices);
        });
    }
    if (!noticeRefreshTimer) {
        noticeRefreshTimer = setInterval(async () => {
            if (document.hidden) return;
            try {
                const response = await fetch("/api/notices", { cache: "no-store" });
                const data = await response.json();
                if (response.ok && data.ok) applyNotices(data.notices);
            } catch (_) {}
        }, 5000);
    }
}

function getStoredUserId() {
    return String(localStorage.getItem("comtimeUserId") || "").trim();
}

function setStoredUserId(id) {
    localStorage.setItem("comtimeUserId", String(id || "").trim());
}

async function checkAdminMode() {
    const userId = getStoredUserId();
    if (comtimeUserIdInput) comtimeUserIdInput.value = userId;
    try {
        const response = await fetch("/api/admin/check", {
            headers: { "x-comtime-user-id": userId }
        });
        const data = await response.json();
        isAdminUser = Boolean(data.isAdmin);
    } catch {
        isAdminUser = false;
    }
    if (noticeAddBtn) noticeAddBtn.hidden = !isAdminUser;
    if (adminModeLabel) adminModeLabel.textContent = isAdminUser ? "관리자 모드 활성화" : "일반 사용자 모드";
}

async function loadNotices() {
    if (!noticeList) return;
    noticeList.innerHTML = '<div class="notice-message">공지사항을 불러오는 중...</div>';
    try {
        const response = await fetch("/api/notices");
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || "공지 불러오기 실패");
        applyNotices(data.notices);
    } catch (error) {
        noticeList.innerHTML = `<div class="notice-message">공지사항을 불러오지 못했습니다.<br>${escapeHtml(error.message)}</div>`;
    }
}

function formatNoticeDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric", month: "2-digit", day: "2-digit"
    }).format(date).replaceAll(".", "").replaceAll(" ", ".").replace(/\.$/, "");
}

function renderNoticeList() {
    if (!noticeList) return;
    if (!notices.length) {
        noticeList.innerHTML = '<div class="notice-empty"><strong>등록된 공지가 없습니다.</strong><span>새로운 공지가 등록되면 여기에 표시됩니다.</span></div>';
        return;
    }
    noticeList.innerHTML = notices.map((notice, index) => `
        <button class="notice-card" type="button" data-notice-id="${Number(notice.id)}">
            <span class="notice-card-main">
                ${index === 0 ? '<span class="notice-new">NEW</span>' : ''}
                <strong>${escapeHtml(notice.title)}</strong>
                <small>${escapeHtml(formatNoticeDate(notice.createdAt))}${notice.updatedAt ? ' · 수정됨' : ''}</small>
            </span>
            <span class="notice-arrow">›</span>
        </button>
    `).join("");
    noticeList.querySelectorAll(".notice-card").forEach(button => {
        button.addEventListener("click", () => openNoticeDetail(Number(button.dataset.noticeId)));
    });
}

function openNoticeDetail(id) {
    const notice = notices.find(item => Number(item.id) === Number(id));
    if (!notice) return;
    noticeListView.hidden = true;
    noticeEditorView.hidden = true;
    noticeDetailView.hidden = false;
    noticeDetail.innerHTML = `
        <div class="notice-detail-date">${escapeHtml(formatNoticeDate(notice.createdAt))}${notice.updatedAt ? ' · 수정됨' : ''}</div>
        <h3>${escapeHtml(notice.title)}</h3>
        <div class="notice-detail-content">${escapeHtml(notice.content).replace(/\n/g, "<br>")}</div>
        ${isAdminUser ? `<div class="notice-admin-actions"><button type="button" id="noticeEditCurrentBtn">수정</button><button type="button" id="noticeDeleteCurrentBtn" class="danger">삭제</button></div>` : ''}
    `;
    document.getElementById("noticeEditCurrentBtn")?.addEventListener("click", () => openNoticeEditor(notice));
    document.getElementById("noticeDeleteCurrentBtn")?.addEventListener("click", () => deleteNotice(notice.id));
}

function openNoticeEditor(notice = null) {
    if (!isAdminUser) return;
    editingNoticeId = notice ? Number(notice.id) : null;
    noticeListView.hidden = true;
    noticeDetailView.hidden = true;
    noticeEditorView.hidden = false;
    noticeEditorTitle.textContent = notice ? "공지 수정" : "공지 추가";
    noticeTitleInput.value = notice?.title || "";
    noticeContentInput.value = notice?.content || "";
    requestAnimationFrame(() => noticeTitleInput.focus());
}

function closeNoticeSubView() {
    if (noticeDetailView) noticeDetailView.hidden = true;
    if (noticeEditorView) noticeEditorView.hidden = true;
    if (noticeListView) noticeListView.hidden = false;
    editingNoticeId = null;
}

async function saveNotice() {
    if (!isAdminUser) {
        alert("먼저 개발자 인증을 완료해주세요.");
        return;
    }
    if (!noticeTitleInput || !noticeContentInput || !noticeEditorSaveBtn) return;

    const title = noticeTitleInput.value.trim();
    const content = noticeContentInput.value.trim();
    if (!title || !content) {
        alert("제목과 내용을 모두 입력해주세요.");
        return;
    }
    noticeEditorSaveBtn.disabled = true;
    noticeEditorSaveBtn.textContent = "저장 중...";
    try {
        const url = editingNoticeId ? `/api/notices/${editingNoticeId}` : "/api/notices";
        const method = editingNoticeId ? "PUT" : "POST";
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json", "x-comtime-user-id": getStoredUserId() },
            body: JSON.stringify({ title, content, userId: getStoredUserId() })
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || "저장에 실패했습니다.");
        await loadNotices();
        closeNoticeSubView();
    } catch (error) {
        alert(error.message);
    } finally {
        noticeEditorSaveBtn.disabled = false;
        noticeEditorSaveBtn.textContent = "저장";
    }
}

async function deleteNotice(id) {
    if (!isAdminUser) return;
    if (!confirm("정말 이 공지를 삭제할까요?")) return;
    try {
        const response = await fetch(`/api/notices/${id}`, {
            method: "DELETE",
            headers: { "x-comtime-user-id": getStoredUserId() }
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || "삭제에 실패했습니다.");
        await loadNotices();
        closeNoticeSubView();
    } catch (error) {
        alert(error.message);
    }
}

async function openNoticeModal() {
    closeMenuModal();

    noticeModal?.classList.add("active");
    noticeModal?.setAttribute("aria-hidden", "false");
    lockPageScroll();
    closeNoticeSubView();
    startNoticeRealtime();
    await checkAdminMode();
    await loadNotices();
}

async function authenticateDeveloper() {
    const developerCode = window.prompt("개발자 코드 인증", "");
    if (developerCode === null) return;

    // 실제 코드는 서버의 .env에서만 판정합니다.
    setStoredUserId(developerCode.trim());
    await checkAdminMode();

    if (!isAdminUser) {
        alert("개발자 코드가 올바르지 않습니다.");
        return;
    }

    if (noticeAddBtn) noticeAddBtn.hidden = false;
    if (adminModeLabel) adminModeLabel.textContent = "관리자 모드 활성화";
    alert("개발자 인증이 완료되었습니다. 관리자 기능이 활성화되었습니다.");
    renderNoticeList();
}

function closeNoticeModal() {
    noticeModal?.classList.remove("active");
    noticeModal?.setAttribute("aria-hidden", "true");
    unlockPageScroll();
}

openNoticeBtn?.addEventListener("click", openNoticeModal);
closeNoticeBtn?.addEventListener("click", closeNoticeModal);
noticeBackdrop?.addEventListener("click", closeNoticeModal);
noticeBackBtn?.addEventListener("click", closeNoticeSubView);
noticeDeveloperAuthBtn?.addEventListener("click", authenticateDeveloper);
noticeAddBtn?.addEventListener("click", () => openNoticeEditor());
noticeEditorCancelBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeNoticeSubView();
});
noticeEditorSaveBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    saveNotice();
});

// 버튼이 다른 모달/레이어에 가려져도 공지 편집 버튼 동작이 끊기지 않도록
// 공지 모달 자체에서도 클릭을 한 번 더 안전하게 처리합니다.
noticeModal?.addEventListener("click", (event) => {
    const target = event.target.closest?.("button");
    if (!target) return;

    if (target.id === "noticeEditorCancelBtn") {
        event.preventDefault();
        event.stopPropagation();
        closeNoticeSubView();
        return;
    }

    if (target.id === "noticeEditorSaveBtn") {
        event.preventDefault();
        event.stopPropagation();
        if (!noticeEditorSaveBtn.disabled) saveNotice();
    }
});
saveUserIdBtn?.addEventListener("click", async () => {
    setStoredUserId(comtimeUserIdInput.value);
    await checkAdminMode();
    alert(isAdminUser ? "관리자 모드가 활성화되었습니다." : "사용자 ID가 저장되었습니다.");
});

checkAdminMode();


// ==================================================
// YOUTUBE SHORTS + PERSONALIZED ALGORITHM
// ==================================================
const openShortsBtn = document.getElementById("openShortsBtn");
const shortsModal = document.getElementById("shortsModal");
const shortsBackdrop = document.getElementById("shortsBackdrop");
const closeShortsBtn = document.getElementById("closeShortsBtn");
const shortsFeed = document.getElementById("shortsFeed");
const shortsStatus = document.getElementById("shortsStatus");

let shortsNextPageToken = null;
let shortsLoading = false;
let shortsLoadedOnce = false;
let shortsSearchQuery = "";
let shortsObserver = null;
let activeShortId = null;
let activeShortStartedAt = 0;
let shortsOpenGeneration = 0;
let shortsSkipStreak = 0;
let shortsRecommendationRefreshing = false;
let shortsRecommendationRefreshTimer = null;
let shortsSeenVideoIds = new Set();

const SHORTS_HISTORY_KEY = "comtime_shorts_history";
const SHORTS_HISTORY_LIMIT = 40;

function setShortsStatus(text) {
    if (shortsStatus) shortsStatus.textContent = text || "";
}

function getShortsHistory() {
    try {
        const value = JSON.parse(localStorage.getItem(SHORTS_HISTORY_KEY) || "[]");
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function saveShortsHistory(history) {
    localStorage.setItem(
        SHORTS_HISTORY_KEY,
        JSON.stringify(history.slice(-SHORTS_HISTORY_LIMIT))
    );
}

function recordShortHistory(video, watchSeconds, action = "view") {
    if (!video?.id) return;

    const seconds = Math.max(0, Math.min(180, Number(watchSeconds) || 0));
    if (seconds < 1 && action === "view") return;

    const history = getShortsHistory();
    history.push({
        id: String(video.id),
        title: String(video.title || "").slice(0, 160),
        channelTitle: String(video.channelTitle || "").slice(0, 80),
        watchSeconds: Math.round(seconds * 10) / 10,
        action,
        viewedAt: new Date().toISOString()
    });
    saveShortsHistory(history);
}

function getShortItemById(id) {
    return [...document.querySelectorAll(".shorts-item")]
        .find((element) => element.dataset.videoId === String(id));
}

function finishActiveShort() {
    if (!activeShortId || !activeShortStartedAt) return;

    const item = getShortItemById(activeShortId);
    if (item?.dataset.videoJson) {
        try {
            const video = JSON.parse(item.dataset.videoJson);
            const seconds = (Date.now() - activeShortStartedAt) / 1000;
            const action = seconds < 3 ? "skip" : "view";

            recordShortHistory(video, seconds, action);

            if (action === "skip") {
                shortsSkipStreak += 1;
                scheduleShortsRecommendationRefresh();
            } else {
                shortsSkipStreak = 0;
            }
        } catch {
            // 기록 오류는 쇼츠 재생을 방해하지 않습니다.
        }
    }

    activeShortId = null;
    activeShortStartedAt = 0;
}

function scheduleShortsRecommendationRefresh() {
    // 한두 개를 실수로 넘긴 것만으로 취향이 바뀌었다고 판단하지 않습니다.
    // 짧은 시간에 여러 개를 연속으로 넘기면 현재 추천 주제가 맞지 않는 것으로 보고
    // Gemini에게 최신 기록을 다시 분석하게 합니다.
    if (shortsSkipStreak < 3 || shortsRecommendationRefreshing) return;

    clearTimeout(shortsRecommendationRefreshTimer);
    shortsRecommendationRefreshTimer = setTimeout(() => {
        refreshShortsRecommendationIfNeeded();
    }, 250);
}

async function refreshShortsRecommendationIfNeeded() {
    if (shortsRecommendationRefreshing || !shortsModal?.classList.contains("active")) return;
    if (shortsSkipStreak < 3) return;

    shortsRecommendationRefreshing = true;
    const generation = shortsOpenGeneration;
    const previousQuery = shortsSearchQuery;

    try {
        setShortsStatus("최근에 넘긴 영상을 보고 취향을 다시 분석하는 중...");

        const profile = await getShortsRecommendationProfile();
        if (generation !== shortsOpenGeneration) return;

        const nextQuery = String(
            profile.query || "한국어 쇼츠 재미있는 영상"
        ).trim();

        shortsSkipStreak = 0;

        // 기존 피드를 비우지 않고 새 추천을 뒤에 붙입니다.
        // 피드를 통째로 초기화하면 현재 위치가 첫 영상으로 튀면서 같은 영상이 반복되는 것처럼
        // 보일 수 있으므로, 새로운 추천만 추가하고 이미 본 영상은 Set으로 차단합니다.
        shortsSearchQuery = nextQuery;
        shortsNextPageToken = null;

        if (nextQuery !== previousQuery || getShortsHistory().length >= 3) {
            await loadMoreShorts(false, true);
        }
    } catch (error) {
        console.warn("[Shorts 취향 재분석 실패]", error);
    } finally {
        shortsRecommendationRefreshing = false;
    }
}

function stopIframe(iframe) {
    if (!iframe) return;

    // YouTube IFrame API 명령으로 먼저 정지시켜 오디오가 남지 않게 합니다.
    try {
        iframe.contentWindow?.postMessage(
            JSON.stringify({
                event: "command",
                func: "stopVideo",
                args: []
            }),
            "*"
        );
    } catch {
        // src 제거로 최종 처리합니다.
    }

    iframe.src = "about:blank";
}

function loadShortIframe(item) {
    if (!item) return;

    const iframe = item.querySelector("iframe");
    const src = iframe?.dataset.videoSrc;
    if (!iframe || !src) return;

    // 이미 같은 영상이 로드되어 있으면 다시 만들지 않습니다.
    if (iframe.dataset.loaded === "1" && iframe.src === src) return;

    // autoplay=1로 넘긴 뒤 즉시 로드합니다. 브라우저가 자동재생을 막는 경우에도
    // 사용자가 쇼츠를 넘기는 순간에는 iframe이 바로 준비되도록 합니다.
    iframe.src = src;
    iframe.dataset.loaded = "1";
}

function unloadShortIframe(item) {
    const iframe = item?.querySelector("iframe");
    if (!iframe) return;

    stopIframe(iframe);
    iframe.dataset.loaded = "0";
}

function stopAllShortsVideos(exceptId = null) {
    if (!shortsFeed) return;

    shortsFeed.querySelectorAll(".shorts-item").forEach((item) => {
        if (exceptId !== null && item.dataset.videoId === String(exceptId)) return;
        unloadShortIframe(item);
    });
}

function activateShort(item) {
    if (!item || !shortsModal?.classList.contains("active")) return;

    const id = String(item.dataset.videoId || "");
    if (!id) return;

    if (id === activeShortId) return;

    // 이전 영상의 재생과 오디오를 먼저 완전히 종료합니다.
    finishActiveShort();
    stopAllShortsVideos(id);

    activeShortId = id;
    activeShortStartedAt = Date.now();
    loadShortIframe(item);
}

function makeShortCard(video) {
    const item = document.createElement("section");
    item.className = "shorts-item";
    item.dataset.videoId = String(video.id);
    item.dataset.videoJson = JSON.stringify(video);

    const iframe = document.createElement("iframe");
    const shortsVideoSrc = `https://www.youtube.com/embed/${encodeURIComponent(video.id)}?playsinline=1&autoplay=1&mute=0&rel=0&modestbranding=1&enablejsapi=1`;

    // 초기에는 iframe을 로드하지 않습니다. 화면에 들어온 영상만 로드해서 첫 로딩을 크게 줄입니다.
    iframe.src = "about:blank";
    iframe.dataset.videoSrc = shortsVideoSrc;
    iframe.dataset.loaded = "0";
    iframe.title = video.title || "YouTube Shorts";
    iframe.loading = "eager";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;

    const meta = document.createElement("div");
    meta.className = "shorts-meta";

    const title = document.createElement("strong");
    title.textContent = video.title || "YouTube Shorts";

    const channel = document.createElement("span");
    channel.textContent = video.channelTitle || "YouTube";

    meta.append(title, channel);
    item.append(iframe, meta);
    return item;
}

function setupShortsObserver() {
    if (!shortsFeed) return;

    shortsObserver?.disconnect();
    shortsObserver = new IntersectionObserver(
        (entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

            if (visible && visible.intersectionRatio >= 0.65) {
                activateShort(visible.target);
            }
        },
        {
            root: shortsFeed,
            threshold: [0.65, 0.9]
        }
    );

    shortsFeed.querySelectorAll(".shorts-item").forEach((item) => {
        shortsObserver.observe(item);
    });
}

async function getShortsRecommendationProfile() {
    const history = getShortsHistory();

    try {
        const response = await fetch("/api/shorts/recommendation-profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ history })
        });

        const data = await response.json();
        if (!response.ok || !data.ok) {
            throw new Error(data.message || "추천 알고리즘 분석에 실패했습니다.");
        }

        return data.profile || {
            query: "한국어 쇼츠 재미있는 영상",
            keywords: ["한국어", "쇼츠"],
            koreanPriority: 0.9
        };
    } catch (error) {
        console.warn("[Shorts 추천 분석 실패]", error);
        return {
            query: "한국어 쇼츠 재미있는 영상",
            keywords: ["한국어", "쇼츠"],
            koreanPriority: 0.9
        };
    }
}

async function loadMoreShorts(reset = false, forceFreshQuery = false) {
    if (!shortsFeed || shortsLoading) return;
    if (!reset && !forceFreshQuery && !shortsNextPageToken && shortsLoadedOnce) return;

    shortsLoading = true;
    const generation = shortsOpenGeneration;
    setShortsStatus(reset ? "내 취향을 분석하고 한국어 쇼츠를 찾는 중..." : "다음 쇼츠를 불러오는 중...");

    try {
        if (reset) {
            const profile = await getShortsRecommendationProfile();
            if (generation !== shortsOpenGeneration) return;
            shortsSearchQuery = String(profile.query || "한국어 쇼츠 재미있는 영상").trim();
            shortsNextPageToken = null;
            shortsSeenVideoIds.clear();
        }

        if (reset) {
            finishActiveShort();
            stopAllShortsVideos();
            shortsFeed.innerHTML = "";
            shortsFeed.scrollTop = 0;
        }

        // 같은 영상이 API 페이지 경계나 추천 재분석 때문에 다시 들어와도 화면에 추가하지 않습니다.
        // 중복 페이지가 나오면 다음 pageToken까지 자동으로 넘겨 새 영상을 확보합니다.
        let nextToken = forceFreshQuery ? null : shortsNextPageToken;
        let addedVideos = [];
        let lastSearchQuery = shortsSearchQuery;
        let pagesChecked = 0;

        while (pagesChecked < 4) {
            const params = new URLSearchParams();
            if (nextToken) params.set("pageToken", nextToken);
            if (shortsSearchQuery) params.set("q", shortsSearchQuery);
            if (reset || forceFreshQuery) params.set("fresh", "1");

            const queryString = params.toString();
            const response = await fetch(`/api/shorts${queryString ? `?${queryString}` : ""}`, {
                signal: AbortSignal.timeout(15000)
            });
            const data = await response.json();

            if (generation !== shortsOpenGeneration) return;
            if (!response.ok || !data.ok) {
                throw new Error(data.message || "쇼츠를 불러오지 못했습니다.");
            }

            const videos = Array.isArray(data.videos) ? data.videos : [];
            lastSearchQuery = data.searchQuery || lastSearchQuery;

            for (const video of videos) {
                const id = String(video?.id || "");
                if (!id || shortsSeenVideoIds.has(id)) continue;
                shortsSeenVideoIds.add(id);
                addedVideos.push(video);
            }

            nextToken = data.nextPageToken || null;

            // 새 영상이 확보됐으면 일단 화면에 넣고 종료합니다.
            // 전부 중복이었다면 다음 페이지를 확인해 반복 노출을 막습니다.
            if (addedVideos.length > 0 || !nextToken) break;
            pagesChecked += 1;
        }

        if (generation !== shortsOpenGeneration) return;

        for (const video of addedVideos) {
            shortsFeed.appendChild(makeShortCard(video));
        }

        shortsNextPageToken = nextToken;
        shortsSearchQuery = lastSearchQuery;
        shortsLoadedOnce = true;

        setupShortsObserver();

        // 첫 로딩 때만 첫 영상을 즉시 재생합니다. 추천 재분석으로 새 목록을 붙일 때는
        // 현재 영상을 건드리지 않아 갑자기 첫 영상으로 되돌아가는 현상을 막습니다.
        if (reset && shortsFeed.firstElementChild) {
            activateShort(shortsFeed.firstElementChild);
        }

        setShortsStatus(addedVideos.length ? "" : "더 새로운 쇼츠가 없습니다.");
    } catch (error) {
        if (error?.name === "AbortError" || error?.name === "TimeoutError") {
            setShortsStatus("쇼츠 로딩 시간이 초과되었습니다. 다시 시도해주세요.");
        } else {
            console.error("[Shorts 로드 오류]", error);
            setShortsStatus(error.message || "쇼츠를 불러오지 못했습니다.");
        }
    } finally {
        shortsLoading = false;
    }
}

async function openShortsModal() {
    closeMenuModal();
    shortsOpenGeneration++;
    shortsModal?.classList.add("active");
    shortsModal?.setAttribute("aria-hidden", "false");
    lockPageScroll();

    // 기존 iframe 전체를 복구하지 않습니다. 현재 보이는 영상 하나만 필요할 때 로드합니다.
    if (shortsLoadedOnce && shortsFeed?.children.length) {
        stopAllShortsVideos();
        setupShortsObserver();

        const firstVisible = [...shortsFeed.querySelectorAll(".shorts-item")]
            .map((item) => ({
                item,
                rect: item.getBoundingClientRect(),
                ratio: (() => {
                    const feedRect = shortsFeed.getBoundingClientRect();
                    const top = Math.max(rectTop(item), feedRect.top);
                    const bottom = Math.min(rectBottom(item), feedRect.bottom);
                    return Math.max(0, bottom - top) / Math.max(1, item.offsetHeight);
                })()
            }))
            .sort((a, b) => b.ratio - a.ratio)[0]?.item;

        activateShort(firstVisible || shortsFeed.firstElementChild);
    } else {
        await loadMoreShorts(true);
    }
}

function rectTop(item) {
    return item.getBoundingClientRect().top;
}

function rectBottom(item) {
    return item.getBoundingClientRect().bottom;
}

function closeShortsModal() {
    shortsOpenGeneration++;
    clearTimeout(shortsRecommendationRefreshTimer);
    shortsSkipStreak = 0;
    shortsRecommendationRefreshing = false;
    finishActiveShort();
    shortsObserver?.disconnect();
    stopAllShortsVideos();
    activeShortId = null;
    activeShortStartedAt = 0;
    shortsModal?.classList.remove("active");
    shortsModal?.setAttribute("aria-hidden", "true");
    unlockPageScroll();
}

openShortsBtn?.addEventListener("click", openShortsModal);
closeShortsBtn?.addEventListener("click", closeShortsModal);
shortsBackdrop?.addEventListener("click", closeShortsModal);

shortsFeed?.addEventListener("scroll", () => {
    const nearBottom =
        shortsFeed.scrollTop + shortsFeed.clientHeight >=
        shortsFeed.scrollHeight - 500;

    if (nearBottom) loadMoreShorts(false);
}, { passive: true });

window.addEventListener("beforeunload", () => {
    finishActiveShort();
    stopAllShortsVideos();
});

// ==================================================
// ACCOUNT / PERSISTENCE / FRIEND CHAT
// ==================================================
const headerProfileBtn = document.getElementById("headerProfileBtn");
const headerProfileText = document.getElementById("headerProfileText");
const headerProfileImage = document.getElementById("headerProfileImage");
const authGuestBtn = document.getElementById("authGuestBtn");
const settingsModal = document.getElementById("settingsModal");
const settingsBackdrop = document.getElementById("settingsBackdrop");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const settingsProfileAvatar = document.getElementById("settingsProfileAvatar");
const settingsProfileName = document.getElementById("settingsProfileName");
const settingsProfileUsername = document.getElementById("settingsProfileUsername");
const settingsDisplayName = document.getElementById("settingsDisplayName");
const settingsUsername = document.getElementById("settingsUsername");
const settingsNewPassword = document.getElementById("settingsNewPassword");
const profileImageInput = document.getElementById("profileImageInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const saveAccountBtn = document.getElementById("saveAccountBtn");
const resetAllDataBtn = document.getElementById("resetAllDataBtn");
const settingsStatus = document.getElementById("settingsStatus");
const THEME_KEY = "comtime_theme";
const PROFILE_IMAGE_KEY = "comtime_profile_image";
const GUEST_KEY = "comtime_guest_session";
const PROFILE_FRAME_KEY = "comtime_profile_frame";
const PROFILE_FRAMES = ["none","gold","silver","season"];

const AUTH_THEME_VALUES = ["white","blue","purple","black","yellow"];
function setTheme(theme, persist=true){
    const value=AUTH_THEME_VALUES.includes(String(theme)) ? String(theme) : "white";
    document.documentElement.dataset.theme=value;
    if(persist) localStorage.setItem(THEME_KEY,value);
    document.querySelectorAll(".theme-choice").forEach(btn=>btn.classList.toggle("active",btn.dataset.theme===value));
}
function getProfileImage(){ return localStorage.getItem(PROFILE_IMAGE_KEY) || currentUser?.profile?.profileImage || ""; }
function getProfileFrame(){ const f=currentUser?.profile?.profileFrame || localStorage.getItem(PROFILE_FRAME_KEY) || "none"; return PROFILE_FRAMES.includes(f)?f:"none"; }
function getSeasonFrame(){ const m=new Date().getMonth()+1; if(m>=3&&m<=5)return "spring"; if(m>=6&&m<=8)return "summer"; if(m>=9&&m<=11)return "autumn"; return "winter"; }
const SEASON_PARTICLE_SETS = {
    spring: Array.from({length: 8}, (_, i) => i),
    summer: Array.from({length: 8}, (_, i) => i),
    autumn: Array.from({length: 9}, (_, i) => i),
    winter: Array.from({length: 8}, (_, i) => i)
};
function applyProfileFrame(el,frame=getProfileFrame()){
    if(!el)return;
    el.dataset.frame=frame;
    el.dataset.season=frame==="season"?getSeasonFrame():"";
    renderSeasonParticles(el,frame);
}
function renderSeasonParticles(el,frame){
    if(!el)return;
    el.querySelectorAll(":scope > .season-particle").forEach(node=>node.remove());
    if(frame!=="season")return;
    const season=getSeasonFrame();
    const count=(SEASON_PARTICLE_SETS[season] || SEASON_PARTICLE_SETS.autumn).length;
    const isPreview=el.classList.contains("frame-preview");
    const isSettings=el.classList.contains("settings-profile-avatar");
    const radius=isPreview?42:(isSettings?47:30);
    for(let index=0; index<count; index+=1){
        const particle=document.createElement("span");
        particle.className="season-particle";
        particle.dataset.season=season;
        particle.dataset.kind=season==="winter" && index%9===0 ? "snowman" : String(index%5);
        particle.style.setProperty("--particle-angle",`${(index/count)*360-90}deg`);
        particle.style.setProperty("--particle-radius",`${radius + ((index*11)%9)-4}px`);
        particle.style.setProperty("--particle-scale",String(0.62 + ((index*7)%7)*0.075));
        particle.style.setProperty("--particle-delay",`${(index%8)*0.07}s`);
        particle.setAttribute("aria-hidden","true");
        el.appendChild(particle);
    }
}
function renderProfileUI(){
    const name=String(currentUser?.displayName || currentUser?.username || "게스트").trim() || "게스트";
    const initial=Array.from(name)[0]?.toUpperCase() || "C";
    const image=getProfileImage(); const frame=getProfileFrame();
    if(headerProfileText){ headerProfileText.textContent=initial; headerProfileText.hidden=!!image; }
    if(headerProfileImage){ headerProfileImage.hidden=!image; if(image) headerProfileImage.src=image; }
    applyProfileFrame(document.querySelector(".header-profile-btn"),frame);
    if(settingsProfileName) settingsProfileName.textContent=name;
    if(settingsProfileUsername) settingsProfileUsername.textContent=currentUser?.username || "guest";
    if(settingsDisplayName) settingsDisplayName.value=currentUser?.displayName || name;
    if(settingsUsername) settingsUsername.value=currentUser?.username || "";
    if(settingsProfileAvatar){
        let media=settingsProfileAvatar.querySelector(":scope > .profile-avatar-media");
        if(!media){
            media=document.createElement("span");
            media.className="profile-avatar-media";
            settingsProfileAvatar.prepend(media);
        }
        media.textContent=image ? "" : initial;
        media.classList.toggle("has-image",!!image);
        media.style.backgroundImage=image ? `url("${image.replace(/"/g,'\\"')}")` : "";
        settingsProfileAvatar.classList.toggle("has-image",!!image);
        settingsProfileAvatar.style.backgroundImage="none";
        applyProfileFrame(settingsProfileAvatar,frame);
    }
    document.querySelectorAll(".profile-frame-choice").forEach(btn=>{
        btn.classList.toggle("active",btn.dataset.frame===frame);
        const preview=btn.querySelector(".frame-preview");
        const inner=btn.querySelector(".frame-preview-inner");
        if(preview) applyProfileFrame(preview,btn.dataset.frame);
        if(inner){
            inner.textContent=image ? "" : initial;
            inner.style.backgroundImage=image ? `url("${image.replace(/"/g,'\\"')}")` : "";
            inner.classList.toggle("has-image",!!image);
        }
        if(btn.dataset.frame==="season" && preview) preview.dataset.season=getSeasonFrame();
    });
}
function saveGuestSession(){
    if(!currentUser || !localStorage.getItem(GUEST_KEY)) return;
    localStorage.setItem(GUEST_KEY,JSON.stringify({displayName:currentUser.displayName,profile:currentUser.profile||{}}));
}
function loadGuestSession(){
    try{ const raw=localStorage.getItem(GUEST_KEY); if(!raw || raw==="1") return false; const data=JSON.parse(raw); if(!data?.displayName)return false; currentUser={username:"guest",displayName:String(data.displayName).slice(0,40),profile:data.profile||{school:null,grade:"",classNum:""},algorithm:{profile:null,history:[]}}; return true; }catch{return false;}
}
function openSettings(){
    closeMenuModal(); renderProfileUI();
    const guest=localStorage.getItem(GUEST_KEY);
    if(saveAccountBtn){saveAccountBtn.disabled=!!guest;saveAccountBtn.title=guest?"게스트 모드에서는 계정 변경을 사용할 수 없습니다.":"";}
    if(settingsNewPassword) settingsNewPassword.disabled=!!guest;
    settingsModal?.classList.add("active"); settingsModal?.setAttribute("aria-hidden","false"); lockPageScroll();
}
function closeSettings(){ settingsModal?.classList.remove("active"); settingsModal?.setAttribute("aria-hidden","true"); unlockPageScroll(); }

const authModal = document.getElementById("authModal");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authTitle = document.getElementById("authTitle");
const authDescription = document.getElementById("authDescription");
const authSwitchBtn = document.getElementById("authSwitchBtn");
const authStatus = document.getElementById("authStatus");
const menuAccountName = document.getElementById("menuAccountName");
const logoutBtn = document.getElementById("logoutBtn");
const openChatBtn = document.getElementById("openChatBtn");
const chatModal = document.getElementById("chatModal");
const chatBackdrop = document.getElementById("chatBackdrop");
const closeChatBtn = document.getElementById("closeChatBtn");
const friendUsernameInput = document.getElementById("friendUsernameInput");
const addFriendBtn = document.getElementById("addFriendBtn");
const friendStatus = document.getElementById("friendStatus");
const friendList = document.getElementById("friendList");
const friendCount = document.getElementById("friendCount");
const chatEmpty = document.getElementById("chatEmpty");
const chatConversation = document.getElementById("chatConversation");
const chatFriendName = document.getElementById("chatFriendName");
const chatFriendUsername = document.getElementById("chatFriendUsername");
const chatMessages = document.getElementById("chatMessages");
const chatSendForm = document.getElementById("chatSendForm");
const chatInput = document.getElementById("chatInput");

const AUTH_TOKEN_KEY = "comtime_auth_token";
const AUTH_USER_CACHE_KEY = "comtime_auth_user_cache";
let currentUser = null;
let authToken = getStoredAuthToken();
let authMode = "login";
let selectedChatFriend = null;
let chatSocket = null;
let chatPollTimer = null;
let shortsSyncTimer = null;
let geminiConversationId = null;
let geminiHistoryLoaded = false;

function getAuthToken() { return authToken; }
function setAuthToken(token) {
    authToken = String(token || "").trim();
    if (authToken) { localStorage.setItem(AUTH_TOKEN_KEY, authToken); sessionStorage.setItem(AUTH_TOKEN_KEY, authToken); }
    else { localStorage.removeItem(AUTH_TOKEN_KEY); sessionStorage.removeItem(AUTH_TOKEN_KEY); }
}
function getStoredAuthToken(){ return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY) || ""; }

async function authFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    if (authToken) headers.set("Authorization", `Bearer ${authToken}`);
    if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    let response = await fetch(url, { ...options, headers, credentials:"same-origin" });
    if (response.status === 401 && authToken) {
        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set("X-Comtime-Auth-Token", authToken);
        if (!retryHeaders.has("Content-Type") && options.body && !(options.body instanceof FormData)) retryHeaders.set("Content-Type", "application/json");
        response = await fetch(url, { ...options, headers:retryHeaders, credentials:"same-origin" });
    }
    if (response.status === 401 && url !== "/api/me") {
        setAuthToken("");
        currentUser = null;
        showAuthModal("login", "로그인이 필요합니다.");
    }
    return response;
}

function showAuthModal(mode = "login", status = "") {
    authMode = mode;
    loginForm.hidden = mode !== "login";
    registerForm.hidden = mode !== "register";
    authTitle.textContent = mode === "login" ? "로그인" : "회원가입";
    authDescription.textContent = mode === "login"
        ? "계정에 로그인하면 학교, 반, 추천 알고리즘, Gemini 대화 기록을 저장할 수 있습니다."
        : "COMTIME PRO 계정을 만들면 내 설정과 대화, 추천 기록이 계정에 저장됩니다.";
    authSwitchBtn.textContent = mode === "login" ? "계정으로 회원가입" : "이미 계정이 있나요? 로그인";
    authSwitchBtn.hidden = mode === "login";
    authStatus.textContent = status || "";
    authModal?.classList.add("active");
    authModal?.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function hideAuthModal() {
    authModal?.classList.remove("active");
    authModal?.setAttribute("aria-hidden", "true");
    unlockPageScroll();
}

function applyUserProfile(profile) {
    if (!profile) return;
    if (profile.school?.code) {
        selectedSchool = profile.school;
        localStorage.setItem("comtime_selected_school", JSON.stringify(selectedSchool));
        if (schoolNameEl) schoolNameEl.textContent = selectedSchool.name || "학교 미선택";
        if (schoolInfoEl) schoolInfoEl.textContent = `${selectedSchool.region || "학교"} · 저장된 계정 정보`;
    }
    if (profile.grade && gradeSelect) gradeSelect.value = profile.grade;
    if (classSelect && profile.classNum) classSelect.value = profile.classNum;
    if(profile.theme) setTheme(profile.theme);
    if(profile.profileFrame){ localStorage.setItem(PROFILE_FRAME_KEY,String(profile.profileFrame)); }
    renderProfileUI();
}

async function saveProfileToServer() {
    if (!currentUser) return;
    try {
        const response = await authFetch("/api/me/profile", {
            method: "PUT",
            body: JSON.stringify({
                profile: {
                    ...(currentUser?.profile || {}),
                    school: selectedSchool,
                    grade: gradeSelect?.value || "",
                    classNum: classSelect?.value || "",
                    theme: document.documentElement.dataset.theme || "white",
                    profileImage: getProfileImage(),
                    profileFrame: getProfileFrame()
                }
            })
        });
        if (response.ok) console.log("[계정 저장] 학교/학년/반 저장 완료");
    } catch (error) {
        console.warn("[계정 저장 오류]", error);
    }
}

function setAuthAccountUI() {
    const name = currentUser ? `${currentUser.displayName} (@${currentUser.username})` : "로그인되지 않음";
    if (menuAccountName) menuAccountName.textContent = name;
    if (comtimeUserIdInput) comtimeUserIdInput.value = currentUser?.username || "";
}

async function loginOrRegister(endpoint, payload) {
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.message || "요청에 실패했습니다.");
    setAuthToken(data.token);
    localStorage.removeItem(GUEST_KEY);
    currentUser = data.user;
    try { localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(currentUser)); } catch (_) {}
    setAuthAccountUI();
    hideAuthModal();
    appendClientLog("auth_success", { action: endpoint.includes("register") ? "register" : "login" });
    await finishAccountLogin();
}

async function finishAccountLogin() {
    applyUserProfile(currentUser?.profile);
    if (currentUser?.profile?.theme) setTheme(currentUser.profile.theme);
    renderProfileUI();
    await saveProfileToServer();
    await checkAdminMode();
    startChatSocket();
    await loadGeminiHistoryFromServer();
    // 추천 알고리즘/쇼츠 시청 기록은 서버 계정에 저장하지 않습니다.
    await loadFriends();
    try { await restoreSchool(); } catch (_) {}
}

async function initAuth() {
    // 1) localStorage token, 2) HttpOnly cookie, 3) guest session 순서로 복구합니다.
    // 따라서 새로고침/브라우저 재실행에서도 로그인 상태가 유지됩니다.
    try {
        const response = await authFetch("/api/me");
        const data = await response.json().catch(()=>({}));
        if(response.ok && data.ok && data.user){
            currentUser=data.user;
            try{localStorage.setItem(AUTH_USER_CACHE_KEY,JSON.stringify(currentUser));}catch(_){}
            localStorage.removeItem(GUEST_KEY);
            setAuthAccountUI();
            await finishAccountLogin();
            return;
        }
    } catch (_) {}

    // 서버가 잠시 시작 중이거나 네트워크가 순간적으로 끊긴 경우에는
    // 저장된 계정 UI를 즉시 로그아웃시키지 않습니다. 다음 API 요청에서 재검증됩니다.
    if(authToken){
        try{
            const cached=JSON.parse(localStorage.getItem(AUTH_USER_CACHE_KEY)||"null");
            if(cached?.username){
                currentUser=cached;
                setAuthAccountUI();
                setTheme(localStorage.getItem(THEME_KEY)||currentUser?.profile?.theme||"white");
                applyUserProfile(currentUser.profile||{});
                renderProfileUI();
                hideAuthModal();
                return;
            }
        }catch(_){}
    }

    if(loadGuestSession()){
        setAuthAccountUI();
        setTheme(localStorage.getItem(THEME_KEY)||currentUser?.profile?.theme||"white");
        applyUserProfile(currentUser.profile||{});
        renderProfileUI();
        hideAuthModal();
        return;
    }
    setAuthAccountUI();
    setTheme(localStorage.getItem(THEME_KEY)||"white");
    showAuthModal("login");
}

function appendClientLog(type, payload = {}) {
    console.log(`[사용자 활동] ${type}`, payload);
}

authGuestBtn?.addEventListener("click",()=>{
    const adjectives=["푸른","별빛","구름","달빛","바람","초록","노을","새벽","은하","번개","하얀","은빛"];
    const animals=["토끼","여우","고양이","독수리","판다","햄스터","수달","펭귄","지렁이","호랑이","다람쥐","곰"];
    const name=adjectives[Math.floor(Math.random()*adjectives.length)]+animals[Math.floor(Math.random()*animals.length)]+String(Math.floor(10+Math.random()*90));
    currentUser={username:"guest",displayName:name,profile:{school:null,grade:"",classNum:"",theme:document.documentElement.dataset.theme||"white",profileImage:getProfileImage(),profileFrame:getProfileFrame()},algorithm:{profile:null,history:[]}};
    authToken=""; localStorage.removeItem(AUTH_TOKEN_KEY); sessionStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.setItem(GUEST_KEY,JSON.stringify({displayName:name,profile:currentUser.profile}));
    localStorage.removeItem(AUTH_USER_CACHE_KEY);
    setTheme(localStorage.getItem(THEME_KEY)||"white"); renderProfileUI(); setAuthAccountUI(); hideAuthModal();
});

headerProfileBtn?.addEventListener("click",openSettings);
document.getElementById("openSettingsBtn")?.addEventListener("click",openSettings);
closeSettingsBtn?.addEventListener("click",closeSettings);
settingsBackdrop?.addEventListener("click",closeSettings);

profileImageInput?.addEventListener("change",()=>{
    const file=profileImageInput.files?.[0]; if(!file)return;
    if(file.size>8*1024*1024){ if(settingsStatus)settingsStatus.textContent="8MB 이하의 사진을 선택해주세요."; return; }
    const reader=new FileReader();
    reader.onload=()=>{
        const src=String(reader.result||""); const img=new Image();
        img.onload=()=>{
            const size=320;
            const c=document.createElement("canvas");
            c.width=size; c.height=size;
            const ctx=c.getContext("2d");
            const sourceSize=Math.min(img.naturalWidth||img.width,img.naturalHeight||img.height);
            const sx=((img.naturalWidth||img.width)-sourceSize)/2;
            const sy=((img.naturalHeight||img.height)-sourceSize)/2;
            ctx.imageSmoothingEnabled=true;
            ctx.imageSmoothingQuality="high";
            ctx.drawImage(img,sx,sy,sourceSize,sourceSize,0,0,size,size);
            const data=c.toDataURL("image/jpeg",.9);
            localStorage.setItem(PROFILE_IMAGE_KEY,data);
            currentUser=currentUser||{username:"guest",displayName:"게스트",profile:{}};
            currentUser.profile={...(currentUser.profile||{}),profileImage:data};
            renderProfileUI();
            profileImageInput.value="";
            if(settingsStatus)settingsStatus.textContent="프로필 사진이 적용되었습니다.";
            if(authToken) { saveProfileToServer(); } else { saveGuestSession(); }
        }; img.src=src;
    }; reader.readAsDataURL(file);
});

saveProfileBtn?.addEventListener("click",async()=>{
    if(!currentUser)return; const name=String(settingsDisplayName?.value||"").trim(); if(!name){if(settingsStatus)settingsStatus.textContent="닉네임을 입력해주세요.";return;}
    currentUser.displayName=name; currentUser.profile={...(currentUser.profile||{}),theme:document.documentElement.dataset.theme||"white",profileImage:getProfileImage(),profileFrame:getProfileFrame()};
    renderProfileUI();
    if(authToken){try{await saveProfileToServer(); const r=await authFetch("/api/me/account",{method:"PUT",body:JSON.stringify({displayName:name})}); const d=await r.json().catch(()=>({})); if(r.ok&&d.ok){setAuthToken(d.token);currentUser=d.user;try{localStorage.setItem(AUTH_USER_CACHE_KEY,JSON.stringify(currentUser));}catch(_){};applyUserProfile(currentUser.profile);renderProfileUI();}}catch{}} else saveGuestSession();
    if(settingsStatus)settingsStatus.textContent="프로필이 저장되었습니다.";
});

saveAccountBtn?.addEventListener("click",async()=>{
    if(!authToken){if(settingsStatus)settingsStatus.textContent="게스트 모드에서는 계정 정보를 변경할 수 없습니다.";return;}
    const username=String(settingsUsername?.value||"").trim(); const password=String(settingsNewPassword?.value||"");
    try{const r=await authFetch("/api/me/account",{method:"PUT",body:JSON.stringify({username,password:password||undefined})}); const d=await r.json().catch(()=>({})); if(!r.ok||!d.ok)throw new Error(d.message||"계정 변경에 실패했습니다."); setAuthToken(d.token);currentUser=d.user;try{localStorage.setItem(AUTH_USER_CACHE_KEY,JSON.stringify(currentUser));}catch(_){};settingsNewPassword.value="";setAuthAccountUI();renderProfileUI();if(settingsStatus)settingsStatus.textContent="계정 정보가 변경되었습니다.";}catch(e){if(settingsStatus)settingsStatus.textContent=e.message; }
});

document.querySelectorAll(".theme-choice").forEach(btn=>btn.addEventListener("click",async()=>{
    setTheme(btn.dataset.theme);
    if(currentUser){currentUser.profile={...(currentUser.profile||{}),theme:btn.dataset.theme};}
    if(authToken){try{await saveProfileToServer();}catch{}} else saveGuestSession();
}));

document.querySelectorAll(".profile-frame-choice").forEach(btn=>btn.addEventListener("click",async()=>{
    const frame=btn.dataset.frame; if(!PROFILE_FRAMES.includes(frame))return;
    if(currentUser){currentUser.profile={...(currentUser.profile||{}),profileFrame:frame};}
    localStorage.setItem(PROFILE_FRAME_KEY,frame); renderProfileUI();
    if(authToken){try{await saveProfileToServer();}catch{}} else saveGuestSession();
}));

function clearClientDataExceptCredentials(){
    const keep=new Set([AUTH_TOKEN_KEY,AUTH_USER_CACHE_KEY,"comtimeUserId"]);
    Object.keys(localStorage).forEach(key=>{
        if(key.startsWith("comtime_") && !keep.has(key)) localStorage.removeItem(key);
    });
    sessionStorage.removeItem("comtime_guest_session");
}
function clearAllVisibleSchoolData(){
    selectedSchool=null;
    if(schoolNameEl)schoolNameEl.textContent="학교 미선택";
    if(schoolInfoEl)schoolInfoEl.textContent="학교를 검색해 주세요.";
    if(schoolResults)schoolResults.innerHTML='<p class="hint">학교 이름을 검색해 주세요.</p>';
    if(timetableGrid)timetableGrid.innerHTML='<div class="message">학교를 먼저 선택해주세요.</div>';
    if(mealBox)mealBox.innerHTML='<div class="message">학교를 먼저 선택해주세요.</div>';
    if(currentSubjectEl)currentSubjectEl.textContent="학교를 선택해주세요.";
    if(currentTeacherEl)currentTeacherEl.textContent="-";
    if(nextSubjectEl)nextSubjectEl.textContent="-";
    if(weekendScheduleInfoEl)weekendScheduleInfoEl.innerHTML="";
    if(gradeSelect)gradeSelect.value="1";
    if(classSelect)classSelect.innerHTML="";
    if(window.currentTimetable)window.currentTimetable=null;
    if(window.currentMeals)window.currentMeals=[];
}
resetAllDataBtn?.addEventListener("click",async()=>{
    if(!currentUser)return;
    if(!confirm("아이디와 비밀번호를 제외한 모든 저장 데이터와 시간표·급식 기록을 초기화할까요?"))return;
    try{
        if(authToken){
            const r=await authFetch("/api/me/reset-data",{method:"POST"});
            const d=await r.json().catch(()=>({}));
            if(!r.ok||!d.ok)throw new Error(d.message||"초기화에 실패했습니다.");
            currentUser=d.user;
            try { localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(currentUser)); } catch (_) {}
        }
        clearClientDataExceptCredentials();
        clearAllVisibleSchoolData();
        currentUser.profile={...(currentUser.profile||{}),school:null,grade:"",classNum:"",theme:"white",profileImage:"",profileFrame:"none"};
        setTheme("white");
        renderProfileUI();
        if(currentUser.username==="guest")saveGuestSession();
        if(settingsStatus)settingsStatus.textContent="모든 기록, 시간표, 급식 표시를 초기화했습니다.";
    }catch(e){if(settingsStatus)settingsStatus.textContent=e.message;}
});

loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    authStatus.textContent = "로그인 중...";
    try {
        await loginOrRegister("/api/auth/login", {
            username: document.getElementById("loginUsername").value,
            password: document.getElementById("loginPassword").value
        });
    } catch (error) { authStatus.textContent = error.message; }
});

registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = document.getElementById("registerPassword").value;
    const confirm = document.getElementById("registerPasswordConfirm").value;
    if (password !== confirm) { authStatus.textContent = "비밀번호가 서로 다릅니다."; return; }
    authStatus.textContent = "회원가입 중...";
    try {
        await loginOrRegister("/api/auth/register", {
            username: document.getElementById("registerUsername").value,
            displayName: document.getElementById("registerDisplayName").value,
            password
        });
    } catch (error) { authStatus.textContent = error.message; }
});

authSwitchBtn?.addEventListener("click", () => showAuthModal(authMode === "login" ? "register" : "login"));

logoutBtn?.addEventListener("click", async () => {
    try { await authFetch("/api/auth/logout", { method: "POST" }); } catch (_) {}
    setAuthToken("");
    localStorage.removeItem(GUEST_KEY);
    localStorage.removeItem(AUTH_USER_CACHE_KEY);
    currentUser = null;
    chatSocket?.disconnect();
    chatSocket = null;
    clearInterval(chatPollTimer);
    closeChatModal();
    closeMenuModal();
    showAuthModal("login", "로그아웃되었습니다.");
});

document.getElementById("settingsLogoutBtn")?.addEventListener("click",()=>logoutBtn?.click());

// ==================================================
// GEMINI ACCOUNT HISTORY OVERRIDE
// ==================================================
async function loadGeminiHistoryFromServer() {
    if (!currentUser || geminiHistoryLoaded) return;
    try {
        const response = await authFetch("/api/gemini/history");
        const data = await response.json();
        if (!response.ok || !data.ok) return;
        const conversations = Array.isArray(data.conversations) ? data.conversations : [];
        const active = conversations[conversations.length - 1];
        geminiConversationId = active?.id || null;
        geminiPreviousInteractionId = active?.previousInteractionId || null;
        if (active?.messages?.length && geminiMessages) {
            geminiMessages.innerHTML = "";
            active.messages.forEach((message) => addGeminiMessage(message.text, message.role === "user" ? "user" : "assistant"));
        }
        geminiHistoryLoaded = true;
        console.log("[Gemini 기록 복구]", { conversations: conversations.length, activeConversationId: geminiConversationId });
    } catch (error) { console.warn("[Gemini 기록 복구 실패]", error); }
}

const originalResetGeminiChat = resetGeminiChat;
resetGeminiChat = async function () {
    if (geminiStreaming) return;
    try {
        const response = await authFetch("/api/gemini/new", { method: "POST" });
        const data = await response.json();
        if (response.ok && data.ok) geminiConversationId = data.conversationId;
    } catch (error) { console.warn("[Gemini 새 대화 저장 실패]", error); }
    geminiPreviousInteractionId = null;
    if (geminiMessages) geminiMessages.innerHTML = '<div class="gemini-message assistant">새 대화를 시작했습니다. 무엇을 도와드릴까요?</div>';
    if (geminiInput) geminiInput.value = "";
    setGeminiStatus("");
    geminiInput?.focus();
};

// 기존 전송 함수는 authFetch와 conversationId를 사용하도록 감쌉니다.
const originalSendGeminiMessage = sendGeminiMessage;
sendGeminiMessage = async function () {
    // 아래 원본 함수가 사용하는 fetch를 직접 가로채기보다, 현재 함수 소스의 요청 직전에 필요한
    // conversationId를 전역으로 전달할 수 있도록 원본 함수가 읽는 값은 별도로 저장합니다.
    return originalSendGeminiMessage();
};

// ==================================================
// FRIEND CHAT
// ==================================================
async function syncShortsHistoryNow() {
    if (!currentUser) return;
    const history = getShortsHistory();
    if (!history.length) return;
    try {
        await authFetch("/api/shorts/history", { method: "POST", body: JSON.stringify({ history: history.slice(-40) }) });
        console.log("[쇼츠 기록 복구] 로컬 기록을 계정에 동기화했습니다.");
    } catch (error) { console.warn("[쇼츠 기록 복구 실패]", error); }
}

function startChatSocket() {
    if (!window.io || !authToken || chatSocket) return;
    chatSocket = window.io();
    chatSocket.on("connect", () => chatSocket.emit("auth:identify", { token: authToken }));
    chatSocket.on("chat:message", (message) => {
        if (selectedChatFriend && (message.from === selectedChatFriend.username || message.to === selectedChatFriend.username)) {
            appendChatMessage(message);
        }
    });
    chatSocket.on("auth:error", (payload) => console.warn("[채팅 인증 오류]", payload?.message));
}

async function loadFriends() {
    if (!currentUser || !friendList) return;
    try {
        const response = await authFetch("/api/friends");
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || "친구 목록을 불러오지 못했습니다.");
        const friends = data.friends || [];
        friendList.innerHTML = "";
        if (friendCount) friendCount.textContent = friends.length;
        friends.sort((a,b) => String(a.displayName).localeCompare(String(b.displayName), "ko"));
        friends.forEach((friend) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `friend-item${selectedChatFriend?.username === friend.username ? " active" : ""}`;
            const avatar = document.createElement("span"); avatar.className = "friend-avatar"; avatar.textContent = String(friend.displayName || friend.username).charAt(0).toUpperCase();
            const copy = document.createElement("span"); copy.className = "friend-copy";
            const strong = document.createElement("strong"); strong.textContent = friend.displayName;
            const small = document.createElement("small"); small.textContent = `@${friend.username}`;
            copy.append(strong, small); button.append(avatar, copy);
            button.addEventListener("click", () => selectChatFriend(friend));
            friendList.appendChild(button);
        });
    } catch (error) { if (friendStatus) friendStatus.textContent = error.message; }
}

async function selectChatFriend(friend) {
    selectedChatFriend = friend;
    chatEmpty.hidden = true; chatConversation.hidden = false;
    chatFriendName.textContent = friend.displayName;
    chatFriendUsername.textContent = `@${friend.username}`;
    chatMessages.innerHTML = "";
    await loadChatMessages();
    loadFriends();
    requestAnimationFrame(() => chatInput?.focus());
}

function appendChatMessage(message) {
    if (!chatMessages || !selectedChatFriend) return;
    const existing = chatMessages.querySelector(`[data-message-id="${CSS.escape(String(message.id))}"]`);
    if (existing) return;
    const wrap = document.createElement("div");
    wrap.className = `chat-bubble ${message.from === currentUser?.username ? "mine" : "theirs"}`;
    wrap.dataset.messageId = String(message.id);
    wrap.textContent = message.text;
    const time = document.createElement("div"); time.className = "chat-time"; time.textContent = new Intl.DateTimeFormat("ko-KR", { hour:"2-digit", minute:"2-digit" }).format(new Date(message.createdAt));
    wrap.appendChild(time); chatMessages.appendChild(wrap); chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function loadChatMessages() {
    if (!selectedChatFriend) return;
    try {
        const response = await authFetch(`/api/messages/${encodeURIComponent(selectedChatFriend.username)}`);
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || "메시지를 불러오지 못했습니다.");
        chatMessages.innerHTML = "";
        (data.messages || []).forEach(appendChatMessage);
    } catch (error) { chatMessages.innerHTML = `<div class="chat-empty">${escapeHtml(error.message)}</div>`; }
}

async function addFriend() {
    const username = friendUsernameInput?.value.trim();
    if (!username) return;
    friendStatus.textContent = "친구 추가 중...";
    try {
        const response = await authFetch("/api/friends/add", { method:"POST", body:JSON.stringify({ username }) });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || "친구 추가에 실패했습니다.");
        friendUsernameInput.value = "";
        friendStatus.textContent = `${data.friend.displayName}님을 친구로 추가했습니다.`;
        await loadFriends();
    } catch (error) { friendStatus.textContent = error.message; }
}

function openChatModal() {
    closeMenuModal();
    chatModal?.classList.add("active"); chatModal?.setAttribute("aria-hidden", "false"); lockPageScroll();
    startChatSocket(); loadFriends();
}
function closeChatModal() {
    chatModal?.classList.remove("active"); chatModal?.setAttribute("aria-hidden", "true"); unlockPageScroll();
}

openChatBtn?.addEventListener("click", openChatModal);
closeChatBtn?.addEventListener("click", closeChatModal);
chatBackdrop?.addEventListener("click", closeChatModal);
addFriendBtn?.addEventListener("click", addFriend);
friendUsernameInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addFriend(); } });
chatSendForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = chatInput.value.trim();
    if (!text || !selectedChatFriend) return;
    chatInput.value = "";
    try {
        const response = await authFetch("/api/messages/send", { method:"POST", body:JSON.stringify({ to:selectedChatFriend.username, text }) });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || "메시지 전송에 실패했습니다.");
        appendChatMessage(data.message);
    } catch (error) { friendStatus.textContent = error.message; }
});

// 5초마다 서버와 동기화하여 상대가 페이지를 새로고침해도 메시지를 볼 수 있게 합니다.
chatPollTimer = setInterval(() => {
    if (chatModal?.classList.contains("active") && selectedChatFriend) loadChatMessages();
}, 5000);

// ==================================================
// SHORTS — LOCAL ONLY HISTORY
// ==================================================
// 쇼츠 시청 기록은 서버 계정에 저장하지 않습니다.

// 기존 학교/학년/반 선택 이벤트에 계정 저장을 추가합니다.
const originalSelectSchool = selectSchool;
selectSchool = async function(school) {
    await originalSelectSchool(school);
    await saveProfileToServer();
};

gradeSelect?.addEventListener("change", () => { if (currentUser) saveProfileToServer(); });
classSelect?.addEventListener("change", () => { if (currentUser) saveProfileToServer(); });

// 인증된 상태에서는 서버 저장 데이터를 최우선으로 사용합니다.
setTheme(localStorage.getItem(THEME_KEY) || "white", false);
initAuth();


document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && gameHubModal?.classList.contains("active")) {
        closeGameHub();
    }
});
