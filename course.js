/* ========================================
   LearnHub LMS — Course JS
   Now fetches from the backend API instead of static JSON.
   Requires api.js to be loaded (for API_BASE constant).
   ======================================== */

// Course category icons
const courseCategoryIcons = {
  'Web Development': '💻', 'Data Science': '📊', 'Design': '🎨',
  'Cloud Computing': '☁️', 'Mobile Development': '📱', 'Cybersecurity': '🔒',
  'Marketing': '📈', 'Blockchain': '⛓️', 'DevOps': '⚙️', 'Business': '💼'
};

// Helper: get API base URL (uses API_BASE from api.js if loaded, else fallback)
function getCourseApiBase() {
  return (typeof API_BASE !== 'undefined') ? API_BASE : 'http://localhost:5000/api';
}

// Render a single course card
function renderCourseCard(course, basePath = './') {
  const icon = courseCategoryIcons[course.category] || '📚';
  const price = course.price ?? 0;
  const originalPrice = course.original_price || course.originalPrice || price;
  const instructorName = (course.users && course.users.name) ? course.users.name : (course.instructor || 'Instructor');
  const rating = course.rating || 0;
  const reviewCount = course.review_count || course.reviewCount || 0;
  const enrolledCount = course.enrolled_count || course.enrolledCount || 0;
  const isBestseller = course.bestseller || course.featured || false;

  // Discount calculation (only if original price > price)
  const hasDiscount = originalPrice > price && price > 0;

  return `
    <a href="${basePath}course-details.html?id=${course.id}" class="course-card animate-fade-in-up">
      <div class="course-card-image">
        ${course.thumbnail_url
      ? `<img src="${course.thumbnail_url}" alt="${course.title}" class="course-img" style="width:100%;height:100%;object-fit:cover">`
      : `<div class="course-img">${icon}</div>`
    }
        ${isBestseller ? '<span class="course-badge badge badge-bestseller">Bestseller</span>' : ''}
        <div class="course-price">₹${price}${hasDiscount ? `<span class="original-price">₹${originalPrice}</span>` : ''}</div>
      </div>
      <div class="course-card-body">
        <div class="course-category">${course.category}</div>
        <h3>${course.title}</h3>
        <p class="course-instructor">by ${instructorName}</p>
        <div class="course-card-meta">
          ${rating > 0 ? `<div class="meta-item">${renderStars(rating)} (${formatNumber(reviewCount)})</div>` : ''}
          ${enrolledCount > 0 ? `<div class="meta-item">👥 ${formatNumber(enrolledCount)}</div>` : ''}
          ${course.level ? `<div class="meta-item">📊 ${course.level}</div>` : ''}
          ${course.duration ? `<div class="meta-item">🕐 ${course.duration}</div>` : ''}
        </div>
      </div>
    </a>`;
}

// Render course catalog — fetches from backend API
async function renderCourseCatalog(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Show loading state
  container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:var(--space-2xl);color:var(--text-muted)">Loading courses...</div>';

  try {
    const basePath = getBasePath();
    const apiBase = getCourseApiBase();

    // Build query string from options
    const params = new URLSearchParams();
    if (options.category && options.category !== 'All') params.set('category', options.category);
    if (options.level) params.set('level', options.level);
    if (options.search) params.set('search', options.search);
    if (options.featured) params.set('featured', 'true');
    if (options.limit) params.set('limit', options.limit);

    const queryString = params.toString();
    const url = `${apiBase}/courses${queryString ? '?' + queryString : ''}`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Failed to fetch courses');
    const courses = await resp.json();

    if (!courses.length) {
      container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:var(--space-2xl);color:var(--text-muted)">No courses found. Check back soon!</div>';
      updateResultsCount(0);
      return;
    }

    container.innerHTML = courses.map(c => renderCourseCard(c, basePath)).join('');
    updateResultsCount(courses.length);
  } catch (e) {
    console.warn('Error loading courses from API:', e);
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:var(--space-2xl);color:var(--text-muted)">Unable to load courses. Please make sure the server is running.</div>';
  }
}

// Update results count display
function updateResultsCount(count) {
  const el = document.getElementById('resultsCount');
  if (el) {
    el.textContent = count > 0 ? `Showing ${count} course${count !== 1 ? 's' : ''}` : '';
  }
}

