// ===== WRITTEN QUIZ (essay questions the student marks themselves) =====
// Its own file: essay-quiz.js, loaded right AFTER script.js.
//
// Quiz mode has two kinds of quiz, kept in quizState.kind:
//   'objective': multiple choice, marked automatically (script.js)
//   'essay':     written answers. The student answers on paper (or types in the
//                box), opens the model answer, and ticks each part they got right.
// The lobby, timer, topic picker and past-exam picker in script.js are shared;
// this file draws the question screen, the review screen and the results.
// IJMB is almost all essays, so this is the main quiz there.

const ESSAY_PRACTICE_LENGTH = 5;      // written questions per practice quiz
const ESSAY_MAX_POINTS = 8;           // most tick-boxes shown for one model answer

// A written question that can appear in a quiz: it needs a real model answer
function isEssayQuizzable(q) {
    if (!q || q.type !== 'Essay' || q.excludeFromQuiz || q.diagramMissing) return false;
    const a = (q.modelAnswer || '').trim();
    if (a.length < 30) return false;
    return !/refer to (your|the) original (past question )?paper/i.test(a);   // answer needs a missing figure
}

// The test for the kind of quiz being set up
function quizKindTest(kind) {
    return kind === 'essay' ? isEssayQuizzable : isQuizzable;
}

// How many questions of each kind a subject has
function quizKindCounts(subject) {
    const list = (typeof allSubjectData === 'object' && allSubjectData[subject]) || [];
    return { objective: list.filter(isQuizzable).length, essay: list.filter(isEssayQuizzable).length };
}

// Questions that count towards a subject's "covered" figure on the dashboard.
// JUPEB keeps counting multiple choice only, so nobody's percentage drops.
// IJMB is mostly essays, so written questions count there too.
function isInProgressBank(q) {
    const ijmb = typeof currentExamIs === 'function' && currentExamIs('ijmb');
    return isQuizzable(q) || (ijmb && isEssayQuizzable(q));
}

// Marks printed in the question, e.g. "[04marks]" or "(5 marks)". Parts are added up.
// Returns null when the paper doesn't say.
function essayMarks(q) {
    const text = q.question || '';
    let total = 0, found = false;
    text.replace(/[\[(]\s*(\d{1,2})\s*marks?\s*[\])]/gi, (m, n) => { total += parseInt(n, 10); found = true; return m; });
    return found && total > 0 ? total : null;
}

// Split a model answer into the parts a student ticks off.
// Notes ("Note: the paper says ...", "(Check: ...)") are shown but not ticked.
function essayMarkingPoints(answer) {
    const blocks = String(answer || '').split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    const isNote = b => /^\(?\s*(note|notes|reading note|misprint note|check|figure|assumption)\b[^:]{0,30}:/i.test(b);
    const notes = blocks.filter(isNote);
    let points = blocks.filter(b => !isNote(b));
    if (!points.length) { points = blocks; notes.length = 0; }

    // Only a few paragraphs, but they hold lists ("1. ... 2. ... 3. ..."): one box per list item,
    // with any heading line kept on the first item. A list headed "Any four" only needs
    // four of its items, so it is remembered as a group that scores at most 4.
    let groups = [];
    if (points.length < 4) {
        const expanded = [];
        points.forEach(block => {
            const lines = block.split('\n');
            const isItem = l => /^\s*(\d{1,2}[.)]|[•▪\-–])\s+/.test(l);   // "1.", "2)", "•" (not "(b)", which starts a part)
            const itemCount = lines.filter(isItem).length;
            if (itemCount < 3) { expanded.push(block); return; }
            const first = expanded.length;
            let current = [];
            lines.forEach(l => {
                if (isItem(l) && current.some(isItem)) { expanded.push(current.join('\n')); current = []; }
                current.push(l);
            });
            if (current.length) expanded.push(current.join('\n'));
            const firstItem = lines.findIndex(isItem);
            const limit = anyLimit(lines.slice(0, Math.max(firstItem, 0)).join(' '));
            const items = expanded.slice(first).map((_, k) => first + k);
            if (limit && limit < items.length) groups.push({ items, limit });
        });
        points = expanded;
    }

    // One long paragraph: tick it line by line instead
    if (points.length === 1) {
        const lines = points[0].split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length >= 3) points = groupInto(lines, ESSAY_MAX_POINTS).map(g => g.join('\n'));
    }
    // Very many paragraphs: join neighbours so there are only a handful of boxes.
    // (An "any four" list may use a few more boxes before that happens.)
    if (points.length > (groups.length ? 12 : ESSAY_MAX_POINTS)) {
        points = groupInto(points, 6).map(g => g.join('\n\n'));
        groups = [];
    }
    return { notes, points, groups };
}

