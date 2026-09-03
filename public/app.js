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

        const nextContainer =
            document.querySelector(
                ".next"
            );

        if (nextContainer) {

            nextContainer.innerHTML = `
                주말에는 수업이 없습니다.
            `;
        }

        return;
    }


    const todayItems =
        getTodayItems();


    const nowMinutes =
        getCurrentMinutes();


    // ==================================================
    // 실제 수업이 있는 교시인지 확인
    // ==================================================

    function hasRealLesson(item) {

        if (!item) {
            return false;
        }

        const subject =
            getSubject(item);

        if (!subject) {
            return false;
        }

        const normalized =
            String(
                subject
            ).trim();

        if (!normalized) {
            return false;
        }

        // 비어 있는 교시 / 기본값은 수업 없음
        if (
            normalized === "-" ||
            normalized === "수업"
        ) {
            return false;
        }

        return true;
    }


    // ==================================================
    // 오늘 실제 시간표가 존재하는 교시만 사용
    // ==================================================

    const todayPeriods =
        PERIODS.filter(
            period => {

                const item =
                    todayItems[
                        period.period - 1
                    ];

                return hasRealLesson(
                    item
                );
            }
        );


    // ==================================================
    // 현재 교시 / 다음 교시
    // ==================================================

    let currentPeriod =
        null;

    let currentItem =
        null;

    let nextPeriod =
        null;

    let nextItem =
        null;


    for (
        let i = 0;
        i < todayPeriods.length;
        i++
    ) {

        const period =
            todayPeriods[i];

        const item =
            todayItems[
                period.period - 1
            ];

        const start =
            timeToMinutes(
                period.start
            );

        const end =
            timeToMinutes(
                period.end
            );


        // ==================================================
        // 현재 수업
        // ==================================================

        if (
            nowMinutes >= start &&
            nowMinutes <= end
        ) {

            currentPeriod =
                period;

            currentItem =
                item;

            nextPeriod =
                todayPeriods[
                    i + 1
                ] || null;

            if (nextPeriod) {

                nextItem =
                    todayItems[
                        nextPeriod.period - 1
                    ];
            }

            break;
        }


        // ==================================================
        // 다음 수업
        // ==================================================

        if (
            nowMinutes < start
        ) {

            nextPeriod =
                period;

            nextItem =
                item;

            break;
        }
    }


    // ==================================================
    // 현재 수업
    // ==================================================

    if (currentPeriod) {

        const subject =
            getSubject(
                currentItem
            );

        const teacher =
            getTeacher(
                currentItem
            );


        currentSubjectEl.textContent =
            `${currentPeriod.period}교시 · ${subject}`;


        currentTeacherEl.textContent =
            teacher
                ? `${teacher} 선생님`
                : "담당 선생님 정보 없음";


        // ==================================================
        // 남은 시간
        //
        // 표시만 실제 종료시간보다 10분 늦게 계산
        // ==================================================

        const COUNTDOWN_OFFSET_MINUTES =
            10;


        const adjustedEndMinutes =
            timeToMinutes(
                currentPeriod.end
            ) +
            COUNTDOWN_OFFSET_MINUTES;


        const remaining =
            adjustedEndMinutes -
            nowMinutes;


        const seconds =
            60 -
            new Date().getSeconds();


        const remainText =
            remaining > 0
                ? `${remaining - 1}분 ${seconds}초 남음`
                : "곧 종료";


        // ==================================================
        // 다음 수업
        // ==================================================

        if (nextPeriod) {

            nextSubjectEl.textContent =
                `${nextPeriod.period}교시 ${getSubject(
                    nextItem
                )} · 다음`;

        } else {

            nextSubjectEl.textContent =
                "오늘 마지막 수업";
        }


        // ==================================================
        // 남은 시간 표시
        // ==================================================

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


    // ==================================================
    // 다음 수업이 있는 경우
    // ==================================================

    if (nextPeriod) {

        const subject =
            getSubject(
                nextItem
            );


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


    // ==================================================
    // 오늘 수업 종료
    // ==================================================

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

const BIRD_GROUND_RATIO =
    0.84;


const BIRD_CEILING =
    0;


// ==================================================
// 난이도 설정
// ==================================================

const BIRD_DIFFICULTY = {

    baseSpeed:
        255,

    maxSpeed:
        440,

    speedPerScore:
        3.8,

    baseGap:
        205,

    gapShrinkPerScore:
        1.45,

    minGap:
        142,

    obstacleWidth:
        70,

    firstObstacleDelay:
        1.35,

    baseObstacleInterval:
        1.52,

    obstacleIntervalDecrease:
        0.010,

    minObstacleInterval:
        0.92,

    movingStartScore:
        10,

    hardStartScore:
        20,

    baseMoveRange:
        18,

    moveRangePerScore:
        1.6,

    baseMoveSpeed:
        30,

    moveSpeedPerScore:
        1.1,

    topMargin:
        58,

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


    const groundY =
        getBirdGroundY();


    if (
        by +
        bh >=
        groundY
    ) {

        return true;
    }


    if (
        by <=
        BIRD_CEILING
    ) {

        return true;
    }


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


        const horizontal =
            bx <
                ox + ow &&
            bx + bw >
                ox;


        if (!horizontal) {
            continue;
        }


        const hitTop =
            by <
                topPipeBottom &&
            by + bh >
                0;


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


            drawObstaclePipe(
                x,
                0,
                width,
                topHeight,
                true
            );


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

        capY =
            y +
            height -
            capHeight;

    } else {

        capY =
            y;
    }


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

const menuBtn =
    document.getElementById(
        "menuBtn"
    );

const menuModal =
    document.getElementById(
        "menuModal"
    );

const menuBackdrop =
    document.getElementById(
        "menuBackdrop"
    );

const closeMenuBtn =
    document.getElementById(
        "closeMenuBtn"
    );

const openGeminiBtn =
    document.getElementById(
        "openGeminiBtn"
    );

const openBirdFromMenuBtn =
    document.getElementById(
        "openBirdFromMenuBtn"
    );


const geminiModal =
    document.getElementById(
        "geminiModal"
    );

const geminiBackdrop =
    document.getElementById(
        "geminiBackdrop"
    );

const closeGeminiBtn =
    document.getElementById(
        "closeGeminiBtn"
    );

const geminiNewChatBtn =
    document.getElementById(
        "geminiNewChatBtn"
    );

const geminiInput =
    document.getElementById(
        "geminiInput"
    );

const geminiSendBtn =
    document.getElementById(
        "geminiSendBtn"
    );

const geminiMessages =
    document.getElementById(
        "geminiMessages"
    );

const geminiStatus =
    document.getElementById(
        "geminiStatus"
    );


let geminiPreviousInteractionId =
    null;

let geminiStreaming =
    false;

let geminiAbortController =
    null;


function lockPageScroll() {

    document.body.style.overflow =
        "hidden";
}


function unlockPageScroll() {

    const menuOpen =
        menuModal?.classList.contains(
            "active"
        );

    const geminiOpen =
        geminiModal?.classList.contains(
            "active"
        );

    const birdOpen =
        birdGameModal?.classList.contains(
            "active"
        );

    if (
        !menuOpen &&
        !geminiOpen &&
        !birdOpen
    ) {

        document.body.style.overflow =
            "";
    }
}


function openMenuModal() {

    if (!menuModal) {
        return;
    }

    menuModal.classList.add(
        "active"
    );

    menuModal.setAttribute(
        "aria-hidden",
        "false"
    );

    lockPageScroll();
}


function closeMenuModal() {

    if (!menuModal) {
        return;
    }

    menuModal.classList.remove(
        "active"
    );

    menuModal.setAttribute(
        "aria-hidden",
        "true"
    );

    unlockPageScroll();
}


function openGeminiModal() {

    closeMenuModal();

    if (!geminiModal) {
        return;
    }

    geminiModal.classList.add(
        "active"
    );

    geminiModal.setAttribute(
        "aria-hidden",
        "false"
    );

    lockPageScroll();

    requestAnimationFrame(
        () => {

            geminiInput?.focus();
        }
    );
}


function closeGeminiModal() {

    if (!geminiModal) {
        return;
    }

    if (
        geminiAbortController
    ) {

        geminiAbortController.abort();

        geminiAbortController =
            null;
    }

    geminiStreaming =
        false;

    geminiModal.classList.remove(
        "active"
    );

    geminiModal.setAttribute(
        "aria-hidden",
        "true"
    );

    unlockPageScroll();
}


function addGeminiMessage(
    text,
    type
) {

    if (!geminiMessages) {
        return null;
    }

    const message =
        document.createElement(
            "div"
        );

    message.className =
        `gemini-message ${type}`;

    message.textContent =
        text;

    geminiMessages.appendChild(
        message
    );

    geminiMessages.scrollTop =
        geminiMessages.scrollHeight;

    return message;
}


function setGeminiStatus(
    text = ""
) {

    if (geminiStatus) {

        geminiStatus.textContent =
            text;
    }
}


function resetGeminiChat() {

    if (geminiStreaming) {
        return;
    }

    geminiPreviousInteractionId =
        null;

    if (geminiMessages) {

        geminiMessages.innerHTML =
            '<div class="gemini-message assistant">안녕하세요! 무엇을 도와드릴까요?</div>';
    }

    if (geminiInput) {

        geminiInput.value =
            "";

        geminiInput.disabled =
            false;
    }

    if (geminiSendBtn) {

        geminiSendBtn.disabled =
            false;

        geminiSendBtn.textContent =
            "전송";
    }

    setGeminiStatus("");

    geminiInput?.focus();
}


function setGeminiSendingState(
    sending
) {

    geminiStreaming =
        sending;

    if (geminiInput) {

        geminiInput.disabled =
            sending;
    }

    if (geminiSendBtn) {

        geminiSendBtn.disabled =
            sending;

        geminiSendBtn.textContent =
            sending
                ? "작성 중..."
                : "전송";
    }
}


function appendGeminiStreamText(
    element,
    text
) {

    if (
        !element ||
        !text
    ) {

        return;
    }

    element.textContent +=
        text;

    geminiMessages.scrollTop =
        geminiMessages.scrollHeight;
}


async function sendGeminiMessage() {

    if (
        !geminiInput ||
        !geminiSendBtn ||
        geminiStreaming
    ) {

        return;
    }

    const message =
        geminiInput.value.trim();

    if (!message) {

        geminiInput.focus();

        return;
    }


    addGeminiMessage(
        message,
        "user"
    );

    geminiInput.value =
        "";


    const assistantMessage =
        addGeminiMessage(
            "",
            "assistant"
        );


    setGeminiSendingState(
        true
    );

    setGeminiStatus(
        "Gemini가 답변을 작성하고 있습니다..."
    );


    const context =
        selectedSchool
            ? {
                schoolName:
                    selectedSchool.name,

                grade:
                    gradeSelect?.value ||
                    "",

                classNum:
                    classSelect?.value ||
                    ""
            }
            : {};


    geminiAbortController =
        new AbortController();


    try {

        const response =
            await fetch(
                "/api/gemini",
                {
                    method:
                        "POST",

                    headers:
                        {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "text/event-stream"
                        },

                    body:
                        JSON.stringify(
                            {
                                message,

                                previousInteractionId:
                                    geminiPreviousInteractionId,

                                context
                            }
                        ),

                    signal:
                        geminiAbortController.signal
                }
            );


        if (!response.ok) {

            let errorMessage =
                `Gemini 요청에 실패했습니다. (HTTP ${response.status})`;


            try {

                const errorData =
                    await response.json();

                errorMessage =
                    errorData.message ||
                    errorMessage;

            } catch (_) {

                // JSON 오류 응답이 아니면
                // 기본 메시지를 사용합니다.
            }


            throw new Error(
                errorMessage
            );
        }


        if (!response.body) {

            throw new Error(
                "스트리밍 응답을 받을 수 없습니다."
            );
        }


        const reader =
            response.body.getReader();

        const decoder =
            new TextDecoder(
                "utf-8"
            );

        let buffer =
            "";

        let receivedText =
            false;


        const processEvent =
            (
                rawEvent
            ) => {

                const lines =
                    rawEvent.split(
                        "\n"
                    );

                let eventType =
                    "message";

                const dataLines =
                    [];


                for (
                    const line of lines
                ) {

                    if (
                        line.startsWith(
                            "event:"
                        )
                    ) {

                        eventType =
                            line
                                .slice(
                                    6
                                )
                                .trim();

                    } else if (
                        line.startsWith(
                            "data:"
                        )
                    ) {

                        dataLines.push(
                            line
                                .slice(
                                    5
                                )
                                .trimStart()
                        );
                    }
                }


                if (
                    !dataLines.length
                ) {

                    return;
                }


                const rawData =
                    dataLines.join(
                        "\n"
                    );


                if (
                    rawData ===
                    "[DONE]"
                ) {

                    return;
                }


                let data;


                try {

                    data =
                        JSON.parse(
                            rawData
                        );

                } catch (_) {

                    return;
                }


                if (
                    eventType ===
                    "token"
                ) {

                    if (
                        data.text
                    ) {

                        appendGeminiStreamText(
                            assistantMessage,
                            data.text
                        );

                        receivedText =
                            true;

                        setGeminiStatus("");
                    }

                    return;
                }


                if (
                    eventType ===
                    "interaction"
                ) {

                    if (
                        data.interactionId
                    ) {

                        geminiPreviousInteractionId =
                            data.interactionId;
                    }

                    return;
                }


                if (
                    eventType ===
                    "error"
                ) {

                    throw new Error(
                        data.message ||
                        "Gemini 스트리밍 오류가 발생했습니다."
                    );
                }


                if (
                    eventType ===
                    "done"
                ) {

                    if (
                        data.interactionId
                    ) {

                        geminiPreviousInteractionId =
                            data.interactionId;
                    }
                }
            };


        while (true) {

            const {
                value,
                done
            } =
                await reader.read();


            if (done) {
                break;
            }


            buffer +=
                decoder.decode(
                    value,
                    {
                        stream:
                            true
                    }
                );


            const events =
                buffer.split(
                    "\n\n"
                );


            buffer =
                events.pop() ||
                "";


            for (
                const event of events
            ) {

                if (
                    !event.trim()
                ) {

                    continue;
                }

                processEvent(
                    event
                );
            }
        }


        buffer +=
            decoder.decode();


        if (
            buffer.trim()
        ) {

            processEvent(
                buffer
            );
        }


        if (
            !receivedText
        ) {

            throw new Error(
                "Gemini에서 답변을 받지 못했습니다."
            );
        }


        setGeminiStatus("");


    } catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {

            if (
                assistantMessage &&
                !assistantMessage.textContent.trim()
            ) {

                assistantMessage.remove();
            }

            setGeminiStatus("");

            return;
        }


        console.error(
            "[Gemini 클라이언트 오류]",
            error
        );


        if (
            assistantMessage
        ) {

            assistantMessage.textContent =
                `오류가 발생했습니다.\n${error.message}`;

            assistantMessage.classList.add(
                "error"
            );

        } else {

            addGeminiMessage(
                `오류가 발생했습니다.\n${error.message}`,
                "error"
            );
        }


        setGeminiStatus(
            "요청에 실패했습니다."
        );


    } finally {

        geminiAbortController =
            null;

        setGeminiSendingState(
            false
        );

        geminiInput?.focus();
    }
}


if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        openMenuModal
    );
}


