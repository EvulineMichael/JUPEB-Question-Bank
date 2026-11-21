// ===== ADD TO HOME SCREEN GUIDE =====
// A step-by-step guide with drawn phone screens, for iPhone (Safari) and Android
// (Chrome). Opened by openInstallGuide() from Help & Support (the FAQ and the
// "Getting around" card). On phones that allow it (Android Chrome), there is also a
// one-tap "Install" button. Styles: .ig-* in account.css.

(function () {
  const UA = navigator.userAgent || '';
  const IS_IOS = /iPhone|iPad|iPod/i.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
  const IS_ANDROID = /Android/i.test(UA);
  const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Snapchat|TikTok|Line\/|Twitter|LinkedInApp/i.test(UA)
    || (IS_ANDROID && /; wv\)/.test(UA))
    || (IS_IOS && !/Safari\//.test(UA) && /AppleWebKit/.test(UA));
  const installed = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  // Android Chrome offers its own install prompt: keep it for the "Install" button
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    refreshInstallButton();
  });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; refreshInstallButton(); });

  const ICON = '<img src="/icon-192.png" alt="">';
  const APP_NAME = 'JUPEB &amp; IJMB';

  // ----- the drawn phone screens -----
  function page() {
    return `<div class="ig-page"><div class="ig-page-head">${ICON}<span></span></div><i></i><i></i><i class="ig-short"></i><i></i><i class="ig-short"></i></div>`;
  }
  const SHARE = '<svg viewBox="0 0 24 24"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
  const PLUS = '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
  const DOTS = '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>';
  const HDOTS = '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>';

  const SCREENS = {
    // iPhone, Safari
    'ios-1': () => `
      <div class="ig-screen">
        ${page()}
        <div class="ig-safari-bar">
          <span class="ig-url">jupebijmbprep.com</span>
          <div class="ig-safari-icons"><b>‹</b><b>›</b><b class="ig-hot">${SHARE}</b><b>${HDOTS}</b></div>
        </div>
      </div>`,
    'ios-2': () => `
      <div class="ig-screen">
        ${page()}
        <div class="ig-sheet">
          <div class="ig-sheet-row">Copy</div>
          <div class="ig-sheet-row">Add to Reading List</div>
          <div class="ig-sheet-row ig-hot-row">Add to Home Screen ${PLUS}</div>
          <div class="ig-sheet-row">Find on Page</div>
        </div>
      </div>`,
    'ios-3': () => `
      <div class="ig-screen ig-screen--plain">
        <div class="ig-dialog-bar"><span>Cancel</span><strong>Add to Home</strong><span class="ig-hot-text">Add</span></div>
        <div class="ig-dialog-app">${ICON}<div><b>${APP_NAME}</b><small>jupebijmbprep.com</small></div></div>
        <div class="ig-dialog-toggle">Open as Web App <span class="ig-switch"></span></div>
      </div>`,
    // Android, Chrome
    'and-1': () => `
      <div class="ig-screen">
        <div class="ig-chrome-bar"><span class="ig-url">jupebijmbprep.com</span><b class="ig-hot">${DOTS}</b></div>
        ${page()}
      </div>`,
    'and-2': () => `
      <div class="ig-screen">
        <div class="ig-chrome-bar"><span class="ig-url">jupebijmbprep.com</span><b>${DOTS}</b></div>
        ${page()}
        <div class="ig-menu">
          <div class="ig-menu-row">New tab</div>
          <div class="ig-menu-row">Bookmarks</div>
          <div class="ig-menu-row">History</div>
          <div class="ig-menu-row ig-hot-row">Add to Home screen</div>
          <div class="ig-menu-row">Settings</div>
        </div>
      </div>`,
    'and-3': () => `
      <div class="ig-screen ig-screen--dim">
        ${page()}
        <div class="ig-modal">
          <strong>Install app?</strong>
          <div class="ig-dialog-app">${ICON}<div><b>${APP_NAME}</b><small>jupebijmbprep.com</small></div></div>
          <div class="ig-modal-btns"><span>Cancel</span><span class="ig-hot-text">Install</span></div>
        </div>
      </div>`,
    // both
    'home': () => `
      <div class="ig-screen ig-screen--home">
        <div class="ig-home-grid">
          <i></i><i></i><i></i><i></i>
          <i></i>
          <span class="ig-home-app">${ICON}<small>JUPEB &amp; IJMB</small></span>
          <i></i><i></i>
        </div>
      </div>`
  };

  const STEPS = {
    ios: [
      { s: 'ios-1', t: 'Tap the Share button', d: 'Open the site in <strong>Safari</strong> and tap the Share button (a square with an arrow). On newer iPhones it may be inside the <strong>•••</strong> menu.' },
      { s: 'ios-2', t: 'Tap “Add to Home Screen”', d: 'Scroll down the list to find it. If you don\'t see it, tap <strong>View More</strong> or <strong>Edit Actions</strong>.' },
      { s: 'ios-3', t: 'Tap “Add”', d: 'Keep “Open as Web App” on if you see it, then tap <strong>Add</strong> at the top.' },
      { s: 'home', t: 'Open it from your home screen', d: 'The icon is now with your other apps. It opens full screen, like an app, and works offline once you\'ve signed in.' }
    ],
    android: [
      { s: 'and-1', t: 'Tap the ⋮ menu', d: 'Open the site in <strong>Chrome</strong> and tap the three dots at the top right.' },
      { s: 'and-2', t: 'Tap “Add to Home screen”', d: 'It may say <strong>Install app</strong> instead. On Samsung Internet, tap <strong>≡</strong>, then <strong>Add page to</strong>, then <strong>Home screen</strong>.' },
      { s: 'and-3', t: 'Tap “Install”', d: 'Confirm, and your phone adds the app. Some phones ask you to tap <strong>Add</strong> once more.' },
      { s: 'home', t: 'Open it from your home screen', d: 'The icon is now with your other apps. It opens full screen, like an app, and works offline once you\'ve signed in.' }
    ]
  };

  let overlay = null;
  let platform = IS_IOS ? 'ios' : 'android';

  function render() {
    const steps = STEPS[platform].map((step, i) => `
      <li class="ig-step">
        <div class="ig-phone">${SCREENS[step.s]()}</div>
        <div class="ig-step-text">
          <span class="ig-step-num">${i + 1}</span>
          <strong>${step.t}</strong>
          <p>${step.d}</p>
        </div>
      </li>`).join('');

    let notice = '';
    if (installed()) {
      notice = '<p class="ig-notice ig-notice--ok">✓ You\'re already using the app from your home screen.</p>';
    } else if (IN_APP) {
      notice = `<p class="ig-notice">You opened this inside another app (like WhatsApp or Instagram). First open <strong>jupebijmbprep.com</strong> in ${IS_IOS ? 'Safari' : 'Chrome'}, then follow these steps.</p>`;
    } else if (!IS_IOS && !IS_ANDROID) {
      notice = '<p class="ig-notice">On a computer, Chrome and Edge show an install icon at the right of the address bar. On your phone, follow the steps below.</p>';
    }

    overlay.innerHTML = `
      <div class="ig-card" role="dialog" aria-modal="true" aria-labelledby="ig-title">
        <button type="button" class="ig-close" data-ig-close aria-label="Close">×</button>
        <div class="ig-head">
          <span class="ig-head-icon">${ICON}</span>
          <h2 id="ig-title">Add the app to your home screen</h2>
          <p>Open it in one tap, full screen, and study offline. It takes less than a minute, and there's nothing to download from an app store.</p>
        </div>
        ${notice}
        <button type="button" class="ig-install-btn" id="ig-install-btn" hidden>Install now</button>
        <div class="ig-tabs" role="tablist">
          <button type="button" role="tab" data-ig-tab="ios" aria-selected="${platform === 'ios'}">iPhone</button>
          <button type="button" role="tab" data-ig-tab="android" aria-selected="${platform === 'android'}">Android</button>
        </div>
        <ol class="ig-steps">${steps}</ol>
      </div>`;
    refreshInstallButton();
  }

  function refreshInstallButton() {
    const btn = document.getElementById('ig-install-btn');
    if (btn) btn.hidden = !deferredPrompt || installed();
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  window.openInstallGuide = function () {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'ig-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', async (e) => {
        if (e.target === overlay || e.target.closest('[data-ig-close]')) return close();
        const tab = e.target.closest('[data-ig-tab]');
        if (tab) { platform = tab.dataset.igTab; render(); return; }
        if (e.target.closest('#ig-install-btn') && deferredPrompt) {
          deferredPrompt.prompt();
          try { await deferredPrompt.userChoice; } catch (err) { /* closed */ }
          deferredPrompt = null;
          refreshInstallButton();
        }
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    }
    render();
    overlay.classList.add('is-open');
    overlay.scrollTop = 0;
    document.body.style.overflow = 'hidden';
  };
})();
