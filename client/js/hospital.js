(() => {
  const API = '/api';
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (!id) {
    document.getElementById('hospitalCard').innerHTML = '<div class="error">Invalid hospital.</div>';
    return;
  }

  async function getHospital() {
    const res = await fetch(`${API}/hospitals/${id}`);
    if (!res.ok) throw new Error('Failed');
    return res.json();
  }

  function renderHospital(h) {
    const el = document.getElementById('hospitalCard');
    const city = h.address?.city || ''; const state = h.address?.state || '';
    el.innerHTML = `
      <div class="hospital-detail">
        <div>
          <div class="card-media" style="background-image:url('${h.image || 'assets/hospital.jpg'}')"></div>
        </div>
        <div>
          <h2 style="margin:0 0 6px;">${h.name}</h2>
          <p class="muted">${city}${city && state ? ', ' : ''}${state}</p>
          <p>${h.description || ''}</p>
          <div class="tags">${(h.services || []).map(s=>`<span class=tag>${s}</span>`).join('')}</div>
        </div>
      </div>
    `;
  }

  async function init() {
    try {
      const h = await getHospital();
      renderHospital(h);
    } catch {
      document.getElementById('hospitalCard').innerHTML = '<div class="error">Failed to load hospital.</div>';
    }
    // Back button behavior
    document.getElementById('backBtn')?.addEventListener('click', (e)=>{
      e.preventDefault();
      if (window.history.length > 1) window.history.back();
      else window.location.href = 'patient.html';
    });
  }

  document.getElementById('apptForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) { alert('Please login first.'); location.href = 'login.html'; return; }
    const payload = {
      service: document.getElementById('service').value,
      date: document.getElementById('date').value || undefined,
      time: document.getElementById('time').value || undefined,
      notes: (() => {
        const phone = document.getElementById('phone').value.trim();
        const profession = document.getElementById('profession').value.trim();
        const reason = document.getElementById('notes').value.trim();
        const parts = [];
        if (phone) parts.push(`Phone: ${phone}`);
        if (profession) parts.push(`Profession: ${profession}`);
        if (reason) parts.push(`Reason: ${reason}`);
        return parts.join(' | ') || undefined;
      })(),
    };
    try {
      const res = await fetch(`${API}/hospitals/${id}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Appointment request sent!');
        (e.target).reset();
      } else {
        const data = await res.json().catch(()=>({}));
        alert(data.msg || 'Failed to create appointment');
      }
    } catch {
      alert('Network error');
    }
  });

  init();
})();
