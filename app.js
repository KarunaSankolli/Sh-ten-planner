const TODAY = new Date();
const TODAYKEY = fmt(TODAY);
let viewDate = new Date(TODAY);
let VIEWKEY = TODAYKEY;
let state = JSON.parse(localStorage.getItem('techo_state') || 'null') || {
    tasks: {}, userName: '', dayNotes: {},
    consumeItems: [], consumeLibrary: [], consumePan: { x: 0, y: 0 }, consumeZoom: 1, habits: {},
    habitsList: [
        { id: 'water', name: '1L Water', sticker: 'assets/sticker_water.png' },
        { id: 'gym', name: 'Gym', sticker: 'assets/sticker_dumbbell.png' },
        { id: 'ai', name: '1 hr focus work on AI', sticker: 'assets/sticker_lightbulb.png' }
    ],
    weeklyNotes: {}
};
// ensure new fields exist for old saves
const STICKER_OPTIONS = [
    'assets/sticker_lightbulb.png',
    'assets/sticker_water.png',
    'assets/sticker_dumbbell.png',
    'assets/sticker_book.png'
];
if (!state.dayNotes) state.dayNotes = {};
if (!state.consumeItems) state.consumeItems = [];
if (!state.consumeLibrary) state.consumeLibrary = [];
if (!state.consumePan) state.consumePan = { x: 0, y: 0 };
if (state.consumeZoom === undefined) state.consumeZoom = 1;
if (!state.habits) state.habits = {};
if (!state.habitsList) {
    state.habitsList = [
        { id: 'water', name: '1L Water', sticker: 'assets/sticker_water.png' },
        { id: 'gym', name: 'Gym', sticker: 'assets/sticker_dumbbell.png' },
        { id: 'ai', name: '1 hr focus work on AI', sticker: 'assets/sticker_lightbulb.png' }
    ];
} else {
    // Add default stickers for legacy saves
    state.habitsList.forEach(h => {
        if(!h.sticker) h.sticker = 'assets/sticker_lightbulb.png';
    });
}
if (!state.weeklyNotes) state.weeklyNotes = {};
let calOffset = 0, weekOffset = 0, editingTaskId = null, editingTaskList = 'daily', editingTaskDateKey = '';
const TOMORROW = new Date(TODAY); TOMORROW.setDate(TODAY.getDate() + 1);
const REAL_TOMORROW_KEY = fmt(TOMORROW);
function vTomKey() { const d = new Date(viewDate); d.setDate(d.getDate() + 1); return fmt(d); }
let draggedTaskId = null;
let selectedConsumeIds = [];
let isSelectionMode = false;

function fmt(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function save() { localStorage.setItem('techo_state', JSON.stringify(state)) }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }
function dayTasks(k) { return state.tasks[k] || [] }

// ── STUDIO GHIBLI SCENES ──
const SCENES = [
    { emoji: '🌏', quote: "You cannot alter your fate. However, you can rise to meet it.", source: "Princess Mononoke" },
    { emoji: '🐉', quote: "Once you've met someone, you never really forget them.", source: "Spirited Away · Zeniba" },
    { emoji: '🌊', quote: "No matter how many weapons you have, no matter how great your technology might be, the world cannot live without love.", source: "Castle in the Sky" },
    { emoji: '🧙', quote: "I've been so many people I barely know who I am any more.", source: "Howl's Moving Castle · Sophie" },
    { emoji: '🌿', quote: "We Totoros only appear to those who believe in us.", source: "My Neighbor Totoro" },
    { emoji: '🌸', quote: "I think I can handle it.", source: "Kiki's Delivery Service · Kiki" },
    { emoji: '🦊', quote: "They say that the best blaze burns brightest when circumstances are at their worst.", source: "Nausicaä of the Valley of the Wind" },
    { emoji: '🌙', quote: "Even if the morrow is barren of promises, nothing shall forestall my return.", source: "Princess Mononoke" },
    { emoji: '🐟', quote: "Whenever someone creates something with all of their heart, then that creation is given a soul.", source: "The Cat Returns · Baron" },
    { emoji: '🌻', quote: "Try smiling, even when life is hard. A smiling face is more beautiful than a crying face.", source: "Ponyo" },
    { emoji: '🎈', quote: "I don't like uncertainty. So I prepare. I prepare very hard.", source: "Porco Rosso" },
    { emoji: '🌈', quote: "Every day, tiny moments of wonder are waiting to be noticed.", source: "The Garden of Words" },
    { emoji: '🍃', quote: "A heart's a heavy burden.", source: "Howl's Moving Castle · Sophie" },
    { emoji: '🌺', quote: "You must never run from anything immortal — it attracts their attention.", source: "Castle in the Sky · Dola" },
    { emoji: '✨', quote: "Always believe in yourself, even when no one else does.", source: "The Wind Rises · Jiro" },
    { emoji: '🌅', quote: "Be kind, hardworking and honest. That's all it takes to find your way.", source: "Kiki's Delivery Service" },
    { emoji: '🦅', quote: "Now go on with your lives, leave the spirit world alone.", source: "Spirited Away · Yubaba" },
    { emoji: '🐻', quote: "The forest is alive — you need to walk slowly and listen.", source: "Princess Mononoke" },
    { emoji: '🌾', quote: "Don't think. Feel, and you'll be alright.", source: "Nausicaä" },
    { emoji: '🎋', quote: "Life is suffering. It is hard. The world is cursed. But still, you find reasons to keep living.", source: "Princess Mononoke · Eboshi" },
    { emoji: '🏡', quote: "Home is wherever the people you love are.", source: "Howl's Moving Castle" },
    { emoji: '🌠', quote: "Just keep moving forward — that's all you need to do.", source: "The Wind Rises" },
];

function getTodayScene() {
    const d = TODAY;
    return SCENES[(d.getDate() + d.getMonth() * 31) % SCENES.length];
}

function getMoonPhase(date) {
    const JD = date.getTime() / 86400000 + 2440587.5;
    const p = ((JD - 2451550.1) / 29.530588) % 1; const ph = p < 0 ? p + 1 : p;
    const phases = [
        { max: .066, emoji: '🌑', label: 'New Moon' }, { max: .183, emoji: '🌒', label: 'Waxing Crescent' },
        { max: .317, emoji: '🌓', label: 'First Quarter' }, { max: .433, emoji: '🌔', label: 'Waxing Gibbous' },
        { max: .566, emoji: '🌕', label: 'Full Moon' }, { max: .683, emoji: '🌖', label: 'Waning Gibbous' },
        { max: .817, emoji: '🌗', label: 'Last Quarter' }, { max: .933, emoji: '🌘', label: 'Waning Crescent' },
        { max: 1, emoji: '🌑', label: 'New Moon' }
    ];
    return phases.find(x => ph <= x.max) || phases[phases.length - 1];
}

function toReiwa(y) { return y >= 2019 ? `令和${y - 2018}年` : '' }

