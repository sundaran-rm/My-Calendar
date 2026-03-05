const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const oldSettings = `      <div class="settings-section">
        <div class="settings-section-title">Notifications</div>
        <div class="setting-row">
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

const newSettings = `      <div class="settings-section">
        <div class="settings-section-title">Notifications</div>
        <div class="setting-row">
          <div>
            <div class="setting-label">Browser Notifications</div>
            <div class="setting-sub" id="notif-status">Click to request permission</div>
          </div>
          <button class="btn-save" style="padding:5px 12px;font-size:0.76rem;"
            onclick="requestNotifPermission()">Enable</button>
        </div>
      </div>
      <div class="modal-actions" style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border);">
        <button class="btn-save" style="width: 100%;" onclick="closeSettings(); document.getElementById('mbn-more').classList.remove('on');">Done</button>
      </div>
    </div>
  </div>`;

content = content.replace(oldSettings, newSettings);

const oldTray = `  <!-- ── MOBILE BOTTOM NAV ── -->
  <nav id="mob-nav">
    <!-- View tray (pops up above nav) -->
    <div id="mob-view-tray">
      <button class="mvt-btn" id="mvt-month" onclick="mobView('month')">Month</button>
      <button class="mvt-btn" id="mvt-week" onclick="mobView('week')">Week</button>
      <button class="mvt-btn" id="mvt-day" onclick="mobView('day')">Day</button>
      <button class="mvt-btn" id="mvt-year" onclick="mobView('year')">Year</button>
      <button class="mvt-btn" id="mvt-agenda" onclick="mobView('agenda')">Agenda</button>
    </div>

    <button class="mbn-btn" id="mbn-views" onclick="mobToggleViews()">`;

const newTray = `  <!-- View tray (pops up above nav) -->
  <div id="mob-view-tray">
    <button class="mvt-btn" id="mvt-month" onclick="mobView('month')">Month</button>
    <button class="mvt-btn" id="mvt-week" onclick="mobView('week')">Week</button>
    <button class="mvt-btn" id="mvt-day" onclick="mobView('day')">Day</button>
    <button class="mvt-btn" id="mvt-year" onclick="mobView('year')">Year</button>
    <button class="mvt-btn" id="mvt-agenda" onclick="mobView('agenda')">Agenda</button>
  </div>

  <!-- ── MOBILE BOTTOM NAV ── -->
  <nav id="mob-nav">
    <button class="mbn-btn" id="mbn-views" onclick="mobToggleViews()">`;

content = content.replace(oldTray, newTray);

fs.writeFileSync('index.html', content);
console.log('Done replacement');
