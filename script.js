// Sidebar state
let isSidebarCollapsed = false;
let isMobileMenuOpen = false;

// Global variables
let questionsData = [];
let currentSubject = "chemistry";
let currentTopic = null;
// Theme toggle functionality
// Theme toggle functionality
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('theme-toggle-btn');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (sunIcon && moonIcon) {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        if (sunIcon && moonIcon) {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }
}

// Update both navbar and header theme toggle icons
function updateThemeIcons() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const navbarThemeToggle = document.getElementById('navbar-theme-toggle');
    const headerThemeToggle = document.getElementById('header-theme-toggle');
    
    if (currentTheme === 'dark') {
        const moonIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>`;
        if (navbarThemeToggle) navbarThemeToggle.innerHTML = moonIcon;
        if (headerThemeToggle) headerThemeToggle.innerHTML = moonIcon;
    } else {
        const sunIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>`;
        if (navbarThemeToggle) navbarThemeToggle.innerHTML = sunIcon;
        if (headerThemeToggle) headerThemeToggle.innerHTML = sunIcon;
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
    
    updateThemeIcons();
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    
    updateThemeIcons();
}

function setupThemeListeners() {
    const navbarThemeToggle = document.getElementById('navbar-theme-toggle');
    const headerThemeToggle = document.getElementById('header-theme-toggle');
    
    if (navbarThemeToggle) {
        navbarThemeToggle.addEventListener('click', toggleTheme);
    }
    if (headerThemeToggle) {
        headerThemeToggle.addEventListener('click', toggleTheme);
    }
}
// Course structure for each subject
const courseStructure = {
    chemistry: {
        "CHM 001 - General Chemistry": [
            "Measurement", "Mole Concept", "Atomic Structure", "Electronic Configuration",
            "Periodic Table and Periodicity", "Chemical Bonding"
        ],
        "CHM 002 - Physical Chemistry": [
            "Kinetic Molecular Theory of Gases", "Solutions and Colligative Properties",
            "Thermochemistry", "Thermodynamics", "Electrochemistry", "Chemical Kinetics",
            "Equilibrium State", "Acid-Base Equilibria", "Ionic Equilibria", "Nuclear Chemistry"
        ],
        "CHM 003 - Inorganic Chemistry": [
            "Chemistry of Hydrogen", "s-block elements", "p-block elements", "d-block elements",
            "Coordination Chemistry", "Chemistry of the Environment", "Nanochemistry"
        ],
        "CHM 004 - Organic Chemistry": [
            "Separation and Purification", "Structure and Bonding in Organic Compounds",
            "Organic Reactions", "Isomerism", "Alkanes, Alkenes, Alkynes", "Alcohols",
            "Alkyl Halides", "Carbonyl Compounds", "Carboxylic Acids and Derivatives",
            "Amines", "Aromatic Compounds", "Macromolecules", "Petroleum Industry"
        ]
    },
    physics: {
        "PHY 001 - Mechanics & Properties of Matter": [
            "Physical Quantities and Units", "Vectors", "Kinematics", "Newton's Laws and Forces",
            "Gravitational Field", "Work, Energy and Power", "Circular and Oscillatory Motions",
            "Elasticity", "Hydrostatics", "Hydrodynamics"
        ],
        "PHY 002 - Heat, Waves & Optics": [
            "Temperature and Thermometry", "Heat and Energy", "Ideal Gases", "Thermodynamics",
            "Waves", "Electromagnetic Waves", "Sound Waves", "Geometrical Optics",
            "Lenses and Optical Instruments", "Wave Theory of Light"
        ],
        "PHY 003 - Electricity & Magnetism": [
            "Electrostatics", "Capacitors", "Current Electricity", "Magnetic Field",
            "Force on Conductor and Moving Charge", "Electromagnetic Induction", "Alternating Current Circuits"
        ],
        "PHY 004 - Modern Physics": [
            "Atomic Structure", "Elements of Modern Physics", "X-Rays", "Wave-Particle Duality",
            "Radioactivity and Nuclear Energy", "Semiconductors", "Applied Physics"
        ]
    },
    maths: {
        "MAT 001 - Pure Mathematics": [
            "Real Numbers", "Set Theory", "Mappings", "Quadratic Equations", "Polynomials",
            "Partial Fractions", "Binomial Theorem", "Logarithms", "Matrices", "Inequalities",
            "Trigonometry", "Coordinate Geometry", "Complex Numbers"
        ],
        "MAT 002 - Calculus": [
            "Functions", "Limits and Continuity", "Differentiation", "Applications of Differentiation",
            "Maclaurin and Taylor Series", "Integration", "Applications of Integration",
            "First Order Differential Equations", "Second Order Differential Equations"
        ],
        "MAT 003 - Statistics": [
            "Introduction to Statistics", "Measures of Location", "Measures of Dispersion",
            "Combinatorics", "Probability", "Random Variables", "Normal Distribution",
            "Significance Testing", "Correlation and Regression"
        ],
        "MAT 004A - Applied Mechanics": [
            "Vectors", "Kinematics", "Newtonian Mechanics", "Forces and Equilibrium", "Equilibrium of Rigid Bodies"
        ],
        "MAT 004B - Business Mathematics": [
            "Mathematics of Finance", "Marginal Concepts", "Production and Cost Functions",
            "Consumer and Producer Surplus", "Optimization", "Linear Programming"
        ]
    }
};

