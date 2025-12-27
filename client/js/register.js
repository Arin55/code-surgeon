(() => {
  const form = document.getElementById('registerForm');
  if (!form) return;
  const API = '/api/auth';

  // Role pill toggle
  const roleInput = document.getElementById('role');
  const pillPatient = document.getElementById('regPatient');
  const pillAdmin = document.getElementById('regAdmin');
  const setRole = (role) => {
    if (roleInput) roleInput.value = role;
    pillPatient?.classList.toggle('active', role === 'patient');
    pillAdmin?.classList.toggle('active', role === 'admin');
  };
  pillPatient?.addEventListener('click', () => setRole('patient'));
  pillAdmin?.addEventListener('click', () => setRole('admin'));
  // initialize
  setRole(roleInput?.value || 'patient');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const role = (document.getElementById('role')?.value || 'patient');
    try {
      const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || (data.errors && data.errors[0]?.msg) || 'Registration failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', role);
      window.location.href = role === 'admin' ? 'admin.html' : 'patient.html';
    } catch (err) {
      alert(err.message);
    }
  });
})();
