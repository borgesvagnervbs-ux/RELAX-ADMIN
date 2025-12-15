// admin.js FINAL - Painel Admin Completo (Versão Revisada e Limpa)
// ---------------------------------------------------------------
// ESTE ARQUIVO CONTÉM:
// - Calendário
// - Agenda diária
// - Tipos de serviços (CRUD)
// - Clientes (CRUD básico)
// - Agendamentos (CRUD)
// - Financeiro
// - Backup e restauração
// - Conexão com Firebase já externamente gerenciada pelo firebase-config.js
// ---------------------------------------------------------------
// Observação:
// O arquivo NÃO declara 'const db = ...' porque o firebase-config.js já faz isso.
// ---------------------------------------------------------------



// ---------------------------------------------------------------
//  PARTE 1 – ELEMENTOS DO DOM
// ---------------------------------------------------------------
const tabDashboard = document.getElementById('tab-dashboard');
const tabTypes = document.getElementById('tab-types');
const tabClients = document.getElementById('tab-clients');
const tabAppointments = document.getElementById('tab-appointments');
const tabFinance = document.getElementById('tab-finance');
const tabSchedule = document.getElementById('tab-schedule');
const tabBackup = document.getElementById('tab-backup');


// ---------------------------------------------------------------
//  PARTE 2 – VARIÁVEIS GLOBAIS
// ---------------------------------------------------------------
let allTypes = [];
let allAppointments = [];
let allClients = {};

let selectedDate = null;
let currentMonth = new Date();

let scheduleConfig = null;
let currentDayAvailability = {};


// ---------------------------------------------------------------
//  PARTE 3 – ELEMENTOS DE TELA
// ---------------------------------------------------------------
const calendarClient = document.getElementById('calendarClient');
const weekContainer = document.getElementById('weekContainer');
const weekArea = document.getElementById('weekArea');

const viewMode = document.getElementById('viewMode');
const btnToday = document.getElementById('btnToday');

const dayDetail = document.getElementById('dayDetail');
const selectedDayTitle = document.getElementById('selectedDayTitle');
const selectedDaySub = document.getElementById('selectedDaySub');
const hourlyList = document.getElementById('hourlyList');


// ---------------------------------------------------------------
//  PARTE 4 – CONFIGURAÇÃO PADRÃO DE HORÁRIOS
// ---------------------------------------------------------------
const DEFAULT_SCHEDULE_CONFIG = {
  sessionDuration: 60,
  schedules: {
    0: { enabled: false, start: "08:00", end: "18:00", intervals: [] },
    1: { enabled: true,  start: "08:00", end: "18:00", intervals: [] },
    2: { enabled: true,  start: "08:00", end: "18:00", intervals: [] },
    3: { enabled: true,  start: "08:00", end: "18:00", intervals: [] },
    4: { enabled: true,  start: "08:00", end: "18:00", intervals: [] },
    5: { enabled: true,  start: "08:00", end: "18:00", intervals: [] },
    6: { enabled: false, start: "08:00", end: "18:00", intervals: [] }
  }
};


// ---------------------------------------------------------------
//  PARTE 5 – HELPERS GERAIS
// ---------------------------------------------------------------
function pad2(n) { return String(n).padStart(2,'0'); }

function toDateStr(date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth()+1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

function getDayName(i) {
  return ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"][i];
}

function formatMoney(v) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(v)||0);
}

function unmaskMoney(value) {
  return Number(String(value).replace(/[^0-9,-]/g,'').replace(',','.')) || 0;
}

function maskPhone(phone) {
  phone = phone.replace(/\D/g, "");
  if (phone.length <= 10) {
    phone = phone.replace(/(\d{2})(\d)/, "($1) $2");
    phone = phone.replace(/(\d{4})(\d)/, "$1-$2");
  } else {
    phone = phone.replace(/(\d{2})(\d)/, "($1) $2");
    phone = phone.replace(/(\d{5})(\d)/, "$1-$2");
  }
  return phone;
}


