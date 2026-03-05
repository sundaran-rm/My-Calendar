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
function mobToggleViews() {
    const tray = getEl('mob-view-tray');
    if (tray) tray.classList.toggle('show');
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
    isSidebarOpen = !isSidebarOpen;

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
    isWsOpen = !isWsOpen;

    const mbnWs = getEl('mbn-ws');

    if (isWsOpen) {
        ws.classList.add('active');
        if (mbnWs) mbnWs.classList.add('active');
        toggleMobScrim(true);
    } else {
        ws.classList.remove('active');
        if (mbnWs) mbnWs.classList.remove('active');
        if (!isSidebarOpen && !isDaySheetOpen) toggleMobScrim(false);
    }
}

function mobFabTap() {
    if (typeof openModal === 'function') openModal();
}

function mobMoreTap() {
    if (typeof openSettings === 'function') openSettings();
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
    // If there's a global current journal date, shift it and re-render
    // This depends on how app.js manages the journal date, it usually uses currentWsDate
    if (typeof currentWsDate !== 'undefined') {
        currentWsDate.setDate(currentWsDate.getDate() + dir);
        if (typeof renderJournal === 'function') {
            renderJournal();
            // Update label
            const lbl = getEl('mob-datenav-label');
            if (lbl) {
                lbl.textContent = currentWsDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            }
        }
    }
}

// Intercept day clicks to show the day sheet on mobile instead of going to day view directly
const originalSetView = typeof setView === 'function' ? setView : null;

// If we wanted to intercept day clicks from the month view we could override the click handlers,
// but swipe navigation and bottom nav is usually sufficient. 