// DOM Elements
const categoriesList = document.getElementById("categories-list");
const questionsContainer = document.getElementById("questions-container");
const sidebarTitle = document.getElementById("sidebar-title");
const welcomeMessage = document.getElementById("welcome-message");
const backToTopBtn = document.getElementById("back-to-top");

// ===== SIDEBAR FUNCTIONS =====

// Sidebar collapse/expand for desktop
function initSidebar() {
    const sidebar = document.getElementById('categories-sidebar');
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    
    if (!sidebar || !collapseBtn) return;
    
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
        sidebar.classList.add('sidebar-collapsed');
        isSidebarCollapsed = true;
    }
    
    collapseBtn.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-collapsed');
        isSidebarCollapsed = sidebar.classList.contains('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
    });
}

// Mobile sidebar menu with swipe (supports both hamburger buttons)
function initMobileSidebar() {
    const originalHamburger = document.getElementById('hamburger-btn');
    const navbarHamburger = document.getElementById('navbar-hamburger');
    const closeBtn = document.getElementById('sidebar-close-btn');
    const sidebar = document.getElementById('categories-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if ((!originalHamburger && !navbarHamburger) || !sidebar || !overlay) return;
    
    // Create swipe area
    let swipeArea = document.querySelector('.swipe-area');
    if (!swipeArea) {
        swipeArea = document.createElement('div');
        swipeArea.className = 'swipe-area';
        document.body.appendChild(swipeArea);
    }
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    function openMobileMenu() {
        sidebar.classList.add('sidebar-open');
        overlay.classList.add('active');
        // Hide BOTH hamburger buttons when menu opens
        if (originalHamburger) originalHamburger.style.display = 'none';
        if (navbarHamburger) navbarHamburger.style.display = 'none';
        isMobileMenuOpen = true;
        document.body.style.overflow = 'hidden';
    }
    
    function closeMobileMenu() {
        sidebar.classList.remove('sidebar-open');
        overlay.classList.remove('active');
        // Show BOTH hamburger buttons when menu closes (only if screen is mobile)
        if (window.innerWidth <= 768) {
            if (originalHamburger) originalHamburger.style.display = 'flex';
            if (navbarHamburger) navbarHamburger.style.display = 'flex';
        } else {
            // On desktop, ensure navbar hamburger stays hidden
            if (originalHamburger) originalHamburger.style.display = 'none';
            if (navbarHamburger) navbarHamburger.style.display = 'none';
        }
        isMobileMenuOpen = false;
        document.body.style.overflow = '';
    }
    
    // Reset hamburger visibility based on screen size
    function resetHamburgerVisibility() {
        if (window.innerWidth <= 768) {
            if (!isMobileMenuOpen) {
                if (originalHamburger) originalHamburger.style.display = 'flex';
                if (navbarHamburger) navbarHamburger.style.display = 'flex';
            }
        } else {
            if (originalHamburger) originalHamburger.style.display = 'none';
            if (navbarHamburger) navbarHamburger.style.display = 'none';
        }
    }
    
    // Swipe detection
    function handleTouchStart(e) {
        touchStartX = e.changedTouches[0].screenX;
    }
    
    function handleTouchEnd(e) {
        touchEndX = e.changedTouches[0].screenX;
        const swipeDistance = touchEndX - touchStartX;
        
        if (swipeDistance > 50 && !isMobileMenuOpen && window.innerWidth <= 768) {
            openMobileMenu();
        }
        else if (swipeDistance < -50 && isMobileMenuOpen && window.innerWidth <= 768) {
            closeMobileMenu();
        }
    }
    
    swipeArea.addEventListener('touchstart', handleTouchStart);
    swipeArea.addEventListener('touchend', handleTouchEnd);
    document.body.addEventListener('touchstart', handleTouchStart);
    document.body.addEventListener('touchend', handleTouchEnd);
    
    // Attach to both hamburger buttons
    if (originalHamburger) originalHamburger.addEventListener('click', openMobileMenu);
    if (navbarHamburger) navbarHamburger.addEventListener('click', openMobileMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMobileMenu);
    overlay.addEventListener('click', closeMobileMenu);
    
    document.addEventListener('click', (e) => {
        if (isMobileMenuOpen && window.innerWidth <= 768) {
            if (e.target.closest('.topic-btn') || e.target.closest('.course-header')) {
                setTimeout(closeMobileMenu, 200);
            }
        }
    });
    
    window.addEventListener('resize', () => {
        resetHamburgerVisibility();
        if (window.innerWidth > 768 && isMobileMenuOpen) {
            closeMobileMenu();
        }
    });
    
    // Initial reset
    resetHamburgerVisibility();
}

// Handle sidebar display based on screen size
function handleSidebarResponsive() {
    const sidebar = document.getElementById('categories-sidebar');
    if (!sidebar) return;
    
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('sidebar-collapsed');
    }
}

