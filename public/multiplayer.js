(() => {
    "use strict";

    const socket = window.io ? window.io() : null;
    if (!socket) {
        console.error("[카게임] Socket.IO를 불러오지 못했습니다.");
        return;
    }

    const $ = (id) => document.getElementById(id);

    const openBtn = $("openCarGameBtn");
    const modal = $("carGameModal");
    const backdrop = $("carGameBackdrop");
    const closeBtn = $("closeCarGameBtn");
    const lobby = $("carLobby");
    const waiting = $("carWaiting");
    const gameArea = $("carGameArea");
    const gameOver = $("carGameOver");
    const createBtn = $("createCarRoomBtn");
    const joinBtn = $("joinCarRoomBtn");
    const joinInput = $("joinCarRoomInput");
    const roomStatus = $("carRoomStatus");
    const roomCodeEl = $("carRoomCode");
    const roomSmallCodeEl = $("carRoomSmallCode");
    const cancelBtn = $("cancelCarRoomBtn");
    const backLobbyBtn = $("carBackLobbyBtn");
    const road = $("carRoad");
    const myCarEl = $("myCar");
    const enemyCarEl = $("enemyCar");
    const obstaclesEl = $("carObstacles");
    const myHeartsEl = $("myCarHearts");
    const enemyHeartsEl = $("enemyCarHearts");
    const hitFlash = $("carHitFlash");
    const countdownEl = $("carCountdown");
    const overTitle = $("carGameOverTitle");
    const overMessage = $("carGameOverMessage");
    const leftBtn = $("carLeftBtn");
    const rightBtn = $("carRightBtn");

    let roomCode = null;
    let localPlayerId = null;
    let inRoom = false;
    let running = false;
    let countdown = false;
    let state = null;
    let animationFrame = null;
    let lastStateAt = 0;
    let inputTimer = null;
    let touchLeft = false;
    let touchRight = false;
    let keyboardLeft = false;
    let keyboardRight = false;
    let lastInput = "none";

    function setScreen(screen) {
        lobby.hidden = screen !== "lobby";
        waiting.hidden = screen !== "waiting";
        gameArea.hidden = screen !== "game";
        gameOver.hidden = screen !== "over";
    }

    function setStatus(text, error = false) {
        roomStatus.textContent = text || "";
        roomStatus.style.color = error ? "#d35e69" : "#667dff";
    }

    function normalizeCode(value) {
        return String(value || "").replace(/\D/g, "").slice(0, 4);
    }

    function openGame() {
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
        setScreen("lobby");
        setStatus("");
        joinInput.value = "";
        joinInput.focus({ preventScroll: true });
    }

    function closeGame() {
        if (inRoom) {
            const leave = window.confirm("현재 방에서 나가시겠습니까?");
            if (!leave) return;
            socket.emit("car:leave-room");
            resetLocalRoom();
        }
        stopLoop();
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
    }

    function resetLocalRoom() {
        roomCode = null;
        inRoom = false;
        running = false;
        countdown = false;
        state = null;
        roomCodeEl.textContent = "0000";
        roomSmallCodeEl.textContent = "0000";
        obstaclesEl.innerHTML = "";
        myCarEl.classList.remove("car-invincible");
        enemyCarEl.classList.remove("car-invincible");
        setScreen("lobby");
    }

    function startLoop() {
        if (animationFrame) return;
        const frame = () => {
            animationFrame = requestAnimationFrame(frame);
            renderState();
        };
        animationFrame = requestAnimationFrame(frame);
    }

    function stopLoop() {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }

    function updateHearts(el, hp) {
        const safe = Math.max(0, Math.min(3, Number(hp) || 0));
        el.textContent = `${"♥ ".repeat(safe)}${"♡ ".repeat(3 - safe)}`.trim();
    }

    function renderState() {
        if (!state || !road) return;
        const me = state.players?.find(p => p.id === localPlayerId);
        const enemy = state.players?.find(p => p.id !== localPlayerId);

        if (me) {
            myCarEl.style.left = `${me.x}%`;
            myCarEl.style.top = `${me.y}%`;
            updateHearts(myHeartsEl, me.hp);
            const inv = Number(me.invincibleUntil || 0) > Date.now();
            myCarEl.classList.toggle("car-invincible", inv);
        }
        if (enemy) {
            enemyCarEl.style.left = `${enemy.x}%`;
            enemyCarEl.style.top = `${enemy.y}%`;
            updateHearts(enemyHeartsEl, enemy.hp);
            const inv = Number(enemy.invincibleUntil || 0) > Date.now();
            enemyCarEl.classList.toggle("car-invincible", inv);
            enemyCarEl.hidden = false;
        } else {
            enemyCarEl.hidden = true;
        }

        renderObstacles(state.obstacles || []);

        if (state.status === "countdown") {
            countdownEl.hidden = false;
            const remaining = Math.max(0, Number(state.countdown || 0));
            countdownEl.textContent = remaining > 0 ? String(remaining) : "GO!";
        } else {
            countdownEl.hidden = true;
        }
    }

    function renderObstacles(obstacles) {
        const wanted = new Map(obstacles.map(o => [String(o.id), o]));
        for (const child of [...obstaclesEl.children]) {
            if (!wanted.has(child.dataset.id)) child.remove();
        }
        for (const obstacle of obstacles) {
            let el = obstaclesEl.querySelector(`[data-id="${CSS.escape(String(obstacle.id))}"]`);
            if (!el) {
                el = document.createElement("div");
                el.className = "car-obstacle";
                el.dataset.id = String(obstacle.id);
                obstaclesEl.appendChild(el);
            }
            el.style.left = `${obstacle.x}%`;
            el.style.top = `${obstacle.y}%`;
        }
    }

    function sendInput(force = false) {
        if (!inRoom || !roomCode) return;
        let direction = "none";
        if (keyboardLeft || touchLeft) direction = "left";
        if (keyboardRight || touchRight) direction = direction === "left" ? "none" : "right";
        if (force || direction !== lastInput) {
            socket.emit("car:input", { direction });
            lastInput = direction;
        }
    }

    function beginInputLoop() {
        if (inputTimer) return;
        inputTimer = setInterval(() => sendInput(), 40);
    }

    function endInputLoop() {
        if (inputTimer) clearInterval(inputTimer);
        inputTimer = null;
    }

    function setTouchDirection(direction, active, button) {
        if (direction === "left") touchLeft = active;
        if (direction === "right") touchRight = active;
        button.classList.toggle("active", active);
        sendInput(true);
    }

    function bindHoldButton(button, direction) {
        const start = (event) => {
            event.preventDefault();
            setTouchDirection(direction, true, button);
            try { button.setPointerCapture?.(event.pointerId); } catch (_) {}
        };
        const end = (event) => {
            event.preventDefault();
            setTouchDirection(direction, false, button);
        };
        button.addEventListener("pointerdown", start, { passive: false });
        button.addEventListener("pointerup", end, { passive: false });
        button.addEventListener("pointercancel", end, { passive: false });
        button.addEventListener("pointerleave", (event) => {
            if (event.buttons === 0) end(event);
        }, { passive: false });
    }

    openBtn?.addEventListener("click", openGame);
    closeBtn?.addEventListener("click", closeGame);
    backdrop?.addEventListener("click", closeGame);

    joinInput?.addEventListener("input", () => {
        joinInput.value = normalizeCode(joinInput.value);
    });
    joinInput?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") joinBtn.click();
    });

    createBtn?.addEventListener("click", () => {
        setStatus("방을 만드는 중...");
        createBtn.disabled = true;
        joinBtn.disabled = true;
        socket.emit("car:create-room");
    });

    joinBtn?.addEventListener("click", () => {
        const code = normalizeCode(joinInput.value);
        if (!/^\d{4}$/.test(code)) {
            setStatus("방 번호는 숫자 4자리여야 합니다.", true);
            return;
        }
        setStatus("방에 참가하는 중...");
        createBtn.disabled = true;
        joinBtn.disabled = true;
        socket.emit("car:join-room", { roomCode: code });
    });

    cancelBtn?.addEventListener("click", () => {
        socket.emit("car:leave-room");
        resetLocalRoom();
    });

    backLobbyBtn?.addEventListener("click", () => {
        socket.emit("car:leave-room");
        resetLocalRoom();
    });

    bindHoldButton(leftBtn, "left");
    bindHoldButton(rightBtn, "right");

    document.addEventListener("keydown", (event) => {
        if (!inRoom || modal.getAttribute("aria-hidden") === "true") return;
        if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
            event.preventDefault();
            keyboardLeft = true;
            sendInput(true);
        }
        if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
            event.preventDefault();
            keyboardRight = true;
            sendInput(true);
        }
    });

    document.addEventListener("keyup", (event) => {
        if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
            keyboardLeft = false;
            sendInput(true);
        }
        if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
            keyboardRight = false;
            sendInput(true);
        }
    });

    socket.on("connect", () => {
        localPlayerId = socket.id;
    });

    socket.on("car:room-created", ({ roomCode: code }) => {
        roomCode = String(code);
        inRoom = true;
        roomCodeEl.textContent = roomCode;
        roomSmallCodeEl.textContent = roomCode;
        setStatus("");
        setScreen("waiting");
        startLoop();
        createBtn.disabled = false;
        joinBtn.disabled = false;
    });

    socket.on("car:joined", ({ roomCode: code }) => {
        roomCode = String(code);
        inRoom = true;
        roomCodeEl.textContent = roomCode;
        roomSmallCodeEl.textContent = roomCode;
        setStatus("");
        setScreen("waiting");
        startLoop();
        createBtn.disabled = false;
        joinBtn.disabled = false;
    });

    socket.on("car:waiting", () => {
        setScreen("waiting");
    });

    socket.on("car:state", (nextState) => {
        state = nextState;
        lastStateAt = performance.now();
        if (nextState?.roomCode) {
            roomCode = String(nextState.roomCode);
            roomSmallCodeEl.textContent = roomCode;
        }
        if (nextState?.status === "playing" || nextState?.status === "countdown") {
            if (!running) {
                running = true;
                setScreen("game");
                beginInputLoop();
            }
        }
        if (nextState?.status === "gameover") {
            running = false;
            endInputLoop();
            setScreen("over");
            const me = nextState.players?.find(p => p.id === localPlayerId);
            const enemy = nextState.players?.find(p => p.id !== localPlayerId);
            const winner = nextState.winnerId;
            overTitle.textContent = winner === localPlayerId ? "YOU WIN" : (winner ? "GAME OVER" : "DRAW");
            overMessage.textContent = winner === localPlayerId
                ? "상대방보다 오래 버텼습니다."
                : enemy && enemy.id === winner
                    ? "상대방이 승리했습니다."
                    : me?.hp > 0
                        ? "상대방이 먼저 탈락했습니다."
                        : "체력이 모두 소진되었습니다.";
        }
        renderState();
    });

    socket.on("car:countdown", ({ value }) => {
        countdown = true;
        setScreen("game");
        countdownEl.hidden = false;
        countdownEl.textContent = String(value);
    });

    socket.on("car:hit", ({ playerId }) => {
        if (playerId === localPlayerId) {
            hitFlash.hidden = false;
            setTimeout(() => { hitFlash.hidden = true; }, 130);
        }
    });

    socket.on("car:error", ({ message }) => {
        setStatus(message || "카게임 오류가 발생했습니다.", true);
        createBtn.disabled = false;
        joinBtn.disabled = false;
    });

    socket.on("car:room-full", () => {
        setStatus("이 방은 이미 2명으로 가득 찼습니다.", true);
        createBtn.disabled = false;
        joinBtn.disabled = false;
    });

    socket.on("car:opponent-left", () => {
        alert("상대방이 방을 나갔습니다.");
        resetLocalRoom();
        createBtn.disabled = false;
        joinBtn.disabled = false;
    });

    socket.on("disconnect", () => {
        if (inRoom) setStatus("서버 연결이 끊겼습니다. 재연결을 기다리는 중...", true);
    });

    window.addEventListener("pagehide", () => {
        if (inRoom) socket.emit("car:leave-room");
    });

    beginInputLoop();
})();
