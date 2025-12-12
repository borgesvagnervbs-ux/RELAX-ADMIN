
// admin.js (COMBINED) - Arquivo gerado automaticamente a partir das partes
// Partes: 1..5 combinadas (estrutura base, vars, helpers, calendar, UI, Firebase, backup, events)

// ====================
// PARTE 1 - Estrutura Base / ELEMENTOS DO DOM
// ====================
const tabDashboard = document.getElementById('tab-dashboard');
const tabTypes = document.getElementById('tab-types');
const tabClients = document.getElementById('tab-clients');
const tabAppointments = document.getElementById('tab-appointments');
const tabFinance = document.getElementById('tab-finance');
const tabSchedule = document.getElementById('tab-schedule');
const tabBackup = document.getElementById('tab-backup');

// ====================
// PARTE 2 - Variáveis, Configs e Helpers
// ====================
let allTypes = [];
let allAppointments = [];
let allClients = {};
let currentMonth = new Date();
let selectedDate = null;
let scheduleConfig = null;
let currentDayAvailability = {};
let currentAdminUser = null;

const calendarClient = document.getElementById('calendarClient');
const weekContainer = document.getElementById('weekContainer');
const weekArea = document.getElementById('weekArea');
const viewMode = document.getElementById('viewMode');
const btnToday = document.getElementById('btnToday');
const dayDetail = document.getElementById('dayDetail');
const selectedDayTitle = document.getElementById('selectedDayTitle');
const selectedDaySub = document.getElementById('selectedDaySub');
const hourlyList = document.getElementById('hourlyList');

const appointmentCalendar = document.getElementById('appointmentCalendar');
const appointmentTimeSlots = document.getElementById('appointmentTimeSlots');
const appointmentTimeSlotsSection = document.getElementById('appointmentTimeSlotsSection');

const backupStatus = document.getElementById('backupStatus');

const DEFAULT_SCHEDULE_CONFIG = {
  sessionDuration: 60,
  enabledDays: [1,2,3,4,5],
  schedules: {
    0: { enabled: false, start: '08:00', end: '18:00', intervals: [] },
    1: { enabled: true, start: '08:00', end: '18:00', intervals: [] },
    2: { enabled: true, start: '08:00', end: '18:00', intervals: [] },
    3: { enabled: true, start: '08:00', end: '18:00', intervals: [] },
    4: { enabled: true, start: '08:00', end: '18:00', intervals: [] },
    5: { enabled: true, start: '08:00', end: '18:00', intervals: [] },
    6: { enabled: false, start: '08:00', end: '18:00', intervals: [] }
  }
};

function formatMoney(value) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  } catch (e) { return 'R$ 0,00'; }
}

function toDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth()+1).padStart(2,'0');
  const day = String(date.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
}

function uid(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

function pad2(n) { return String(n).padStart(2,'0'); }

function getDayName(dayIndex) {
  const days = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  return days[dayIndex] || '';
}

function maskCpf(cpf) {
  if (!cpf) return '';
  cpf = cpf.replace(/\D/g,'');
  cpf = cpf.replace(/(\d{3})(\d)/,'$1.$2');
  cpf = cpf.replace(/(\d{3})(\d)/,'$1.$2');
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/,'$1-$2');
  return cpf;
}

function maskPhone(phone) {
  if (!phone) return '';
  phone = phone.replace(/\D/g,'');
  if (phone.length <= 10) {
    phone = phone.replace(/(\d{2})(\d)/,'($1) $2');
    phone = phone.replace(/(\d{4})(\d)/,'$1-$2');
  } else {
    phone = phone.replace(/(\d{2})(\d)/,'($1) $2');
    phone = phone.replace(/(\d{5})(\d)/,'$1-$2');
  }
  return phone;
}

