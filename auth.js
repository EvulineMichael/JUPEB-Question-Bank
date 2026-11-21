// Bypass auth on localhost
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard-screen').style.display = 'block';
  document.getElementById('app-content').style.display = 'none';
  document.getElementById('app-sidebar').style.display = 'flex';
  document.body.classList.add('has-sidebar');   // add this line
  document.getElementById('sidebar-toggle').style.display = '';
document.getElementById('sidebar-overlay').classList.remove('is-open');
  renderSidebarUser({ name: "Student", isPremium: true, photoURL: null });
  
  if (typeof showDashboard === 'function') {
    showDashboard();
  }
  
  window.authorizedSubjects = ['chemistry', 'physics', 'maths', 'biology'];
  window.userExams = ['jupeb', 'ijmb'];   // test both exams locally
  
  if (typeof initJUPEBApp === 'function') {
    initJUPEBApp();
  }
}

function toggleAccessInfo() {
  const info = document.getElementById('access-info');
  if (info.style.display === 'none') {
    info.style.display = 'block';
  } else {
    info.style.display = 'none';
  }
}

// ===== EXAM ACCESS =====
// A student's record can hold exams: ["jupeb"], ["ijmb"] or ["jupeb", "ijmb"].
// Students added before IJMB existed have no list, so they count as JUPEB only.
function getUserExams(userData) {
  const list = userData && Array.isArray(userData.exams)
    ? userData.exams.filter(e => e === 'jupeb' || e === 'ijmb')
    : [];
  return list.length ? list : ['jupeb'];
}

// ===== ACCESS LASTS ONE YEAR =====
// Each exam runs for a year from the day it was paid for. admin.html saves
// access_until: { jupeb: "2027-11-20", ijmb: "..." }. Students who joined before
// this have none: they all have until LEGACY_ACCESS_UNTIL. The server
// (api/papers.js) does the same check, so this is only for showing the right screen.
function accessIsoDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);   // e.g. "June 14, 2026" on older records
  if (!value || isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function accessUntil(record, exam) {
  const set = record && record.access_until && accessIsoDate(record.access_until[exam]);
  return set || LEGACY_ACCESS_UNTIL;
}
const LEGACY_ACCESS_UNTIL = '2027-11-30';
function todayInNigeria() {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);   // WAT is UTC+1
}
// { jupeb: "2027-06-14", ... } for every exam on the record
function accessDates(record) {
  const dates = {};
  getUserExams(record).forEach(e => { dates[e] = accessUntil(record, e); });
  return dates;
}
// Exams whose year hasn't run out (dates as made by accessDates)
function activeExamsFrom(exams, dates) {
  const today = todayInNigeria();
  return exams.filter(e => !dates || !dates[e] || dates[e] >= today);
}
// "14 June 2027"
function formatAccessDate(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// true if the signed-in student has paid for this exam ('jupeb' or 'ijmb')
function hasExam(exam) {
  return Array.isArray(window.userExams) && window.userExams.includes(exam);
}

// ===== RETURNING STUDENTS SKIP THE HOME SCREEN =====
// After a successful sign-in, this device remembers who signed in and which exams
// they have. Next time, the dashboard opens straight away (even offline) and access
// is re-checked quietly in the background. Questions themselves only come from
// /api/papers, which checks access on the server, so this is safe.
const ACCESS_KEY = 'qb_access';
function getSavedAccess() {
  try { return JSON.parse(localStorage.getItem(ACCESS_KEY) || 'null'); } catch (e) { return null; }
}
function saveAccess(email, exams, until) {
  localStorage.setItem(ACCESS_KEY, JSON.stringify({ email: email, exams: exams, until: until || null }));
}
// Uses a saved or fresh record to set window.userExams (exams still running) and
// window.accessUntilDates. Returns false if every exam's year has run out.
function applyAccess(exams, until) {
  const active = activeExamsFrom(exams, until);
  window.accessUntilDates = until || null;
  if (!active.length) return false;
  window.userExams = active;
  return true;
}
function forgetAccess() {
  localStorage.removeItem(ACCESS_KEY);
}

// Saved question papers belong to the student who downloaded them: remove them on sign-out
function forgetSavedPapers() {
  if (!('caches' in window)) return;
  caches.keys().then(names => names.forEach(name => {
    caches.open(name).then(cache => cache.keys().then(requests => {
      requests.forEach(req => { if (req.url.includes('/api/papers')) cache.delete(req); });
    }));
  })).catch(() => {});
}

const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Before Firebase has even answered, a returning student sees their dashboard,
// not the home screen.
if (!IS_LOCAL && getSavedAccess()) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard-screen').style.display = 'block';
  document.getElementById('app-sidebar').style.display = 'flex';
  document.body.classList.add('has-sidebar');
  document.getElementById('sidebar-toggle').style.display = '';

  // With no internet, Firebase can take a long time to say who is signed in, or
  // never does. Don't keep the student waiting: start the app from what this device
  // saved (access, name, question papers). Offline it starts at once; online it
  // gives Firebase a few seconds first. When Firebase does answer, revealDashboard
  // fills in the rest, and a sign-out still sends the student to the home screen.
  window.addEventListener('load', () => {
    setTimeout(startFromSavedAccess, navigator.onLine ? 4000 : 0);
  });
}

