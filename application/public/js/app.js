'use strict';
/* SmartMove Transport Solutions - frontend (talks to /api -> Oracle PL/SQL + MongoDB) */
const $ = (s, e = document) => e.querySelector(s);
const view = $('#view');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => 'Rs. ' + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const stars = n => n == null ? '—' : `<span class="rate" title="${n} out of 5"><span class="meter"><i style="width:${Math.max(0, Math.min(100, n * 20))}%"></i></span><b>${n}</b></span>`;
const skeleton = () => '<div class="skel-row t"></div><div class="skel-row"></div><div class="skel-row"></div><div class="skel-row"></div>';
const FRIENDLY = [[/table or view does not exist/i, 'The Oracle tables could not be found. Check the database user and connection details in the .env file.'],
  [/ECONNREFUSED|could not connect|failed to connect/i, 'The database could not be reached. Make sure Oracle and MongoDB are running.']];
function errBox(e) {
  const m = String(e.message || e), f = (FRIENDLY.find(x => x[0].test(m)) || [])[1];
  return `<div class="errbox"><b>This page could not be loaded</b><p>${esc(f || m)}</p>${f ? `<small>${esc(m)}</small>` : ''}<button class="btn pri" data-act="retry">Try again</button></div>`;
}
function ask(msg, label = 'Yes, continue') {
  return new Promise(res => {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal sm" role="alertdialog"><h2>Please confirm</h2><p class="hint">${esc(msg)}</p><div class="mfoot"><button class="btn" data-n>Cancel</button><button class="btn pri danger" data-y>${label}</button></div></div>`;
    document.body.appendChild(bg); const done = v => { bg.remove(); res(v); };
    bg.querySelector('[data-n]').onclick = () => done(false); bg.querySelector('[data-y]').onclick = () => done(true);
    bg.addEventListener('mousedown', e => { if (e.target === bg) done(false); }); bg.querySelector('[data-y]').focus();
  });
}
function countUp() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('[data-count]').forEach(el => {
    const end = +el.dataset.count, isMoney = el.dataset.fmt === 'money', t0 = performance.now();
    const tick = t => { const p = Math.min(1, (t - t0) / 900), v = end * (1 - Math.pow(1 - p, 3));
      el.textContent = isMoney ? money(v) : Math.round(v).toLocaleString(); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
}
const fdate = d => d ? String(d).slice(0, 10) : '—';
const fdt = d => d ? String(d).replace('T', ' ') : '—';
const today = () => new Date().toISOString().slice(0, 10);
const addDays = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
let H = {}; // click handlers for the current page

function toast(msg, type = '') {
  const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), 4500);
}
async function api(path, method = 'GET', body) {
  const r = await fetch('/api' + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || r.statusText);
  return j;
}
const run = async (fn, okMsg, confirmMsg) => { if (confirmMsg && !(await ask(confirmMsg))) return; try { await fn(); if (okMsg) toast(okMsg, 'ok'); render(); } catch (e) { toast(e.message, 'bad'); } };

const BADGE = { Available: 'ok', Active: 'ok', Confirmed: 'ok', Paid: 'ok', Completed: 'ok', 'In Service': 'info', 'On Trip': 'info', Scheduled: 'info', Departed: 'info',
  'In Progress': 'warn', Pending: 'warn', Refunded: 'warn', Inactive: 'bad', Cancelled: 'bad', Failed: 'bad' };
const badge = s => s ? `<span class="badge b-${BADGE[s] || ''}">${esc(s)}</span>` : '—';
const btn = (act, id, label, cls = '', extra = '') => `<button class="btn sm ${cls}" data-act="${act}" data-id="${esc(id)}" ${extra}>${label}</button>`;

function table(cols, rows, act) {
  if (!rows.length) return '<div class="empty"><svg class="ic"><use href="#i-inbox"/></svg><b>Nothing to show yet</b><span>Records will appear here as soon as they are added.</span></div>';
  return `<div class="tw"><table><thead><tr>${cols.map(c => `<th>${c.l}</th>`).join('')}${act ? '<th></th>' : ''}</tr></thead><tbody>${rows.map(r =>
    `<tr>${cols.map(c => `<td>${c.f ? c.f(r[c.k], r) : esc(r[c.k] ?? '—')}</td>`).join('')}${act ? `<td class="act">${act(r)}</td>` : ''}</tr>`).join('')}</tbody></table></div>`;
}
const col = (k, l, f) => ({ k, l, f });