function generateTimeSlotsForDay(date) {
  if (!scheduleConfig) return [];
  const dayOfWeek = date.getDay();
  const daySchedule = scheduleConfig.schedules[dayOfWeek];
  if (!daySchedule || !daySchedule.enabled) return [];

  const slots = [];
  const sessionDuration = Number(scheduleConfig.sessionDuration) || 60;

  const [startHour, startMin] = (daySchedule.start || '08:00').split(':').map(Number);
  const [endHour, endMin] = (daySchedule.end || '18:00').split(':').map(Number);

  let currentMinutes = startHour*60 + startMin;
  const endMinutes = endHour*60 + endMin;

  while (currentMinutes + sessionDuration <= endMinutes) {
    const hour = Math.floor(currentMinutes/60);
    const minute = currentMinutes % 60;

    const isInInterval = (daySchedule.intervals || []).some(interval => {
      if (!interval || !interval.start || !interval.end) return false;
      const [iSHour,iSMin] = interval.start.split(':').map(Number);
      const [iEHour,iEMin] = interval.end.split(':').map(Number);
      const iStart = iSHour*60 + iSMin;
      const iEnd = iEHour*60 + iEMin;
      return currentMinutes >= iStart && currentMinutes < iEnd;
    });

    if (!isInInterval) {
      slots.push({ hour, minute, time: `${pad2(hour)}:${pad2(minute)}` });
    }

    currentMinutes += sessionDuration;
  }

  return slots;
}

function renderCalendar() {
  if (!calendarClient) return;
  calendarClient.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'calendar-header';
  const monthTitle = document.createElement('div');
  monthTitle.textContent = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  header.appendChild(monthTitle);
  calendarClient.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'calendar-grid';

  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1, 0);
  const startBlank = firstDay.getDay();
  for (let i=0;i<startBlank;i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-day empty';
    grid.appendChild(empty);
  }

  for (let d=1; d<= lastDay.getDate(); d++) {
    const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    cell.textContent = d;
    cell.onclick = () => selectDate(dayDate);
    grid.appendChild(cell);
  }

  calendarClient.appendChild(grid);
}

function renderWeek() {
  if (!weekContainer) return;
  weekContainer.innerHTML = '';
  const base = selectedDate ? new Date(selectedDate) : new Date();
  base.setHours(0,0,0,0);
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());

  for (let i=0;i<7;i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const div = document.createElement('div');
    div.className = 'week-day';
    div.textContent = `${getDayName(d.getDay())} ${pad2(d.getDate())}`;
    div.onclick = () => selectDate(d);
    weekContainer.appendChild(div);
  }
}

if (btnToday) btnToday.addEventListener('click', () => {
  selectedDate = new Date(); selectedDate.setHours(0,0,0,0);
  renderCalendar(); renderWeek(); updateDayDetail();
});

if (viewMode) viewMode.addEventListener('change', () => {
  if (viewMode.value === 'week') { weekArea.classList.remove('hidden'); renderWeek(); }
  else { weekArea.classList.add('hidden'); renderCalendar(); }
});

function initScheduleDefaults() {
  scheduleConfig = scheduleConfig || { ...DEFAULT_SCHEDULE_CONFIG };
}
initScheduleDefaults();

// ====================
// PARTE 3 - Seleção de datas e updateDayDetail (única função)
// ====================
function selectDate(date) {
  selectedDate = new Date(date);
  selectedDate.setHours(0,0,0,0);
  if (viewMode && viewMode.value === 'week') { renderWeek(); } else { renderCalendar(); }
  updateDayDetail();
}

function selectDateForAppointment(date) {
  // helper if needed for appointment calendar
  appointmentSelectedDate = new Date(date);
  appointmentSelectedDate.setHours(0,0,0,0);
  // trigger loading appointment UI if present
}

