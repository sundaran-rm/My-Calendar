
    // ══════════════════════════════════════════
    // CONSTANTS & STATE
    // ══════════════════════════════════════════
    const COLORS = [
      { name: 'violet', hex: '#7c6af7' }, { name: 'pink', hex: '#f472b6' }, { name: 'red', hex: '#f87171' },
      { name: 'orange', hex: '#fb923c' }, { name: 'yellow', hex: '#fbbf24' }, { name: 'green', hex: '#4ade80' },
      { name: 'teal', hex: '#2dd4bf' }, { name: 'blue', hex: '#60a5fa' }, { name: 'indigo', hex: '#818cf8' }
    ];
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const RECUR_UNITS = { daily: 'day(s)', weekly: 'week(s)', monthly: 'month(s)', yearly: 'year(s)' };
    const TZ_LIST = [
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage',
      'America/Honolulu', 'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'America/Argentina/Buenos_Aires',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid', 'Europe/Amsterdam',
      'Europe/Moscow', 'Africa/Cairo', 'Africa/Johannesburg', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Dhaka',
      'Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Seoul', 'Australia/Sydney',
      'Australia/Melbourne', 'Pacific/Auckland', 'Pacific/Honolulu'
    ];

    let view = 'month', today = new Date();
    let cursor = new Date(today.getFullYear(), today.getMonth(), 1);
    let miniCursor = new Date(today.getFullYear(), today.getMonth(), 1);
    let events = [], labels = [], calendars = [], habits = [];
    let editingId = null, popupEventId = null, popupEventDate = null;
    let delTargetId = null, delTargetDate = null, copySourceId = null;
    let editingLabelId = null, editingCalId = null, editingHabitId = null;
    let selectedLabelColor = COLORS[1].hex, selectedCalColor = COLORS[0].hex, selectedHabitColor = COLORS[2].hex;
    let sidebarVisible = true, miniCalVisible = true, upcomingVisible = true;
    let labelsVisible = true, calendarsVisible = true, habitsVisible = true;
    let currentTheme = 'dark', currentTz = '', notifPermission = 'default';
    let importedEventsBuffer = [], importMode = 'merge', importType = 'json';
    let reminderTimers = {};
    // Workspace state
    let wsTab = 'journal', wsPanelOpen = false, wsDateCtx = null, selectedDay = null;
    // Persist wsDateCtx across page refreshes
    function saveWsCtx() { try { if (wsDateCtx) sessionStorage.setItem('calioWsCtx', wsDateCtx); else sessionStorage.removeItem('calioWsCtx'); } catch { } }
    function loadWsCtx() { try { return sessionStorage.getItem('calioWsCtx') || null; } catch { return null; } }
    let journalEntries = [], notes = [], todoLists = [];
    let editingNoteId = null, editingTodoListId = null, editingJournalId = null;
    let selectedNoteColor = null, selectedTlColor = null;
    let noteAutoSaveTimer = null;
    // Drag state
    let dragEventId = null, dragStartDate = null, dragCurrentDate = null;
    let isDragging = false, dragGhostEl = null;
    // Touch state
    let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
    let longPressTimer = null, touchDate = null;

    // ══════════════════════════════════════════
    // STORAGE
    // ══════════════════════════════════════════
    function loadAll() {
      try { events = JSON.parse(localStorage.getItem('calioEvents') || '[]'); } catch { events = []; }
      try { labels = JSON.parse(localStorage.getItem('calioLabels') || '[]'); } catch { labels = []; }
      try { calendars = JSON.parse(localStorage.getItem('calioCalendars') || '[]'); } catch { calendars = []; }
      try { habits = JSON.parse(localStorage.getItem('calioHabits') || '[]'); } catch { habits = []; }
      try { journalEntries = JSON.parse(localStorage.getItem('calioJournal') || '[]'); } catch { journalEntries = []; }
      try { notes = JSON.parse(localStorage.getItem('calioNotes') || '[]'); } catch { notes = []; }
      try { todoLists = JSON.parse(localStorage.getItem('calioTodoLists') || '[]'); } catch { todoLists = []; }
      // Ensure default "Personal" calendar exists
      if (!calendars.length) calendars = [{ id: 'default', name: 'Personal', color: COLORS[0].hex, visible: true }];
      loadPrefs();
    }
    function saveEvents() { localStorage.setItem('calioEvents', JSON.stringify(events)); }
    function saveLabels() { localStorage.setItem('calioLabels', JSON.stringify(labels)); }
    function saveCalendars() { localStorage.setItem('calioCalendars', JSON.stringify(calendars)); }
    function saveHabits() { localStorage.setItem('calioHabits', JSON.stringify(habits)); }
    function saveJournal() { localStorage.setItem('calioJournal', JSON.stringify(journalEntries)); }
    function saveNotes() { localStorage.setItem('calioNotes', JSON.stringify(notes)); }
    function saveTodoLists() { localStorage.setItem('calioTodoLists', JSON.stringify(todoLists)); }
    function loadPrefs() {
      const p = JSON.parse(localStorage.getItem('calioPrefs') || '{}');
      sidebarVisible = true; // always show sidebar on load
      miniCalVisible = p.miniCalVisible !== false;
      upcomingVisible = p.upcomingVisible !== false;
      labelsVisible = p.labelsVisible !== false;
      calendarsVisible = p.calendarsVisible !== false;
      habitsVisible = p.habitsVisible !== false;
      currentTheme = p.theme || 'dark';
      currentTz = p.tz || '';
      applyPrefs();
      applyTheme();
      populateTzSelect();
    }
    function savePrefs() {
      localStorage.setItem('calioPrefs', JSON.stringify({
        sidebarVisible, miniCalVisible, upcomingVisible, labelsVisible,
        calendarsVisible, habitsVisible, theme: currentTheme, tz: currentTz
      }));
    }
    function applyPrefs() {
      document.getElementById('sidebar').classList.toggle('collapsed', !sidebarVisible);
      document.getElementById('sidebar-toggle-btn').classList.toggle('active', sidebarVisible);
      const show = (id, vis) => { document.getElementById(id + '').style.display = vis ? '' : 'none'; };
      show('mini-cal-section', miniCalVisible); show('mini-show-row', !miniCalVisible);
      show('upcoming-section', upcomingVisible); show('upcoming-show-row', !upcomingVisible);
      show('labels-section', labelsVisible); show('labels-show-row', !labelsVisible);
      show('calendars-section', calendarsVisible); show('calendars-show-row', !calendarsVisible);
      show('habits-section', habitsVisible); show('habits-show-row', !habitsVisible);
    }
    function applyTheme() {
      document.documentElement.setAttribute('data-theme', currentTheme);
      const tog = document.getElementById('theme-toggle');
      if (tog) tog.checked = (currentTheme === 'light');
    }

    function uuid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

    // ══════════════════════════════════════════
    // DATE UTILITIES
    // ══════════════════════════════════════════
    function fmtDate(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    function parseDate(s) { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
    function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
    function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
    function getWeekStart(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()); }
    function getISOWeek(d) {
      const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    }
    function fmt12hr(t) {
      if (!t) return '';
      const [h, m] = t.split(':').map(Number);
      const ampm = h >= 12 ? 'pm' : 'am';
      const h12 = h % 12 || 12;
      return h12 + (m ? ':' + String(m).padStart(2, '0') : '') + ampm;
    }
    function fmtDuration(start, end) {
      if (!start || !end) return '';
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const mins = eh * 60 + em - sh * 60 - sm;
      if (mins <= 0) return '';
      if (mins < 60) return mins + 'm';
      const h = Math.floor(mins / 60), m = mins % 60;
      return m ? h + 'h' + m + 'm' : h + 'h';
    }
    // Convert a local date to display date in selected tz
    function toDisplayDate(dateStr, timeStr) {
      if (!currentTz || !timeStr) return { date: dateStr, time: timeStr };
      try {
        const dt = new Date(dateStr + 'T' + timeStr + ':00');
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: currentTz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(dt);
        const get = t => parts.find(p => p.type === t)?.value || '';
        return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
      } catch { return { date: dateStr, time: timeStr }; }
    }
    function formatTzTime(timeStr) {
      if (!timeStr) return '';
      if (!currentTz) return timeStr;
      try {
        const dt = new Date('2000-01-01T' + timeStr + ':00');
        return dt.toLocaleTimeString('en-US', { timeZone: currentTz, hour: '2-digit', minute: '2-digit', hour12: true });
      } catch { return timeStr; }
    }

    // ══════════════════════════════════════════
    // RECURRENCE ENGINE
    // ══════════════════════════════════════════
    function recurSummary(ev) {
      const r = ev.recurrence;
      if (!r || r.type === 'none') return null;
      const unit = { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' }[r.type];
      let s = (r.interval && r.interval > 1) ? `Every ${r.interval} ${unit}s` : `${r.type.charAt(0).toUpperCase() + r.type.slice(1)}`;
      if (r.endType === 'on' && r.endDate) s += ` until ${r.endDate}`;
      else if (r.endType === 'after') s += ` · ${r.count}x`;
      return s;
    }
    function occursOnDate(ev, date) {
      const start = parseDate(ev.date);
      if (!start) return false;
      const dStr = fmtDate(date);
      // Multi-day spanning check (no recurrence needed)
      if (ev.endDate && ev.endDate > ev.date) {
        const end = parseDate(ev.endDate);
        if (date >= start && date <= end) return true;
      }
      const r = ev.recurrence;
      if (!r || r.type === 'none') {
        return isSameDay(start, date);
      }
      if (date < start) return false;
      const exc = ev.exceptions || [];
      if (exc.includes(dStr)) return false;
      // Check end conditions
      if (r.endType === 'on' && r.endDate && dStr > r.endDate) return false;
      const diffMs = date - start;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const interval = r.interval || 1;
      if (r.type === 'daily') return diffDays % interval === 0;
      if (r.type === 'weekly') return diffDays % 7 === 0 && (diffDays / 7) % interval === 0;
      if (r.type === 'monthly') return date.getDate() === start.getDate() && (date.getFullYear() * 12 + date.getMonth() - (start.getFullYear() * 12 + start.getMonth())) % interval === 0;
      if (r.type === 'yearly') return date.getDate() === start.getDate() && date.getMonth() === start.getMonth() && (date.getFullYear() - start.getFullYear()) % interval === 0;
      return false;
    }
    function eventsForDate(date) {
      const dStr = fmtDate(date);
      return events.filter(ev => {
        const cal = calendars.find(c => c.id === (ev.calendarId || 'default'));
        if (cal && cal.visible === false) return false;
        const lbl = ev.labelId ? labels.find(l => l.id === ev.labelId) : null;
        if (lbl && lbl.visible === false) return false;
        return occursOnDate(ev, date);
      });
    }
    function isMultiDay(ev) {
      return ev.endDate && ev.endDate > ev.date;
    }

    // ══════════════════════════════════════════
    // VIEWS & NAV
    // ══════════════════════════════════════════
    function setView(v) {
      view = v;
      ['month', 'week', 'day', 'agenda', 'year'].forEach(x => {
        const b = document.getElementById('btn-' + x);
        if (b) b.classList.toggle('active', x === v);
      });
      if (v === 'day') cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      render();
    }
    function navigate(dir) {
      if (view === 'month' || view === 'year') cursor = new Date(cursor.getFullYear(), cursor.getMonth() + dir * (view === 'year' ? 12 : 1), 1);
      else if (view === 'week') cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + dir * 7);
      else if (view === 'agenda') cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + dir * 30);
      else cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + dir);
      render();
    }
    function goToday() {
      today = new Date();
      cursor = view === 'month' || view === 'year' ? new Date(today.getFullYear(), today.getMonth(), 1) : new Date(today);
      render();
      if (wsPanelOpen) {
        const ds = fmtDate(today);
        selectedDay = ds;
        // highlight after render
        setTimeout(() => {
          document.querySelectorAll('.day-cell.selected').forEach(c => c.classList.remove('selected'));
          const cell = document.querySelector('[data-date="' + ds + '"]');
          if (cell) cell.classList.add('selected');
          openWsPanelToDate(ds);
        }, 50);
      }
    }
    function miniNav(dir) { miniCursor = new Date(miniCursor.getFullYear(), miniCursor.getMonth() + dir, 1); renderMini(); }
    function toggleSidebar() { sidebarVisible = !sidebarVisible; applyPrefs(); savePrefs(); }
    function toggleMiniCal() { miniCalVisible = !miniCalVisible; applyPrefs(); savePrefs(); }
    function toggleUpcoming() { upcomingVisible = !upcomingVisible; applyPrefs(); savePrefs(); }
    function toggleLabels() { labelsVisible = !labelsVisible; applyPrefs(); savePrefs(); }
    function toggleCalendars() { calendarsVisible = !calendarsVisible; applyPrefs(); savePrefs(); }
    function toggleHabits() { habitsVisible = !habitsVisible; applyPrefs(); savePrefs(); }

    function render() {
      today = new Date();
      updateTitle();
      renderCalendar();
      renderMini();
      renderSidebar();
      scheduleAllReminders();
    }
    function updateTitle() {
      const t = document.getElementById('main-title');
      if (view === 'month') t.textContent = MONTHS[cursor.getMonth()] + ' ' + cursor.getFullYear();
      else if (view === 'year') t.textContent = cursor.getFullYear();
      else if (view === 'agenda') t.textContent = 'Agenda · ' + MONTHS[cursor.getMonth()] + ' ' + cursor.getFullYear();
      else if (view === 'week') {
        const ws = getWeekStart(cursor), we = addDays(ws, 6);
        t.textContent = MONTHS[ws.getMonth()].slice(0, 3) + ' ' + ws.getDate() + ' – ' + (ws.getMonth() !== we.getMonth() ? MONTHS[we.getMonth()].slice(0, 3) + ' ' : '') + we.getDate() + ', ' + we.getFullYear();
      } else t.textContent = DAYS[cursor.getDay()] + ', ' + MONTHS[cursor.getMonth()] + ' ' + cursor.getDate() + ', ' + cursor.getFullYear();
    }
    function renderCalendar() {
      const area = document.getElementById('calendar-area'); area.innerHTML = '';
      if (view === 'month') renderMonth(area);
      else if (view === 'week') renderWeek(area);
      else if (view === 'day') renderDay(area);
      else if (view === 'agenda') renderAgenda(area);
      else renderYear(area);
    }

    // ══════════════════════════════════════════
    // MONTH VIEW
    // ══════════════════════════════════════════
    function renderMonth(area) {
      const mv = document.createElement('div'); mv.className = 'month-view';
      // Header row: week-num gutter + 7 day headers
      const dh = document.createElement('div'); dh.className = 'day-headers-inner';
      const wng = document.createElement('div'); wng.className = 'week-num-gutter'; dh.appendChild(wng);
      DAYS.forEach((d, i) => {
        const el = document.createElement('div'); el.className = 'day-header' + (i === 0 || i === 6 ? ' weekend' : '');
        el.textContent = d; dh.appendChild(el);
      });
      mv.appendChild(dh);
      const grid = document.createElement('div'); grid.className = 'month-grid';
      const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const sd = first.getDay();
      const dim = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
      // Build 6-week grid with week number cells
      for (let row = 0; row < 6; row++) {
        const firstOfRow = new Date(cursor.getFullYear(), cursor.getMonth(), 1 - sd + row * 7);
        const wn = document.createElement('div'); wn.className = 'week-num-cell';
        wn.textContent = 'W' + getISOWeek(firstOfRow); wn.title = 'Week ' + getISOWeek(firstOfRow);
        grid.appendChild(wn);
        for (let col = 0; col < 7; col++) {
          const date = new Date(cursor.getFullYear(), cursor.getMonth(), 1 - sd + row * 7 + col);
          const cell = buildMonthCell(date, date.getMonth() !== cursor.getMonth());
          grid.appendChild(cell);
        }
      }
      mv.appendChild(grid);
      area.appendChild(mv);
      // Re-apply selected highlight after render
      if (selectedDay) {
        const sel = mv.querySelector('[data-date="' + selectedDay + '"]');
        if (sel) sel.classList.add('selected');
      }
    }
    function buildMonthCell(date, otherMonth) {
      const dStr = fmtDate(date);
      const cell = document.createElement('div');
      const isWknd = date.getDay() === 0 || date.getDay() === 6;
      cell.className = 'day-cell' + (otherMonth ? ' other-month' : '') + (isSameDay(date, today) ? ' today' : '') + (isWknd ? ' weekend' : '');
      cell.dataset.date = dStr;
      // Day number
      const dn = document.createElement('div'); dn.className = 'day-num';
      const dni = document.createElement('div'); dni.className = 'day-num-inner'; dni.textContent = date.getDate();
      dn.appendChild(dni); cell.appendChild(dn);
      // Events
      const dayEvs = eventsForDate(date);
      // Handle multi-day events spanning this cell
      const maxShow = 3;
      let shown = 0;
      dayEvs.forEach(ev => {
        if (shown >= maxShow) { return; }
        const pill = makePill(ev, date); cell.appendChild(pill); shown++;
      });
      if (dayEvs.length > maxShow) {
        const more = document.createElement('div'); more.className = 'more-events';
        more.textContent = `+${dayEvs.length - maxShow} more`;
        more.onclick = e => { e.stopPropagation(); openModal(dStr); };
        cell.appendChild(more);
      }
      // Click to create or open workspace to date
      cell.onclick = function (ev) {
        if (window.innerWidth <= 768) { mobDayTap(dStr, cell); return; }
        // Select the cell
        selectedDay = dStr;
        document.querySelectorAll('.day-cell.selected').forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');
        // Shift+click → new event; plain click → open journal for that date
        if (ev && ev.shiftKey) { openModal(dStr); } else { openWsPanelToDate(dStr); }
      };
      // Drag & drop
      cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('drag-over'); });
      cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
      cell.addEventListener('drop', e => { e.preventDefault(); cell.classList.remove('drag-over'); handleDrop(dStr); });
      // Touch long-press
      // D6: on mobile, disable long-press drag (interferes with normal taps)
      if (window.innerWidth > 768) {
        cell.addEventListener('touchstart', e => handleTouchStart(e, dStr), { passive: true });
        cell.addEventListener('touchend', handleTouchEnd, { passive: true });
        cell.addEventListener('touchmove', handleTouchMove, { passive: true });
      }
      // Hover tooltip
      cell.addEventListener('mouseenter', e => showDayTooltip(date, e));
      cell.addEventListener('mousemove', e => moveDayTooltip(e));
      cell.addEventListener('mouseleave', hideDayTooltip);
      return cell;
    }
    function makePill(ev, date) {
      const cal = calendars.find(c => c.id === (ev.calendarId || 'default'));
      const color = ev.color || (cal ? cal.color : COLORS[0].hex);
      const lbl = ev.labelId ? labels.find(l => l.id === ev.labelId) : null;
      const pill = document.createElement('div');
      pill.className = 'event-pill';
      pill.style.borderLeftColor = color;
      pill.style.background = color + '22';
      // Multi-day classes
      if (isMultiDay(ev)) {
        const start = parseDate(ev.date), end = parseDate(ev.endDate);
        if (isSameDay(date, start)) pill.classList.add('multiday-start');
        else if (isSameDay(date, end)) pill.classList.add('multiday-end');
        else pill.classList.add('multiday-mid');
        pill.style.background = color + '33';
      }
      const dot = document.createElement('div'); dot.className = 'pill-dot'; dot.style.background = color;
      const txt = document.createElement('div'); txt.className = 'pill-text'; txt.textContent = ev.title;
      pill.appendChild(dot); pill.appendChild(txt);
      if (ev.recurrence && ev.recurrence.type !== 'none') {
        const rb = document.createElement('span'); rb.className = 'pill-recur'; rb.textContent = '↻'; pill.appendChild(rb);
      }
      if (lbl) { const lb = document.createElement('span'); lb.className = 'pill-label'; lb.textContent = lbl.name; pill.appendChild(lb); }
      if (!ev.allDay && !isMultiDay(ev) && ev.start && ev.end) {
        const dur = fmtDuration(ev.start, ev.end);
        if (dur) { const db = document.createElement('span'); db.className = 'pill-duration'; db.textContent = dur; pill.appendChild(db); }
      }
      pill.draggable = true;
      pill.onclick = e => { e.stopPropagation(); showPopup(ev.id, date, e); };
      pill.addEventListener('dragstart', e => { e.stopPropagation(); startDrag(ev.id, fmtDate(date), e); });
      pill.addEventListener('dragend', endDrag);
      return pill;
    }

    // ══════════════════════════════════════════
    // WEEK VIEW
    // ══════════════════════════════════════════
    function renderWeek(area) {
      const ws = getWeekStart(cursor);
      const wv = document.createElement('div'); wv.className = 'week-view';
      // Header: wk-num | empty-timecol | 7 day headers
      const hdr = document.createElement('div'); hdr.className = 'week-header';
      const wkHdrGutter = document.createElement('div'); wkHdrGutter.className = 'week-wk-num-hdr';
      const wkLbl = document.createElement('div'); wkLbl.className = 'week-wk-num-label'; wkLbl.textContent = 'W' + getISOWeek(ws);
      wkHdrGutter.appendChild(wkLbl); hdr.appendChild(wkHdrGutter);
      const timeGutter = document.createElement('div'); hdr.appendChild(timeGutter); // spacer over time col
      for (let i = 0; i < 7; i++) {
        const d = addDays(ws, i);
        const isWknd = d.getDay() === 0 || d.getDay() === 6;
        const wdh = document.createElement('div'); wdh.className = 'week-day-header' + (isWknd ? ' weekend' : '');
        const name = document.createElement('div'); name.className = 'wdh-name'; name.textContent = DAYS[d.getDay()];
        const num = document.createElement('div'); num.className = 'wdh-num' + (isSameDay(d, today) ? ' today' : ''); num.textContent = d.getDate();
        wdh.appendChild(name); wdh.appendChild(num); hdr.appendChild(wdh);
      }
      wv.appendChild(hdr);
      // All-day row
      const adr = buildAlldayRow('week', ws, 7);
      wv.appendChild(adr);
      // Time grid: wk-num | time-col | 7 day cols
      const body = document.createElement('div'); body.className = 'week-body';
      // Week-number side column
      const wkNumCol = document.createElement('div'); wkNumCol.style.cssText = 'border-right:1px solid var(--border);'; body.appendChild(wkNumCol);
      // Time labels col
      const tcol = document.createElement('div'); tcol.className = 'time-col';
      for (let h = 0; h < 24; h++) {
        const tl = document.createElement('div'); tl.className = 'time-label';
        tl.textContent = h === 0 ? '' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
        tcol.appendChild(tl);
      }
      body.appendChild(tcol);
      for (let i = 0; i < 7; i++) {
        const d = addDays(ws, i);
        const col = buildWeekDayCol(d, body);
        body.appendChild(col);
      }
      wv.appendChild(body);
      area.appendChild(wv);
      // Scroll to 8am + compensate header/allday for scrollbar width
      requestAnimationFrame(() => { body.scrollTop = 8 * 60; });
      // ResizeObserver keeps header + allday-row aligned with week-body
      // at all times — including during sidebar / ws-panel animations.
      (new ResizeObserver(() => {
        const sbw = body.offsetWidth - body.clientWidth;
        hdr.style.paddingRight = sbw + 'px';
        adr.style.paddingRight = sbw + 'px';
      })).observe(body);
    }
    function buildAlldayRow(type, startDate, count) {
      const adr = document.createElement('div');
      adr.className = 'allday-row ' + (type === 'week' ? 'week-allday' : 'day-allday');
      // Week mode gets an extra wk-num gutter cell first
      if (type === 'week') {
        const wkSpacer = document.createElement('div'); wkSpacer.style.cssText = 'border-right:1px solid var(--border);'; adr.appendChild(wkSpacer);
      }
      const ag = document.createElement('div'); ag.className = 'allday-gutter'; ag.textContent = 'All-day'; adr.appendChild(ag);
      for (let i = 0; i < count; i++) {
        const d = addDays(startDate, i);
        const cell = document.createElement('div'); cell.className = 'allday-cell';
        eventsForDate(d).filter(ev => ev.allDay || isMultiDay(ev)).forEach(ev => {
          const pill = makeAlldayPill(ev, d);
          cell.appendChild(pill);
        });
        adr.appendChild(cell);
      }
      return adr;
    }
    function makeAlldayPill(ev, date) {
      const cal = calendars.find(c => c.id === (ev.calendarId || 'default'));
      const color = ev.color || (cal ? cal.color : COLORS[0].hex);
      const pill = document.createElement('div'); pill.className = 'allday-pill';
      pill.style.borderLeftColor = color; pill.style.background = color + '22';
      const dot = document.createElement('div'); dot.className = 'allday-pill-dot'; dot.style.background = color;
      const txt = document.createElement('div'); txt.className = 'allday-pill-text'; txt.textContent = ev.title;
      pill.appendChild(dot); pill.appendChild(txt);
      pill.onclick = e => { e.stopPropagation(); showPopup(ev.id, date, e); };
      return pill;
    }
    function buildWeekDayCol(date, bodyEl) {
      const dStr = fmtDate(date);
      const isWknd = date.getDay() === 0 || date.getDay() === 6;
      const col = document.createElement('div'); col.className = 'week-day-col' + (isWknd ? ' weekend' : '');
      // Hour lines
      for (let h = 0; h < 24; h++) {
        const hl = document.createElement('div'); hl.className = 'hour-line'; hl.style.top = (h * 60) + 'px'; col.appendChild(hl);
      }
      // Now line
      if (isSameDay(date, today)) {
        const nl = document.createElement('div'); nl.className = 'now-line';
        const mins = today.getHours() * 60 + today.getMinutes();
        nl.style.top = mins + 'px';
        const nd = document.createElement('div'); nd.className = 'now-dot'; nl.appendChild(nd);
        col.appendChild(nl);
      }
      // Timed events
      eventsForDate(date).filter(ev => !ev.allDay && !isMultiDay(ev)).forEach(ev => {
        const el = buildWeekEvent(ev, date); if (el) col.appendChild(el);
      });
      // Drop target
      col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
      col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
      col.addEventListener('drop', e => { e.preventDefault(); col.classList.remove('drag-over'); handleDrop(dStr); });
      // ── Time-blocking: drag-to-create ──
      let blockOverlay = null, blockStartY = 0, blockStartMin = 0, blockDragging = false;
      function colY(e) { const r = col.getBoundingClientRect(); return e.clientY - r.top; }
      function snapMin(px) { return Math.round(Math.max(0, Math.min(1439, px)) / 15) * 15; }
      function fmtMin(m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
      col.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        // Don't intercept clicks on existing events or drag ops
        if (e.target.closest('.week-event,.allday-pill')) return;
        if (isDragging) return;
        blockDragging = true;
        blockStartY = colY(e); blockStartMin = snapMin(blockStartY);
        blockOverlay = document.createElement('div'); blockOverlay.className = 'time-block-overlay';
        const lbl = document.createElement('div'); lbl.className = 'time-block-label'; blockOverlay.appendChild(lbl);
        blockOverlay.style.top = blockStartMin + 'px'; blockOverlay.style.height = '0px';
        col.appendChild(blockOverlay);
        e.preventDefault();
      });
      document.addEventListener('mousemove', onBlockMove);
      document.addEventListener('mouseup', onBlockUp);
      function onBlockMove(e) {
        if (!blockDragging || !blockOverlay) return;
        const curMin = snapMin(colY(e));
        const top = Math.min(blockStartMin, curMin);
        const bot = Math.max(blockStartMin, curMin) + 15;
        blockOverlay.style.top = top + 'px'; blockOverlay.style.height = (bot - top) + 'px';
        const lbl = blockOverlay.querySelector('.time-block-label');
        lbl.textContent = fmtMin(top) + ' – ' + fmtMin(Math.min(bot, 1440));
      }
      function onBlockUp(e) {
        if (!blockDragging || !blockOverlay) { blockDragging = false; return; }
        blockDragging = false;
        const curMin = snapMin(colY(e));
        const startMin = Math.min(blockStartMin, curMin);
        const endMin = Math.max(blockStartMin, curMin) + 15;
        if (blockOverlay.parentNode) blockOverlay.parentNode.removeChild(blockOverlay);
        blockOverlay = null;
        // Only open modal if dragged at least 15 min (avoids conflicts with plain clicks)
        if (endMin - startMin >= 15) {
          openModal(dStr, fmtMin(startMin), fmtMin(Math.min(endMin, 1439)));
        } else {
          // Treat as plain click → open at snapped hour
          const h = Math.floor(startMin / 60);
          openModal(dStr, String(h).padStart(2, '0') + ':' + String(startMin % 60).padStart(2, '0'));
        }
      }
      // Clean up listeners when col is removed from DOM
      const obs = new MutationObserver(() => { if (!col.isConnected) { document.removeEventListener('mousemove', onBlockMove); document.removeEventListener('mouseup', onBlockUp); obs.disconnect(); } });
      obs.observe(document.body, { childList: true, subtree: true });
      return col;
    }
    function buildWeekEvent(ev, date) {
      if (!ev.start || !ev.end) return null;
      const [sh, sm] = ev.start.split(':').map(Number);
      const [eh, em] = ev.end.split(':').map(Number);
      const top = sh * 60 + sm, height = Math.max(20, eh * 60 + em - top);
      const cal = calendars.find(c => c.id === (ev.calendarId || 'default'));
      const color = ev.color || (cal ? cal.color : COLORS[0].hex);
      const el = document.createElement('div'); el.className = 'week-event';
      el.style.top = top + 'px'; el.style.height = height + 'px';
      el.style.borderLeftColor = color; el.style.background = color + '28'; el.style.color = 'var(--text)';
      const title = document.createElement('div'); title.className = 'we-title'; title.textContent = ev.title;
      const time = document.createElement('div'); time.className = 'we-time'; time.textContent = `${formatTzTime(ev.start) || ev.start}–${formatTzTime(ev.end) || ev.end}`;
      el.appendChild(title); el.appendChild(time);
      if (height >= 50) {
        const dur = fmtDuration(ev.start, ev.end);
        if (dur) { const dd = document.createElement('div'); dd.className = 'we-duration'; dd.textContent = dur; el.appendChild(dd); }
      }
      el.draggable = true;
      el.onclick = e => { e.stopPropagation(); showPopup(ev.id, date, e); };
      el.addEventListener('dragstart', e => { e.stopPropagation(); startDrag(ev.id, fmtDate(date), e); });
      el.addEventListener('dragend', endDrag);
      return el;
    }

    // ══════════════════════════════════════════
    // DAY VIEW
    // ══════════════════════════════════════════
    function renderDay(area) {
      const dv = document.createElement('div'); dv.className = 'day-view';
      const dhb = document.createElement('div'); dhb.className = 'day-header-bar';
      const dn = document.createElement('div'); dn.className = 'dhb-name'; dn.textContent = DAYS[cursor.getDay()];
      const dd = document.createElement('div'); dd.className = 'dhb-num'; dd.textContent = cursor.getDate();
      dhb.appendChild(dn); dhb.appendChild(dd);
      dv.appendChild(dhb);
      const dayEvs = eventsForDate(cursor);
      const alldayEvs = dayEvs.filter(ev => ev.allDay || isMultiDay(ev));
      if (alldayEvs.length) {
        const adr = buildAlldayRow('day', cursor, 1); dv.appendChild(adr);
      }
      const body = document.createElement('div'); body.className = 'day-body';
      const tcol = document.createElement('div'); tcol.className = 'time-col';
      for (let h = 0; h < 24; h++) {
        const tl = document.createElement('div'); tl.className = 'time-label';
        tl.textContent = h === 0 ? '' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
        tcol.appendChild(tl);
      }
      body.appendChild(tcol);
      const dcol = buildWeekDayCol(cursor, body); dcol.style.minHeight = '1440px';
      body.appendChild(dcol);
      dv.appendChild(body);
      area.appendChild(dv);
      requestAnimationFrame(() => { body.scrollTop = 8 * 60; });
    }

    // ══════════════════════════════════════════
    // AGENDA VIEW
    // ══════════════════════════════════════════
    function renderAgenda(area) {
      const av = document.createElement('div'); av.className = 'agenda-view';
      const startDate = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const endDate = new Date(cursor.getFullYear(), cursor.getMonth() + 2, 0); // 2 months
      let hasAny = false;
      for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
        const dayEvs = eventsForDate(d);
        // Also add habits for today
        const todayHabits = habitsForDate(d);
        if (!dayEvs.length && !todayHabits.length) continue;
        hasAny = true;
        const group = document.createElement('div'); group.className = 'agenda-day-group';
        const dhdr = document.createElement('div'); dhdr.className = 'agenda-day-header';
        const dname = document.createElement('div'); dname.className = 'agenda-day-name'; dname.textContent = DAYS[d.getDay()];
        const ddate = document.createElement('div'); ddate.className = 'agenda-day-date' + (isSameDay(d, today) ? ' today' : ''); ddate.textContent = d.getDate();
        const dmonth = document.createElement('div'); dmonth.className = 'agenda-day-month'; dmonth.textContent = MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear();
        dhdr.appendChild(dname); dhdr.appendChild(ddate); dhdr.appendChild(dmonth);
        group.appendChild(dhdr);
        // Events
        dayEvs.sort((a, b) => (a.allDay ? '00:00' : a.start || '00:00').localeCompare(b.allDay ? '00:00' : b.start || '00:00'));
        dayEvs.forEach(ev => {
          const row = buildAgendaEvent(ev, d); group.appendChild(row);
        });
        // Habits
        todayHabits.forEach(h => {
          const row = buildAgendaHabit(h, d); group.appendChild(row);
        });
        av.appendChild(group);
      }
      if (!hasAny) {
        const empty = document.createElement('div'); empty.className = 'agenda-empty';
        empty.textContent = 'No events this period. Click + New Event to get started.';
        av.appendChild(empty);
      }
      area.appendChild(av);
      // Scroll to today's group after render
      requestAnimationFrame(() => {
        const todayGroup = av.querySelector('.agenda-day-date.today');
        if (todayGroup) todayGroup.closest('.agenda-day-group').scrollIntoView({ behavior: 'smooth', block: 'start' });
        else av.scrollTop = 0;
      });
    }
    function buildAgendaEvent(ev, date) {
      const cal = calendars.find(c => c.id === (ev.calendarId || 'default'));
      const color = ev.color || (cal ? cal.color : COLORS[0].hex);
      const row = document.createElement('div'); row.className = 'agenda-event'; row.style.borderLeftColor = color;
      const tspan = document.createElement('div'); tspan.className = 'agenda-event-time';
      tspan.textContent = ev.allDay ? 'All day' : `${formatTzTime(ev.start) || ev.start || ''} – ${formatTzTime(ev.end) || ev.end || ''}`;
      const body = document.createElement('div'); body.className = 'agenda-event-body';
      const title = document.createElement('div'); title.className = 'agenda-event-title'; title.textContent = ev.title;
      const meta = document.createElement('div'); meta.className = 'agenda-event-meta';
      if (cal) { const cs = document.createElement('span'); cs.textContent = '📅 ' + cal.name; cs.style.color = color; meta.appendChild(cs); }
      if (ev.recurrence && ev.recurrence.type !== 'none') { const rs = document.createElement('span'); rs.textContent = '↻ ' + recurSummary(ev); meta.appendChild(rs); }
      body.appendChild(title); body.appendChild(meta);
      row.appendChild(tspan); row.appendChild(body);
      row.onclick = e => showPopup(ev.id, date, e);
      return row;
    }
    function buildAgendaHabit(h, date) {
      const done = isHabitDone(h, date);
      const row = document.createElement('div'); row.className = 'agenda-event'; row.style.borderLeftColor = h.color || COLORS[2].hex;
      row.style.opacity = done ? '0.6' : '1';
      const check = document.createElement('div'); check.className = 'agenda-habit-check' + (done ? ' done' : '');
      check.style.borderColor = h.color || COLORS[2].hex;
      if (done) { check.style.background = h.color || COLORS[2].hex; check.textContent = '✓'; }
      check.onclick = e => { e.stopPropagation(); toggleHabitDay(h.id, date); };
      const tspan = document.createElement('div'); tspan.className = 'agenda-event-time'; tspan.textContent = 'Habit';
      const body = document.createElement('div'); body.className = 'agenda-event-body';
      const title = document.createElement('div'); title.className = 'agenda-event-title'; title.textContent = h.name;
      const streak = document.createElement('div'); streak.className = 'agenda-event-meta';
      const streakN = getHabitStreak(h);
      if (streakN > 0) { streak.textContent = `🔥 ${streakN} day streak`; streak.style.color = h.color || COLORS[2].hex; }
      body.appendChild(title); if (streakN > 0) body.appendChild(streak);
      row.appendChild(check); row.appendChild(tspan); row.appendChild(body);
      return row;
    }

    // ══════════════════════════════════════════
    // YEAR VIEW
    // ══════════════════════════════════════════
    function renderYear(area) {
      const year = cursor.getFullYear();
      const yv = document.createElement('div'); yv.className = 'year-view';
      const grid = document.createElement('div'); grid.className = 'year-grid';
      for (let m = 0; m < 12; m++) {
        const mc = buildYearMonth(year, m);
        grid.appendChild(mc);
      }
      yv.appendChild(grid);
      area.appendChild(yv);
    }
    function buildYearMonth(year, month) {
      const mc = document.createElement('div'); mc.className = 'year-month';
      const name = document.createElement('div'); name.className = 'year-month-name'; name.textContent = MONTHS[month].slice(0, 3);
      mc.appendChild(name);
      const mgrid = document.createElement('div'); mgrid.className = 'year-month-grid';
      DAYS.forEach(d => { const dl = document.createElement('div'); dl.className = 'year-day-label'; dl.textContent = d[0]; mgrid.appendChild(dl); });
      const first = new Date(year, month, 1);
      const sd = first.getDay();
      const dim = new Date(year, month + 1, 0).getDate();
      for (let i = 0; i < sd; i++) {
        const empty = document.createElement('div'); empty.className = 'year-day other-m'; mgrid.appendChild(empty);
      }
      for (let d = 1; d <= dim; d++) {
        const date = new Date(year, month, d);
        const evCount = eventsForDate(date).length;
        const yd = document.createElement('div');
        yd.className = 'year-day' + (isSameDay(date, today) ? ' today' : '') + (evCount === 0 ? '' : evCount === 1 ? ' has-1' : evCount === 2 ? ' has-2' : evCount === 3 ? ' has-3' : evCount === 4 ? ' has-4' : ' has-many');
        yd.textContent = d;
        yd.title = evCount ? `${evCount} event${evCount > 1 ? 's' : ''}` : null;
        yd.onclick = () => { cursor = new Date(year, month, d); setView('day'); };
        yd.addEventListener('mouseenter', e => showDayTooltip(date, e));
        yd.addEventListener('mousemove', e => moveDayTooltip(e));
        yd.addEventListener('mouseleave', hideDayTooltip);
        mgrid.appendChild(yd);
      }
      mc.appendChild(mgrid);
      return mc;
    }

    // ══════════════════════════════════════════
    // MINI CALENDAR
    // ══════════════════════════════════════════
    function renderMini() {
      if (!miniCalVisible) return;
      document.getElementById('mini-title').textContent = MONTHS[miniCursor.getMonth()].slice(0, 3) + ' ' + miniCursor.getFullYear();
      const grid = document.getElementById('mini-grid'); grid.innerHTML = '';
      // Week-number header spacer + day labels
      const wkHdrSpacer = document.createElement('div'); wkHdrSpacer.className = 'mini-wk-label'; wkHdrSpacer.textContent = 'W'; grid.appendChild(wkHdrSpacer);
      DAYS.forEach(d => { const el = document.createElement('div'); el.className = 'mini-day-label'; el.textContent = d[0]; grid.appendChild(el); });
      const first = new Date(miniCursor.getFullYear(), miniCursor.getMonth(), 1);
      const sd = first.getDay();
      const dim = new Date(miniCursor.getFullYear(), miniCursor.getMonth() + 1, 0).getDate();
      // Build rows with week numbers
      const allDays = [];
      for (let i = 0; i < sd; i++) allDays.push({ date: new Date(miniCursor.getFullYear(), miniCursor.getMonth(), 1 - sd + i), other: true });
      for (let d = 1; d <= dim; d++) allDays.push({ date: new Date(miniCursor.getFullYear(), miniCursor.getMonth(), d), other: false });
      for (let i = 1; i <= 42 - sd - dim; i++) allDays.push({ date: new Date(miniCursor.getFullYear(), miniCursor.getMonth() + 1, i), other: true });
      for (let row = 0; row < 6; row++) {
        const firstDay = allDays[row * 7]?.date;
        const wn = document.createElement('div'); wn.className = 'mini-wk-num';
        if (firstDay) { wn.textContent = getISOWeek(firstDay); wn.title = 'Week ' + getISOWeek(firstDay); }
        grid.appendChild(wn);
        for (let col = 0; col < 7; col++) {
          const item = allDays[row * 7 + col];
          if (item) addMiniDay(grid, item.date, item.other);
          else { const empty = document.createElement('div'); grid.appendChild(empty); }
        }
      }
    }
    function addMiniDay(grid, date, other) {
      const el = document.createElement('div');
      const evCount = eventsForDate(date).length;
      const isWknd = date.getDay() === 0 || date.getDay() === 6;
      el.className = 'mini-day' + (other ? ' other-month' : '') + (isSameDay(date, today) ? ' today' : '') + (evCount > 0 ? ' has-events' : '') + (isWknd && !other ? ' weekend' : '');
      if (isWknd && !other && !isSameDay(date, today)) el.style.color = 'var(--accent2)';
      el.textContent = date.getDate();
      el.onclick = () => {
        if (view === 'month') cursor = new Date(date.getFullYear(), date.getMonth(), 1);
        else cursor = new Date(date);
        render();
        openModal(fmtDate(date));
      };
      grid.appendChild(el);
    }

    // ══════════════════════════════════════════
    // SIDEBAR RENDER
    // ══════════════════════════════════════════
    function renderSidebar() {
      renderCalendarsList();
      renderLabelsList();
      renderHabitsList();
      renderUpcoming();
    }
    function renderCalendarsList() {
      const list = document.getElementById('calendars-list'); if (!list) return; list.innerHTML = '';
      calendars.forEach(cal => {
        const cnt = events.filter(e => e.calendarId === (cal.id || 'default') || (!e.calendarId && cal.id === 'default')).length;
        const row = document.createElement('div'); row.className = 'cal-row';
        const chk = document.createElement('div'); chk.className = 'cal-check';
        chk.style.borderColor = cal.color;
        if (cal.visible !== false) { chk.style.background = cal.color; chk.textContent = '✓'; }
        chk.onclick = e => { e.stopPropagation(); cal.visible = cal.visible === false ? true : false; saveCalendars(); render(); };
        const nm = document.createElement('div'); nm.className = 'cal-name'; nm.textContent = cal.name;
        const ct = document.createElement('div'); ct.className = 'cal-count'; ct.textContent = cnt || '';
        const eb = document.createElement('button'); eb.className = 'cal-edit-btn'; eb.textContent = '•••';
        eb.onclick = e => { e.stopPropagation(); openCalModal(cal.id); };
        row.appendChild(chk); row.appendChild(nm); row.appendChild(ct); row.appendChild(eb);
        list.appendChild(row);
      });
      const addBtn = document.createElement('button'); addBtn.className = 'cal-add-btn';
      addBtn.innerHTML = '<span>+</span> New calendar'; addBtn.onclick = () => openCalModal(null);
      list.appendChild(addBtn);
    }
    function renderLabelsList() {
      const list = document.getElementById('labels-list'); if (!list) return; list.innerHTML = '';
      if (!labels.length) {
        const e = document.createElement('div'); e.style.cssText = 'font-size:0.72rem;color:var(--text3);padding:3px 5px;'; e.textContent = 'No labels yet.'; list.appendChild(e);
      }
      labels.forEach(lbl => {
        const cnt = events.filter(e => e.labelId === lbl.id).length;
        const row = document.createElement('div'); row.className = 'label-row' + (lbl.visible === false ? ' hidden' : '');
        const vis = document.createElement('button'); vis.className = 'label-vis-btn';
        vis.innerHTML = lbl.visible === false
          ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.06-5.94M9.9 4.24A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
          : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        vis.onclick = e => { e.stopPropagation(); lbl.visible = lbl.visible === false ? true : false; saveLabels(); render(); };
        const dot = document.createElement('div'); dot.className = 'label-dot'; dot.style.background = lbl.color;
        const nm = document.createElement('div'); nm.className = 'label-name'; nm.textContent = lbl.name;
        const ct = document.createElement('div'); ct.className = 'label-count'; ct.textContent = cnt || '';
        const eb = document.createElement('button'); eb.className = 'label-edit-btn'; eb.textContent = '•••';
        eb.onclick = e => { e.stopPropagation(); openLabelModal(lbl.id); };
        row.appendChild(vis); row.appendChild(dot); row.appendChild(nm); row.appendChild(ct); row.appendChild(eb);
        list.appendChild(row);
      });
      const addBtn = document.createElement('button'); addBtn.className = 'label-add-btn';
      addBtn.innerHTML = '<span>+</span> New label'; addBtn.onclick = () => openLabelModal(null);
      list.appendChild(addBtn);
    }
    function renderHabitsList() {
      const list = document.getElementById('habits-list'); if (!list) return; list.innerHTML = '';
      if (!habits.length) {
        const e = document.createElement('div'); e.style.cssText = 'font-size:0.72rem;color:var(--text3);padding:3px 5px;'; e.textContent = 'No habits yet.'; list.appendChild(e);
      }
      habits.forEach(h => {
        const done = isHabitDone(h, today);
        const streak = getHabitStreak(h);
        const row = document.createElement('div'); row.className = 'habit-row';
        const dot = document.createElement('div'); dot.className = 'habit-dot'; dot.style.background = h.color || COLORS[2].hex;
        const chk = document.createElement('div'); chk.className = 'habit-check-today' + (done ? ' done' : '');
        chk.style.borderColor = h.color || COLORS[2].hex;
        if (done) { chk.style.background = h.color || COLORS[2].hex; chk.textContent = '✓'; }
        chk.onclick = e => { e.stopPropagation(); toggleHabitDay(h.id, today); };
        const nm = document.createElement('div'); nm.className = 'habit-name'; nm.textContent = h.name;
        const st = document.createElement('div'); st.className = 'habit-streak'; if (streak > 0) { st.textContent = '🔥' + streak; }
        const eb = document.createElement('button'); eb.className = 'habit-edit-btn'; eb.textContent = '•••';
        eb.onclick = e => { e.stopPropagation(); openHabitModal(h.id); };
        row.appendChild(chk); row.appendChild(dot); row.appendChild(nm); row.appendChild(st); row.appendChild(eb);
        list.appendChild(row);
      });
    }
    function renderUpcoming() {
      const list = document.getElementById('upcoming-list'); if (!list) return; list.innerHTML = '';
      const upcoming = [];
      for (let i = 0; i <= 30; i++) {
        const d = addDays(today, i);
        eventsForDate(d).forEach(ev => upcoming.push({ ev, date: d }));
      }
      upcoming.sort((a, b) => {
        if (a.date < b.date) return -1; if (a.date > b.date) return 1;
        return (a.ev.start || '').localeCompare(b.ev.start || '');
      });
      if (!upcoming.length) { const e = document.createElement('div'); e.className = 'no-events'; e.textContent = 'No upcoming events'; list.appendChild(e); return; }
      upcoming.slice(0, 8).forEach(({ ev, date }) => {
        const cal = calendars.find(c => c.id === (ev.calendarId || 'default'));
        const color = ev.color || (cal ? cal.color : COLORS[0].hex);
        const item = document.createElement('div'); item.className = 'upcoming-event'; item.style.borderLeftColor = color;
        const t = document.createElement('div'); t.className = 'ev-title'; t.textContent = ev.title;
        if (ev.recurrence && ev.recurrence.type !== 'none') { const rb = document.createElement('span'); rb.className = 'recur-badge'; rb.textContent = '↻'; t.appendChild(rb); }
        const d = document.createElement('div'); d.className = 'ev-date';
        const isToday = isSameDay(date, today), isTomorrow = isSameDay(date, addDays(today, 1));
        d.textContent = (isToday ? 'Today' : isTomorrow ? 'Tomorrow' : DAYS[date.getDay()] + ', ' + MONTHS[date.getMonth()].slice(0, 3) + ' ' + date.getDate()) + (ev.allDay ? '' : (ev.start ? ' · ' + (formatTzTime(ev.start) || ev.start) : ''));
        item.appendChild(t); item.appendChild(d);
        item.onclick = e => showPopup(ev.id, date, e);
        list.appendChild(item);
      });
    }

    // ══════════════════════════════════════════
    // HABITS ENGINE
    // ══════════════════════════════════════════
    function habitsForDate(date) {
      return habits.filter(h => {
        if (h.freq === 'daily') return true;
        if (h.freq === 'weekdays') return date.getDay() >= 1 && date.getDay() <= 5;
        if (h.freq === 'weekly') return date.getDay() === 1;
        return true;
      });
    }
    function isHabitDone(h, date) {
      const dStr = fmtDate(date);
      return (h.completions || []).includes(dStr);
    }
    function toggleHabitDay(id, date) {
      const h = habits.find(x => x.id === id); if (!h) return;
      const dStr = fmtDate(date);
      if (!h.completions) h.completions = [];
      if (h.completions.includes(dStr)) h.completions = h.completions.filter(d => d !== dStr);
      else h.completions.push(dStr);
      saveHabits(); renderSidebar(); if (view === 'agenda') renderCalendar();
      if (fbDb && currentRoom) fbSaveHabit(h);
    }
    function getHabitStreak(h) {
      if (!h.completions || !h.completions.length) return 0;
      let streak = 0, d = new Date(today);
      while (true) {
        const dStr = fmtDate(d);
        if (h.completions.includes(dStr)) streak++;
        else if (!isSameDay(d, today)) break;
        d = addDays(d, -1);
        if (streak > 365) break;
      }
      return streak;
    }

    // ══════════════════════════════════════════
    // EVENT MODAL
    // ══════════════════════════════════════════
    function openModal(dateStr, timeStr, endTimeStr) {
      editingId = null;
      document.getElementById('modal-title').textContent = 'New Event';
      document.getElementById('ev-title').value = '';
      document.getElementById('ev-date').value = dateStr || fmtDate(today);
      document.getElementById('ev-end-date').value = '';
      document.getElementById('ev-desc').value = '';
      document.getElementById('ev-allday').value = 'yes';
      document.getElementById('ev-start').value = timeStr || '09:00';
      document.getElementById('ev-end').value = endTimeStr || (timeStr ? `${String(parseInt(timeStr) + 1).padStart(2, '0')}:00` : '10:00');
      if (endTimeStr) document.getElementById('ev-allday').value = 'no';
      document.getElementById('ev-recur-type').value = 'none';
      document.getElementById('ev-recur-interval').value = 1;
      document.getElementById('ev-recur-end-type').value = 'never';
      document.getElementById('ev-recur-end-date').value = '';
      document.getElementById('ev-recur-count').value = 10;
      document.getElementById('ev-reminder').value = '';
      toggleTimeFields(); onRecurTypeChange(); onRecurEndChange();
      populateLabelDropdown('');
      populateCalendarDropdown('');
      document.getElementById('modal-actions').innerHTML = `<button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="saveEvent()">Save Event</button>`;
      document.getElementById('modal-overlay').classList.add('open');
      if (window.innerWidth > 768) setTimeout(() => document.getElementById('ev-title').focus(), 80);
    }
    function openEditModal(id) {
      const ev = events.find(e => e.id === id); if (!ev) return;
      editingId = id;
      document.getElementById('modal-title').textContent = 'Edit Event';
      document.getElementById('ev-title').value = ev.title;
      document.getElementById('ev-date').value = ev.date;
      document.getElementById('ev-end-date').value = ev.endDate || '';
      document.getElementById('ev-desc').value = ev.description || '';
      document.getElementById('ev-allday').value = ev.allDay ? 'yes' : 'no';
      document.getElementById('ev-start').value = ev.start || '09:00';
      document.getElementById('ev-end').value = ev.end || '10:00';
      const r = ev.recurrence || { type: 'none' };
      document.getElementById('ev-recur-type').value = r.type || 'none';
      document.getElementById('ev-recur-interval').value = r.interval || 1;
      document.getElementById('ev-recur-end-type').value = r.endType || 'never';
      document.getElementById('ev-recur-end-date').value = r.endDate || '';
      document.getElementById('ev-recur-count').value = r.count || 10;
      document.getElementById('ev-reminder').value = ev.reminder != null ? String(ev.reminder) : '';
      toggleTimeFields(); onRecurTypeChange(); onRecurEndChange();
      populateLabelDropdown(ev.labelId || '');
      populateCalendarDropdown(ev.calendarId || 'default');
      document.getElementById('modal-actions').innerHTML = `<button class="btn-delete" onclick="handleDeleteEdit('${id}')">Delete</button><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="saveEvent()">Save Changes</button>`;
      document.getElementById('modal-overlay').classList.add('open');
    }
    function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
    function handleOverlayClick(e) { if (e.target === document.getElementById('modal-overlay')) closeModal(); }
    function toggleTimeFields() { document.getElementById('time-fields').style.display = document.getElementById('ev-allday').value === 'yes' ? 'none' : 'block'; }
    function onRecurTypeChange() {
      const t = document.getElementById('ev-recur-type').value;
      document.getElementById('recur-section').style.display = t === 'none' ? 'none' : 'block';
      if (t !== 'none') document.getElementById('recur-unit-label').textContent = { daily: 'day(s)', weekly: 'week(s)', monthly: 'month(s)', yearly: 'year(s)' }[t];
    }
    function onRecurEndChange() {
      const et = document.getElementById('ev-recur-end-type').value;
      document.getElementById('recur-end-date-row').style.display = et === 'on' ? 'block' : 'none';
      document.getElementById('recur-end-count-row').style.display = et === 'after' ? 'block' : 'none';
    }
    function populateLabelDropdown(selectedId) {
      const sel = document.getElementById('ev-label'); sel.innerHTML = '<option value="">— No label —</option>';
      labels.forEach(lbl => { const o = document.createElement('option'); o.value = lbl.id; o.textContent = lbl.name; if (lbl.id === selectedId) o.selected = true; sel.appendChild(o); });
      onLabelChange();
    }
    function populateCalendarDropdown(selectedId) {
      const sel = document.getElementById('ev-calendar'); sel.innerHTML = '';
      calendars.forEach(cal => { const o = document.createElement('option'); o.value = cal.id; o.textContent = cal.name; if (cal.id === (selectedId || 'default')) o.selected = true; sel.appendChild(o); });
    }
    function onLabelChange() {
      const lid = document.getElementById('ev-label').value;
      const prev = document.getElementById('ev-label-preview');
      if (!prev) return;
      if (lid) { const lbl = labels.find(l => l.id === lid); if (lbl) { prev.style.display = 'flex'; prev.style.background = lbl.color + '22'; prev.style.color = lbl.color; document.getElementById('ev-label-preview-dot').style.background = lbl.color; document.getElementById('ev-label-preview-text').textContent = lbl.name; return; } }
      prev.style.display = 'none';
    }
    function saveEvent() {
      const title = document.getElementById('ev-title').value.trim();
      if (!title) { document.getElementById('ev-title').style.borderColor = 'var(--red)'; setTimeout(() => document.getElementById('ev-title').style.borderColor = '', 1500); return; }
      const allDay = document.getElementById('ev-allday').value === 'yes';
      const rType = document.getElementById('ev-recur-type').value;
      const recurrence = rType === 'none' ? { type: 'none' } : { type: rType, interval: Math.max(1, parseInt(document.getElementById('ev-recur-interval').value) || 1), endType: document.getElementById('ev-recur-end-type').value, endDate: document.getElementById('ev-recur-end-date').value || null, count: Math.max(1, parseInt(document.getElementById('ev-recur-count').value) || 10) };
      const reminderVal = document.getElementById('ev-reminder').value;
      const calId = document.getElementById('ev-calendar').value || 'default';
      const cal = calendars.find(c => c.id === calId);
      const lid = document.getElementById('ev-label').value;
      const lbl = lid ? labels.find(l => l.id === lid) : null;
      const color = lbl ? lbl.color : (cal ? cal.color : COLORS[0].hex);
      const existing = editingId ? events.find(e => e.id === editingId) : null;
      const startDate = document.getElementById('ev-date').value;
      const endDate = document.getElementById('ev-end-date').value;
      const ev = {
        id: editingId || uuid(), title, date: startDate,
        endDate: endDate && endDate > startDate ? endDate : null,
        allDay, start: allDay ? null : document.getElementById('ev-start').value,
        end: allDay ? null : document.getElementById('ev-end').value,
        description: document.getElementById('ev-desc').value.trim(),
        color, recurrence, labelId: lid || null, calendarId: calId,
        reminder: reminderVal !== '' ? parseInt(reminderVal) : null,
        exceptions: existing ? existing.exceptions || [] : [],
        timezone: currentTz || null
      };
      if (editingId) { const idx = events.findIndex(e => e.id === editingId); if (idx >= 0) events[idx] = ev; }
      else events.push(ev);
      localStorage.setItem('calioEvents', JSON.stringify(events));
      _fbPushEvent(ev);
      closeModal(); render();
      scheduleReminder(ev);
    }
    function handleDeleteEdit(id) {
      closeModal();
      const ev = events.find(e => e.id === id);
      if (ev?.recurrence?.type !== 'none') openDelDialog(id, parseDate(ev.date));
      else { const _did = id; events = events.filter(e => e.id !== _did); localStorage.setItem('calioEvents', JSON.stringify(events)); _fbDeleteEventDoc(_did); render(); }
    }

    // ══════════════════════════════════════════
    // DELETE DIALOG
    // ══════════════════════════════════════════
    function openDelDialog(id, date) {
      delTargetId = id; delTargetDate = date;
      const ev = events.find(e => e.id === id);
      document.getElementById('del-ev-name').textContent = ev ? ev.title : '';
      document.querySelector('input[name="del-scope"][value="this"]').checked = true;
      document.getElementById('del-overlay').classList.add('open');
    }
    function closeDelDialog() { document.getElementById('del-overlay').classList.remove('open'); delTargetId = null; delTargetDate = null; }
    function confirmDelete() {
      if (!delTargetId) return;
      const ev = events.find(e => e.id === delTargetId); if (!ev) { closeDelDialog(); return; }
      const scope = document.querySelector('input[name="del-scope"]:checked').value;
      if (scope === 'all') { events = events.filter(e => e.id !== delTargetId); _fbDeleteEventDoc(delTargetId); }
      else if (scope === 'this' && delTargetDate) { if (!ev.exceptions) ev.exceptions = []; ev.exceptions.push(fmtDate(delTargetDate)); _fbPushEvent(ev); }
      else if (scope === 'future' && delTargetDate) { if (!ev.recurrence) ev.recurrence = {}; ev.recurrence.endType = 'on'; ev.recurrence.endDate = fmtDate(addDays(delTargetDate, -1)); _fbPushEvent(ev); }
      else { events = events.filter(e => e.id !== delTargetId); _fbDeleteEventDoc(delTargetId); }
      localStorage.setItem('calioEvents', JSON.stringify(events));
      closeDelDialog(); closePopup(); render();
    }

    // ══════════════════════════════════════════
    // COPY
    // ══════════════════════════════════════════
    function openCopyModal(id) { copySourceId = id; const ev = events.find(e => e.id === id); document.getElementById('copy-ev-name').textContent = ev ? ev.title : ''; document.getElementById('copy-date').value = fmtDate(today); document.getElementById('copy-overlay').classList.add('open'); }
    function closeCopyModal() { document.getElementById('copy-overlay').classList.remove('open'); copySourceId = null; }
    function confirmCopy() {
      if (!copySourceId) return;
      const ev = events.find(e => e.id === copySourceId); if (!ev) return;
      const nd = document.getElementById('copy-date').value; if (!nd) return;
      const newEv = { ...ev, id: uuid(), date: nd, endDate: null, recurrence: { type: 'none' }, exceptions: [] };
      events.push(newEv);
      localStorage.setItem('calioEvents', JSON.stringify(events)); _fbPushEvent(newEv);
      closeCopyModal(); closePopup(); render();
      showToast(`Copied "${ev.title}" to ${nd}`);
    }

    // ══════════════════════════════════════════
    // EVENT POPUP
    // ══════════════════════════════════════════
    function showPopup(id, date, e) {
      closePopup();
      const ev = events.find(x => x.id === id); if (!ev) return;
      popupEventId = id; popupEventDate = date;
      const p = document.getElementById('event-popup');
      const cal = calendars.find(c => c.id === (ev.calendarId || 'default'));
      const color = ev.color || (cal ? cal.color : COLORS[0].hex);
      document.getElementById('ep-color').style.background = color;
      document.getElementById('ep-title').textContent = ev.title;
      const dt = date instanceof Date ? date : parseDate(ev.date);
      document.getElementById('ep-date-meta').textContent = '📅 ' + DAYS[dt.getDay()] + ', ' + MONTHS[dt.getMonth()] + ' ' + dt.getDate() + ', ' + dt.getFullYear();
      const dispStart = formatTzTime(ev.start) || ev.start;
      const dispEnd = formatTzTime(ev.end) || ev.end;
      document.getElementById('ep-time-meta').textContent = ev.allDay ? '🗓 All day' : `🕐 ${dispStart || ''} – ${dispEnd || ''}`;
      const rs = recurSummary(ev);
      const badge = document.getElementById('ep-recur-badge');
      if (rs) { badge.style.display = 'inline-flex'; document.getElementById('ep-recur-text').textContent = rs; } else { badge.style.display = 'none'; }
      // Reminder
      const rb = document.getElementById('ep-reminder-badge');
      if (ev.reminder != null) { rb.style.display = 'inline-flex'; document.getElementById('ep-reminder-text').textContent = ev.reminder === 0 ? 'At event time' : `${ev.reminder < 60 ? ev.reminder + ' min' : ev.reminder / 60 + ' hr'} before`; }
      else rb.style.display = 'none';
      // Label
      const lblBadge = document.getElementById('ep-label-badge');
      if (ev.labelId) { const lbl = labels.find(l => l.id === ev.labelId); if (lbl) { lblBadge.style.display = 'inline-flex'; lblBadge.style.background = lbl.color + '22'; lblBadge.style.color = lbl.color; document.getElementById('ep-label-dot').style.background = lbl.color; document.getElementById('ep-label-text').textContent = lbl.name; } else lblBadge.style.display = 'none'; }
      else lblBadge.style.display = 'none';
      // Calendar
      const calBadge = document.getElementById('ep-cal-badge');
      if (cal && cal.id !== 'default') { calBadge.style.display = 'inline-flex'; document.getElementById('ep-cal-dot').style.background = cal.color; document.getElementById('ep-cal-text').textContent = cal.name; }
      else calBadge.style.display = 'none';
      // Description
      const desc = document.getElementById('ep-desc');
      if (ev.description) { desc.textContent = ev.description; desc.style.display = 'block'; } else desc.style.display = 'none';
      p.classList.add('open');
      const px = Math.min(e.clientX + 12, window.innerWidth - 300);
      const py = Math.min(e.clientY + 12, window.innerHeight - 280);
      p.style.left = px + 'px'; p.style.top = py + 'px';
    }
    function closePopup() { document.getElementById('event-popup').classList.remove('open'); popupEventId = null; popupEventDate = null; }
    function editEventFromPopup() { if (popupEventId) openEditModal(popupEventId); }
    function copyEventFromPopup() { if (popupEventId) { closePopup(); openCopyModal(popupEventId); } }
    function deleteEventFromPopup() {
      if (!popupEventId) return;
      const ev = events.find(e => e.id === popupEventId);
      if (ev?.recurrence?.type !== 'none') { const d = popupEventDate; closePopup(); openDelDialog(ev.id, d); }
      else { const _pid = popupEventId; events = events.filter(e => e.id !== _pid); localStorage.setItem('calioEvents', JSON.stringify(events)); _fbDeleteEventDoc(_pid); closePopup(); render(); }
    }

    // ══════════════════════════════════════════
    // SEARCH
    // ══════════════════════════════════════════
    function handleSearch(q) {
      const wrap = document.getElementById('search-wrap');
      const res = document.getElementById('search-results');
      res.innerHTML = '';
      if (!q.trim()) { wrap.classList.remove('has-results'); return; }
      const inputEl = document.getElementById('search-input');
      const r = inputEl.getBoundingClientRect();
      res.style.top = (r.bottom + 6) + 'px';
      const left = Math.max(8, Math.min(r.left, window.innerWidth - 328));
      res.style.left = left + 'px';
      const ql = q.toLowerCase();
      let anyResult = false;

      // ── Events ──
      const evMatches = events.filter(ev => (ev.title || '').toLowerCase().includes(ql) || (ev.description || '').toLowerCase().includes(ql));
      if (evMatches.length) {
        anyResult = true;
        const sec = document.createElement('div'); sec.className = 'io-section-label'; sec.textContent = 'Events'; res.appendChild(sec);
        evMatches.slice(0, 6).forEach(ev => {
          const cal = calendars.find(c => c.id === (ev.calendarId || 'default'));
          const color = ev.color || (cal ? cal.color : COLORS[0].hex);
          // For recurring events: find next upcoming occurrence >= today
          let displayDate = ev.date;
          let jumpDate = parseDate(ev.date);
          const isRecurring = ev.recurrence && ev.recurrence.type !== 'none';
          if (isRecurring) {
            // Find next occurrence on or after today
            let d = new Date(today); d.setHours(0, 0, 0, 0);
            let found = false;
            for (let i = 0; i < 730; i++) {
              if (occursOnDate(ev, d)) { jumpDate = new Date(d); displayDate = fmtDate(d); found = true; break; }
              d.setDate(d.getDate() + 1);
            }
            // If no future occurrence found (ended), fall back to the original date
            if (!found) { jumpDate = parseDate(ev.date) || new Date(today); displayDate = ev.date; }
          }
          const item = document.createElement('div'); item.className = 'sr-item';
          item.style.borderLeft = `3px solid ${color}`;
          item.innerHTML = `<div class="sr-title">${ev.title || '(no title)'}${isRecurring ? ' <span style="font-size:0.65rem;color:var(--text3)">↻</span>' : ''}</div><div class="sr-meta">${displayDate}${ev.start ? ' · ' + fmt12hr(ev.start) : ''}</div>`;
          item.onclick = () => {
            document.getElementById('search-input').value = ''; wrap.classList.remove('has-results'); collapseSearch();
            cursor = new Date(jumpDate.getFullYear(), jumpDate.getMonth(), 1); setView('month');
            setTimeout(() => showPopup(ev.id, jumpDate, { clientX: window.innerWidth / 2, clientY: 200 }), 100);
          };
          res.appendChild(item);
        });
      }

      // ── Journal ──
      const jMatches = journalEntries.filter(e => (e.text || '').toLowerCase().includes(ql) || (e.title || '').toLowerCase().includes(ql) || (e.tags || []).some(t => t.toLowerCase().includes(ql)));
      if (jMatches.length) {
        anyResult = true;
        const sec = document.createElement('div'); sec.className = 'io-section-label'; sec.style.marginTop = '4px'; sec.textContent = 'Journal'; res.appendChild(sec);
        jMatches.slice(0, 4).forEach(e => {
          const item = document.createElement('div'); item.className = 'sr-item';
          item.style.borderLeft = '3px solid var(--accent)';
          const snippet = (e.text || '').slice(0, 80).trim();
          item.innerHTML = `<div class="sr-title">📓 ${e.date}</div><div class="sr-meta">${snippet ? snippet + '…' : '(empty)'}</div>`;
          item.onclick = () => {
            document.getElementById('search-input').value = ''; wrap.classList.remove('has-results'); collapseSearch();
            openWsPanelToDate(e.date);
          };
          res.appendChild(item);
        });
      }

      // ── Notes ──
      const nMatches = notes.filter(n => (n.title || '').toLowerCase().includes(ql) || (n.body || '').toLowerCase().includes(ql) || (n.tags || []).some(t => t.toLowerCase().includes(ql)));
      if (nMatches.length) {
        anyResult = true;
        const sec = document.createElement('div'); sec.className = 'io-section-label'; sec.style.marginTop = '4px'; sec.textContent = 'Notes'; res.appendChild(sec);
        nMatches.slice(0, 4).forEach(n => {
          const item = document.createElement('div'); item.className = 'sr-item';
          item.style.borderLeft = `3px solid ${n.color || 'var(--text3)'}`;
          item.innerHTML = `<div class="sr-title">📝 ${n.title || 'Untitled'}</div><div class="sr-meta">${(n.body || '').slice(0, 60).trim() + '…'}</div>`;
          item.onclick = () => {
            document.getElementById('search-input').value = ''; wrap.classList.remove('has-results'); collapseSearch();
            if (!wsPanelOpen) toggleWsPanel();
            wsTab = 'notes'; switchWsTab('notes');
            setTimeout(() => openNoteEditor(n.id), 120);
          };
          res.appendChild(item);
        });
      }

      // ── Todos ──
      const todoMatches = [];
      todoLists.forEach(l => (l.items || []).forEach(i => { if ((i.text || '').toLowerCase().includes(ql)) todoMatches.push({ list: l, item: i }); }));
      if (todoMatches.length) {
        anyResult = true;
        const sec = document.createElement('div'); sec.className = 'io-section-label'; sec.style.marginTop = '4px'; sec.textContent = 'Todos'; res.appendChild(sec);
        todoMatches.slice(0, 4).forEach(({ list, item }) => {
          const it = document.createElement('div'); it.className = 'sr-item';
          it.style.borderLeft = `3px solid ${list.color || COLORS[0].hex}`;
          it.innerHTML = `<div class="sr-title">✅ ${item.text}</div><div class="sr-meta">${list.name}${item.done ? ' · Done' : ''}</div>`;
          it.onclick = () => {
            document.getElementById('search-input').value = ''; wrap.classList.remove('has-results'); collapseSearch();
            if (!wsPanelOpen) toggleWsPanel();
            switchWsTab('todos');
          };
          res.appendChild(it);
        });
      }

      if (!anyResult) {
        const e = document.createElement('div'); e.className = 'sr-empty'; e.textContent = 'No results found'; res.appendChild(e);
      }
      wrap.classList.add('has-results');
    }
    function toggleSearch() {
      const wrap = document.getElementById('search-wrap');
      const inp = document.getElementById('search-input');
      if (wrap.classList.contains('expanded')) { collapseSearch(); }
      else { wrap.classList.remove('icon-mode'); wrap.classList.add('expanded'); inp.focus(); }
    }
    function collapseSearch() {
      const wrap = document.getElementById('search-wrap');
      const inp = document.getElementById('search-input');
      // Blur whichever element has focus (could be button or input)
      if (document.activeElement) document.activeElement.blur();
      wrap.classList.remove('expanded'); wrap.classList.add('icon-mode');
      wrap.classList.remove('has-results');
      inp.value = '';
      document.getElementById('search-results').innerHTML = '';
    }
    // Close search on outside click is handled in the main click listener

    // ══════════════════════════════════════════
    // DRAG & DROP
    // ══════════════════════════════════════════
    function startDrag(evId, dateStr, e) {
      dragEventId = evId; dragStartDate = dateStr; isDragging = true;
      const ev = events.find(x => x.id === evId);
      // Show ghost label
      const ghost = document.getElementById('drag-ghost');
      ghost.textContent = ev ? ev.title : 'Event'; ghost.style.display = 'block';
      if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setDragImage(ghost, 0, 0); }
      setTimeout(() => { ghost.style.display = 'none'; }, 0);
      document.getElementById('calendar-area').addEventListener('dragover', trackDragGhost);
    }
    function trackDragGhost(e) {
      const ghost = document.getElementById('drag-ghost');
      ghost.style.display = 'block'; ghost.style.left = (e.clientX + 12) + 'px'; ghost.style.top = (e.clientY + 12) + 'px';
    }
    function endDrag() {
      isDragging = false; dragEventId = null; dragStartDate = null;
      document.getElementById('drag-ghost').style.display = 'none';
      document.getElementById('calendar-area').removeEventListener('dragover', trackDragGhost);
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    }
    function handleDrop(targetDateStr) {
      if (!dragEventId || !dragStartDate || dragStartDate === targetDateStr) return endDrag();
      const ev = events.find(e => e.id === dragEventId); if (!ev) return endDrag();
      // For recurring events, just move the base date; show toast warning
      const wasRecurring = ev.recurrence && ev.recurrence.type !== 'none';
      ev.date = targetDateStr;
      if (ev.endDate) {
        // Shift end date by same delta
        const startD = parseDate(dragStartDate), endD = parseDate(ev.endDate), targetD = parseDate(targetDateStr);
        const delta = Math.round((targetD - startD) / (1000 * 60 * 60 * 24));
        ev.endDate = fmtDate(addDays(endD, delta));
      }
      localStorage.setItem('calioEvents', JSON.stringify(events));
      _fbPushEvent(ev);
      render();
      showToast(wasRecurring ? `Moved "${ev.title}" (all occurrences shifted)` : `Moved "${ev.title}" to ${targetDateStr}`);
      endDrag();
    }

    // ══════════════════════════════════════════
    // TOUCH SUPPORT
    // ══════════════════════════════════════════
    function handleTouchStart(e, dateStr) {
      touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now(); touchDate = dateStr;
      longPressTimer = setTimeout(() => {
        if (touchDate) openModal(touchDate);
        navigator.vibrate && navigator.vibrate(40);
      }, 500);
    }
    function handleTouchMove(e) {
      const dx = Math.abs(e.touches[0].clientX - touchStartX);
      const dy = Math.abs(e.touches[0].clientY - touchStartY);
      if (dx > 8 || dy > 8) clearTimeout(longPressTimer);
    }
    function handleTouchEnd(e) {
      clearTimeout(longPressTimer);
      const dt = Date.now() - touchStartTime;
      const dx = Math.abs(e.changedTouches[0].clientX - touchStartX);
      // Swipe navigation
      if (dt < 400 && dx > 50) {
        const dir = e.changedTouches[0].clientX < touchStartX ? 1 : -1;
        navigate(dir);
      }
    }
    // Add swipe to main body for navigation in all views
    document.getElementById('calendar-area').addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; touchStartTime = Date.now(); }, { passive: true });
    document.getElementById('calendar-area').addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
      const dt = Date.now() - touchStartTime;
      if (dt < 400 && Math.abs(dx) > 60 && dy < 60) navigate(dx < 0 ? 1 : -1);
    }, { passive: true });

    // ── Scroll navigation ──
    // Debounce to fire once per deliberate scroll gesture
    let wheelCooldown = false;
    function wheelCooldownFn() { wheelCooldown = false; }
    document.getElementById('calendar-area').addEventListener('wheel', e => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      const inTimeGrid = e.target.closest('.week-body,.day-body');

      if (view === 'month') {
        // Vertical scroll → previous/next month
        if (absY < 20) return;
        if (wheelCooldown) return;
        e.preventDefault();
        navigate(e.deltaY > 0 ? 1 : -1);
        wheelCooldown = true; setTimeout(wheelCooldownFn, 600);
      } else {
        // week / day / year: horizontal scroll (trackpad two-finger swipe)
        // Shift+vertical scroll for mice too
        const delta = absX > absY ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
        if (Math.abs(delta) < 20) {
          // Pure vertical scroll inside time grid → pass through for time scrolling
          return;
        }
        if (wheelCooldown) return;
        e.preventDefault();
        navigate(delta > 0 ? 1 : -1);
        wheelCooldown = true; setTimeout(wheelCooldownFn, 500);
      }
    }, { passive: false });

    // ══════════════════════════════════════════
    // CALENDARS CRUD
    // ══════════════════════════════════════════
    let selectedCalColorLocal = COLORS[0].hex;
    function buildCalColorPicker(sel) {
      const cp = document.getElementById('cal-color-picker'); cp.innerHTML = '';
      COLORS.forEach(c => {
        const sw = document.createElement('div'); sw.className = 'label-color-sw' + (sel === c.hex ? ' selected' : '');
        sw.style.background = c.hex; sw.onclick = () => { selectedCalColorLocal = c.hex; buildCalColorPicker(c.hex); };
        cp.appendChild(sw);
      });
    }
    function openCalModal(id) {
      editingCalId = id;
      const cal = id ? calendars.find(c => c.id === id) : null;
      document.getElementById('cal-modal-title').textContent = id ? 'Edit Calendar' : 'New Calendar';
      document.getElementById('cal-name').value = cal ? cal.name : '';
      selectedCalColorLocal = cal ? cal.color : COLORS[0].hex;
      buildCalColorPicker(selectedCalColorLocal);
      const actions = document.getElementById('cal-modal-actions');
      if (id && id !== 'default') actions.innerHTML = `<button class="btn-delete" onclick="deleteCalendar('${id}')">Delete</button><button class="btn-cancel" onclick="closeCalModal()">Cancel</button><button class="btn-save" onclick="saveCalendar()">Save</button>`;
      else actions.innerHTML = `<button class="btn-cancel" onclick="closeCalModal()">Cancel</button><button class="btn-save" onclick="saveCalendar()">Save Calendar</button>`;
      document.getElementById('cal-overlay').classList.add('open');
      setTimeout(() => document.getElementById('cal-name').focus(), 80);
    }
    function closeCalModal() { document.getElementById('cal-overlay').classList.remove('open'); editingCalId = null; }

    // Called from event modal — open cal create, then re-open event modal with new cal selected
    function openCalModalFromEvent() {
      // Snapshot current event form state so we can restore it
      const snap = snapshotEventForm();
      openCalModal(null);
      // After saveCalendar completes, reopen event modal with the new calendar selected
      const _origSaveCal = saveCalendar;
      saveCalendar = function () {
        _origSaveCal.call(this);
        saveCalendar = _origSaveCal; // restore
        restoreEventForm(snap);
        // Select the newly created calendar
        const newCal = calendars[calendars.length - 1];
        if (newCal) { populateCalendarDropdown(newCal.id); }
        document.getElementById('modal-overlay').classList.add('open');
      };
    }
    // Called from event modal — open label create, then re-open event modal with new label selected
    function openLabelModalFromEvent() {
      const snap = snapshotEventForm();
      openLabelModal(null);
      const _origSaveLbl = saveLabel;
      saveLabel = function () {
        _origSaveLbl.call(this);
        saveLabel = _origSaveLbl;
        restoreEventForm(snap);
        const newLbl = labels[labels.length - 1];
        if (newLbl) { populateLabelDropdown(newLbl.id); }
        document.getElementById('modal-overlay').classList.add('open');
      };
    }
    function snapshotEventForm() {
      return {
        title: document.getElementById('ev-title').value,
        date: document.getElementById('ev-date').value,
        endDate: document.getElementById('ev-end-date').value,
        allDay: document.getElementById('ev-allday').value,
        start: document.getElementById('ev-start').value,
        end: document.getElementById('ev-end').value,
        desc: document.getElementById('ev-desc').value,
        label: document.getElementById('ev-label').value,
        calendar: document.getElementById('ev-calendar').value,
        reminder: document.getElementById('ev-reminder').value,
        recurType: document.getElementById('ev-recur-type').value,
        recurInterval: document.getElementById('ev-recur-interval').value,
        recurEndType: document.getElementById('ev-recur-end-type').value,
        recurEndDate: document.getElementById('ev-recur-end-date').value,
        recurCount: document.getElementById('ev-recur-count').value,
        editingId,
      };
    }
    function restoreEventForm(snap) {
      editingId = snap.editingId;
      document.getElementById('modal-title').textContent = editingId ? 'Edit Event' : 'New Event';
      document.getElementById('ev-title').value = snap.title;
      document.getElementById('ev-date').value = snap.date;
      document.getElementById('ev-end-date').value = snap.endDate;
      document.getElementById('ev-allday').value = snap.allDay;
      document.getElementById('ev-start').value = snap.start;
      document.getElementById('ev-end').value = snap.end;
      document.getElementById('ev-desc').value = snap.desc;
      document.getElementById('ev-reminder').value = snap.reminder;
      document.getElementById('ev-recur-type').value = snap.recurType;
      document.getElementById('ev-recur-interval').value = snap.recurInterval;
      document.getElementById('ev-recur-end-type').value = snap.recurEndType;
      document.getElementById('ev-recur-end-date').value = snap.recurEndDate;
      document.getElementById('ev-recur-count').value = snap.recurCount;
      populateCalendarDropdown(snap.calendar);
      populateLabelDropdown(snap.label);
      toggleTimeFields(); onRecurTypeChange(); onRecurEndChange();
      document.getElementById('modal-actions').innerHTML = editingId
        ? `<button class="btn-delete" onclick="handleDeleteEdit('${editingId}')">Delete</button><button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="saveEvent()">Save Changes</button>`
        : `<button class="btn-cancel" onclick="closeModal()">Cancel</button><button class="btn-save" onclick="saveEvent()">Save Event</button>`;
    }
    function saveCalendar() {
      const name = document.getElementById('cal-name').value.trim();
      if (!name) { document.getElementById('cal-name').style.borderColor = 'var(--red)'; setTimeout(() => document.getElementById('cal-name').style.borderColor = '', 1500); return; }
      if (editingCalId) { const c = calendars.find(x => x.id === editingCalId); if (c) { c.name = name; c.color = selectedCalColorLocal; } }
      else calendars.push({ id: uuid(), name, color: selectedCalColorLocal, visible: true });
      saveCalendars(); closeCalModal(); render();
    }
    function deleteCalendar(id) {
      events.forEach(ev => { if (ev.calendarId === id) { ev.calendarId = 'default'; _fbPushEvent(ev); } });
      localStorage.setItem('calioEvents', JSON.stringify(events));
      calendars = calendars.filter(c => c.id !== id);
      saveCalendars(); closeCalModal(); render();
    }

    // ══════════════════════════════════════════
    // LABELS CRUD
    // ══════════════════════════════════════════
    let selectedLabelColorLocal = COLORS[1].hex;
    function buildLabelColorPicker() {
      const cp = document.getElementById('label-color-picker'); cp.innerHTML = '';
      COLORS.forEach(c => { const sw = document.createElement('div'); sw.className = 'label-color-sw' + (selectedLabelColorLocal === c.hex ? ' selected' : ''); sw.style.background = c.hex; sw.onclick = () => { selectedLabelColorLocal = c.hex; buildLabelColorPicker(); }; cp.appendChild(sw); });
    }
    function openLabelModal(id) {
      editingLabelId = id;
      const lbl = id ? labels.find(l => l.id === id) : null;
      document.getElementById('label-modal-title').textContent = id ? 'Edit Label' : 'New Label';
      document.getElementById('lbl-name').value = lbl ? lbl.name : '';
      selectedLabelColorLocal = lbl ? lbl.color : COLORS[1].hex;
      buildLabelColorPicker();
      const actions = document.getElementById('label-modal-actions');
      if (id) actions.innerHTML = `<button class="btn-delete" onclick="deleteLabel('${id}')">Delete</button><button class="btn-cancel" onclick="closeLabelModal()">Cancel</button><button class="btn-save" onclick="saveLabel()">Save</button>`;
      else actions.innerHTML = `<button class="btn-cancel" onclick="closeLabelModal()">Cancel</button><button class="btn-save" onclick="saveLabel()">Save Label</button>`;
      document.getElementById('label-overlay').classList.add('open');
      setTimeout(() => document.getElementById('lbl-name').focus(), 80);
    }
    function closeLabelModal() { document.getElementById('label-overlay').classList.remove('open'); editingLabelId = null; }
    function saveLabel() {
      const name = document.getElementById('lbl-name').value.trim();
      if (!name) { document.getElementById('lbl-name').style.borderColor = 'var(--red)'; setTimeout(() => document.getElementById('lbl-name').style.borderColor = '', 1500); return; }
      let pushLbl;
      if (editingLabelId) { const lbl = labels.find(l => l.id === editingLabelId); if (lbl) { lbl.name = name; lbl.color = selectedLabelColorLocal; pushLbl = lbl; } }
      else { const newLbl = { id: uuid(), name, color: selectedLabelColorLocal, visible: true }; labels.push(newLbl); pushLbl = newLbl; }
      saveLabels(); if (pushLbl) _fbPushLabel(pushLbl); closeLabelModal(); render();
    }
    function deleteLabel(id) {
      events.forEach(ev => { if (ev.labelId === id) { ev.labelId = null; _fbPushEvent(ev); } });
      localStorage.setItem('calioEvents', JSON.stringify(events));
      labels = labels.filter(l => l.id !== id); saveLabels(); _fbDeleteLabelDoc(id); closeLabelModal(); render();
    }

    // ══════════════════════════════════════════
    // HABITS CRUD
    // ══════════════════════════════════════════
    let selectedHabitColorLocal = COLORS[2].hex;
    function buildHabitColorPicker() {
      const cp = document.getElementById('habit-color-picker'); cp.innerHTML = '';
      COLORS.forEach(c => { const sw = document.createElement('div'); sw.className = 'label-color-sw' + (selectedHabitColorLocal === c.hex ? ' selected' : ''); sw.style.background = c.hex; sw.onclick = () => { selectedHabitColorLocal = c.hex; buildHabitColorPicker(); }; cp.appendChild(sw); });
    }
    function openHabitModal(id) {
      editingHabitId = id;
      const h = id ? habits.find(x => x.id === id) : null;
      document.getElementById('habit-modal-title').textContent = id ? 'Edit Habit' : 'New Habit';
      document.getElementById('habit-name').value = h ? h.name : '';
      document.getElementById('habit-freq').value = h ? h.freq : 'daily';
      selectedHabitColorLocal = h ? h.color : COLORS[2].hex;
      buildHabitColorPicker();
      const actions = document.getElementById('habit-modal-actions');
      if (id) actions.innerHTML = `<button class="btn-delete" onclick="deleteHabit('${id}')">Delete</button><button class="btn-cancel" onclick="closeHabitModal()">Cancel</button><button class="btn-save" onclick="saveHabit()">Save</button>`;
      else actions.innerHTML = `<button class="btn-cancel" onclick="closeHabitModal()">Cancel</button><button class="btn-save" onclick="saveHabit()">Save Habit</button>`;
      document.getElementById('habit-overlay').classList.add('open');
      setTimeout(() => document.getElementById('habit-name').focus(), 80);
    }
    function closeHabitModal() { document.getElementById('habit-overlay').classList.remove('open'); editingHabitId = null; }
    function saveHabit() {
      const name = document.getElementById('habit-name').value.trim();
      if (!name) { document.getElementById('habit-name').style.borderColor = 'var(--red)'; setTimeout(() => document.getElementById('habit-name').style.borderColor = '', 1500); return; }
      const freq = document.getElementById('habit-freq').value;
      if (editingHabitId) { const h = habits.find(x => x.id === editingHabitId); if (h) { h.name = name; h.freq = freq; h.color = selectedHabitColorLocal; } }
      else habits.push({ id: uuid(), name, freq, color: selectedHabitColorLocal, completions: [] });
      saveHabits(); closeHabitModal(); render();
    }
    function deleteHabit(id) { habits = habits.filter(h => h.id !== id); saveHabits(); fbDeleteHabit(id); closeHabitModal(); render(); }

    // ══════════════════════════════════════════
    // REMINDERS / NOTIFICATIONS
    // ══════════════════════════════════════════
    function requestNotifPermission() {
      if (!('Notification' in window)) { showToast('Notifications not supported in this browser'); return; }
      Notification.requestPermission().then(p => {
        notifPermission = p;
        const el = document.getElementById('notif-status');
        if (el) el.textContent = p === 'granted' ? '✓ Enabled — you will receive reminders' : p === 'denied' ? 'Blocked by browser — enable in browser settings' : 'Permission not granted';
        if (p === 'granted') { showToast('Notifications enabled!'); scheduleAllReminders(); }
        else showToast('Notification permission ' + p);
      });
    }
    function scheduleAllReminders() {
      Object.values(reminderTimers).forEach(t => clearTimeout(t));
      reminderTimers = {};
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      events.forEach(ev => scheduleReminder(ev));
    }
    function scheduleReminder(ev) {
      if (ev.reminder == null || ev.allDay) return;
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      const dateStr = ev.date, timeStr = ev.start;
      if (!dateStr || !timeStr) return;
      const eventDt = new Date(dateStr + 'T' + timeStr + ':00');
      const remindAt = new Date(eventDt.getTime() - ev.reminder * 60000);
      const now = new Date();
      const delay = remindAt - now;
      if (delay < 0 || delay > 7 * 24 * 3600 * 1000) return; // only schedule within 7 days
      if (reminderTimers[ev.id]) clearTimeout(reminderTimers[ev.id]);
      reminderTimers[ev.id] = setTimeout(() => {
        const label = ev.reminder === 0 ? 'Starting now' : `In ${ev.reminder < 60 ? ev.reminder + ' minutes' : ev.reminder / 60 + ' hour(s)'}`;
        try {
          new Notification(ev.title, { body: `${label} · ${timeStr}`, icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%237c6af7"/></svg>' });
        } catch (e) { }
      }, delay);
    }

    // ══════════════════════════════════════════
    // THEME
    // ══════════════════════════════════════════
    function toggleTheme() {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(); savePrefs();
    }

    // ══════════════════════════════════════════
    // TIMEZONE
    // ══════════════════════════════════════════
    function populateTzSelect() {
      const sel = document.getElementById('tz-select'); if (!sel) return;
      sel.innerHTML = '<option value="">Use device timezone</option>';
      TZ_LIST.forEach(tz => { const o = document.createElement('option'); o.value = tz; o.textContent = tz.replace('_', ' '); if (tz === currentTz) o.selected = true; sel.appendChild(o); });
      updateTzLabel();
    }
    function onTzChange() {
      currentTz = document.getElementById('tz-select').value;
      savePrefs(); updateTzLabel(); render();
    }
    function updateTzLabel() {
      const el = document.getElementById('tz-current-label'); if (!el) return;
      try {
        const tz = currentTz || Intl.DateTimeFormat().resolvedOptions().timeZone;
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true });
        const offset = now.toLocaleTimeString('en-US', { timeZone: tz, timeZoneName: 'short' }).split(' ').pop();
        el.textContent = `Current time: ${time} (${offset})`;
      } catch { el.textContent = ''; }
    }

    // ══════════════════════════════════════════
    // SETTINGS MODAL
    // ══════════════════════════════════════════
    function openSettings() {
      document.getElementById('theme-toggle').checked = currentTheme === 'light';
      populateTzSelect();
      const ns = document.getElementById('notif-status');
      if (ns) {
        if (typeof Notification === 'undefined') ns.textContent = 'Not supported in this browser';
        else if (Notification.permission === 'granted') ns.textContent = '✓ Enabled';
        else if (Notification.permission === 'denied') ns.textContent = 'Blocked by browser';
        else ns.textContent = 'Click to enable';
      }
      // Mirror live sync state into mobile settings badge
      const srcDot = document.getElementById('sync-dot');
      const srcLbl = document.getElementById('sync-label');
      const mobDot = document.getElementById('mob-sync-dot');
      const mobLbl = document.getElementById('mob-sync-label');
      if (srcDot && mobDot) mobDot.className = srcDot.className;
      if (srcLbl && mobLbl) mobLbl.textContent = srcLbl.textContent;
      document.getElementById('settings-overlay').classList.add('open');
    }
    function closeSettings() { document.getElementById('settings-overlay').classList.remove('open'); }

    // ══════════════════════════════════════════
    // JUMP TO DATE
    // ══════════════════════════════════════════
    function openJumpToDate(btnEl) {
      const jw = document.getElementById('jump-wrapper');
      const dd = document.getElementById('jump-dropdown');
      const isOpen = jw.classList.contains('open');
      jw.classList.toggle('open', !isOpen);
      if (!isOpen) {
        // Find the button — either passed directly or the month-title click
        const btn = btnEl || document.querySelector('.jump-btn');
        if (btn) {
          const r = btn.getBoundingClientRect();
          dd.style.top = (r.bottom + 6) + 'px';
          // Centre under button, but clamp to viewport
          let left = r.left + r.width / 2 - 110;
          left = Math.max(8, Math.min(left, window.innerWidth - 236));
          dd.style.left = left + 'px';
        }
        const d = view === 'month' || view === 'year' ? new Date(cursor.getFullYear(), cursor.getMonth(), today.getDate()) : cursor;
        document.getElementById('jump-date-input').value = fmtDate(d);
        setTimeout(() => document.getElementById('jump-date-input').focus(), 60);
      }
    }
    function closeJumpDropdown() { document.getElementById('jump-wrapper').classList.remove('open'); }
    function confirmJump() {
      const val = document.getElementById('jump-date-input').value; if (!val) return;
      const d = new Date(val + 'T12:00:00'); if (isNaN(d)) return;
      cursor = view === 'month' || view === 'year' ? new Date(d.getFullYear(), d.getMonth(), 1) : new Date(d);
      closeJumpDropdown(); render();
    }

    // ══════════════════════════════════════════
    // IMPORT / EXPORT
    // ══════════════════════════════════════════
    function toggleIODropdown(e) {
      e.stopPropagation();
      const wrapper = document.getElementById('io-wrapper');
      const dd = document.getElementById('io-dropdown');
      const isOpen = wrapper.classList.contains('open');
      wrapper.classList.toggle('open', !isOpen);
      if (!isOpen) {
        const btn = e.currentTarget;
        const r = btn.getBoundingClientRect();
        dd.style.top = (r.bottom + 6) + 'px';
        dd.style.right = (window.innerWidth - r.right) + 'px';
      }
    }
    function downloadFile(content, filename, mime) {
      const blob = new Blob([content], { type: mime });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    }
    function exportJSON() {
      const data = { version: 2, exportedAt: new Date().toISOString(), events, labels, calendars };
      downloadFile(JSON.stringify(data, null, 2), 'calio-backup.json', 'application/json');
      showToast('Exported JSON backup');
    }
    function escapeICS(s) { return (s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
    function exportICS() {
      let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//CalIO//EN\r\n';
      events.forEach(ev => {
        ics += 'BEGIN:VEVENT\r\n';
        ics += `UID:${ev.id}@calio\r\n`;
        ics += `SUMMARY:${escapeICS(ev.title)}\r\n`;
        if (ev.description) ics += `DESCRIPTION:${escapeICS(ev.description)}\r\n`;
        const fmt = s => s.replace(/-/g, '');
        if (ev.allDay) {
          ics += `DTSTART;VALUE=DATE:${fmt(ev.date)}\r\n`;
          ics += `DTEND;VALUE=DATE:${fmt(ev.endDate || ev.date)}\r\n`;
        } else {
          const st = (ev.start || '09:00').replace(':', ''); const et = (ev.end || '10:00').replace(':', '');
          ics += `DTSTART:${fmt(ev.date)}T${st}00\r\n`;
          ics += `DTEND:${fmt(ev.date)}T${et}00\r\n`;
        }
        ics += 'END:VEVENT\r\n';
      });
      ics += 'END:VCALENDAR';
      downloadFile(ics, 'calio-events.ics', 'text/calendar');
      showToast('Exported .ics file');
    }
    function openImportModal(type) {
      importType = type; importedEventsBuffer = []; importMode = 'merge';
      document.getElementById('import-modal-title').textContent = type === 'json' ? 'Import JSON Backup' : 'Import .ics File';
      document.getElementById('import-preview').style.display = 'none';
      document.getElementById('import-confirm-btn').disabled = true;
      document.getElementById('import-confirm-btn').style.opacity = '0.4';
      document.getElementById('mode-merge').classList.add('selected'); document.getElementById('mode-replace').classList.remove('selected');
      document.getElementById('import-mode-desc').textContent = 'Add alongside existing events.';
      document.getElementById('dz-title').textContent = 'Click to choose a file';
      document.getElementById('io-wrapper').classList.remove('open');
      document.getElementById('import-overlay').classList.add('open');
    }
    function closeImportModal() { document.getElementById('import-overlay').classList.remove('open'); importedEventsBuffer = []; }
    function setImportMode(m) {
      importMode = m;
      document.getElementById('mode-merge').classList.toggle('selected', m === 'merge');
      document.getElementById('mode-replace').classList.toggle('selected', m === 'replace');
      document.getElementById('import-mode-desc').textContent = m === 'replace' ? 'Replace ALL existing events.' : 'Add alongside existing events.';
    }
    function triggerFileInput() { document.getElementById('file-input').click(); }
    document.getElementById('file-input').onchange = e => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => { processImportFile(file.name, ev.target.result); };
      reader.readAsText(file);
      e.target.value = '';
    };
    const dz = document.getElementById('import-drop-zone');
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
    dz.addEventListener('drop', e => {
      e.preventDefault(); dz.classList.remove('drag-over');
      const file = e.dataTransfer.files[0]; if (!file) return;
      const reader = new FileReader(); reader.onload = ev => processImportFile(file.name, ev.target.result); reader.readAsText(file);
    });
    function processImportFile(name, content) {
      document.getElementById('dz-title').textContent = name;
      try {
        if (name.endsWith('.json')) importedEventsBuffer = parseJSONImport(content);
        else importedEventsBuffer = parseICSImport(content);
        const pr = document.getElementById('import-preview');
        document.getElementById('ip-count').innerHTML = `<strong>${importedEventsBuffer.length}</strong> event${importedEventsBuffer.length !== 1 ? 's' : ''} found`;
        pr.style.display = 'block';
        const btn = document.getElementById('import-confirm-btn'); btn.disabled = false; btn.style.opacity = '1';
      } catch (e) { showToast('Failed to parse file: ' + e.message); }
    }
    function parseJSONImport(content) {
      const data = JSON.parse(content);
      if (data.labels && Array.isArray(data.labels)) { labels = data.labels; saveLabels(); }
      if (data.calendars && Array.isArray(data.calendars)) { calendars = data.calendars; saveCalendars(); }
      const evs = data.events || data;
      return evs.map(ev => ({ ...ev, id: importMode === 'merge' ? uuid() : ev.id }));
    }
    function parseICSImport(content) {
      const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
      const evts = []; let cur = null;
      lines.forEach(line => {
        if (line === 'BEGIN:VEVENT') { cur = {}; }
        else if (line === 'END:VEVENT' && cur) {
          if (cur.title) { evts.push({ id: uuid(), title: cur.title, date: cur.date || fmtDate(today), endDate: cur.endDate || null, allDay: cur.allDay || false, start: cur.start || null, end: cur.end || null, description: cur.desc || '', color: COLORS[0].hex, recurrence: { type: 'none' }, exceptions: [], calendarId: 'default' }); }
          cur = null;
        } else if (cur) {
          const [key, ...rest] = line.split(':'); const val = rest.join(':');
          if (key === 'SUMMARY') cur.title = val;
          else if (key === 'DESCRIPTION') cur.desc = val.replace(/\\n/g, '\n');
          else if (key.startsWith('DTSTART')) {
            if (key.includes('VALUE=DATE')) { cur.allDay = true; cur.date = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`; }
            else { cur.date = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`; cur.start = `${val.slice(9, 11)}:${val.slice(11, 13)}`; }
          }
          else if (key.startsWith('DTEND')) {
            if (key.includes('VALUE=DATE')) cur.endDate = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
            else cur.end = `${val.slice(9, 11)}:${val.slice(11, 13)}`;
          }
        }
      });
      return evts;
    }
    function confirmImport() {
      if (!importedEventsBuffer.length) return;
      if (importMode === 'replace') events = importedEventsBuffer;
      else events = [...events, ...importedEventsBuffer];
      localStorage.setItem('calioEvents', JSON.stringify(events));
      if (fbDb && currentRoom) {
        importedEventsBuffer.forEach(ev => fbSaveEvent(ev));
        labels.forEach(lbl => { const d = { ...lbl }; delete d.id; fbDb.collection('rooms').doc(currentRoom).collection('labels').doc(lbl.id).set(d); });
      }
      closeImportModal(); render();
      showToast(`${importMode === 'replace' ? 'Replaced with' : 'Imported'} ${importedEventsBuffer.length} event${importedEventsBuffer.length !== 1 ? 's' : ''}`);
    }

    // ══════════════════════════════════════════
    // TOAST
    // ══════════════════════════════════════════
    function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.style.opacity = '1'; clearTimeout(t._t); t._t = setTimeout(() => t.style.opacity = '0', 2800); }

    // ══════════════════════════════════════════
    // KEYBOARD & CLICK LISTENERS
    // ══════════════════════════════════════════
    document.addEventListener('click', e => {
      const p = document.getElementById('event-popup');
      if (p.classList.contains('open') && !p.contains(e.target)) closePopup();
      const iow = document.getElementById('io-wrapper');
      if (iow.classList.contains('open') && !iow.contains(e.target)) iow.classList.remove('open');
      const jw = document.getElementById('jump-wrapper');
      if (jw.classList.contains('open') && !jw.contains(e.target)) closeJumpDropdown();
      const sw = document.getElementById('search-wrap');
      if (!sw.contains(e.target)) { sw.classList.remove('has-results'); }
    });
    document.addEventListener('keydown', e => {
      // Never intercept when the user is typing in a field
      const _t = e.target.tagName.toLowerCase();
      const _inField = _t === 'input' || _t === 'textarea' || _t === 'select' || e.target.isContentEditable;

      if (e.key === 'Escape') {
        // Note editor has highest priority — escape inside it should only close it
        if (document.getElementById('journal-overlay').style.display === 'flex') { closeJournalEditor(); return; }
        if (document.getElementById('note-overlay').style.display !== 'none') { closeNoteEditor(); return; }
        // Todo list modal
        if (document.getElementById('todolist-overlay').classList.contains('open')) { closeTodoListModal(); return; }
        const anyOpen = [
          document.getElementById('modal-overlay'), document.getElementById('copy-overlay'),
          document.getElementById('del-overlay'), document.getElementById('import-overlay'),
          document.getElementById('label-overlay'), document.getElementById('cal-overlay'),
          document.getElementById('habit-overlay'), document.getElementById('settings-overlay'),
          document.getElementById('room-overlay'), document.getElementById('fb-setup-overlay'),
        ].some(el => el && el.classList.contains('open'));
        const dropOpen = document.getElementById('io-wrapper').classList.contains('open') || document.getElementById('jump-wrapper').classList.contains('open');
        const popOpen = document.getElementById('event-popup').classList.contains('open');
        if (anyOpen || dropOpen || popOpen) {
          closeModal(); closePopup(); closeCopyModal(); closeDelDialog(); closeImportModal();
          closeLabelModal(); closeCalModal(); closeHabitModal(); closeSettings(); closeRoomModal(); closeFbSetup();
          document.getElementById('io-wrapper').classList.remove('open'); closeJumpDropdown();
          collapseSearch();
        } else { toggleSidebar(); }
        return;
      }
      // Backspace = toggle workspace panel (month view only, no overlay open)
      if (e.key === 'Backspace' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) && document.activeElement?.contentEditable !== 'true' && !document.activeElement?.closest('.note-editor-modal')) {
        const anyOpen = [
          document.getElementById('modal-overlay'), document.getElementById('note-overlay'),
          document.getElementById('todolist-overlay'), document.getElementById('event-popup'),
        ].some(el => el && (el.classList.contains('open') || el.style.display === 'flex'));
        if (!anyOpen) { e.preventDefault(); toggleWsPanel(); }
      }
      // ── Single-key shortcuts — skip when typing ──
      if (_inField) return;
      // N — New event
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        const modalOpen = document.getElementById('modal-overlay') && document.getElementById('modal-overlay').classList.contains('open');
        if (!modalOpen) openModal();
        return;
      }
      // J — Toggle Journal / workspace panel
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        toggleWsPanel();
        return;
      }
      // G — Jump to date
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        openJumpToDate(document.getElementById('main-title'));
        return;
      }
      // / — Search
      if (e.key === '/') {
        e.preventDefault();
        toggleSearch();
        return;
      }
      // T — Go to today
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        goToday();
        return;
      }
      // Alt+Arrow — prev / next period
      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); navigate(-1); return; }
      if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); navigate(1); return; }
      // 1–5 — Switch views
      if (!e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') { e.preventDefault(); setView('month'); return; }
        if (e.key === '2') { e.preventDefault(); setView('week'); return; }
        if (e.key === '3') { e.preventDefault(); setView('day'); return; }
        if (e.key === '4') { e.preventDefault(); setView('year'); return; }
        if (e.key === '5') { e.preventDefault(); setView('agenda'); return; }
      }
    });
    setInterval(() => { if (view === 'week' || view === 'day') renderCalendar(); today = new Date(); }, 60000);

    // ══════════════════════════════════════════
    // WORKSPACE PANEL  (Journal · Notes · Todos)
    // ══════════════════════════════════════════

    // ── Panel control ──
    function toggleWsPanel() {
      wsPanelOpen = !wsPanelOpen;
      document.getElementById('ws-panel').classList.toggle('open', wsPanelOpen);
      document.getElementById('ws-panel-btn').classList.toggle('active', wsPanelOpen);
      if (wsPanelOpen) {
        // Default journal to today when opening without a selected date
        if (wsTab === 'journal' && !wsDateCtx) {
          wsDateCtx = fmtDate(today); saveWsCtx();
          selectedDay = wsDateCtx;
        }
        renderWsPanel();
        // Highlight today cell if selecting today
        if (selectedDay) {
          setTimeout(() => {
            document.querySelectorAll('.day-cell.selected').forEach(c => c.classList.remove('selected'));
            const cell = document.querySelector('[data-date="' + selectedDay + '"]');
            if (cell) cell.classList.add('selected');
          }, 50);
        }
      }
    }
    function closeWsPanel() {
      wsPanelOpen = false;
      wsDateCtx = null;
      selectedDay = null;
      document.getElementById('ws-panel').classList.remove('open');
      document.getElementById('ws-panel-btn').classList.remove('active');
      // Remove day selection highlight
      document.querySelectorAll('.day-cell.selected').forEach(c => c.classList.remove('selected'));
    }
    function switchWsTab(tab) {
      wsTab = tab;
      ['journal', 'notes', 'todos'].forEach(t => {
        document.getElementById('ws-tab-' + t).classList.toggle('active', t === tab);
      });
      renderWsPanel();
    }
    function wsNewItem() {
      if (wsTab === 'journal') newJournalEntry(wsDateCtx);
      else if (wsTab === 'notes') openNoteEditor(null);
      else openTodoListModal(null);
    }
    function renderWsPanel() {
      const body = document.getElementById('ws-body');
      document.getElementById('ws-header-title').textContent =
        wsTab === 'journal' ? 'Journal' : wsTab === 'notes' ? 'Notes' : 'To-do Lists';
      if (wsTab === 'journal') renderJournal(body);
      else if (wsTab === 'notes') renderNotes(body);
      else renderTodos(body);
    }
    // Open WS panel navigated to a specific date
    function openWsPanelToDate(dateStr) {
      wsDateCtx = dateStr; saveWsCtx();
      if (!wsPanelOpen) {
        toggleWsPanel();
      } else {
        renderWsPanel();
      }
    }
    function clearWsDateCtx() {
      wsDateCtx = null; saveWsCtx();
      selectedDay = null;
      document.querySelectorAll('.day-cell.selected').forEach(c => c.classList.remove('selected'));
      renderWsPanel();
    }

    // ══════════════════════════════════════════
    // JOURNAL
    // ══════════════════════════════════════════
    const MOODS = ['😊', '😐', '😔', '😤', '🤩', '😴', '🥰', '😰'];

    function newJournalEntry(dateStr) {
      const ds = dateStr || fmtDate(today);
      const entry = { id: uuid(), date: ds, text: '', mood: null, tags: [], createdAt: Date.now() };
      journalEntries.push(entry);
      journalEntries.sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      saveJournal();
      if (fbDb && currentRoom) fbSaveJournalEntry(entry);
      // Inject card into DOM without full re-render (preserves focus in existing textareas)
      const body = document.getElementById('ws-body');
      if (body && wsTab === 'journal' && wsPanelOpen) {
        const todayStr = fmtDate(today);
        const card = buildJournalCard(entry, todayStr, true, true);
        // Find the add-btn and insert before it
        const addBtn = body.querySelector('.journal-new-btn');
        if (addBtn) body.insertBefore(card, addBtn);
        else body.appendChild(card);
      } else {
        renderWsPanel();
      }
      // Open in overlay editor immediately
      setTimeout(() => openJournalEditor(entry.id), 60);
    }

    function buildJournalCard(entry, todayStr, forceExpand, inDateCtx) {
      const wc = entry.text.trim() ? entry.text.trim().split(/\s+/).length : 0;
      const fmtDs = ds => { const d = parseDate(ds); return d ? DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate() + ', ' + d.getFullYear() : ds; };
      const entryTime = entry.createdAt
        ? new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        : '';
      const timeLabel = inDateCtx ? entryTime : fmtDs(entry.date);
      const titleLabel = entry.title || '';
      const snippet = (entry.text || '').trim().slice(0, 60);
      const tags = (entry.tags || []).map(t => `<span class="journal-tag" style="pointer-events:none">${escHtml(t)}</span>`).join('');
      const card = document.createElement('div');
      card.className = 'journal-day-entry'; card.id = 'jcard-' + entry.id;
      card.onclick = () => openJournalEditor(entry.id);
      card.innerHTML = `
    <div style="padding:9px 12px 8px">
      <div style="display:flex;align-items:baseline;gap:6px;min-width:0">
        <div style="font-size:0.82rem;font-weight:600;color:var(--text);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${titleLabel ? escHtml(titleLabel) : '<span style="color:var(--text3);font-weight:400;font-style:italic">Untitled entry</span>'}
        </div>
        ${entry.mood ? `<span style="font-size:0.75rem;flex-shrink:0">${entry.mood}</span>` : ''}
        <span style="font-size:0.62rem;color:var(--text3);flex-shrink:0;white-space:nowrap">${timeLabel}</span>
      </div>
      <div style="font-size:0.65rem;color:var(--text3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
        ${wc ? wc + ' words' : 'Empty'}${snippet && !titleLabel ? ' · ' + escHtml(snippet.slice(0, 50)) : ''}
      </div>
      ${tags ? `<div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:5px">${tags}</div>` : ''}
    </div>`;
      return card;
    }

    // ── JOURNAL EDITOR OVERLAY FUNCTIONS ──
    function openJournalEditor(id) {
      editingJournalId = id;
      const entry = id ? journalEntries.find(e => e.id === id) : null;
      const fmtDs = ds => { const d = parseDate(ds); return d ? DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate() + ', ' + d.getFullYear() : ds; };
      document.getElementById('je-ov-title').value = entry?.title || '';
      document.getElementById('je-ov-ta').value = entry?.text || '';
      document.getElementById('je-ov-date').textContent = entry ? fmtDs(entry.date) + (entry.createdAt ? ' · ' + new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '') : '';
      // Mood picker
      const moodEl = document.getElementById('je-ov-mood');
      moodEl.innerHTML = MOODS.map(m => `<span class="mood-btn${entry?.mood === m ? ' sel' : ''}" onclick="jeOvSetMood('${m}')">${m}</span>`).join('');
      // Tags
      renderJournalOvTags(entry?.tags || []);
      document.getElementById('je-ov-status').textContent = entry ? 'Last saved ' + timeAgo(entry.updatedAt) : 'New entry';
      // Reset fmt toggle state
      const ta = document.getElementById('je-ov-ta');
      delete ta.dataset.boldStart; delete ta.dataset.italicStart;
      ['je-ov-bold-btn', 'je-ov-italic-btn'].forEach(b => { const el = document.getElementById(b); if (el) el.classList.remove('active'); });
      document.getElementById('journal-overlay').style.display = 'flex';
      setTimeout(() => {
        const ta = document.getElementById('je-ov-ta');
        if (ta) {
          ta.focus();
          ta.setSelectionRange(ta.value.length, ta.value.length);
          // Double-rAF: outer waits for layout, inner waits for browser's
          // own scroll-into-view to complete, so our scrollTop always wins.
          requestAnimationFrame(() => requestAnimationFrame(() => { ta.scrollTop = ta.scrollHeight; }));
        }
      }, 80);
    }
    function handleJournalOverlayClick(e) { if (e.target === document.getElementById('journal-overlay')) closeJournalEditor(); }
    function closeJournalEditor() {
      jeOvSave();
      document.getElementById('journal-overlay').style.display = 'none';
      editingJournalId = null;
      if (wsPanelOpen && wsTab === 'journal') renderWsPanel();
    }
    function jeOvSave() {
      const title = document.getElementById('je-ov-title').value;
      const text = document.getElementById('je-ov-ta').value;
      if (!editingJournalId) return;
      const e = journalEntries.find(x => x.id === editingJournalId);
      if (!e) return;
      e.title = title; e.text = text; e.updatedAt = Date.now();
      saveJournal();
      if (fbDb && currentRoom) fbSaveJournalEntry(e);
      // Update sidebar card without full re-render
      const card = document.getElementById('jcard-' + editingJournalId);
      if (card) {
        const wc = e.text.trim() ? e.text.trim().split(/\s+/).length : 0;
        const titleEl = card.querySelector('div[style*="font-weight:600"]');
        if (titleEl) titleEl.innerHTML = e.title ? escHtml(e.title) : '<span style="color:var(--text3);font-weight:400;font-style:italic">Untitled entry</span>';
        const subEl = card.querySelectorAll('div[style*="font-size:0.65rem"]')[0];
        if (subEl) subEl.textContent = (wc ? wc + ' words' : 'Empty') + ((!e.title && e.text) ? ' · ' + e.text.trim().slice(0, 60) : '');
      }
      document.getElementById('je-ov-status').textContent = 'Saved just now';
    }
    function jeOvSetMood(mood) {
      const e = journalEntries.find(x => x.id === editingJournalId); if (!e) return;
      e.mood = e.mood === mood ? null : mood; saveJournal(); if (fbDb && currentRoom) fbSaveJournalEntry(e);
      document.getElementById('je-ov-mood').innerHTML = MOODS.map(m => `<span class="mood-btn${e.mood === m ? ' sel' : ''}" onclick="jeOvSetMood('${m}')">${m}</span>`).join('');
    }
    function jeOvInput() {
      clearTimeout(window._jeOvSave);
      window._jeOvSave = setTimeout(() => { jeOvSave(); }, 800);
    }
    function jeOvFmt(fmtKey) {
      const ta = document.getElementById('je-ov-ta'); if (!ta) return;
      const marker = fmtKey === 'bold' ? '**' : '_';
      const s = ta.selectionStart, e2 = ta.selectionEnd;
      const startKey = fmtKey + 'Start';
      if (s !== e2) {
        const sel = ta.value.slice(s, e2);
        if (ta.value.slice(s - marker.length, s) === marker && ta.value.slice(e2, e2 + marker.length) === marker) {
          ta.value = ta.value.slice(0, s - marker.length) + sel + ta.value.slice(e2 + marker.length);
          ta.selectionStart = s - marker.length; ta.selectionEnd = s - marker.length + sel.length;
        } else {
          ta.value = ta.value.slice(0, s) + marker + sel + marker + ta.value.slice(e2);
          ta.selectionStart = s + marker.length; ta.selectionEnd = s + marker.length + sel.length;
        }
        delete ta.dataset[startKey];
        document.getElementById('je-ov-' + fmtKey + '-btn')?.classList.remove('active');
        ta.focus(); jeOvInput(); return;
      }
      if (ta.dataset[startKey] !== undefined) {
        const sp = parseInt(ta.dataset[startKey]), ep = ta.selectionStart;
        delete ta.dataset[startKey];
        document.getElementById('je-ov-' + fmtKey + '-btn')?.classList.remove('active');
        if (ep > sp) { const t = ta.value.slice(sp, ep); ta.value = ta.value.slice(0, sp) + marker + t + marker + ta.value.slice(ep); ta.selectionStart = ta.selectionEnd = sp + marker.length + t.length + marker.length; }
        ta.focus(); jeOvInput();
      } else {
        ta.dataset[startKey] = String(ta.selectionStart);
        document.getElementById('je-ov-' + fmtKey + '-btn')?.classList.add('active');
        ta.focus();
      }
    }
    function jeOvFmtLine(prefix) {
      const ta = document.getElementById('je-ov-ta'); if (!ta) return;
      const s = ta.selectionStart;
      const lineStart = ta.value.lastIndexOf('\n', s - 1) + 1;
      ta.value = ta.value.slice(0, lineStart) + prefix + ta.value.slice(lineStart);
      ta.selectionStart = ta.selectionEnd = s + prefix.length;
      ta.focus(); jeOvInput();
    }
    function jeOvKeydown(e) {
      const ta = document.getElementById('je-ov-ta'); if (!ta) return;
      if (e.key === 'Enter') {
        const pos = ta.selectionStart;
        const lineStart = ta.value.lastIndexOf('\n', pos - 1) + 1;
        const line = ta.value.slice(lineStart, pos);
        const bulletMatch = line.match(/^(•\s)/);
        const numMatch = line.match(/^(\d+)\.\s/);
        if (bulletMatch) {
          e.preventDefault();
          if (line.trim() === '•') { ta.value = ta.value.slice(0, lineStart) + ta.value.slice(pos); ta.selectionStart = ta.selectionEnd = lineStart; jeOvInput(); return; }
          const ins = '\n' + bulletMatch[1];
          ta.value = ta.value.slice(0, pos) + ins + ta.value.slice(pos);
          ta.selectionStart = ta.selectionEnd = pos + ins.length;
          jeOvScrollCaret(ta); jeOvInput();
        } else if (numMatch) {
          e.preventDefault();
          const nextNum = parseInt(numMatch[1]) + 1;
          if (line.trim() === numMatch[1] + '.') { ta.value = ta.value.slice(0, lineStart) + ta.value.slice(pos); ta.selectionStart = ta.selectionEnd = lineStart; jeOvInput(); return; }
          const ins = '\n' + nextNum + '. ';
          ta.value = ta.value.slice(0, pos) + ins + ta.value.slice(pos);
          ta.selectionStart = ta.selectionEnd = pos + ins.length;
          jeOvScrollCaret(ta); jeOvInput();
        } else {
          // Plain enter: scroll caret into view after browser default
          requestAnimationFrame(() => jeOvScrollCaret(ta));
        }
      } else if (e.key === 'Escape') {
        e.stopPropagation(); closeJournalEditor();
      }
    }
    function jeOvScrollCaret(ta) { _scrollTaCaret(ta); }
    function jeOvAddTag() {
      const row = document.getElementById('je-ov-tags');
      if (row) { const inp = row.querySelector('input'); if (inp) { inp.focus(); return; } }
      // Re-render tags to ensure input is there
      const e = journalEntries.find(x => x.id === editingJournalId);
      renderJournalOvTags(e?.tags || []);
      setTimeout(() => { const inp = document.querySelector('#je-ov-tags input'); if (inp) inp.focus(); }, 30);
    }
    function renderJournalOvTags(tags) {
      const row = document.getElementById('je-ov-tags'); if (!row) return;
      row.innerHTML = '';
      (tags || []).forEach(t => {
        const span = document.createElement('span'); span.className = 'note-tag';
        span.textContent = t; span.title = 'Click to remove';
        span.onclick = () => removeJournalOvTag(t);
        row.appendChild(span);
      });
      const wrap = document.createElement('div'); wrap.style.cssText = 'position:relative;display:inline-flex;align-items:center';
      const inp = document.createElement('input');
      inp.placeholder = '+ Tag';
      inp.style.cssText = 'background:none;border:1px dashed var(--border);border-radius:10px;color:var(--text3);font-size:0.65rem;padding:2px 8px;font-family:inherit;outline:none;width:80px';
      inp.setAttribute('autocomplete', 'off');
      const drop = document.createElement('div');
      drop.style.cssText = 'position:absolute;top:100%;left:0;background:var(--surface);border:1px solid var(--border);border-radius:8px;max-height:120px;overflow-y:auto;z-index:9999;display:none;box-shadow:0 4px 16px var(--shadow);min-width:120px;margin-top:2px';
      const showAC = q => {
        const allTags = new Set();
        journalEntries.forEach(e => (e.tags || []).forEach(t => allTags.add(t)));
        notes.forEach(n => (n.tags || []).forEach(t => allTags.add(t)));
        const ql = q.toLowerCase();
        const curEntry = journalEntries.find(x => x.id === editingJournalId);
        const matches = [...allTags].filter(t => (!ql || t.startsWith(ql)) && !(curEntry?.tags || []).includes(t));
        if (!matches.length) { drop.style.display = 'none'; return; }
        drop.innerHTML = '';
        matches.slice(0, 6).forEach(t => {
          const r = document.createElement('div');
          r.style.cssText = 'padding:5px 10px;cursor:pointer;font-size:0.75rem;color:var(--text2);border-bottom:1px solid var(--border)';
          r.textContent = t;
          r.onmousedown = ev => { ev.preventDefault(); addJournalOvTag(t); inp.value = ''; drop.style.display = 'none'; };
          r.onmouseenter = () => r.style.background = 'var(--surface2)'; r.onmouseleave = () => r.style.background = '';
          drop.appendChild(r);
        });
        drop.style.display = 'block';
      };
      inp.addEventListener('input', () => showAC(inp.value));
      inp.addEventListener('focus', () => showAC(inp.value));
      inp.addEventListener('blur', () => setTimeout(() => { drop.style.display = 'none'; }, 150));
      inp.onkeydown = e => {
        if (e.key === 'Enter' && inp.value.trim()) { e.preventDefault(); addJournalOvTag(inp.value.trim()); inp.value = ''; drop.style.display = 'none'; }
        if (e.key === 'Escape') { e.stopPropagation(); inp.blur(); }
      };
      wrap.appendChild(inp); wrap.appendChild(drop); row.appendChild(wrap);
    }
    function addJournalOvTag(tag) {
      const t = tag.trim().toLowerCase(); if (!t || !editingJournalId) return;
      const e = journalEntries.find(x => x.id === editingJournalId); if (!e) return;
      if (!e.tags) e.tags = [];
      if (!e.tags.includes(t)) { e.tags.push(t); saveJournal(); if (fbDb && currentRoom) fbSaveJournalEntry(e); renderJournalOvTags(e.tags); }
    }
    function removeJournalOvTag(tag) {
      const e = journalEntries.find(x => x.id === editingJournalId); if (!e) return;
      e.tags = (e.tags || []).filter(t => t !== tag); saveJournal(); if (fbDb && currentRoom) fbSaveJournalEntry(e); renderJournalOvTags(e.tags);
    }
    function delJEFromOverlay() {
      if (!editingJournalId || !confirm('Delete this journal entry?')) return;
      journalEntries = journalEntries.filter(e => e.id !== editingJournalId);
      saveJournal(); if (fbDb && currentRoom) fbDeleteJournalEntry(editingJournalId);
      document.getElementById('journal-overlay').style.display = 'none';
      editingJournalId = null;
      if (wsPanelOpen && wsTab === 'journal') renderWsPanel();
    }



    function renderJournal(body) {
      body.innerHTML = '';
      const todayStr = fmtDate(today);
      const fmtDs = ds => { const d = parseDate(ds); return d ? DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate() + ', ' + d.getFullYear() : ds; };

      // ── DATE CONTEXT MODE: show only that one day ──
      if (wsDateCtx) {
        // Back button
        const back = document.createElement('button');
        back.style.cssText = 'display:flex;align-items:center;gap:5px;width:100%;padding:6px 8px;background:none;border:1px solid var(--border);border-radius:8px;color:var(--text2);font-family:inherit;font-size:0.76rem;cursor:pointer;margin-bottom:10px;transition:all 0.12s';
        back.innerHTML = '← All Entries';
        back.onmouseenter = () => back.style.borderColor = 'var(--accent)';
        back.onmouseleave = () => back.style.borderColor = 'var(--border)';
        back.onclick = clearWsDateCtx;
        body.appendChild(back);

        // Date heading
        const heading = document.createElement('div');
        heading.style.cssText = 'font-size:0.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px';
        heading.textContent = fmtDs(wsDateCtx) + (wsDateCtx === todayStr ? ' · Today' : '');
        body.appendChild(heading);

        const dayEntries = journalEntries.filter(e => e.date === wsDateCtx)
          .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        if (dayEntries.length) {
          const newestId = dayEntries[dayEntries.length - 1].id;
          dayEntries.forEach((entry) => {
            // Only force-expand the newest entry; respect collapse state of older ones
            const forceExp = entry.id === newestId && !entry._collapsedManually;
            body.appendChild(buildJournalCard(entry, todayStr, forceExp, true));
          });
        } else {
          const empty = document.createElement('div');
          empty.className = 'ws-empty'; empty.style.padding = '16px 8px';
          empty.textContent = 'No journal entries for this day yet.';
          body.appendChild(empty);
        }
        const addBtn = document.createElement('button');
        addBtn.className = 'journal-new-btn';
        addBtn.textContent = '+ Add Another Entry';
        addBtn.onclick = () => newJournalEntry(wsDateCtx);
        body.appendChild(addBtn);
        return;
      }

      // ── ALL ENTRIES MODE ──
      if (!journalEntries.length) {
        body.innerHTML = '<div class="ws-empty">No journal entries yet.<br><br>Click any date on the calendar to write in your journal for that day.</div>';
        const btn = document.createElement('button'); btn.className = 'journal-new-btn'; btn.textContent = '+ New Entry for Today';
        btn.onclick = () => newJournalEntry(null); body.appendChild(btn); return;
      }

      // Group by month
      const byMonth = {};
      journalEntries.forEach(e => { const k = e.date.slice(0, 7); (byMonth[k] || (byMonth[k] = [])).push(e); });
      const hasToday = journalEntries.some(e => e.date === todayStr);

      Object.keys(byMonth).sort().reverse().forEach(mo => {
        const [y, m] = mo.split('-').map(Number);
        const lbl = document.createElement('div');
        lbl.style.cssText = 'font-size:0.65rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.1em;margin:8px 0 5px;padding:0 2px';
        lbl.textContent = MONTHS[m - 1] + ' ' + y; body.appendChild(lbl);
        byMonth[mo].forEach(entry => body.appendChild(buildJournalCard(entry, todayStr, false)));
      });

      if (!hasToday) {
        const btn = document.createElement('button'); btn.className = 'journal-new-btn'; btn.textContent = '+ New Entry for Today'; btn.onclick = () => newJournalEntry(null); body.appendChild(btn);
      }
    }
    function renderJTags(entry) {
      const tags = entry.tags || [];
      if (!tags.length) return '<span style="font-size:0.65rem;color:var(--text3)">No tags yet</span>';
      return tags.map(t => `<span class="journal-tag" onclick="removeJT('${entry.id}','${t}')" title="Remove">${t}</span>`).join('');
    }
    function toggleJE(id) { openJournalEditor(id); }
    function onJI(id, val) {
      const e = journalEntries.find(x => x.id === id); if (e) { e.text = val; e.updatedAt = Date.now(); }
      clearTimeout(window._jSave);
      window._jSave = setTimeout(() => { saveJournal(); if (fbDb && currentRoom) { const en = journalEntries.find(x => x.id === id); if (en) fbSaveJournalEntry(en); } showToast('Journal saved'); }, 1200);
    }
    function onJITitle(id, val) {
      const e = journalEntries.find(x => x.id === id); if (e) { e.title = val; e.updatedAt = Date.now(); }
      clearTimeout(window._jSave);
      window._jSave = setTimeout(() => { saveJournal(); if (fbDb && currentRoom) { const en = journalEntries.find(x => x.id === id); if (en) fbSaveJournalEntry(en); } }, 800);
    }
    function setMood(id, mood) {
      const e = journalEntries.find(x => x.id === id); if (!e) return;
      e.mood = e.mood === mood ? null : mood; saveJournal(); if (fbDb && currentRoom) fbSaveJournalEntry(e);
      const el = document.getElementById('mood-' + id);
      if (el) el.innerHTML = MOODS.map(m => `<span class="mood-btn${e.mood === m ? ' sel' : ''}" onclick="setMood('${id}','${m}')">${m}</span>`).join('');
      const hdr = document.querySelector(`#je-${e.date} .journal-day-hdr > div:last-child`);
      if (hdr) hdr.innerHTML = `${e.mood ? `<span>${e.mood}</span>` : ''}<span style="font-size:0.7rem;color:var(--text3)">${e._collapsed ? '▶' : '▼'}</span>`;
    }
    // Bold/italic toggle: state stored in textarea dataset so it survives DOM ops
    function jiInsert(id, marker, marker2) {
      const ta = document.getElementById('je-ta-' + id); if (!ta) return;
      const fmtKey = marker === '**' ? 'bold' : 'italic';
      const s = ta.selectionStart, e2 = ta.selectionEnd;

      if (s !== e2) {
        // Wrap or unwrap selected text
        const sel = ta.value.slice(s, e2);
        if (ta.value.slice(s - marker.length, s) === marker && ta.value.slice(e2, e2 + marker2.length) === marker2) {
          ta.value = ta.value.slice(0, s - marker.length) + sel + ta.value.slice(e2 + marker2.length);
          ta.selectionStart = s - marker.length; ta.selectionEnd = s - marker.length + sel.length;
        } else {
          ta.value = ta.value.slice(0, s) + marker + sel + marker2 + ta.value.slice(e2);
          ta.selectionStart = s + marker.length; ta.selectionEnd = s + marker.length + sel.length;
        }
        // Clear toggle mode since user used selection
        delete ta.dataset[fmtKey + 'Start'];
        const btn = document.getElementById('je-' + fmtKey + '-' + id);
        if (btn) btn.classList.remove('active');
        ta.focus(); onJI(id, ta.value);
        return;
      }

      // No selection: toggle mode
      const startKey = fmtKey + 'Start';
      if (ta.dataset[startKey] !== undefined) {
        // Turn OFF — wrap text typed since toggle-on
        const startPos = parseInt(ta.dataset[startKey]);
        const endPos = ta.selectionStart;
        delete ta.dataset[startKey];
        const btn = document.getElementById('je-' + fmtKey + '-' + id);
        if (btn) btn.classList.remove('active');
        if (endPos > startPos) {
          const typed = ta.value.slice(startPos, endPos);
          ta.value = ta.value.slice(0, startPos) + marker + typed + marker2 + ta.value.slice(endPos);
          ta.selectionStart = ta.selectionEnd = startPos + marker.length + typed.length + marker2.length;
        }
        ta.focus(); onJI(id, ta.value);
      } else {
        // Turn ON — record position
        ta.dataset[startKey] = String(ta.selectionStart);
        const btn = document.getElementById('je-' + fmtKey + '-' + id);
        if (btn) btn.classList.add('active');
        ta.focus();
      }
    }

    function jiKeydown(e, id) {
      if (e.key !== 'Enter') return;
      const ta = document.getElementById('je-ta-' + id); if (!ta) return;
      const pos = ta.selectionStart;
      const lineStart = ta.value.lastIndexOf('\n', pos - 1) + 1;
      const line = ta.value.slice(lineStart, pos);
      // Detect bullet
      const bulletMatch = line.match(/^(•\s)/);
      const numMatch = line.match(/^(\d+)\.\s/);
      if (bulletMatch) {
        e.preventDefault();
        // If line is just the bullet with no content, clear the line
        if (line.trim() === '•') { ta.value = ta.value.slice(0, lineStart) + ta.value.slice(pos); ta.selectionStart = ta.selectionEnd = lineStart; onJI(id, ta.value); return; }
        const ins = '\n' + bulletMatch[1];
        ta.value = ta.value.slice(0, pos) + ins + ta.value.slice(pos);
        ta.selectionStart = ta.selectionEnd = pos + ins.length;
        onJI(id, ta.value);
      } else if (numMatch) {
        e.preventDefault();
        const nextNum = parseInt(numMatch[1]) + 1;
        if (line.trim() === numMatch[1] + '.') { ta.value = ta.value.slice(0, lineStart) + ta.value.slice(pos); ta.selectionStart = ta.selectionEnd = lineStart; onJI(id, ta.value); return; }
        const ins = '\n' + nextNum + '. ';
        ta.value = ta.value.slice(0, pos) + ins + ta.value.slice(pos);
        ta.selectionStart = ta.selectionEnd = pos + ins.length;
        onJI(id, ta.value);
      }
    }
    function _scrollTaCaret(ta) {
      const lh = parseFloat(getComputedStyle(ta).lineHeight) || 22;
      const lines = ta.value.substring(0, ta.selectionStart).split('\n').length;
      const caretTop = (lines - 1) * lh;
      const caretBot = caretTop + lh;
      const visTop = ta.scrollTop;
      const visBot = ta.scrollTop + ta.clientHeight;
      if (caretBot > visBot) { ta.scrollTop = caretBot - ta.clientHeight + lh; }
      else if (caretTop < visTop) { ta.scrollTop = caretTop; }
    }
    function noteKeydown(e) {
      if (e.key !== 'Enter') return;
      const ta = document.getElementById('note-body-inp'); if (!ta) return;
      const pos = ta.selectionStart;
      const lineStart = ta.value.lastIndexOf('\n', pos - 1) + 1;
      const line = ta.value.slice(lineStart, pos);
      const bulletMatch = line.match(/^(•\s)/);
      const numMatch = line.match(/^(\d+)\.\s/);
      if (bulletMatch) {
        e.preventDefault();
        if (line.trim() === '•') { ta.value = ta.value.slice(0, lineStart) + ta.value.slice(pos); ta.selectionStart = ta.selectionEnd = lineStart; clearTimeout(noteAutoSaveTimer); noteAutoSaveTimer = setTimeout(autoSaveNote, 400); return; }
        const ins = '\n' + bulletMatch[1];
        ta.value = ta.value.slice(0, pos) + ins + ta.value.slice(pos);
        ta.selectionStart = ta.selectionEnd = pos + ins.length;
        _scrollTaCaret(ta); clearTimeout(noteAutoSaveTimer); noteAutoSaveTimer = setTimeout(autoSaveNote, 400);
      } else if (numMatch) {
        e.preventDefault();
        const nextNum = parseInt(numMatch[1]) + 1;
        if (line.trim() === numMatch[1] + '.') { ta.value = ta.value.slice(0, lineStart) + ta.value.slice(pos); ta.selectionStart = ta.selectionEnd = lineStart; clearTimeout(noteAutoSaveTimer); noteAutoSaveTimer = setTimeout(autoSaveNote, 400); return; }
        const ins = '\n' + nextNum + '. ';
        ta.value = ta.value.slice(0, pos) + ins + ta.value.slice(pos);
        ta.selectionStart = ta.selectionEnd = pos + ins.length;
        _scrollTaCaret(ta); clearTimeout(noteAutoSaveTimer); noteAutoSaveTimer = setTimeout(autoSaveNote, 400);
      } else {
        requestAnimationFrame(() => _scrollTaCaret(ta));
      }
    }
    function jiInsertLine(id, prefix) {
      const ta = document.getElementById('je-ta-' + id); if (!ta) return;
      const s = ta.selectionStart;
      const lineStart = ta.value.lastIndexOf('\n', s - 1) + 1;
      ta.value = ta.value.slice(0, lineStart) + prefix + ta.value.slice(lineStart);
      ta.selectionStart = ta.selectionEnd = s + prefix.length;
      ta.focus(); onJI(id, ta.value);
    }

    function noteFmt(fmtKey) {
      const ta = document.getElementById('note-body-inp'); if (!ta) return;
      const marker = fmtKey === 'bold' ? '**' : '_';
      const s = ta.selectionStart, e2 = ta.selectionEnd;
      const startKey = fmtKey + 'Start';
      if (s !== e2) {
        const sel = ta.value.slice(s, e2);
        if (ta.value.slice(s - marker.length, s) === marker && ta.value.slice(e2, e2 + marker.length) === marker) {
          ta.value = ta.value.slice(0, s - marker.length) + sel + ta.value.slice(e2 + marker.length);
          ta.selectionStart = s - marker.length; ta.selectionEnd = s - marker.length + sel.length;
        } else {
          ta.value = ta.value.slice(0, s) + marker + sel + marker + ta.value.slice(e2);
          ta.selectionStart = s + marker.length; ta.selectionEnd = s + marker.length + sel.length;
        }
        delete ta.dataset[startKey];
        const btn = document.getElementById('note-' + fmtKey + '-btn'); if (btn) btn.classList.remove('active');
        ta.focus(); clearTimeout(noteAutoSaveTimer); noteAutoSaveTimer = setTimeout(autoSaveNote, 400);
        return;
      }
      if (ta.dataset[startKey] !== undefined) {
        const sp = parseInt(ta.dataset[startKey]), ep = ta.selectionStart;
        delete ta.dataset[startKey];
        const btn = document.getElementById('note-' + fmtKey + '-btn'); if (btn) btn.classList.remove('active');
        if (ep > sp) { const t = ta.value.slice(sp, ep); ta.value = ta.value.slice(0, sp) + marker + t + marker + ta.value.slice(ep); ta.selectionStart = ta.selectionEnd = sp + marker.length + t.length + marker.length; }
        ta.focus(); clearTimeout(noteAutoSaveTimer); noteAutoSaveTimer = setTimeout(autoSaveNote, 400);
      } else {
        ta.dataset[startKey] = String(ta.selectionStart);
        const btn = document.getElementById('note-' + fmtKey + '-btn'); if (btn) btn.classList.add('active');
        ta.focus();
      }
    }
    function noteFmtLine(prefix) {
      const ta = document.getElementById('note-body-inp'); if (!ta) return;
      const s = ta.selectionStart;
      const lineStart = ta.value.lastIndexOf('\n', s - 1) + 1;
      ta.value = ta.value.slice(0, lineStart) + prefix + ta.value.slice(lineStart);
      ta.selectionStart = ta.selectionEnd = s + prefix.length;
      ta.focus(); clearTimeout(noteAutoSaveTimer); noteAutoSaveTimer = setTimeout(autoSaveNote, 400);
    }
    function jiTag(id) {
      // Use inline tag input instead of prompt
      const tagsEl = document.getElementById('jt-' + id); if (!tagsEl) return;
      // Check if inline input already open
      if (tagsEl.querySelector('.jtag-inp')) return;
      const entry = journalEntries.find(x => x.id === id); if (!entry) return;

      const wrap = document.createElement('div'); wrap.style.cssText = 'position:relative;display:inline-flex;align-items:center';
      const inp = document.createElement('input'); inp.className = 'jtag-inp';
      inp.placeholder = 'Add tag…';
      inp.style.cssText = 'background:none;border:1px dashed var(--border);border-radius:10px;color:var(--text);font-size:0.65rem;padding:2px 8px;font-family:inherit;outline:none;width:90px';
      inp.setAttribute('autocomplete', 'off');

      // Autocomplete from all existing tags
      const drop = document.createElement('div');
      drop.style.cssText = 'position:absolute;top:100%;left:0;background:var(--surface);border:1px solid var(--border);border-radius:8px;max-height:120px;overflow-y:auto;z-index:9999;display:none;box-shadow:0 4px 16px var(--shadow);min-width:120px;margin-top:2px';
      const showAC = q => {
        const allTags = new Set();
        journalEntries.forEach(e => (e.tags || []).forEach(t => allTags.add(t)));
        notes.forEach(n => (n.tags || []).forEach(t => allTags.add(t)));
        const ql = (q || '').toLowerCase();
        const matches = [...allTags].filter(t => (!ql || t.startsWith(ql)) && !(entry.tags || []).includes(t));
        if (!matches.length) { drop.style.display = 'none'; return; }
        drop.innerHTML = '';
        matches.slice(0, 6).forEach(t => {
          const r = document.createElement('div');
          r.style.cssText = 'padding:5px 10px;cursor:pointer;font-size:0.75rem;color:var(--text2);border-bottom:1px solid var(--border)';
          r.textContent = t;
          r.onmousedown = ev2 => { ev2.preventDefault(); doAddTag(t); };
          r.onmouseenter = () => r.style.background = 'var(--surface2)'; r.onmouseleave = () => r.style.background = '';
          drop.appendChild(r);
        });
        drop.style.display = 'block';
      };
      const doAddTag = t => {
        const tag = t.trim().toLowerCase(); if (!tag) return;
        if (!entry.tags) entry.tags = [];
        if (!entry.tags.includes(tag)) { entry.tags.push(tag); }
        saveJournal(); if (fbDb && currentRoom) fbSaveJournalEntry(entry);
        tagsEl.innerHTML = renderJTags(entry);
      };
      inp.addEventListener('input', () => showAC(inp.value));
      inp.addEventListener('focus', () => showAC(inp.value));
      inp.addEventListener('blur', () => setTimeout(() => { drop.style.display = 'none'; wrap.remove(); }, 150));
      inp.onkeydown = e => {
        if (e.key === 'Enter' && inp.value.trim()) { e.preventDefault(); doAddTag(inp.value.trim()); inp.value = ''; }
        if (e.key === 'Escape') { e.stopPropagation(); inp.blur(); }
      };
      wrap.appendChild(inp); wrap.appendChild(drop);
      tagsEl.appendChild(wrap);
      setTimeout(() => { inp.focus(); showAC(''); }, 30);
    }
    function removeJT(id, tag) {
      const e = journalEntries.find(x => x.id === id); if (!e) return;
      e.tags = (e.tags || []).filter(t => t !== tag); saveJournal(); if (fbDb && currentRoom) fbSaveJournalEntry(e);
      const el = document.getElementById('jt-' + id); if (el) el.innerHTML = renderJTags(e);
    }
    function delJE(id) {
      if (!confirm('Delete this journal entry?')) return;
      const entry = journalEntries.find(e => e.id === id);
      journalEntries = journalEntries.filter(e => e.id !== id); saveJournal();
      if (fbDb && currentRoom) fbDeleteJournalEntry(id);
      // If we were viewing this date in context, stay on that date (now shows "write entry" prompt)
      renderWsPanel();
    }

    // ══════════════════════════════════════════
    // NOTES
    // ══════════════════════════════════════════
    const NOTE_COLORS = [null, '#fbbf24', '#f472b6', '#4ade80', '#60a5fa', '#fb923c', '#a78bfa'];

    function renderNotes(body) {
      body.innerHTML = '';
      const sorted = [...notes.filter(n => n.pinned), ...notes.filter(n => !n.pinned).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))];
      if (!sorted.length) {
        body.innerHTML = '<div class="ws-empty">No notes yet.<br><br>Notes are perfect for ideas, references, and anything date-independent.</div>';
      }
      const searchRow = document.createElement('div'); searchRow.style.marginBottom = '8px';
      searchRow.innerHTML = '<input id="note-search" placeholder="🔍 Search notes…" style="width:100%;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:6px 10px;border-radius:8px;font-family:inherit;font-size:0.8rem;outline:none" oninput="renderNoteGrid2(this.value)"/>';
      body.appendChild(searchRow);
      const grid = document.createElement('div'); grid.className = 'note-grid'; grid.id = 'notes-grid'; body.appendChild(grid);
      const btn = document.createElement('button'); btn.className = 'journal-new-btn'; btn.textContent = '+ New Note'; btn.onclick = () => openNoteEditor(null); body.appendChild(btn);
      renderNoteGrid2('');
    }
    function renderNoteGrid2(q) {
      const grid = document.getElementById('notes-grid'); if (!grid) return;
      const ql = q.toLowerCase();
      const list = ql ? notes.filter(n => (n.title || '').toLowerCase().includes(ql) || (n.body || '').toLowerCase().includes(ql)) :
        [...notes.filter(n => n.pinned), ...notes.filter(n => !n.pinned).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))];
      grid.innerHTML = '';
      list.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card' + (note.pinned ? ' pinned' : '');
        if (note.color) card.style.cssText = `border-left:3px solid ${note.color}`;
        card.innerHTML = `<div class="note-card-header">
      ${note.color ? `<div class="note-color-dot" style="background:${note.color}"></div>` : ''}
      <div class="note-card-title">${escHtml(note.title || 'Untitled')}</div>
      <span class="note-pin" onclick="pinNote(event,'${note.id}')" title="${note.pinned ? 'Unpin' : 'Pin'}">${note.pinned ? '📌' : '📍'}</span>
    </div>
    ${note.body ? `<div class="note-preview">${escHtml(note.body.slice(0, 120))}</div>` : ''}
    <div class="note-meta" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
      <div style="display:flex;gap:3px;flex-wrap:wrap;flex:1">${(note.tags && note.tags.length) ? note.tags.map(t => `<span style="font-size:0.6rem;padding:1px 6px;border-radius:8px;background:var(--accent-soft);color:var(--accent2)">${escHtml(t)}</span>`).join('') : '<span style="opacity:0">·</span>'}</div>
      <span style="white-space:nowrap;flex-shrink:0">${timeAgo(note.updatedAt)}</span>
    </div>`;
        card.onclick = () => openNoteEditor(note.id);
        grid.appendChild(card);
      });
    }
    function pinNote(e, id) {
      e.stopPropagation(); const n = notes.find(x => x.id === id);
      if (n) { n.pinned = !n.pinned; saveNotes(); fbSaveNote(n); renderNoteGrid2(document.getElementById('note-search')?.value || ''); }
    }
    function openNoteEditor(id) {
      editingNoteId = id;
      const note = id ? notes.find(n => n.id === id) : null;
      document.getElementById('note-title-inp').value = note?.title || '';
      document.getElementById('note-body-inp').value = note?.body || '';
      selectedNoteColor = note?.color || null;
      buildNoteColorPick();
      renderNoteTags(note?.tags || []);
      document.getElementById('note-save-status').textContent = note ? 'Last saved ' + timeAgo(note.updatedAt) : 'New note';
      document.getElementById('note-overlay').style.display = 'flex';
      setTimeout(() => {
        const _nEl = document.getElementById(note ? 'note-body-inp' : 'note-title-inp');
        if (_nEl) {
          _nEl.focus();
          if (note && _nEl.id === 'note-body-inp') {
            _nEl.setSelectionRange(_nEl.value.length, _nEl.value.length);
            // Double-rAF: outer waits for layout, inner waits for browser's
            // own scroll-into-view to complete, so our scrollTop always wins.
            requestAnimationFrame(() => requestAnimationFrame(() => { _nEl.scrollTop = _nEl.scrollHeight; }));
          }
        }
      }, 80);
    }
    function renderNoteTags(tags) {
      const row = document.getElementById('note-tags-row');
      if (!row) return;
      row.innerHTML = '';
      (tags || []).forEach(t => {
        const span = document.createElement('span'); span.className = 'note-tag';
        span.textContent = t; span.title = 'Click to remove';
        span.onclick = () => removeNoteTag(t);
        row.appendChild(span);
      });
      // Tag add area
      const wrap = document.createElement('div'); wrap.style.cssText = 'position:relative;display:inline-flex;align-items:center';
      const inp = document.createElement('input');
      inp.placeholder = '+ Tag';
      inp.style.cssText = 'background:none;border:1px dashed var(--border);border-radius:10px;color:var(--text3);font-size:0.65rem;padding:2px 8px;font-family:inherit;outline:none;width:80px;cursor:pointer';
      inp.setAttribute('autocomplete', 'off');
      // Tag autocomplete
      const drop = document.createElement('div');
      drop.style.cssText = 'position:absolute;top:100%;left:0;background:var(--surface);border:1px solid var(--border);border-radius:8px;max-height:120px;overflow-y:auto;z-index:9999;display:none;box-shadow:0 4px 16px var(--shadow);min-width:120px;margin-top:2px';
      const showTagAC = q => {
        const allTags = new Set();
        notes.forEach(n => (n.tags || []).forEach(t => allTags.add(t)));
        journalEntries.forEach(e => (e.tags || []).forEach(t => allTags.add(t)));
        const ql = q.toLowerCase();
        const matches = [...allTags].filter(t => t.startsWith(ql) && t !== q);
        if (!matches.length) { drop.style.display = 'none'; return; }
        drop.innerHTML = '';
        matches.slice(0, 6).forEach(t => {
          const r = document.createElement('div');
          r.style.cssText = 'padding:5px 10px;cursor:pointer;font-size:0.75rem;color:var(--text2);border-bottom:1px solid var(--border)';
          r.textContent = t;
          r.onmousedown = e2 => { e2.preventDefault(); addNoteTag(t); inp.value = ''; drop.style.display = 'none'; };
          r.onmouseenter = () => r.style.background = 'var(--surface2)'; r.onmouseleave = () => r.style.background = '';
          drop.appendChild(r);
        });
        drop.style.display = 'block';
      };
      inp.addEventListener('input', () => showTagAC(inp.value));
      inp.addEventListener('blur', () => setTimeout(() => { drop.style.display = 'none'; }, 150));
      inp.onkeydown = e => {
        if (e.key === 'Enter' && inp.value.trim()) { e.preventDefault(); addNoteTag(inp.value.trim()); inp.value = ''; drop.style.display = 'none'; }
        if (e.key === 'Escape') { e.stopPropagation(); inp.value = ''; drop.style.display = 'none'; inp.blur(); }
      };
      wrap.appendChild(inp); wrap.appendChild(drop);
      row.appendChild(wrap);
    }
    function getNoteEditingTags() {
      const n = notes.find(x => x.id === editingNoteId); return n?.tags || [];
    }
    function addNoteTag(tag) {
      const t = tag.trim().toLowerCase(); if (!t) return;
      if (!editingNoteId) { autoSaveNote(); }
      const n = notes.find(x => x.id === editingNoteId);
      if (!n) return;
      if (!n.tags) n.tags = [];
      if (!n.tags.includes(t)) { n.tags.push(t); saveNotes(); fbSaveNote(n); renderNoteTags(n.tags); }
    }
    function removeNoteTag(tag) {
      const n = notes.find(x => x.id === editingNoteId); if (!n) return;
      n.tags = (n.tags || []).filter(t => t !== tag); saveNotes(); fbSaveNote(n); renderNoteTags(n.tags);
    }
    function noteAddTag() {
      const inp = document.querySelector('#note-tags-row input'); if (inp) inp.focus();
    }
    function buildNoteColorPick() {
      const row = document.getElementById('note-color-pick');
      row.innerHTML = NOTE_COLORS.map(c => `<div class="note-color-btn${selectedNoteColor === c ? ' sel' : ''}"
    style="background:${c || 'var(--surface3)'}${!c ? ';border:2px solid var(--border)' : ''}"
    onclick="pickNoteColor(${c ? `'${c}'` : 'null'})" title="${c || 'Default'}"></div>`).join('');
    }
    function pickNoteColor(c) { selectedNoteColor = c; buildNoteColorPick(); autoSaveNote(); }
    function autoSaveNote() {
      const title = document.getElementById('note-title-inp').value;
      const body = document.getElementById('note-body-inp').value;
      if (!title.trim() && !body.trim()) return;
      if (!editingNoteId) {
        editingNoteId = uuid();
        notes.unshift({ id: editingNoteId, title, body, color: selectedNoteColor, tags: [], pinned: false, createdAt: Date.now(), updatedAt: Date.now() });
      } else {
        const n = notes.find(x => x.id === editingNoteId);
        if (n) { n.title = title; n.body = body; n.color = selectedNoteColor; n.updatedAt = Date.now(); }
        // tags preserved separately via addNoteTag/removeNoteTag
      }
      saveNotes();
      const _n = notes.find(x => x.id === editingNoteId); if (_n) fbSaveNote(_n);
      document.getElementById('note-save-status').textContent = 'Saved just now';
    }
    function handleNoteOverlayClick(e) { if (e.target === document.getElementById('note-overlay')) closeNoteEditor(); }
    function closeNoteEditor() {
      autoSaveNote(); document.getElementById('note-overlay').style.display = 'none';
      editingNoteId = null; if (wsPanelOpen && wsTab === 'notes') renderWsPanel();
    }
    function deleteCurrentNote() {
      if (!editingNoteId || !confirm('Delete this note?')) return;
      const _delNoteId = editingNoteId; notes = notes.filter(n => n.id !== _delNoteId); saveNotes(); fbDeleteNote(_delNoteId);
      document.getElementById('note-overlay').style.display = 'none'; editingNoteId = null;
      if (wsPanelOpen && wsTab === 'notes') renderWsPanel();
    }
    window.addEventListener('DOMContentLoaded', () => {
      ['note-title-inp', 'note-body-inp'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => { clearTimeout(noteAutoSaveTimer); noteAutoSaveTimer = setTimeout(autoSaveNote, 600); });
      });
    });

    // ══════════════════════════════════════════
    // TO-DO LISTS
    // ══════════════════════════════════════════
    function renderTodos(body) {
      body.innerHTML = '';
      const fmtDs = ds => { const d = parseDate(ds); return d ? DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate() : ds; };

      // ── DATE CONTEXT: show tasks for that day ──
      if (wsDateCtx) {
        // Back button
        const back = document.createElement('button');
        back.style.cssText = 'display:flex;align-items:center;gap:5px;width:100%;padding:6px 8px;background:none;border:1px solid var(--border);border-radius:8px;color:var(--text2);font-family:inherit;font-size:0.76rem;cursor:pointer;margin-bottom:10px;transition:all 0.12s';
        back.innerHTML = '← All Tasks';
        back.onmouseenter = () => back.style.borderColor = 'var(--accent)';
        back.onmouseleave = () => back.style.borderColor = 'var(--border)';
        back.onclick = clearWsDateCtx;
        body.appendChild(back);

        const heading = document.createElement('div');
        heading.style.cssText = 'font-size:0.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px';
        heading.textContent = 'Tasks for ' + fmtDs(wsDateCtx);
        body.appendChild(heading);

        // Quick-add input (at top) with list autocomplete
        const quickAdd = buildQuickAddRow(wsDateCtx);
        body.appendChild(quickAdd);

        if (!todoLists.length) {
          const empty2 = document.createElement('div'); empty2.className = 'ws-empty'; empty2.style.padding = '10px 8px';
          empty2.textContent = 'No lists yet — type above and press Enter to create one.';
          body.appendChild(empty2); return;
        }

        // Lists WITH tasks for this date
        let hasActive = false;
        todoLists.forEach(list => {
          const items = (list.items || []).filter(i => i.date === wsDateCtx);
          if (!items.length) return;
          hasActive = true;
          const color = list.color || COLORS[0].hex;
          const sec = buildCollapsibleTodoList(list, items, color, wsDateCtx, true);
          body.appendChild(sec);
        });

        if (!hasActive) {
          const empty = document.createElement('div'); empty.className = 'ws-empty'; empty.style.padding = '10px 8px';
          empty.textContent = 'No tasks for this day yet.'; body.appendChild(empty);
        }

        // ── Hidden section: other lists (no tasks this day) ──
        const listsWithout = todoLists.filter(l => !(l.items || []).some(i => i.date === wsDateCtx));
        if (listsWithout.length) {
          const toggleId = 'hidden-lists-' + wsDateCtx.replace(/-/g, '');
          const toggleBtn = document.createElement('button');
          toggleBtn.style.cssText = 'display:flex;align-items:center;gap:5px;width:100%;padding:5px 8px;background:none;border:1px dashed var(--border);border-radius:8px;color:var(--text3);font-family:inherit;font-size:0.73rem;cursor:pointer;margin-top:8px;transition:all 0.12s';
          toggleBtn.innerHTML = '▶ Other lists (' + listsWithout.length + ')';
          toggleBtn.onclick = () => {
            const el = document.getElementById(toggleId);
            const open = el.style.display !== 'none';
            el.style.display = open ? 'none' : 'block';
            toggleBtn.innerHTML = (open ? '▶' : '▼') + ' Other lists (' + listsWithout.length + ')';
          };
          body.appendChild(toggleBtn);
          const hiddenSec = document.createElement('div'); hiddenSec.id = toggleId; hiddenSec.style.display = 'none';
          listsWithout.forEach(list => {
            const color = list.color || COLORS[0].hex;
            // Pass ALL items (all dates) so user can see existing tasks
            const allItems = list.items || [];
            const sec = buildCollapsibleTodoList(list, allItems, color, wsDateCtx, false);
            hiddenSec.appendChild(sec);
          });
          body.appendChild(hiddenSec);
        }
        return;
      }

      // ── ALL TASKS MODE ──
      if (!todoLists.length) {
        body.innerHTML = '<div class="ws-empty">No to-do lists yet.<br><br>Create lists to organize tasks by project, category, or date.</div>';
        const btn = document.createElement('button'); btn.className = 'todo-new-list-btn'; btn.textContent = '+ New List';
        btn.onclick = () => openTodoListModal(null); body.appendChild(btn); return;
      }
      const total = todoLists.reduce((s, l) => (l.items || []).length + s, 0);
      const done = todoLists.reduce((s, l) => (l.items || []).filter(i => i.done).length + s, 0);
      if (total > 0) {
        const bar = document.createElement('div'); bar.style.marginBottom = '10px';
        bar.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--text2);margin-bottom:4px">
      <span>${done}/${total} tasks done</span><span>${Math.round(done / total * 100)}%</span></div>
      <div class="todo-progress"><div class="todo-progress-bar" style="width:${Math.round(done / total * 100)}%"></div></div>`;
        body.appendChild(bar);
      }
      todoLists.forEach(list => {
        const color = list.color || COLORS[0].hex;
        const sec = buildCollapsibleTodoList(list, list.items || [], color, null, false);
        body.appendChild(sec);
      });
      const btn = document.createElement('button'); btn.className = 'todo-new-list-btn'; btn.textContent = '+ New List';
      btn.onclick = () => openTodoListModal(null); body.appendChild(btn);
    }

    // ── Build a collapsible todo list section ──
    function buildCollapsibleTodoList(list, items, color, dateCtx, startExpanded) {
      const sec = document.createElement('div'); sec.className = 'todo-list-section';
      const done = items.filter(i => i.done).length;
      const pct = items.length ? Math.round(done / items.length * 100) : 0;
      const isCollapsed = startExpanded ? false : (list._collapsed !== false);
      const hdr = document.createElement('div'); hdr.className = 'todo-list-hdr';
      hdr.style.cursor = 'pointer';
      hdr.innerHTML = `<div class="todo-list-color" style="background:${color}"></div>
    <div class="todo-list-name">${escHtml(list.name)}</div>
    <div class="todo-list-count">${done}/${items.length}</div>
    <span style="font-size:0.7rem;color:var(--text3);margin-right:4px">${isCollapsed ? '▶' : '▼'}</span>
    <button class="cal-edit-btn" style="opacity:1;padding:3px 6px" onclick="openTodoListModal('${list.id}');event.stopPropagation()">•••</button>`;

      const bodyEl = document.createElement('div');
      bodyEl.id = 'tl-body-' + list.id;
      bodyEl.style.display = isCollapsed ? 'none' : 'block';

      hdr.onclick = (e) => {
        if (e.target.closest('.cal-edit-btn')) return;
        list._collapsed = !list._collapsed;
        bodyEl.style.display = list._collapsed ? 'none' : 'block';
        const chevron = hdr.querySelector('span');
        if (chevron) chevron.textContent = list._collapsed ? '▶' : '▼';
      };

      // Progress bar
      if (items.length > 0) {
        const prog = document.createElement('div'); prog.className = 'todo-progress';
        prog.innerHTML = `<div class="todo-progress-bar" style="width:${pct}%"></div>`;
        bodyEl.appendChild(prog);
      }

      // Items
      [...items.filter(i => !i.done), ...items.filter(i => i.done)].forEach(item => {
        bodyEl.appendChild(buildTodoRow(list.id, item, color));
      });

      // Add row with autocomplete
      const addRow = document.createElement('div'); addRow.className = 'todo-add-row'; addRow.style.position = 'relative';
      const addInp = document.createElement('input');
      addInp.className = 'todo-add-input';
      addInp.placeholder = 'Add task…';
      addInp.setAttribute('autocomplete', 'off');

      // Autocomplete dropdown
      const acDrop = document.createElement('div');
      acDrop.style.cssText = 'position:absolute;bottom:100%;left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:8px;max-height:140px;overflow-y:auto;z-index:999;display:none;box-shadow:0 4px 16px var(--shadow)';

      const showAC = q => {
        if (!q.trim()) { acDrop.style.display = 'none'; return; }
        const ql = q.toLowerCase();
        // Collect all unique item texts across all lists (deduplicated)
        const seen = new Set();
        const suggestions = [];
        todoLists.forEach(l => (l.items || []).forEach(i => {
          if (!seen.has(i.text.toLowerCase()) && i.text.toLowerCase().startsWith(ql)) {
            seen.add(i.text.toLowerCase()); suggestions.push(i.text);
          }
        }));
        if (!suggestions.length) { acDrop.style.display = 'none'; return; }
        acDrop.innerHTML = '';
        suggestions.slice(0, 6).forEach(s => {
          const row = document.createElement('div');
          row.style.cssText = 'padding:6px 10px;cursor:pointer;font-size:0.8rem;color:var(--text2);border-bottom:1px solid var(--border)';
          row.textContent = s;
          row.onmousedown = e => { e.preventDefault(); addInp.value = s; acDrop.style.display = 'none'; addInp.focus(); };
          row.onmouseenter = () => row.style.background = 'var(--surface2)';
          row.onmouseleave = () => row.style.background = '';
          acDrop.appendChild(row);
        });
        acDrop.style.display = 'block';
      };

      addInp.addEventListener('input', () => showAC(addInp.value));
      addInp.addEventListener('blur', () => setTimeout(() => { acDrop.style.display = 'none'; }, 150));

      const submitTask = () => {
        const t = addInp.value.trim();
        if (!t) return;
        acDrop.style.display = 'none';
        addTodoItem(list.id, t, dateCtx);
        addInp.value = '';
        addInp.focus();
      };
      addInp.onkeydown = e => {
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); submitTask(); }
        if (e.key === 'Escape') { e.stopPropagation(); addInp.value = ''; acDrop.style.display = 'none'; addInp.blur(); }
        if (e.key === 'ArrowDown' && acDrop.style.display !== 'none') {
          const first = acDrop.querySelector('div'); if (first) first.focus(); e.preventDefault();
        }
      };
      const addBtn = document.createElement('button'); addBtn.className = 'todo-add-btn'; addBtn.textContent = '+';
      addBtn.onclick = submitTask;
      addRow.appendChild(acDrop); addRow.appendChild(addInp); addRow.appendChild(addBtn);
      bodyEl.appendChild(addRow);

      sec.appendChild(hdr); sec.appendChild(bodyEl);
      return sec;
    }

    // ── Quick-add row: suggest list + item autocomplete ──
    function buildQuickAddRow(dateCtx) {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;margin-bottom:12px';

      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:6px;align-items:center';

      // List selector
      const listSel = document.createElement('select');
      listSel.style.cssText = 'background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:5px 8px;border-radius:8px;font-family:inherit;font-size:0.78rem;outline:none;flex-shrink:0;max-width:110px';
      const newOpt = document.createElement('option'); newOpt.value = '__new__'; newOpt.textContent = '+ New list'; listSel.appendChild(newOpt);
      todoLists.forEach(l => { const o = document.createElement('option'); o.value = l.id; o.textContent = l.name; listSel.appendChild(o); });
      if (todoLists.length) listSel.value = todoLists[0].id;

      // Item input
      const inp = document.createElement('input');
      inp.style.cssText = 'flex:1;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:5px 10px;border-radius:8px;font-family:inherit;font-size:0.82rem;outline:none';
      inp.placeholder = 'Add a task…';
      inp.setAttribute('autocomplete', 'off');

      // Autocomplete
      const acDrop = document.createElement('div');
      acDrop.style.cssText = 'position:absolute;top:100%;left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:8px;max-height:140px;overflow-y:auto;z-index:9999;display:none;box-shadow:0 4px 16px var(--shadow);margin-top:2px';

      const showAC = q => {
        if (!q.trim()) { acDrop.style.display = 'none'; return; }
        const ql = q.toLowerCase();
        const seen = new Set();
        const suggestions = [];
        todoLists.forEach(l => (l.items || []).forEach(i => {
          if (!seen.has(i.text.toLowerCase()) && i.text.toLowerCase().startsWith(ql)) {
            seen.add(i.text.toLowerCase());
            suggestions.push({ text: i.text, listName: l.name, listId: l.id });
          }
        }));
        if (!suggestions.length) { acDrop.style.display = 'none'; return; }
        acDrop.innerHTML = '';
        suggestions.slice(0, 8).forEach(s => {
          const r = document.createElement('div');
          r.style.cssText = 'padding:6px 10px;cursor:pointer;font-size:0.8rem;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center';
          r.innerHTML = `<span style="color:var(--text)">${escHtml(s.text)}</span><span style="color:var(--text3);font-size:0.7rem">${escHtml(s.listName)}</span>`;
          r.onmousedown = e => {
            e.preventDefault();
            inp.value = s.text;
            // Auto-select that list
            if (listSel.querySelector('option[value="' + s.listId + '"]')) listSel.value = s.listId;
            acDrop.style.display = 'none'; inp.focus();
          };
          r.onmouseenter = () => r.style.background = 'var(--surface2)';
          r.onmouseleave = () => r.style.background = '';
          acDrop.appendChild(r);
        });
        acDrop.style.display = 'block';
      };

      inp.addEventListener('input', () => showAC(inp.value));
      inp.addEventListener('blur', () => setTimeout(() => { acDrop.style.display = 'none'; }, 150));

      const submit = () => {
        const text = inp.value.trim(); if (!text) return;
        let listId = listSel.value;
        if (listId === '__new__') {
          // Create new list named after the task or prompt
          const listName = prompt('New list name:', 'My Tasks');
          if (!listName) return;
          const newList = { id: uuid(), name: listName.trim(), color: COLORS[0].hex, items: [], createdAt: Date.now() };
          todoLists.push(newList);
          saveTodoLists(); fbSaveTodoList(newList);
          listId = newList.id;
          // Add to selector
          const o = document.createElement('option'); o.value = listId; o.textContent = newList.name;
          listSel.insertBefore(o, listSel.querySelector('option[value="__new__"]').nextSibling);
          listSel.value = listId;
        }
        acDrop.style.display = 'none';
        addTodoItem(listId, text, dateCtx);
        inp.value = ''; inp.focus();
      };
      inp.onkeydown = e => {
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); submit(); }
        if (e.key === 'Escape') { e.stopPropagation(); inp.value = ''; acDrop.style.display = 'none'; }
      };

      const btn = document.createElement('button');
      btn.className = 'todo-add-btn'; btn.textContent = '+'; btn.onclick = submit;

      row.appendChild(listSel); row.appendChild(inp); row.appendChild(btn);
      wrap.appendChild(row); wrap.appendChild(acDrop);
      return wrap;
    }
    function buildTodoRow(listId, item, color) {
      const row = document.createElement('div'); row.className = 'todo-item';
      const chk = document.createElement('div'); chk.className = 'todo-check' + (item.done ? ' done' : '');
      chk.style.borderColor = color; if (item.done) chk.style.background = color;
      chk.onclick = () => toggleTodoItem(listId, item.id);
      const txt = document.createElement('div'); txt.className = 'todo-text' + (item.done ? ' done' : '');
      txt.textContent = item.text; txt.contentEditable = true; txt.spellcheck = false; txt.style.outline = 'none';
      txt.onblur = () => { const t = txt.textContent.trim(); if (t && t !== item.text) renameTodoItem(listId, item.id, t); };
      txt.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); txt.blur(); } if (e.key === 'Escape') { txt.textContent = item.text; txt.blur(); } };
      // Always show the date the task was added
      const _taskDate = item.date
        ? parseDate(item.date)
        : (item.createdAt ? new Date(item.createdAt) : null);
      if (_taskDate) {
        const badge = document.createElement('div');
        badge.className = 'todo-due';
        badge.textContent = MONTHS[_taskDate.getMonth()].slice(0, 3) + ' ' + _taskDate.getDate();
        badge.style.cssText = 'font-size:0.62rem;color:var(--text3);white-space:nowrap;flex-shrink:0';
        row.appendChild(chk); row.appendChild(txt); row.appendChild(badge);
      } else {
        row.appendChild(chk); row.appendChild(txt);
      }
      const del = document.createElement('button'); del.className = 'todo-item-del'; del.textContent = '✕'; del.title = 'Delete';
      del.onclick = () => deleteTodoItem(listId, item.id);
      row.appendChild(del);
      return row;
    }
    function addTodoItem(listId, text, date) {
      const l = todoLists.find(x => x.id === listId); if (!l) return;
      const item = { id: uuid(), text, done: false, createdAt: Date.now() };
      if (date) item.date = date;
      (l.items || (l.items = [])).push(item);
      saveTodoLists(); fbSaveTodoList(l); renderWsPanel();
    }
    function toggleTodoItem(listId, itemId) {
      const l = todoLists.find(x => x.id === listId); if (!l) return;
      const i = (l.items || []).find(x => x.id === itemId); if (!i) return;
      i.done = !i.done; i.doneAt = i.done ? Date.now() : null; saveTodoLists(); fbSaveTodoList(l); renderWsPanel();
    }
    function renameTodoItem(listId, itemId, text) {
      const l = todoLists.find(x => x.id === listId); if (!l) return;
      const i = (l.items || []).find(x => x.id === itemId); if (i) { i.text = text; saveTodoLists(); fbSaveTodoList(l); }
    }
    function deleteTodoItem(listId, itemId) {
      const l = todoLists.find(x => x.id === listId); if (!l) return;
      l.items = (l.items || []).filter(i => i.id !== itemId); saveTodoLists(); fbSaveTodoList(l); renderWsPanel();
    }
    function openTodoListModal(id) {
      editingTodoListId = id;
      const list = id ? todoLists.find(l => l.id === id) : null;
      document.getElementById('todolist-modal-title').textContent = id ? 'Edit List' : 'New List';
      document.getElementById('tl-name-inp').value = list?.name || '';
      selectedTlColor = list?.color || COLORS[0].hex;
      document.getElementById('tl-delete-btn').style.display = id ? '' : 'none';
      const cp = document.getElementById('tl-color-pick'); cp.innerHTML = '';
      COLORS.forEach(c => {
        const sw = document.createElement('div'); sw.className = 'color-swatch' + (selectedTlColor === c.hex ? ' selected' : '');
        sw.style.background = c.hex;
        sw.onclick = () => { selectedTlColor = c.hex; cp.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('selected')); sw.classList.add('selected'); };
        cp.appendChild(sw);
      });
      document.getElementById('todolist-overlay').classList.add('open');
      setTimeout(() => document.getElementById('tl-name-inp').focus(), 80);
    }
    function closeTodoListModal() { document.getElementById('todolist-overlay').classList.remove('open'); editingTodoListId = null; }
    function saveTodoList() {
      const name = document.getElementById('tl-name-inp').value.trim(); if (!name) return;
      let _savedTl;
      if (editingTodoListId) { const l = todoLists.find(x => x.id === editingTodoListId); if (l) { l.name = name; l.color = selectedTlColor || COLORS[0].hex; _savedTl = l; } }
      else { _savedTl = { id: uuid(), name, color: selectedTlColor || COLORS[0].hex, items: [], createdAt: Date.now() }; todoLists.push(_savedTl); }
      saveTodoLists(); if (_savedTl) fbSaveTodoList(_savedTl);
      closeTodoListModal(); renderWsPanel();
    }
    function deleteTodoList() {
      if (!editingTodoListId || !confirm('Delete this list and all its tasks?')) return;
      const _dtlId = editingTodoListId; todoLists = todoLists.filter(l => l.id !== _dtlId); saveTodoLists(); fbDeleteTodoList(_dtlId); closeTodoListModal(); renderWsPanel();
    }

    // ── Day hover tooltip ──
    let _tooltipEl = null, _tooltipTimer = null;
    function showDayTooltip(date, e) {
      hideDayTooltip();
      _tooltipTimer = setTimeout(() => {
        const dStr = fmtDate(date);
        const dayEvs = eventsForDate(date);
        // Todos: items that have this date assigned
        const allTodos = todoLists.reduce((acc, l) => {
          (l.items || []).filter(i => i.date === dStr).forEach(i => acc.push({ list: l, item: i }));
          return acc;
        }, []);

        if (!dayEvs.length && !allTodos.length) return;

        const tip = document.createElement('div'); tip.className = 'day-tooltip';
        const fmtDs = `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getDate()}`;
        tip.innerHTML = `<div class="day-tooltip-date">${fmtDs}</div>`;

        if (dayEvs.length) {
          tip.innerHTML += `<div class="day-tooltip-section">Events</div>`;
          dayEvs.slice(0, 4).forEach(ev => {
            const cal = calendars.find(c => c.id === (ev.calendarId || 'default'));
            const color = ev.color || (cal ? cal.color : COLORS[0].hex);
            const isAllDay = ev.allDay === 'yes' || ev.allDay === true;
            const time = isAllDay ? 'All day' : fmt12hr(ev.start);
            tip.innerHTML += `<div class="day-tooltip-ev"><div class="day-tooltip-dot" style="background:${color}"></div><span>${escHtml(ev.title || '(no title)')}${time ? ' <span style="color:var(--text3);font-size:0.9em">· ' + time + '</span>' : ''}</span></div>`;
          });
          if (dayEvs.length > 4) tip.innerHTML += `<div class="day-tooltip-empty">+${dayEvs.length - 4} more</div>`;
        }
        if (allTodos.length) {
          tip.innerHTML += `<div class="day-tooltip-section">Tasks</div>`;
          allTodos.slice(0, 4).forEach(({ list, item }) => {
            tip.innerHTML += `<div class="day-tooltip-todo"><div class="day-tooltip-dot" style="background:${list.color || COLORS[0].hex}"></div><span${item.done ? ' style="text-decoration:line-through;opacity:0.5"' : ''}>${escHtml(item.text)}</span></div>`;
          });
          if (allTodos.length > 4) tip.innerHTML += `<div class="day-tooltip-empty">+${allTodos.length - 4} more tasks</div>`;
        }


        document.body.appendChild(tip);
        _tooltipEl = tip;
        moveDayTooltip(e);
      }, 300);
    }
    function moveDayTooltip(e) {
      if (!_tooltipEl) return;
      const x = Math.min(e.clientX + 14, window.innerWidth - 270);
      const y = Math.min(e.clientY + 14, window.innerHeight - 200);
      _tooltipEl.style.left = x + 'px'; _tooltipEl.style.top = y + 'px';
    }
    function hideDayTooltip() {
      clearTimeout(_tooltipTimer);
      if (_tooltipEl) { _tooltipEl.remove(); _tooltipEl = null; }
    }

    // ── Utility helpers ──
    function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function timeAgo(ts) {
      if (!ts) return ''; const diff = Date.now() - ts;
      if (diff < 60000) return 'just now';
      if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
      if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
      if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
      return new Date(ts).toLocaleDateString();
    }


    // ══════════════════════════════════════════
    // FIREBASE
    // ══════════════════════════════════════════
    let fbApp = null, fbDb = null, currentRoom = null, syncListeners = [], isFirebaseReady = false;
    function loadFbConfig() { try { return JSON.parse(localStorage.getItem('calioFbConfig') || 'null'); } catch { return null; } }
    function saveFbConfig(cfg) { localStorage.setItem('calioFbConfig', JSON.stringify(cfg)); }
    function clearFbConfig() { localStorage.removeItem('calioFbConfig'); }
    function loadSavedRoom() { return localStorage.getItem('calioRoom') || null; }
    function saveRoomLocal(code) { if (code) localStorage.setItem('calioRoom', code); else localStorage.removeItem('calioRoom'); }
    function setSyncStatus(status, label) {
      const dot = document.getElementById('sync-dot'), lbl = document.getElementById('sync-label');
      if (!dot || !lbl) return;
      dot.className = 'sync-dot ' + status; lbl.textContent = label;
    }
    function initFirebase(cfg) {
      try {
        if (fbApp) { try { fbApp.delete(); } catch (e) { } fbApp = null; fbDb = null; }
        fbApp = !firebase.apps.length ? firebase.initializeApp(cfg) : firebase.app();
        fbDb = firebase.firestore();
        fbDb.enablePersistence({ synchronizeTabs: true }).catch(() => { });
        isFirebaseReady = true; setSyncStatus('connected', 'Firebase ready'); return true;
      } catch (err) { isFirebaseReady = false; setSyncStatus('offline', 'Firebase error'); return false; }
    }
    function tryAutoConnect() {
      const cfg = loadFbConfig(); if (!cfg) { setSyncStatus('local', 'Local'); return; }
      const ok = initFirebase(cfg); if (!ok) return;
      const savedRoom = loadSavedRoom(); if (savedRoom) attachRoom(savedRoom);
      // Restore date context from session
      const savedCtx = loadWsCtx();
      if (savedCtx) { wsDateCtx = savedCtx; selectedDay = savedCtx; }
      // Open ws-panel by default (desktop only — mobile init handles this separately)
      if (!wsPanelOpen && window.innerWidth > 768) { wsPanelOpen = true; document.getElementById('ws-panel').classList.add('open'); document.getElementById('ws-panel-btn').classList.add('active'); renderWsPanel(); }
    }
    function genRoomCode() { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
    function detachListeners() { syncListeners.forEach(u => { try { u(); } catch (e) { } }); syncListeners = []; }
    async function attachRoom(code) {
      if (!fbDb) { setSyncStatus('offline', 'Not connected'); return false; }
      detachListeners(); currentRoom = code; saveRoomLocal(code); setSyncStatus('syncing', 'Connecting…'); updateRoomBadge();
      const roomRef = fbDb.collection('rooms').doc(code);
      try { await roomRef.set({ updatedAt: Date.now() }, { merge: true }); } catch (e) { }
      const evUnsub = roomRef.collection('events').onSnapshot(snap => {
        events = []; snap.forEach(doc => events.push({ ...doc.data(), id: doc.id }));
        localStorage.setItem('calioEvents', JSON.stringify(events)); render(); setSyncStatus('connected', 'Synced · ' + code);
      }, () => setSyncStatus('offline', 'Sync error'));
      const lblUnsub = roomRef.collection('labels').onSnapshot(snap => {
        labels = []; snap.forEach(doc => labels.push({ ...doc.data(), id: doc.id })); saveLabels(); renderSidebar();
      }, () => { });
      const habUnsub = roomRef.collection('habits').onSnapshot(snap => {
        habits = []; snap.forEach(doc => habits.push({ ...doc.data(), id: doc.id })); saveHabits(); renderSidebar();
      }, () => { });
      const jrnUnsub = roomRef.collection('journal').onSnapshot(snap => {
        journalEntries = []; snap.forEach(doc => journalEntries.push({ ...doc.data(), id: doc.id }));
        saveJournal(); if (wsPanelOpen && wsTab === 'journal') renderWsPanel();
      }, () => { });
      const notesUnsub = roomRef.collection('notes').onSnapshot(snap => {
        notes = []; snap.forEach(doc => notes.push({ ...doc.data(), id: doc.id }));
        saveNotes(); if (wsPanelOpen && wsTab === 'notes') renderWsPanel();
      }, () => { });
      const todosUnsub = roomRef.collection('todoLists').onSnapshot(snap => {
        todoLists = []; snap.forEach(doc => todoLists.push({ ...doc.data(), id: doc.id }));
        saveTodoLists();
        saveTodoLists(); if (wsPanelOpen && wsTab === 'todos') renderWsPanel();
      }, () => { });
      syncListeners = [evUnsub, lblUnsub, habUnsub, jrnUnsub, notesUnsub, todosUnsub]; return true;
    }
    async function fbSaveEvent(ev) { if (!fbDb || !currentRoom) return; try { const d = { ...ev }; delete d.id; await fbDb.collection('rooms').doc(currentRoom).collection('events').doc(ev.id).set(d); } catch (e) { } }
    async function fbDeleteEvent(id) { if (!fbDb || !currentRoom) return; try { await fbDb.collection('rooms').doc(currentRoom).collection('events').doc(id).delete(); } catch (e) { } }
    async function fbSaveAllEvents() { if (!fbDb || !currentRoom) return; setSyncStatus('syncing', 'Saving…'); try { for (let i = 0; i < events.length; i += 400) { const batch = fbDb.batch(); events.slice(i, i + 400).forEach(ev => { const d = { ...ev }; delete d.id; batch.set(fbDb.collection('rooms').doc(currentRoom).collection('events').doc(ev.id), d); }); await batch.commit(); } setSyncStatus('connected', 'Synced · ' + currentRoom); } catch (e) { setSyncStatus('offline', 'Sync error'); } }
    async function fbSaveLabel(lbl) { if (!fbDb || !currentRoom) return; try { const d = { ...lbl }; delete d.id; await fbDb.collection('rooms').doc(currentRoom).collection('labels').doc(lbl.id).set(d); } catch (e) { } }
    async function fbDeleteLabel(id) { if (!fbDb || !currentRoom) return; try { await fbDb.collection('rooms').doc(currentRoom).collection('labels').doc(id).delete(); } catch (e) { } }
    async function fbSaveHabit(h) { if (!fbDb || !currentRoom) return; try { const d = { ...h }; delete d.id; await fbDb.collection('rooms').doc(currentRoom).collection('habits').doc(h.id).set(d); } catch (e) { } }
    async function fbDeleteHabit(id) { if (!fbDb || !currentRoom) return; try { await fbDb.collection('rooms').doc(currentRoom).collection('habits').doc(id).delete(); } catch (e) { } }
    async function fbSaveJournalEntry(e) { if (!fbDb || !currentRoom) return; try { const d = { ...e }; delete d.id; delete d._collapsed; await fbDb.collection('rooms').doc(currentRoom).collection('journal').doc(e.id).set(d); } catch (err) { } }
    async function fbDeleteJournalEntry(id) { if (!fbDb || !currentRoom) return; try { await fbDb.collection('rooms').doc(currentRoom).collection('journal').doc(id).delete(); } catch (e) { } }
    async function fbSaveNote(n) { if (!fbDb || !currentRoom) return; try { const d = { ...n }; delete d.id; await fbDb.collection('rooms').doc(currentRoom).collection('notes').doc(n.id).set(d); } catch (e) { } }
    async function fbDeleteNote(id) { if (!fbDb || !currentRoom) return; try { await fbDb.collection('rooms').doc(currentRoom).collection('notes').doc(id).delete(); } catch (e) { } }
    async function fbSaveTodoList(l) { if (!fbDb || !currentRoom) return; try { const d = { ...l }; delete d.id; await fbDb.collection('rooms').doc(currentRoom).collection('todoLists').doc(l.id).set(d); } catch (e) { } }
    async function fbDeleteTodoList(id) { if (!fbDb || !currentRoom) return; try { await fbDb.collection('rooms').doc(currentRoom).collection('todoLists').doc(id).delete(); } catch (e) { } }
    function _fbPushEvent(ev) { if (fbDb && currentRoom) fbSaveEvent(ev); }
    function _fbDeleteEventDoc(id) { if (fbDb && currentRoom) fbDeleteEvent(id); }
    function _fbPushLabel(lbl) { if (fbDb && currentRoom) fbSaveLabel(lbl); }
    function _fbDeleteLabelDoc(id) { if (fbDb && currentRoom) fbDeleteLabel(id); }
    function updateRoomBadge() {
      const wrap = document.getElementById('room-badge-wrap'), si = document.getElementById('sync-indicator');
      if (currentRoom) { if (wrap) { wrap.style.display = ''; document.getElementById('room-badge-code').textContent = currentRoom; } if (si) si.style.display = 'none'; }
      else { if (wrap) wrap.style.display = 'none'; if (si) si.style.display = ''; }
    }
    function openFbSetup() {
      const cfg = loadFbConfig(); if (cfg) document.getElementById('fb-config-input').value = JSON.stringify(cfg, null, 2);
      document.getElementById('fb-config-error').style.display = 'none';
      document.getElementById('fb-setup-overlay').classList.add('open');
    }
    function closeFbSetup() { document.getElementById('fb-setup-overlay').classList.remove('open'); }
    function parseFirebaseConfig(raw) {
      let s = raw.trim().replace(/<script[^>]*>/gi, '').replace(/<\/script>/gi, '').trim().replace(/\/\/[^\n]*/g, '');
      const start = s.indexOf('{'); if (start === -1) throw new Error('No { } block found.');
      let depth = 0, end = -1;
      for (let i = start; i < s.length; i++) { if (s[i] === '{') depth++; else if (s[i] === '}' && --depth === 0) { end = i; break; } }
      if (end === -1) throw new Error('Incomplete config — missing closing }.');
      const result = (new Function('return ' + s.slice(start, end + 1)))();
      if (typeof result !== 'object' || result === null) throw new Error('Config did not evaluate to an object.');
      return result;
    }
    function connectFirebase() {
      const raw = document.getElementById('fb-config-input').value.trim();
      const errEl = document.getElementById('fb-config-error'); errEl.style.display = 'none';
      let cfg;
      try {
        if (!raw) throw new Error('Paste your Firebase config first.');
        cfg = parseFirebaseConfig(raw);
        if (!cfg.apiKey) throw new Error('"apiKey" missing.');
        if (!cfg.projectId) throw new Error('"projectId" missing.');
      } catch (e) { errEl.textContent = '⚠ ' + e.message; errEl.style.display = 'block'; return; }
      saveFbConfig(cfg);
      if (!initFirebase(cfg)) { errEl.textContent = '⚠ Firebase init failed — check your config.'; errEl.style.display = 'block'; return; }
      closeFbSetup(); openRoomModal();
    }
    function disconnectFirebase() {
      detachListeners(); leaveRoom(true); clearFbConfig(); isFirebaseReady = false; fbDb = null;
      if (fbApp) { try { fbApp.delete(); } catch (e) { } fbApp = null; }
      setSyncStatus('local', 'Local'); updateRoomBadge(); closeRoomModal(); showToast('Disconnected from Firebase');
    }
    function openRoomModal() {
      const noFb = document.getElementById('room-no-firebase'), fbPanel = document.getElementById('room-firebase-panel');
      const active = document.getElementById('room-active-section'), noRoom = document.getElementById('room-noroom-section');
      if (!isFirebaseReady) { noFb.style.display = ''; fbPanel.style.display = 'none'; }
      else {
        noFb.style.display = 'none'; fbPanel.style.display = '';
        if (currentRoom) { active.style.display = ''; noRoom.style.display = 'none'; document.getElementById('room-active-code').textContent = currentRoom; }
        else { active.style.display = 'none'; noRoom.style.display = ''; document.getElementById('room-join-input').value = ''; document.getElementById('room-join-error').style.display = 'none'; }
      }
      document.getElementById('room-overlay').classList.add('open');
    }
    function closeRoomModal() { document.getElementById('room-overlay').classList.remove('open'); }
    async function createRoom() {
      const code = genRoomCode();
      const ok = await attachRoom(code); if (!ok) return;
      closeRoomModal();
      await fbSaveAllEvents();
      for (const lbl of labels) { const d = { ...lbl }; delete d.id; await fbDb.collection('rooms').doc(code).collection('labels').doc(lbl.id).set(d); }
      for (const h of habits) { const d = { ...h }; delete d.id; await fbDb.collection('rooms').doc(code).collection('habits').doc(h.id).set(d); }
      for (const e of journalEntries) { const d = { ...e }; delete d.id; delete d._collapsed; await fbDb.collection('rooms').doc(code).collection('journal').doc(e.id).set(d); }
      for (const n of notes) { const d = { ...n }; delete d.id; await fbDb.collection('rooms').doc(code).collection('notes').doc(n.id).set(d); }
      for (const l of todoLists) { const d = { ...l }; delete d.id; await fbDb.collection('rooms').doc(code).collection('todoLists').doc(l.id).set(d); }
      showToast('Room created: ' + code + ' — share this code!'); updateRoomBadge();
    }
    async function joinRoom() {
      const code = document.getElementById('room-join-input').value.trim().toUpperCase();
      const errEl = document.getElementById('room-join-error'); errEl.style.display = 'none';
      if (code.length !== 6) { errEl.textContent = 'Code must be 6 characters'; errEl.style.display = ''; return; }
      try { const doc = await fbDb.collection('rooms').doc(code).get(); if (!doc.exists) { errEl.textContent = 'Room not found.'; errEl.style.display = ''; return; } } catch (e) { errEl.textContent = 'Connection error: ' + e.message; errEl.style.display = ''; return; }
      await attachRoom(code); closeRoomModal(); showToast('Joined room: ' + code); updateRoomBadge();
    }
    function leaveRoom(silent) {
      detachListeners(); currentRoom = null; saveRoomLocal(null); updateRoomBadge();
      if (!silent) showToast('Left room — back to local');
      setSyncStatus(isFirebaseReady ? 'connected' : 'local', isFirebaseReady ? 'Firebase ready' : 'Local');
      closeRoomModal();
    }
    function copyRoomCode() { if (!currentRoom) return; navigator.clipboard.writeText(currentRoom).then(() => showToast('Room code copied: ' + currentRoom)); }

    // ══════════════════════════════════════════
    // INIT
    // ══════════════════════════════════════════
    loadAll();
    tryAutoConnect();
    render();
    scheduleAllReminders();
  