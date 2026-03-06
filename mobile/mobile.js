/** 
 * MOBILE PWA ENHANCEMENTS
 * Implements swipe gestures and mobile-specific UI handlers
 */

// Global Mobile State
let isSidebarOpen = false;
let isWsOpen = false;
let isDaySheetOpen = false;

// Helpers
function getEl(id) { return document.getElementById(id); }

// Toggle Scrim
function toggleMobScrim(show) {
    const scrim = getEl('mob-scrim');
    if (!scrim) return;
    if (show) {
        scrim.classList.add('visible');
    } else {
        scrim.classList.remove('visible');
    }
}

// Scrim click handler
document.addEventListener('DOMContentLoaded', () => {
    const scrim = getEl('mob-scrim');
    if (scrim) {
        scrim.addEventListener('click', () => {
            if (isSidebarOpen) mobToggleSidebar();
            if (isWsOpen) mobToggleWs();
            if (isDaySheetOpen) mobCloseDaySheet();
        });
    }

    // Set up swipe detection
    const calArea = getEl('calendar-area');
    if (calArea) {
        let startX = 0;
        let startY = 0;

        calArea.addEventListener('touchstart', e => {
            startX = e.changedTouches[0].screenX;
            startY = e.changedTouches[0].screenY;
        }, { passive: true });

        calArea.addEventListener('touchend', e => {
            const endX = e.changedTouches[0].screenX;
            const endY = e.changedTouches[0].screenY;

            const diffX = endX - startX;
            const diffY = endY - startY;

            // Horizontal swipe must be significantly larger than vertical to trigger
            if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
                if (diffX > 0) {
                    // Swiped right -> go back in time
                    if (typeof navigate === 'function') navigate(-1);
                } else {
                    // Swiped left -> go forward in time
                    if (typeof navigate === 'function') navigate(1);
                }
            }
        }, { passive: true });
    }
});

// Mobile Nav Bar Handlers
function mobCloseOthers(keep) {
    // Close every panel EXCEPT the one being opened (keep = 'sidebar'|'ws'|'settings'|'views'|null)
    if (keep !== 'sidebar' && isSidebarOpen) {
        getEl('sidebar').classList.remove('mob-open');
        isSidebarOpen = false;
    }
    if (keep !== 'ws' && isWsOpen) {
        const ws = getEl('ws-panel');
        if (ws) { ws.classList.remove('active'); ws.classList.remove('open'); }
        const mbnWs = getEl('mbn-ws');
        if (mbnWs) mbnWs.classList.remove('active');
        isWsOpen = false;
    }
    if (keep !== 'settings') {
        const mbnMore = getEl('mbn-more');
        if (mbnMore && mbnMore.classList.contains('on')) {
            if (typeof closeSettings === 'function') closeSettings();
            mbnMore.classList.remove('on');
        }
    }
    if (keep !== 'views') {
        const tray = getEl('mob-view-tray');
        if (tray) tray.classList.remove('show');
    }
    if (keep !== 'daysheet' && isDaySheetOpen) mobCloseDaySheet();
    // Recalculate scrim
    const anyOpen = isSidebarOpen || isWsOpen ||
        (getEl('mbn-more') && getEl('mbn-more').classList.contains('on'));
    if (!anyOpen) toggleMobScrim(false);
}

function mobToggleViews() {
    const tray = getEl('mob-view-tray');
    const isOpen = tray && tray.classList.contains('show');
    mobCloseOthers('views');
    if (!isOpen && tray) tray.classList.add('show');
}