// ---------- modal + forms ----------
function modal(title, body, { wide, submitLabel = 'Save', onSubmit, onOpen } = {}) {
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<form class="modal ${wide ? 'wide' : ''}"><h2>${esc(title)}</h2>${body}<div class="mfoot"><button type="button" class="btn" data-close>${onSubmit ? 'Cancel' : 'Close'}</button>${onSubmit ? `<button class="btn pri">${submitLabel}</button>` : ''}</div></form>`;
  document.body.appendChild(bg);
  const form = bg.firstElementChild, close = () => bg.remove();
  bg.addEventListener('mousedown', e => { if (e.target === bg) close(); });
  form.querySelector('[data-close]').onclick = close;
  form.onsubmit = async e => {
    e.preventDefault(); const b = form.querySelector('.pri'); if (b) { b.disabled = true; b.dataset.t = b.textContent; b.textContent = 'Saving…'; }
    try { await onSubmit(Object.fromEntries(new FormData(form)), form); close(); } catch (err) { toast(err.message, 'bad'); if (b) { b.disabled = false; b.textContent = b.dataset.t; } }
  };
  if (onOpen) onOpen(form);
  const f1 = form.querySelector('input:not([type=hidden]),select,textarea'); if (f1) f1.focus();
  return { close, form };
}
function fieldsHtml(fields, v = {}) {
  return `<div class="fgrid">${fields.map(f => {
    const val = v[f.name] ?? f.value ?? '', req = f.required === false ? '' : 'required';
    let ctl;
    if (f.type === 'select') ctl = `<select name="${f.name}" ${req}>${f.placeholder ? `<option value="">${f.placeholder}</option>` : ''}${f.options.map(o => {
      const ov = o.v ?? o, ol = o.l ?? o; return `<option value="${esc(ov)}" ${String(ov) === String(val) ? 'selected' : ''}>${esc(ol)}</option>`; }).join('')}</select>`;
    else if (f.type === 'textarea') ctl = `<textarea name="${f.name}" rows="3" ${req}>${esc(val)}</textarea>`;
    else if (f.type === 'seats') ctl = `<input type="hidden" name="${f.name}"><div class="seats" id="seatBox"><span class="hint">Select a trip to see seats</span></div><div class="legend"><span><i></i>Available</span><span><i class="s"></i>Selected</span><span><i class="t"></i>Booked</span></div>`;
    else ctl = `<input name="${f.name}" type="${f.type || 'text'}" value="${esc(val)}" ${req} ${f.step ? `step="${f.step}"` : ''} ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.ph ? `placeholder="${esc(f.ph)}"` : ''}>`;
    return `<div class="${f.full || f.type === 'seats' || f.type === 'textarea' ? 'full' : ''}"><label>${f.label}</label>${ctl}${f.hint ? `<small class="fhint">${f.hint}</small>` : ''}</div>`;
  }).join('')}</div>`;
}
const form = (title, fields, values, onSubmit, opts = {}) => modal(title, fieldsHtml(fields, values), { ...opts, onSubmit });
const opts = async (path, v, l, filter) => (await api(path)).filter(filter || (() => true)).map(r => ({ v: r[v], l: l(r) }));

// ---------- generic CRUD page ----------
function entity({ path, id, noun, cols, fields, extra }) {
  return async () => {
    const rows = await api(path), key = id.toLowerCase();
    const byId = Object.fromEntries(rows.map(r => [r[key], r]));
    view.innerHTML = `<div class="bar"><input id="flt" class="inline" placeholder="Search this list…" style="max-width:260px"><span class="sp"></span><button class="btn pri" data-act="add">Add ${noun}</button></div><div class="card" id="tbl"></div>`;
    const draw = () => {
      const t = $('#flt').value.toLowerCase();
      $('#tbl').innerHTML = table(cols, rows.filter(r => !t || Object.values(r).join(' ').toLowerCase().includes(t)),
        r => `${extra ? extra(r) : ''}${btn('edit', r[key], 'Edit')} ${btn('del', r[key], 'Delete', 'del')}`);
    };
    $('#flt').oninput = draw; draw();
    H.add = () => form('Add ' + noun, fields, {}, d => api(path, 'POST', d).then(() => { toast(noun + ' added', 'ok'); render(); }));
    H.edit = i => form('Edit ' + noun, fields, Object.fromEntries(fields.map(f => [f.name, byId[i][f.name.toLowerCase()]])),
      d => api(`${path}/${i}`, 'PUT', d).then(() => { toast(noun + ' updated', 'ok'); render(); }));
    H.del = i => run(() => api(`${path}/${i}`, 'DELETE'), noun + ' deleted', `Delete this ${noun}?`);
    if (extra) H.hist = i => history(i, byId[i]);
  };
}
const pages = {};

// ---------- Dashboard ----------
pages.dashboard = async () => {
  const [d, trips, due] = await Promise.all([api('/dashboard'), api('/trips'), api('/reports/due')]);
  const s = d.stats;
  const cards = [['Vehicles', s.vehicles, 'vehicle'], ['Drivers', s.drivers, 'user'], ['Passengers', s.passengers, 'users'], ['Routes', s.routes, 'route'], ['Active trips', s.activetrips, 'calendar'],
    ['Confirmed bookings', s.bookings, 'ticket'], ['Paid revenue', s.revenue, 'card', 'money'], ['Maintenance due (30 days)', s.duemaintenance, 'tool']];
  const up = trips.filter(t => t.tripstatus === 'Scheduled').sort((a, b) => a.departuretime.localeCompare(b.departuretime)).slice(0, 6);
  const qa = [['qaBook', 'ticket', 'New booking', 'Reserve a seat on an upcoming trip'], ['qaTrip', 'calendar', 'Schedule a trip', 'Assign a vehicle, driver and route'],
    ['qaPass', 'users', 'Register a passenger', 'Add a new customer record'], ['qaPay', 'card', 'Record a payment', 'Mark a booking as paid']];
  const steps = [['#passengers', 'Register', 'Add the passenger'], ['#trips', 'Schedule', 'Create the trip'], ['#bookings', 'Book', 'Choose a seat'], ['#payments', 'Pay', 'Record payment'], ['#feedback', 'Review', 'Collect feedback']];
  view.innerHTML = `<div class="quick">${qa.map(a => `<button class="qa" data-act="${a[0]}"><svg class="ic"><use href="#i-${a[1]}"/></svg><b>${a[2]}</b><span>${a[3]}</span></button>`).join('')}</div>
  <div class="stats">${cards.map(c => `<div class="stat"><div class="si"><svg class="ic"><use href="#i-${c[2]}"/></svg></div><span>${c[0]}</span><b data-count="${c[1]}" ${c[3] ? 'data-fmt="money"' : ''}>${c[3] ? money(c[1]) : c[1]}</b></div>`).join('')}</div>
  <div class="grid g2"><div class="card"><h3>Upcoming trips</h3><p class="hint">The next scheduled departures and how many seats are left.</p>${table([col('tripid', 'Trip'), col('routename', 'Route'), col('departuretime', 'Departure', fdt), col('availableseats', 'Seats left')], up)}</div>
  <div class="card"><h3>Announcements</h3><p class="hint">Latest notices shown to passengers.</p>${d.announcements.map(a => `<div class="ann"><b>${esc(a.title)}</b>${esc(a.message)}<small> · ${esc(a.type)} · ${fdate(a.publishedAt)}</small></div>`).join('') || '<div class="empty"><b>No active announcements</b></div>'}</div></div>
  <div class="card"><h3>Vehicles due for maintenance<small>next 30 days</small></h3>${table([col('registrationno', 'Registration'), col('vehicletype', 'Type'), col('nextmaintenancedate', 'Next maintenance')], due)}</div>
  <div class="card"><h3>How SmartMove works</h3><p class="hint">A typical journey from a new customer to a completed trip. Select a step to open that page.</p>
  <div class="steps">${steps.map((x, i) => `<button class="step" data-act="goto" data-id="${x[0]}"><i>${i + 1}</i><div><b>${x[1]}</b><span>${x[2]}</span></div></button>`).join('')}</div></div>`;
  H.qaBook = () => bookingForm(); H.qaPay = () => payForm(); H.qaTrip = () => go('#trips', 'add'); H.qaPass = () => go('#passengers', 'add'); H.goto = id => go(id);
};

// ---------- CRUD pages ----------
const VS = ['Available', 'In Service', 'Inactive'], DS = ['Available', 'On Trip', 'Inactive'];
pages.vehicles = entity({ path: '/vehicles', id: 'VehicleID', noun: 'vehicle',
  cols: [col('vehicleid', 'ID'), col('registrationno', 'Registration'), col('vehicletype', 'Type'), col('capacity', 'Capacity'), col('vehiclestatus', 'Status', badge)],
  fields: [{ name: 'registrationNo', label: 'Registration no.' }, { name: 'vehicleType', label: 'Vehicle type', ph: 'Bus, Van, Minibus' }, { name: 'capacity', label: 'Capacity (seats)', type: 'number', min: 1, hint: 'Number of passenger seats.' },
    { name: 'vehicleStatus', label: 'Status', type: 'select', options: VS }] });
pages.drivers = entity({ path: '/drivers', id: 'DriverID', noun: 'driver',
  cols: [col('driverid', 'ID'), col('firstname', 'First name'), col('lastname', 'Last name'), col('licenseno', 'License'), col('phone', 'Phone'), col('driverstatus', 'Status', badge)],
  fields: [{ name: 'firstName', label: 'First name' }, { name: 'lastName', label: 'Last name' }, { name: 'licenseNo', label: 'License no.' },
    { name: 'phone', label: 'Phone', required: false }, { name: 'driverStatus', label: 'Status', type: 'select', options: DS }] });
pages.routes = entity({ path: '/routes', id: 'RouteID', noun: 'route',
  cols: [col('routeid', 'ID'), col('startlocation', 'From'), col('endlocation', 'To'), col('distancekm', 'Distance (km)'), col('routestatus', 'Status', badge)],
  fields: [{ name: 'startLocation', label: 'Start location' }, { name: 'endLocation', label: 'End location' }, { name: 'distanceKM', label: 'Distance (km)', type: 'number', step: '0.01', min: 0.01 },
    { name: 'routeStatus', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }] });
pages.passengers = entity({ path: '/passengers', id: 'PassengerID', noun: 'passenger',
  cols: [col('passengerid', 'ID'), col('firstname', 'First name'), col('lastname', 'Last name'), col('phone', 'Phone'), col('email', 'Email'), col('tripcount', 'Trips')],
  fields: [{ name: 'firstName', label: 'First name' }, { name: 'lastName', label: 'Last name' }, { name: 'phone', label: 'Phone', required: false },
    { name: 'email', label: 'Email', type: 'email', required: false }],
  extra: r => btn('hist', r.passengerid, 'History') + ' ' });
async function history(id, p) {
  const rows = await api(`/passengers/${id}/history`);
  modal(`Travel history – ${p.firstname} ${p.lastname}`, table([col('bookingid', 'Booking'), col('tripdate', 'Date'), col('routename', 'Route'), col('seatnumber', 'Seat'), col('fare', 'Fare', money), col('bookingstatus', 'Status', badge)], rows), { wide: true });
}

// ---------- Trips ----------
pages.trips = async () => {
  const rows = await api('/trips'), byId = Object.fromEntries(rows.map(r => [r.tripid, r]));
  view.innerHTML = `<div class="bar"><p class="hint" style="margin:0">Only vehicles and drivers marked Available can be assigned to a trip.</p><span class="sp"></span><button class="btn pri" data-act="add">Schedule trip</button></div>
  <div class="card">${table([col('tripid', 'ID'), col('tripdate', 'Date'), col('routename', 'Route'), col('registrationno', 'Vehicle'), col('drivername', 'Driver'), col('departuretime', 'Departure', fdt),
    col('arrivaltime', 'Arrival', fdt), col('tripstatus', 'Status', badge), col('availableseats', 'Seats left')], rows,
    r => `${r.tripstatus === 'Scheduled' ? btn('book', r.tripid, 'Book') + ' ' : ''}${btn('status', r.tripid, 'Status')}`)}</div>`;
  H.add = async () => {
    const [v, d, r] = await Promise.all([opts('/vehicles', 'vehicleid', x => `${x.registrationno} (${x.vehicletype}, ${x.capacity} seats)`, x => x.vehiclestatus === 'Available'),
      opts('/drivers', 'driverid', x => `${x.firstname} ${x.lastname}`, x => x.driverstatus === 'Available'), opts('/routes', 'routeid', x => `${x.startlocation} to ${x.endlocation}`, x => x.routestatus === 'Active')]);
    if (!v.length || !d.length || !r.length) return toast('Need at least one Available vehicle, Available driver and Active route', 'bad');
    form('Schedule trip', [{ name: 'vehicleId', label: 'Vehicle', type: 'select', options: v }, { name: 'driverId', label: 'Driver', type: 'select', options: d },
      { name: 'routeId', label: 'Route', type: 'select', options: r, full: true }, { name: 'tripDate', label: 'Trip date', type: 'date', value: today() },
      { name: 'departureTime', label: 'Departure', type: 'datetime-local' }, { name: 'arrivalTime', label: 'Arrival (optional)', type: 'datetime-local', required: false }], {},
      x => api('/trips', 'POST', x).then(() => { toast('Trip scheduled', 'ok'); render(); }));
  };
  H.status = i => form('Update trip status', [{ name: 'tripStatus', label: 'Status', type: 'select', options: ['Scheduled', 'Departed', 'Completed', 'Cancelled'], value: byId[i].tripstatus, full: true }], { tripStatus: byId[i].tripstatus },
    x => api(`/trips/${i}/status`, 'PUT', x).then(() => { toast('Status updated', 'ok'); render(); }));
  H.book = i => bookingForm(+i);
};

// ---------- Bookings ----------
async function loadSeats(f) {
  const box = $('#seatBox', f), tid = f.tripId.value; f.seatNumber.value = '';
  if (!tid) { box.innerHTML = '<span class="hint">Select a trip to see seats</span>'; return; }
  const s = await api(`/trips/${tid}/seats`);
  box.innerHTML = Array.from({ length: s.capacity }, (_, i) => i + 1).map(n => `<div class="seat ${s.taken.includes(n) ? 'taken' : ''}" data-s="${n}">${n}</div>`).join('');
  box.title = `${s.available} seats available`;
}
async function bookingForm(tripId) {
  const [p, t] = await Promise.all([opts('/passengers', 'passengerid', x => `${x.firstname} ${x.lastname}`),
    opts('/trips', 'tripid', x => `#${x.tripid} ${x.routename} · ${fdate(x.tripdate)} (${x.availableseats} left)`, x => x.tripstatus === 'Scheduled')]);
  form('New booking', [{ name: 'passengerId', label: 'Passenger', type: 'select', options: p, placeholder: 'Select…' },
    { name: 'tripId', label: 'Trip', type: 'select', options: t, placeholder: 'Select…', value: tripId }, { name: 'seatNumber', label: 'Seat', type: 'seats' },
    { name: 'fare', label: 'Fare (Rs.)', type: 'number', step: '0.01', min: 0, hint: 'The passenger will pay exactly this amount.' }], {},
  async d => { if (!d.seatNumber) throw new Error('Please pick a seat'); await api('/bookings', 'POST', d); toast('Booking created', 'ok'); render(); },
  { onOpen: f => {
    f.tripId.onchange = () => loadSeats(f).catch(e => toast(e.message, 'bad')); if (tripId) loadSeats(f).catch(e => toast(e.message, 'bad'));
    $('#seatBox', f).onclick = e => { const s = e.target.closest('.seat'); if (!s || s.classList.contains('taken')) return;
      f.querySelectorAll('.seat.sel').forEach(x => x.classList.remove('sel')); s.classList.add('sel'); f.seatNumber.value = s.dataset.s; };
  } });
}
pages.bookings = async () => {
  const rows = await api('/bookings'), byId = Object.fromEntries(rows.map(r => [r.bookingid, r]));
  view.innerHTML = `<div class="bar"><input id="flt" class="inline" placeholder="Search this list…" style="max-width:260px"><span class="sp"></span><button class="btn pri" data-act="add">New booking</button></div><div class="card" id="tbl"></div>`;
  const draw = () => { const t = $('#flt').value.toLowerCase();
    $('#tbl').innerHTML = table([col('bookingid', 'ID'), col('passengername', 'Passenger'), col('routename', 'Route'), col('tripdate', 'Trip date'), col('seatnumber', 'Seat'), col('fare', 'Fare', money),
      col('bookingstatus', 'Status', badge), col('paymentstatus', 'Payment', v => v ? badge(v) : '<span class="badge">Unpaid</span>')], rows.filter(r => !t || Object.values(r).join(' ').toLowerCase().includes(t)),
    r => r.bookingstatus === 'Confirmed' ? `${r.paymentstatus ? '' : btn('pay', r.bookingid, 'Pay') + ' '}${btn('cancel', r.bookingid, 'Cancel', 'del')}` : ''); };
  $('#flt').oninput = draw; draw();
  H.add = () => bookingForm();
  H.cancel = i => run(() => api(`/bookings/${i}/cancel`, 'POST'), 'Booking cancelled', 'Cancel this booking?');
  H.pay = i => payForm(+i);
};