// ===== DATA LOADING FUNCTIONS =====

async function getAvailableYears(subject) {
    const possibleYears = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
    const availableYears = [];
    
    for (const year of possibleYears) {
        try {
            const response = await fetch(`data/${subject}/${year}.json`, { method: 'HEAD' });
            if (response.ok) {
                availableYears.push(year);
            }
        } catch (error) {
            // File doesn't exist, skip
        }
    }
    return availableYears;
}

async function loadQuestions() {
    const availableYears = await getAvailableYears(currentSubject);
    
    if (availableYears.length === 0) {
        console.log(`No year files found for ${currentSubject}`);
        questionsData = [];
        renderCategories();
        return;
    }
    
    questionsContainer.innerHTML = '<div class="welcome-message"><h2>📚 Loading...</h2><p>Fetching questions from database...</p></div>';
    
    let allQuestions = [];
    
    for (const year of availableYears) {
        try {
            const response = await fetch(`data/${currentSubject}/${year}.json`);
            if (response.ok) {
                const yearData = await response.json();
                if (Array.isArray(yearData)) {
                    allQuestions = [...allQuestions, ...yearData];
                    console.log(`Loaded ${currentSubject}/${year}.json: ${yearData.length} questions`);
                } else if (yearData.questions && Array.isArray(yearData.questions)) {
                    allQuestions = [...allQuestions, ...yearData.questions];
                    console.log(`Loaded ${currentSubject}/${year}.json: ${yearData.questions.length} questions`);
                }
            }
        } catch (error) {
            console.error(`Error loading data/${currentSubject}/${year}.json:`, error);
        }
    }
    
    questionsData = allQuestions;
    window.currentSubjectYears = availableYears;
    
    renderCategories();
    showWelcomeMessage();
}

function getAvailableCategoriesFromJSON() {
    const categories = new Set();
    questionsData.forEach(question => {
        if (question.category) {
            categories.add(question.category);
        }
    });
    return categories;
}

function getQuestionCountForTopic(topic) {
    return questionsData.filter(q => q.category === topic).length;
}

