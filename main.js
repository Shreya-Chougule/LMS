/* ========================================
   LearnHub LMS — Main JS
   ======================================== */

// ---- Component Loader ----
async function loadComponent(elementId, filePath) {
  try {
    const resp = await fetch(filePath);
    if (!resp.ok) throw new Error(`Failed to load ${filePath}`);
    const html = await resp.text();
    document.getElementById(elementId).innerHTML = html;
    replaceEmojiIcons(document.getElementById(elementId));
  } catch (e) {
    console.warn('Component load error:', e.message);
  }
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function svgMarkup(inner, viewBox = '0 0 24 24') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="${viewBox}" fill="none" aria-hidden="true">${inner}</svg>`;
}

const ICON_SVGS = {
  '📚': svgMarkup('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  '🏠': svgMarkup('<path d="M3 11.5 12 4l9 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 10.5V20h14v-9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 20v-6h5v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  '📖': svgMarkup('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 7h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 11h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 15h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  '📝': svgMarkup('<path d="M5 4h10l4 4v12H5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M15 4v4h4" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 11h8M8 15h8M8 7h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  '❓': svgMarkup('<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M9.5 9a2.5 2.5 0 1 1 3.7 2.2c-.8.4-1.2 1-1.2 1.8v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/>'),
  '🏆': svgMarkup('<path d="M7 4h10v3a5 5 0 0 1-10 0V4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 17h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 11v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M7 6H4a3 3 0 0 0 3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M17 6h3a3 3 0 0 1-3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  '⚙️': svgMarkup('<circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.8v2.3M12 18.9v2.3M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.8 12h2.3M18.9 12h2.3M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  '🚪': svgMarkup('<path d="M5 4h7v16H5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 12h7M16 9l3 3-3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  '👥': svgMarkup('<circle cx="9" cy="9" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="17" cy="10" r="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M13.8 19a4.8 4.8 0 0 1 6.4-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  '📋': svgMarkup('<path d="M9 3h6a1 1 0 0 1 1 1v2H8V4a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.8"/><path d="M7 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 11h8M8 15h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  '➕': svgMarkup('<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  '📤': svgMarkup('<path d="M12 16V4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8.5 7.5 12 4l3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 14v4h14v-4" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'),
  '📊': svgMarkup('<path d="M5 20V10M12 20V4M19 20v-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4 20h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  '📈': svgMarkup('<path d="M4 16l5-5 4 4 7-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 8h4v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  '🔒': svgMarkup('<rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  '✉': svgMarkup('<rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="m5 7 7 5 7-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  '👁': svgMarkup('<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.8"/>'),
  '🙈': svgMarkup('<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m7 17 10-10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  '🔵': svgMarkup('<circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.18" stroke="currentColor" stroke-width="1.8"/>'),
  '⬛': svgMarkup('<rect x="5" y="5" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/>'),
  '✓': svgMarkup('<path d="M5 12.5 9.5 17 19 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  '✕': svgMarkup('<path d="M6 6 18 18M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  '⚠': svgMarkup('<path d="M12 4 3 20h18L12 4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9v4M12 16h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  'ℹ': svgMarkup('<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 10v6M12 7h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  '🔥': svgMarkup('<path d="M13 3s1.5 3-1 5c-1.5 1.2-2 2.4-2 4a4 4 0 0 0 8 0c0-3-2-5.5-5-9z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 8c-2 1.5-4 4.2-4 7a6 6 0 0 0 12 0c0-2.4-1.2-4.6-3.5-6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  '💻': svgMarkup('<rect x="4" y="5" width="16" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 20h8M12 16v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  '📱': svgMarkup('<rect x="7" y="2.5" width="10" height="19" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M10 5h4M12 18.5h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  '🎨': svgMarkup('<path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h1a7 7 0 0 0 0-14z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/><circle cx="16" cy="10" r="1" fill="currentColor"/>'),
  '☁️': svgMarkup('<path d="M17 18H8.5a4.5 4.5 0 1 1 .3-9A6.5 6.5 0 0 1 21 11.5 4.5 4.5 0 0 1 17 18z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'),
  '⛓️': svgMarkup('<path d="M8 12a4 4 0 0 1 4-4h1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M16 12a4 4 0 0 1-4 4h-1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M9 12h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  '💼': svgMarkup('<rect x="3.5" y="7" width="17" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M3.5 12h17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  '🕐': svgMarkup('<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  '▼': svgMarkup('<path d="M6 9.5 12 15l6-5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  '▶': svgMarkup('<path d="M8 5v14l11-7L8 5z" fill="currentColor"/>'),
  '◀': svgMarkup('<path d="M16 5 7 12l9 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  '⭐': svgMarkup('<path d="M12 3.5 14.9 9l6.1.9-4.4 4.3 1 6.1-5.6-3-5.6 3 1-6.1L3 9.9 9.1 9 12 3.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>'),
  '🖼️': svgMarkup('<rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="10" r="1.4" fill="currentColor"/><path d="m4 16 4.5-4.5 3.5 3.5 2-2L20 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  '🎬': svgMarkup('<rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M10 9.5 14 12l-4 2.5v-5z" fill="currentColor"/>'),
  '📎': svgMarkup('<path d="M8.5 12.5 13.8 7.2a3 3 0 0 1 4.2 4.2l-6.7 6.7a5 5 0 0 1-7.1-7.1l7.1-7.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  '⬇': svgMarkup('<path d="M12 4v10M8 10l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 19h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  '🔗': svgMarkup('<path d="M9.5 14.5 8 16a4 4 0 0 1-5.7-5.7l2-2a4 4 0 0 1 5.7 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.5 9.5 16 8a4 4 0 0 1 5.7 5.7l-2 2a4 4 0 0 1-5.7 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 14.5 14.5 9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  default: svgMarkup('<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>')
};

function createSvgIcon(symbol) {
  const icon = document.createElement('span');
  icon.className = 'svg-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = ICON_SVGS[symbol] || ICON_SVGS.default;
  return icon;
}

function replaceEmojiIcons(root = document.body) {
  const scope = root && root.body ? root.body : root;
  if (!scope || !window.NodeFilter) return;

  const symbols = Object.keys(ICON_SVGS).filter(key => key !== 'default').sort((a, b) => b.length - a.length);
  const pattern = new RegExp(symbols.map(escapeRegExp).join('|'), 'g');
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      pattern.lastIndex = 0;
      return pattern.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach(node => {
    const text = node.nodeValue;
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (!matches || !matches.length) return;

    const parts = text.split(pattern);
    const fragment = document.createDocumentFragment();

    parts.forEach((part, index) => {
      if (part) fragment.appendChild(document.createTextNode(part));
      if (matches[index]) fragment.appendChild(createSvgIcon(matches[index]));
    });

    node.parentNode.replaceChild(fragment, node);
  });
}

window.replaceEmojiIcons = replaceEmojiIcons;
window.getSvgIconMarkup = symbol => ICON_SVGS[symbol] || ICON_SVGS.default;

// ---- Cursor Glow Effect ----
function initCursorGlow() {
  if (window.innerWidth < 768) return;
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  let mx = 0, my = 0, gx = 0, gy = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  function animate() {
    gx += (mx - gx) * 0.08;
    gy += (my - gy) * 0.08;
    glow.style.left = gx + 'px';
    glow.style.top = gy + 'px';
    requestAnimationFrame(animate);
  }
  animate();
}

// ---- Background Particles ----
function initParticles() {
  const container = document.querySelector('.bg-particles');
  if (!container) return;
  const colors = ['rgba(108,92,231,0.3)', 'rgba(0,206,201,0.3)', 'rgba(253,121,168,0.2)', 'rgba(162,155,254,0.2)'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = (Math.random() * 15 + 10) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    container.appendChild(p);
  }
}

// ---- Scroll Animations ----
function initScrollAnimations() {
  const els = document.querySelectorAll('[data-animate]');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-' + (entry.target.dataset.animate || 'fade-in-up'));
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => { el.style.opacity = '0'; obs.observe(el); });
}

// ---- Ripple Effect ----
function initRippleEffect() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.ripple-effect');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

// ---- Modal ----
function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) { overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) { overlay.classList.remove('active'); document.body.style.overflow = ''; }
}
function initModals() {
  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.modalOpen));
  });
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modalClose));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
}

// ---- Tabs ----
function initTabs() {
  document.querySelectorAll('.tabs').forEach(tabContainer => {
    const btns = tabContainer.querySelectorAll('.tab-btn');
    const contentId = tabContainer.dataset.tabContent;
    const contents = document.querySelectorAll(`#${contentId} .tab-content`);
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(btn.dataset.tab);
        if (target) target.classList.add('active');
      });
    });
  });
}