// ---------- Payments ----------
async function payForm(bookingId) {
  const bks = (await api('/bookings')).filter(b => b.bookingstatus === 'Confirmed' && !b.paymentstatus), fare = Object.fromEntries(bks.map(b => [b.bookingid, b.fare]));
  if (!bks.length) return toast('No unpaid confirmed bookings', 'bad');
  form('Record payment', [{ name: 'bookingId', label: 'Booking', type: 'select', value: bookingId, full: true, options: bks.map(b => ({ v: b.bookingid, l: `#${b.bookingid} ${b.passengername} – ${money(b.fare)}` })) },
    { name: 'amount', label: 'Amount (Rs.)', hint: 'Must match the booking fare.', type: 'number', step: '0.01', min: 0, value: fare[bookingId] ?? bks[0].fare },
    { name: 'paymentMethod', label: 'Method', type: 'select', options: ['Cash', 'Card', 'Online', 'Bank Transfer'] },
    { name: 'paymentStatus', label: 'Status', type: 'select', options: ['Paid', 'Pending', 'Failed', 'Refunded'] }], {},
  d => api('/payments', 'POST', d).then(() => { toast('Payment recorded', 'ok'); render(); }),
  { onOpen: f => { f.bookingId.onchange = () => { f.amount.value = fare[f.bookingId.value]; }; } });
}
pages.payments = async () => {
  const rows = await api('/payments'), byId = Object.fromEntries(rows.map(r => [r.paymentid, r]));
  const paid = rows.filter(r => r.paymentstatus === 'Paid').reduce((a, r) => a + r.amount, 0);
  view.innerHTML = `<div class="bar"><div class="stat" style="padding:8px 16px"><span>Total paid</span> <b style="font-size:18px">${money(paid)}</b></div><span class="sp"></span><button class="btn pri" data-act="add">Record payment</button></div>
  <div class="card">${table([col('paymentid', 'ID'), col('bookingid', 'Booking'), col('passengername', 'Passenger'), col('paymentdate', 'Date'), col('amount', 'Amount', money), col('paymentmethod', 'Method'), col('paymentstatus', 'Status', badge)], rows, r => btn('status', r.paymentid, 'Status'))}</div>`;
  H.add = () => payForm();
  H.status = i => form('Update payment status', [{ name: 'paymentStatus', label: 'Status', type: 'select', options: ['Paid', 'Pending', 'Failed', 'Refunded'], full: true }], { paymentStatus: byId[i].paymentstatus },
    d => api(`/payments/${i}`, 'PUT', d).then(() => { toast('Payment updated', 'ok'); render(); }));
};

