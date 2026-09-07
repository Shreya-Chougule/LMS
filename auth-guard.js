/* ========================================
   LearnHub LMS — Auth Guard
   Checks login status and role access.
   Usage: <script src="auth-guard.js" data-role="student"></script>
   data-role can be: "student" | "instructor" | "admin"
======================================== */
(async function () {
  const isAccountInactive = (value) => value === false || value === 'false' || value === 0 || value === '0' || value === null;

  const token = localStorage.getItem('lms_token');
  const userRaw = localStorage.getItem('lms_user');

  // Not logged in — redirect to login
  if (!token || !userRaw) {
    window.location.replace('/login.html');
    return;
  }

  let user;
  try { user = JSON.parse(userRaw); } catch (e) {
    window.location.replace('/login.html');
    return;
  }

  const userRole = user.role || 'student';

  if (isAccountInactive(user.is_active)) {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
    // Redirect suspended users to the centralized 404-style suspended page.
    const isNested = window.location.pathname.includes('/student/') || window.location.pathname.includes('/admin/') || window.location.pathname.includes('/instructor/');
    const basePath = isNested ? '../404.html' : '/404.html';
    const suspendUrl = new URL(basePath, window.location.href);
    suspendUrl.searchParams.set('reason', 'suspended');
    suspendUrl.searchParams.set('message', 'Your account has been deactivated. Please contact the administrator.');
    window.location.replace(suspendUrl.href);
    return;
  }

  // Verify the account is still active before showing protected content
  try {
    const profileResponse = await fetch('/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (profileResponse.status === 403) {
      const profileError = await profileResponse.json().catch(() => ({}));
      if ((profileError.error || '').toLowerCase().includes('deactivated')) {
        localStorage.removeItem('lms_token');
        localStorage.removeItem('lms_user');
        const isNested2 = window.location.pathname.includes('/student/') || window.location.pathname.includes('/admin/') || window.location.pathname.includes('/instructor/');
        const basePath2 = isNested2 ? '../404.html' : '/404.html';
        const suspendUrl = new URL(basePath2, window.location.href);
        suspendUrl.searchParams.set('reason', 'suspended');
        suspendUrl.searchParams.set('message', profileError.error || 'Your account has been deactivated.');
        window.location.replace(suspendUrl.href);
        return;
      }
    }
  } catch (e) {
    // If the check cannot run, fall back to the existing token/role guard.
  }

  // Get the required role from the script tag's data-role attribute
  const scriptTag = document.currentScript;
  const requiredRole = scriptTag ? scriptTag.getAttribute('data-role') : null;

  if (requiredRole && userRole !== requiredRole) {
    // Wrong role — show access denied and redirect to their own dashboard
    const dashMap = { student: '/student/dashboard.html', instructor: '/instructor/dashboard.html', admin: '/admin/dashboard.html' };
    const dest = dashMap[userRole] || '/login.html';

    document.addEventListener('DOMContentLoaded', () => {
      document.body.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0F1A;font-family:Inter,sans-serif;text-align:center;padding:24px">
          <div style="background:#111F3E;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:48px 40px;max-width:420px;width:100%">
            <div style="font-size:3rem;margin-bottom:16px">🔒</div>
            <h2 style="color:#fff;font-size:1.5rem;margin-bottom:8px">Access Denied</h2>
            <p style="color:#B0B3C5;font-size:0.875rem;margin-bottom:24px">
              You are logged in as <strong style="color:#93C5FD;text-transform:capitalize">${userRole}</strong>.<br>
              You don't have permission to view this page.
            </p>
            <a href="${dest}" style="display:inline-block;padding:10px 28px;background:linear-gradient(135deg,#2563EB,#93C5FD);color:#fff;border-radius:10px;font-weight:600;font-size:0.875rem;text-decoration:none;margin-bottom:12px">
              Go to My Dashboard
            </a>
            <br>
            <a href="/login.html" onclick="localStorage.removeItem('lms_token');localStorage.removeItem('lms_user')" 
               style="color:#6B6F85;font-size:0.8rem;text-decoration:underline">
              Sign in with a different account
            </a>
          </div>
        </div>`;
    });

    // Also block the page from loading its normal content immediately
    document.addEventListener('DOMContentLoaded', (e) => { e.stopImmediatePropagation(); }, true);
  }
})();