async function updateDayDetail() {
  if (!selectedDate) { dayDetail.classList.add('hidden'); return; }
  dayDetail.classList.remove('hidden');
  selectedDayTitle.textContent = selectedDate.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
  selectedDaySub.textContent = '';
  hourlyList.innerHTML = '';

  const slots = generateTimeSlotsForDay(selectedDate);

  if (!slots || slots.length === 0) {
    hourlyList.innerHTML = `
      <div class="no-slots-alert">
        <div class="no-slots-icon"><i class="fas fa-calendar-times"></i></div>
        <div class="no-slots-content">
          <h4>Dia não disponível</h4>
          <p>Este dia não está configurado para atendimento. Selecione outro dia ou configure os horários na aba "Horários de Atendimento".</p>
        </div>
      </div>`;
    return;
  }

  const dateStr = toDateStr(selectedDate);
  if (typeof getDayAvailability === 'function') {
    try { currentDayAvailability = await getDayAvailability(dateStr); } catch(e) { console.error(e); currentDayAvailability = {}; }
  } else currentDayAvailability = {};

  const dayAppointments = allAppointments.filter(a => {
    const d = new Date(a.start); d.setHours(0,0,0,0); return d.getTime() === selectedDate.getTime();
  });

  const now = new Date(); now.setHours(0,0,0,0);
  const isPastDate = selectedDate < now;
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const toggleAllRow = document.createElement('div');
  toggleAllRow.className = 'toggle-all-row';
  toggleAllRow.style.marginBottom = '12px';

  const toggleLabel = document.createElement('label');
  toggleLabel.style.display = 'flex';
  toggleLabel.style.alignItems = 'center';
  toggleLabel.style.gap = '8px';

  const toggleCheckbox = document.createElement('input');
  toggleCheckbox.type = 'checkbox';
  toggleCheckbox.id = 'toggleAll';

  const availableSlots = slots.filter(slot => {
    const slotDate = new Date(selectedDate); slotDate.setHours(slot.hour, slot.minute, 0, 0);
    const hasAppointment = dayAppointments.some(a => { const d = new Date(a.start); return d.getHours() === slot.hour && d.getMinutes() === slot.minute; });
    const isPast = isPastDate || (isToday && (slot.hour < new Date().getHours()));
    return !hasAppointment && !isPast;
  });

  const allEnabled = availableSlots.every(slot => { const key = `${slot.hour}:${slot.minute}`; return currentDayAvailability[key] !== false; });
  toggleCheckbox.checked = allEnabled;
  if (isPastDate) toggleCheckbox.disabled = true;

  toggleCheckbox.addEventListener('change', async () => {
    const enable = toggleCheckbox.checked;
    for (const slot of availableSlots) {
      const key = `${slot.hour}:${slot.minute}`;
      if (typeof setDayAvailability === 'function') {
        try { await setDayAvailability(dateStr, key, enable); } catch(e){ console.error(e); }
      }
    }
    if (typeof getDayAvailability === 'function') currentDayAvailability = await getDayAvailability(dateStr);
    updateDayDetail();
  });

  toggleLabel.appendChild(toggleCheckbox);
  toggleLabel.appendChild(document.createTextNode('Habilitar horários disponíveis'));
  toggleAllRow.appendChild(toggleLabel);
  hourlyList.appendChild(toggleAllRow);

  slots.forEach(slot => {
    const slotRow = document.createElement('div');
    slotRow.className = 'slot-row';
    const timeDiv = document.createElement('div'); timeDiv.className = 'slot-time'; timeDiv.textContent = slot.time;
    const controlsDiv = document.createElement('div'); controlsDiv.className = 'slot-controls';
    const key = `${slot.hour}:${slot.minute}`;
    const isDisabled = currentDayAvailability[key] === false;
    const booked = dayAppointments.some(a => { const d = new Date(a.start); return d.getHours() === slot.hour && d.getMinutes() === slot.minute; });

    if (booked) {
      const bookedEl = document.createElement('span'); bookedEl.className = 'status-badge status-booked'; bookedEl.textContent = 'Reservado';
      controlsDiv.appendChild(bookedEl);
    } else {
      const toggle = document.createElement('input'); toggle.type = 'checkbox'; toggle.checked = !isDisabled; if (isPastDate) toggle.disabled = true;
      toggle.addEventListener('change', async () => {
        const enable = toggle.checked;
        if (typeof setDayAvailability === 'function') {
          try { await setDayAvailability(dateStr, key, enable); } catch(e){ console.error(e); }
        }
        if (typeof getDayAvailability === 'function') currentDayAvailability = await getDayAvailability(dateStr);
        updateDayDetail();
      });
      controlsDiv.appendChild(toggle);
    }

    slotRow.appendChild(timeDiv); slotRow.appendChild(controlsDiv); hourlyList.appendChild(slotRow);
  });
}

// ====================
// PARTE 4 - Firebase interactions, load/save, backup
// ====================
const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;

let typesCollection = null;
let clientsCollection = null;
let appointmentsCollection = null;
let scheduleConfigDoc = null;
let availabilityCollection = null;

if (db) {
  typesCollection = db.collection('types');
  clientsCollection = db.collection('clients');
  appointmentsCollection = db.collection('appointments');
  scheduleConfigDoc = db.collection('config').doc('schedule');
  availabilityCollection = db.collection('availability');
}

async function loadTypes() {
  if (!typesCollection) return;
  const snap = await typesCollection.get();
  allTypes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (typeof renderTypes === 'function') renderTypes();
}

