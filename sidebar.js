/* ========================================
   LearnHub LMS — Sidebar JS
   ======================================== */

function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const content = document.querySelector('.dashboard-content');
  const toggleBtn = document.querySelector('.sidebar-toggle-btn');
  const overlay = document.querySelector('.sidebar-overlay');

  if (!sidebar || !toggleBtn) return;

  // Toggle sidebar
  toggleBtn.addEventListener('click', () => {
    if (window.innerWidth <= 1024) {
      sidebar.classList.toggle('mobile-open');
      if (overlay) overlay.classList.toggle('active');
    } else {
      sidebar.classList.toggle('collapsed');
      if (content) content.classList.toggle('sidebar-collapsed');
    }
  });

  // Close sidebar on overlay click (mobile)
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
    });
  }

  // Mobile hamburger for dashboard pages
  const mobileToggle = document.querySelector('.mobile-sidebar-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      if (overlay) overlay.classList.toggle('active');
    });
  }

  // Active sidebar link
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.endsWith(currentPage)) {
      link.classList.add('active');
    }
  });

  // Sidebar avatar — show profile photo if available
  try {
    const user = JSON.parse(localStorage.getItem('lms_user') || '{}');
    if (user.avatar_url) {
      const img = document.getElementById('sidebarAvatarImg');
      const initial = document.getElementById('sidebarAvatarInitial');
      if (img && initial) {
        img.src = user.avatar_url;
        img.style.display = 'block';
        initial.style.display = 'none';
      }
    }
  } catch(e) {}
}

// Auto-init: watch for sidebar component being loaded into the DOM
document.addEventListener('DOMContentLoaded', () => {
  // Try immediately in case sidebar is already in DOM
  if (document.querySelector('.sidebar')) {
    initSidebar();
    return;
  }
  // Otherwise watch for it to appear (loaded async via loadComponent)
  const placeholder = document.getElementById('sidebar-placeholder');
  if (placeholder) {
    const observer = new MutationObserver(() => {
      if (document.querySelector('.sidebar')) {
        observer.disconnect();
        initSidebar();
      }
    });
    observer.observe(placeholder, { childList: true, subtree: true });
  }
});