// ---------------------------------------------------------------
//  PARTE 6 – GERAÇÃO DE HORÁRIOS DIÁRIOS
// ---------------------------------------------------------------
function generateTimeSlotsForDay(date) {
  if (!scheduleConfig) return [];
  const dow = date.getDay();
  const cfg = scheduleConfig.schedules[dow];
  if (!cfg || !cfg.enabled) return [];

  const [sh, sm] = cfg.start.split(":").map(Number);
  const [eh, em] = cfg.end.split(":").map(Number);
  const dur = Number(scheduleConfig.sessionDuration)||60;

  const slots = [];
  let current = sh*60 + sm;
  const end = eh*60 + em;

  while (current + dur <= end) {
    const h = Math.floor(current/60);
    const m = current % 60;

    const inInterval = (cfg.intervals||[]).some(intv=>{
      if (!intv.start || !intv.end) return false;
      const [isH,isM] = intv.start.split(":").map(Number);
      const [ieH,ieM] = intv.end.split(":").map(Number);
      const iStart = isH*60 + isM;
      const iEnd = ieH*60 + ieM;
      return current >= iStart && current < iEnd;
    });

    if (!inInterval) {
      slots.push({hour:h, minute:m, time:pad2(h)+":"+pad2(m)});
    }

    current += dur;
  }

  return slots;
}


// ---------------------------------------------------------------
//  PARTE 7 – RENDERIZAÇÃO DO CALENDÁRIO MENSAL
// ---------------------------------------------------------------
function renderCalendar() {
  if (!calendarClient) return;

  calendarClient.innerHTML = "";
  const header = document.createElement("div");
  header.className = "calendar-header";

  const title = document.createElement("div");
  title.textContent = currentMonth.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
  header.appendChild(title);
  calendarClient.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const last  = new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1, 0);

  const blanks = first.getDay();
  for (let i=0;i<blanks;i++){
    const e = document.createElement("div");
    e.className="empty";
    grid.appendChild(e);
  }

  for (let d=1; d<=last.getDate(); d++){
    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
    const cell = document.createElement("div");
    cell.className="calendar-day";
    cell.textContent=d;
    cell.onclick = ()=> selectDate(dateObj);
    grid.appendChild(cell);
  }

  calendarClient.appendChild(grid);
}


// ---------------------------------------------------------------
//  PARTE 8 – SEMANA
// ---------------------------------------------------------------
function renderWeek() {
  if (!weekContainer) return;
  weekContainer.innerHTML = "";

  const base = selectedDate ? new Date(selectedDate) : new Date();
  base.setHours(0,0,0,0);
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());

  for (let i=0;i<7;i++){
    const d = new Date(start);
    d.setDate(start.getDate()+i);

    const div = document.createElement("div");
    div.className="week-day";
    div.textContent = `${getDayName(d.getDay())} ${pad2(d.getDate())}`;
    div.onclick = ()=> selectDate(d);

    weekContainer.appendChild(div);
  }
}


// ---------------------------------------------------------------
//  PARTE 9 – MUDANÇA DE VISUALIZAÇÃO (DIA / SEMANA)
// ---------------------------------------------------------------
if (viewMode) {
  viewMode.addEventListener("change",()=>{
    if (viewMode.value==="week") {
      weekArea.classList.remove("hidden");
      renderWeek();
    } else {
      weekArea.classList.add("hidden");
      renderCalendar();
    }
  });
}

if (btnToday) {
  btnToday.addEventListener("click",()=>{
    selectedDate = new Date();
    selectedDate.setHours(0,0,0,0);
    renderCalendar();
    renderWeek();
    updateDayDetail();
  });
}


// ---------------------------------------------------------------
//  PARTE 10 – SELECIONAR DATA
// ---------------------------------------------------------------
function selectDate(date){
  selectedDate = new Date(date);
  selectedDate.setHours(0,0,0,0);

  if (viewMode && viewMode.value==="week") renderWeek();
  else renderCalendar();

  updateDayDetail();
}


