const schoolInput =
    document.getElementById("schoolInput");

const schoolSearchBtn =
    document.getElementById("schoolSearchBtn");

const schoolResults =
    document.getElementById("schoolResults");

const schoolName =
    document.getElementById("schoolName");

const schoolInfo =
    document.getElementById("schoolInfo");

const gradeSelect =
    document.getElementById("gradeSelect");

const classSelect =
    document.getElementById("classSelect");

const timetableGrid =
    document.getElementById("timetableGrid");

const mealBox =
    document.getElementById("mealBox");

const currentSubject =
    document.getElementById("currentSubject");

const currentTeacher =
    document.getElementById("currentTeacher");

const nextSubject =
    document.getElementById("nextSubject");

const clock =
    document.getElementById("clock");

const todayDate =
    document.getElementById("todayDate");


// ==================================================
// 상태
// ==================================================

let selectedSchool =
    null;

let currentTimetable =
    null;


// ==================================================
// 클래스 선택
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
            document.createElement("option");

        option.value = i;
        option.textContent =
            `${i}반`;

        classSelect.appendChild(
            option
        );
    }
}


// ==================================================
// 한국 시간
// ==================================================

function getKoreaDate() {

    return new Date(
        new Date().toLocaleString(
            "en-US",
            {
                timeZone:
                    "Asia/Seoul"
            }
        )
    );
}


function getKoreanDayIndex() {

    return getKoreaDate().getDay();
}


// ==================================================
// HTML 이스케이프
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
// 시계
// ==================================================

function updateClock() {

    const now =
        getKoreaDate();

    if (clock) {

        clock.textContent =
            now.toLocaleTimeString(
                "ko-KR",
                {
                    hour12: false
                }
            );
    }

    if (todayDate) {

        todayDate.textContent =
            now.toLocaleDateString(
                "ko-KR",
                {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "short"
                }
            );
    }

    updateCurrentClass();
}


setInterval(
    updateClock,
    1000
);

updateClock();


// ==================================================
// 학교 검색
// ==================================================

async function searchSchool() {

    const q =
        schoolInput?.value
            .trim() || "";

    if (!q) {

        schoolResults.innerHTML =
            '<p class="hint">학교 이름을 입력하세요.</p>';

        return;
    }


    schoolResults.innerHTML =
        '<p class="hint">학교를 검색하는 중...</p>';


    try {

        const response =
            await fetch(
                `/api/search-school?q=${encodeURIComponent(q)}`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.ok
        ) {

            throw new Error(
                data.message ||
                "학교 검색에 실패했습니다."
            );
        }


        if (
            !data.schools ||
            !data.schools.length
        ) {

            schoolResults.innerHTML =
                '<p class="hint">검색 결과가 없습니다.</p>';

            return;
        }


        schoolResults.innerHTML =
            data.schools
                .map(
                    school => `
                        <button
                            type="button"
                            class="school-result"
                            data-code="${escapeHtml(
                                school.code
                            )}"
                        >
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
                        </button>
                    `
                )
                .join("");


        document
            .querySelectorAll(
                ".school-result"
            )
            .forEach(
                (button, index) => {

                    button.addEventListener(
                        "click",
                        () => {

                            selectSchool(
                                data.schools[index]
                            );
                        }
                    );
                }
            );

    } catch (error) {

        console.error(
            "[학교검색 오류]",
            error
        );

        schoolResults.innerHTML =
            `<p class="hint">${escapeHtml(
                error.message
            )}</p>`;
    }
}


// ==================================================
// 학교 선택
// ==================================================

async function selectSchool(
    school
) {

    selectedSchool =
        school;


    localStorage.setItem(
        "comtime_selected_school",
        JSON.stringify(
            school
        )
    );


    if (schoolName) {

        schoolName.textContent =
            school.name;
    }


    if (schoolInfo) {

        schoolInfo.textContent =
            school.region ||
            "학교 정보";
    }


    if (schoolResults) {

        schoolResults.innerHTML =
            `<p class="hint">
                선택됨: ${escapeHtml(
                    school.name
                )}
            </p>`;
    }


    await Promise.all([
        loadTimetable(),
        loadMeal()
    ]);
}


// ==================================================
// 시간표
// ==================================================

