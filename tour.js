// tour.js  —  a quick guided tour of the dashboard for new students.
//
// Runs once, right after a new student finishes the welcome questions
// (welcome.js calls startAppTour()). Anyone can replay it from
// Help & Support -> Getting around -> "Take the quick tour".
//
// Each step highlights one thing on screen with a short note. A step's target
// is the first VISIBLE element from its list, so the same tour works on phones
// (bottom tab bar) and on computers (side menu). Steps with nothing visible are
// skipped.

const TOUR_DONE_KEY = "qb_tour_done";

const TOUR_STEPS = [
  {
    title: "Welcome! Here's a 30-second tour",
    text: "We'll show you where everything is. You can skip at any time.",
    targets: []                                    // no target: a centred card
  },
  {
    title: "Pick up where you stopped",
    text: "This card takes you straight back to the last topic you studied.",
    targets: ["#dash-continue-card"]
  },
  {
    title: "Ways to study",
    text: "Quick practice for a few random questions, timed quizzes, full past papers, or study topic by topic.",
    targets: [".db-o-start"]
  },
  {
    title: "Your subjects",
    text: "Every subject, split into its courses and topics. Each topic has a short summary and questions with answers explained.",
    targets: [".app-tabbar .tabbar-link[data-screen='subjects-screen']", ".sidebar-nav .sidebar-link[data-screen='subjects-screen']"]
  },
  {
    title: "Past papers",
    text: "Read a whole paper year by year, reveal the answers, or take it as a timed exam.",
    targets: [".app-tabbar .tabbar-link[data-screen='past-papers-screen']", ".sidebar-nav .sidebar-link[data-screen='past-papers-screen']"]
  },
  {
    title: "News and reporting mistakes",
    text: "The bell shows what's new. Spot a wrong answer? Report it here and we'll fix it.",
    targets: ["#bell-btn"]
  },
  {
    title: "Help is always here",
    text: "The menu has Settings and Help & Support, including how to add the app to your home screen so it works offline.",
    targets: [".app-tabbar .tabbar-link:last-child", ".sidebar-link[data-screen='help-screen']"]
  }
];

let _tour = null;

function tourVisible(el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
}
function tourTarget(step) {
  for (const sel of step.targets) {
    const el = [...document.querySelectorAll(sel)].find(tourVisible);
    if (el) return el;
  }
  return null;
}

// force = true replays it even if the student has seen it
function startAppTour(force) {
  if (_tour) return;
  if (!force && localStorage.getItem(TOUR_DONE_KEY)) return;
  const steps = TOUR_STEPS.filter(s => s.targets.length === 0 || tourTarget(s));
  if (steps.length < 2) return;

  const root = document.createElement("div");
  root.className = "tour";
  root.innerHTML = `
    <div class="tour-shade"></div>
    <div class="tour-spot" aria-hidden="true"></div>
    <div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <p class="tour-count"></p>
      <h3 id="tour-title" class="tour-title"></h3>
      <p class="tour-text"></p>
      <div class="tour-actions">
        <button type="button" class="tour-skip">Skip</button>
        <span class="tour-gap"></span>
        <button type="button" class="tour-back">Back</button>
        <button type="button" class="tour-next">Next</button>
      </div>
    </div>`;
  document.body.appendChild(root);
  _tour = { root, steps, i: 0 };

  root.querySelector(".tour-skip").onclick = endAppTour;
  root.querySelector(".tour-shade").onclick = endAppTour;
  root.querySelector(".tour-back").onclick = () => showTourStep(_tour.i - 1);
  root.querySelector(".tour-next").onclick = () =>
    _tour.i >= _tour.steps.length - 1 ? endAppTour() : showTourStep(_tour.i + 1);
  _tour.onKey = (e) => {
    if (e.key === "Escape") endAppTour();
    else if (e.key === "ArrowRight") root.querySelector(".tour-next").click();
    else if (e.key === "ArrowLeft" && _tour.i > 0) showTourStep(_tour.i - 1);
  };
  _tour.onResize = () => showTourStep(_tour.i, true);
  document.addEventListener("keydown", _tour.onKey);
  window.addEventListener("resize", _tour.onResize);

  requestAnimationFrame(() => { root.classList.add("is-on"); showTourStep(0); });
}

function showTourStep(i, noScroll) {
  if (!_tour) return;
  const { root, steps } = _tour;
  _tour.i = i;
  const step = steps[i];
  const card = root.querySelector(".tour-card");
  const spot = root.querySelector(".tour-spot");

  root.querySelector(".tour-count").textContent = i === 0 ? "Quick tour" : `${i} of ${steps.length - 1}`;
  root.querySelector(".tour-title").textContent = step.title;
  root.querySelector(".tour-text").textContent = step.text;
  root.querySelector(".tour-back").hidden = i === 0;
  root.querySelector(".tour-skip").hidden = i === steps.length - 1;
  root.querySelector(".tour-next").textContent =
    i === 0 ? "Start" : i === steps.length - 1 ? "Got it" : "Next";

  const target = step.targets.length ? tourTarget(step) : null;
  root.classList.toggle("is-centred", !target);
  if (!target) {
    spot.style.cssText = "";
    card.style.cssText = "";
    root.querySelector(".tour-next").focus();
    return;
  }

  // Bring the target into view (it may be lower down the page), then place
  // the highlight around it and the card above or below it.
  const fixed = getComputedStyle(target.closest(".app-tabbar, .app-sidebar, #app-sidebar") || target).position === "fixed";
  if (!noScroll && !fixed) {
    const r0 = target.getBoundingClientRect();
    if (r0.top < 80 || r0.bottom > window.innerHeight - 200) {
      window.scrollTo({ top: window.scrollY + r0.top - 120, behavior: "instant" });
    }
  }
  const r = target.getBoundingClientRect();
  const pad = 6;
  spot.style.cssText = `top:${r.top - pad}px;left:${r.left - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px;`;

  const cw = Math.min(340, window.innerWidth - 24);
  const ch = card.offsetHeight || 180;
  let left = r.left + r.width / 2 - cw / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - cw - 12));
  let top = r.bottom + 14;                                   // below the target…
  if (top + ch > window.innerHeight - 12) top = r.top - ch - 14;   // …or above it
  if (top < 12) top = 12;
  // Beside the target when it's a tall side-menu item on a wide screen
  if (r.left < 120 && r.width < 280 && window.innerWidth > 900) {
    left = r.right + 18;
    top = Math.max(12, Math.min(r.top + r.height / 2 - ch / 2, window.innerHeight - ch - 12));
  }
  card.style.cssText = `top:${top}px;left:${left}px;width:${cw}px;`;
  root.querySelector(".tour-next").focus({ preventScroll: true });
}

function endAppTour() {
  if (!_tour) return;
  localStorage.setItem(TOUR_DONE_KEY, "1");
  document.removeEventListener("keydown", _tour.onKey);
  window.removeEventListener("resize", _tour.onResize);
  const root = _tour.root;
  _tour = null;
  root.classList.remove("is-on");
  setTimeout(() => root.remove(), 250);
}

// From Help & Support: go to the dashboard and replay the tour
function replayAppTour() {
  if (typeof goToDashboard === "function") goToDashboard();
  window.scrollTo(0, 0);
  setTimeout(() => startAppTour(true), 400);
}