// ---- Form Validation ----
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validateForm(formEl) {
  let valid = true;
  formEl.querySelectorAll('[required]').forEach(input => {
    const group = input.closest('.form-group');
    if (!group) return;
    const err = group.querySelector('.form-error');
    if (!input.value.trim()) {
      group.classList.add('error');
      if (err) err.textContent = 'This field is required';
      valid = false;
    } else if (input.type === 'email' && !validateEmail(input.value)) {
      group.classList.add('error');
      if (err) err.textContent = 'Please enter a valid email';
      valid = false;
    } else {
      group.classList.remove('error');
    }
  });
  return valid;
}

// ---- Password Strength ----
function checkPasswordStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return ['weak', 'weak', 'medium', 'strong', 'very-strong'][s];
}

// ---- Toast Notifications ----
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${ICON_SVGS[icons[type] || 'ℹ'] || ICON_SVGS.default}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); }, 4000);
}

// ---- Star Rating HTML ----
function renderStars(rating) {
  const filledStar = svgMarkup('<path d="M12 3.5 14.9 9l6.1.9-4.4 4.3 1 6.1-5.6-3-5.6 3 1-6.1L3 9.9 9.1 9 12 3.5z" fill="currentColor"/>');
  const emptyStar = svgMarkup('<path d="M12 3.5 14.9 9l6.1.9-4.4 4.3 1 6.1-5.6-3-5.6 3 1-6.1L3 9.9 9.1 9 12 3.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" fill="none"/>');
  let html = `<span class="rating-value">${rating}</span><span class="rating">`;
  for (let i = 1; i <= 5; i++) {
    html += i <= Math.floor(rating) ? `<span class="star">${filledStar}</span>` : (i - 0.5 <= rating ? `<span class="star">${filledStar}</span>` : `<span class="star empty">${emptyStar}</span>`);
  }
  return html + '</span>';
}