async function loadClients() {
  if (!clientsCollection) return;
  const snap = await clientsCollection.get();
  allClients = {};
  snap.docs.forEach(doc => { allClients[doc.id] = { id: doc.id, ...doc.data() }; });
  if (typeof renderClients === 'function') renderClients();
}

async function loadAppointments() {
  if (!appointmentsCollection) return;
  const snap = await appointmentsCollection.get();
  allAppointments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  if (typeof renderAppointments === 'function') renderAppointments();
  updateDayDetail();
}

async function loadScheduleConfig() {
  if (!scheduleConfigDoc) { scheduleConfig = DEFAULT_SCHEDULE_CONFIG; return; }
  const docSnap = await scheduleConfigDoc.get();
  if (docSnap.exists) scheduleConfig = docSnap.data(); else scheduleConfig = DEFAULT_SCHEDULE_CONFIG;
  if (typeof renderScheduleConfig === 'function') renderScheduleConfig();
}

async function saveScheduleConfig(newConfig) {
  scheduleConfig = newConfig;
  if (scheduleConfigDoc) await scheduleConfigDoc.set(newConfig);
}

async function getDayAvailability(dateStr) {
  if (!availabilityCollection) return {};
  const docRef = availabilityCollection.doc(dateStr);
  const snap = await docRef.get();
  return snap.exists ? snap.data() : {};
}

async function setDayAvailability(dateStr, key, value) {
  if (!availabilityCollection) return;
  const docRef = availabilityCollection.doc(dateStr);
  await docRef.set({ [key]: value }, { merge: true });
}

async function saveClient(id, data) {
  if (!clientsCollection) return;
  if (id) await clientsCollection.doc(id).set(data, { merge: true }); else await clientsCollection.add(data);
  await loadClients();
}

async function saveAppointment(id, data) {
  if (!appointmentsCollection) return;
  if (id) await appointmentsCollection.doc(id).set(data, { merge: true }); else await appointmentsCollection.add(data);
  await loadAppointments();
}

async function deleteAppointment(id) {
  if (!appointmentsCollection) return;
  await appointmentsCollection.doc(id).delete();
  await loadAppointments();
}

async function generateBackup() {
  const backup = {};
  if (!db) return JSON.stringify(backup, null, 2);

  const typesSnap = await typesCollection.get();
  backup.types = typesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const clientsSnap = await clientsCollection.get();
  backup.clients = clientsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const apptsSnap = await appointmentsCollection.get();
  backup.appointments = apptsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const configSnap = await scheduleConfigDoc.get();
  backup.scheduleConfig = configSnap.exists ? configSnap.data() : DEFAULT_SCHEDULE_CONFIG;

  const availSnap = await availabilityCollection.get();
  backup.availability = availSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return JSON.stringify(backup, null, 2);
}

async function restoreBackup(backup) {
  if (!db || !backup) return;
  if (backup.types) {
    for (const t of backup.types) { await typesCollection.doc(t.id).set(t); }
  }
  if (backup.clients) {
    for (const c of backup.clients) { await clientsCollection.doc(c.id).set(c); }
  }
  if (backup.appointments) {
    for (const a of backup.appointments) { await appointmentsCollection.doc(a.id).set(a); }
  }
  if (backup.scheduleConfig) {
    await scheduleConfigDoc.set(backup.scheduleConfig);
  }
  if (backup.availability) {
    for (const av of backup.availability) { await availabilityCollection.doc(av.id).set(av); }
  }
  await loadTypes(); await loadClients(); await loadAppointments(); await loadScheduleConfig();
}

// ====================
// PARTE 5 - UI: tipos, clientes, agendamentos, financeiro, eventos
// ====================
const typeName = document.getElementById('typeName');
const typePrice = document.getElementById('typePrice');
const typesList = document.getElementById('typesList');
const btnAddType = document.getElementById('btnAddType');
const btnReloadTypes = document.getElementById('btnReloadTypes');

const clientsList = document.getElementById('clientsList');
const clientSearchInput = document.getElementById('clientSearchInput');

const appointmentsList = document.getElementById('appointmentsList');

const financeTicketMedio = document.getElementById('financeTicketMedio');
const financeQuantidade = document.getElementById('financeQuantidade');
const financeTotal = document.getElementById('financeTotal');
const massageRanking = document.getElementById('massageRanking');
const clientRanking = document.getElementById('clientRanking');