function mobView(view) {
    if (typeof setView === 'function') setView(view);
    const tray = getEl('mob-view-tray');
    if (tray) tray.classList.remove('show');

    // Update active state in tray
    document.querySelectorAll('.mvt-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = getEl('mvt-' + view);
    if (activeBtn) activeBtn.classList.add('active');
}

function mobToggleSidebar() {
    const sidebar = getEl('sidebar');
    if (!sidebar) return;
    const opening = !isSidebarOpen;
    mobCloseOthers('sidebar');
    isSidebarOpen = opening;
    if (isSidebarOpen) {
        sidebar.classList.add('mob-open');
        toggleMobScrim(true);
    } else {
        sidebar.classList.remove('mob-open');
        if (!isWsOpen && !isDaySheetOpen) toggleMobScrim(false);
    }
}

function mobToggleWs() {
    const ws = getEl('ws-panel');
    if (!ws) return;
    const opening = !isWsOpen;
    mobCloseOthers('ws');
    isWsOpen = opening;
    const mbnWs = getEl('mbn-ws');
    if (isWsOpen) {
        ws.classList.add('active');
        ws.classList.add('open');
        if (mbnWs) mbnWs.classList.add('active');
        toggleMobScrim(true);
        // Update date nav label
        const lbl = getEl('mob-datenav-label');
        if (lbl && typeof wsDateCtx !== 'undefined' && wsDateCtx) {
            const parts = wsDateCtx.split('-');
            const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
            lbl.textContent = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }
    } else {
        ws.classList.remove('active');
        ws.classList.remove('open');
        if (mbnWs) mbnWs.classList.remove('active');
        if (!isSidebarOpen && !isDaySheetOpen) toggleMobScrim(false);
    }
}

function mobFabTap() {
    if (typeof openModal === 'function') openModal();
}

function mobMoreTap() {
    const mbnMore = getEl('mbn-more');
    const isOpen = mbnMore && mbnMore.classList.contains('on');
    mobCloseOthers('settings');
    if (!isOpen) {
        if (typeof openSettings === 'function') openSettings();
        if (mbnMore) mbnMore.classList.add('on');
    }
}

function mobCloseDaySheet() {
    const sheet = getEl('mob-day-sheet');
    if (sheet) {
        sheet.classList.remove('visible');
        isDaySheetOpen = false;
        if (!isSidebarOpen && !isWsOpen) toggleMobScrim(false);
    }
}

function mobDayAddEvent() {
    mobCloseDaySheet();
    if (typeof openModal === 'function') openModal(); // Modify this if you need it to open for a specific date
}

function mobDayOpenJournal() {
    mobCloseDaySheet();
    if (!isWsOpen) mobToggleWs();
    if (typeof switchWsTab === 'function') switchWsTab('journal');
}

function mobJournalNav(dir) {
    if (typeof wsDateCtx !== 'undefined' && wsDateCtx) {
        const parts = wsDateCtx.split('-');
        const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
        d.setDate(d.getDate() + dir);
        const pad = n => String(n).padStart(2, '0');
        wsDateCtx = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
        if (typeof selectedDay !== 'undefined') selectedDay = wsDateCtx;
        if (typeof saveWsCtx === 'function') saveWsCtx();
        if (typeof renderWsPanel === 'function') renderWsPanel();
        const lbl = getEl('mob-datenav-label');
        if (lbl) lbl.textContent = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
}

// Called when user taps a day cell on mobile (month/week/agenda views)
// Shows the day action sheet with "New Event" and "Journal" options
function mobDayTap(dateStr, cell) {
    // Store date so mds-btn-event uses it
    const sheet = getEl('mob-day-sheet');
    if (!sheet) return;

    // Highlight the tapped cell
    document.querySelectorAll('.day-cell.selected').forEach(c => c.classList.remove('selected'));
    if (cell) cell.classList.add('selected');
    if (typeof selectedDay !== 'undefined') selectedDay = dateStr;

    // Populate date label
    const lbl = getEl('mds-date-label');
    if (lbl) {
        const parts = dateStr.split('-');
        const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
        lbl.textContent = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    // Populate events list for that day
    const evList = getEl('mds-events-list');
    if (evList) {
        evList.innerHTML = '';
        const evs = typeof eventsForDate === 'function'
            ? eventsForDate(new Date(dateStr.replace(/-/g, '/')))
            : [];
        if (evs.length) {
            evs.slice(0, 5).forEach(ev => {
                const row = document.createElement('div');
                row.style.cssText = 'padding:7px 0;border-bottom:1px solid var(--border);font-size:0.88rem;display:flex;align-items:center;gap:8px;';
                const dot = document.createElement('span');
                dot.style.cssText = 'width:8px;height:8px;border-radius:50%;flex-shrink:0;background:' + (ev.color || 'var(--accent)');
                const name = document.createElement('span');
                name.textContent = ev.title || 'Untitled';
                name.style.overflow = 'hidden';
                name.style.textOverflow = 'ellipsis';
                name.style.whiteSpace = 'nowrap';
                row.appendChild(dot); row.appendChild(name);
                evList.appendChild(row);
            });
            if (evs.length > 5) {
                const more = document.createElement('div');
                more.style.cssText = 'padding:6px 0;font-size:0.75rem;color:var(--text3)';
                more.textContent = '+' + (evs.length - 5) + ' more';
                evList.appendChild(more);
            }
        }
    }

    // Wire up "New Event" button to use this specific date
    const evBtn = getEl('mds-btn-event');
    if (evBtn) {
        evBtn.onclick = () => {
            mobCloseDaySheet();
            if (typeof openModal === 'function') openModal(dateStr);
        };
    }

    // Show the sheet
    sheet.classList.add('visible');
    isDaySheetOpen = true;
    toggleMobScrim(true);
}

// Intercept day clicks to show the day sheet on mobile instead of going to day view directly
const originalSetView = typeof setView === 'function' ? setView : null;

// If we wanted to intercept day clicks from the month view we could override the click handlers,
// but swipe navigation and bottom nav is usually sufficient. 
