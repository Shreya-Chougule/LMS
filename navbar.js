/* ========================================
   LearnHub LMS — Navbar JS
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Scroll behavior
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // Mobile menu toggle
  const toggle = document.querySelector('.navbar-toggle');
  const navLinks = document.querySelector('.navbar-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      navLinks.classList.toggle('mobile-open');
    });
  }

  // Active link highlighting
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href.endsWith(currentPage) || (currentPage === 'index.html' && href === './'))) {
      link.classList.add('active');
    }
  });

  // Search functionality
  const searchInput = document.getElementById('navSearchInput');
  const searchDropdown = document.getElementById('searchDropdown');
  const searchCard = document.getElementById('searchCard');

  if (searchInput && searchDropdown && searchCard) {
    searchInput.addEventListener('input', async () => {
      const query = searchInput.value.trim();

      // Toggle typing class for line animation
      if (query.length > 0) {
        searchCard.classList.add('typing');
      } else {
        searchCard.classList.remove('typing');
        searchDropdown.classList.remove('active');
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/courses?search=${encodeURIComponent(query)}&limit=5`);
        const courses = await res.json();
        const base = window.location.pathname.includes('/student/') ||
                     window.location.pathname.includes('/instructor/') ||
                     window.location.pathname.includes('/admin/') ? '../' : './';

        if (!Array.isArray(courses) || courses.length === 0) {
          searchDropdown.innerHTML = '<div class="search-empty">No courses found</div>';
        } else {
          searchDropdown.innerHTML = courses.map(c => `
            <a href="${base}course-details.html?id=${c.id}" class="search-dropdown-item">
              <strong style="color:var(--text-primary);font-size:var(--font-sm)">${c.title}</strong>
              <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${c.category || ''}</div>
            </a>`).join('');
        }
        searchDropdown.classList.add('active');
      } catch (e) {
        searchDropdown.innerHTML = '<div class="search-empty">No courses found</div>';
        searchDropdown.classList.add('active');
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.closest('.navbar-search').contains(e.target)) {
        searchDropdown.classList.remove('active');
        searchCard.classList.remove('typing');
      }
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchDropdown.classList.remove('active');
        searchCard.classList.remove('typing');
        searchInput.value = '';
        searchInput.blur();
      }
    });
  }
});