let appStartedFromSaved = false;
function startFromSavedAccess() {
  if (window.jupebAppStarted) return;          // Firebase already answered
  const saved = getSavedAccess();
  if (!saved) return;
  if (!applyAccess(getUserExams({ exams: saved.exams }), saved.until)) {   // the year ran out, even offline
    if (typeof auth !== 'undefined') showAccessEnded(saved.email, saved.until);
    return;
  }
  appStartedFromSaved = true;
  renderSidebarUser({ name: localStorage.getItem('jupeb_user_name') || 'Student', isPremium: true, photoURL: null });
  window.authorizedSubjects = ['chemistry', 'physics', 'maths', 'biology'];
  if (typeof initJUPEBApp === 'function') initJUPEBApp();
  if (typeof runRouteInit === 'function') runRouteInit();
}

function revealDashboard(user) {
  document.body.classList.remove('is-signing-in');
  sessionStorage.removeItem('qb_signing_in');

  if (user.displayName) {
    localStorage.setItem('jupeb_user_name', user.displayName.split(' ')[0]);
    renderSidebarUser({
      name: user.displayName.split(' ')[0],
      isPremium: true,
      photoURL: user.photoURL || null
    });
  }
  window.authorizedSubjects = ['chemistry', 'physics', 'maths', 'biology'];

  if (appStartedFromSaved && window.jupebAppStarted) {
    // Already open from the saved copy (the student may be mid-quiz, so stay put).
    // Now that we know who they are, load any subject that wasn't saved.
    if ((window.jupebFailedSubjects || []).length && window.jupebDataLoaded && typeof retryQuestionLoad === 'function') retryQuestionLoad();
  } else {
    const loginEl = document.getElementById('login-screen');
    if (loginEl) loginEl.style.display = 'none';
    showScreen("dashboard-screen", { pushHistory: false });
    document.getElementById('app-sidebar').style.display = 'flex';
    document.body.classList.add('has-sidebar');
    document.getElementById('sidebar-toggle').style.display = '';
    document.getElementById('sidebar-overlay').style.display = '';
    if (typeof showDashboard === 'function') showDashboard();
    if (typeof initJUPEBApp === 'function') initJUPEBApp();
    if (typeof runRouteInit === 'function') runRouteInit();
  }
  // Bring in this student's stats from their other devices (refreshes the dashboard if anything changed)
  if (typeof syncStatsWithCloud === 'function') syncStatsWithCloud();
}

// Every exam on the account has run its year: they can buy again like a new student
function showAccessEnded(email, until) {
  const last = Object.values(until || {}).sort().pop();
  showAuthMessage('warn',
    `Your access for <strong>${escapeAuthText(email)}</strong> ended${last ? ` on <strong>${escapeAuthText(formatAccessDate(last))}</strong>` : ''}. Access lasts one year from payment. To study for another year, pay again and send your receipt and this Gmail to us on WhatsApp.`,
    `<button type="button" class="auth-msg-btn" onclick="document.getElementById('lp-pricing')?.scrollIntoView({behavior:'smooth'}); if (document.getElementById('access-info').style.display === 'none') toggleAccessInfo();">See prices</button>`);
  forgetAccess();
  auth.signOut();
}

