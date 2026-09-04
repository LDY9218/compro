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


// ==================================================
// BIRD BUMP DOM
// ==================================================

const birdGameBtn =
    document.getElementById("birdGameBtn");

const birdGameModal =
    document.getElementById("birdGameModal");

const gameBackdrop =
    document.getElementById("gameBackdrop");

const closeGameBtn =
    document.getElementById("closeGameBtn");

const birdGameContainer =
    document.getElementById("birdGameContainer");

const birdGameCanvas =
    document.getElementById("birdGameCanvas");

const birdScoreEl =
    document.getElementById("birdScore");

const birdBestEl =
    document.getElementById("birdBest");

const birdStartScreen =
    document.getElementById("birdStartScreen");

const birdStartBtn =
    document.getElementById("birdStartBtn");

const birdGameOverScreen =
    document.getElementById("birdGameOverScreen");

const birdRestartBtn =
    document.getElementById("birdRestartBtn");

const birdFinalScoreEl =
    document.getElementById("birdFinalScore");

const birdNewBestEl =
    document.getElementById("birdNewBest");

const birdControlHint =
    document.getElementById("birdControlHint");


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

if (birdGameBtn) {

    birdGameBtn.addEventListener(
        "click",
        openGameModal
    );
}


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
// MENU / GEMINI AI
// ==================================================

const menuBtn = document.getElementById("menuBtn");
const menuModal = document.getElementById("menuModal");
const menuBackdrop = document.getElementById("menuBackdrop");
const closeMenuBtn = document.getElementById("closeMenuBtn");
const openGeminiBtn = document.getElementById("openGeminiBtn");
const openBirdFromMenuBtn = document.getElementById("openBirdFromMenuBtn");

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

    if (!menuOpen && !geminiOpen && !birdOpen) {
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

    if (geminiAbortController) {
        geminiAbortController.abort();
        geminiAbortController = null;
    }

    geminiStreaming = false;
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
    geminiMessages.scrollTop = geminiMessages.scrollHeight;
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

    geminiAbortController = new AbortController();

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
            }),
            signal: geminiAbortController.signal
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

if (menuBackdrop) {
    menuBackdrop.addEventListener("click", closeMenuModal);
}

if (closeMenuBtn) {
    closeMenuBtn.addEventListener("click", closeMenuModal);
}

if (openGeminiBtn) {
    openGeminiBtn.addEventListener("click", openGeminiModal);
}

if (openBirdFromMenuBtn) {
    openBirdFromMenuBtn.addEventListener("click", () => {
        closeMenuModal();
        openGameModal();
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
let currentUser = null;
let authToken = localStorage.getItem(AUTH_TOKEN_KEY) || "";
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
    if (authToken) localStorage.setItem(AUTH_TOKEN_KEY, authToken);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function authFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    if (authToken) headers.set("Authorization", `Bearer ${authToken}`);
    if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
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
    authSwitchBtn.textContent = mode === "login" ? "계정이 없나요? 회원가입" : "이미 계정이 있나요? 로그인";
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
}

async function saveProfileToServer() {
    if (!currentUser) return;
    try {
        const response = await authFetch("/api/me/profile", {
            method: "PUT",
            body: JSON.stringify({
                profile: {
                    school: selectedSchool,
                    grade: gradeSelect?.value || "",
                    classNum: classSelect?.value || ""
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
    currentUser = data.user;
    setAuthAccountUI();
    hideAuthModal();
    appendClientLog("auth_success", { action: endpoint.includes("register") ? "register" : "login" });
    await finishAccountLogin();
}

async function finishAccountLogin() {
    applyUserProfile(currentUser?.profile);
    if (currentUser?.algorithm) console.log("[저장된 알고리즘]", currentUser.algorithm);
    await saveProfileToServer();
    await checkAdminMode();
    startChatSocket();
    await loadGeminiHistoryFromServer();
    await syncShortsHistoryNow();
    await loadFriends();
    try { await restoreSchool(); } catch (_) {}
}

async function initAuth() {
    if (!authToken) {
        setAuthAccountUI();
        showAuthModal("login");
        return;
    }
    try {
        const response = await authFetch("/api/me");
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || "세션이 만료되었습니다.");
        currentUser = data.user;
        setAuthAccountUI();
        await finishAccountLogin();
    } catch (error) {
        setAuthToken("");
        currentUser = null;
        setAuthAccountUI();
        showAuthModal("login", "로그인이 만료되었거나 유효하지 않습니다.");
    }
}

function appendClientLog(type, payload = {}) {
    console.log(`[사용자 활동] ${type}`, payload);
}

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
    currentUser = null;
    chatSocket?.disconnect();
    chatSocket = null;
    clearInterval(chatPollTimer);
    closeChatModal();
    closeMenuModal();
    showAuthModal("login", "로그아웃되었습니다.");
});

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
// SHORTS SERVER-SIDE PERSISTENCE
// ==================================================
const originalRecordShortHistory = recordShortHistory;
recordShortHistory = function(video, watchSeconds, action = "view") {
    originalRecordShortHistory(video, watchSeconds, action);
    clearTimeout(shortsSyncTimer);
    shortsSyncTimer = setTimeout(async () => {
        if (!currentUser) return;
        try {
            await authFetch("/api/shorts/history", { method:"POST", body:JSON.stringify({ history:getShortsHistory().slice(-20) }) });
        } catch (error) { console.warn("[쇼츠 기록 서버 저장 실패]", error); }
    }, 1200);
};

// 기존 학교/학년/반 선택 이벤트에 계정 저장을 추가합니다.
const originalSelectSchool = selectSchool;
selectSchool = async function(school) {
    await originalSelectSchool(school);
    await saveProfileToServer();
};

gradeSelect?.addEventListener("change", () => { if (currentUser) saveProfileToServer(); });
classSelect?.addEventListener("change", () => { if (currentUser) saveProfileToServer(); });

// 인증된 상태에서는 서버 저장 데이터를 최우선으로 사용합니다.
initAuth();