// "Any four:", "(any two)" in a list heading → 4, 2. Otherwise null.
function anyLimit(heading) {
    const m = /\bany\s+(one|two|three|four|five|six|seven|eight|\d{1,2})\b/i.exec(heading);
    if (!m) return null;
    const words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
    return words[m[1].toLowerCase()] || parseInt(m[1], 10) || null;
}

// Split items into at most n groups of neighbours, as even as possible
function groupInto(items, n) {
    if (items.length <= n) return items.map(i => [i]);
    const groups = [];
    const size = items.length / n;
    for (let g = 0; g < n; g++) groups.push(items.slice(Math.round(g * size), Math.round((g + 1) * size)));
    return groups.filter(g => g.length);
}

// ----- STATE for the written quiz in progress -----
// essay.points[i]   marking points for question i (worked out once)
// essay.revealed    questions whose model answer has been opened (these count as answered)
// essay.ticked[i]   Set of the parts the student said they got right
// essay.typed[i]    what they typed in the answer box, if anything
function resetEssayState() {
    quizState.essay = { points: {}, revealed: new Set(), ticked: {}, typed: {} };
    quizState.answers = {};   // kept in step with essay.revealed, for the shared helpers
}

function essayPointsFor(i) {
    const e = quizState.essay;
    if (!e.points[i]) e.points[i] = essayMarkingPoints(quizState.questions[i].modelAnswer);
    return e.points[i];
}

// Share of the question the student gave themselves, 0 to 1 (0 if not marked)
// An "any four" list counts as 4 possible points, and ticking more than 4 of it still gives 4.
function essayFraction(i) {
    const e = quizState.essay;
    if (!e.revealed.has(i)) return 0;
    const { points, groups } = essayPointsFor(i);
    const ticked = e.ticked[i] || new Set();
    const inGroup = new Set(groups.flatMap(g => g.items));
    let got = 0, possible = 0;
    points.forEach((_, n) => { if (!inGroup.has(n)) { possible++; if (ticked.has(n)) got++; } });
    groups.forEach(g => {
        possible += g.limit;
        got += Math.min(g.limit, g.items.filter(n => ticked.has(n)).length);
    });
    return possible ? got / possible : 0;
}

function essayMarksText(i) {
    const marks = essayMarks(quizState.questions[i]);
    if (marks === null) return `${Math.round(essayFraction(i) * 100)}%`;
    const got = Math.round(essayFraction(i) * marks * 10) / 10;
    return `${got} / ${marks} mark${marks === 1 ? '' : 's'}`;
}

// ----- START -----
function startEssayQuiz() {
    const pool = shuffleArray(getAvailableQuestions());
    // A past exam keeps the paper's own order
    const ordered = quizState.mode === 'exam'
        ? getAvailableQuestions().slice().sort((a, b) => String(a.questionNumber).localeCompare(String(b.questionNumber), undefined, { numeric: true }))
        : pool;
    quizState.questions = ordered.slice(0, Math.min(quizState.count, ordered.length));
    quizState.currentIndex = 0;
    quizState.flagged = new Set();
    quizState.submitted = false;
    quizState.startTime = Date.now();
    quizState.timeRemaining = quizState.totalTime;
    resetEssayState();
    renderEssayExam();
    if (quizState.timed && quizState.totalTime > 0) startTimer();
}

