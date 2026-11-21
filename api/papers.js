// api/papers.js  —  serves question papers only to signed-in, paid students.
//
// The site calls:  GET /api/papers?exam=jupeb&subject=chemistry
//                  with the header  Authorization: Bearer <Firebase ID token>
// It answers with every paper for that subject and exam:
//   { subject, exam, papers: [ { year, paper, label, questions: [...] }, ... ] }
//
// Checks, in order: a real Firebase sign-in -> an authorized_users record ->
// that record includes this exam (records with no "exams" list count as JUPEB).
// The question files stay in data/ (JUPEB) and data/ijmb/ (IJMB); vercel.json
// blocks anyone from opening /data/... directly.

const fs = require('fs');
const path = require('path');

// Set up Firebase. If anything is wrong with the setup, remember what, and tell
// the caller in plain words instead of crashing (the key itself is never shown).
let admin = null;
let setupError = null;
try {
  admin = require('firebase-admin');
} catch (err) {
  setupError = 'firebase-admin is not installed. Check package.json is in the project root and was pushed.';
}
if (!setupError && !admin.apps.length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    setupError = 'FIREBASE_SERVICE_ACCOUNT is not set for this deployment. Add it in Environment Variables, then redeploy.';
  } else {
    let creds = null;
    try {
      creds = JSON.parse(raw);
    } catch (err) {
      setupError = 'FIREBASE_SERVICE_ACCOUNT is not valid JSON. Paste the whole key file, from the first { to the last }.';
    }
    if (creds) {
      try {
        admin.initializeApp({ credential: admin.credential.cert(creds) });
      } catch (err) {
        setupError = 'The service account key was rejected: ' + err.message;
      }
    }
  }
}

const ROMAN = { 1: 'I', 2: 'II', 3: 'III' };
// 2025.json | 2025-typea.json | 2016-paper1.json
const FILE_RE = /^(\d{4})(?:-(?:type([a-d])|paper([1-3])))?\.json$/i;

function examsOf(record) {
  const list = record && Array.isArray(record.exams)
    ? record.exams.filter(e => e === 'jupeb' || e === 'ijmb') : [];
  return list.length ? list : ['jupeb'];
}

// ===== ACCESS LASTS ONE YEAR =====
// Each exam on a student's record runs for a year from the day it was paid for:
// access_until: { jupeb: "2027-11-20", ijmb: "2028-01-05" } (set by admin.html).
// Students who joined before this have no access_until: they all have until
// LEGACY_ACCESS_UNTIL. Keep in step with auth.js and admin.html.
const LEGACY_ACCESS_UNTIL = '2027-11-30';
function isoDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);   // e.g. "June 14, 2026" on older records
  if (!value || isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function accessUntil(record, exam) {
  const set = record && record.access_until && isoDate(record.access_until[exam]);
  return set || LEGACY_ACCESS_UNTIL;
}
function todayInNigeria() {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);   // WAT is UTC+1
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  if (setupError) return res.status(500).json({ error: 'Server setup problem', detail: setupError });

  const exam = String(req.query.exam || 'jupeb');
  const subject = String(req.query.subject || '');
  // letters only, so nobody can ask for ../../anything
  if (!['jupeb', 'ijmb'].includes(exam) || !/^[a-zA-Z]{2,40}$/.test(subject)) {
    return res.status(400).json({ error: 'Bad request' });
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Please sign in' });

  let email;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    // Only trust emails the sign-in provider has confirmed (Google always does).
    // Without this, someone could create an unconfirmed account under a paid
    // student's email address if another sign-in method were ever switched on.
    if (decoded.email_verified !== true) return res.status(403).json({ error: 'Please sign in with Google' });
    email = decoded.email;
  } catch (err) {
    // err.code says which check failed, e.g. "auth/id-token-expired", or
    // "auth/argument-error" when the token belongs to a different Firebase project than
    // FIREBASE_SERVICE_ACCOUNT. Nothing secret is in it.
    console.error('verifyIdToken failed:', err.code, err.message);
    return res.status(401).json({ error: 'Sign-in expired. Please reload the page.', detail: err.code || 'token-check-failed' });
  }
  if (!email) return res.status(401).json({ error: 'Please sign in' });

  let record;
  try {
    const snap = await admin.firestore().collection('authorized_users').doc(email).get();
    if (!snap.exists) return res.status(403).json({ error: 'Not authorized' });
    record = snap.data();
  } catch (err) {
    console.error('authorized_users read failed:', err.code, err.message);
    return res.status(500).json({ error: 'Could not check your access. Please try again.', detail: String(err.code || 'firestore-read-failed') });
  }
  if (!examsOf(record).includes(exam)) {
    return res.status(403).json({ error: 'This exam is not unlocked on your account' });
  }
  const until = accessUntil(record, exam);
  if (until < todayInNigeria()) {
    return res.status(403).json({ error: `Your ${exam.toUpperCase()} access ended on ${until}.`, detail: 'access-ended' });
  }

  const dir = path.join(process.cwd(), 'data', ...(exam === 'ijmb' ? ['ijmb'] : []), subject);
  let names = [];
  try { names = fs.readdirSync(dir); } catch (err) { names = []; }   // no folder = no papers yet

  const papers = [];
  for (const name of names) {
    const m = name.match(FILE_RE);
    if (!m) continue;
    const year = Number(m[1]);
    const paper = m[2] ? `Type ${m[2].toUpperCase()}` : m[3] ? `Paper ${ROMAN[m[3]]}` : null;
    let fileData;
    try { fileData = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')); } catch (err) { continue; }
    // a file is either a list of questions, or { "questions": [...] }
    const questions = Array.isArray(fileData) ? fileData
      : (fileData && Array.isArray(fileData.questions)) ? fileData.questions : null;
    if (!questions) continue;
    papers.push({ year, paper, label: paper ? `${year} ${paper}` : String(year), questions });
  }
  papers.sort((a, b) => a.year - b.year || String(a.paper || '').localeCompare(String(b.paper || '')));

  return res.status(200).json({ subject, exam, papers });
};