// ---------------------------------------------------------------
//  PARTE 11 – FUNÇÕES FIREBASE (SEM DECLARAR `db` AQUI!)
// ---------------------------------------------------------------
function colTypes()         { return db.collection("types"); }
function colClients()       { return db.collection("clients"); }
function colAppointments()  { return db.collection("appointments"); }
function colAvailability()  { return db.collection("availability"); }
function docScheduleConfig(){ return db.collection("config").doc("schedule"); }


// ---------------------------------------------------------------
//  PARTE 12 – CARREGAMENTO DE DADOS
// ---------------------------------------------------------------
async function loadTypes(){
  const snap = await colTypes().get();
  allTypes = snap.docs.map(d=>({id:d.id, ...d.data()}));
  renderTypes();
}

async function loadClients(){
  const snap = await colClients().get();
  allClients = {};
  snap.docs.forEach(d=>{
    allClients[d.id] = {id:d.id, ...d.data()};
  });
  renderClients();
}

async function loadAppointments(){
  const snap = await colAppointments().get();
  allAppointments = snap.docs.map(d=>({id:d.id, ...d.data()}));
  renderAppointments();
  updateDayDetail();
}

async function loadScheduleConfig() {
  const snap = await docScheduleConfig().get();
  scheduleConfig = snap.exists ? snap.data() : DEFAULT_SCHEDULE_CONFIG;
}


// ---------------------------------------------------------------
//  PARTE 13 – DISPONIBILIDADE DE HORÁRIOS
// ---------------------------------------------------------------
async function getDayAvailability(dateStr){
  const snap = await colAvailability().doc(dateStr).get();
  return snap.exists ? snap.data() : {};
}

async function setDayAvailability(dateStr, key, val){
  await colAvailability().doc(dateStr).set({[key]:val},{merge:true});
}