function updateDateDisplay() {
    const d = viewDate;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('date-day').textContent = d.getDate();
    document.getElementById('date-full').textContent = `${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getFullYear()}`;
    document.getElementById('date-reiwa').textContent = toReiwa(d.getFullYear());

    const labelEl = document.getElementById('timeline-date-label');
    if (labelEl) {
        if (VIEWKEY === TODAYKEY) labelEl.textContent = 'Today';
        else if (VIEWKEY === REAL_TOMORROW_KEY) labelEl.textContent = 'Tomorrow';
        else {
            const yest = new Date(TODAY); yest.setDate(TODAY.getDate() - 1);
            if (VIEWKEY === fmt(yest)) labelEl.textContent = 'Yesterday';
            else labelEl.textContent = `${months[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
        }
    }
}
function tickTime() {
    const n = new Date();
    document.getElementById('date-time').textContent = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
}
setInterval(tickTime, 10000);

function changeViewDate(offset) {
    viewDate.setDate(viewDate.getDate() + offset);
    VIEWKEY = fmt(viewDate);
    refreshDailyView();
}
function goToToday() {
    viewDate = new Date(TODAY);
    VIEWKEY = TODAYKEY;
    refreshDailyView();
}
function refreshDailyView() {
    updateDateDisplay(); updateMoon(); updateBanner(); renderDailyTasks(); renderTomorrowTasks(); renderHabits(); renderTimeline(); renderMiniCal();
    // Always show Tomorrow's card (relative to viewDate)
    const tomCard = document.getElementById('tomorrow-card');
    if (tomCard) {
        tomCard.style.display = '';
        const d = new Date(viewDate); d.setDate(d.getDate() + 1);
        const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
        tomCard.querySelector('.section-title').innerHTML = `Next Day <span style="font-weight:normal;opacity:0.6;font-size:0.8em;margin-left:5px;">— ${m} ${d.getDate()}</span>`;
    }
}

function updateMoon() {
    const mp = getMoonPhase(TODAY);
    document.getElementById('moon-emoji').textContent = mp.emoji;
    document.getElementById('moon-label').textContent = mp.label;
}

function updateBanner() {
    const s = getTodayScene();
    document.getElementById('movie-scene-emoji').textContent = s.emoji;
    document.getElementById('movie-quote').textContent = s.quote;
    document.getElementById('movie-source').textContent = s.source;
}

function tagLabel(t) {
    return {
        work: 'Work',
        personal: 'Personal',
        health: 'Health',
        creative: 'Creative'
    }[t] || 'Personal';
}

// ── TASK RENDERING + CROSS-SECTION DRAG ──
let dragSource = null; // { listType, dateKey }

function renderTaskList(el, tasks, listType, dateKey) {
    el.innerHTML = '';
    if (!tasks.length) {
        const li = document.createElement('li'); li.className = 'task-empty';
        li.textContent = listType === 'weekly' ? 'No goals yet — press ＋' : 'No tasks yet — press ＋ or drag here';
        el.appendChild(li);
    }
    tasks.forEach((t, idx) => {
        const li = document.createElement('li');
        li.className = 'task-item' + (t.done ? ' done' : '');
        li.draggable = (listType === 'daily' || listType === 'tomorrow');
        li.dataset.taskId = t.id;
        li.dataset.idx = idx;
        li.innerHTML = `<div class="task-cb${t.done ? ' checked' : ''}" data-id="${t.id}" data-list="${listType}"></div>
                        <span class="task-name">${t.name}</span>
                        ${t.time ? `<span class="task-time-badge">${t.time}</span>` : ''}
                        ${t.priority === 'high' ? '<span class="task-priority">CRITICAL</span>' : ''}
                        <span class="task-tag ${t.tag || 'personal'}">${tagLabel(t.tag)}</span>`;
        li.querySelector('.task-cb').addEventListener('click', e => { e.stopPropagation(); toggleTask(t.id, listType); });

        // Edit on double click or long press
        let pressTimer;
        const handleEdit = () => openEditTask(t.id, listType, dateKey);

        li.addEventListener('dblclick', e => {
            if (e.target.classList.contains('task-cb')) return;
            handleEdit();
        });

        li.addEventListener('touchstart', e => {
            if (e.target.classList.contains('task-cb')) return;
            pressTimer = setTimeout(handleEdit, 500);
        }, { passive: true });
        li.addEventListener('touchend', () => clearTimeout(pressTimer));
        li.addEventListener('touchmove', () => clearTimeout(pressTimer));
        li.addEventListener('touchcancel', () => clearTimeout(pressTimer));
        if (listType === 'daily' || listType === 'tomorrow') {
            li.addEventListener('dragstart', e => {
                draggedTaskId = t.id;
                dragSource = { listType, dateKey };
                li.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            li.addEventListener('dragend', () => {
                draggedTaskId = null; dragSource = null;
                li.classList.remove('dragging');
                clearDropIndicators();
            });
        }
        el.appendChild(li);
    });

    // Make this list a drop target (for between-item drops)
    if (listType === 'daily' || listType === 'tomorrow') {
        el.addEventListener('dragover', e => {
            if (!draggedTaskId) return;
            e.preventDefault();
            el.classList.add('drag-target');
            clearDropIndicators();
            const items = [...el.querySelectorAll('.task-item:not(.dragging)')];
            let insertBefore = null;
            for (const item of items) {
                const rect = item.getBoundingClientRect();
                if (e.clientY < rect.top + rect.height / 2) { insertBefore = item; break; }
            }
            const indicator = document.createElement('div');
            indicator.className = 'drop-indicator';
            if (insertBefore) el.insertBefore(indicator, insertBefore);
            else el.appendChild(indicator);
        });
        el.addEventListener('dragleave', e => {
            if (!el.contains(e.relatedTarget)) {
                el.classList.remove('drag-target');
                clearDropIndicators();
            }
        });
        el.addEventListener('drop', e => {
            e.preventDefault();
            el.classList.remove('drag-target');
            clearDropIndicators();
            if (!draggedTaskId || !dragSource) return;
            handleTaskDrop(draggedTaskId, dragSource, listType, dateKey, e, el);
            draggedTaskId = null; dragSource = null;
        });
    }
}

function clearDropIndicators() {
    document.querySelectorAll('.drop-indicator').forEach(x => x.remove());
    document.querySelectorAll('.task-list.drag-target').forEach(x => x.classList.remove('drag-target'));
}

function handleTaskDrop(taskId, src, destListType, destDateKey, e, destEl) {
    // Compute insert index from DOM *before* mutating
    const items = [...destEl.querySelectorAll('.task-item:not(.dragging)')];
    let dropIdx = items.length;
    for (let i = 0; i < items.length; i++) {
        const rect = items[i].getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) { dropIdx = i; break; }
    }

    // Remove task from source
    const srcArr = state.tasks[src.dateKey] || [];
    const srcIdx = srcArr.findIndex(x => x.id === taskId);
    if (srcIdx === -1) return;
    const [task] = srcArr.splice(srcIdx, 1);

    // Only clear time when moving cross-date
    if (src.dateKey !== destDateKey) task.time = '';

    // Ensure destination array exists
    if (!state.tasks[destDateKey]) state.tasks[destDateKey] = [];
    const destArr = state.tasks[destDateKey];

    // Same-day reordering logic
    if (src.dateKey === destDateKey) {
        let dailyOnly = destArr.filter(t => t.list === 'daily');
        // Calculate offset if it's the "Other Tasks" list
        let offset = 0;
        if (destEl.id === 'daily-other-list') {
            offset = 3; // Top-3 are always the first 3
        }

        const targetGlobalIdx = offset + dropIdx;
        if (targetGlobalIdx >= dailyOnly.length) {
            destArr.push(task);
        } else {
            const refTask = dailyOnly[targetGlobalIdx];
            const realIdx = destArr.indexOf(refTask);
            destArr.splice(realIdx, 0, task);
        }
    } else {
        // Cross-date movement: prepending to today makes it a priority
        destArr.unshift(task);
    }

    save(); renderDailyTasks(); renderTomorrowTasks(); renderTimeline();
}

function getHabitStreak(habitId) {
    let streak = 0;
    let checkDate = new Date(TODAY);
    let kToday = fmt(checkDate);

    // Check today first to see if we increment or not
    if (state.habits[kToday] && state.habits[kToday][habitId]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    } else {
        // If today isn't done, the streak might still be alive from yesterday
        checkDate.setDate(checkDate.getDate() - 1);
    }

    // Look back in time
    while (true) {
        let k = fmt(checkDate);
        if (state.habits[k] && state.habits[k][habitId]) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

function fireConfetti(x, y) {
    const colors = ['#FF6B35', '#FF9500', '#FFB800', '#4CAF50', '#2196F3', '#9C27B0'];
    for (let i = 0; i < 20; i++) {
        const conf = document.createElement('div');
        document.body.appendChild(conf);

        const angle = Math.random() * Math.PI * 2;
        const velocity = 20 + Math.random() * 40;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity - 20; // Slight upward bias
        const rot = Math.random() * 360;

        conf.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: ${6 + Math.random() * 4}px;
            height: ${6 + Math.random() * 4}px;
            background-color: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            pointer-events: none;
            z-index: 10000;
            transition: all 0.6s cubic-bezier(0.1, 0.8, 0.3, 1);
            transform: translate(-50%, -50%) rotate(0deg);
            opacity: 1;
        `;

        // Trigger animation next frame
        requestAnimationFrame(() => {
            conf.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rot}deg) scale(0)`;
            conf.style.opacity = '0';
            setTimeout(() => conf.remove(), 600);
        });
    }
}

function renderHabits() {
    const container = document.getElementById('daily-habits-list');
    if (!container) return;
    container.innerHTML = '';
    const habitsDefs = state.habitsList;
    if (!state.habits[VIEWKEY]) {
        state.habits[VIEWKEY] = {};
        habitsDefs.forEach(h => state.habits[VIEWKEY][h.id] = false);
    }

    habitsDefs.forEach(h => {
        const streak = getHabitStreak(h.id);
        const habitRow = document.createElement('div');
        habitRow.style.display = 'flex';
        habitRow.style.flexDirection = 'column';
        habitRow.style.gap = '8px';
        habitRow.style.paddingPadding = '10px 0';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';

        const title = document.createElement('div');
        title.className = 'habit-title';
        title.style.fontWeight = '600';
        title.style.fontSize = '0.95rem';
        title.style.color = 'var(--ink)';
        title.style.cursor = 'pointer';
        title.textContent = h.name;
        title.onclick = () => openEditHabit(h.id);

        const streakBadge = document.createElement('div');
        streakBadge.style.fontSize = '0.8rem';
        streakBadge.style.fontWeight = 'bold';
        streakBadge.style.color = streak > 0 ? '#FF6B35' : 'var(--ink3)';
        streakBadge.innerHTML = streak > 0 ? `🔥 ${streak}` : `❄️ 0`;

        header.appendChild(title);
        header.appendChild(streakBadge);

        const dotsContainer = document.createElement('div');
        dotsContainer.style.display = 'flex';
        dotsContainer.style.justifyContent = 'space-between';
        dotsContainer.style.gap = '6px';

        // Render Monday to Sunday for the current week
        const todayForWeek = new Date(TODAY);
        const dayOfWeek = todayForWeek.getDay(); // 0 is Sun, 1 is Mon...
        const diffToMonday = todayForWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const currentMonday = new Date(todayForWeek.setDate(diffToMonday));

        for (let i = 0; i < 7; i++) {
            let d = new Date(currentMonday);
            d.setDate(d.getDate() + i);
            let dk = fmt(d);

            if (!state.habits[dk]) {
                state.habits[dk] = {};
                state.habitsList.forEach(hDef => state.habits[dk][hDef.id] = false);
            }

            let isDone = state.habits[dk][h.id];
            let isToday = i === 0;

            let dot = document.createElement('div');
            dot.style.width = '100%';
            dot.style.height = '32px';
            dot.style.borderRadius = '6px';
            dot.style.display = 'flex';
            dot.style.alignItems = 'center';
            dot.style.justifyContent = 'center';
            dot.style.cursor = 'pointer';
            dot.style.transition = 'all 0.2s';
            dot.style.fontSize = '12px';
            dot.style.fontWeight = 'bold';
            dot.style.userSelect = 'none';

            const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
            const dayLabel = dayLabels[d.getDay()];

            if (isDone) {
                dot.style.backgroundColor = isToday ? '#FF9500' : 'var(--teal)';
                dot.style.color = 'white';
                dot.innerHTML = '✓';
            } else {
                dot.style.backgroundColor = isToday ? 'rgba(255, 149, 0, 0.1)' : 'var(--paper2)';
                dot.style.border = isToday ? '1px dashed #FF9500' : '1px solid transparent';
                dot.style.color = 'var(--ink3)';
                dot.innerHTML = dayLabel;
                dot.title = isToday ? "Today" : dk;
            }

            dot.addEventListener('click', e => {
                const currentlyDone = state.habits[dk][h.id];
                state.habits[dk][h.id] = !currentlyDone;
                save();

                // Fire confetti only if we just checked it, and it was primarily fired on today
                if (!currentlyDone) {
                    const rect = dot.getBoundingClientRect();
                    fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
                }

                renderHabits();
            });

            dot.addEventListener('mouseover', () => {
                dot.style.transform = 'scale(1.05)';
            });
            dot.addEventListener('mouseout', () => {
                dot.style.transform = 'scale(1)';
            });

            dotsContainer.appendChild(dot);
        }

        habitRow.appendChild(header);
        habitRow.appendChild(dotsContainer);
        container.appendChild(habitRow);

        // Add separator except for last item
        if (h.id !== habitsDefs[habitsDefs.length - 1].id) {
            const sep = document.createElement('div');
            sep.style.borderBottom = '1px dashed var(--grid)';
            sep.style.opacity = '0.5';
            container.appendChild(sep);
        }
    });
}


function renderDailyTasks() {
    const allTasks = dayTasks(VIEWKEY).filter(t => t.list === 'daily');
    // First 3 tasks are priorities (user controls order via drag)
    const top3 = allTasks.slice(0, 3);
    const rest = allTasks.slice(3);
    renderTaskList(document.getElementById('daily-priority-list'), top3, 'daily', VIEWKEY);
    renderTaskList(document.getElementById('daily-other-list'), rest, 'daily', VIEWKEY);
}
function renderTomorrowTasks() { renderTaskList(document.getElementById('tomorrow-task-list'), dayTasks(vTomKey()).filter(t => t.list === 'daily'), 'tomorrow', vTomKey()); }
function renderWeeklyGoals() { renderTaskList(document.getElementById('weekly-goal-list'), state.weeklyGoals, 'weekly', null); }
function renderWeeklyFocus() { const el = document.getElementById('weekly-focus-text'); el.textContent = state.weeklyFocus || 'Click to set your weekly intention…'; el.style.fontStyle = state.weeklyFocus ? 'normal' : 'italic'; }

function toggleTask(id, listType) {
    if (listType === 'weekly') { const g = state.weeklyGoals.find(x => x.id === id); if (g) g.done = !g.done; save(); renderWeeklyGoals(); return; }
    if (listType === 'tomorrow') {
        const tk = vTomKey();
        const tasks = state.tasks[tk] || []; const t = tasks.find(x => x.id === id);
        if (t) { t.done = !t.done; save(); renderTomorrowTasks(); } return;
    }
    const tasks = state.tasks[VIEWKEY] || []; const t = tasks.find(x => x.id === id);
    if (t) { t.done = !t.done; save(); renderDailyTasks(); renderTimeline(); }
}

// ── HOURLY TIMELINE WITH DRAG-DROP ──
function renderTimeline() {
    const el = document.getElementById('timeline'); el.innerHTML = '';
    const tasks = dayTasks(VIEWKEY);
    const now = new Date(); const nowMins = now.getHours() * 60 + now.getMinutes();
    for (let h = 6; h <= 23; h++) {
        const row = document.createElement('div'); row.className = 'hour-row';
        const lbl = document.createElement('div'); lbl.className = 'hour-label';
        lbl.textContent = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
        const slot = document.createElement('div'); slot.className = 'hour-slot';
        const hint = document.createElement('span'); hint.className = 'hour-slot-click-hint'; hint.textContent = '+ click to add'; slot.appendChild(hint);
        const hMins = h * 60;
        if (nowMins >= hMins && nowMins < hMins + 60) {
            const line = document.createElement('div'); line.className = 'current-time-line';
            line.style.top = ((nowMins - hMins) / 60 * 100) + '%'; slot.appendChild(line);
        }
        tasks.filter(t => t.time && parseInt(t.time.split(':')[0]) === h).forEach(t => {
            const ev = document.createElement('div'); ev.className = `hour-event ${t.tag || 'personal'}`;
            ev.textContent = `${t.time} · ${t.name}`; if (t.done) ev.style.opacity = '.5';

            // Edit on double click or long press
            let pressTimer;
            const handleEdit = () => openEditTask(t.id, 'daily', VIEWKEY);

            ev.addEventListener('dblclick', e => {
                e.stopPropagation();
                handleEdit();
            });

            ev.addEventListener('touchstart', e => {
                pressTimer = setTimeout(handleEdit, 500);
            }, { passive: true });
            ev.addEventListener('touchend', () => clearTimeout(pressTimer));
            ev.addEventListener('touchmove', () => clearTimeout(pressTimer));
            ev.addEventListener('touchcancel', () => clearTimeout(pressTimer));
            slot.appendChild(ev);
        });
        // drag-and-drop onto hour slot (supports cross-date)
        slot.addEventListener('dragover', e => { if (draggedTaskId) { e.preventDefault(); slot.classList.add('drag-over'); } });
        slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
        slot.addEventListener('drop', e => {
            e.preventDefault(); slot.classList.remove('drag-over');
            if (!draggedTaskId) return;
            // Find task in source
            const srcKey = dragSource ? dragSource.dateKey : VIEWKEY;
            const srcTasks = state.tasks[srcKey] || [];
            const srcIdx = srcTasks.findIndex(x => x.id === draggedTaskId);
            if (srcIdx === -1) return;
            if (srcKey !== VIEWKEY) {
                // Move cross-date into current view
                const [task] = srcTasks.splice(srcIdx, 1);
                task.time = String(h).padStart(2, '0') + ':00';
                if (!state.tasks[VIEWKEY]) state.tasks[VIEWKEY] = [];
                state.tasks[VIEWKEY].push(task);
            } else {
                const t = srcTasks.find(x => x.id === draggedTaskId);
                if (t) t.time = String(h).padStart(2, '0') + ':00';
            }
            draggedTaskId = null; dragSource = null;
            save(); renderDailyTasks(); renderTomorrowTasks(); renderTimeline();
        });
        slot.addEventListener('click', e => { if (!e.target.closest('.hour-event')) openAddTaskAtHour(h); });
        row.appendChild(lbl); row.appendChild(slot); el.appendChild(row);
    }
    el.scrollTop = Math.max(0, now.getHours() - 6) * 46;
}

// ── WEEKLY LEARNINGS VIEW ──
function renderWeeklyView() {
    const grid = document.getElementById('weekly-grid'); grid.innerHTML = '';
    const base = new Date(TODAY); base.setDate(base.getDate() + weekOffset * 7);
    const dow = base.getDay(); const sunday = new Date(base); sunday.setDate(base.getDate() - dow);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const wEnd = new Date(sunday); wEnd.setDate(sunday.getDate() + 6);
    document.getElementById('weekly-title').textContent = `${m[sunday.getMonth()]} ${sunday.getDate()} – ${m[wEnd.getMonth()]} ${wEnd.getDate()}, ${wEnd.getFullYear()}`;

    const stickersContainer = document.getElementById('weekly-habit-stickers');
    if (stickersContainer) {
        stickersContainer.innerHTML = '';
        state.habitsList.forEach((h, idx) => {
            const s = getHabitStreak(h.id);
            if (s > 0) {
                const stickerBadge = document.createElement('div');
                stickerBadge.className = 'habit-sticker-badge';
                const rotation = (idx % 3 === 0 ? -4 : idx % 2 === 0 ? 3 : -2) + (Math.random() * 2 - 1);
                stickerBadge.style.transform = `rotate(${rotation}deg)`;
                
                const img = document.createElement('img');
                img.src = h.sticker || STICKER_OPTIONS[0];
                
                const countBadge = document.createElement('div');
                countBadge.className = 'habit-sticker-count';
                countBadge.textContent = s;
                
                stickerBadge.title = `${h.name}: ${s} day streak`;
                
                stickerBadge.appendChild(img);
                stickerBadge.appendChild(countBadge);
                stickersContainer.appendChild(stickerBadge);
            }
        });
    }

    for (let i = 0; i < 8; i++) {
        const isDay = i < 7;
        let key, d, dayName, dayNum, isToday = false;

        if (isDay) {
            d = new Date(sunday); d.setDate(sunday.getDate() + i);
            key = fmt(d); isToday = key === TODAYKEY;
            dayName = days[d.getDay()];
            dayNum = d.getDate();
        }

        const col = document.createElement('div'); col.className = 'week-day-col' + (isToday ? ' today-col' : '');
        if (!isDay) col.style.background = 'var(--paper2)';

        const hdr = document.createElement('div'); hdr.className = 'week-day-header';
        if (isDay) {
            hdr.innerHTML = `<div class="week-day-name">${dayName}</div><div class="week-day-num">${dayNum}</div>`;
        } else {
            hdr.innerHTML = `<div class="week-day-name">Summary</div><div class="week-day-num">✨</div>`;
        }

        // task chips or focus area
        const wt = document.createElement('div'); wt.className = 'week-tasks-mini';
        if (isDay) {
            const dtasks = dayTasks(key).filter(t => t.list === 'daily').slice(0, 3);
            dtasks.forEach(t => {
                const chip = document.createElement('div'); chip.className = 'week-task-chip';
                chip.textContent = (t.done ? '✓ ' : '') + t.name;
                chip.style.opacity = t.done ? '.5' : '1'; chip.style.textDecoration = t.done ? 'line-through' : 'none';
                wt.appendChild(chip);
            });
            if (!dtasks.length) {
                const e = document.createElement('div');
                e.style.cssText = 'font-size:.62rem;color:var(--ink3);text-align:center;padding:4px 0;font-style:italic';
                e.textContent = 'No tasks'; wt.appendChild(e);
            }
        } else {
            wt.style.height = 'auto';
            wt.style.display = 'block';
            wt.style.padding = '10px 0';
            wt.style.textAlign = 'center';
            
            const genBtn = document.createElement('button');
            genBtn.className = 'week-gen-btn';
            genBtn.textContent = 'Auto-Summarize';
            genBtn.onclick = () => {
                const sundayKey = fmt(sunday);
                let summary = '';
                for (let j = 0; j < 7; j++) {
                    let dj = new Date(sunday); dj.setDate(sunday.getDate() + j);
                    let kj = fmt(dj);
                    if (state.dayNotes[kj]) {
                        summary += `• ${state.dayNotes[kj]}\n`;
                    }
                }
                state.weeklyNotes[sundayKey] = summary.trim();
                save();
                renderWeeklyView();
            };
            wt.appendChild(genBtn);
        }

        // notes/learnings area
        const notesArea = document.createElement('div'); notesArea.className = 'week-day-notes-area';
        const lbl = document.createElement('div'); lbl.className = 'week-notes-label'; lbl.textContent = isDay ? 'Learnings' : 'Weekly Summary';
        const ta = document.createElement('textarea'); ta.className = 'week-notes-ta';
        ta.placeholder = isDay ? 'What did you learn today? type "- " for bullet' : 'Click "Auto-Summarize" to aggregate your week...';

        const sundayKey = fmt(sunday);
        ta.value = (isDay ? (state.dayNotes[key] || '') : (state.weeklyNotes[sundayKey] || ''));

        ta.addEventListener('input', () => {
            let val = ta.value;
            // Bullet Point Shortcut: "- " + space
            if (val.endsWith('- ')) {
                ta.value = val.slice(0, -2) + '• ';
            }
            if (isDay) {
                state.dayNotes[key] = ta.value;
            } else {
                state.weeklyNotes[sundayKey] = ta.value;
            }
            save();
        });

        notesArea.appendChild(lbl); notesArea.appendChild(ta);
        col.appendChild(hdr); col.appendChild(wt); col.appendChild(notesArea);
        grid.appendChild(col);
    }
}
function changeWeek(dir) { weekOffset += dir; renderWeeklyView(); }

// ── AUTO-ARCHIVE: moves yesterday's data to journal at start of new day ──
function checkAndArchive() {
    const now = new Date();
    const todayStr = fmt(now);
    const lastRun = localStorage.getItem('techo_last_archive_date') || '';
    if (lastRun && lastRun < todayStr) {
        // archive yesterday
        const yDate = new Date(now); yDate.setDate(now.getDate() - 1);
        const yKey = fmt(yDate);
        if (state.tasks[yKey] && state.tasks[yKey].length > 0) {
            if (!state.archive) state.archive = {};
            state.archive[yKey] = { tasks: state.tasks[yKey], notes: state.dayNotes[yKey] || '' };
            save();
        }
    }
    localStorage.setItem('techo_last_archive_date', todayStr);
}

// ── JOURNAL VIEW ──
function renderJournalView() {
    const el = document.getElementById('journal-list'); el.innerHTML = '';
    // collect all past task keys + archive keys
    const taskKeys = Object.keys(state.tasks).filter(k => k < TODAYKEY);
    const archiveKeys = Object.keys(state.archive || {});
    const allKeys = [...new Set([...taskKeys, ...archiveKeys])].sort().reverse();
    if (!allKeys.length) { el.innerHTML = '<p class="journal-empty">No past entries yet.<br><span style="color:var(--ink3)">Your completed days will appear here. 🌸</span></p>'; return; }
    allKeys.slice(0, 60).forEach(k => {
        const tasks = (state.tasks[k] || (state.archive && state.archive[k] && state.archive[k].tasks) || []).filter(t => t.list === 'daily');
        const notes = state.dayNotes[k] || (state.archive && state.archive[k] && state.archive[k].notes) || '';
        if (!tasks.length && !notes) return;
        const entry = document.createElement('div'); entry.className = 'journal-entry';
        const d = new Date(k + 'T12:00:00');
        const days2 = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const m2 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        entry.innerHTML = `<div class="journal-date">${days2[d.getDay()]}, ${m2[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}</div>`;
        tasks.forEach(t => {
            const jt = document.createElement('div'); jt.className = 'journal-task';
            jt.textContent = (t.done ? '✓  ' : ' ○  ') + t.name + (t.time ? ' · ' + t.time : '');
            entry.appendChild(jt);
        });
        if (notes) {
            const jn = document.createElement('div'); jn.className = 'journal-notes';
            jn.textContent = '📝 ' + notes; entry.appendChild(jn);
        }
        el.appendChild(entry);
    });
}

function renderMiniCal() {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth() + calOffset, 1);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Render large header based on viewDate
    const dateToDisplay = calOffset === 0 ? viewDate : d;
    document.getElementById('cal-big-date').textContent = dateToDisplay.getDate();
    document.getElementById('cal-month-label').textContent = months[d.getMonth()];

    const grid = document.getElementById('cal-grid'); grid.innerHTML = '';

    // Get day of week, adjusting so Monday is 0 instead of Sunday being 0
    let firstDow = d.getDay() - 1;
    if (firstDow === -1) firstDow = 6; // Sunday becomes 6

    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const prevDays = new Date(d.getFullYear(), d.getMonth(), 0).getDate();

    for (let i = 0; i < firstDow; i++) {
        const c = document.createElement('div');
        c.className = 'cal-cell other-month';
        c.textContent = prevDays - firstDow + 1 + i;
        grid.appendChild(c);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(d.getFullYear(), d.getMonth(), i); const key = fmt(date);
        const c = document.createElement('div');
        c.className = 'cal-cell' + (key === VIEWKEY ? ' today' : '') + ((state.tasks[key] || []).length && key !== VIEWKEY ? ' has-events' : '');
        c.textContent = i;
        c.onclick = () => { viewDate = new Date(date); VIEWKEY = key; refreshDailyView(); switchView('today'); };
        grid.appendChild(c);
    }

    const remain = 42 - firstDow - daysInMonth;
    for (let i = 1; i <= remain; i++) {
        const c = document.createElement('div');
        c.className = 'cal-cell other-month';
        c.textContent = i;
        grid.appendChild(c);
    }
}
function changeCalMonth(dir) { calOffset += dir; renderMiniCal(); }

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); editingTaskId = null; }

function openAddTask(list) {
    editingTaskId = null; editingTaskList = list;
    editingTaskDateKey = list === 'tomorrow' ? vTomKey() : (list === 'daily' ? VIEWKEY : TODAYKEY);
    const heading = list === 'weekly' ? 'Add Goal' : list === 'tomorrow' ? "Add Tomorrow's Task" : 'Add Task';
    document.getElementById('modal-task-heading').textContent = heading;
    document.getElementById('task-name-input').value = '';
    document.getElementById('task-time-input').value = '';
    document.getElementById('task-tag-input').value = 'work';
    document.getElementById('task-priority-input').value = 'normal';
    document.getElementById('delete-task-row').style.display = 'none';
    openModal('task-modal'); setTimeout(() => document.getElementById('task-name-input').focus(), 120);
}
function openAddTaskAtHour(h) {
    openAddTask('daily');
    document.getElementById('task-time-input').value = String(h).padStart(2, '0') + ':00';
}
function openEditTask(id, listType, dateKey) {
    editingTaskId = id; editingTaskList = listType;
    editingTaskDateKey = dateKey || (listType === 'tomorrow' ? vTomKey() : (listType === 'daily' ? VIEWKEY : TODAYKEY));
    let t = listType === 'weekly' ? state.weeklyGoals.find(x => x.id === id) : (state.tasks[editingTaskDateKey] || []).find(x => x.id === id);
    if (!t) return;
    document.getElementById('modal-task-heading').textContent = 'Edit ' + (listType === 'weekly' ? 'Goal' : 'Task');
    document.getElementById('task-name-input').value = t.name;
    document.getElementById('task-time-input').value = t.time || '';
    document.getElementById('task-tag-input').value = t.tag || 'work';
    document.getElementById('task-priority-input').value = t.priority || 'normal';
    document.getElementById('delete-task-row').style.display = 'block';
    openModal('task-modal'); setTimeout(() => document.getElementById('task-name-input').focus(), 120);
}
function saveTask() {
    const name = document.getElementById('task-name-input').value.trim(); if (!name) return;
    const time = document.getElementById('task-time-input').value;
    const tag = document.getElementById('task-tag-input').value;
    const priority = document.getElementById('task-priority-input').value;
    if (editingTaskList === 'weekly') {
        if (editingTaskId) { const g = state.weeklyGoals.find(x => x.id === editingTaskId); if (g) { g.name = name; g.tag = tag; g.priority = priority; } }
        else state.weeklyGoals.push({ id: uid(), name, tag, priority, done: false });
        save(); renderWeeklyGoals();
    } else {
        if (!state.tasks[editingTaskDateKey]) state.tasks[editingTaskDateKey] = [];
        if (editingTaskId) {
            const t = state.tasks[editingTaskDateKey].find(x => x.id === editingTaskId);
            if (t) { t.name = name; t.time = time; t.tag = tag; t.priority = priority; }
        } else {
            state.tasks[editingTaskDateKey].push({ id: uid(), name, time, tag, priority, done: false, list: 'daily' });
        }
        save(); renderDailyTasks(); renderTomorrowTasks(); renderTimeline(); renderMiniCal();
    }
    closeModal('task-modal');
}
function deleteCurrentTask() {
    if (!editingTaskId) return;
    if (editingTaskList === 'weekly') { state.weeklyGoals = state.weeklyGoals.filter(x => x.id !== editingTaskId); save(); renderWeeklyGoals(); }
    else {
        if (state.tasks[editingTaskDateKey]) state.tasks[editingTaskDateKey] = state.tasks[editingTaskDateKey].filter(x => x.id !== editingTaskId);
        save(); renderDailyTasks(); renderTomorrowTasks(); renderTimeline();
    }
    closeModal('task-modal');
}

let editingHabitId = null;
let selectedSticker = STICKER_OPTIONS[0];

function renderStickerGrid() {
    const grid = document.getElementById('habit-sticker-grid');
    grid.innerHTML = '';
    STICKER_OPTIONS.forEach(s => {
        const div = document.createElement('div');
        div.className = `sticker-option ${selectedSticker === s ? 'selected' : ''}`;
        div.onclick = () => {
            selectedSticker = s;
            renderStickerGrid();
        };
        const img = document.createElement('img');
        img.src = s;
        img.alt = 'sticker';
        div.appendChild(img);
        grid.appendChild(div);
    });
}

function openAddHabit() {
    editingHabitId = null;
    selectedSticker = STICKER_OPTIONS[0];
    document.getElementById('habit-name-input').value = '';
    document.getElementById('delete-habit-row').style.display = 'none';
    renderStickerGrid();
    openModal('habit-modal');
    setTimeout(() => document.getElementById('habit-name-input').focus(), 120);
}
function openEditHabit(id) {
    editingHabitId = id;
    const h = state.habitsList.find(x => x.id === id);
    if (!h) return;
    selectedSticker = h.sticker || STICKER_OPTIONS[0];
    document.getElementById('habit-name-input').value = h.name;
    document.getElementById('delete-habit-row').style.display = 'block';
    renderStickerGrid();
    openModal('habit-modal');
    setTimeout(() => document.getElementById('habit-name-input').focus(), 120);
}
function saveHabit() {
    const name = document.getElementById('habit-name-input').value.trim();
    if (!name) return;
    if (editingHabitId) {
        const h = state.habitsList.find(x => x.id === editingHabitId);
        if (h) {
            h.name = name;
            h.sticker = selectedSticker;
        }
    } else {
        const id = uid();
        state.habitsList.push({ id, name, sticker: selectedSticker });
    }
    save(); renderHabits(); renderWeeklyView(); closeModal('habit-modal');
}
function deleteHabit() {
    if (!editingHabitId) return;
    state.habitsList = state.habitsList.filter(x => x.id !== editingHabitId);
    save(); renderHabits(); renderWeeklyView(); closeModal('habit-modal');
}
function editWeeklyFocus() { document.getElementById('focus-input').value = state.weeklyFocus || ''; openModal('focus-modal'); setTimeout(() => document.getElementById('focus-input').focus(), 120); }
function saveWeeklyFocus() { state.weeklyFocus = document.getElementById('focus-input').value.trim(); save(); renderWeeklyFocus(); closeModal('focus-modal'); }
function saveLogin() { const name = document.getElementById('login-name').value.trim(); if (!name) return; state.userName = name; save(); document.getElementById('login-label').textContent = name; closeModal('login-modal'); }

function switchView(v) {
    document.querySelectorAll('.view').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('view-' + v).classList.add('active');
    document.getElementById('nav-' + v).classList.add('active');

    if (v === 'today') document.body.classList.add('no-grid');
    else document.body.classList.remove('no-grid');

    if (v === 'weekly') renderWeeklyView();
    if (v === 'journal') renderJournalView();
    if (v === 'consume') renderConsumeView();
}

// ── CONSUME TAB LOGIC ──
let isLibraryOpen = false;
function toggleLibrary() {
    isLibraryOpen = !isLibraryOpen;
    document.getElementById('consume-library-panel').classList.toggle('open', isLibraryOpen);
    if (isLibraryOpen) renderLibrary();
}

function renderConsumeView() {
    const canvas = document.getElementById('consume-canvas');
    const inner = document.getElementById('consume-canvas-inner');
    const hint = inner.querySelector('.consume-empty-hint');

    canvas.style.backgroundPosition = `${state.consumePan.x}px ${state.consumePan.y}px`;
    canvas.style.backgroundSize = `${22 * state.consumeZoom}px ${22 * state.consumeZoom}px`;
    inner.style.transform = `translate(${state.consumePan.x}px, ${state.consumePan.y}px) scale(${state.consumeZoom})`;

    // Clear existing but keep hint
    inner.querySelectorAll('.link-card').forEach(c => c.remove());

    if (state.consumeItems.length > 0) {
        hint.style.display = 'none';
        state.consumeItems.forEach(item => {
            const card = createLinkCard(item);
            inner.appendChild(card);
        });
    } else {
        hint.style.display = 'block';
    }
    document.getElementById('lib-count').textContent = state.consumeLibrary.length;
}

function renderLibrary() {
    const list = document.getElementById('consume-library-list');
    list.innerHTML = '';

    if (state.consumeLibrary.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding: 40px 20px; color: var(--ink3); font-style: italic;">Library is empty. Mark items as "Done" to see them here.</div>';
        return;
    }

    const notebookColors = [
        '#f8f4e8', // Default parchment
        '#e8f4f8', // Pale water
        '#f8e8f4', // Pale blossom
        '#e8f8ed', // Pale bamboo
        '#f4f8e8', // Pale leaf
        '#f1f1f1'  // Pale ash
    ];

    // Group into shelves of 4
    const shelfSize = 4;
    for (let i = 0; i < state.consumeLibrary.length; i += shelfSize) {
        const shelfItems = state.consumeLibrary.slice(i, i + shelfSize);
        const shelfDiv = document.createElement('div');
        shelfDiv.className = 'lib-shelf';

        shelfItems.forEach(item => {
            const book = document.createElement('div');
            book.className = 'lib-book';
            book.onclick = () => window.open(item.url, '_blank');

            // Stable color based on item ID
            const colorIdx = Math.abs(parseInt(item.id.slice(-4), 36) || 0) % notebookColors.length;
            const bgColor = notebookColors[colorIdx];

            book.innerHTML = `
                <div class="lib-book-cover">
                    <div class="lib-book-spine"></div>
                    <div class="notebook-design" style="background-color: ${bgColor}">
                        <div class="notebook-washi"></div>
                        <div class="notebook-label">${item.title}</div>
                    </div>
                </div>
                <button class="lib-book-remove" title="Remove from Library">✕</button>
                <div class="lib-book-info-popover">${item.domain || 'Link'}</div>
            `;

            book.querySelector('.lib-book-remove').onclick = (e) => {
                e.stopPropagation();
                removeFromLibrary(item.id);
            };

            shelfDiv.appendChild(book);
        });

        list.appendChild(shelfDiv);
    }
}

function removeFromLibrary(id) {
    state.consumeLibrary = state.consumeLibrary.filter(i => i.id !== id);
    save();
    renderLibrary();
    document.getElementById('lib-count').textContent = state.consumeLibrary.length;
}

async function handlePaste(e) {
    const activeView = document.querySelector('.view.active')?.id;
    if (activeView !== 'view-consume') return;

    const text = e.clipboardData.getData('text');
    if (!text || !text.startsWith('http')) return;

    e.preventDefault();
    const hint = document.querySelector('.consume-empty-hint');
    
    // Create immediate loading state
    const loadingId = uid();
    const loadingItem = {
        id: loadingId,
        url: text,
        loading: true,
        x: 100 - (state.consumePan?.x || 0) + Math.random() * 200,
        y: 100 - (state.consumePan?.y || 0) + Math.random() * 200,
        type: 'generic', title: 'Loading...', desc: 'Fetching metadata...', image: '', icon: '',
        domain: ''
    };
    try { loadingItem.domain = new URL(text).hostname.replace('www.', ''); } catch(e){}

    state.consumeItems.push(loadingItem);
    renderConsumeView();

    try {
        const data = await parseLink(text);
        // Replace loading item
        const idx = state.consumeItems.findIndex(i => i.id === loadingId);
        if (idx > -1) {
            state.consumeItems[idx] = { ...data, x: loadingItem.x, y: loadingItem.y };
        }
        save();
        renderConsumeView();
    } catch (err) {
        // Remove on error
        state.consumeItems = state.consumeItems.filter(i => i.id !== loadingId);
        renderConsumeView();
    }
}

async function parseLink(url) {
    let domain = '';
    try { domain = new URL(url).hostname.replace('www.', ''); } catch (e) { }

    let type = 'generic';
    if (url.includes('youtube.com') || url.includes('youtu.be')) type = 'youtube';
    else if (url.includes('twitter.com') || url.includes('x.com')) type = 'twitter';
    else if (url.includes('linkedin.com')) type = 'linkedin';

    let title = domain || 'Link';
    let desc = url;
    let image = `https://picsum.photos/seed/${Math.random()}/600/400`; // Fallback
    let icon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    try {
        const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
        if (res.ok) {
            const json = await res.json();
            if (json.status === 'success' && json.data) {
                if (json.data.title) title = json.data.title;
                if (json.data.description) desc = json.data.description;
                if (json.data.image && json.data.image.url) image = json.data.image.url;
                else if (json.data.logo && json.data.logo.url) image = json.data.logo.url;
                if (json.data.logo && json.data.logo.url) icon = json.data.logo.url;
            }
        }
    } catch (err) {
        console.error('Failed to fetch metadata:', err);
    }

    return {
        id: uid(),
        url, domain, type, title, desc, image, icon,
        x: 100 - (state.consumePan?.x || 0) + Math.random() * 200,
        y: 100 - (state.consumePan?.y || 0) + Math.random() * 200
    };
}

function createLinkCard(item) {
    const card = document.createElement('div');
    const isSelected = selectedConsumeIds.includes(item.id);
    card.className = `link-card link-card-${item.type}${isSelected ? ' selected' : ''}${item.loading ? ' loading' : ''}`;
    card.style.left = item.x + 'px';
    card.style.top = item.y + 'px';
    card.id = `card-${item.id}`;

    let innerHTML = `
        <div class="selection-circle" onclick="toggleConsumeSelection(event, '${item.id}')">✓</div>
        <div class="link-card-inner">
            <div class="link-preview-wrap">
                ${!item.loading ? `<img src="${item.image}" class="link-preview-img">` : ''}
                ${item.type === 'youtube' && !item.loading ? '<div class="youtube-play">▶</div>' : ''}
            </div>
            <div class="link-content">
                ${item.type === 'twitter' && !item.loading ? '<div class="twitter-logo">𝕏</div>' : ''}
                <h4 class="link-title">${item.title}</h4>
                <p class="link-desc">${item.desc}</p>
                <div class="link-meta">
                    ${!item.loading ? `<img src="${item.icon}" class="link-favicon">` : ''}
                    <span>${item.domain}</span>
                </div>
            </div>
        </div>
        ${!item.loading ? `
        <div class="link-actions">
            <button class="action-btn done-btn" onclick="moveItemToLibrary('${item.id}')" title="Mark as Done">✓</button>
            <button class="action-btn" onclick="window.open('${item.url}', '_blank')" title="Open Link">↗</button>
            <button class="action-btn" onclick="removeConsumeItem('${item.id}')" title="Remove">✕</button>
        </div>` : ''}
    `;
    card.innerHTML = innerHTML;
    setupDraggable(card, item.id);
    return card;
}

function toggleConsumeSelection(e, id) {
    if (e) e.stopPropagation();
    const card = document.getElementById(`card-${id}`);
    if (selectedConsumeIds.includes(id)) {
        selectedConsumeIds = selectedConsumeIds.filter(i => i !== id);
        if (card) card.classList.remove('selected');
    } else {
        selectedConsumeIds.push(id);
        if (card) card.classList.add('selected');
    }
    updateConsumeToolbar();
}

function toggleSelectionMode() {
    isSelectionMode = !isSelectionMode;
    const container = document.getElementById('view-consume');
    const btn = document.getElementById('toggle-select-btn');

    if (isSelectionMode) {
        container.classList.add('selection-mode-active');
        btn.classList.add('active');
        btn.querySelector('span').textContent = 'Cancel Selection';
    } else {
        container.classList.remove('selection-mode-active');
        btn.classList.remove('active');
        btn.querySelector('span').textContent = 'Multi-select';
        clearConsumeSelection();
    }
}

function updateConsumeToolbar() {
    const bar = document.getElementById('consume-toolbar');
    const countLabel = bar.querySelector('.toolbar-count');
    const count = selectedConsumeIds.length;

    if (count > 0) {
        bar.classList.add('active');
        countLabel.textContent = `${count} Selected`;
    } else {
        bar.classList.remove('active');
    }
}

function clearConsumeSelection() {
    selectedConsumeIds = [];
    document.querySelectorAll('.link-card.selected').forEach(c => c.classList.remove('selected'));
    updateConsumeToolbar();
}

function copyForNotebookLM() {
    const selectedItems = state.consumeItems.filter(i => selectedConsumeIds.includes(i.id));
    const urls = selectedItems.map(i => i.url).join('\n');
    navigator.clipboard.writeText(urls).then(() => {
        const btn = document.querySelector('.toolbar-btn.primary');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span>✅</span> Copied!';
        setTimeout(() => btn.innerHTML = originalText, 2000);
    });
}

function bulkMoveToLibrary() {
    // We need to move them one by one or in bulk
    const idsToMove = [...selectedConsumeIds];
    idsToMove.forEach(id => {
        const index = state.consumeItems.findIndex(i => i.id === id);
        if (index > -1) {
            const item = state.consumeItems.splice(index, 1)[0];
            state.consumeLibrary.push(item);
        }
    });
    clearConsumeSelection();
    save();
    renderConsumeView();
    if (isLibraryOpen) renderLibrary();
}

function bulkRemoveConsumeItems() {
    if (!confirm(`Are you sure you want to remove ${selectedConsumeIds.length} items?`)) return;
    const idsToRemove = new Set(selectedConsumeIds);
    state.consumeItems = state.consumeItems.filter(i => !idsToRemove.has(i.id));
    clearConsumeSelection();
    save();
    renderConsumeView();
}

function setupDraggable(el, id) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    el.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if (isSelectionMode) {
            toggleConsumeSelection(e, id);
            return;
        }
        if (e.target.closest('.link-actions')) return;
        if (e.target.closest('.selection-circle')) return;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        el.style.transition = 'none';
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        const newX = el.offsetLeft - pos1;
        const newY = el.offsetTop - pos2;
        el.style.top = newY + "px";
        el.style.left = newX + "px";

        // Update state
        const item = state.consumeItems.find(i => i.id === id);
        if (item) {
            item.x = newX;
            item.y = newY;
        }
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        el.style.transition = '';
        save();
    }
}

function addConsumeItem(data) {
    state.consumeItems.push(data);
    save();
    renderConsumeView();
}

function removeConsumeItem(id) {
    state.consumeItems = state.consumeItems.filter(i => i.id !== id);
    save();
    renderConsumeView();
}


function moveItemToLibrary(id) {
    const index = state.consumeItems.findIndex(i => i.id === id);
    if (index > -1) {
        const item = state.consumeItems.splice(index, 1)[0];
        state.consumeLibrary.push(item);
        save();
        renderConsumeView();
        if (isLibraryOpen) renderLibrary();
    }
}

// Canvas Panning Logic
let isConsumePanning = false;
document.addEventListener('mousedown', e => {
    const activeView = document.querySelector('.view.active')?.id;
    if (activeView !== 'view-consume') return;
    const canvas = document.getElementById('consume-canvas');
    if (e.target === canvas || e.target === document.getElementById('consume-canvas-inner') || e.target.classList.contains('consume-empty-hint') || e.target.closest('.consume-empty-hint')) {
        isConsumePanning = true;
    }
});
document.addEventListener('mousemove', e => {
    if (!isConsumePanning) return;
    state.consumePan.x += e.movementX;
    state.consumePan.y += e.movementY;
    renderConsumeView();
});
document.addEventListener('mouseup', () => {
    if (isConsumePanning) {
        isConsumePanning = false;
        save();
    }
});
document.getElementById('consume-canvas')?.addEventListener('wheel', e => {
    const activeView = document.querySelector('.view.active')?.id;
    if (activeView !== 'view-consume') return;
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
        // Zoom
        const zoomFactor = -e.deltaY * 0.01;
        let newZoom = (state.consumeZoom || 1) * Math.exp(zoomFactor);
        newZoom = Math.min(Math.max(newZoom, 0.1), 5); // clamp 10% to 500%

        const canvas = document.getElementById('consume-canvas');
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        state.consumePan.x = mouseX - (mouseX - state.consumePan.x) * (newZoom / state.consumeZoom);
        state.consumePan.y = mouseY - (mouseY - state.consumePan.y) * (newZoom / state.consumeZoom);
        state.consumeZoom = newZoom;
    } else {
        // Pan
        state.consumePan.x -= e.deltaX;
        state.consumePan.y -= e.deltaY;
    }

    renderConsumeView();
    save(); // To avoid lag, we could debounce save, but for native apps this is fast enough.
}, { passive: false });

document.addEventListener('paste', handlePaste);
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openAddTask('daily'); }
});

// INIT
function init() {
    checkAndArchive();
    tickTime(); refreshDailyView();
    if (state.userName) document.getElementById('login-label').textContent = state.userName;
    // Seed demo data
    if (!state.tasks[TODAYKEY] || !state.tasks[TODAYKEY].length) {
        state.tasks[TODAYKEY] = [
            { id: uid(), name: 'Morning journaling', time: '07:00', tag: 'personal', priority: 'normal', done: false, list: 'daily' },
            { id: uid(), name: 'Deep work — key project', time: '09:00', tag: 'work', priority: 'high', done: false, list: 'daily' },
            { id: uid(), name: 'Evening walk', time: '18:30', tag: 'health', priority: 'normal', done: false, list: 'daily' },
        ]; save(); refreshDailyView();
    }
    // check archive every minute
    // Cleanup stuck loading items from previous sessions
    state.consumeItems = state.consumeItems.filter(i => !i.loading);

    setInterval(checkAndArchive, 60000);
}
init();