// ---- Utility: Format Number ----
function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

// ---- Get base path ----
function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/student/') || path.includes('/instructor/') || path.includes('/admin/')) return '../';
  return './';
}

// ---- User Profile Display ----
function initUserProfile() {
  const userData = localStorage.getItem('lms_user');
  
  const updateDOM = () => {
    const navLinks = document.getElementById('navLinks');
    const base = getBasePath();
    
    // 1. Update user textual info globally
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const name = user.name || (user.user_metadata && user.user_metadata.name) || (user.raw_user_meta_data && user.raw_user_meta_data.name) || 'User';
        const firstName = name.split(' ')[0] || '';
        const lastName = name.split(' ').slice(1).join(' ') || '';
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
        const email = user.email || '';
        
        document.querySelectorAll('.user-display-name').forEach(el => { if (el.textContent !== name) el.textContent = name; });
        document.querySelectorAll('.user-display-first-name').forEach(el => { if (el.textContent !== firstName) el.textContent = firstName; });
        document.querySelectorAll('.user-display-initial').forEach(el => { if (el.textContent !== initials) el.textContent = initials; });
        document.querySelectorAll('.user-display-email').forEach(el => { if (el.textContent !== email) el.textContent = email; });
        document.querySelectorAll('.user-input-first-name').forEach(el => { if (el.value !== firstName) el.value = firstName; });
        document.querySelectorAll('.user-input-last-name').forEach(el => { if (el.value !== lastName) el.value = lastName; });
        document.querySelectorAll('.user-input-email').forEach(el => { if (el.value !== email) el.value = email; });
      } catch (e) {
        console.warn('User profile parse error:', e);
      }
    }

    // 2. Update navbar if it exists
    if (navLinks) {
      const links = Array.from(navLinks.querySelectorAll('a'));
      const homeLink = links.find(link => link.textContent.trim().toLowerCase() === 'home') || links[0];
      const coursesLink = links.find(link => link.textContent.trim().toLowerCase() === 'courses') || links[1];
      
      // Keep only Home and Courses
      navLinks.innerHTML = '';
      if (homeLink) {
        homeLink.href = `${base}`;
        navLinks.appendChild(homeLink);
      }
      if (coursesLink) {
        coursesLink.href = `${base}course-catalog.html`;
        navLinks.appendChild(coursesLink);
      }
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const role = user.role || 'student';
          
          const roleLink = document.createElement('a');
          if (role === 'student') {
            roleLink.textContent = 'Student';
            roleLink.href = `${base}student/dashboard.html`;
          } else if (role === 'instructor') {
            roleLink.textContent = 'Instructor';
            roleLink.href = `${base}instructor/dashboard.html`;
          } else if (role === 'admin') {
            roleLink.textContent = 'Admin';
            roleLink.href = `${base}admin/dashboard.html`;
          } else if (role === 'guest') {
            roleLink.textContent = 'Sign In';
            roleLink.href = `${base}login.html`;
          }
          navLinks.appendChild(roleLink);
          
        } catch (e) {
          // Handled above
        }
      } else {
        // Not signed up/logged in: show Sign Up option
        const signupLink = document.createElement('a');
        signupLink.textContent = 'Sign Up';
        signupLink.href = `${base}register.html`;
        navLinks.appendChild(signupLink);
      }
      
      // Re-evaluate active links after DOM manipulation
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      navLinks.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && (href.endsWith(currentPage) || (currentPage === 'index.html' && href === './'))) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  };

  updateDOM();
  [100, 400, 900, 1600].forEach(delay => setTimeout(updateDOM, delay));
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  initCursorGlow();
  initParticles();
  initScrollAnimations();
  initRippleEffect();
  initModals();
  initTabs();
  replaceEmojiIcons(document.body);
  initUserProfile();
});