// ---------------------------------------------------------------
//  PARTE 14 – UPDATE DO DIA SELECIONADO (CORRIGIDO)
// ---------------------------------------------------------------
async function updateDayDetail(){
  if (!selectedDate){
    dayDetail.classList.add("hidden");
    return;
  }

  dayDetail.classList.remove("hidden");

  selectedDayTitle.textContent = selectedDate.toLocaleDateString("pt-BR",{
    weekday:"long", day:"2-digit", month:"long", year:"numeric"
  });

  // LIMPA A LISTA ANTES DE RENDERIZAR
  hourlyList.innerHTML = "";

  const slots = generateTimeSlotsForDay(selectedDate);
  const dateStr = toDateStr(selectedDate);

  if (!slots.length){
    hourlyList.innerHTML = `
      <div class="no-slots-alert">
        <div class="no-slots-icon"><i class="fas fa-calendar-times"></i></div>
        <div class="no-slots-content">
          <h4>Dia não disponível</h4>
          <p>Este dia não está configurado para atendimento.</p>
        </div>
      </div>`;
    return;
  }

  currentDayAvailability = await getDayAvailability(dateStr);

  const dayApps = allAppointments.filter(a=>{
    const d = new Date(a.start);
    d.setHours(0,0,0,0);
    return d.getTime()===selectedDate.getTime();
  });

  const now = new Date();
  now.setHours(0,0,0,0);
  const isPast = selectedDate < now;
  const isToday = selectedDate.toDateString() === (new Date()).toDateString();

  // TOGGLE ALL - Criar apenas uma vez
  const toggleRow = document.createElement("div");
  toggleRow.className="toggle-all-row";

  const lbl = document.createElement("label");
  lbl.style.display="flex";
  lbl.style.alignItems="center";
  lbl.style.gap="8px";

  const ck = document.createElement("input");
  ck.type="checkbox";

  const available = slots.filter(s=>{
    const booked = dayApps.some(a=>{
      const d=new Date(a.start);
      return d.getHours()===s.hour && d.getMinutes()===s.minute;
    });

    const pastHour = isToday && (s.hour < new Date().getHours());
    return !booked && !pastHour && !isPast;
  });

  ck.checked = available.every(s => currentDayAvailability[`${s.hour}:${s.minute}`] !== false);

  ck.onchange = async()=>{
    for (const s of available){
      await setDayAvailability(dateStr, `${s.hour}:${s.minute}`, ck.checked);
    }
    currentDayAvailability = await getDayAvailability(dateStr);
    updateDayDetail();
  };

  lbl.appendChild(ck);
  lbl.appendChild(document.createTextNode("Habilitar horários disponíveis"));
  toggleRow.appendChild(lbl);
  
  // ADICIONA O TOGGLE ROW APENAS UMA VEZ
  hourlyList.appendChild(toggleRow);

  // LISTA DE HORÁRIOS - Renderiza cada slot apenas uma vez
  slots.forEach(s=>{
    const row = document.createElement("div");
    row.className="slot-row";

    const time = document.createElement("div");
    time.className="slot-time";
    time.textContent = s.time;

    const controls = document.createElement("div");
    controls.className="slot-controls";

    const key = `${s.hour}:${s.minute}`;
    const isDisabled = currentDayAvailability[key] === false;

    const booked = dayApps.some(a=>{
      const d=new Date(a.start);
      return d.getHours()===s.hour && d.getMinutes()===s.minute;
    });

    if (booked){
      const b = document.createElement("span");
      b.className="status-badge status-booked";
      b.textContent="Reservado";
      controls.appendChild(b);
    } else {
      const tgl = document.createElement("input");
      tgl.type="checkbox";
      tgl.checked=!isDisabled;
      tgl.disabled=isPast;
      tgl.onchange= async()=>{
        await setDayAvailability(dateStr,key,tgl.checked);
        currentDayAvailability=await getDayAvailability(dateStr);
        updateDayDetail();
      };
      controls.appendChild(tgl);
    }

    row.appendChild(time);
    row.appendChild(controls);
    hourlyList.appendChild(row);
  });
}


// ---------------------------------------------------------------
//  PARTE 15 – CRUD: TIPOS
// ---------------------------------------------------------------
const typesList = document.getElementById("typesList");
const typeName = document.getElementById("typeName");
const typePrice = document.getElementById("typePrice");
const btnAddType = document.getElementById("btnAddType");

function renderTypes(){
  if (!typesList) return;
  typesList.innerHTML="";

  if (!allTypes.length){
    typesList.innerHTML="<div class='small'>Nenhum tipo cadastrado</div>";
    return;
  }

  allTypes.forEach(t=>{
    const row = document.createElement("div");
    row.className="type-row";
    row.innerHTML=`
      <div class="type-info">
        <div class="type-name">${t.name}</div>
        <div class="type-price">${formatMoney(t.price)}</div>
      </div>
      <div class="type-actions">
        <button class="btn btn-ghost btn-sm" onclick="editType('${t.id}')">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteType('${t.id}')">Excluir</button>
      </div>`;
    typesList.appendChild(row);
  });
}

async function addType(){
  const name = typeName.value.trim();
  const price = unmaskMoney(typePrice.value);
  if (!name) return alert("Digite o nome do tipo");
  await colTypes().add({name,price});
  typeName.value="";
  typePrice.value="";
  loadTypes();
}

async function editType(id){
  const t = allTypes.find(x=>x.id===id);
  if (!t) return;

  const nn = prompt("Nome:", t.name);
  if (nn===null) return;
  const np = prompt("Preço:", t.price);
  if (np===null) return;

  await colTypes().doc(id).set({name:nn, price:Number(np)}, {merge:true});
  loadTypes();
}

async function deleteType(id){
  if (!confirm("Excluir este tipo?")) return;
  await colTypes().doc(id).delete();
  loadTypes();
}