async function loadTimetable() {

    if (!selectedSchool) {
        return;
    }


    timetableGrid.innerHTML =
        '<div class="message">시간표를 불러오는 중...</div>';


    try {

        const grade =
            Number(
                gradeSelect.value
            );

        const classNum =
            Number(
                classSelect.value
            );


        const response =
            await fetch(
                `/api/timetable?schoolCode=${encodeURIComponent(
                    selectedSchool.code
                )}&grade=${grade}&classNum=${classNum}`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.ok
        ) {

            throw new Error(
                data.message ||
                "시간표를 불러오지 못했습니다."
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

        timetableGrid.innerHTML =
            `<div class="message">
                ${escapeHtml(
                    error.message
                )}
            </div>`;
    }
}


// ==================================================
// 시간표 데이터
// ==================================================

function getTodayItems(
    timetable
) {

    if (
        !Array.isArray(
            timetable
        )
    ) {

        return [];
    }


    const dayIndex =
        getKoreanDayIndex();


    const index =
        dayIndex === 0
            ? 0
            : dayIndex - 1;


    return timetable[index]?.items ||
        [];
}


function getSubject(item) {

    return (
        item?.subject ||
        item?.original?.subject ||
        "-"
    );
}


function getTeacher(item) {

    return (
        item?.teacher ||
        item?.original?.teacher ||
        ""
    );
}


// ==================================================
// 시간
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
// 시간 문자열 → 분
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
// 시간표 렌더링
// ==================================================

function renderTimetable(
    timetable
) {

    if (
        !Array.isArray(
            timetable
        ) ||
        !timetable.length
    ) {

        timetableGrid.innerHTML =
            '<div class="message">시간표 데이터가 없습니다.</div>';

        return;
    }


    const dayNames = [
        "월요일",
        "화요일",
        "수요일",
        "목요일",
        "금요일"
    ];


    timetableGrid.innerHTML =
        dayNames
            .map(
                (
                    day,
                    dayIndex
                ) => {

                    const dayData =
                        timetable[
                            dayIndex
                        ];

                    const items =
                        dayData?.items ||
                        [];


                    const cards =
                        PERIODS
                            .map(
                                (
                                    period,
                                    index
                                ) => {

                                    const item =
                                        items[index];

                                    const subject =
                                        getSubject(
                                            item
                                        );

                                    const teacher =
                                        getTeacher(
                                            item
                                        );


                                    return `
                                        <div class="lesson-card">

                                            <span class="lesson-period">
                                                ${period.period}교시
                                            </span>

                                            <strong>
                                                ${escapeHtml(
                                                    subject
                                                )}
                                            </strong>

                                            <small>
                                                ${escapeHtml(
                                                    teacher
                                                )}
                                            </small>

                                        </div>
                                    `;
                                }
                            )
                            .join("");


                    return `
                        <div class="day-column">

                            <div class="day-title">
                                ${day}
                            </div>

                            ${cards}

                        </div>
                    `;
                }
            )
            .join("");
}


// ==================================================
// 현재 수업
// ==================================================

function updateCurrentClass() {

    if (
        !currentTimetable ||
        !selectedSchool
    ) {

        return;
    }


    const items =
        getTodayItems(
            currentTimetable
        );


    if (!items.length) {

        if (currentSubject) {
            currentSubject.textContent =
                "오늘 시간표 없음";
        }

        if (currentTeacher) {
            currentTeacher.textContent =
                "-";
        }

        if (nextSubject) {
            nextSubject.textContent =
                "-";
        }

        return;
    }


    const now =
        getKoreaDate();


    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();


    let currentIndex =
        -1;

    let nextIndex =
        -1;


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
            currentMinutes >= start &&
            currentMinutes <= end
        ) {

            currentIndex =
                i;

            break;
        }


        if (
            currentMinutes < start &&
            nextIndex === -1
        ) {

            nextIndex =
                i;
        }
    }


    if (
        currentIndex >= 0
    ) {

        const item =
            items[currentIndex];


        currentSubject.textContent =
            getSubject(item);


        currentTeacher.textContent =
            getTeacher(item) ||
            "-";


        if (
            nextIndex === -1 &&
            currentIndex + 1 <
                items.length
        ) {

            nextIndex =
                currentIndex + 1;
        }

    } else {

        currentSubject.textContent =
            "수업 없음";

        currentTeacher.textContent =
            "-";

        if (
            nextIndex === -1
        ) {

            nextIndex =
                items.findIndex(
                    item =>
                        getSubject(
                            item
                        ) !== "-"
                );
        }
    }


    if (
        nextSubject
    ) {

        nextSubject.textContent =
            nextIndex >= 0 &&
            items[nextIndex]
                ? getSubject(
                    items[nextIndex]
                )
                : "-";
    }
}


