(() => {
  const API = '/api';
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token || role !== 'admin') {
    window.location.href = 'login.html';
    return;
  }
  const authHeaders = { 'x-auth-token': token };

  // Mobile drawer toggle
  const sideEl = document.querySelector('.side');
  const backdrop = document.getElementById('drawerBackdrop');
  document.getElementById('mobMenuBtn')?.addEventListener('click', ()=>{
    sideEl?.classList.add('open');
    backdrop?.classList.add('open');
  });
  backdrop?.addEventListener('click', ()=>{
    sideEl?.classList.remove('open');
    backdrop?.classList.remove('open');
  });

  // SPA nav
  const links = document.querySelectorAll('[data-link]');
  const sections = ['dashboard','appointments','patients','reports','notes','orders','emergency','medicines','hospitals'];
  links.forEach(a=>a.addEventListener('click', (e)=>{
    e.preventDefault();
    links.forEach(l=>l.classList.remove('active'));
    a.classList.add('active');
    // close drawer on navigation (mobile)
    sideEl?.classList.remove('open');
    backdrop?.classList.remove('open');
    const target = a.getAttribute('href').replace('#','');
    sections.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = (id===target)?'block':'none'; });
    switch(target){
      case 'dashboard': initStats(); break;
      case 'appointments': loadAppointments(); break;
      case 'patients': renderPatients(); break;
      case 'reports': prepReports(); break;
      case 'notes': prepNotes(); break;
      case 'orders': loadOrders(); break;
      case 'emergency': loadEmergency(); break;
      case 'hospitals': loadHospitals(); break;
      case 'medicines': loadMedicines(); break;
    }
  }));

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', (e)=>{
    e.preventDefault(); localStorage.clear(); window.location.href='login.html';
  });

  async function json(url, opts={}){
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  }

  // Stats
  async function initStats(){
    try {
      const [appts, orders, emg] = await Promise.all([
        json(`${API}/hospitals/appointments/all`, { headers: authHeaders }),
        json(`${API}/orders`, { headers: authHeaders }),
        json(`${API}/emergency`, { headers: authHeaders }),
      ]);
      document.getElementById('aStat').textContent = appts.length;
      document.getElementById('oStat').textContent = orders.length;
      document.getElementById('eStat').textContent = emg.length;
      const patients = new Map();
      appts.forEach(a=>{ if (a.patient) patients.set(a.patient._id, a.patient); });
      document.getElementById('pStat').textContent = patients.size;
    } catch {}
  }

  // Appointments
  async function loadAppointments(){
    const tbody = document.querySelector('#apptTable tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="muted">Loading…</td></tr>';
    try{
      const data = await json(`${API}/hospitals/appointments/all`, { headers: authHeaders });
      if (!data.length) { tbody.innerHTML = '<tr><td colspan="7" class="muted">No appointments</td></tr>'; return; }
      tbody.innerHTML = data.map(a=>{
        const d = a.date ? new Date(a.date).toLocaleDateString() : '-';
        const t = a.time || '-';
        return `<tr>
          <td>${a.patient?.name||'-'}<div class="muted-sm">${a.patient?.email||''}</div></td>
          <td>${a.hospital?.name||'-'}</td>
          <td>${a.service}</td>
          <td>${d}</td>
          <td>${t}</td>
          <td>${a.status}</td>
          <td>
            <div class="row">
              <input type="date" data-date value="${a.date?new Date(a.date).toISOString().slice(0,10):''}">
              <input type="time" data-time value="${a.time||''}">
              <button class="btn btn-primary btn-sm" data-approve data-id="${a._id}">Approve</button>
              <button class="btn btn-outline btn-sm" data-reject data-id="${a._id}">Reject</button>
            </div>
          </td>
        </tr>`;
      }).join('');
      tbody.querySelectorAll('[data-approve]').forEach(btn=>btn.addEventListener('click', async ()=>{
        const tr = btn.closest('tr');
        const date = tr.querySelector('[data-date]').value;
        const time = tr.querySelector('[data-time]').value;
        await fetch(`${API}/hospitals/appointments/${btn.dataset.id}`, {
          method:'PUT', headers:{...authHeaders,'Content-Type':'application/json'},
          body: JSON.stringify({ status:'Approved', date, time })
        });
        loadAppointments();
      }));
      tbody.querySelectorAll('[data-reject]').forEach(btn=>btn.addEventListener('click', async ()=>{
        await fetch(`${API}/hospitals/appointments/${btn.dataset.id}`, {
          method:'PUT', headers:{...authHeaders,'Content-Type':'application/json'},
          body: JSON.stringify({ status:'Rejected' })
        });
        loadAppointments();
      }));
    } catch { tbody.innerHTML = '<tr><td colspan="7" class="error">Failed</td></tr>'; }
  }

  // Patients (derived from appointments)
  let cachedPatients = new Map();
  async function renderPatients(){
    const tbody = document.querySelector('#patTable tbody');
    tbody.innerHTML = '<tr><td colspan="3" class="muted">Loading…</td></tr>';
    try{
      const appts = await json(`${API}/hospitals/appointments/all`, { headers: authHeaders });
      cachedPatients = new Map();
      appts.forEach(a=>{ if (a.patient) cachedPatients.set(a.patient._id, a.patient); });
      const arr = Array.from(cachedPatients.values());
      if (!arr.length){ tbody.innerHTML = '<tr><td colspan="3" class="muted">No patients yet.</td></tr>'; return; }
      tbody.innerHTML = arr.map(p=>`<tr><td>${p.name}</td><td>${p.email}</td><td>${p.phone||''}</td></tr>`).join('');
    } catch { tbody.innerHTML = '<tr><td colspan="3" class="error">Failed</td></tr>'; }
  }

  // Reports upload
  async function prepReports(){
    // populate patient and hospital selects
    try{
      const [appts, hospitals] = await Promise.all([
        json(`${API}/hospitals/appointments/all`, { headers: authHeaders }),
        json(`${API}/hospitals`)
      ]);
      cachedPatients = new Map();
      appts.forEach(a=>{ if (a.patient) cachedPatients.set(a.patient._id, a.patient); });
      const pSel = document.getElementById('reportPatient');
      pSel.innerHTML = '<option value="" disabled selected>Select patient</option>' +
        Array.from(cachedPatients.values()).map(p=>`<option value="${p._id}">${p.name} (${p.email})</option>`).join('');
      const hSel = document.getElementById('reportHospital');
      hSel.innerHTML = '<option value="" selected>Optional hospital</option>' +
        hospitals.map(h=>`<option value="${h._id}">${h.name}</option>`).join('');
    } catch {}
  }

  document.getElementById('reportForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData();
    fd.append('patientId', document.getElementById('reportPatient').value);
    const h = document.getElementById('reportHospital').value; if (h) fd.append('hospitalId', h);
    const file = document.getElementById('reportFile').files[0];
    if (!file) { alert('Select a file'); return; }
    fd.append('file', file);
    try{
      const res = await fetch(`${API}/reports/upload`, { method:'POST', headers: authHeaders, body: fd });
      if (!res.ok) throw new Error();
      alert('Report uploaded');
      (e.target).reset();
    } catch { alert('Upload failed'); }
  });

  // Notes create (admin -> patient)
  async function prepNotes(){
    try{
      const appts = await json(`${API}/hospitals/appointments/all`, { headers: authHeaders });
      cachedPatients = new Map(); appts.forEach(a=>{ if (a.patient) cachedPatients.set(a.patient._id, a.patient); });
      const sel = document.getElementById('notePatient');
      sel.innerHTML = Array.from(cachedPatients.values()).map(p=>`<option value="${p._id}">${p.name} (${p.email})</option>`).join('');
    } catch {}
  }
  document.getElementById('noteForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const body = {
      patientId: document.getElementById('notePatient').value,
      text: document.getElementById('noteText').value.trim(),
      type: document.getElementById('noteType').value,
      dueAt: document.getElementById('noteDue').value || undefined,
    };
    try{
      const res = await fetch(`${API}/notes`, { method:'POST', headers:{...authHeaders,'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      alert('Added'); (e.target).reset();
    } catch { alert('Failed to add'); }
  });

  // Orders
  async function loadOrders(){
    const tbody = document.querySelector('#orderTable tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="muted">Loading…</td></tr>';
    try{
      const orders = await json(`${API}/orders`, { headers: authHeaders });
      if (!orders.length) { tbody.innerHTML = '<tr><td colspan="4" class="muted">No orders</td></tr>'; return; }
      tbody.innerHTML = orders.map(o=>{
        const items = (o.items||[]).map(i=>`${i.name} x ${i.qty}`).join(', ');
        const pName = o.patient?.name || (typeof o.patient === 'string' ? o.patient : '');
        const pEmail = o.patient?.email ? `<div class="muted-sm">${o.patient.email}</div>` : '';
        return `<tr>
          <td>${pName}${pEmail}</td>
          <td>${items}</td>
          <td>${o.status}</td>
          <td>
            <select data-status="${o._id}">
              ${['Placed','Processing','Ready','Delivered','Rejected'].map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}
            </select>
            <button class="btn btn-primary btn-sm" data-save="${o._id}">Save</button>
          </td>
        </tr>`;
      }).join('');
      tbody.querySelectorAll('[data-save]').forEach(btn=>btn.addEventListener('click', async ()=>{
        const id = btn.getAttribute('data-save');
        const status = tbody.querySelector(`[data-status="${id}"]`).value;
        await fetch(`${API}/orders/${id}`, { method:'PUT', headers:{...authHeaders,'Content-Type':'application/json'}, body: JSON.stringify({ status }) });
        loadOrders();
      }));
    } catch { tbody.innerHTML = '<tr><td colspan="4" class="error">Failed</td></tr>'; }
  }

  // Emergency
  async function loadEmergency(){
    const tbody = document.querySelector('#emgTable tbody');
    tbody.innerHTML = '<tr><td colspan="5" class="muted">Loading…</td></tr>';
    try{
      const rows = await json(`${API}/emergency`, { headers: authHeaders });
      if (!rows.length) { tbody.innerHTML = '<tr><td colspan="5" class="muted">No alerts</td></tr>'; return; }
      tbody.innerHTML = rows.map(e=>`<tr>
        <td>${e.name||'-'}</td><td>${e.phone||'-'}</td><td>${e.message||'-'}</td><td>${e.status}</td>
        <td>
          <select data-emg="${e._id}">
            ${['New','Seen','Resolved'].map(s=>`<option ${s===e.status?'selected':''}>${s}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" data-emg-save="${e._id}">Save</button>
        </td>
      </tr>`).join('');
      tbody.querySelectorAll('[data-emg-save]').forEach(btn=>btn.addEventListener('click', async ()=>{
        const id = btn.getAttribute('data-emg-save');
        const status = tbody.querySelector(`[data-emg="${id}"]`).value;
        await fetch(`${API}/emergency/${id}`, { method:'PUT', headers:{...authHeaders,'Content-Type':'application/json'}, body: JSON.stringify({ status }) });
        loadEmergency();
      }));
    } catch { tbody.innerHTML = '<tr><td colspan="5" class="error">Failed</td></tr>'; }
  }

  // Hospitals
  async function loadHospitals(){
    const grid = document.getElementById('hGrid');
    grid.innerHTML = '<div class="loading">Loading…</div>';
    try{
      const hs = await json(`${API}/hospitals`);
      grid.innerHTML = hs.map(h=>`
        <div class="card hospital-card">
          <div class="card-media" style="height:120px;background-image:url('${h.image||'assets/hospital.jpg'}')"></div>
          <div class="card-body">
            <h3>${h.name}</h3>
            <p class="muted">${h.address?.city||''}${h.address?.state?', '+h.address.state:''}</p>
            <div class="tags">${(h.services||[]).slice(0,3).map(s=>`<span class=tag>${s}</span>`).join('')}</div>
            <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:8px;">
              <button class="btn btn-outline btn-sm" data-hdel="${h._id}">Delete</button>
            </div>
          </div>
        </div>
      `).join('');
      // bind delete
      grid.querySelectorAll('[data-hdel]')?.forEach(btn=>btn.addEventListener('click', async ()=>{
        if (!confirm('Delete this hospital?')) return;
        const id = btn.getAttribute('data-hdel');
        try{
          const res = await fetch(`${API}/hospitals/${id}`, { method:'DELETE', headers: authHeaders });
          if (!res.ok) throw new Error();
          loadHospitals();
        } catch { alert('Delete failed'); }
      }));
    } catch { grid.innerHTML = '<div class="error">Failed to load</div>'; }
  }

  // Add hospital form
  document.getElementById('addHospitalForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const body = {
      name: document.getElementById('hName').value.trim(),
      description: document.getElementById('hDesc').value.trim(),
      contact: document.getElementById('hPhone').value.trim(),
      image: document.getElementById('hImage').value.trim(),
      services: document.getElementById('hServices').value.trim(),
      address: { city: document.getElementById('hCity').value.trim(), state: document.getElementById('hState').value.trim() },
    };
    try{
      const res = await fetch(`${API}/hospitals`, { method:'POST', headers:{...authHeaders,'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      (e.target).reset();
      loadHospitals();
      alert('Hospital added');
    } catch { alert('Failed to add hospital'); }
  });

  // Medicines
  async function loadMedicines(){
    const list = document.getElementById('medList'); if (!list) return;
    list.innerHTML = '<div class="loading">Loading…</div>';
    try{
      const meds = await json(`${API}/medicines`);
      list.innerHTML = meds.map(m=>`<div class="card">
        <div style="display:flex; gap:10px;">
          <div>
            <img src="${m.image||'assets/medicine.png'}" alt="${m.name}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--border);" />
          </div>
          <div style="flex:1; display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; align-items:center;">
            <div style="grid-column: span 3;"><strong>${m.name}</strong></div>
            <input data-med="image" data-id="${m._id}" placeholder="Image URL" value="${m.image||''}" />
            <input data-med="unit" data-id="${m._id}" placeholder="Unit" value="${m.unit||''}" />
            <input data-med="stock" data-id="${m._id}" type="number" placeholder="Stock" value="${m.stock||0}" />
            <input data-med="price" data-id="${m._id}" type="number" placeholder="Price" value="${m.price||0}" />
            <input data-med="rating" data-id="${m._id}" type="number" step="0.1" min="0" max="5" placeholder="Rating" value="${m.rating||0}" />
            <input data-med="description" data-id="${m._id}" placeholder="Description" value="${m.description||''}" style="grid-column: span 3;" />
            <div style="grid-column: span 3; display:flex; gap:8px; justify-content:flex-end;">
              <button class="btn btn-primary btn-sm" data-med-save="${m._id}">Save</button>
              <button class="btn btn-outline btn-sm" data-med-del="${m._id}">Delete</button>
            </div>
          </div>
        </div>
      </div>`).join('');
      // Bind save buttons
      list.querySelectorAll('[data-med-save]')?.forEach(btn=>btn.addEventListener('click', async ()=>{
        const id = btn.getAttribute('data-med-save');
        const read = (key)=> list.querySelector(`[data-med="${key}"][data-id="${id}"]`)?.value;
        const body = {
          image: read('image')||'', unit: read('unit')||'', description: read('description')||'',
          stock: Number(read('stock')||0), price: Number(read('price')||0), rating: Number(read('rating')||0)
        };
        try{
          const res = await fetch(`${API}/medicines/${id}`, { method:'PUT', headers:{...authHeaders,'Content-Type':'application/json'}, body: JSON.stringify(body) });
          if (!res.ok) throw new Error();
          alert('Saved');
          loadMedicines();
        } catch { alert('Save failed'); }
      }));
      // Bind delete buttons
      list.querySelectorAll('[data-med-del]')?.forEach(btn=>btn.addEventListener('click', async ()=>{
        if (!confirm('Delete this medicine?')) return;
        const id = btn.getAttribute('data-med-del');
        try{
          const res = await fetch(`${API}/medicines/${id}`, { method:'DELETE', headers: authHeaders });
          if (!res.ok) throw new Error();
          loadMedicines();
        } catch { alert('Delete failed'); }
      }));
    } catch { list.innerHTML = '<div class="error">Failed to load</div>'; }
  }
  document.getElementById('addMedForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const body = {
      name: document.getElementById('mName').value.trim(),
      price: Number(document.getElementById('mPrice').value) || 0,
      unit: document.getElementById('mUnit').value.trim(),
      stock: Number(document.getElementById('mStock').value) || 0,
      description: document.getElementById('mDesc').value.trim(),
      image: document.getElementById('mImage').value.trim(),
      rating: Number(document.getElementById('mRating').value) || 0,
    };
    try{
      const res = await fetch(`${API}/medicines`, { method:'POST', headers:{...authHeaders,'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      (e.target).reset();
      loadMedicines();
      alert('Medicine added');
    } catch { alert('Failed to add medicine'); }
  });

  // Initial
  initStats();

  // ===== Notifications (web + mobile) =====
  function showToast(message){
    const box = document.createElement('div');
    box.textContent = message;
    box.style.cssText = 'position:fixed; right:16px; bottom:16px; background:#0f2a4a; color:#e6f1ff; padding:10px 14px; border-radius:10px; box-shadow:0 8px 20px rgba(0,0,0,0.25); z-index:1000; max-width:80vw;';
    document.body.appendChild(box);
    setTimeout(()=>{ box.style.opacity='0'; box.style.transition='opacity .3s'; setTimeout(()=> box.remove(), 300); }, 3500);
  }
  function webNotify(title, body){
    try{
      if ('Notification' in window){
        if (Notification.permission === 'granted') new Notification(title, { body });
        else if (Notification.permission === 'default') Notification.requestPermission();
        else showToast(`${title}: ${body}`);
      } else showToast(`${title}: ${body}`);
    } catch { showToast(`${title}: ${body}`); }
  }
  const notifBadge = document.getElementById('notifCount');
  let snap = { orders: [], appts: [], emg: [] };
  function setBadge(n){ if (!notifBadge) return; notifBadge.textContent = n? String(n):''; notifBadge.style.display = n? 'inline-block':'none'; }
  function diffOrders(newArr){
    const prev = new Map(snap.orders.map(o=>[o._id, o.status]));
    let changes = 0;
    newArr.forEach(o=>{ const s = prev.get(o._id); if (!s) { changes++; showToast('New order placed'); webNotify('New order', (o.items||[]).map(i=>`${i.name} x ${i.qty}`).join(', ')); } else if (s !== o.status) { changes++; showToast(`Order ${o._id.slice(-4)} → ${o.status}`); webNotify('Order updated', o.status); } });
    snap.orders = newArr.map(o=>({ _id:o._id, status:o.status, items:o.items }));
    return changes;
  }
  function diffAppts(newArr){
    const prev = new Map(snap.appts.map(a=>[a._id, a.status]));
    let changes=0; newArr.forEach(a=>{ const s=prev.get(a._id); if (!s) { changes++; showToast('New appointment requested'); } else if (s!==a.status){ changes++; showToast(`Appointment ${a._id.slice(-4)} → ${a.status}`); webNotify('Appointment updated', a.status); } });
    snap.appts = newArr.map(a=>({ _id:a._id, status:a.status }));
    return changes;
  }
  function diffEmg(newArr){
    const prev = new Map(snap.emg.map(e=>[e._id, e.status]));
    let changes=0; newArr.forEach(e=>{ const s=prev.get(e._id); if (!s) { changes++; showToast('New emergency alert'); webNotify('Emergency', e.message||'New alert'); } else if (s!==e.status){ changes++; } });
    snap.emg = newArr.map(e=>({ _id:e._id, status:e.status, message:e.message }));
    return changes;
  }
  async function pollAll(){
    try{
      const [orders, appts, emg] = await Promise.all([
        json(`${API}/orders`, { headers: authHeaders }),
        json(`${API}/hospitals/appointments/all`, { headers: authHeaders }),
        json(`${API}/emergency`, { headers: authHeaders })
      ]);
      const total = diffOrders(orders) + diffAppts(appts) + diffEmg(emg);
      setBadge(total);
    } catch {}
  }
  setInterval(pollAll, 20000);
  pollAll();
})();
