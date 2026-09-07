/* ========================================
   LearnHub LMS — API Config
   ======================================== */
const API_BASE = 'http://localhost:5000/api';

async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('lms_token');
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) options.headers['Authorization'] = `Bearer ${token}`;
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(API_BASE + endpoint, options);
  const data = await response.json();

  // Handle expired/invalid token — redirect to login
  if (response.status === 401 && data.error && data.error.includes('token')) {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
    showToast('Session expired. Please log in again.', 'error');
    setTimeout(() => { window.location.href = '/login.html'; }, 1500);
    throw new Error('Session expired');
  }

  if (response.status === 403 && data.error && data.error.toLowerCase().includes('deactivated')) {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
    showToast(data.error, 'error');
    // Redirect to the centralized 404-style suspended page.
    // Use a root-aware path so redirects work for file:// and hosted setups.
    const isNested = window.location.pathname.includes('/student/') || window.location.pathname.includes('/admin/') || window.location.pathname.includes('/instructor/');
    const basePath = isNested ? '../404.html' : '/404.html';
    const target = new URL(basePath, window.location.href);
    target.searchParams.set('reason', 'suspended');
    target.searchParams.set('message', data.error);
    setTimeout(() => { window.location.href = target.href; }, 1200);
    throw new Error(data.error);
  }

  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}