function showNotAuthorized(email) {
  showAuthMessage('warn',
    `<strong>${escapeAuthText(email)}</strong> doesn't have access yet. If you've paid, send your receipt and this Gmail to us on WhatsApp and we'll activate it.`,
    `<button type="button" class="auth-msg-btn" onclick="document.getElementById('lp-pricing')?.scrollIntoView({behavior:'smooth'}); if (document.getElementById('access-info').style.display === 'none') toggleAccessInfo();">How to get access</button>`);
  forgetAccess();
  auth.signOut();
}

// For a returning student: re-check access without making them wait
async function recheckAccess(user, docRef) {
  if (navigator.onLine) {
    try { await recordReferralClaim(user); } catch (e) { /* tried again at the next online visit */ }
  }
  try {
    const doc = await docRef.get();   // from the server when online, from the saved copy when offline
    if (!doc.exists) {
      if (doc.metadata && doc.metadata.fromCache) return;   // offline with nothing saved: keep going
      showNotAuthorized(user.email);                          // access was removed
      return;
    }
    const exams = getUserExams(doc.data());
    const until = accessDates(doc.data());
    const before = (window.userExams || []).join();
    if (!applyAccess(exams, until)) { showAccessEnded(user.email, until); return; }
    saveAccess(user.email, exams, until);
    if (window.userExams.join() !== before) {                // e.g. IJMB was just unlocked, or a year ran out
      if (typeof renderExamSwitch === 'function') renderExamSwitch();
      if (typeof applyExamMode === 'function') applyExamMode();
    }
  } catch (err) {
    // offline or a network problem: keep using the access saved on this device
  }
}

// Check auth state
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const email = user.email;
    const docRef = db.collection("authorized_users").doc(email);
    const saved = getSavedAccess();

    // Returning student on this device: open now, check in the background
    if (saved && saved.email === email) {
      if (!applyAccess(getUserExams({ exams: saved.exams }), saved.until)) { showAccessEnded(email, saved.until); return; }
      revealDashboard(user);
      if (typeof maybeShowWelcome === "function") maybeShowWelcome(user, docRef);
      recheckAccess(user, docRef);
      return;
    }

    // First sign-in on this device: check access before opening (needs internet)
    showAuthMessage('info', 'Checking your access…');
    try { await recordReferralClaim(user); } catch (e) { /* tried again next time; never block sign-in */ }

    let doc;
    try {
      doc = await docRef.get();
    } catch (err) {
      showAuthMessage('error', "We couldn't check your access. Check your internet connection and sign in again.");
      auth.signOut();
      return;
    }

    if (doc.exists) {
      clearAuthMessage();
      // Each exam lasts a year from payment
      const exams = getUserExams(doc.data());
      const until = accessDates(doc.data());
      if (!applyAccess(exams, until)) { showAccessEnded(email, until); return; }
      saveAccess(email, exams, until);
      revealDashboard(user);
      if (typeof maybeShowWelcome === "function") maybeShowWelcome(user, docRef);
    } else {
      showNotAuthorized(email);
    }
  } else {
    if (!sessionStorage.getItem(REDIRECT_FLAG)) setSigningIn(false);
    forgetAccess();
    forgetSavedPapers();
    showScreen("login-screen", { pushHistory: false });
    document.getElementById('app-sidebar').style.display = 'none';
    document.body.classList.remove('has-sidebar');
    document.getElementById('sidebar-toggle').style.display = 'none';
    document.getElementById('sidebar-overlay').classList.remove('is-open');
  }
});