if (btnAddType){
  btnAddType.onclick = addType;
}


// ---------------------------------------------------------------
//  PARTE 16 – CRUD CLIENTES
// ---------------------------------------------------------------
const clientsList = document.getElementById("clientsList");
const clientSearchInput = document.getElementById("clientSearchInput");

function renderClients(){
  if (!clientsList) return;
  clientsList.innerHTML="";

  const arr = Object.values(allClients);
  const q = clientSearchInput ? clientSearchInput.value.trim().toLowerCase() : "";

  const list = q ? arr.filter(c=>
      (c.name||"").toLowerCase().includes(q) ||
      (c.email||"").toLowerCase().includes(q)
  ) : arr;

  if (!list.length){
    clientsList.innerHTML="<div class='small'>Nenhum cliente encontrado</div>";
    return;
  }

  list.sort((a,b)=>(a.name||"").localeCompare(b.name||""));

  list.forEach(c=>{
    const card = document.createElement("div");
    card.className="client-card";
    card.innerHTML=`
      <div class="client-card-header">
        <div class="client-avatar"><i class="fas fa-user"></i></div>
        <div class="client-card-info">
          <div class="client-name">${c.name}</div>
          <div class="client-meta">${maskPhone(c.phone||"")} • ${c.email||""}</div>
        </div>
      </div>
    `;
    clientsList.appendChild(card);
  });
}

if (clientSearchInput){
  clientSearchInput.oninput = renderClients;
}


// ---------------------------------------------------------------
//  PARTE 17 – CRUD AGENDAMENTOS
// ---------------------------------------------------------------
const appointmentsList = document.getElementById("appointmentsList");

function renderAppointments(){
  if (!appointmentsList) return;
  appointmentsList.innerHTML="";

  if (!allAppointments.length){
    appointmentsList.innerHTML="<div class='small'>Nenhum agendamento</div>";
    return;
  }

  const sorted = allAppointments.slice().sort((a,b)=>b.start - a.start);

  sorted.forEach(a=>{
    const d = new Date(a.start);
    const row = document.createElement("div");
    row.className="appointment-row";
    row.innerHTML=`
      <div class="appointment-info">
        <div class="appointment-date">${d.toLocaleDateString("pt-BR")} ${pad2(d.getHours())}:${pad2(d.getMinutes())}</div>
        <div class="appointment-type">${a.typeName||""}</div>
      </div>
      <div class="appointment-actions">
        <button class="btn btn-ghost btn-sm" onclick="editAppointment('${a.id}')">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteAppointment('${a.id}')">Excluir</button>
      </div>
    `;
    appointmentsList.appendChild(row);
  });
}

async function editAppointment(id){
  const app = allAppointments.find(x=>x.id===id);
  if (!app) return;

  const nd = prompt("Data/Hora (ISO):", new Date(app.start).toISOString());
  if (!nd) return;

  await colAppointments().doc(id).set({start:new Date(nd).getTime()},{merge:true});
  loadAppointments();
}

async function deleteAppointment(id){
  if (!confirm("Excluir agendamento?")) return;
  await colAppointments().doc(id).delete();
  loadAppointments();
}


// ---------------------------------------------------------------
//  PARTE 18 – FINANCEIRO
// ---------------------------------------------------------------
const financeTotal = document.getElementById("financeTotal");
const financeQuantidade = document.getElementById("financeQuantidade");
const financeTicketMedio = document.getElementById("financeTicketMedio");

const massageRanking = document.getElementById("massageRanking");
const clientRanking = document.getElementById("clientRanking");

