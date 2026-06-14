// ui-extra.js  ─  extra UI wiring that works alongside the existing app.js
// Handles: sign history feed, stats strip, chat box, start/stop button states

(function () {
    // ── State ──────────────────────────────────────────────────────────
    const state = {
        count: 0,
        totalConf: 0,
        lastSign: null,
        signFreq: {},     // sign → count
        isRunning: false,
        messages: []
    };

    // ── Element refs ───────────────────────────────────────────────────
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const camToggleBtn = document.getElementById('cam-toggle');
    const historyList = document.getElementById('sign-history');
    const statCount = document.getElementById('stat-count');
    const statAvg = document.getElementById('stat-avg');
    const statTop = document.getElementById('stat-top');
    const placeholder = document.getElementById('feed-placeholder');
    const gestureName = document.getElementById('gesture-name');
    const confidence = document.getElementById('confidence');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    // ── Camera state visual ────────────────────────────────────────────
    function setRunning(on) {
        state.isRunning = on;
        if (placeholder) {
            placeholder.classList.toggle('hidden', on);
        }
        startBtn.disabled = on;
        // Visual feedback on cam-toggle icon
        if (camToggleBtn) {
            camToggleBtn.style.color = on
                ? 'var(--accent-cyan)'
                : 'var(--text-primary)';
        }
    }

    // ── Hook into start/stop buttons (the real camera logic lives in app.js) ──
    if (startBtn) {
        const origStart = startBtn.onclick;
        startBtn.addEventListener('click', () => {
            setRunning(true);
        });
    }

    if (stopBtn) {
        const origStop = stopBtn.onclick;
        stopBtn.addEventListener('click', () => {
            setRunning(false);
            gestureName.textContent = 'None';
            confidence.textContent = '—';
        });
    }

    // ── Watch gesture name element for changes → push to feed ─────────
    const observer = new MutationObserver(() => {
        const sign = gestureName.textContent.trim();
        const conf = confidence.textContent.trim();
        if (sign && sign !== 'None' && sign !== '—') {
            pushSignToFeed(sign, conf);
        }
    });

    if (gestureName) {
        observer.observe(gestureName, { childList: true, characterData: true, subtree: true });
    }

    // ── Feed helpers ───────────────────────────────────────────────────
    const SIGN_ICONS = {
        'Fist': '✊',
        'Open Hand': '🖐️',
        'Rock': '🤘',
        'Thumbs Up': '👍',
        'Thumbs Down': '👎',
        'Peace': '✌️',
        'Pointing Up': '☝️',
    };

    let lastPushed = '';
    let pushTimeout = null;

    function pushSignToFeed(sign, confStr) {
        // Debounce: don't spam the same sign
        if (sign === lastPushed) return;
        lastPushed = sign;
        clearTimeout(pushTimeout);
        pushTimeout = setTimeout(() => { lastPushed = ''; }, 1200);

        // Remove placeholder item if present
        const placeholderItem = historyList.querySelector('.placeholder');
        if (placeholderItem) placeholderItem.remove();

        // Update state
        state.count++;
        const confNum = parseFloat(confStr);
        if (!isNaN(confNum)) state.totalConf += confNum;
        state.signFreq[sign] = (state.signFreq[sign] || 0) + 1;

        // Build feed item
        const icon = SIGN_ICONS[sign] || '🤚';
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

        const li = document.createElement('li');
        li.className = 'feed-item';
        li.innerHTML = `
            <div class="feed-avatar">${icon}</div>
            <div class="feed-text">
                <span class="feed-sign">${escHtml(sign)}</span>
                <span class="feed-time">${time} · conf ${isNaN(confNum) ? '—' : confNum.toFixed(2)}</span>
            </div>`;

        // Prepend so newest is on top
        historyList.insertBefore(li, historyList.firstChild);

        // Cap feed length
        while (historyList.children.length > 20) {
            historyList.removeChild(historyList.lastChild);
        }

        // Update stats
        updateStats();
    }

    function updateStats() {
        statCount.textContent = state.count;

        const avg = state.count > 0
            ? (state.totalConf / state.count).toFixed(2)
            : '—';
        statAvg.textContent = avg;

        let topSign = '—';
        let maxFreq = 0;
        for (const [k, v] of Object.entries(state.signFreq)) {
            if (v > maxFreq) { maxFreq = v; topSign = k; }
        }
        statTop.textContent = topSign.split(' ')[0]; // first word fits better
    }

    // ── Chat send ──────────────────────────────────────────────────────
    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        // Push to feed as a chat-style message (visual only)
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

        const li = document.createElement('li');
        li.className = 'feed-item';
        li.innerHTML = `
            <div class="feed-avatar" style="background: linear-gradient(135deg, var(--accent-green), var(--navy-panel));">💬</div>
            <div class="feed-text">
                <span class="feed-sign">${escHtml(text)}</span>
                <span class="feed-time">${time}</span>
            </div>`;

        const placeholderItem = historyList.querySelector('.placeholder');
        if (placeholderItem) placeholderItem.remove();
        historyList.insertBefore(li, historyList.firstChild);

        chatInput.value = '';
    }

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // ── Helpers ────────────────────────────────────────────────────────
    function escHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
})();