// ----- QUESTION SCREEN -----
function renderEssayExam() {
    const i = quizState.currentIndex;
    const q = quizState.questions[i];
    const e = quizState.essay;
    const total = quizState.questions.length;
    const marked = e.revealed.size;
    const progress = Math.round((marked / total) * 100);
    const isRevealed = e.revealed.has(i);
    const isFlagged = quizState.flagged.has(i);
    const marks = essayMarks(q);

    const navDots = quizState.questions.map((_, n) => {
        let cls = 'nav-dot';
        if (n === i) cls += ' current';
        else if (e.revealed.has(n)) cls += ' answered';
        if (quizState.flagged.has(n)) cls += ' flagged';
        return `<button class="${cls}" data-idx="${n}">${n + 1}</button>`;
    }).join('');

    let markingHtml = '';
    if (isRevealed) {
        const { notes, points, groups } = essayPointsFor(i);
        const ticked = e.ticked[i] || new Set();
        const anyHint = groups.length ? ` Where the answer says "any ${groups[0].limit}", you only need ${groups[0].limit} of that list for full marks.` : '';
        markingHtml = `
            <div class="eq-marking">
                <div class="eq-marking-head">
                    <div>
                        <span class="explanation-label">Model answer</span>
                        <p class="eq-marking-hint">Tick each part you got right in your answer.${anyHint}</p>
                    </div>
                    <div class="eq-marking-quick">
                        <button type="button" class="eq-quick-btn" id="eq-tick-all">I got all of it</button>
                        <button type="button" class="eq-quick-btn" id="eq-tick-none">Clear</button>
                    </div>
                </div>
                ${notes.length ? `<div class="eq-notes">${notes.map(n => formatModelAnswer(n)).join('<div class="eq-gap"></div>')}</div>` : ''}
                <ol class="eq-points">
                    ${points.map((p, n) => `
                    <li class="eq-point ${ticked.has(n) ? 'is-ticked' : ''}">
                        <label>
                            <input type="checkbox" class="eq-point-box" data-point="${n}" ${ticked.has(n) ? 'checked' : ''}>
                            <span class="eq-point-check" aria-hidden="true"></span>
                            <span class="eq-point-text">${formatModelAnswer(p)}</span>
                        </label>
                    </li>`).join('')}
                </ol>
                <div class="eq-score" id="eq-score">Your mark for this question: <strong>${essayMarksText(i)}</strong></div>
            </div>`;
    }

    questionsContainer.innerHTML = `
        <div class="quiz-exam-wrapper eq-wrapper">
            <div class="quiz-top-bar">
                <div class="quiz-meta">
                    <div class="qz-top-row">
                        <span class="quiz-progress-text">Question <strong>${i + 1}</strong> of ${total}</span>
                        <span class="quiz-stats-inline">${marked} marked · ${quizState.flagged.size} flagged</span>
                    </div>
                    <div class="quiz-progress-bar-wrap"><div class="quiz-progress-bar-fill" style="width:${progress}%"></div></div>
                </div>
                <div class="quiz-top-actions">
                    ${quizState.timed ? `<div class="quiz-timer-box"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2h5"/></svg><span id="quiz-timer-display">${formatTime(quizState.timeRemaining)}</span></div>` : ''}
                    <button class="quiz-submit-early-btn" id="quiz-submit-early">Finish</button>
                </div>
            </div>
            <div class="quiz-navigator" id="quiz-navigator" aria-label="Jump to a question">${navDots}</div>
            <div class="quiz-question-card" data-anim-key="${i}">
                <div class="quiz-q-meta">
                    <span class="quiz-q-badge num-badge">Q${String(q.questionNumber).padStart(2, '0')}</span>
                    <span class="quiz-q-badge year-badge">${q.year}${q.paper ? ' · ' + escapeHtml(q.paper) : ''}</span>
                    <span class="quiz-q-badge cat-badge">${escapeHtml(q.category || '')}</span>
                    ${marks !== null ? `<span class="quiz-q-badge eq-marks-badge">${marks} mark${marks === 1 ? '' : 's'}</span>` : ''}
                    ${isFlagged ? '<span class="quiz-q-badge flag-badge">🚩 Flagged</span>' : ''}
                </div>
                ${renderQuestionBody(q)}
                <label class="eq-answer-label" for="eq-answer">Your answer <span>Write it on paper, or type it here</span></label>
                <textarea id="eq-answer" class="eq-answer" rows="${isRevealed ? 4 : 7}" placeholder="Type your answer (optional)">${escapeHtml(e.typed[i] || '')}</textarea>
                ${isRevealed ? markingHtml : `
                <button type="button" class="eq-reveal-btn" id="eq-reveal-btn">
                    Done. Show the model answer
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </button>
                <p class="eq-reveal-hint">You'll then tick the parts you got right, like an examiner's marking scheme.</p>`}
                <div class="quiz-card-actions">
                    <button class="quiz-flag-btn ${isFlagged ? 'flagged' : ''}" id="quiz-flag-btn">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>${isFlagged ? 'Unflag' : 'Flag'}
                    </button>
                    <div class="quiz-nav-btns">
                        <button class="quiz-prev-btn" id="quiz-prev-btn" ${i === 0 ? 'disabled' : ''}>
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg><span>Previous</span>
                        </button>
                        <button class="quiz-next-btn" id="quiz-next-btn">
                            <span>${i === total - 1 ? 'Finish' : 'Next'}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                        </button>
                    </div>
                </div>
            </div>
            <p class="qz-shortcuts">Keyboard: <kbd>←</kbd> <kbd>→</kbd> to move · <kbd>F</kbd> to flag</p>
        </div>`;

    document.querySelector('#quiz-navigator .nav-dot.current')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise([questionsContainer]).catch(err => console.log('MathJax error:', err));
    }
    setupEssayExamListeners();
    updateTimerDisplay();
}

function setupEssayExamListeners() {
    const i = quizState.currentIndex;
    const e = quizState.essay;
    const go = (n) => { quizState.currentIndex = n; renderEssayExam(); };

    document.getElementById('eq-answer').addEventListener('input', function () { e.typed[i] = this.value; });

    document.getElementById('eq-reveal-btn')?.addEventListener('click', () => {
        e.revealed.add(i);
        quizState.answers[i] = 'marked';
        if (!e.ticked[i]) e.ticked[i] = new Set();
        renderEssayExam();
        document.querySelector('.eq-marking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const refreshScore = () => {
        const el = document.getElementById('eq-score');
        if (el) el.innerHTML = `Your mark for this question: <strong>${essayMarksText(i)}</strong>`;
    };
    document.querySelectorAll('.eq-point-box').forEach(box => box.addEventListener('change', () => {
        const set = e.ticked[i] || (e.ticked[i] = new Set());
        const n = parseInt(box.dataset.point, 10);
        if (box.checked) set.add(n); else set.delete(n);
        box.closest('.eq-point').classList.toggle('is-ticked', box.checked);
        refreshScore();
    }));
    const tickAll = (on) => {
        const set = e.ticked[i] || (e.ticked[i] = new Set());
        document.querySelectorAll('.eq-point-box').forEach(box => {
            const n = parseInt(box.dataset.point, 10);
            box.checked = on;
            if (on) set.add(n); else set.delete(n);
            box.closest('.eq-point').classList.toggle('is-ticked', on);
        });
        refreshScore();
    };
    document.getElementById('eq-tick-all')?.addEventListener('click', () => tickAll(true));
    document.getElementById('eq-tick-none')?.addEventListener('click', () => tickAll(false));

    document.querySelectorAll('.nav-dot').forEach(dot => dot.addEventListener('click', () => go(parseInt(dot.dataset.idx, 10))));
    document.getElementById('quiz-prev-btn').addEventListener('click', () => { if (i > 0) go(i - 1); });
    document.getElementById('quiz-next-btn').addEventListener('click', () => {
        if (i < quizState.questions.length - 1) go(i + 1);
        else showEssayReviewScreen();
    });
    document.getElementById('quiz-flag-btn').addEventListener('click', () => {
        if (quizState.flagged.has(i)) quizState.flagged.delete(i); else quizState.flagged.add(i);
        renderEssayExam();
    });
    document.getElementById('quiz-submit-early').addEventListener('click', () => showEssayReviewScreen());
}

// ----- REVIEW BEFORE FINISHING -----
function showEssayReviewScreen() {
    const total = quizState.questions.length;
    const marked = quizState.essay.revealed.size;
    const unmarked = total - marked;
    const flaggedList = [...quizState.flagged];
    const unmarkedList = quizState.questions.map((_, n) => n).filter(n => !quizState.essay.revealed.has(n));

    questionsContainer.innerHTML = `
        <div class="quiz-review-screen">
            <span class="qz-kicker">Almost done</span>
            <h2>Check before you finish</h2>
            <div class="quiz-review-stats">
                <div class="review-stat"><span class="rs-num">${total}</span><span class="rs-label">Total</span></div>
                <div class="review-stat answered"><span class="rs-num">${marked}</span><span class="rs-label">Marked</span></div>
                <div class="review-stat unanswered"><span class="rs-num">${unmarked}</span><span class="rs-label">Not marked</span></div>
                <div class="review-stat flagged-stat"><span class="rs-num">${flaggedList.length}</span><span class="rs-label">Flagged</span></div>
            </div>
            ${unmarkedList.length ? `<div class="review-flagged-section"><span>Not marked yet</span><div>${unmarkedList.map(n => `<button class="review-jump-btn" data-idx="${n}">Q${n + 1}</button>`).join('')}</div></div>` : ''}
            ${flaggedList.length ? `<div class="review-flagged-section"><span>🚩 Flagged questions</span><div>${flaggedList.map(n => `<button class="review-jump-btn" data-idx="${n}">Q${n + 1}</button>`).join('')}</div></div>` : ''}
            ${unmarked > 0 ? `<p class="review-warning">${unmarked} question${unmarked > 1 ? "s haven't" : " hasn't"} been marked. Questions you don't mark count as 0.</p>` : '<p class="review-all-done">Every question is marked. Nice work.</p>'}
            <div class="review-actions">
                <button class="review-back-btn" id="review-back-btn">Back to the quiz</button>
                <button class="review-submit-btn" id="review-submit-btn">Finish and see results</button>
            </div>
        </div>`;

    document.querySelectorAll('.review-jump-btn').forEach(btn => btn.addEventListener('click', () => {
        quizState.currentIndex = parseInt(btn.dataset.idx, 10);
        renderEssayExam();
    }));
    document.getElementById('review-back-btn').addEventListener('click', () => renderEssayExam());
    document.getElementById('review-submit-btn').addEventListener('click', () => submitEssayQuiz(false));
}

// ----- RESULTS -----
function submitEssayQuiz(timeUp = false) {
    clearInterval(quizState.timerInterval);
    quizState.submitted = true;
    const questions = quizState.questions;
    const e = quizState.essay;
    const total = questions.length;
    const fractions = questions.map((_, i) => essayFraction(i));
    const markedCount = e.revealed.size;
    const score = total ? Math.round((fractions.reduce((a, b) => a + b, 0) / total) * 100) : 0;
    const timeTaken = Math.round((Date.now() - quizState.startTime) / 1000);

    // Marks, when every question in the quiz says how many it carries
    const allMarks = questions.map(essayMarks);
    const haveMarks = allMarks.every(m => m !== null);
    const marksAvailable = haveMarks ? allMarks.reduce((a, b) => a + b, 0) : 0;
    const marksGot = haveMarks ? Math.round(allMarks.reduce((s, m, i) => s + m * fractions[i], 0) * 10) / 10 : 0;

    // Weak areas: each marked question counts as one attempt, scored by the share ticked.
    // Unmarked questions are left out, so skipping doesn't make a topic look weak.
    if (!quizState.weakAreas[currentSubject]) quizState.weakAreas[currentSubject] = {};
    questions.forEach((q, i) => {
        if (!e.revealed.has(i)) return;
        const w = quizState.weakAreas[currentSubject];
        if (!w[q.category]) w[q.category] = { attempts: 0, correct: 0 };
        w[q.category].attempts++;
        w[q.category].correct = Math.round((w[q.category].correct + fractions[i]) * 100) / 100;
    });
    quizState.history.push({
        date: new Date().toLocaleDateString(), subject: currentSubject, mode: quizState.mode, kind: 'essay',
        total, answered: markedCount, correct: Math.round(fractions.reduce((a, b) => a + b, 0) * 10) / 10, score, timeTaken
    });
    saveQuizPersistentData();
    trackStudySession(currentSubject, questions, quizState.answers);   // dashboard: progress, streak, "continue"

    const topicBreakdown = {};
    questions.forEach((q, i) => {
        const t = topicBreakdown[q.category] || (topicBreakdown[q.category] = { sum: 0, total: 0 });
        t.total++;
        t.sum += fractions[i];
    });

    const gradeInfo = getGrade(score);
    const circumference = 327;
    const dashOffset = circumference - (circumference * score / 100);
    const subjectLabel = (typeof SUBJECT_NAMES === 'object' && SUBJECT_NAMES[currentSubject]) || currentSubject;
    const tone = score >= 70 ? 'great' : score >= 50 ? 'ok' : 'low';
    const lowOnes = questions.filter((_, i) => fractions[i] < 0.5);

    questionsContainer.innerHTML = `
        <div class="quiz-debrief">
            ${timeUp ? '<div class="time-up-banner">⏰ Time is up. Your quiz was finished automatically.</div>' : ''}
            <div class="debrief-hero debrief-hero--${tone}">
                <div class="debrief-score-ring">
                    <svg viewBox="0 0 120 120" class="score-ring-svg"><circle cx="60" cy="60" r="52" class="ring-track"/><circle cx="60" cy="60" r="52" class="ring-fill" style="stroke-dashoffset:${dashOffset}"/></svg>
                    <div class="score-ring-label"><span class="score-pct">${score}%</span><span class="score-grade">Grade ${gradeInfo.grade}</span></div>
                </div>
                <div class="debrief-summary-text">
                    <span class="debrief-kicker">${escapeHtml(subjectLabel)} · ${total} written question${total === 1 ? '' : 's'} · marked by you</span>
                    <h2>${gradeInfo.message}</h2>
                    <div class="debrief-stats-row">
                        ${haveMarks ? `<div class="ds-item correct-item"><span class="ds-num">${marksGot}/${marksAvailable}</span><span class="ds-label">Marks</span></div>` : ''}
                        <div class="ds-item correct-item"><span class="ds-num">${markedCount}</span><span class="ds-label">Marked</span></div>
                        <div class="ds-item skipped-item"><span class="ds-num">${total - markedCount}</span><span class="ds-label">Not marked</span></div>
                        <div class="ds-item time-item"><span class="ds-num">${formatTime(timeTaken)}</span><span class="ds-label">Time</span></div>
                    </div>
                </div>
            </div>
            <div class="debrief-actions">
                <button class="da-btn primary" id="review-answers-btn">Review answers</button>
                <button class="da-btn secondary" id="retry-wrong-btn" ${lowOnes.length === 0 ? 'disabled' : ''}>Try the hard ones again (${lowOnes.length})</button>
                <button class="da-btn secondary" id="new-quiz-btn">New quiz</button>
            </div>
            <div class="debrief-section">
                <h3>How you did by topic</h3>
                <div class="topic-breakdown">
                    ${Object.entries(topicBreakdown).sort((a, b) => (a[1].sum / a[1].total) - (b[1].sum / b[1].total)).map(([cat, d]) => {
                        const pct = Math.round((d.sum / d.total) * 100);
                        const level = pct >= 70 ? 'good' : pct >= 50 ? 'mid' : 'low';
                        return `<div class="topic-row topic-row--${level}"><span class="topic-name">${escapeHtml(cat)}</span><div class="topic-bar-wrap"><div class="topic-bar" style="width:${pct}%"></div></div><span class="topic-pct">${pct}%</span></div>`;
                    }).join('')}
                </div>
            </div>
            <div id="answer-review-section" style="display:none">
                <div class="debrief-section">
                    <h3>Question review</h3>
                    ${questions.map((q, i) => {
                        const f = fractions[i];
                        const isMarked = e.revealed.has(i);
                        const cls = !isMarked ? 'rq-skipped' : f >= 0.7 ? 'rq-correct' : 'rq-wrong';
                        const { notes, points } = essayPointsFor(i);
                        const ticked = e.ticked[i] || new Set();
                        return `<div class="review-q-card ${cls}">
                            <div class="rq-header">
                                <span class="rq-num">Q${i + 1}</span><span class="rq-year">${q.year}${q.paper ? ' ' + escapeHtml(q.paper) : ''} · paper Q${String(q.questionNumber).padStart(2, '0')}</span><span class="rq-cat">${escapeHtml(q.category || '')}</span><span class="rq-status">${isMarked ? essayMarksText(i) : 'Not marked'}</span>
                            </div>
                            <div class="rq-question">${escapeHtml(q.question)}</div>
                            ${e.typed[i] && e.typed[i].trim() ? `<div class="eq-your-answer"><span class="rq-why">Your answer</span><div>${escapeHtml(e.typed[i]).replace(/\n/g, '<br>')}</div></div>` : ''}
                            <div class="eq-review-answer">
                                <span class="rq-why">Model answer</span>
                                ${notes.length ? `<div class="eq-notes">${notes.map(n => formatModelAnswer(n)).join('<div class="eq-gap"></div>')}</div>` : ''}
                                <ol class="eq-points eq-points--review">
                                    ${points.map((p, n) => `<li class="eq-point ${ticked.has(n) ? 'is-ticked' : 'is-missed'}"><span class="eq-point-check" aria-hidden="true"></span><span class="eq-point-text">${formatModelAnswer(p)}</span></li>`).join('')}
                                </ol>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>`;
    if (score >= 70 && typeof celebrate === 'function') celebrate();

    document.getElementById('review-answers-btn').addEventListener('click', function () {
        const section = document.getElementById('answer-review-section');
        const visible = section.style.display !== 'none';
        section.style.display = visible ? 'none' : 'block';
        this.textContent = visible ? 'Review answers' : 'Hide review';
        if (!visible) {
            section.scrollIntoView({ behavior: 'smooth' });
            if (window.MathJax && window.MathJax.typesetPromise) MathJax.typesetPromise([section]).catch(() => {});
        }
    });
    document.getElementById('retry-wrong-btn').addEventListener('click', () => {
        if (!lowOnes.length) return;
        quizState.questions = shuffleArray(lowOnes);
        quizState.currentIndex = 0; quizState.flagged = new Set();
        quizState.submitted = false; quizState.startTime = Date.now(); quizState.timeRemaining = quizState.totalTime;
        resetEssayState();
        renderEssayExam();
        if (quizState.timed && quizState.totalTime > 0) startTimer();
    });
    document.getElementById('new-quiz-btn').addEventListener('click', () => showQuizLobby());
    questionsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
