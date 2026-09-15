(() => {
    const modal = document.getElementById('wordChainModal');
    if (!modal) return;

    const backdrop = document.getElementById('wordChainBackdrop');
    const closeBtn = document.getElementById('closeWordChainBtn');
    const lobby = document.getElementById('wordChainLobby');
    const room = document.getElementById('wordChainRoom');
    const tabs = [...document.querySelectorAll('.wordchain-mode-tab')];
    const createName = document.getElementById('wordChainCreateName');
    const joinName = document.getElementById('wordChainJoinName');
    const roomCodeInput = document.getElementById('wordChainRoomCode');
    const createBtn = document.getElementById('wordChainCreateBtn');
    const joinBtn = document.getElementById('wordChainJoinBtn');
    const lobbyStatus = document.getElementById('wordChainLobbyStatus');
    const roomCodeLabel = document.getElementById('wordChainRoomCodeLabel');
    const roomModeLabel = document.getElementById('wordChainRoomModeLabel');
    const startBtn = document.getElementById('wordChainStartBtn');
    const leaveBtn = document.getElementById('wordChainLeaveBtn');
    const playersEl = document.getElementById('wordChainPlayers');
    const currentWordEl = document.getElementById('wordChainCurrentWord');
    const requiredEl = document.getElementById('wordChainRequiredLetter');
    const liveTypingEl = document.getElementById('wordChainLiveTyping');
    const turnBanner = document.getElementById('wordChainTurnBanner');
    const input = document.getElementById('wordChainInput');
    const submitBtn = document.getElementById('wordChainSubmitBtn');
    const mistakesEl = document.getElementById('wordChainMistakes');
    const timerEl = document.getElementById('wordChainTimer');
    const dictStatus = document.getElementById('wordChainDictionaryStatus');
    const logEl = document.getElementById('wordChainLog');
    const endPanel = document.getElementById('wordChainEndPanel');
    const endTitle = document.getElementById('wordChainEndTitle');
    const endText = document.getElementById('wordChainEndText');
    const rematchBtn = document.getElementById('wordChainRematchBtn');
    const hubBtn = document.getElementById('hubWordChainGame');

    let socket = null;
    let mode = 2;
    let state = null;
    let myId = null;
    let typingTimer = null;
    let timerRaf = null;
    let roomCode = '';
    let connected = false;

    const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

    function setLobbyStatus(text, kind='') {
        if (!lobbyStatus) return;
        lobbyStatus.textContent = text || '';
        lobbyStatus.dataset.kind = kind;
    }

    function open() {
        const hub = document.getElementById('gameHubModal');
        hub?.classList.remove('active');
        hub?.setAttribute('aria-hidden', 'true');
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (!socket) connect();
    }

    function close() {
        if (socket && roomCode) socket.emit('wordchain:leave');
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        state = null;
        roomCode = '';
        lobby.hidden = false;
        room.hidden = true;
        endPanel.hidden = true;
        if (input) input.value = '';
        stopTimer();
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
            setLobbyStatus('실시간 서버 연결 완료', 'ok');
        });
        socket.on('disconnect', () => {
            connected = false;
            if (roomCode) setLobbyStatus('서버와 연결이 끊겼습니다. 재연결 중...', 'error');
        });
        socket.on('wordchain:created', ({ code, mode: serverMode }) => {
            roomCode = String(code);
            mode = Number(serverMode) === 4 ? 4 : 2;
            setLobbyStatus(`방 ${roomCode} 생성 완료 · ${mode}명이 모이면 시작할 수 있습니다.`, 'ok');
        });
        socket.on('wordchain:joined', ({ code, mode: serverMode }) => {
            roomCode = String(code);
            mode = Number(serverMode) === 4 ? 4 : 2;
            setLobbyStatus('방에 입장했습니다.', 'ok');
        });
        socket.on('wordchain:error', ({ message }) => setLobbyStatus(message || '오류가 발생했습니다.', 'error'));
        socket.on('wordchain:invalid', ({ reason }) => {
            setDictionaryStatus('입력 오류', 'bad');
            addClientLog(reason || '잘못된 입력입니다.', 'bad');
        });
        socket.on('wordchain:typing', ({ playerId, text }) => {
            if (!state?.players) return;
            const p = state.players.find(x => x.id === playerId);
            if (!p) return;
            p.typing = String(text || '');
            if (playerId !== myId && p.alive && p.typing) {
                liveTypingEl.textContent = `${p.nickname} 입력 중 · ${p.typing}`;
                liveTypingEl.classList.add('active');
            } else if (playerId === state.turnPlayerId) {
                const other = state.players.find(x => x.id !== myId && x.alive && x.typing);
                if (!other) liveTypingEl.textContent = '상대방 입력 대기 중...';
            }
            renderPlayers();
        });
        socket.on('wordchain:state', next => {
            state = next;
            roomCode = String(next.code || roomCode);
            mode = Number(next.mode) === 4 ? 4 : 2;
            lobby.hidden = next.status !== 'lobby';
            room.hidden = next.status === 'lobby';
            if (next.status === 'lobby') {
                lobby.hidden = true;
                room.hidden = false;
            }
            render();
        });
    }

    function createRoom() {
        if (!socket || !connected) return setLobbyStatus('서버에 연결하는 중입니다.', 'error');
        const name = String(createName?.value || 'Player').trim().slice(0, 14) || 'Player';
        socket.emit('wordchain:create', { mode, nickname: name });
        setLobbyStatus('방을 만드는 중...', '');
    }

    function joinRoom() {
        if (!socket || !connected) return setLobbyStatus('서버에 연결하는 중입니다.', 'error');
        const code = String(roomCodeInput?.value || '').trim();
        if (!/^\d{6}$/.test(code)) return setLobbyStatus('방 코드는 숫자 6자리입니다.', 'error');
        const name = String(joinName?.value || 'Player').trim().slice(0, 14) || 'Player';
        socket.emit('wordchain:join', { code, nickname: name });
        setLobbyStatus('방에 참가하는 중...', '');
    }

    function render() {
        if (!state) return;
        roomCodeLabel.textContent = state.code;
        roomModeLabel.textContent = `${state.mode}인전`;
        renderPlayers();
        renderBoard();
        renderLogs();
        renderControls();
        renderEnd();
        if (state.status === 'playing') startTimer(); else stopTimer();
    }

    function renderPlayers() {
        if (!playersEl || !state) return;
        playersEl.innerHTML = state.players.map((p, i) => {
            const hp = Array.from({length: 2}, (_, n) => `<i class="${n < p.hp ? 'on' : ''}"></i>`).join('');
            const turn = p.id === state.turnPlayerId && state.status === 'playing';
            const typing = p.typing ? `<span class="wordchain-player-typing">${esc(p.typing)}</span>` : '';
            return `<div class="wordchain-player ${turn ? 'turn' : ''} ${p.alive ? '' : 'dead'} ${p.id === myId ? 'me' : ''}">
                <div class="wordchain-player-top"><span class="wordchain-player-index">${i + 1}</span><strong>${esc(p.nickname)}</strong>${p.id === state.hostId ? '<em>HOST</em>' : ''}</div>
                <div class="wordchain-player-bottom"><span class="wordchain-hearts">${hp}</span><span class="wordchain-mistake-mini">${p.mistakes}/6</span>${typing}</div>
            </div>`;
        }).join('');
    }

    function renderBoard() {
        const current = state.currentWord || '';
        currentWordEl.textContent = current || '게임 준비 중';
        if (!current) requiredEl.textContent = '제시어 준비 중';
        else {
            const starts = Array.isArray(state.requiredStarts) ? state.requiredStarts.join(' / ') : current.slice(-1);
            requiredEl.textContent = `다음 시작 글자 · ${starts}`;
        }
        if (state.lastResult?.source) setDictionaryStatus(state.lastResult.source === 'kkutu' ? '끄투 사전 확인' : '임시 사전 확인', state.lastResult.ok ? 'ok' : 'bad');
    }

    function renderControls() {
        const me = state.players?.find(p => p.id === myId);
        const myTurn = state.status === 'playing' && state.turnPlayerId === myId && me?.alive;
        const active = Boolean(myTurn);
        input.disabled = !active;
        submitBtn.disabled = !active;
        mistakesEl.textContent = `틀린 횟수 ${me?.mistakes || 0} / 6`;
        if (state.status === 'lobby') {
            turnBanner.textContent = state.players.length < state.mode ? `${state.players.length} / ${state.mode}명 · 참가자를 기다리는 중` : (state.hostId === myId ? '모든 인원이 모였습니다. 게임을 시작하세요.' : '방장이 게임을 시작하기를 기다리는 중');
            startBtn.hidden = state.hostId !== myId || state.players.length !== state.mode;
        } else if (state.status === 'playing') {
            turnBanner.textContent = active ? 'YOUR TURN · 단어를 입력하세요' : `${state.players.find(p => p.id === state.turnPlayerId)?.nickname || '상대'}의 턴`;
            startBtn.hidden = true;
        } else {
            turnBanner.textContent = 'GAME OVER';
            startBtn.hidden = true;
        }
    }

    function renderLogs() {
        if (!logEl) return;
        const logs = Array.isArray(state.logs) ? state.logs : [];
        logEl.innerHTML = logs.map(x => `<div class="wordchain-log-item ${esc(x.type || 'system')}">${esc(x.text)}</div>`).join('');
        logEl.scrollTop = logEl.scrollHeight;
    }

    function renderEnd() {
        if (!endPanel || !state) return;
        if (state.status !== 'ended') {
            endPanel.hidden = true;
            return;
        }
        endPanel.hidden = false;
        const winner = state.players?.find(p => p.id === state.winnerId);
        const mine = state.winnerId === myId;
        endTitle.textContent = mine ? 'YOU WIN' : 'GAME OVER';
        endText.textContent = winner ? `${winner.nickname} 승리` : '승자가 없습니다.';
    }

    function submit() {
        const word = String(input?.value || '').trim();
        if (!word || !socket || !state || state.turnPlayerId !== myId) return;
        socket.emit('wordchain:submit', { word });
        input.value = '';
        socket.emit('wordchain:typing', { text: '' });
        setDictionaryStatus('끄투 사전 확인 중...', 'loading');
    }

    function sendTyping() {
        if (!socket || !state || state.status !== 'playing' || state.turnPlayerId !== myId) return;
        const text = String(input?.value || '').slice(0, 30);
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => socket.emit('wordchain:typing', { text }), 25);
    }

    function addClientLog(text, type='system') {
        if (!logEl) return;
        const div = document.createElement('div');
        div.className = `wordchain-log-item ${type}`;
        div.textContent = text;
        logEl.appendChild(div);
        logEl.scrollTop = logEl.scrollHeight;
    }

    function setDictionaryStatus(text, kind='') {
        if (!dictStatus) return;
        dictStatus.textContent = text;
        dictStatus.dataset.kind = kind;
    }

    function startTimer() {
        stopTimer();
        const tick = () => {
            if (!state || state.status !== 'playing') return;
            const left = Math.max(0, Number(state.turnDeadline || 0) - Date.now());
            timerEl.textContent = `${Math.ceil(left / 1000)}s`;
            timerEl.classList.toggle('danger', left <= 4000);
            timerRaf = requestAnimationFrame(tick);
        };
        timerRaf = requestAnimationFrame(tick);
    }

    function stopTimer() {
        if (timerRaf) cancelAnimationFrame(timerRaf);
        timerRaf = null;
        if (timerEl) { timerEl.textContent = '--'; timerEl.classList.remove('danger'); }
    }

    tabs.forEach(tab => tab.addEventListener('click', () => {
        mode = Number(tab.dataset.wcMode) === 4 ? 4 : 2;
        tabs.forEach(x => x.classList.toggle('active', x === tab));
    }));
    hubBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', close);
    createBtn?.addEventListener('click', createRoom);
    joinBtn?.addEventListener('click', joinRoom);
    startBtn?.addEventListener('click', () => socket?.emit('wordchain:start'));
    leaveBtn?.addEventListener('click', () => {
        if (socket && roomCode) socket.emit('wordchain:leave');
        state = null; roomCode = '';
        room.hidden = true; lobby.hidden = false; endPanel.hidden = true;
        setLobbyStatus('방에서 나왔습니다.', '');
    });
    submitBtn?.addEventListener('click', submit);
    input?.addEventListener('input', sendTyping);
    input?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    roomCodeInput?.addEventListener('input', () => { roomCodeInput.value = roomCodeInput.value.replace(/\D/g, '').slice(0, 6); });
    rematchBtn?.addEventListener('click', () => {
        if (socket && roomCode) socket.emit('wordchain:leave');
        state = null; roomCode = ''; endPanel.hidden = true; room.hidden = true; lobby.hidden = false; setLobbyStatus('새 방을 만들거나 다른 방에 참가하세요.', '');
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('active')) close();
    });
})();