// ==================================================
// NEIS 학교 검색
// ==================================================

async function findNeisSchool() {

    if (!selectedSchool) {
        return null;
    }


    try {

        const response =
            await fetch(
                `/api/neis-school?name=${encodeURIComponent(
                    selectedSchool.name
                )}`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.ok ||
            !data.schools?.length
        ) {

            return null;
        }


        const exact =
            data.schools.find(
                school =>
                    school.schoolName ===
                    selectedSchool.name
            );


        return exact ||
            data.schools[0] ||
            null;

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
        return;
    }


    mealBox.innerHTML =
        '<div class="message">오늘의 급식을 불러오는 중...</div>';


    try {

        const neisSchool =
            await findNeisSchool();


        if (!neisSchool) {

            throw new Error(
                "NEIS에서 학교 정보를 찾지 못했습니다."
            );
        }


        const response =
            await fetch(
                `/api/meal?officeCode=${encodeURIComponent(
                    neisSchool.officeCode
                )}&schoolCode=${encodeURIComponent(
                    neisSchool.schoolCode
                )}`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.ok
        ) {

            throw new Error(
                data.message ||
                "급식을 불러오지 못했습니다."
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

        mealBox.innerHTML =
            `<div class="message">
                ${escapeHtml(
                    error.message
                )}
            </div>`;
    }
}


// ==================================================
// 급식 렌더링
// ==================================================

function renderMeal(
    meals
) {

    if (!meals.length) {

        mealBox.innerHTML =
            '<div class="message">오늘 급식 정보가 없습니다.</div>';

        return;
    }


    mealBox.innerHTML =
        meals
            .map(
                meal => {

                    const menu =
                        String(
                            meal.menu ||
                            ""
                        )
                            .replaceAll(
                                "<br/>",
                                "\n"
                            )
                            .replaceAll(
                                "<br>",
                                "\n"
                            );


                    return `
                        <div class="meal-card">

                            <div class="meal-type">
                                ${escapeHtml(
                                    meal.mealType
                                )}
                            </div>

                            <div class="meal-menu">
                                ${escapeHtml(
                                    menu
                                ).replaceAll(
                                    "\n",
                                    "<br>"
                                )}
                            </div>

                            <div class="meal-calories">
                                ${escapeHtml(
                                    meal.calories ||
                                    ""
                                )}
                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}


// ==================================================
// 검색 이벤트
// ==================================================

if (schoolSearchBtn) {

    schoolSearchBtn.addEventListener(
        "click",
        searchSchool
    );
}


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


if (gradeSelect) {

    gradeSelect.addEventListener(
        "change",
        loadTimetable
    );
}


if (classSelect) {

    classSelect.addEventListener(
        "change",
        loadTimetable
    );
}


// ==================================================
// 학교 복원
// ==================================================

function restoreSchool() {

    try {

        const saved =
            localStorage.getItem(
                "comtime_selected_school"
            );


        if (!saved) {
            return;
        }


        const school =
            JSON.parse(saved);


        if (
            !school ||
            !school.code
        ) {

            return;
        }


        selectSchool(
            school
        );

    } catch (error) {

        console.error(
            "[학교 복원 오류]",
            error
        );
    }
}


// ==================================================
// BIRD BUMP
// ==================================================

const birdGameBtn =
    document.getElementById(
        "birdGameBtn"
    );

const birdGameModal =
    document.getElementById(
        "birdGameModal"
    );

const gameBackdrop =
    document.getElementById(
        "gameBackdrop"
    );

const closeGameBtn =
    document.getElementById(
        "closeGameBtn"
    );

const birdGameCanvas =
    document.getElementById(
        "birdGameCanvas"
    );

const birdGameContainer =
    document.getElementById(
        "birdGameContainer"
    );

const birdStartScreen =
    document.getElementById(
        "birdStartScreen"
    );

const birdGameOverScreen =
    document.getElementById(
        "birdGameOverScreen"
    );

const birdStartBtn =
    document.getElementById(
        "birdStartBtn"
    );

const birdRestartBtn =
    document.getElementById(
        "birdRestartBtn"
    );

const birdScore =
    document.getElementById(
        "birdScore"
    );

const birdBest =
    document.getElementById(
        "birdBest"
    );

const birdFinalScore =
    document.getElementById(
        "birdFinalScore"
    );

const birdNewBest =
    document.getElementById(
        "birdNewBest"
    );


// ==================================================
// 게임 상태
// ==================================================

let birdCtx =
    birdGameCanvas
        ?.getContext("2d");

let birdGameRunning =
    false;

let birdGameOver =
    false;

let birdAnimationFrame =
    null;

let birdLastTime =
    0;

let birdScoreValue =
    0;

let birdBestValue =
    Number(
        localStorage.getItem(
            "bird_bump_best"
        ) || 0
    );

let birdPlayer = null;

let birdObstacles = [];

let birdClouds = [];

let birdParticles = [];

let birdObstacleTimer =
    0;

let birdWorldWidth =
    900;

let birdWorldHeight =
    520;

let birdScale =
    1;


const BIRD_GROUND_RATIO =
    0.84;

const BIRD_CEILING =
    0;


const BIRD_DIFFICULTY = {

    baseSpeed: 255,

    maxSpeed: 440,

    speedPerScore: 3.8,

    baseGap: 205,

    gapShrinkPerScore: 1.45,

    minGap: 142,

    obstacleWidth: 70,

    firstObstacleDelay: 1.35,

    baseObstacleInterval: 1.52,

    obstacleIntervalDecrease: 0.010,

    minObstacleInterval: 0.92,

    movingStartScore: 10,

    hardStartScore: 20,

    baseMoveRange: 18,

    moveRangePerScore: 1.6,

    baseMoveSpeed: 30,

    moveSpeedPerScore: 1.1,

    topMargin: 58,

    bottomMargin: 48
};


const BIRD_GRAVITY =
    1450;

const BIRD_JUMP =
    -470;


// ==================================================
// Canvas 크기
// ==================================================

function resizeBirdCanvas() {

    if (
        !birdGameCanvas ||
        !birdGameContainer
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
            260,
            rect.height
        );


    const dpr =
        Math.min(
            window.devicePixelRatio ||
            1,
            2
        );


    birdGameCanvas.width =
        width * dpr;

    birdGameCanvas.height =
        height * dpr;


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


    birdScale =
        Math.min(
            width / birdWorldWidth,
            height / birdWorldHeight
        );
}


// ==================================================
// 점수
// ==================================================

function updateBirdScore() {

    if (birdScore) {

        birdScore.textContent =
            birdScoreValue;
    }


    if (birdBest) {

        birdBest.textContent =
            birdBestValue;
    }
}


// ==================================================
// 게임 초기화
// ==================================================

function resetBirdGame() {

    birdScoreValue =
        0;

    birdScore &&
        (birdScore.textContent =
            "0");


    birdObstacles =
        [];

    birdParticles =
        [];

    birdClouds =
        [];

    birdObstacleTimer =
        -BIRD_DIFFICULTY
            .firstObstacleDelay;


    birdPlayer = {

        x: 180,

        y: birdWorldHeight * 0.42,

        width: 38,

        height: 30,

        velocityY: 0,

        rotation: 0
    };


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
                35 +
                Math.random() *
                210,

            width:
                50 +
                Math.random() *
                100,

            speed:
                10 +
                Math.random() * 18
        });
    }


    birdGameOver =
        false;


    birdGameRunning =
        false;


    if (birdStartScreen) {

        birdStartScreen.classList.remove(
            "hidden"
        );
    }


    if (birdGameOverScreen) {

        birdGameOverScreen.classList.add(
            "hidden"
        );
    }


    updateBirdScore();
}


// ==================================================
// 게임 시작
// ==================================================

function startBirdGame() {

    resetBirdGame();


    birdGameRunning =
        true;


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


    birdLastTime =
        performance.now();


    cancelAnimationFrame(
        birdAnimationFrame
    );


    birdAnimationFrame =
        requestAnimationFrame(
            birdGameLoop
        );
}


// ==================================================
// 점프
// ==================================================

function birdJump() {

    if (
        !birdGameRunning ||
        !birdPlayer
    ) {

        return;
    }


    birdPlayer.velocityY =
        BIRD_JUMP;
}


// ==================================================
// 장애물 생성
// ==================================================

function createBirdObstacle() {

    const score =
        birdScoreValue;


    const gap =
        Math.max(
            BIRD_DIFFICULTY.minGap,

            BIRD_DIFFICULTY.baseGap -
            score *
            BIRD_DIFFICULTY.gapShrinkPerScore
        );


    const ground =
        birdWorldHeight *
        BIRD_GROUND_RATIO;


    const minTop =
        BIRD_DIFFICULTY.topMargin;


    const maxTop =
        ground -
        gap -
        BIRD_DIFFICULTY.bottomMargin;


    const topHeight =
        minTop +
        Math.random() *
        Math.max(
            10,
            maxTop -
            minTop
        );


    const moving =
        score >=
        BIRD_DIFFICULTY.movingStartScore;


    const hard =
        score >=
        BIRD_DIFFICULTY.hardStartScore;


    birdObstacles.push({

        x:
            birdWorldWidth +
            20,

        width:
            BIRD_DIFFICULTY.obstacleWidth,

        topHeight,

        gap,

        scored:
            false,

        moving,

        moveRange:
            moving
                ? BIRD_DIFFICULTY.baseMoveRange +
                  score *
                  BIRD_DIFFICULTY.moveRangePerScore
                : 0,

        moveSpeed:
            moving
                ? BIRD_DIFFICULTY.baseMoveSpeed +
                  score *
                  BIRD_DIFFICULTY.moveSpeedPerScore
                : 0,

        moveTime:
            Math.random() *
            Math.PI *
            2,

        hard
    });
}


// ==================================================
// 파티클
// ==================================================

function createBirdParticle(
    x,
    y,
    type = "normal"
) {

    birdParticles.push({

        x,

        y,

        vx:
            -60 +
            Math.random() *
            120,

        vy:
            -100 +
            Math.random() *
            100,

        size:
            2 +
            Math.random() *
            4,

        life:
            0.5,

        maxLife:
            0.5,

        type
    });
}


// ==================================================
// 충돌
// ==================================================

function birdRectCollision(
    a,
    b
) {

    return (
        a.x <
            b.x +
            b.width &&

        a.x +
            a.width >
            b.x &&

        a.y <
            b.y +
            b.height &&

        a.y +
            a.height >
            b.y
    );
}


function checkBirdCollision() {

    if (!birdPlayer) {
        return false;
    }


    const ground =
        birdWorldHeight *
        BIRD_GROUND_RATIO;


    if (
        birdPlayer.y <=
        BIRD_CEILING
    ) {

        return true;
    }


    if (
        birdPlayer.y +
        birdPlayer.height >=
        ground
    ) {

        return true;
    }


    for (
        const obstacle of
        birdObstacles
    ) {

        const topPipe = {

            x:
                obstacle.x,

            y:
                0,

            width:
                obstacle.width,

            height:
                obstacle.topHeight
        };


        const bottomPipe = {

            x:
                obstacle.x,

            y:
                obstacle.topHeight +
                obstacle.gap,

            width:
                obstacle.width,

            height:
                ground -
                (
                    obstacle.topHeight +
                    obstacle.gap
                )
        };


        if (
            birdRectCollision(
                birdPlayer,
                topPipe
            ) ||
            birdRectCollision(
                birdPlayer,
                bottomPipe
            )
        ) {

            return true;
        }
    }


    return false;
}


// ==================================================
// 게임 종료
// ==================================================

function endBirdGame() {

    if (
        birdGameOver
    ) {

        return;
    }


    birdGameRunning =
        false;

    birdGameOver =
        true;


    const isNewBest =
        birdScoreValue >
        birdBestValue;


    if (isNewBest) {

        birdBestValue =
            birdScoreValue;

        localStorage.setItem(
            "bird_bump_best",
            String(
                birdBestValue
            )
        );
    }


    if (birdFinalScore) {

        birdFinalScore.textContent =
            birdScoreValue;
    }


    if (birdNewBest) {

        birdNewBest.textContent =
            isNewBest
                ? "NEW BEST!"
                : `최고 기록: ${birdBestValue}`;
    }


    if (birdGameOverScreen) {

        birdGameOverScreen.classList.remove(
            "hidden"
        );
    }


    updateBirdScore();


    for (
        let i = 0;
        i < 25;
        i++
    ) {

        createBirdParticle(
            birdPlayer.x +
            birdPlayer.width / 2,

            birdPlayer.y +
            birdPlayer.height / 2,

            "explosion"
        );
    }
}


// ==================================================
// 게임 업데이트
// ==================================================

function updateBirdGame(
    dt
) {

    if (
        !birdGameRunning ||
        !birdPlayer
    ) {

        return;
    }


    const score =
        birdScoreValue;


    const speed =
        Math.min(
            BIRD_DIFFICULTY.maxSpeed,

            BIRD_DIFFICULTY.baseSpeed +
            score *
            BIRD_DIFFICULTY.speedPerScore
        );


    birdPlayer.velocityY +=
        BIRD_GRAVITY *
        dt;


    birdPlayer.y +=
        birdPlayer.velocityY *
        dt;


    birdPlayer.rotation =
        Math.max(
            -0.35,
            Math.min(
                1.0,
                birdPlayer.velocityY /
                700
            )
        );


    birdObstacleTimer +=
        dt;


    const interval =
        Math.max(
            BIRD_DIFFICULTY.minObstacleInterval,

            BIRD_DIFFICULTY.baseObstacleInterval -
            score *
            BIRD_DIFFICULTY.obstacleIntervalDecrease
        );


    if (
        birdObstacleTimer >=
        interval
    ) {

        birdObstacleTimer -=
            interval;

        createBirdObstacle();
    }


    for (
        const obstacle of
        birdObstacles
    ) {

        obstacle.x -=
            speed *
            dt;


        if (
            obstacle.moving
        ) {

            obstacle.moveTime +=
                obstacle.moveSpeed *
                dt *
                0.02;


            const offset =
                Math.sin(
                    obstacle.moveTime
                ) *
                obstacle.moveRange;


            obstacle.currentOffset =
                offset;
        }


        if (
            !obstacle.scored &&
            obstacle.x +
            obstacle.width <
            birdPlayer.x
        ) {

            obstacle.scored =
                true;

            birdScoreValue +=
                1;

            updateBirdScore();


            createBirdParticle(
                birdPlayer.x +
                birdPlayer.width,

                birdPlayer.y,

                "score"
            );
        }
    }


    birdObstacles =
        birdObstacles.filter(
            obstacle =>
                obstacle.x +
                obstacle.width >
                -100
        );


    for (
        const cloud of
        birdClouds
    ) {

        cloud.x -=
            cloud.speed *
            dt;


        if (
            cloud.x +
            cloud.width <
            -50
        ) {

            cloud.x =
                birdWorldWidth +
                Math.random() *
                100;
        }
    }


    for (
        const particle of
        birdParticles
    ) {

        particle.x +=
            particle.vx *
            dt;

        particle.y +=
            particle.vy *
            dt;

        particle.vy +=
            400 *
            dt;

        particle.life -=
            dt;
    }


    birdParticles =
        birdParticles.filter(
            particle =>
                particle.life >
                0
        );


    if (
        checkBirdCollision()
    ) {

        endBirdGame();
    }
}


// ==================================================
// 게임 루프
// ==================================================

function birdGameLoop(
    timestamp
) {

    const dt =
        Math.min(
            0.033,

            (
                timestamp -
                birdLastTime
            ) / 1000
        );


    birdLastTime =
        timestamp;


    updateBirdGame(
        dt
    );


    drawBirdGame();


    if (
        birdGameRunning
    ) {

        birdAnimationFrame =
            requestAnimationFrame(
                birdGameLoop
            );
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
        birdGameCanvas.clientWidth;

    const height =
        birdGameCanvas.clientHeight;


    birdCtx.clearRect(
        0,
        0,
        width,
        height
    );


    birdCtx.save();


    birdCtx.scale(
        birdScale,
        birdScale
    );


    const offsetX =
        (
            width -
            birdWorldWidth *
            birdScale
        ) /
        (
            2 *
            birdScale
        );


    const offsetY =
        (
            height -
            birdWorldHeight *
            birdScale
        ) /
        (
            2 *
            birdScale
        );


    birdCtx.translate(
        offsetX,
        offsetY
    );


    drawBirdBackground();

    drawBirdClouds();

    drawBirdObstacles();

    drawBirdParticles();

    drawBirdPlayer();


    birdCtx.restore();
}


// ==================================================
// 배경
// ==================================================

function drawBirdBackground() {

    const gradient =
        birdCtx.createLinearGradient(
            0,
            0,
            0,
            birdWorldHeight
        );


    gradient.addColorStop(
        0,
        "#8bd5ff"
    );

    gradient.addColorStop(
        0.55,
        "#b7e6ff"
    );

    gradient.addColorStop(
        1,
        "#edf7ff"
    );


    birdCtx.fillStyle =
        gradient;


    birdCtx.fillRect(
        0,
        0,
        birdWorldWidth,
        birdWorldHeight
    );


    const ground =
        birdWorldHeight *
        BIRD_GROUND_RATIO;


    birdCtx.fillStyle =
        "#e7f1ff";


    birdCtx.fillRect(
        0,
        ground,
        birdWorldWidth,
        birdWorldHeight -
        ground
    );
}


// ==================================================
// 구름
// ==================================================

function drawBirdClouds() {

    birdClouds.forEach(
        cloud => {

            birdCtx.save();

            birdCtx.globalAlpha =
                0.55;


            birdCtx.fillStyle =
                "#ffffff";


            birdCtx.beginPath();

            birdCtx.arc(
                cloud.x +
                cloud.width *
                0.25,

                cloud.y,

                cloud.width *
                0.22,

                0,
                Math.PI * 2
            );


            birdCtx.arc(
                cloud.x +
                cloud.width *
                0.48,

                cloud.y -
                10,

                cloud.width *
                0.30,

                0,
                Math.PI * 2
            );


            birdCtx.arc(
                cloud.x +
                cloud.width *
                0.72,

                cloud.y,

                cloud.width *
                0.23,

                0,
                Math.PI * 2
            );


            birdCtx.fill();

            birdCtx.restore();
        }
    );
}


// ==================================================
// 장애물
// ==================================================

function drawBirdObstacles() {

    const ground =
        birdWorldHeight *
        BIRD_GROUND_RATIO;


    birdObstacles.forEach(
        obstacle => {

            const offset =
                obstacle.currentOffset ||
                0;


            const topHeight =
                obstacle.topHeight +
                offset;


            const bottomY =
                topHeight +
                obstacle.gap;


            const pipeGradient =
                birdCtx.createLinearGradient(
                    obstacle.x,
                    0,
                    obstacle.x +
                    obstacle.width,
                    0
                );


            pipeGradient.addColorStop(
                0,
                "#4c59d9"
            );

            pipeGradient.addColorStop(
                0.45,
                "#7486ff"
            );

            pipeGradient.addColorStop(
                1,
                "#4c59d9"
            );


            birdCtx.fillStyle =
                pipeGradient;


            birdCtx.fillRect(
                obstacle.x,
                0,
                obstacle.width,
                topHeight
            );


            birdCtx.fillRect(
                obstacle.x,
                bottomY,
                obstacle.width,
                ground -
                bottomY
            );


            birdCtx.fillStyle =
                "#6678ff";


            birdCtx.fillRect(
                obstacle.x - 9,
                topHeight - 18,
                obstacle.width + 18,
                18
            );


            birdCtx.fillRect(
                obstacle.x - 9,
                bottomY,
                obstacle.width + 18,
                18
            );


            birdCtx.fillStyle =
                "rgba(255,255,255,0.16)";


            birdCtx.fillRect(
                obstacle.x + 10,
                0,
                8,
                topHeight
            );


            birdCtx.fillRect(
                obstacle.x + 10,
                bottomY,
                8,
                ground -
                bottomY
            );
        }
    );
}


// ==================================================
// 새 그리기
// ==================================================

function drawBirdPlayer() {

    if (!birdPlayer) {
        return;
    }


    birdCtx.save();


    birdCtx.translate(
        birdPlayer.x +
        birdPlayer.width / 2,

        birdPlayer.y +
        birdPlayer.height / 2
    );


    birdCtx.rotate(
        birdPlayer.rotation
    );


    birdCtx.fillStyle =
        "#ffd84d";


    birdCtx.beginPath();

    birdCtx.ellipse(
        0,
        0,
        19,
        15,
        0,
        0,
        Math.PI * 2
    );

    birdCtx.fill();


    birdCtx.fillStyle =
        "#f4b62c";


    birdCtx.beginPath();

    birdCtx.ellipse(
        -4,
        6,
        10,
        6,
        -0.3,
        0,
        Math.PI * 2
    );

    birdCtx.fill();


    birdCtx.fillStyle =
        "#ffffff";


    birdCtx.beginPath();

    birdCtx.arc(
        10,
        -7,
        6,
        0,
        Math.PI * 2
    );

    birdCtx.fill();


    birdCtx.fillStyle =
        "#1e2538";


    birdCtx.beginPath();

    birdCtx.arc(
        12,
        -7,
        2.5,
        0,
        Math.PI * 2
    );

    birdCtx.fill();


    birdCtx.fillStyle =
        "#ff8a32";


    birdCtx.beginPath();

    birdCtx.moveTo(
        17,
        0
    );

    birdCtx.lineTo(
        29,
        5
    );

    birdCtx.lineTo(
        17,
        8
    );

    birdCtx.closePath();

    birdCtx.fill();


    birdCtx.restore();
}


// ==================================================
// 파티클
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
// 점프/클릭
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
// 시작
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
// X
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


// ==================================================
// 스크롤 잠금
// ==================================================

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


// ==================================================
// 메뉴 열기
// ==================================================

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


// ==================================================
// 메뉴 닫기
// ==================================================

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


// ==================================================
// Gemini 열기
// ==================================================

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


// ==================================================
// Gemini 닫기
// ==================================================

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


// ==================================================
// Gemini 메시지 추가
// ==================================================

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


// ==================================================
// Gemini 상태
// ==================================================

function setGeminiStatus(
    text = ""
) {

    if (geminiStatus) {

        geminiStatus.textContent =
            text;
    }
}


// ==================================================
// 새 대화
// ==================================================

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


    setGeminiStatus(
        ""
    );


    geminiInput?.focus();
}


// ==================================================
// 전송 상태
// ==================================================

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


// ==================================================
// 실시간 텍스트 추가
// ==================================================

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


// ==================================================
// Gemini 스트리밍 전송
// ==================================================

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
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "text/event-stream"
                    },

                    body:
                        JSON.stringify({
                            message,

                            previousInteractionId:
                                geminiPreviousInteractionId,

                            context
                        }),

                    signal:
                        geminiAbortController
                            .signal
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
                // 기본 메시지 사용
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
            (rawEvent) => {

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
                                .slice(6)
                                .trim();

                    } else if (
                        line.startsWith(
                            "data:"
                        )
                    ) {

                        dataLines.push(
                            line
                                .slice(5)
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


                        setGeminiStatus(
                            ""
                        );
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
                        stream: true
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


        setGeminiStatus(
            ""
        );

    } catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {

            if (
                assistantMessage &&
                !assistantMessage
                    .textContent
                    .trim()
            ) {

                assistantMessage.remove();
            }


            setGeminiStatus(
                ""
            );


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


// ==================================================
// 메뉴 이벤트
// ==================================================

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


// ==================================================
// Gemini 이벤트
// ==================================================

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


// ==================================================
// ESC
// ==================================================

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


// ==================================================
// 초기화
// ==================================================

createClassOptions();

updateBirdScore();

restoreSchool();

resizeBirdCanvas();

window.addEventListener(
    "resize",
    resizeBirdCanvas
);

console.log(
    "COMTIME PRO 초기화 완료"
);

console.log(
    "Bird Bump 준비 완료"
);

console.log(
    "Gemini AI 스트리밍 준비 완료"
);