// ===== GOOGLE SIGN-IN =====
// Desktop: a pop-up window. Phones: a full-page sign-in when the site handles sign-in on
// its own address (SITE_HANDLES_AUTH in firebase-config.js), because phones often lose a
// pop-up's result; otherwise a pop-up, with clear messages if it fails.
// In-app browsers (WhatsApp, Instagram, Facebook…) are blocked by Google, so the student
// is shown how to open the site in Chrome or Safari instead.
const REDIRECT_FLAG = 'qb_signing_in';
const UA = navigator.userAgent || '';
const IS_ANDROID = /Android/i.test(UA);
const IS_IOS = /iPhone|iPad|iPod/i.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
const IS_MOBILE = IS_ANDROID || IS_IOS;
const IN_APP_BROWSER = (() => {
  if (/FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Snapchat|TikTok|musical_ly|Line\/|Twitter|LinkedInApp/i.test(UA)) return true;
  if (IS_ANDROID && /; wv\)/.test(UA)) return true;                       // Android WebView
  if (IS_IOS && !/Safari\//.test(UA) && /AppleWebKit/.test(UA)) return true; // iOS WebView
  return false;
})();

function escapeAuthText(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// The message box above the sign-in buttons (#auth-status on the home screen)
function showAuthMessage(kind, html, actionsHtml = '') {
  const box = document.getElementById('auth-status');
  if (!box) return;
  box.innerHTML = `
    <div class="auth-msg auth-msg--${kind}" role="${kind === 'error' || kind === 'warn' ? 'alert' : 'status'}">
      ${kind === 'info' ? '<span class="auth-spinner" aria-hidden="true"></span>' : ''}
      <div class="auth-msg-body"><p>${html}</p>${actionsHtml ? `<div class="auth-msg-actions">${actionsHtml}</div>` : ''}</div>
    </div>`;
  if (kind !== 'info') box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function clearAuthMessage() {
  const box = document.getElementById('auth-status');
  if (box) box.innerHTML = '';
}
function setSigningIn(on) {
  document.body.classList.toggle('is-signing-in', !!on);
  if (on) showAuthMessage('info', 'Signing you in…');
  else {
    sessionStorage.removeItem(REDIRECT_FLAG);
    const box = document.getElementById('auth-status');
    if (box && box.querySelector('.auth-msg--info')) clearAuthMessage();
  }
}

function showInAppBrowserHelp() {
  const url = location.href.split('#')[0];
  const chromeLink = IS_ANDROID
    ? `<a class="auth-msg-btn" href="intent://${escapeAuthText(url.replace(/^https?:\/\//, ''))}#Intent;scheme=https;package=com.android.chrome;end">Open in Chrome</a>`
    : '';
  showAuthMessage('warn',
    `You're in ${/WhatsApp/i.test(UA) ? "WhatsApp's" : /Instagram/i.test(UA) ? "Instagram's" : /FBAN|FBAV|FB_IAB/i.test(UA) ? "Facebook's" : "an app's"} built-in browser, and Google doesn't allow sign-in here. ` +
    (IS_IOS ? 'Tap the <strong>•••</strong> or share button and choose <strong>Open in Safari</strong>, then sign in.'
            : 'Tap <strong>⋮</strong> and choose <strong>Open in Chrome</strong> (or your usual browser), then sign in.'),
    `${chromeLink}<button type="button" class="auth-msg-btn auth-msg-btn--ghost" onclick="copySiteLink(this)">Copy link</button>`);
}
function copySiteLink(btn) {
  const url = location.href.split('#')[0];
  const done = () => { btn.textContent = 'Link copied'; };
  const showLink = () => (typeof appDialog === 'function')
    ? appDialog({ title: 'Copy this link', icon: 'info', confirmText: 'Done',
        message: `<p>Press and hold the link to copy it, then paste it into Chrome or Safari.</p><p><strong style="user-select:all;word-break:break-all">${escapeAuthText(url)}</strong></p>` })
    : prompt('Copy this link:', url);
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done).catch(showLink);
  else showLink();
}

function handleSignInError(error) {
  setSigningIn(false);
  const code = (error && error.code) || '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' || code === 'auth/user-cancelled') return;
  if (code === 'auth/too-many-requests') {
    if (typeof appDialog === 'function') {
      appDialog({ title: 'Too many attempts', icon: 'clock', tone: 'warning', confirmText: 'OK',
        message: '<p>Google has paused sign-in on this device for a short while because of several attempts in a row.</p><p>Wait about a minute, then tap <strong>Sign in</strong> once.</p>' });
    } else showAuthMessage('error', 'Too many attempts. Wait a minute, then try again.');
  } else if (code === 'auth/network-request-failed') {
    showAuthMessage('error', "No internet connection. Check your data or Wi-Fi and try again.");
  } else if (code === 'auth/popup-blocked') {
    if (typeof appDialog === 'function') {
      appDialog({ title: 'Sign-in window was blocked', icon: 'warning', tone: 'warning', confirmText: 'Try again', cancelText: 'Close',
        message: '<p>Your browser stopped the Google sign-in window from opening.</p><p>Allow pop-ups for this site in your browser settings, or open the site in Chrome or Safari, then try again.</p>' })
        .then((retry) => { if (retry) signInWithGoogle(); });
    } else showAuthMessage('error', "Your browser blocked the Google sign-in window. Allow pop-ups for this site, or open it in Chrome or Safari, and try again.");
  } else if (code === 'auth/web-storage-unsupported' || code === 'auth/operation-not-supported-in-this-environment') {
    showAuthMessage('error', "This browser is blocking sign-in. Open the site in Chrome or Safari (not private mode) and try again.");
  } else if (code === 'auth/unauthorized-domain') {
    showAuthMessage('error', "Sign-in isn't set up for this web address yet. Please message us on WhatsApp.");
  } else {
    showAuthMessage('error', `Sign-in didn't finish. Please try again.${code ? ` <small>(${escapeAuthText(code)})</small>` : ''}`);
  }
  console.error('Sign-in error:', error);
}