function computeFinanceData(){
  const paid = allAppointments.filter(a=>a.paid);
  const total = paid.reduce((s,a)=>s+(a.price||0),0);
  const qtd = paid.length;
  const ticket = qtd ? total/qtd : 0;

  if (financeTotal) financeTotal.textContent = formatMoney(total);
  if (financeQuantidade) financeQuantidade.textContent = qtd;
  if (financeTicketMedio) financeTicketMedio.textContent = formatMoney(ticket);

  // RANKING MASSAGENS
  const counts = {};
  allAppointments.forEach(a=>{
    if (a.typeName) counts[a.typeName] = (counts[a.typeName]||0)+1;
  });

  const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  if (massageRanking) massageRanking.innerHTML = sorted.map(r=>`<div>${r[0]} • ${r[1]}x</div>`).join("");


  // RANKING CLIENTES POR GASTO MÉDIO
  const sums = {};
  allAppointments.forEach(a=>{
    if (!a.userId) return;
    if (!sums[a.userId]) sums[a.userId]={total:0,count:0};
    sums[a.userId].total+=a.price||0;
    sums[a.userId].count++;
  });

  const avgs = Object.entries(sums)
    .map(([uid,v])=>({uid,avg:v.total/v.count}))
    .sort((a,b)=>b.avg-a.avg)
    .slice(0,5);

  if (clientRanking){
    clientRanking.innerHTML = avgs.map(c=>{
      const name = allClients[c.uid] ? allClients[c.uid].name : c.uid;
      return `<div>${name} • ${formatMoney(c.avg)}</div>`;
    }).join("");
  }
}


// ---------------------------------------------------------------
//  PARTE 19 – MENU LATERAL
// ---------------------------------------------------------------
const sbItems = Array.from(document.querySelectorAll(".sb-item"));
const sidebar = document.getElementById("sidebar");
const mainContent = document.getElementById("mainContent");
const btnMenu = document.getElementById("btnMenu");

if (btnMenu) {
  btnMenu.onclick = ()=>{
    sidebar.classList.toggle("open");
    mainContent.classList.toggle("shift");
  };
}

sbItems.forEach(i=>{
  i.onclick = ()=>{
    sbItems.forEach(x=>x.classList.remove("active"));
    i.classList.add("active");
    openTab(i.dataset.tab);
  };
});

function openTab(tab){
  [
    tabDashboard, tabSchedule, tabTypes, tabClients,
    tabAppointments, tabFinance, tabBackup
  ].forEach(el=>el && el.classList.add("hidden"));

  if (tab==="dashboard") tabDashboard.classList.remove("hidden");
  if (tab==="schedule") { tabSchedule.classList.remove("hidden"); loadScheduleConfig(); }
  if (tab==="types") tabTypes.classList.remove("hidden");
  if (tab==="clients") { tabClients.classList.remove("hidden"); renderClients(); }
  if (tab==="appointments") tabAppointments.classList.remove("hidden");
  if (tab==="finance") { tabFinance.classList.remove("hidden"); computeFinanceData(); }
  if (tab==="backup") tabBackup.classList.remove("hidden");
}


// ---------------------------------------------------------------
//  PARTE 20 – BACKUP
// ---------------------------------------------------------------
async function generateBackup(){
  return JSON.stringify({
    types: allTypes,
    clients: Object.values(allClients),
    appointments: allAppointments,
    scheduleConfig: scheduleConfig
  },null,2);
}

async function restoreBackup(obj){
  for (const t of obj.types||[]){ await colTypes().doc(t.id).set(t); }
  for (const c of obj.clients||[]){ await colClients().doc(c.id).set(c); }
  for (const a of obj.appointments||[]){ await colAppointments().doc(a.id).set(a); }
  if (obj.scheduleConfig){
    await docScheduleConfig().set(obj.scheduleConfig);
  }
  await loadAll();
}


// ---------------------------------------------------------------
//  PARTE 21 – LOAD GERAL
// ---------------------------------------------------------------
async function loadAll(){
  await loadTypes();
  await loadClients();
  await loadAppointments();
  await loadScheduleConfig();
  renderCalendar();
  renderWeek();
  updateDayDetail();
  computeFinanceData();
}


// ---------------------------------------------------------------
//  BOOTSTRAP
// ---------------------------------------------------------------
loadAll();