function renderCategories() {
    const courses = courseStructure[currentSubject];
    const availableCategories = getAvailableCategoriesFromJSON();
    
    if (!courses || Object.keys(courses).length === 0) {
        categoriesList.innerHTML = '<p class="loading">📭 No categories available for this subject yet.</p>';
        return;
    }
    
    let subjectDisplay = "Chemistry";
    if (currentSubject === "physics") subjectDisplay = "Physics";
    if (currentSubject === "maths") subjectDisplay = "Mathematics";
    
    const yearsLoaded = window.currentSubjectYears || [];
    const yearsText = yearsLoaded.length > 0 ? yearsLoaded.join(", ") : "none";
    sidebarTitle.innerHTML = `📚 ${subjectDisplay} <span style="font-size:0.7rem; font-weight:normal;">(${yearsText})</span>`;
    
    let html = '';
    let courseIndex = 0;
    
    for (const [courseName, topics] of Object.entries(courses)) {
        const courseId = `course-${currentSubject}-${courseIndex}`;
        
        html += `
            <div class="course-group">
                <div class="course-header" data-course-id="${courseId}">
                    <h4>📘 ${courseName}</h4>
                    <span class="dropdown-icon">▼</span>
                </div>
                <div class="course-topics" id="${courseId}">
        `;
        
        topics.forEach(topic => {
            const hasQuestions = availableCategories.has(topic);
            const questionCount = getQuestionCountForTopic(topic);
            const statusIcon = hasQuestions ? "✅" : "⏳";
            
            html += `<button class="topic-btn ${!hasQuestions ? 'no-questions' : ''}" data-topic="${escapeHtml(topic)}" ${!hasQuestions ? 'disabled' : ''}>
                        ${statusIcon} <span class="topic-text">📖 ${escapeHtml(topic)} ${hasQuestions ? `(${questionCount})` : '(coming soon)'}</span>
                    </button>`;
        });
        
        html += `</div></div>`;
        courseIndex++;
    }
    
    categoriesList.innerHTML = html;
    
    document.querySelectorAll(".course-header").forEach(header => {
        header.addEventListener("click", (e) => {
            e.stopPropagation();
            const courseId = header.dataset.courseId;
            const topicsDiv = document.getElementById(courseId);
            
            document.querySelectorAll(".course-topics").forEach(div => {
                if (div.id !== courseId) div.classList.remove("show");
            });
            document.querySelectorAll(".course-header").forEach(h => {
                if (h.dataset.courseId !== courseId) h.classList.remove("open");
            });
            
            topicsDiv.classList.toggle("show");
            header.classList.toggle("open");
        });
    });
    
    document.querySelectorAll(".topic-btn:not([disabled])").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".topic-btn").forEach(b => b.classList.remove("active-topic"));
            btn.classList.add("active-topic");
            currentTopic = btn.dataset.topic;
            displayQuestions(currentTopic);
        });
    });
    
    // DO NOT auto-open any course - all collapsed by default
// All course groups start closed
}