// Tapped "Sign in" again while a sign-in is still open
let _signInStartedAt = 0;
function signInAlreadyOpen() {
  const waited = Math.round((Date.now() - _signInStartedAt) / 1000);
  if (typeof appDialog !== 'function') return;
  appDialog({
    title: 'Sign-in is already open',
    message: `<p>Finish signing in with Google in the window that opened${waited > 2 ? ` ${waited} seconds ago` : ''}.</p><p>Closed it, or can't see it? Start again.</p>`,
    icon: 'google', confirmText: 'Start again', cancelText: 'Keep waiting'
  }).then((restart) => {
    if (!restart) return;
    setSigningIn(false);
    signInWithGoogle();
  });
}

function signInWithGoogle() {
  if (IN_APP_BROWSER) { showInAppBrowserHelp(); return; }
  if (document.body.classList.contains('is-signing-in')) { signInAlreadyOpen(); return; }
  _signInStartedAt = Date.now();
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const canRedirect = typeof SITE_HANDLES_AUTH !== 'undefined' && SITE_HANDLES_AUTH;
  setSigningIn(true);

  if (IS_MOBILE && canRedirect) {
    sessionStorage.setItem(REDIRECT_FLAG, '1');
    auth.signInWithRedirect(provider).catch(handleSignInError);
    return;
  }
  auth.signInWithPopup(provider).catch((error) => {
    if (error && error.code === 'auth/popup-blocked' && canRedirect) {
      sessionStorage.setItem(REDIRECT_FLAG, '1');
      return auth.signInWithRedirect(provider).catch(handleSignInError);
    }
    handleSignInError(error);
  });
}

// Coming back from a full-page sign-in: say so while Firebase finishes
if (sessionStorage.getItem(REDIRECT_FLAG)) {
  document.body.classList.add('is-signing-in');
  showAuthMessage('info', 'Finishing sign-in…');
}
auth.getRedirectResult().then((result) => {
  if (result && result.user) console.log('Redirect sign-in successful:', result.user.email);
  else if (sessionStorage.getItem(REDIRECT_FLAG)) setSigningIn(false);   // came back without signing in
  sessionStorage.removeItem(REDIRECT_FLAG);
}).catch((error) => {
  sessionStorage.removeItem(REDIRECT_FLAG);
  handleSignInError(error);
});

// Sign Out
function signOutUser() {
  auth.signOut();
}