function renderTypes() {
  if (!typesList) return;
  typesList.innerHTML = '';
  if (!allTypes || allTypes.length === 0) { typesList.innerHTML = '<div class=\"small\">Nenhum tipo cadastrado</div>'; return; }

  allTypes.forEach(t => {
    const row = document.createElement('div');
    row.className = 'type-row';
    row.innerHTML = `
      <div class="type-info">
        <div class="type-name">${t.name}</div>
        <div class="type-price">${formatMoney(t.price)}</div>
      </div>
      <div class="type-actions">
        <button class="btn btn-ghost btn-sm" onclick="editType('${t.id}')">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteType('${t.id}')">Excluir</button>
      </div>
    `;
    typesList.appendChild(row);
  });
}

async function addType() {
  const name = (typeName?.value || '').trim();
  const price = unmaskMoney(typePrice?.value || '0');
  if (!name) { alert('Digite o nome do tipo'); return; }
  if (!typesCollection) { alert('Conexão ao banco não configurada'); return; }
  await typesCollection.add({ name, price });
  typeName.value = ''; typePrice.value = '';
  await loadTypes();
}

async function editType(id) {
  const t = allTypes.find(x => x.id === id);
  if (!t) return;
  const newName = prompt('Nome:', t.name);
  if (newName === null) return;
  const newPriceStr = prompt('Preço (somente números):', String(t.price || 0));
  if (newPriceStr === null) return;
  const newPrice = Number(newPriceStr) || 0;
  await typesCollection.doc(id).set({ name: newName, price: newPrice }, { merge: true });
  await loadTypes();
}

async function deleteType(id) {
  if (!confirm('Excluir este tipo?')) return;
  await typesCollection.doc(id).delete();
  await loadTypes();
}

function unmaskMoney(value) {
  try { return Number(String(value).replace(/[^0-9,-]/g, '').replace(',', '.')) || 0; } catch { return 0; }
}

if (btnAddType) btnAddType.addEventListener('click', addType);
if (btnReloadTypes) btnReloadTypes.addEventListener('click', loadTypes);

function renderClients() {
  if (!clientsList) return;
  const arr = Object.values(allClients || {});
  const term = (clientSearchInput?.value || '').toLowerCase().trim();
  const filtered = term ? arr.filter(c => (c.name||'').toLowerCase().includes(term) || (c.email||'').toLowerCase().includes(term)) : arr;

  clientsList.innerHTML = '';
  if (filtered.length === 0) { clientsList.innerHTML = '<div class="small">Nenhum cliente encontrado</div>'; return; }
  filtered.sort((a,b) => (a.name||'').localeCompare(b.name||''));

  filtered.forEach(c => {
    const card = document.createElement('div');
    card.className = 'client-card';
    card.innerHTML = `
      <div class="client-card-header">
        <div class="client-avatar"> <i class="fas fa-user"></i> </div>
        <div class="client-card-info">
          <div class="client-name">${c.name}</div>
          <div class="client-meta">${maskPhone(c.phone||'')} • ${c.email||''}</div>
        </div>
      </div>
    `;
    card.onclick = () => openClientDetail(c.id);
    clientsList.appendChild(card);
  });
}

function openClientDetail(id) {
  const c = allClients[id];
  if (!c) { alert('Cliente não encontrado'); return; }
  alert(`Cliente: ${c.name}\nEmail: ${c.email || 'N/A'}\nTelefone: ${maskPhone(c.phone||'')}`);
}

if (clientSearchInput) clientSearchInput.addEventListener('input', renderClients);

function renderAppointments() {
  if (!appointmentsList) return;
  appointmentsList.innerHTML = '';
  if (!allAppointments || allAppointments.length === 0) { appointmentsList.innerHTML = '<div class="small">Nenhum agendamento</div>'; return; }

  const sorted = allAppointments.slice().sort((a,b) => b.start - a.start);

  sorted.forEach(a => {
    const d = new Date(a.start);
    const row = document.createElement('div');
    row.className = 'appointment-row';
    row.innerHTML = `
      <div class="appointment-info">
        <div class="appointment-date">${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
        <div class="appointment-type">${a.typeName || ''}</div>
      </div>
      <div class="appointment-actions">
        <button class="btn btn-ghost btn-sm" onclick="editAppointment('${a.id}')">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteAppointment('${a.id}')">Excluir</button>
      </div>
    `;
    appointmentsList.appendChild(row);
  });
}

