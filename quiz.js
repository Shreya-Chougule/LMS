/* ========================================
   LearnHub LMS — Quiz JS
   ======================================== */

let currentQuiz = null;
let currentQuestion = 0;
let userAnswers = [];
let quizTimer = null;
let timeLeft = 0;

async function loadQuiz(quizId) {
  try {
    const basePath = getBasePath();
    const resp = await fetch(basePath + 'data/quizzes.json');
    const quizzes = await resp.json();
    currentQuiz = quizzes.find(q => q.id === quizId) || quizzes[0];
    currentQuestion = 0;
    userAnswers = new Array(currentQuiz.questions.length).fill(-1);
    timeLeft = currentQuiz.timeLimit * 60;
    renderQuiz();
    startTimer();
  } catch (e) { console.warn('Error loading quiz:', e); }
}

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container || !currentQuiz) return;
  const q = currentQuiz.questions[currentQuestion];
  container.innerHTML = `
    <div class="quiz-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg)">
      <div><h4>${currentQuiz.title}</h4><p style="color:var(--text-muted);font-size:var(--font-sm)">Question ${currentQuestion + 1} of ${currentQuiz.questions.length}</p></div>
      <div class="quiz-timer badge badge-warning" id="quizTimer">${formatTime(timeLeft)}</div>
    </div>
    <div class="progress-bar mb-lg"><div class="progress-fill" style="width:${((currentQuestion + 1) / currentQuiz.questions.length) * 100}%"></div></div>
    <div class="quiz-question" style="margin-bottom:var(--space-xl)">
      <h5 style="margin-bottom:var(--space-lg)">${q.question}</h5>
      <div class="quiz-options" style="display:flex;flex-direction:column;gap:var(--space-sm)">
        ${q.options.map((opt, i) => `
          <button class="quiz-option${userAnswers[currentQuestion] === i ? ' selected' : ''}" onclick="selectAnswer(${i})" style="padding:var(--space-md) var(--space-lg);background:${userAnswers[currentQuestion] === i ? 'rgba(108,92,231,0.15)' : 'var(--bg-glass)'};border:1px solid ${userAnswers[currentQuestion] === i ? 'var(--primary)' : 'var(--border-color)'};border-radius:var(--radius-md);color:var(--text-primary);text-align:left;font-size:var(--font-sm);transition:all var(--transition-normal);cursor:pointer">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:${userAnswers[currentQuestion] === i ? 'var(--primary)' : 'var(--bg-glass)'};border:1px solid ${userAnswers[currentQuestion] === i ? 'var(--primary)' : 'var(--border-color)'};margin-right:var(--space-md);font-weight:600;font-size:var(--font-xs)">${String.fromCharCode(65 + i)}</span>
            ${opt}
          </button>`).join('')}
      </div>
    </div>
    <div style="display:flex;justify-content:space-between">
      <button class="btn btn-secondary" ${currentQuestion === 0 ? 'disabled style="opacity:0.5"' : ''} onclick="prevQuestion()">← Previous</button>
      ${currentQuestion < currentQuiz.questions.length - 1
        ? '<button class="btn btn-primary" onclick="nextQuestion()">Next →</button>'
        : '<button class="btn btn-accent" onclick="submitQuiz()">Submit Quiz</button>'}
    </div>`;
}

function selectAnswer(index) {
  userAnswers[currentQuestion] = index;
  renderQuiz();
}

function nextQuestion() {
  if (currentQuestion < currentQuiz.questions.length - 1) { currentQuestion++; renderQuiz(); }
}

function prevQuestion() {
  if (currentQuestion > 0) { currentQuestion--; renderQuiz(); }
}

function submitQuiz() {
  clearInterval(quizTimer);
  let correct = 0;
  currentQuiz.questions.forEach((q, i) => { if (userAnswers[i] === q.correct) correct++; });
  const score = Math.round((correct / currentQuiz.questions.length) * 100);
  const passed = score >= currentQuiz.passingScore;

  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = `
    <div style="text-align:center;padding:var(--space-2xl)">
      <div style="font-size:4rem;margin-bottom:var(--space-lg)" class="animate-bounce-in">${passed ? '🎉' : '😔'}</div>
      <h3 style="margin-bottom:var(--space-sm)" class="animate-fade-in-up">${passed ? 'Congratulations!' : 'Keep Trying!'}</h3>
      <p style="color:var(--text-secondary);margin-bottom:var(--space-xl)" class="animate-fade-in-up animate-delay-1">You scored ${score}% (${correct}/${currentQuiz.questions.length} correct)</p>
      <div style="display:inline-block;width:120px;height:120px;border-radius:50%;border:4px solid ${passed ? 'var(--success)' : 'var(--danger)'};display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-xl)" class="animate-scale-in animate-delay-2">
        <span style="font-size:var(--font-3xl);font-weight:800;color:${passed ? 'var(--success)' : 'var(--danger)'}">${score}%</span>
      </div>
      <p class="badge ${passed ? 'badge-success' : 'badge-danger'} animate-fade-in-up animate-delay-3">${passed ? 'PASSED' : 'FAILED'} — Passing score: ${currentQuiz.passingScore}%</p>
      <div style="margin-top:var(--space-xl)" class="animate-fade-in-up animate-delay-4">
        <button class="btn btn-primary" onclick="currentQuestion=0;userAnswers=new Array(currentQuiz.questions.length).fill(-1);timeLeft=currentQuiz.timeLimit*60;renderQuiz();startTimer()">Retake Quiz</button>
      </div>
    </div>`;
  showToast(passed ? 'Quiz passed! Great job!' : 'Quiz not passed. Try again!', passed ? 'success' : 'error');
}

function startTimer() {
  clearInterval(quizTimer);
  quizTimer = setInterval(() => {
    timeLeft--;
    const el = document.getElementById('quizTimer');
    if (el) el.textContent = formatTime(timeLeft);
    if (timeLeft <= 0) { clearInterval(quizTimer); submitQuiz(); }
  }, 1000);
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}
