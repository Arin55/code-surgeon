(() => {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle?.addEventListener('click', () => navLinks.classList.toggle('open'));

  document.getElementById('year')?.appendChild(document.createTextNode(new Date().getFullYear()));

  const API = '/api';
  async function fetchHospitals(query = '') {
    const url = query ? `${API}/hospitals?search=${encodeURIComponent(query)}` : `${API}/hospitals`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load');
    return res.json();
  }

  function hospitalCard(h) {
    const desc = (h.description || '').slice(0, 120);
    const city = h.address?.city || '';
    const state = h.address?.state || '';
    return `
      <div class="card hospital-card">
        <div class="card-media" style="background-image:url('${h.image || 'assets/hospital.jpg'}')"></div>
        <div class="card-body">
          <h3>${h.name}</h3>
          <p class="muted">${city}${city && state ? ', ' : ''}${state}</p>
          <p>${desc}${h.description && h.description.length > 120 ? '…' : ''}</p>
          <div class="tags">${(h.services || []).slice(0,3).map(s=>`<span class=tag>${s}</span>`).join('')}</div>
          <a class="btn btn-outline btn-sm" href="hospital.html?id=${h._id}">View Hospital</a>
        </div>
      </div>
    `;
  }

  async function renderHospitals(q = '') {
    const grid = document.getElementById('hospitalGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="loading">Loading hospitals…</div>';
    try {
      const data = await fetchHospitals(q);
      grid.innerHTML = data.length ? data.map(hospitalCard).join('') : '<div class="empty">No hospitals found.</div>';
    } catch (e) {
      grid.innerHTML = '<div class="error">Failed to load hospitals.</div>';
    }
  }

  const searchBtn = document.getElementById('searchBtn');
  searchBtn?.addEventListener('click', () => {
    const val = document.getElementById('searchInput').value.trim();
    renderHospitals(val);
    document.getElementById('hospitals')?.scrollIntoView({ behavior: 'smooth' });
  });
  document.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => {
    document.getElementById('searchInput').value = chip.getAttribute('data-q');
    searchBtn?.click();
  }));

  // Emergency modal
  const modal = document.getElementById('emergencyModal');
  const fab = document.getElementById('emergencyBtn');
  const closeBtn = document.getElementById('modalClose');
  const openModal = () => modal?.classList.add('open');
  const closeModal = () => modal?.classList.remove('open');
  fab?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.getElementById('emergencyForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('emgName').value.trim(),
      phone: document.getElementById('emgPhone').value.trim(),
      message: document.getElementById('emgMsg').value.trim(),
    };
    try {
      const res = await fetch(`${API}/emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') || '' },
        body: JSON.stringify(payload)
      });
      alert(res.ok ? 'Emergency alert sent.' : 'Failed to send alert.');
      if (res.ok) { (e.target).reset(); closeModal(); }
    } catch {
      alert('Network error.');
    }
  });

  renderHospitals();
})();
