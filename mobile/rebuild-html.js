const fs = require('fs');

try {
    // Read original
    let content = fs.readFileSync('C:/Users/Home/Downloads/calendar-app-online.html', 'utf8');

    // 1. Swap CSS
    content = content.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="style.css">\n  <link rel="stylesheet" href="mobile.css">');

    // 2. Swap JS (the main one before mob-nav removal)
    content = content.replace(/<script>[\s\S]*?<\/script>/, '<script src="app.js"></script>\n  <script src="mobile.js"></script>');

    // 3. Add Manifest / Icons
    const headTarget = '<meta name="description" content="Offline-first calendar with journal, notes, todos, habits, Firebase sync.">';
    const manifestTags = headTarget + '\n  <link rel="manifest" href="manifest.json">\n  <link rel="apple-touch-icon" href="icons/icon-192x192.png">\n  <link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192x192.png">\n  <link rel="icon" type="image/png" sizes="512x512" href="icons/icon-512x512.png">';
    content = content.replace(headTarget, manifestTags);

    // 4. Settings modal Done button
    const settingsEnd = `        <div class="setting-row">
          <div>
            <div class="setting-label">Browser Notifications</div>
            <div class="setting-sub" id="notif-status">Click to request permission</div>
          </div>
          <button class="btn-save" style="padding:5px 12px;font-size:0.76rem;"
            onclick="requestNotifPermission()">Enable</button>
        </div>
      </div>

    </div>
  </div>`;

    const settingsFixed = `        <div class="setting-row">
          <div>
            <div class="setting-label">Browser Notifications</div>
            <div class="setting-sub" id="notif-status">Click to request permission</div>
          </div>
          <button class="btn-save" style="padding:5px 12px;font-size:0.76rem;" onclick="requestNotifPermission()">Enable</button>
        </div>
      </div>

      <!-- Mobile Close Button for Settings -->
      <div class="modal-actions" style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border);">
        <button class="btn-save" style="width: 100%;" onclick="closeSettings(); document.getElementById('mbn-more').classList.remove('on');">Done</button>
      </div>

    </div>
  </div>`;
    content = content.replace(settingsEnd, settingsFixed);

    // 5. Relocate mob-view-tray
    const trayTarget = `  <nav id="mob-nav">
    <!-- View tray (pops up above nav) -->
    <div id="mob-view-tray">
      <button class="mvt-btn" id="mvt-month" onclick="mobView('month')">Month</button>
      <button class="mvt-btn" id="mvt-week" onclick="mobView('week')">Week</button>
      <button class="mvt-btn" id="mvt-day" onclick="mobView('day')">Day</button>
      <button class="mvt-btn" id="mvt-year" onclick="mobView('year')">Year</button>
      <button class="mvt-btn" id="mvt-agenda" onclick="mobView('agenda')">Agenda</button>
    </div>`;

    const trayFixed = `  <!-- View tray (pops up above nav) -->
  <div id="mob-view-tray">
    <button class="mvt-btn" id="mvt-month" onclick="mobView('month')">Month</button>
    <button class="mvt-btn" id="mvt-week" onclick="mobView('week')">Week</button>
    <button class="mvt-btn" id="mvt-day" onclick="mobView('day')">Day</button>
    <button class="mvt-btn" id="mvt-year" onclick="mobView('year')">Year</button>
    <button class="mvt-btn" id="mvt-agenda" onclick="mobView('agenda')">Agenda</button>
  </div>

  <nav id="mob-nav">`;
    content = content.replace(trayTarget, trayFixed);

    // 6. Remove the legacy hiding script
    const hideScript = `  <script>
    // Desktop-only: hide mobile UI nodes, register SW for caching
    document.addEventListener('DOMContentLoaded', function () {
      ['mob-nav', 'mob-scrim', 'mob-view-tray', 'mob-day-sheet', 'mob-date-nav'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
    });
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js').catch(function () { });
      });
    }
  </script>`;
    const swOnly = `  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js').catch(function () { });
      });
    }
  </script>`;
    content = content.replace(hideScript, swOnly);

    fs.writeFileSync('index.html', content);
    console.log("Successfully rebuilt index.html.");
} catch (e) {
    console.error("Error rebuilding index.html:", e);
}
