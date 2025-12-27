(() => {
  const API = '/api';
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token || role !== 'patient') {
    window.location.href = 'login.html';
    return;
  }

  const authHeaders = { 'Content-Type': 'application/json', 'x-auth-token': token };

  let cart = [];
  function loadCart(){ try{ cart = JSON.parse(localStorage.getItem('cart')||'[]'); }catch{ cart = []; } updateCartBadge(); }
  function saveCart(){ localStorage.setItem('cart', JSON.stringify(cart)); updateCartBadge(); }
  function updateCartBadge(){ const el = document.getElementById('cartCount'); if (el) el.textContent = String(cart.reduce((s,i)=>s+Number(i.qty||0),0)); }
  loadCart();

  // Mobile drawer toggle with back/ESC support
  const sideEl = document.querySelector('.side');
  const backdrop = document.getElementById('drawerBackdrop');
  let drawerOpen = false;
  function openDrawer(){
    sideEl?.classList.add('open');
    backdrop?.classList.add('open');
    document.body.classList.add('no-scroll');
    drawerOpen = true;
    if (location.hash !== '#drawer') {
      history.pushState({ drawer:true }, '', '#drawer');
    }
  }
  function closeDrawer(){
    sideEl?.classList.remove('open');
    backdrop?.classList.remove('open');
    document.body.classList.remove('no-scroll');
    if (drawerOpen) {
      drawerOpen = false;
      // If history state was pushed for drawer, go back one step to previous hash
      if (location.hash === '#drawer') {
        history.back();
      }
    }
  }
  document.getElementById('mobMenuBtn')?.addEventListener('click', openDrawer);
  backdrop?.addEventListener('click', closeDrawer);
  // Close on ESC
  window.addEventListener('keydown', (e)=>{ if (e.key === 'Escape' && drawerOpen) closeDrawer(); });
  // Close when user navigates back
  window.addEventListener('popstate', ()=>{ if (drawerOpen) closeDrawer(); });

  // SPA-style navigation
  const links = document.querySelectorAll('[data-link]');
  const sections = ['dash','hospitals','appointments','medicines','orders','reports','notes','profile','contact'];
  links.forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    links.forEach(l => l.classList.remove('active'));
    a.classList.add('active');
    // close drawer on navigation (mobile)
    sideEl?.classList.remove('open');
    backdrop?.classList.remove('open');
    document.body.classList.remove('no-scroll');
    const target = a.getAttribute('href').replace('#','');
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = (id === target) ? 'block' : 'none';
    });
    // load data on first visit
    switch(target){
      case 'hospitals': renderHospitals(); break;
      case 'appointments': renderAppointments(); break;
      case 'medicines': renderMedicines(); break;
      case 'orders': renderOrders(); break;
      case 'reports': renderReports(); break;
      case 'notes': renderNotes(); break;
      case 'profile': renderProfile(); break;
    }
  }));

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = 'login.html';
  });

  // Global search on topbar
  const btnHosp = document.getElementById('globHospBtn');
  const btnMed = document.getElementById('globMedBtn');
  const globalForm = document.getElementById('globalSearchForm');
  const globalInput = document.getElementById('globalSearch');
  let mode = 'hosp';
  const setMode = (m) => {
    mode = m;
    btnHosp?.classList.toggle('active', m === 'hosp');
    btnMed?.classList.toggle('active', m === 'med');
    if (globalInput) {
      globalInput.placeholder = m === 'hosp'
        ? 'Search hospitals by name, city or service'
        : 'Search medicines by name';
    }
  };
  btnHosp?.addEventListener('click', ()=> setMode('hosp'));
  btnMed?.addEventListener('click', ()=> setMode('med'));
  globalForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = globalInput?.value.trim() || '';
    if (mode === 'hosp') {
      // switch to hospitals section
      document.querySelector('[href="#hospitals"][data-link]')?.click();
      renderHospitals(q);
    } else {
      document.querySelector('[href="#medicines"][data-link]')?.click();
      renderMedicines(q);
    }
  });

  async function fetchJSON(url, options={}){
    const res = await fetch(url, options);
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  }

  // Load user + stats
  async function init() {
    try {
      const me = await fetchJSON(`${API}/auth/me`, { headers: authHeaders });
      document.getElementById('userName').textContent = me?.name || 'Patient';
      // preload profile form values
      const prName = document.getElementById('prName');
      if (prName) {
        document.getElementById('prName').value = me.name || '';
        document.getElementById('prEmail').value = me.email || '';
        document.getElementById('prPhone').value = me.phone || '';
        document.getElementById('prAddress').value = me.address || '';
      }
      // stats + recent activity
      Promise.allSettled([
        fetchJSON(`${API}/hospitals/appointments/all`, { headers: authHeaders }).then(d=>{
          document.getElementById('statAppts').textContent = d.length;
          const r = (d||[]).slice(0,3).map(a=>`${a.hospital?.name||'Hospital'} • ${a.service} • ${a.status}`).join('<br>');
          const box = document.getElementById('recentAppts'); if (box) box.innerHTML = r || 'No recent appointments';
        }),
        fetchJSON(`${API}/reports`, { headers: authHeaders }).then(d=>{
          document.getElementById('statReports').textContent = d.length;
          const r = (d||[]).slice(0,3).map(x=>`${x.originalName||x.fileName} • ${new Date(x.createdAt).toLocaleDateString()}`).join('<br>');
          const box = document.getElementById('recentReports'); if (box) box.innerHTML = r || 'No recent reports';
        }),
        fetchJSON(`${API}/orders`, { headers: authHeaders }).then(d=>{
          document.getElementById('statOrders').textContent = d.length;
          const tips = [
            'Tip: Keep emergency details updated in Profile.',
            'Reminder: You can set medicine reminders in Notes.',
            'Pro tip: Search hospitals by city or service for faster results.'
          ];
          const box = document.getElementById('tipsBox'); if (box) box.innerHTML = tips[Math.floor(Math.random()*tips.length)];
        }),
      ]);

      // quick actions
      document.getElementById('qaBar')?.querySelectorAll('[data-go]')
        .forEach(btn=>btn.addEventListener('click', ()=>{
          const target = btn.getAttribute('data-go');
          document.querySelector(`[href="${target}"][data-link]`)?.click();
        }));
    } catch (e) {
      console.error(e); window.location.href = 'login.html';
    }
  }

  // Hospitals
  async function renderHospitals(q=''){
    const grid = document.getElementById('hGrid');
    grid.innerHTML = '<div class="loading">Loading hospitals…</div>';
    try {
      const url = q ? `${API}/hospitals?search=${encodeURIComponent(q)}` : `${API}/hospitals`;
      const data = await fetchJSON(url);
      if (!data.length) { grid.innerHTML = '<div class="empty">No hospitals found.</div>'; return; }
      grid.innerHTML = data.map(h=>{
        const city = h.address?.city||''; const state=h.address?.state||'';
        return `
          <div class="card hospital-card">
            <div class="card-media" style="height:120px;background-image:url('${h.image||'assets/hospital.jpg'}')"></div>
            <div class="card-body">
              <h3>${h.name}</h3>
              <p class="muted">${city}${city&&state?', ':''}${state}</p>
              <div class="tags">${(h.services||[]).slice(0,3).map(s=>`<span class=tag>${s}</span>`).join('')}</div>
              <a class="btn btn-outline btn-sm" href="hospital.html?id=${h._id}">Request Appointment</a>
            </div>
          </div>
        `;
      }).join('');
    } catch(e){ grid.innerHTML = '<div class="error">Failed to load hospitals.</div>'; }
  }
  document.getElementById('hSearchBtn')?.addEventListener('click', ()=>{
    const q = document.getElementById('hSearch').value.trim();
    renderHospitals(q);
  });
  document.getElementById('hSearchForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const q = document.getElementById('hSearch').value.trim();
    renderHospitals(q);
  });

  // Appointments
  async function renderAppointments(){
    const tbody = document.querySelector('#apptTable tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="muted">Loading…</td></tr>';
    try {
      const data = await fetchJSON(`${API}/hospitals/appointments/all`, { headers: authHeaders });
      if (!data.length) { tbody.innerHTML = '<tr><td colspan="6" class="muted">No appointments yet.</td></tr>'; return; }
      tbody.innerHTML = data.map(a=>{
        const d = a.date ? new Date(a.date).toLocaleDateString() : '-';
        const t = a.time || '-';
        const canCancel = !['Cancelled','Rejected'].includes(a.status);
        const act = canCancel ? `<button class="btn btn-outline btn-sm" data-appt-cancel="${a._id}">Cancel</button>` : '';
        return `<tr><td>${a.hospital?.name||'-'}</td><td>${a.service}</td><td>${d}</td><td>${t}</td><td>${a.status}</td><td>${act}</td></tr>`;
      }).join('');
      // bind cancel
      tbody.querySelectorAll('[data-appt-cancel]')?.forEach(btn=>btn.addEventListener('click', async ()=>{
        if (!confirm('Cancel this appointment?')) return;
        const id = btn.getAttribute('data-appt-cancel');
        try{
          const res = await fetch(`${API}/hospitals/appointments/${id}/cancel`, { method:'PATCH', headers: authHeaders });
          if (!res.ok) throw new Error();
          renderAppointments();
          alert('Appointment cancelled');
        } catch { alert('Failed to cancel'); }
      }));
    } catch { tbody.innerHTML = '<tr><td colspan="5" class="error">Failed to load.</td></tr>'; }
  }

  // Medicines (browse)
  async function renderMedicines(q=''){
    const grid = document.getElementById('medGrid');
    grid.innerHTML = '<div class="loading">Loading medicines…</div>';
    try {
      const url = q ? `${API}/medicines?q=${encodeURIComponent(q)}` : `${API}/medicines`;
      const meds = await fetchJSON(url);
      grid.innerHTML = meds.map(m=>{
        const safe = {
          id: m._id,
          name: (m.name||'').replace(/"/g,'&quot;')
        };
        return `
          <div class="card">
            <div style="display:flex; gap:12px;">
              <img src="${m.image||'assets/medicine.png'}" alt="${safe.name}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;border:1px solid var(--border);" />
              <div style="flex:1;">
                <h3 style="margin:0 0 6px;">${safe.name}</h3>
                <div class="muted">₹${m.price||0} / ${m.unit||'unit'} • ⭐ ${Number(m.rating||0).toFixed(1)}</div>
                <p class="muted" style="margin:6px 0 10px;">${m.description||''}</p>
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                  <select data-qty id="q_${safe.id}" style="padding:6px 8px; border-radius:8px; border:1px solid var(--border);">
                    ${[1,2,3,4,5].map(n=>`<option value="${n}">${n}</option>`).join('')}
                  </select>
                  <button class="btn btn-outline btn-sm" data-addcart="${safe.id}" data-name="${safe.name}">Add to Cart</button>
                  <button class="btn btn-primary btn-sm" data-order="${safe.id}" data-name="${safe.name}">Order Now</button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
      // bind add to cart
      grid.querySelectorAll('button[data-addcart]')?.forEach(btn=>btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-addcart');
        const name = btn.getAttribute('data-name');
        const qtySel = document.getElementById(`q_${id}`);
        const qty = Number(qtySel?.value||1);
        const existing = cart.find(i=>i.name===name);
        if (existing) existing.qty += qty; else cart.push({ name, qty });
        saveCart();
      }));
      // bind order-now buttons with qty
      grid.querySelectorAll('button[data-order]')?.forEach(btn=>btn.addEventListener('click', async ()=>{
        const id = btn.getAttribute('data-order');
        const name = btn.getAttribute('data-name');
        const qtySel = document.getElementById(`q_${id}`);
        const qty = Number(qtySel?.value||1);
        try {
          const res = await fetch(`${API}/orders`, {
            method: 'POST', headers: authHeaders,
            body: JSON.stringify({ items: [{ name, qty }] })
          });
          if (!res.ok) throw new Error('Order failed');
          alert(`Order placed: ${name} x ${qty}`);
          renderOrders();
        } catch { alert('Failed to place order'); }
      }));
    } catch { grid.innerHTML = '<div class="error">Failed to load.</div>'; }
  }
  document.getElementById('mSearchForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const q = document.getElementById('mSearch').value.trim();
    renderMedicines(q);
  });

  // Cart UI actions
  document.getElementById('cartBtn')?.addEventListener('click', ()=>{
    if (!cart.length) { alert('Cart is empty'); return; }
    const lines = cart.map(i=>`${i.name} x ${i.qty}`).join('\n');
    alert('Cart Items:\n' + lines);
  });
  document.getElementById('checkoutBtn')?.addEventListener('click', async ()=>{
    if (!cart.length) { alert('Cart is empty'); return; }
    try{
      const res = await fetch(`${API}/orders`, { method:'POST', headers: authHeaders, body: JSON.stringify({ items: cart }) });
      if (!res.ok) throw new Error();
      cart = []; saveCart();
      alert('Order placed');
      renderOrders();
      document.querySelector('[href="#orders"][data-link]')?.click();
    } catch { alert('Checkout failed'); }
  });

  // Orders history
  let cancelOrderId = null;
  async function renderOrders(){
    const tbody = document.querySelector('#orderTable tbody'); if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="muted">Loading…</td></tr>';
    try{
      const orders = await fetchJSON(`${API}/orders`, { headers: authHeaders });
      if (!orders.length){ tbody.innerHTML = '<tr><td colspan="4" class="muted">No orders yet.</td></tr>'; snapshotOrders([]); return; }
      tbody.innerHTML = orders.map(o=>{
        const items = (o.items||[]).map(i=>`${i.name} x ${i.qty}`).join(', ');
        const t = o.createdAt ? new Date(o.createdAt).toLocaleString() : '-';
        const canCancel = !['Delivered','Rejected','Cancelled'].includes(o.status);
        const act = canCancel ? `<button class="btn btn-outline btn-sm" data-cancel="${o._id}">Cancel</button>` : '';
        return `<tr><td>${items}</td><td>${o.status}</td><td>${t}</td><td>${act}</td></tr>`;
      }).join('');
      snapshotOrders(orders);
      // bind cancel buttons
      tbody.querySelectorAll('[data-cancel]')?.forEach(btn=>btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-cancel');
        const row = btn.closest('tr');
        const items = row?.children?.[0]?.textContent || '';
        const status = row?.children?.[1]?.textContent || '';
        cancelOrderId = id;
        const modal = document.getElementById('orderModal');
        document.getElementById('omItems').textContent = items;
        document.getElementById('omStatus').textContent = `Current status: ${status}`;
        modal.style.display = 'flex';
      }));
    } catch { tbody.innerHTML = '<tr><td colspan="3" class="error">Failed</td></tr>'; }
  }

  // Modal handlers
  document.getElementById('omClose')?.addEventListener('click', ()=>{
    document.getElementById('orderModal').style.display = 'none'; cancelOrderId = null;
  });
  document.getElementById('orderModal')?.addEventListener('click', (e)=>{
    if (e.target.id === 'orderModal'){ document.getElementById('orderModal').style.display='none'; cancelOrderId=null; }
  });
  document.getElementById('omConfirm')?.addEventListener('click', async ()=>{
    if (!cancelOrderId) return;
    try{
      const res = await fetch(`${API}/orders/${cancelOrderId}/cancel`, { method:'PATCH', headers: authHeaders });
      if (!res.ok) throw new Error();
      document.getElementById('orderModal').style.display='none'; cancelOrderId=null;
      renderOrders();
      alert('Order cancelled');
    } catch { alert('Failed to cancel order'); }
  });

  // Notifications for order updates
  // Toast helper + web notification
  function showToast(message){
    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = 'position:fixed; right:16px; bottom:16px; background:#0f2a4a; color:#e6f1ff; padding:10px 14px; border-radius:10px; box-shadow:0 8px 20px rgba(0,0,0,0.25); z-index:1000; max-width:80vw;';
    document.body.appendChild(el);
    setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=> el.remove(), 300); }, 3500);
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
  // snapshot helpers
  function snapshotOrders(arr){ try{ localStorage.setItem('ordersSnapshot', JSON.stringify(arr.map(o=>({id:o._id,status:o.status, items:o.items})))) }catch{} }
  function calcOrderDiff(newArr){ let prev=[]; try{ prev = JSON.parse(localStorage.getItem('ordersSnapshot')||'[]'); }catch{} const map=new Map(prev.map(x=>[x.id,x.status])); let changes=0; newArr.forEach(o=>{ const ps=map.get(o._id); if (!ps) { changes++; showToast('Order placed'); webNotify('Order placed', (o.items||[]).map(i=>`${i.name} x ${i.qty}`).join(', ')); } else if (ps!==o.status){ changes++; showToast(`Order ${o._id.slice(-4)} → ${o.status}`); webNotify('Order updated', o.status); } }); return changes; }
  const pNotif = document.getElementById('pNotifCount');
  const pNotifDesk = document.getElementById('pNotifCountDesk');
  async function pollPatientNotif(){
    try{
      const orders = await fetchJSON(`${API}/orders`, { headers: authHeaders });
      const changes = calcOrderDiff(orders);
      if (pNotif){ pNotif.textContent = changes? String(changes):''; pNotif.style.display = changes? 'inline-block':'none'; }
      if (pNotifDesk){ pNotifDesk.textContent = changes? String(changes):''; pNotifDesk.style.display = changes? 'inline-block':'none'; }
      snapshotOrders(orders);
    } catch {}
  }
  setInterval(pollPatientNotif, 5000);
  pollPatientNotif();

  // Reports
  async function renderReports(){
    const tbody = document.querySelector('#repTable tbody');
    tbody.innerHTML = '<tr><td colspan="3" class="muted">Loading…</td></tr>';
    try {
      const data = await fetchJSON(`${API}/reports`, { headers: authHeaders });
      if (!data.length) { tbody.innerHTML = '<tr><td colspan="3" class="muted">No reports yet.</td></tr>'; return; }
      tbody.innerHTML = data.map(r=>{
        const date = new Date(r.createdAt).toLocaleString();
        return `<tr><td>${r.originalName||r.fileName}</td><td>${date}</td><td><a class="btn btn-outline btn-sm" href="${r.path}" target="_blank">View</a></td></tr>`;
      }).join('');
    } catch { tbody.innerHTML = '<tr><td colspan="3" class="error">Failed to load.</td></tr>'; }
  }

  // Notes
  async function renderNotes(){
    const tbody = document.querySelector('#noteTable tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="muted">Loading…</td></tr>';
    try {
      const data = await fetchJSON(`${API}/notes`, { headers: authHeaders });
      if (!data.length) { tbody.innerHTML = '<tr><td colspan="4" class="muted">No notes yet.</td></tr>'; return; }
      tbody.innerHTML = data.map(n=>{
        const due = n.dueAt ? new Date(n.dueAt).toLocaleString() : '-';
        const at = new Date(n.createdAt).toLocaleString();
        const typeBadge = `<span class="badge ${n.type==='reminder'?'badge-reminder':'badge-note'}">${n.type}</span>`;
        return `<tr><td>${typeBadge}</td><td>${n.text}</td><td>${due}</td><td>${at}</td></tr>`;
      }).join('');

      // schedule notifications for reminders
      scheduleReminders(data.filter(n => n.type === 'reminder'));
    } catch { tbody.innerHTML = '<tr><td colspan="4" class="error">Failed to load.</td></tr>'; }
  }

  // Reminder creation form (patient self)
  document.getElementById('reminderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      medicineName: document.getElementById('rMed').value.trim(),
      startDate: document.getElementById('rStart').value,
      endDate: document.getElementById('rEnd').value || undefined,
      timeOfDay: document.getElementById('rTime').value,
      text: document.getElementById('rText').value.trim() || undefined,
    };
    if (!payload.medicineName || !payload.startDate || !payload.timeOfDay) { return; }
    try {
      const res = await fetch(`${API}/notes/reminders`, { method:'POST', headers: authHeaders, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to add reminder');
      e.target.reset();
      renderNotes();
      alert('Reminder added');
    } catch { alert('Could not add reminder'); }
  });

  // Lightweight scheduler: checks every 30s and triggers once per day per note
  let reminderTimer = null;
  function scheduleReminders(reminders){
    if (!Array.isArray(reminders)) return;
    if (reminderTimer) clearInterval(reminderTimer);

    // ask permission once
    if ('Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch {}
    }

    const keyFor = (id) => `note:last:${id}`;
    const shouldNotifyToday = (note) => {
      const now = new Date();
      const start = note.startDate ? new Date(note.startDate) : (note.dueAt ? new Date(note.dueAt) : null);
      const end = note.endDate ? new Date(note.endDate) : null;
      if (start && now < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false;
      if (end && now > new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23,59,59)) return false;
      // time match within the current minute
      const [hh, mm] = String(note.timeOfDay||'').split(':').map(x=>parseInt(x,10));
      if (Number.isNaN(hh) || Number.isNaN(mm)) return false;
      return now.getHours() === hh && now.getMinutes() === mm;
    };

    const notify = (note) => {
      const title = 'Medicine Reminder';
      const body = note.text || `Time to take ${note.medicineName || 'medicine'}`;
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      } else {
        alert(`${title}: ${body}`);
      }
    };

    reminderTimer = setInterval(() => {
      const nowISO = new Date().toISOString().slice(0,10); // YYYY-MM-DD
      reminders.forEach(n => {
        if (!n._id) return;
        const last = localStorage.getItem(keyFor(n._id));
        if (last === nowISO) return; // already notified today
        if (shouldNotifyToday(n)) {
          notify(n);
          localStorage.setItem(keyFor(n._id), nowISO);
        }
      });
    }, 30000);
  }

  // Profile
  async function renderProfile(){
    try {
      const me = await fetchJSON(`${API}/auth/me`, { headers: authHeaders });
      document.getElementById('prName').value = me.name || '';
      document.getElementById('prEmail').value = me.email || '';
      document.getElementById('prPhone').value = me.phone || '';
      document.getElementById('prAddress').value = me.address || '';
      document.getElementById('prPassword').value = '';
    } catch {}
  }

  // Save profile
  document.getElementById('profileForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const body = {
      name: document.getElementById('prName').value.trim(),
      phone: document.getElementById('prPhone').value.trim(),
      address: document.getElementById('prAddress').value.trim(),
    };
    const pw = document.getElementById('prPassword').value;
    if (pw) body.password = pw;
    try{
      const res = await fetch(`${API}/auth/me`, { method:'PUT', headers: authHeaders, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      alert('Profile updated');
      document.getElementById('prPassword').value='';
      // refresh header name
      document.getElementById('userName').textContent = body.name || document.getElementById('userName').textContent;
    } catch { alert('Failed to update'); }
  });

  // Floating emergency button → jump to contact section and focus name
  document.getElementById('emgFab')?.addEventListener('click', ()=>{
    document.querySelector('[href="#contact"][data-link]')?.click();
    setTimeout(()=> document.getElementById('emgName')?.focus(), 50);
  });

  // Emergency
  document.getElementById('emgForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const payload = {
      name: document.getElementById('emgName').value.trim(),
      phone: document.getElementById('emgPhone').value.trim(),
      message: document.getElementById('emgMsg').value.trim(),
    };
    try {
      const res = await fetch(`${API}/emergency`, { method:'POST', headers: authHeaders, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      alert('Emergency alert sent.');
      e.target.reset();
    } catch { alert('Failed to send alert.'); }
  });

  // Start
  init();
})();
