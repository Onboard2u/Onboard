/* Onboard — shared data store and helpers for the parent/driver app and the operator portal.
   Demo only: all data lives in this browser's localStorage. Open the app and the portal in
   two tabs and changes made in one appear in the other straight away. */

const STORE_KEY = 'onboard_v2';
const COLORS = ['#ff8110', '#c25400', '#e0a100', '#d9622b', '#8a5a3c', '#1f9d63', '#b8452f'];

/* ---------- small helpers ---------- */
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => new Date(Date.now() + 864e5).toISOString().slice(0, 10);
const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = n => String(n || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const av = (name, size) => `<div class="av" style="background:${COLORS[(String(name).charCodeAt(0) || 0) % COLORS.length]}${size ? `;width:${size}px;height:${size}px;font-size:${size / 2.6}px` : ''}">${initials(name)}</div>`;
const fv = id => (document.getElementById(id)?.value || '').trim();
const by = (list, id) => list.find(x => x.id === id);

function toast(msg) {
  let box = document.getElementById('toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'toasts'; document.body.appendChild(box); }
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg; box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => el.remove(), 3200);
}
function modal(html) {
  let root = document.getElementById('modalRoot');
  if (!root) { root = document.createElement('div'); root.id = 'modalRoot'; document.body.appendChild(root); }
  root.innerHTML = `<div class="ov" onclick="if(event.target===this)closeModal()"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  const first = root.querySelector('input,select,textarea'); if (first) setTimeout(() => first.focus(), 30);
}
function closeModal() { const r = document.getElementById('modalRoot'); if (r) r.innerHTML = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
function need(ids) {
  let ok = true;
  ids.forEach(id => { const el = document.getElementById(id); if (!el.value.trim()) { el.style.borderColor = 'var(--bad)'; ok = false; } else el.style.borderColor = ''; });
  if (!ok) toast('Please fill in the required fields');
  return ok;
}

/* ---------- seed data ---------- */
function SEED() {
  return {
    version: 3,
    operators: [
      { id: 'op1', name: 'Ahmad Transport Services', owner: 'Ahmad Rahim', email: 'ahmad@demo.my', phone: '012-345 6789', area: 'Petaling Jaya', schools: ['SK Taman Megah', 'SJK(C) Yuk Chai'], status: 'approved' }
    ],
    buses: [
      { id: 'b1', op: 'op1', plate: 'WXY 2231', model: 'Toyota Hiace', seats: 14 },
      { id: 'b2', op: 'op1', plate: 'BKL 8890', model: 'Isuzu NLR bus', seats: 26 }
    ],
    drivers: [
      { id: 'd1', op: 'op1', name: 'Faizal Hassan', email: 'driver@demo.my', phone: '012-778 9012', bus: 'b1', status: 'active' },
      { id: 'd2', op: 'op1', name: 'Kumar Selvam', email: 'kumar@demo.my', phone: '017-221 3344', bus: 'b2', status: 'active' }
    ],
    routes: [
      { id: 'r1', op: 'op1', name: 'SK Taman Megah · Morning', session: 'AM', school: 'SK Taman Megah', bus: 'b1', driver: 'd1',
        stops: [{ name: 'Jalan SS2/24', time: '06:45' }, { name: 'Jalan SS2/72', time: '06:52' }, { name: 'Taman Paramount', time: '07:00' }, { name: 'SK Taman Megah', time: '07:20', school: true }] },
      { id: 'r2', op: 'op1', name: 'SK Taman Megah · Afternoon', session: 'PM', school: 'SK Taman Megah', bus: 'b1', driver: 'd1',
        stops: [{ name: 'SK Taman Megah', time: '13:15', school: true }, { name: 'Taman Paramount', time: '13:35' }, { name: 'Jalan SS2/72', time: '13:43' }, { name: 'Jalan SS2/24', time: '13:50' }] },
      { id: 'r3', op: 'op1', name: 'SJK(C) Yuk Chai · Morning', session: 'AM', school: 'SJK(C) Yuk Chai', bus: 'b2', driver: 'd2',
        stops: [{ name: 'SS3 Park', time: '06:50' }, { name: 'Kelana Jaya LRT', time: '07:02' }, { name: 'SJK(C) Yuk Chai', time: '07:25', school: true }] }
    ],
    parents: [
      { id: 'p1', name: 'Nurul Aisyah', email: 'parent@demo.my', gender: 'Mom', phone: '+60 19-555 1212' },
      { id: 'p2', name: 'Jason Lee', email: 'jason@demo.my', gender: 'Dad', phone: '+60 12-880 4411' },
      { id: 'p3', name: 'Farah Hanim', email: 'farah@demo.my', gender: 'Mom', phone: '+60 11-2345 6789' },
      { id: 'p4', name: 'Priya Kumar', email: 'priya@demo.my', gender: 'Mom', phone: '+60 16-909 1020' }
    ],
    children: [
      { id: 'c1', parent: 'p1', name: 'Adam Haziq', school: 'SK Taman Megah', grade: 'Year 3', stop: 'Jalan SS2/24', op: 'op1', routes: ['r1', 'r2'] },
      { id: 'c2', parent: 'p1', name: 'Sofea Irdina', school: 'SK Taman Megah', grade: 'Year 1', stop: 'Jalan SS2/24', op: 'op1', routes: ['r1', 'r2'] },
      { id: 'c3', parent: 'p3', name: 'Hana Sofia', school: 'SK Taman Megah', grade: 'Year 4', stop: 'Jalan SS2/72', op: 'op1', routes: ['r1', 'r2'] },
      { id: 'c4', parent: 'p4', name: 'Arjun Kumar', school: 'SK Taman Megah', grade: 'Year 2', stop: 'Taman Paramount', op: 'op1', routes: ['r1', 'r2'] },
      { id: 'c5', parent: 'p2', name: 'Daniel Lee', school: 'SJK(C) Yuk Chai', grade: 'Year 5', stop: 'SS3 Park', op: 'op1', routes: ['r3'] }
    ],
    absences: [],
    trips: {},
    incidents: [],
    notes: [
      { id: uid(), to: 'p1', text: 'Welcome to Onboard! Follow every trip and tell the driver when your child is not riding.', time: '08:00', date: today(), read: true },
      { id: uid(), to: 'op1', text: 'Welcome to Onboard! Your routes, drivers and students are set up.', time: '07:00', date: today(), read: false }
    ]
  };
}

/* ---------- store ---------- */
let S;
function load() {
  try { const raw = localStorage.getItem(STORE_KEY); S = raw ? JSON.parse(raw) : SEED(); } catch (e) { S = S || SEED(); }
  if (!S || S.version !== 3) S = SEED();
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { } }
function resetDemo() { S = SEED(); save(); }
load();

/* the signed-in user is kept per browser tab, so a parent and a driver can be open side by side */
const SESSION_KEY = 'onboard_session_' + (document.documentElement.dataset.app || 'app');
let USER = null;
try { USER = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { }
function setUser(u) { USER = u; try { u ? sessionStorage.setItem(SESSION_KEY, JSON.stringify(u)) : sessionStorage.removeItem(SESSION_KEY); } catch (e) { } }

/* live sync between tabs */
window.addEventListener('storage', e => { if (e.key === STORE_KEY) { load(); if (window.onSync) window.onSync(); } });

/* ---------- domain helpers ---------- */
function notify(to, text) { S.notes.unshift({ id: uid(), to, text, time: nowTime(), date: today(), read: false }); }
const notesFor = id => S.notes.filter(n => n.to === id);
const unreadFor = id => S.notes.filter(n => n.to === id && !n.read).length;
function markRead(id) { S.notes.forEach(n => { if (n.to === id) n.read = true; }); save(); }

const isAbsent = (childId, date, session) => S.absences.some(a => a.child === childId && a.date === date && (a.session === 'ALL' || a.session === session));
const routeKids = r => S.children.filter(c => c.routes.includes(r.id));

/* today's trip for a route (a fresh idle one if it has not run yet today) */
function tripFor(routeId) {
  const t = S.trips[routeId];
  if (t && t.date === today()) return t;
  return { date: today(), status: 'idle', stop: 0, kids: {}, log: [] };
}
function kidStatus(trip, childId) { return trip.kids[childId] || 'waiting'; }

/* which children the driver acts on at a stop, and what the action is */
function stopKids(route, trip, idx) {
  const st = route.stops[idx], kids = routeKids(route);
  if (st.school) return route.session === 'AM'
    ? kids.filter(k => ['boarded', 'dropped'].includes(kidStatus(trip, k.id)))
    : kids;
  return kids.filter(k => k.stop === st.name);
}
function stopAction(route, idx) {
  const st = route.stops[idx];
  if (route.session === 'AM') return st.school ? 'drop' : 'pick';
  return st.school ? 'pick' : 'drop';
}

const ST_BADGE = {
  waiting: '<span class="badge b-n">Waiting</span>',
  boarded: '<span class="badge b-y">On bus</span>',
  dropped: '<span class="badge b-ok">Dropped off</span>',
  absent: '<span class="badge b-bad">Absent</span>'
};
const kidBadge = (route, trip, k) => {
  const s = kidStatus(trip, k.id);
  if (s === 'dropped') return `<span class="badge b-ok">${route.session === 'AM' ? 'At school' : 'Home'}</span>`;
  return ST_BADGE[s];
};