if (menuBackdrop) {

    menuBackdrop.addEventListener(
        "click",
        closeMenuModal
    );
}


if (closeMenuBtn) {

    closeMenuBtn.addEventListener(
        "click",
        closeMenuModal
    );
}


if (openGeminiBtn) {

    openGeminiBtn.addEventListener(
        "click",
        openGeminiModal
    );
}


if (openBirdFromMenuBtn) {

    openBirdFromMenuBtn.addEventListener(
        "click",
        () => {

            closeMenuModal();

            openGameModal();
        }
    );
}


if (geminiBackdrop) {

    geminiBackdrop.addEventListener(
        "click",
        closeGeminiModal
    );
}


if (closeGeminiBtn) {

    closeGeminiBtn.addEventListener(
        "click",
        closeGeminiModal
    );
}


if (geminiNewChatBtn) {

    geminiNewChatBtn.addEventListener(
        "click",
        resetGeminiChat
    );
}


if (geminiSendBtn) {

    geminiSendBtn.addEventListener(
        "click",
        sendGeminiMessage
    );
}


if (geminiInput) {

    geminiInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                    "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendGeminiMessage();
            }
        }
    );
}


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;
        }


        if (
            geminiModal?.classList.contains(
                "active"
            )
        ) {

            closeGeminiModal();

            return;
        }


        if (
            menuModal?.classList.contains(
                "active"
            )
        ) {

            closeMenuModal();
        }
    }
);