async function editAppointment(id) {
  const a = allAppointments.find(x => x.id === id);
  if (!a) return;
  const newDate = prompt('Data/Hora ISO:', new Date(a.start).toISOString());
  if (!newDate) return;
  await appointmentsCollection.doc(id).set({ start: new Date(newDate).getTime() }, { merge: true });
  await loadAppointments();
}

function computeFinanceData() {
  const paid = allAppointments.filter(a => a.paid);
  const total = paid.reduce((s,a) => s + Number(a.price || 0), 0);
  const quantidade = paid.length;
  const ticketMedio = quantidade ? (total / quantidade) : 0;

  if (financeTotal) financeTotal.textContent = formatMoney(total);
  if (financeQuantidade) financeQuantidade.textContent = quantidade;
  if (financeTicketMedio) financeTicketMedio.textContent = formatMoney(ticketMedio);

  const counts = {};
  allAppointments.forEach(a => { if (a.typeName) counts[a.typeName] = (counts[a.typeName]||0) + 1; });
  const ranks = Object.entries(counts).sort((a,b) => b[1] - a[1]);
  if (massageRanking) massageRanking.innerHTML = ranks.map(r => `<div class="small">${r[0]} • ${r[1]}x</div>`).join('');

  const clientSums = {};
  allAppointments.forEach(a => { if (a.userId) { clientSums[a.userId] = clientSums[a.userId] || { total:0, count:0 }; clientSums[a.userId].total += Number(a.price||0); clientSums[a.userId].count++; } });
  const clientAvg = Object.entries(clientSums).map(([uid,v])=> ({ uid, avg: v.total / Math.max(1,v.count) } )).sort((a,b)=> b.avg - a.avg).slice(0,5);
  if (clientRanking) clientRanking.innerHTML = clientAvg.map(c=> `<div class="small">${allClients[c.uid] ? allClients[c.uid].name : c.uid} • ${formatMoney(c.avg)}</div>`).join('');
}

const sbItems = Array.from(document.querySelectorAll('.sb-item'));
const btnMenu = document.getElementById('btnMenu');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');

if (btnMenu) btnMenu.addEventListener('click', () => { sidebar.classList.toggle('open'); mainContent.classList.toggle('shift'); });

sbItems.forEach(item => {
  item.addEventListener('click', () => {
    sbItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    const tab = item.dataset.tab;
    openTab(tab);
  });
});

function openTab(tab) {
  [tabDashboard, tabSchedule, tabTypes, tabClients, tabAppointments, tabFinance, tabBackup].forEach(t => t && t.classList.add('hidden'));
  if (tab === 'dashboard') tabDashboard && tabDashboard.classList.remove('hidden');
  if (tab === 'schedule') tabSchedule && (tabSchedule.classList.remove('hidden'), loadScheduleConfig());
  if (tab === 'types') tabTypes && tabTypes.classList.remove('hidden');
  if (tab === 'clients') tabClients && (tabClients.classList.remove('hidden'), renderClients());
  if (tab === 'appointments') tabAppointments && tabAppointments.classList.remove('hidden');
  if (tab === 'finance') tabFinance && (tabFinance.classList.remove('hidden'), computeFinanceData());
  if (tab === 'backup') tabBackup && tabBackup.classList.remove('hidden');
}

function attachRealtimeListeners() {
  if (!appointmentsCollection) return;
  appointmentsCollection.onSnapshot(snap => {
    allAppointments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAppointments();
    computeFinanceData();
    updateDayDetail();
  });

  if (typesCollection) typesCollection.onSnapshot(snap => { allTypes = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderTypes(); });
  if (clientsCollection) clientsCollection.onSnapshot(snap => { allClients = {}; snap.docs.forEach(d => allClients[d.id] = { id: d.id, ...d.data() }); renderClients(); });
}

if (typeof firebase !== 'undefined') {
  attachRealtimeListeners();
}

// ====================
// BOOTSTRAP INICIAL
// ====================
async function initializeAdmin() {
  if (db) {
    await loadTypes();
    await loadClients();
    await loadAppointments();
    await loadScheduleConfig();
  } else {
    // fallback: ensure scheduleConfig exists for local rendering
    scheduleConfig = scheduleConfig || { ...DEFAULT_SCHEDULE_CONFIG };
  }
  renderCalendar(); renderWeek(); updateDayDetail();
  computeFinanceData();
}
initializeAdmin();

// End of combined admin.js