// Display questions for a given topic
function displayQuestions(topic) {
    if (welcomeMessage) welcomeMessage.style.display = "none";
    
    // Remove active from quiz tab if active
    const quizTab = document.getElementById('quiz-mode-tab');
    if (quizTab) quizTab.classList.remove('active');
    
    let filteredQuestions = questionsData.filter(q => q.category === topic);
    filteredQuestions.sort((a, b) => b.year - a.year);
    
    if (filteredQuestions.length === 0) {
        questionsContainer.innerHTML = `
            <div class="welcome-message">
                <h2>📭 No questions found</h2>
                <p>No questions available for "${escapeHtml(topic)}" yet.</p>
                <p>Check back soon for updates!</p>
            </div>
        `;
        return;
    }
    
    // Group by year
    const questionsByYear = {};
    filteredQuestions.forEach(q => {
        if (!questionsByYear[q.year]) questionsByYear[q.year] = [];
        questionsByYear[q.year].push(q);
    });
    
    const sortedYears = Object.keys(questionsByYear).sort((a, b) => b - a);
    
    let questionsHtml = `<h2 style="margin-bottom: 10px; color: #0d6efd;">📖 ${escapeHtml(topic)}</h2>`;
    questionsHtml += `<p style="margin-bottom: 20px; color: #6c757d; padding-bottom: 10px; border-bottom: 1px solid #e9ecef;">
        ${filteredQuestions.length} question(s) found | 📅 Years: ${sortedYears.join(", ")}
    </p>`;
    
    let questionIndex = 1;
    
    for (const year of sortedYears) {
        const yearQuestions = questionsByYear[year];
        
        yearQuestions.forEach((q) => {
            const qNumberDisplay = q.questionNumber.toString().padStart(2, '0');
            
            questionsHtml += `
                <div class="question-card" data-question-idx="${questionIndex}">
                    <div class="question-header">
                        <span class="question-year">📅 ${year}</span>
                        <span class="question-year" style="background: #198754;">🔢 Q${qNumberDisplay}</span>
                        <span class="question-type">${q.type === "Objective" ? "🔘 Multiple Choice" : "✍️ Essay"}</span>
                    </div>
                    <div class="question-text">${escapeHtml(q.question)}</div>
            `;
            
            if (q.diagramMissing) {
                questionsHtml += `<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 12px 0; border-radius: 6px;">
                    <span style="color: #856404;">⚠️ <strong>Diagram/Structure Missing</strong><br>${escapeHtml(q.diagramNote || 'Please refer to your original past question paper.')}</span>
                </div>`;
            }
            
            if (q.type === "Objective" && q.options && q.options.length > 0) {
                questionsHtml += `<ul class="options-list" id="options-list-${questionIndex}">`;
                const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
                q.options.forEach((opt, optIdx) => {
                    if (opt && opt.trim() !== "") {
                        const isCorrect = q.answer && q.answer.toUpperCase() === optionLabels[optIdx];
                        const correctClass = isCorrect ? 'data-correct="true"' : '';
                        questionsHtml += `<li class="option-item" data-option="${optionLabels[optIdx]}" ${correctClass}><strong>${optionLabels[optIdx]})</strong> ${escapeHtml(opt)}</li>`;
                    }
                });
                questionsHtml += `</ul>`;
                
                // Add Show Answer button
                if (q.answer && q.explanation) {
                    questionsHtml += `
                        <button class="show-answer-btn" data-q-idx="${questionIndex}" data-answer="${q.answer}" data-explanation="${escapeHtml(q.explanation)}">🔍 Show Answer</button>
                        <div class="answer-display" id="answer-${questionIndex}">
                            <div class="correct-answer">✅ Correct Answer: ${q.answer}</div>
                            <div class="explanation">💡 Explanation: ${escapeHtml(q.explanation)}</div>
                        </div>
                    `;
                } else if (q.answer && !q.explanation) {
                    questionsHtml += `
                        <button class="show-answer-btn" data-q-idx="${questionIndex}" data-answer="${q.answer}" data-explanation="">🔍 Show Answer</button>
                        <div class="answer-display" id="answer-${questionIndex}">
                            <div class="correct-answer">✅ Correct Answer: ${q.answer}</div>
                        </div>
                    `;
                }
            }
            
            if (q.type === "Essay" && !q.diagramMissing) {
                questionsHtml += `<div class="essay-note">📝 Essay question (provide written answer in your notebook)</div>`;
            }
            
            questionsHtml += `</div>`;
            questionIndex++;
        });
    }
    
    questionsContainer.innerHTML = questionsHtml;
    
    // Add event listeners to all Show Answer buttons
    document.querySelectorAll('.show-answer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const qIdx = btn.dataset.qIdx;
            const answerDisplay = document.getElementById(`answer-${qIdx}`);
            const answer = btn.dataset.answer;
            const explanation = btn.dataset.explanation;
            
            // Toggle display
            if (answerDisplay.classList.contains('show')) {
                answerDisplay.classList.remove('show');
                btn.textContent = '🔍 Show Answer';
                // Remove highlighting from options
                const optionsList = document.getElementById(`options-list-${qIdx}`);
                if (optionsList) {
                    optionsList.querySelectorAll('.option-item').forEach(opt => {
                        opt.classList.remove('option-correct-highlight');
                    });
                }
            } else {
                answerDisplay.classList.add('show');
                btn.textContent = '🙈 Hide Answer';
                // Highlight the correct option
                const optionsList = document.getElementById(`options-list-${qIdx}`);
                if (optionsList) {
                    optionsList.querySelectorAll('.option-item').forEach(opt => {
                        if (opt.dataset.option === answer.toUpperCase()) {
                            opt.classList.add('option-correct-highlight');
                        }
                    });
                }
            }
        });
    });
    
    document.getElementById("questions-area").scrollIntoView({ behavior: "smooth", block: "start" });
}

