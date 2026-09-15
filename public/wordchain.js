(() => {
    'use strict';

    const modal = document.getElementById('wordChainModal');
    if (!modal) return;

    const $ = (id) => document.getElementById(id);
    const backdrop = $('wordChainBackdrop');
    const closeBtn = $('closeWordChainBtn');
    const lobby = $('wordChainLobby');
    const room = $('wordChainRoom');
    const tabs = [...document.querySelectorAll('.wordchain-mode-tab')];
    const createName = $('wordChainCreateName');
    const joinName = $('wordChainJoinName');
    const roomCodeInput = $('wordChainRoomCode');
    const createBtn = $('wordChainCreateBtn');
    const joinBtn = $('wordChainJoinBtn');
    const lobbyStatus = $('wordChainLobbyStatus');
    const roomCodeLabel = $('wordChainRoomCodeLabel');
    const roomModeLabel = $('wordChainRoomModeLabel');
    const startBtn = $('wordChainStartBtn');
    const leaveBtn = $('wordChainLeaveBtn');
    const playersEl = $('wordChainPlayers');
    const currentWordEl = $('wordChainCurrentWord');
    const requiredEl = $('wordChainRequiredLetter');
    const liveTypingEl = $('wordChainLiveTyping');
    const turnBanner = $('wordChainTurnBanner');
    const input = $('wordChainInput');
    const submitBtn = $('wordChainSubmitBtn');
    const mistakesEl = $('wordChainMistakes');
    const timerEl = $('wordChainTimer');
    const dictStatus = $('wordChainDictionaryStatus');
    const logEl = $('wordChainLog');
    const endPanel = $('wordChainEndPanel');
    const endTitle = $('wordChainEndTitle');
    const endText = $('wordChainEndText');
    const rematchBtn = $('wordChainRematchBtn');
    const hubBtn = $('hubWordChainGame');

    let socket = null;
    let connected = false;
    let myId = null;
    let mode = 2;
    let state = null;
    let roomCode = '';
    let typingTimer = null;
    let timerRaf = null;
    let opening = false;
    let gameSessionStarted = false;

    const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[c]));

    function setLobbyStatus(text, kind = '') {
        if (!lobbyStatus) return;
        lobbyStatus.textContent = text || '';
        lobbyStatus.dataset.kind = kind;
    }

    function setDictionaryStatus(text, kind = '') {
        if (!dictStatus) return;
        dictStatus.textContent = text;
        dictStatus.dataset.kind = kind;
    }

    function resetViewToLobby(message = '') {
        gameSessionStarted = false;
        state = null;
        roomCode = '';
        stopTimer();
        if (input) {
            input.value = '';
            input.disabled = true;
        }
        if (submitBtn) submitBtn.disabled = true;
        if (lobby) lobby.hidden = false;
        if (room) room.hidden = true;
        if (endPanel) {
            endPanel.hidden = true;
            endPanel.style.display = 'none';
        }
        if (playersEl) playersEl.innerHTML = '';
        if (logEl) logEl.innerHTML = '';
        if (liveTypingEl) {
            liveTypingEl.textContent = '상대방 입력 대기 중...';
            liveTypingEl.classList.remove('active');
        }
        if (turnBanner) turnBanner.textContent = '방을 준비하고 있습니다.';
        if (mistakesEl) mistakesEl.textContent = '틀린 횟수 0 / 6';
        setDictionaryStatus('끄투 사전 대기', '');
        if (message) setLobbyStatus(message, '');
    }

    function open() {
        if (opening) return;
        opening = true;
        const hub = $('gameHubModal');
        hub?.classList.remove('active');
        hub?.setAttribute('aria-hidden', 'true');
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // GAME OVER 오버레이는 새 진입 시 절대로 남아 있으면 안 됩니다.
        // 실제 진행 중인 방만 유지하고, 끝난 판/초기 상태는 로비로 강제 초기화합니다.
        if (!state || state.status === 'ended') resetViewToLobby();
        if (endPanel) { endPanel.hidden = true; endPanel.style.display = 'none'; }
        if (!socket) connect();
        opening = false;
    }

    function close() {
        if (socket && roomCode) socket.emit('wordchain:leave');
        resetViewToLobby();
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        setLobbyStatus('', '');
    }

    function connect() {
        if (typeof window.io !== 'function') {
            setLobbyStatus('실시간 서버 연결 기능을 불러오지 못했습니다.', 'error');
            return;
        }

        socket = window.io(window.location.origin, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            timeout: 7000
        });

        socket.on('connect', () => {
            connected = true;
            myId = socket.id;
            setLobbyStatus('실시간 서버 연결 완료', 'ok');
        });

        socket.on('disconnect', () => {
            connected = false;
            myId = null;
            stopTimer();
            if (roomCode) setLobbyStatus('서버와 연결이 끊겼습니다. 재연결 중...', 'error');
        });

        socket.on('connect_error', () => {
            connected = false;
            setLobbyStatus('실시간 서버에 연결하지 못했습니다.', 'error');
        });

        socket.on('wordchain:created', ({ code, mode: serverMode }) => {
            roomCode = String(code || '');
            mode = Number(serverMode) === 4 ? 4 : 2;
            setLobbyStatus(`방 ${roomCode} 생성 완료 · ${mode}명이 모두 입장하면 게임을 시작할 수 있습니다.`, 'ok');
        });

        socket.on('wordchain:joined', ({ code, mode: serverMode }) => {
            roomCode = String(code || '');
            mode = Number(serverMode) === 4 ? 4 : 2;
            setLobbyStatus(`방 ${roomCode} 입장 완료`, 'ok');
        });

        socket.on('wordchain:error', ({ message }) => {
            setLobbyStatus(message || '끝말잇기 처리 중 오류가 발생했습니다.', 'error');
        });

        socket.on('wordchain:invalid', ({ reason }) => {
            setDictionaryStatus(reason || '입력할 수 없는 단어입니다.', 'bad');
        });

        socket.on('wordchain:typing', ({ playerId, text }) => {
            if (!state?.players) return;
            const player = state.players.find(p => p.id === playerId);
            if (!player) return;
            player.typing = String(text || '').slice(0, 30);
            renderPlayers();
            renderLiveTyping();
        });

        socket.on('wordchain:state', next => {
            if (!next || !Array.isArray(next.players)) return;

            // 서버/브라우저가 오래된 GAME OVER 상태를 가지고 있더라도
            // 실제 한 판도 시작하지 않은 상태에서는 그것을 표시하지 않습니다.
            if (next.status === 'ended' && !gameSessionStarted) {
                resetViewToLobby();
                return;
            }

            state = next;
            roomCode = String(next.code || roomCode || '');
            mode = Number(next.mode) === 4 ? 4 : 2;
            if (next.status === 'playing') gameSessionStarted = true;
            lobby.hidden = next.status !== 'lobby';
            room.hidden = next.status === 'lobby';
            if (next.status !== 'ended' && endPanel) {
                endPanel.hidden = true;
                endPanel.style.display = 'none';
            }
            render();
        });
    }

    function createRoom() {
        if (endPanel) { endPanel.hidden = true; endPanel.style.display = 'none'; }
        if (!socket || !connected) return setLobbyStatus('서버에 연결하는 중입니다. 잠시만 기다려 주세요.', 'error');
        const name = String(createName?.value || 'Player').trim().slice(0, 14) || 'Player';
        socket.emit('wordchain:create', { mode, nickname: name });
        setLobbyStatus(`${mode}인전 방을 만드는 중...`, '');
    }

    function joinRoom() {
        if (endPanel) { endPanel.hidden = true; endPanel.style.display = 'none'; }
        if (!socket || !connected) return setLobbyStatus('서버에 연결하는 중입니다. 잠시만 기다려 주세요.', 'error');
        const code = String(roomCodeInput?.value || '').trim();
        if (!/^\d{6}$/.test(code)) return setLobbyStatus('방 코드는 숫자 6자리입니다.', 'error');
        const name = String(joinName?.value || 'Player').trim().slice(0, 14) || 'Player';
        socket.emit('wordchain:join', { code, nickname: name });
        setLobbyStatus('방에 참가하는 중...', '');
    }

    function render() {
        if (!state) return;
        if (roomCodeLabel) roomCodeLabel.textContent = state.code || '------';
        if (roomModeLabel) roomModeLabel.textContent = `${state.mode}인전`;
        renderPlayers();
        renderLiveTyping();
        renderBoard();
        renderLogs();
        renderControls();
        renderEnd();
        if (state.status === 'playing') startTimer();
        else stopTimer();
    }

    function renderPlayers() {
        if (!playersEl || !state) return;
        playersEl.innerHTML = state.players.map((p, i) => {
            const hp = Array.from({ length: 2 }, (_, n) => `<i class="${n < p.hp ? 'on' : ''}"></i>`).join('');
            const turn = p.id === state.turnPlayerId && state.status === 'playing';
            const typing = p.typing ? `<span class="wordchain-player-typing">${esc(p.typing)}</span>` : '';
            return `<div class="wordchain-player ${turn ? 'turn' : ''} ${p.alive ? '' : 'dead'} ${p.id === myId ? 'me' : ''}">
                <div class="wordchain-player-top"><span class="wordchain-player-index">${i + 1}</span><strong>${esc(p.nickname)}</strong>${p.id === state.hostId ? '<em>HOST</em>' : ''}</div>
                <div class="wordchain-player-bottom"><span class="wordchain-hearts">${hp}</span><span class="wordchain-mistake-mini">${p.mistakes}/6</span>${typing}</div>
            </div>`;
        }).join('');
    }

    function renderLiveTyping() {
        if (!liveTypingEl || !state) return;
        const typers = state.players.filter(p => p.id !== myId && p.alive && p.typing);
        if (!typers.length) {
            liveTypingEl.textContent = '상대방 입력 대기 중...';
            liveTypingEl.classList.remove('active');
            return;
        }
        liveTypingEl.textContent = typers.map(p => `${p.nickname}: ${p.typing}`).join('  ·  ');
        liveTypingEl.classList.add('active');
    }

    function renderBoard() {
        const current = state.currentWord || '';
        if (currentWordEl) currentWordEl.textContent = current || '게임 시작을 기다리는 중';
        if (requiredEl) {
            if (!current) requiredEl.textContent = '첫 제시어가 나오면 시작합니다.';
            else {
                const starts = Array.isArray(state.requiredStarts) ? state.requiredStarts.join(' / ') : current.slice(-1);
                requiredEl.textContent = `다음 시작 글자 · ${starts}`;
            }
        }
        if (state.lastResult) {
            const source = state.lastResult.source;
            if (source === 'kkutu') setDictionaryStatus(state.lastResult.ok ? '끄투 사전 확인 완료' : '끄투 사전 불인정', state.lastResult.ok ? 'ok' : 'bad');
            else if (source === 'fallback') setDictionaryStatus('끄투 연결 지연 · 임시 사전 사용', state.lastResult.ok ? 'ok' : 'bad');
        }
    }

    function renderControls() {
        const me = state.players.find(p => p.id === myId);
        const myTurn = state.status === 'playing' && state.turnPlayerId === myId && Boolean(me?.alive);
        const active = Boolean(myTurn);

        if (input) input.disabled = !active;
        if (submitBtn) submitBtn.disabled = !active;
        if (mistakesEl) mistakesEl.textContent = `틀린 횟수 ${me?.mistakes || 0} / 6`;

        if (state.status === 'lobby') {
            const full = state.players.length === state.mode;
            if (turnBanner) {
                turnBanner.textContent = state.players.length < state.mode
                    ? `${state.players.length} / ${state.mode}명 · 참가자를 기다리는 중`
                    : (state.hostId === myId ? '모든 인원이 모였습니다. 게임을 시작하세요.' : '방장이 게임을 시작하기를 기다리는 중');
            }
            if (startBtn) startBtn.hidden = !(state.hostId === myId && full);
        } else if (state.status === 'playing') {
            const turnPlayer = state.players.find(p => p.id === state.turnPlayerId);
            if (turnBanner) turnBanner.textContent = active ? 'YOUR TURN · 20초 안에 단어를 입력하세요' : `${turnPlayer?.nickname || '상대'}의 턴`;
            if (startBtn) startBtn.hidden = true;
            if (active && document.activeElement !== input) input?.focus();
        } else {
            if (turnBanner) turnBanner.textContent = 'GAME OVER';
            if (startBtn) startBtn.hidden = true;
        }
    }

    function renderLogs() {
        if (!logEl || !state) return;
        const logs = Array.isArray(state.logs) ? state.logs : [];
        logEl.innerHTML = logs.map(x => `<div class="wordchain-log-item ${esc(x.type || 'system')}">${esc(x.text)}</div>`).join('');
        logEl.scrollTop = logEl.scrollHeight;
    }

    function renderEnd() {
        if (!endPanel || !state) return;
        const ended = state.status === 'ended';
        if (!ended) {
            endPanel.hidden = true;
            endPanel.style.display = 'none';
            return;
        }
        endPanel.hidden = false;
        endPanel.style.display = 'flex';
        const winner = state.players.find(p => p.id === state.winnerId);
        const mine = state.winnerId === myId;
        if (endTitle) endTitle.textContent = mine ? 'YOU WIN' : 'GAME OVER';
        if (endText) endText.textContent = winner ? `${winner.nickname} 승리` : '승자가 없습니다.';
    }

    function submit() {
        if (!socket || !state || state.status !== 'playing' || state.turnPlayerId !== myId) return;
        const word = String(input?.value || '').trim();
        if (!word) return;
        socket.emit('wordchain:submit', { word });
        input.value = '';
        socket.emit('wordchain:typing', { text: '' });
        setDictionaryStatus('끄투 사전 확인 중...', 'loading');
    }

    function sendTyping() {
        if (!socket || !state || state.status !== 'playing' || state.turnPlayerId !== myId) return;
        const text = String(input?.value || '').slice(0, 30);
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => socket.emit('wordchain:typing', { text }), 15);
    }

    function startTimer() {
        stopTimer();
        const tick = () => {
            if (!state || state.status !== 'playing') return;
            const left = Math.max(0, Number(state.turnDeadline || 0) - Date.now());
            if (timerEl) {
                timerEl.textContent = `${Math.ceil(left / 1000)}s`;
                timerEl.classList.toggle('danger', left <= 5000);
            }
            timerRaf = requestAnimationFrame(tick);
        };
        timerRaf = requestAnimationFrame(tick);
    }

    function stopTimer() {
        if (timerRaf) cancelAnimationFrame(timerRaf);
        timerRaf = null;
        if (timerEl) {
            timerEl.textContent = '--';
            timerEl.classList.remove('danger');
        }
    }

    function leaveRoom(message = '방에서 나왔습니다.') {
        if (socket) socket.emit('wordchain:leave');
        resetViewToLobby(message);
        if (endPanel) { endPanel.hidden = true; endPanel.style.display = 'none'; }
    }

    tabs.forEach(tab => tab.addEventListener('click', () => {
        mode = Number(tab.dataset.wcMode) === 4 ? 4 : 2;
        tabs.forEach(x => x.classList.toggle('active', x === tab));
        setLobbyStatus(`${mode}인전 모드가 선택되었습니다.`, '');
    }));

    hubBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', close);
    createBtn?.addEventListener('click', createRoom);
    joinBtn?.addEventListener('click', joinRoom);
    startBtn?.addEventListener('click', () => socket?.emit('wordchain:start'));
    leaveBtn?.addEventListener('click', () => leaveRoom());
    submitBtn?.addEventListener('click', submit);
    input?.addEventListener('input', sendTyping);
    input?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submit();
        }
    });
    roomCodeInput?.addEventListener('input', () => {
        roomCodeInput.value = roomCodeInput.value.replace(/\D/g, '').slice(0, 6);
    });
    rematchBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        leaveRoom('로비로 돌아왔습니다. 새 방을 만들거나 다른 방에 참가하세요.');
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('active')) close();
    });
})();