// ---------- Maintenance ----------
pages.maintenance = async () => {
  const rows = await api('/maintenance'), byId = Object.fromEntries(rows.map(r => [r.maintenanceid, r])), soon = addDays(30);
  view.innerHTML = `<div class="bar"><span class="sp"></span><button class="btn pri" data-act="add">Schedule maintenance</button></div>
  <div class="card">${table([col('maintenanceid', 'ID'), col('registrationno', 'Vehicle'), col('maintenancetype', 'Type'), col('maintenancedate', 'Date'), col('nextmaintenancedate', 'Next due', (v, r) =>
    esc(v) + (v <= soon && ['Scheduled', 'In Progress'].includes(r.maintenancestatus) ? ' <span class="badge b-warn">Due</span>' : '')), col('cost', 'Cost', money), col('maintenancestatus', 'Status', badge), col('description', 'Notes')],
    rows, r => `${btn('status', r.maintenanceid, 'Status')} ${btn('del', r.maintenanceid, 'Delete', 'del')}`)}</div>`;
  H.add = async () => form('Schedule maintenance', [{ name: 'vehicleId', label: 'Vehicle', type: 'select', full: true, options: await opts('/vehicles', 'vehicleid', x => `${x.registrationno} (${x.vehicletype})`) },
    { name: 'maintenanceDate', label: 'Maintenance date', type: 'date', value: today() }, { name: 'nextMaintenanceDate', label: 'Next maintenance', type: 'date', value: addDays(90) },
    { name: 'maintenanceType', label: 'Type', ph: 'Oil change, brakes …' }, { name: 'cost', label: 'Cost (Rs.)', type: 'number', step: '0.01', min: 0 },
    { name: 'maintenanceStatus', label: 'Status', type: 'select', options: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'] }, { name: 'description', label: 'Description', type: 'textarea', required: false }], {},
  d => api('/maintenance', 'POST', d).then(() => { toast('Maintenance scheduled', 'ok'); render(); }));
  H.status = i => form('Update maintenance status', [{ name: 'maintenanceStatus', label: 'Status', type: 'select', options: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'], full: true }], { maintenanceStatus: byId[i].maintenancestatus },
    d => api(`/maintenance/${i}`, 'PUT', d).then(() => { toast('Status updated', 'ok'); render(); }));
  H.del = i => run(() => api(`/maintenance/${i}`, 'DELETE'), 'Deleted', 'Delete this record?');
};

// ---------- Feedback (Oracle + MongoDB) ----------
pages.feedback = async () => {
  const rows = await api('/feedback');
  view.innerHTML = `<div class="bar"><p class="hint" style="margin:0">Passenger feedback is saved to the main database and also to the review store, so it appears under Reviews &amp; ratings.</p><span class="sp"></span><button class="btn pri" data-act="add">Add feedback</button></div>
  <div class="card">${table([col('feedbackid', 'ID'), col('passengername', 'Passenger'), col('tripid', 'Trip'), col('rating', 'Rating', stars), col('commenttext', 'Comment'), col('feedbackdate', 'Date')], rows)}</div>`;
  H.add = async () => {
    const [p, t] = await Promise.all([opts('/passengers', 'passengerid', x => `${x.firstname} ${x.lastname}`), opts('/trips', 'tripid', x => `#${x.tripid} ${x.routename} · ${fdate(x.tripdate)}`)]);
    form('Add feedback', [{ name: 'passengerId', label: 'Passenger', type: 'select', options: p }, { name: 'tripId', label: 'Trip', type: 'select', options: t },
      { name: 'rating', label: 'Rating', type: 'select', options: [5, 4, 3, 2, 1].map(n => ({ v: n, l: n + ' - ' + ['', 'Very poor', 'Poor', 'Average', 'Good', 'Excellent'][n] })), full: true }, { name: 'comment', label: 'Comment', type: 'textarea', required: false }], {},
    async d => { const r = await api('/feedback', 'POST', d); toast(r.mongo ? 'Saved to Oracle and MongoDB' : 'Saved to Oracle (MongoDB mirror failed)', r.mongo ? 'ok' : 'bad'); render(); });
  };
};

// ---------- Oracle reports ----------
const REP = [
  { k: 'revenue', t: 'Revenue summary', d: 'Payments grouped by status, with the total amount for each.', c: [col('paymentstatus', 'Status', badge), col('paymentcount', 'Payments'), col('totalamount', 'Total', money)] },
  { k: 'routes', t: 'Popular routes', d: 'Routes ranked by the number of confirmed bookings.', bar: 'totalbookings', c: [col('routeid', 'ID'), col('startlocation', 'From'), col('endlocation', 'To'), col('totalbookings', 'Confirmed bookings')] },
  { k: 'drivers', t: 'Driver performance', d: 'Trips and confirmed bookings handled by each driver.', bar: 'totaltrips', c: [col('drivername', 'Driver'), col('driverstatus', 'Status', badge), col('totaltrips', 'Trips'), col('totalbookings', 'Bookings')] },
  { k: 'maintenance', t: 'Maintenance schedule', d: 'Last and next maintenance date for every vehicle.', c: [col('registrationno', 'Vehicle'), col('vehicletype', 'Type'), col('maintenancedate', 'Last'), col('nextmaintenancedate', 'Next'), col('maintenancestatus', 'Status', badge), col('cost', 'Cost', v => v == null ? '—' : money(v))] },
  { k: 'occupancy', t: 'Trip occupancy', d: 'Capacity, seats booked and seats still free for each trip.', bar: 'confirmedbookings', max: 'capacity', c: [col('tripid', 'Trip'), col('routename', 'Route'), col('registrationno', 'Vehicle'), col('capacity', 'Capacity'), col('confirmedbookings', 'Booked'), col('availableseats', 'Free')] },
  { k: 'due', t: 'Due for maintenance', d: 'Vehicles whose next maintenance falls within the next 30 days.', c: [col('registrationno', 'Vehicle'), col('vehicletype', 'Type'), col('nextmaintenancedate', 'Next maintenance')] },
  { k: 'hybrid', t: 'Route insights', d: 'Bookings and revenue from Oracle combined with customer ratings from MongoDB.', c: [col('route', 'Route'), col('confirmed_bookings', 'Bookings (Oracle)'), col('paid_revenue', 'Revenue (Oracle)', money), col('avg_rating', 'Avg rating (Mongo)', stars), col('review_count', 'Reviews (Mongo)')] },
  { k: 'fn', t: 'Calculators', d: 'Quick calculators powered by the database functions.' }];
pages.reports = async () => {
  let cur = REP[0].k;
  view.innerHTML = `<div class="tabs" id="tabs">${REP.map(r => `<button data-act="tab" data-id="${r.k}">${r.t}</button>`).join('')}</div><div id="rep"></div>`;
  const show = async k => {
    cur = k; document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.id === k));
    const r = REP.find(x => x.k === k), out = $('#rep'); out.innerHTML = skeleton();
    try {
      if (k === 'fn') return fnPanel(out);
      const rows = await api('/reports/' + k); let cols = r.c;
      if (r.bar) { const mx = Math.max(1, ...rows.map(x => x[r.max || r.bar]));
        cols = [...cols, col('_', 'Usage', (_, x) => `<div class="mini"><i style="width:${Math.min(100, 100 * x[r.bar] / (r.max ? x[r.max] || 1 : mx))}%"></i></div>`)]; }
      out.innerHTML = `<div class="card"><h3>${r.t}<small>${rows.length} rows</small></h3><p class="hint">${r.d || ''}</p>${table(cols, rows)}</div>`;
    } catch (e) { out.innerHTML = errBox(e); H.retry = () => show(k); }
  };
  H.tab = show; show(cur);
};
async function fnPanel(out) {
  const [p, t] = await Promise.all([opts('/passengers', 'passengerid', x => `${x.firstname} ${x.lastname}`), opts('/trips', 'tripid', x => `#${x.tripid} ${x.routename} · ${fdate(x.tripdate)}`)]);
  const sel = (id, o) => `<select id="${id}">${o.map(x => `<option value="${x.v}">${esc(x.l)}</option>`).join('')}</select>`;
  out.innerHTML = `<div class="grid g2">
  <div class="card"><h3>Revenue between two dates<small>CalculateRevenue</small></h3><p class="hint">Total paid revenue between two dates.</p><div class="fgrid"><div><label>From</label><input id="fs" type="date" value="${addDays(-365)}"></div><div><label>To</label><input id="fe" type="date" value="${today()}"></div></div>
    <p><button class="btn pri" data-act="fnRev">Calculate</button> <b id="fr"></b></p></div>
  <div class="card"><h3>Trips taken by a passenger<small>CountPassengerTrips</small></h3><p class="hint">Non-cancelled bookings for a passenger.</p>${sel('fp', p)}<p><button class="btn pri" data-act="fnPas">Count</button> <b id="fpr"></b></p></div>
  <div class="card"><h3>Seats available on a trip<small>GetAvailableSeats</small></h3><p class="hint">Capacity minus confirmed bookings.</p>${sel('ft', t)}<p><button class="btn pri" data-act="fnSeat">Check</button> <b id="ftr"></b></p></div></div>`;
  const call = async (path, el, fmt) => { try { el.textContent = fmt((await api(path)).total); } catch (e) { toast(e.message, 'bad'); } };
  H.fnRev = () => call(`/functions/revenue?start=${$('#fs').value}&end=${$('#fe').value}`, $('#fr'), money);
  H.fnPas = () => call(`/functions/passenger-trips/${$('#fp').value}`, $('#fpr'), n => n + ' trips');
  H.fnSeat = () => call(`/functions/available-seats/${$('#ft').value}`, $('#ftr'), n => n + ' seats free');
}

// ---------- MongoDB: reviews & ratings ----------
const reviewCols = [col('createdAt', 'Date', fdate), col('routeName', 'Route'), col('vehicleReg', 'Vehicle'), col('driverName', 'Driver'), col('rating', 'Rating', stars), col('comment', 'Comment')];
const rankCols = [col('name', 'Name'), col('averageRating', 'Average', stars), col('reviewCount', 'Reviews')];
pages.reviews = async () => {
  const [routes, tv, td, st] = await Promise.all([api('/routes'), api('/mongo/top-vehicles'), api('/mongo/top-drivers'), api('/mongo/stats')]);
  view.innerHTML = `<div class="card"><h3>Keyword search <small>MongoDB text index on comment + keywords</small></h3>
    <div class="bar"><input id="kw" placeholder="e.g. clean, late, comfortable" style="max-width:340px"><button class="btn pri" data-act="kwGo">Search</button></div>
    <div class="chips">${st.keywords.map(k => `<button class="chip" data-act="kw" data-id="${esc(k.keyword)}">${esc(k.keyword)} · ${k.occurrences}</button>`).join('')}</div><div id="kwOut"></div></div>
  <div class="card"><h3>Reviews by route</h3><div class="bar"><select id="rsel" class="inline"><option value="">All routes</option>${routes.map(r => `<option value="${r.routeid}">${esc(r.startlocation)} to ${esc(r.endlocation)}</option>`).join('')}</select></div><div id="rOut"></div></div>
  <div class="grid g2"><div class="card"><h3>Highest-rated vehicles</h3>${table(rankCols, tv)}</div><div class="card"><h3>Highest-rated drivers</h3>${table(rankCols, td)}</div></div>
  <div class="card"><h3>Average rating by route</h3>${table([col('route', 'Route'), col('averageRating', 'Average', stars), col('totalReviews', 'Reviews')], st.byRoute)}</div>`;
  const loadR = async () => { $('#rOut').innerHTML = table(reviewCols, await api('/mongo/reviews' + ($('#rsel').value ? '?routeId=' + $('#rsel').value : ''))); };
  $('#rsel').onchange = () => loadR().catch(e => toast(e.message, 'bad')); loadR();
  const search = async q => { $('#kw').value = q; $('#kwOut').innerHTML = q ? table([col('createdAt', 'Date', fdate), col('routeId', 'Route'), col('rating', 'Rating', stars), col('comment', 'Comment'), col('score', 'Match', v => v ? v.toFixed(2) : '—')], await api('/mongo/search?q=' + encodeURIComponent(q))) : ''; };
  H.kwGo = () => search($('#kw').value.trim()).catch(e => toast(e.message, 'bad'));
  H.kw = i => search(i).catch(e => toast(e.message, 'bad'));
  $('#kw').onkeydown = e => { if (e.key === 'Enter') H.kwGo(); };
};

// ---------- MongoDB: documents & media ----------
pages.documents = async () => {
  const [docs, media, trips] = await Promise.all([api('/mongo/vehicle-documents'), api('/mongo/trip-media'), api('/trips')]);
  const exp = d => { if (!d) return '—'; const s = fdate(d); return s + (s < today() ? ' <span class="badge b-bad">Expired</span>' : s < addDays(60) ? ' <span class="badge b-warn">Expiring</span>' : ''); };
  view.innerHTML = `<div class="bar"><h3 style="margin:0">Vehicle documents &amp; images</h3><span class="sp"></span><button class="btn" data-act="addImg">Add image</button><button class="btn pri" data-act="addDoc">Add document</button></div>
  ${docs.map(v => `<div class="doc"><h4>${esc(v.registrationNo)} <small style="color:var(--mut)">vehicle #${v.vehicleId} · updated ${fdate(v.updatedAt)}</small></h4>
    <div class="chips" style="margin-bottom:10px">${(v.images || []).map(i => `<button class="chip x" data-act="rmImg" data-id="${v.vehicleId}" data-name="${esc(i)}" title="Remove image">${esc(i)}</button>`).join('') || '<span class="hint">No images</span>'}</div>
    ${table([col('documentType', 'Document'), col('fileName', 'File', (f, r) => r.fileUrl ? `<a href="${esc(r.fileUrl)}" target="_blank" rel="noopener">${esc(f)}</a>` : esc(f)), col('expiryDate', 'Expires', exp)], v.documents || [],
      r => btn('rmDoc', v.vehicleId, 'Remove', 'del', `data-name="${esc(r.fileName)}"`))}</div>`).join('') || '<div class="empty">No vehicle documents yet</div>'}
  <div class="bar" style="margin-top:24px"><h3 style="margin:0">Trip multimedia</h3><span class="sp"></span><button class="btn pri" data-act="addMedia">Add media</button></div>
  <div class="card">${table([col('tripId', 'Trip'), col('mediaType', 'Type', v => `<span class="badge b-info">${esc(v)}</span>`), col('url', 'File'), col('caption', 'Caption'), col('uploadedAt', 'Uploaded', fdate)], media, r => btn('rmMedia', r._id, 'Delete', 'del'))}</div>`;
  const vOpts = () => opts('/vehicles', 'vehicleid', x => `${x.registrationno} (${x.vehicletype})`);
  H.addDoc = async () => form('Add vehicle document', [{ name: 'vehicleId', label: 'Vehicle', type: 'select', options: await vOpts(), full: true }, { name: 'documentType', label: 'Document type', ph: 'Insurance, Revenue License …' },
    { name: 'fileName', label: 'File name' }, { name: 'fileUrl', label: 'File URL', type: 'url', full: true, required: false }, { name: 'expiryDate', label: 'Expiry date', type: 'date', required: false }], {},
  d => api(`/mongo/vehicle-documents/${d.vehicleId}/documents`, 'POST', d).then(() => { toast('Document added', 'ok'); render(); }));
  H.addImg = async () => form('Add vehicle image', [{ name: 'vehicleId', label: 'Vehicle', type: 'select', options: await vOpts(), full: true }, { name: 'image', label: 'Image file name / URL', full: true }], {},
    d => api(`/mongo/vehicle-documents/${d.vehicleId}/images`, 'POST', d).then(() => { toast('Image added', 'ok'); render(); }));
  H.rmImg = (id, el) => run(() => api(`/mongo/vehicle-documents/${id}/images/${encodeURIComponent(el.dataset.name)}`, 'DELETE'), 'Image removed');
  H.rmDoc = (id, el) => run(() => api(`/mongo/vehicle-documents/${id}/documents/${encodeURIComponent(el.dataset.name)}`, 'DELETE'), 'Document removed', 'Remove this document?');
  H.addMedia = () => form('Add trip media', [{ name: 'tripId', label: 'Trip', type: 'select', full: true, options: trips.map(t => ({ v: t.tripid, l: `#${t.tripid} ${t.routename} · ${fdate(t.tripdate)}` })) },
    { name: 'mediaType', label: 'Type', type: 'select', options: ['image', 'video', 'document'] }, { name: 'url', label: 'File name / URL' }, { name: 'caption', label: 'Caption', required: false, full: true }], {},
  d => api('/mongo/trip-media', 'POST', d).then(() => { toast('Media added', 'ok'); render(); }));
  H.rmMedia = i => run(() => api(`/mongo/trip-media/${i}`, 'DELETE'), 'Media deleted', 'Delete this media item?');
};

// ---------- MongoDB: announcements ----------
pages.announcements = async () => {
  const [rows, routes] = await Promise.all([api('/mongo/announcements'), api('/routes')]), byId = Object.fromEntries(rows.map(r => [r._id, r]));
  view.innerHTML = `<div class="bar"><p class="hint" style="margin:0">Travel announcements &amp; notifications stored in MongoDB <b>announcements</b>.</p><span class="sp"></span><button class="btn pri" data-act="add">New announcement</button></div>
  ${rows.map(a => `<div class="ann ${a.active ? '' : 'off'}"><div style="float:right">${btn('toggle', a._id, a.active ? 'Deactivate' : 'Activate')} ${btn('del', a._id, 'Delete', 'del')}</div>
    <b>${esc(a.title)} <span class="badge b-info">${esc(a.type)}</span> ${a.active ? '' : '<span class="badge">inactive</span>'}</b>${esc(a.message)}<small> · ${fdt(a.publishedAt).slice(0, 16)}${a.routeId ? ' · route #' + a.routeId : ''}</small></div>`).join('') || '<div class="empty">No announcements</div>'}`;
  H.add = () => form('New announcement', [{ name: 'title', label: 'Title', full: true }, { name: 'message', label: 'Message', type: 'textarea' },
    { name: 'type', label: 'Type', type: 'select', options: ['Service Update', 'Schedule', 'Maintenance', 'General'] },
    { name: 'routeId', label: 'Route (optional)', type: 'select', required: false, placeholder: 'All routes', options: routes.map(r => ({ v: r.routeid, l: `${r.startlocation} to ${r.endlocation}` })) }], {},
  d => api('/mongo/announcements', 'POST', d).then(() => { toast('Announcement published', 'ok'); render(); }));
  H.toggle = i => run(() => api(`/mongo/announcements/${i}`, 'PATCH', { active: !byId[i].active }));
  H.del = i => run(() => api(`/mongo/announcements/${i}`, 'DELETE'), 'Deleted', 'Delete this announcement?');
};

// ---------- router, status, shell ----------
const TITLES = { dashboard: 'Dashboard', vehicles: 'Vehicles', drivers: 'Drivers', routes: 'Routes', passengers: 'Passengers', trips: 'Trips', bookings: 'Bookings', payments: 'Payments',
  feedback: 'Feedback', maintenance: 'Maintenance', reports: 'Reports', reviews: 'Reviews & ratings', documents: 'Documents & media', announcements: 'Announcements' };
const SUBS = { dashboard: 'A live overview of your fleet, bookings and revenue.', vehicles: 'Manage the buses and vans in your fleet.', drivers: 'Manage driver records and availability.',
  routes: 'Define the routes your vehicles operate.', passengers: 'Register passengers and view their travel history.', trips: 'Schedule trips and track their status.',
  bookings: 'Reserve seats and manage ticket bookings.', payments: 'Record and review payments for bookings.', feedback: 'Capture passenger ratings and comments.',
  maintenance: 'Plan service work and see which vehicles are due.', reports: 'Business reports and quick calculators.', reviews: 'See what passengers say about routes, vehicles and drivers.',
  documents: 'Vehicle paperwork, photos and trip multimedia.', announcements: 'Publish service notices for passengers.' };
let pending = null;
async function render(full) {
  const name = pages[(location.hash || '#dashboard').slice(1)] ? (location.hash || '#dashboard').slice(1) : 'dashboard';
  H = {}; $('#pageTitle').textContent = TITLES[name]; $('#pageSub').textContent = SUBS[name]; document.title = TITLES[name] + ' | SmartMove';
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + name));
  $('#sidebar').classList.remove('open'); view.classList.remove('enter');
  if (full) { view.innerHTML = skeleton(); window.scrollTo({ top: 0 }); }
  try { await pages[name](); } catch (e) { view.innerHTML = errBox(e); H.retry = () => render(true); }
  if (full) { void view.offsetWidth; view.classList.add('enter'); countUp(); }
  if (pending && H[pending]) { const p = pending; pending = null; H[p](); } else pending = null;
}
const go = (hash, action) => { pending = action || null; if (location.hash === hash) render(true); else location.hash = hash; };
document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && H[b.dataset.act]) { try { const r = H[b.dataset.act](b.dataset.id, b); if (r && r.catch) r.catch(x => toast(x.message, 'bad')); } catch (x) { toast(x.message, 'bad'); } } });
$('#menuBtn').onclick = () => $('#sidebar').classList.toggle('open');
window.addEventListener('hashchange', () => render(true));
$('#scrim').onclick = () => $('#sidebar').classList.remove('open');
document.addEventListener('keydown', e => { if (e.key === 'Escape') { const m = [...document.querySelectorAll('.modal-bg')].pop(); if (m) m.remove(); } });
async function ping() {
  const set = (el, on) => { el.className = 'pill ' + (on ? 'on' : 'off'); el.lastElementChild.textContent = el.dataset.n + (on ? ' connected' : ' offline'); };
  try { const h = await api('/health'); set($('#stOracle'), h.oracle); set($('#stMongo'), h.mongo); } catch { set($('#stOracle'), false); set($('#stMongo'), false); }
}
ping(); setInterval(ping, 20000); render(true);