function showWelcomeMessage() {
    if (welcomeMessage) welcomeMessage.style.display = "block";
    questionsContainer.innerHTML = "";
    document.querySelectorAll(".topic-btn").forEach(b => b.classList.remove("active-topic"));
    currentTopic = null;
}

function setupEventListeners() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentSubject = btn.dataset.subject;
            currentTopic = null;
            loadQuestions();
        });
        // Quiz Mode Tab
const quizModeTab = document.getElementById('quiz-mode-tab');
if (quizModeTab) {
    quizModeTab.addEventListener('click', () => {
        // Remove active from all subject tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        quizModeTab.classList.add('active');
        
        // Show Quiz Mode coming soon message
        showQuizModeComingSoon();
    });
}
    });
    // Show Quiz Mode coming soon
function showQuizModeComingSoon() {
    if (welcomeMessage) welcomeMessage.style.display = "none";
    
    questionsContainer.innerHTML = `
        <div class="quiz-coming-soon">
            <h2>📝 Quiz Mode</h2>
            <p>Coming Soon!</p>
            <p style="margin-top: 20px;">This feature will allow you to:</p>
            <ul style="list-style: none; padding: 0;">
                <li>✓ Generate quizzes by topic</li>
                <li>✓ Take past exam simulations</li>
                <li>✓ Get scores and performance feedback</li>
            </ul>
            <p style="margin-top: 30px;">🚀 Stay tuned for updates!</p>
        </div>
    `;
}
    
    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
    
    window.addEventListener("scroll", () => {
        backToTopBtn.style.display = window.scrollY > 300 ? "block" : "none";
    });
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
// ===== STICKY NAVBAR FUNCTIONS =====
let lastScrollY = window.scrollY;
let ticking = false;

function handleNavbarOnScroll() {
    const navbar = document.getElementById('sticky-navbar');
    const mainHeader = document.querySelector('header');
    
    if (!navbar) return;
    
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > 80) {
        if (currentScrollY < lastScrollY) {
            // Scrolling UP - show navbar
            navbar.classList.add('visible');
            if (mainHeader) mainHeader.classList.add('header-hidden');
        } else {
            // Scrolling DOWN - hide navbar
            navbar.classList.remove('visible');
            if (mainHeader) mainHeader.classList.remove('header-hidden');
        }
    } else {
        // At top of page - hide navbar, show header
        navbar.classList.remove('visible');
        if (mainHeader) mainHeader.classList.remove('header-hidden');
    }
    
    lastScrollY = currentScrollY;
    ticking = false;
}

function initStickyNavbar() {
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                handleNavbarOnScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
    handleNavbarOnScroll();
}

// Sync navbar theme toggle with main theme
function syncNavbarTheme() {
    const navbarThemeToggle = document.getElementById('navbar-theme-toggle');
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    if (!navbarThemeToggle) return;
    
    if (currentTheme === 'dark') {
        navbarThemeToggle.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>`;
    } else {
        navbarThemeToggle.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>`;
    }
}

function setupNavbarThemeListener() {
    const navbarThemeToggle = document.getElementById('navbar-theme-toggle');
    if (navbarThemeToggle) {
        navbarThemeToggle.addEventListener('click', toggleTheme);
    }
}
// Initialize
document.addEventListener("DOMContentLoaded", () => {
    initTheme();                    // Initialize theme
    initSidebar();                  // Sidebar collapse
    initMobileSidebar();            // Mobile hamburger menu
    handleSidebarResponsive();      // Responsive sidebar
    setupThemeListeners();          // Theme toggles (both navbar and header)
    initStickyNavbar();             // Sticky navbar on scroll
    setupEventListeners();          // Other event listeners
    loadQuestions();                // Load questions
});

window.addEventListener('resize', () => {
    handleSidebarResponsive();
});