// Render categories
function renderCategories(containerId) {
  const cats = ['All', ...Object.keys(courseCategoryIcons)];
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = cats.map((cat, i) =>
    `<button class="category-btn${i === 0 ? ' active' : ''}" data-category="${cat}">${cat === 'All' ? '🔥 All' : (courseCategoryIcons[cat] || '') + ' ' + cat}</button>`
  ).join('');

  container.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const level = document.getElementById('levelFilter');
      renderCourseCatalog('courseGrid', {
        category: btn.dataset.category,
        level: level ? level.value || undefined : undefined
      });
    });
  });
}

// Render course details page — fetches single course from backend API
async function renderCourseDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;

  try {
    const basePath = getBasePath();
    const apiBase = getCourseApiBase();

    const resp = await fetch(`${apiBase}/courses/${id}`);
    if (!resp.ok) throw new Error('Course not found');
    const course = await resp.json();
    if (!course) return;

    const icon = courseCategoryIcons[course.category] || '📚';
    const price = course.price ?? 0;
    const originalPrice = course.original_price || course.originalPrice || price;
    const discount = originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0;
    const instructorName = (course.users && course.users.name) ? course.users.name : (course.instructor || 'Instructor');

    // Hero section
    const heroInfo = document.getElementById('courseHeroInfo');
    if (heroInfo) {
      heroInfo.innerHTML = `
        <span class="badge badge-primary">${course.category}</span>
        <h1>${course.title}</h1>
        <p>${course.description || ''}</p>
        <div class="course-hero-meta">
          ${course.rating ? `<div class="meta-item">${renderStars(course.rating)} <strong>${course.review_count || 0} reviews</strong></div>` : ''}
          ${course.enrolled_count ? `<div class="meta-item">👥 <strong>${formatNumber(course.enrolled_count)}</strong> students</div>` : ''}
          ${course.duration ? `<div class="meta-item">🕐 <strong>${course.duration}</strong></div>` : ''}
          ${course.level ? `<div class="meta-item">📊 <strong>${course.level}</strong></div>` : ''}
        </div>
        <p style="color:var(--text-secondary);font-size:var(--font-sm)">Created by <a href="#" style="color:var(--primary-light)">${instructorName}</a></p>`;
    }

    // Enrollment card
    const enrollCard = document.getElementById('enrollmentCard');
    if (enrollCard) {
      const escapedTitle = course.title.replace(/'/g, "\\'");
      enrollCard.innerHTML = `
        <div class="price-section">
          <span class="price">₹${price}</span>
          ${discount > 0 ? `<span class="original-price">₹${originalPrice}</span><span class="discount">${discount}% off</span>` : ''}
        </div>
        <button class="btn btn-primary btn-lg w-full ripple-effect" id="enrollBtn" onclick="handleEnroll('${course.id}', '${escapedTitle}')">Enroll Now</button>
        <button class="btn btn-secondary btn-lg w-full mt-md">Add to Wishlist ♡</button>
        <div class="enrollment-features">
          ${course.duration ? `<div class="feature"><span class="feat-icon">✓</span> ${course.duration} of content</div>` : ''}
          <div class="feature"><span class="feat-icon">✓</span> Certificate of completion</div>
          <div class="feature"><span class="feat-icon">✓</span> Lifetime access</div>
          <div class="feature"><span class="feat-icon">✓</span> 30-day money-back guarantee</div>
        </div>`;
    }

    // What you'll learn
    const learnList = document.getElementById('whatYouLearn');
    if (learnList && course.whatYouLearn) {
      learnList.innerHTML = course.whatYouLearn.map(item => `<div class="feature"><span class="feat-icon" style="color:var(--accent)">✓</span> ${item}</div>`).join('');
    }

    // Modules (from API join)
    const modulesContainer = document.getElementById('courseModules');
    if (modulesContainer && course.modules && course.modules.length) {
      modulesContainer.innerHTML = course.modules.map((mod, i) => `
        <div class="module-accordion${i === 0 ? ' open' : ''}">
          <div class="module-header" onclick="this.parentElement.classList.toggle('open')">
            <h4><span class="toggle-icon">▼</span> ${mod.title}</h4>
            <span class="module-meta">${mod.lessons ? mod.lessons.length : 0} lessons</span>
          </div>
          <div class="module-lessons">
            ${(mod.lessons || []).map(l => `
              <div class="lesson-item">
                <span class="lesson-icon${l.completed ? ' completed' : ''}">${l.type === 'video' ? '▶' : l.type === 'quiz' ? '❓' : '📋'}</span>
                <span class="lesson-title">${l.title}</span>
                <span class="lesson-duration">${l.duration || ''}</span>
              </div>`).join('')}
          </div>
        </div>`).join('');
    }

    // Quizzes for this course (student view)
    try {
      const quizzes = await (typeof apiRequest === 'function'
        ? apiRequest(`/quizzes/course/${id}`)
        : (async () => { const r = await fetch(`${apiBase}/quizzes/course/${id}`, { headers: { 'Content-Type': 'application/json' } }); return r.ok ? r.json() : []; })());

      const quizzesSection = document.createElement('div');
      quizzesSection.className = 'course-content-section';
      quizzesSection.setAttribute('data-animate', 'fade-in-up');
      quizzesSection.innerHTML = `
        <h3>Quizzes</h3>
        <div id="courseQuizzes" class="quiz-grid">${(quizzes && quizzes.length) ? '' : '<div style="color:var(--text-muted)">No quizzes yet for this course.</div>'}</div>
      `;

      // Insert after modulesContainer
      modulesContainer.parentNode.insertBefore(quizzesSection, modulesContainer.nextSibling);

      const quizGrid = quizzesSection.querySelector('#courseQuizzes');
      if (quizGrid && quizzes && quizzes.length) {
        quizGrid.innerHTML = quizzes.map(q => {
          const attemptsInfo = q.last_attempt ? `<div class="quiz-meta">Last score: ${q.last_attempt.score}% — ${q.last_attempt.passed ? 'Passed' : 'Failed'}</div>` : '';
          return `
            <div class="quiz-card" style="background:var(--bg-glass);border:1px solid var(--bg-glass-border);border-radius:12px;padding:14px;margin-bottom:12px">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
                <div>
                  <h4 style="margin:0">${q.title}</h4>
                  <div style="color:var(--text-secondary);font-size:0.9rem">${q.description || ''}</div>
                  ${attemptsInfo}
                </div>
                <div style="display:flex;flex-direction:column;gap:8px">
                  <a class="btn btn-primary" href="student/quiz.html?quiz=${q.id}&course=${id}">Start Quiz</a>
                  <a class="btn btn-secondary" href="student/quiz-results.html?quiz=${q.id}">View Results</a>
                </div>
              </div>
            </div>`;
        }).join('');
      }
    } catch (e) {
      console.warn('Error loading quizzes for course:', e);
    }

    // Instructor card (dynamic)
    const instrName = document.getElementById('instrName');
    const instrSpec = document.getElementById('instrSpec');
    const instrBio = document.getElementById('instrBio');
    const instrStats = document.getElementById('instrStats');

    if (instrName) instrName.textContent = instructorName;
    if (instrSpec) instrSpec.textContent = course.category ? `${course.category} Instructor` : 'Instructor';
    if (instrBio) instrBio.textContent = course.instructor_bio || `Expert instructor on LearnHub teaching ${course.category || 'various subjects'}.`;
    if (instrStats) {
      instrStats.innerHTML = `
        <div class="stat"><strong>${course.enrolled_count ? formatNumber(course.enrolled_count) : '—'}</strong> Students</div>
        <div class="stat"><strong>${course.rating || '—'}</strong> Rating</div>`;
    }
  } catch (e) {
    console.warn('Error loading course details:', e);
  }
}

// Handle real enrollment via API
async function handleEnroll(courseId, courseTitle) {
  const btn = document.getElementById('enrollBtn');
  if (!btn) return;

  // Check if user is logged in
  const token = localStorage.getItem('lms_token');
  if (!token) {
    showToast('Please log in to enroll', 'error');
    window.location.href = 'login.html';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Enrolling...';

  try {
    // Use apiRequest helper (from api.js) which handles auth headers
    await apiRequest('/enrollments', 'POST', { course_id: courseId });

    showToast(`Successfully enrolled in ${courseTitle}!`, 'success');
    btn.textContent = '✓ Enrolled';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
    btn.disabled = true;
  } catch (err) {
    if (err.message && err.message.includes('Already enrolled')) {
      showToast('You are already enrolled in this course', 'info');
      btn.textContent = '✓ Enrolled';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-secondary');
      btn.disabled = true;
    } else {
      showToast(err.message || 'Failed to enroll', 'error');
      btn.disabled = false;
      btn.textContent = 'Enroll Now';
    }
  }
}

