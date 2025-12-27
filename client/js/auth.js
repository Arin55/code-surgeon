(() => {
  const form = document.getElementById('loginForm');
  if (!form) return;
  const API = '/api/auth';

  // Role tabs (visual aid only; backend role decides access)
  const tabPatient = document.getElementById('tabPatient');
  const tabAdmin = document.getElementById('tabAdmin');
  const setTab = (type) => {
    if (tabPatient && tabAdmin) {
      const patient = type === 'patient';
      tabPatient.setAttribute('aria-pressed', patient ? 'true' : 'false');
      tabAdmin.setAttribute('aria-pressed', patient ? 'false' : 'true');
      tabPatient.classList.toggle('active', patient);
      tabAdmin.classList.toggle('active', !patient);
    }
  };
  tabPatient?.addEventListener('click', () => setTab('patient'));
  tabAdmin?.addEventListener('click', () => setTab('admin'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
      const res = await fetch(`${API}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Login failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user?.role || 'patient');
      if (data.user?.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'patient.html';
      }
    } catch (err) {
      alert(err.message);
    }
  });

  // Forgot password modal (UI only)
  const forgotLink = document.querySelector('.auth-footer .auth-link');
  const modal = document.getElementById('forgotModal');
  const closeForgot = document.getElementById('forgotClose');
  const forgotForm = document.getElementById('forgotForm');
  const openForgot = (e) => { e?.preventDefault(); modal?.classList.add('open'); };
  const close = () => modal?.classList.remove('open');
  forgotLink?.addEventListener('click', openForgot);
  closeForgot?.addEventListener('click', close);
  modal?.addEventListener('click', (e) => { if (e.target === modal) close(); });
  forgotForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const em = document.getElementById('forgotEmail').value.trim();
    if (!em) return;
    alert('If an account exists for ' + em + ', password reset instructions will be sent.');
    close();
  });
})();
