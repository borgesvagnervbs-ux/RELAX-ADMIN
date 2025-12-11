// admin.js - Painel Administrativo Completo com Gestão de Clientes e Horários

// Elementos da UI
const loginScreenAdmin = document.getElementById('loginScreenAdmin');
const mainScreenAdmin = document.getElementById('mainScreenAdmin');
const sidebar = document.getElementById('sidebar');
const btnMenu = document.getElementById('btnMenu');
const mainContent = document.getElementById('mainContent');
const sbItems = Array.from(document.querySelectorAll('.sb-item'));
const tabDashboard = document.getElementById('tab-dashboard');
const tabSchedule = document.getElementById('tab-schedule');
const tabTypes = document.getElementById('tab-types');
const tabClients = document.getElementById('tab-clients');
const tabAppointments = document.getElementById('tab-appointments');
const tabFinance = document.getElementById('tab-finance');
const typeName = document.getElementById('typeName');
const typePrice = document.getElementById('typePrice');
const typesList = document.getElementById('typesList');
const btnAddType = document.getElementById('btnAddType');
const btnReloadTypes = document.getElementById('btnReloadTypes');
const appointmentsList = document.getElementById('appointmentsList');
const clientsList = document.getElementById('clientsList');
const clientSearchInput = document.getElementById('clientSearchInput');
const calendarClient = document.getElementById('calendarClient');
const weekContainer = document.getElementById('weekContainer');
const weekArea = document.getElementById('weekArea');
const viewMode = document.getElementById('viewMode');
const selectedDayTitle = document.getElementById('selectedDayTitle');
const selectedDaySub = document.getElementById('selectedDaySub');
const hourlyList = document.getElementById('hourlyList');
const btnToday = document.getElementById('btnToday');
const dayDetail = document.getElementById('dayDetail');
const adminGreeting = document.getElementById('adminGreeting');
const clientDetailModal = document.getElementById('clientDetailModal');
const clientModalTitle = document.getElementById('clientModalTitle');
const clientModalBody = document.getElementById('clientModalBody');

// Elementos do modal de adicionar cliente
const addClientModal = document.getElementById('addClientModal');
const newClientName = document.getElementById('newClientName');
const newClientPhone = document.getElementById('newClientPhone');
const newClientCpf = document.getElementById('newClientCpf');
const newClientBirthdate = document.getElementById('newClientBirthdate');
const newClientEmail = document.getElementById('newClientEmail');
const newClientCep = document.getElementById('newClientCep');
const newClientStreet = document.getElementById('newClientStreet');
const newClientNumber = document.getElementById('newClientNumber');
const newClientComplement = document.getElementById('newClientComplement');
const newClientNeighborhood = document.getElementById('newClientNeighborhood');
const newClientCity = document.getElementById('newClientCity');
const newClientState = document.getElementById('newClientState');

// Modal Novo Agendamento
const newAppointmentModal = document.getElementById('newAppointmentModal');
const appointmentClientName = document.getElementById('appointmentClientName');
const appointmentClientPhone = document.getElementById('appointmentClientPhone');
const appointmentPhoneContainer = document.getElementById('appointmentPhoneContainer');
const clientSuggestions = document.getElementById('clientSuggestions');
const appointmentMassageType = document.getElementById('appointmentMassageType');
const appointmentPrice = document.getElementById('appointmentPrice');
const appointmentCalendar = document.getElementById('appointmentCalendar');
const appointmentTimeSlots = document.getElementById('appointmentTimeSlots');
const appointmentTimeSlotsSection = document.getElementById('appointmentTimeSlotsSection');
const appointmentNote = document.getElementById('appointmentNote');

// Elementos Financeiros
const financeTicketMedio = document.getElementById('financeTicketMedio');
const financeQuantidade = document.getElementById('financeQuantidade');
const financeTotal = document.getElementById('financeTotal');
const massageRanking = document.getElementById('massageRanking');
const clientRanking = document.getElementById('clientRanking');

// Elementos de Backup
const btnExportBackup = document.getElementById('btnExportBackup');
const inputRestoreBackup = document.getElementById('inputRestoreBackup');
const backupStatus = document.getElementById('backupStatus');

const MAX_BACKUP_TIMES = 24;
const backupScheduleList = document.getElementById('backupScheduleList');
const addBackupTimeBtn = document.getElementById('addBackupTimeBtn');
const backupScheduleForm = document.getElementById('backupScheduleForm');
const scheduleMsg = document.getElementById('scheduleMsg');

let allTypes = [];
let allAppointments = [];
let allClients = {};
let currentMonth = new Date();
let selectedDate = null;
let unsubscribeTypes = null;
let unsubscribeAppointments = null;
let unsubscribeUsers = null;
let currentDayAvailability = {};
let currentAdminUser = null;
let editingTypeId = null;
let currentStatusFilter = 'todos';
let currentPeriodFilter = 'current-month';
let currentFinancePeriodFilter = 'current-month';
let customDateStart = null;
let customDateEnd = null;
let customFinanceDateStart = null;
let customFinanceDateEnd = null;

let appointmentSelectedDate = null;
let appointmentSelectedHour = null;
let appointmentCurrentMonth = new Date();
let selectedClientId = null;

// Variáveis para configuração de horários
let scheduleConfig = null;


// ====================
// FUNÇÕES AUXILIARES
// ====================

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function toDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function calculateAge(birthdate) {
  if (!birthdate) return 'N/A';
  const parts = birthdate.split('/');
  if (parts.length !== 3) return 'N/A';
  
  const birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

function maskCpf(cpf) {
  if (!cpf) return '';
  cpf = cpf.replace(/\D/g, '');
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return cpf;
}

function unmaskCpf(cpf) {
  return cpf.replace(/\D/g, '');
}

function maskPhone(phone) {
  if (!phone) return '';
  phone = phone.replace(/\D/g, '');
  if (phone.length <= 10) {
    phone = phone.replace(/(\d{2})(\d)/, '($1) $2');
    phone = phone.replace(/(\d{4})(\d)/, '$1-$2');
  } else {
    phone = phone.replace(/(\d{2})(\d)/, '($1) $2');
    phone = phone.replace(/(\d{5})(\d)/, '$1-$2');
  }
  return phone;
}

function unmaskPhone(phone) {
  return phone.replace(/\D/g, '');
}

function maskCep(cep) {
  if (!cep) return '';
  cep = cep.replace(/\D/g, '');
  cep = cep.replace(/(\d{5})(\d)/, '$1-$2');
  return cep;
}

function unmaskCep(cep) {
  return cep.replace(/\D/g, '');
}

function maskDate(value) {
  value = value.replace(/\D/g, '');
  value = value.replace(/(\d{2})(\d)/, '$1/$2');
  value = value.replace(/(\d{2})(\d)/, '$1/$2');
  return value;
}

function validateDate(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return false;
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const year = parseInt(parts[2]);
  if (year < 1900 || year > new Date().getFullYear()) return false;
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;
  return true;
}

function validateCpf(cpf) {
  cpf = unmaskCpf(cpf);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(10))) return false;
  return true;
}

// Aplicar máscaras nos campos do modal de adicionar cliente
if (document.getElementById('newClientPhone')) {
  newClientPhone.addEventListener('input', function() { this.value = maskPhone(this.value); });
  newClientCpf.addEventListener('input', function() { this.value = maskCpf(this.value); });
  newClientBirthdate.addEventListener('input', function() { this.value = maskDate(this.value); });
  newClientCep.addEventListener('input', function() { this.value = maskCep(this.value); });
}

// Aplicar máscaras no modal de agendamento
if (document.getElementById('appointmentClientPhone')) {
  appointmentClientPhone.addEventListener('input', function() { this.value = maskPhone(this.value); });
}

// Configuração padrão de horários
// Configuração padrão de horários
const DEFAULT_SCHEDULE_CONFIG = {
  sessionDuration: 60,
  enabledDays: [1, 2, 3, 4, 5],
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

function getDayName(dayIndex) {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[dayIndex];
}

async function loadScheduleConfig() {
  try {
    const doc = await firebase.firestore().collection('system_config').doc('schedule').get();
    if (doc.exists) {
      scheduleConfig = doc.data();
    } else {
      scheduleConfig = { ...DEFAULT_SCHEDULE_CONFIG };
      await firebase.firestore().collection('system_config').doc('schedule').set(scheduleConfig);
    }
    renderScheduleConfig();
  } catch (error) {
    console.error('Erro ao carregar configuração:', error);
    scheduleConfig = { ...DEFAULT_SCHEDULE_CONFIG };
    renderScheduleConfig();
  }
}

async function saveScheduleConfig() {
  try {
    const sessionDuration = parseInt(document.getElementById('sessionDuration').value);
    
    const enabledDays = [];
    document.querySelectorAll('.day-checkbox:checked').forEach(cb => {
      enabledDays.push(parseInt(cb.value));
    });
    
    if (enabledDays.length === 0) {
      alert('Selecione pelo menos um dia de atendimento!');
      return;
    }
    
    const applyGlobalInterval = document.getElementById('applyIntervalToAll').checked;
    let globalInterval = null;
    
    if (applyGlobalInterval) {
      const globalStart = document.getElementById('globalIntervalStart').value;
      const globalEnd = document.getElementById('globalIntervalEnd').value;
      
      if (globalStart && globalEnd) {
        if (globalStart >= globalEnd) {
          alert('Intervalo global inválido: início deve ser antes do fim!');
          return;
        }
        globalInterval = { start: globalStart, end: globalEnd };
      }
    }
    
    const schedules = {};
    for (let i = 0; i < 7; i++) {
      const enabled = enabledDays.includes(i);
      const start = document.getElementById(`day${i}Start`)?.value || '08:00';
      const end = document.getElementById(`day${i}End`)?.value || '18:00';
      
      if (enabled && start >= end) {
        alert(`Horário inválido para ${getDayName(i)}: início deve ser antes do fim!`);
        return;
      }
      
      let intervals = [];
      
      if (applyGlobalInterval && globalInterval && enabled) {
        intervals = [globalInterval];
      } else {
        const intervalContainer = document.getElementById(`day${i}Intervals`);
        if (intervalContainer) {
          intervalContainer.querySelectorAll('.interval-item').forEach(item => {
            const startInput = item.querySelector('.interval-start');
            const endInput = item.querySelector('.interval-end');
            if (startInput && endInput && startInput.value && endInput.value) {
              if (startInput.value >= endInput.value) {
                alert(`Intervalo inválido para ${getDayName(i)}: início deve ser antes do fim!`);
                throw new Error('Invalid interval');
              }
              intervals.push({
                start: startInput.value,
                end: endInput.value
              });
            }
          });
        }
      }
      
      schedules[i] = { enabled, start, end, intervals };
    }
    
    const newConfig = {
      sessionDuration,
      enabledDays,
      schedules
    };
    
    await firebase.firestore().collection('system_config').doc('schedule').set(newConfig);
    scheduleConfig = newConfig;
    
    document.getElementById('scheduleConfigStatus').textContent = '✅ Configuração salva com sucesso!';
    setTimeout(() => {
      document.getElementById('scheduleConfigStatus').textContent = '';
    }, 3000);
    
    if (selectedDate) {
      await updateDayDetail();
    }
    
  } catch (error) {
    if (error.message !== 'Invalid interval') {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configuração!');
    }
  }
}

function renderScheduleConfig() {
  if (!scheduleConfig) return;
  
  document.getElementById('sessionDuration').value = scheduleConfig.sessionDuration;
  
  document.querySelectorAll('.day-checkbox').forEach(cb => {
    cb.checked = scheduleConfig.enabledDays.includes(parseInt(cb.value));
  });
  
  renderDaySchedules();
  renderDayIntervals();
}

function renderDaySchedules() {
  const container = document.getElementById('dayScheduleContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  for (let i = 0; i < 7; i++) {
    const daySchedule = scheduleConfig.schedules[i];
    const enabled = scheduleConfig.enabledDays.includes(i);
    
    if (!enabled) continue;
    
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day-schedule-item';
    dayDiv.innerHTML = `
      <div class="day-schedule-header">
        <strong>${getDayName(i)}</strong>
      </div>
      <div class="row" style="margin-top:8px">
        <input type="time" id="day${i}Start" class="input" value="${daySchedule.start}" style="width:140px">
        <span style="padding:12px">até</span>
        <input type="time" id="day${i}End" class="input" value="${daySchedule.end}" style="width:140px">
      </div>
    `;
    container.appendChild(dayDiv);
  }
}

function renderDayIntervals() {
  const container = document.getElementById('dayIntervalContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  const applyToAll = document.getElementById('applyIntervalToAll');
  const globalConfig = document.getElementById('globalIntervalConfig');
  
  if (applyToAll && globalConfig) {
    applyToAll.addEventListener('change', function() {
      if (this.checked) {
        globalConfig.classList.remove('hidden');
        container.classList.add('hidden');
      } else {
        globalConfig.classList.add('hidden');
        container.classList.remove('hidden');
      }
    });
  }
  
  for (let i = 0; i < 7; i++) {
    const daySchedule = scheduleConfig.schedules[i];
    const enabled = scheduleConfig.enabledDays.includes(i);
    
    if (!enabled) continue;
    
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day-interval-section';
    dayDiv.innerHTML = `
      <div class="day-interval-header">
        <strong>${getDayName(i)}</strong>
        <button type="button" class="btn btn-ghost btn-sm" onclick="addInterval(${i})">
          <i class="fas fa-plus"></i> Adicionar Intervalo
        </button>
      </div>
      <div id="day${i}Intervals" class="intervals-list"></div>
    `;
    container.appendChild(dayDiv);
    
    const intervalsList = dayDiv.querySelector('.intervals-list');
    daySchedule.intervals.forEach((interval, idx) => {
      const intervalItem = document.createElement('div');
      intervalItem.className = 'interval-item';
      intervalItem.innerHTML = `
        <input type="time" class="input interval-start" value="${interval.start}" style="width:120px">
        <span style="padding:8px">até</span>
        <input type="time" class="input interval-end" value="${interval.end}" style="width:120px">
        <button type="button" class="btn btn-danger btn-sm" onclick="removeIntervalFromDOM(this)">
          <i class="fas fa-trash"></i>
        </button>
      `;
      intervalsList.appendChild(intervalItem);
    });
  }
}

function addInterval(dayIndex) {
  const intervalsList = document.getElementById(`day${dayIndex}Intervals`);
  if (!intervalsList) return;
  
  const intervalItem = document.createElement('div');
  intervalItem.className = 'interval-item';
  intervalItem.innerHTML = `
    <input type="time" class="input interval-start" value="12:00" style="width:120px">
    <span style="padding:8px">até</span>
    <input type="time" class="input interval-end" value="13:00" style="width:120px">
    <button type="button" class="btn btn-danger btn-sm" onclick="removeIntervalFromDOM(this)">
      <i class="fas fa-trash"></i>
    </button>
  `;
  intervalsList.appendChild(intervalItem);
}

function removeIntervalFromDOM(button) {
  if (confirm('Remover este intervalo?')) {
    button.parentElement.remove();
  }
}

function generateTimeSlotsForDay(date) {
  if (!scheduleConfig) return [];
  
  const dayOfWeek = date.getDay();
  const daySchedule = scheduleConfig.schedules[dayOfWeek];
  
  if (!daySchedule || !daySchedule.enabled) return [];
  
  const slots = [];
  const sessionDuration = scheduleConfig.sessionDuration;
  
  const [startHour, startMin] = daySchedule.start.split(':').map(Number);
  const [endHour, endMin] = daySchedule.end.split(':').map(Number);
  
  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  while (currentMinutes + sessionDuration <= endMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;
    
    const isInInterval = daySchedule.intervals.some(interval => {
      const [intStartHour, intStartMin] = interval.start.split(':').map(Number);
      const [intEndHour, intEndMin] = interval.end.split(':').map(Number);
      const intStart = intStartHour * 60 + intStartMin;
      const intEnd = intEndHour * 60 + intEndMin;
      return currentMinutes >= intStart && currentMinutes < intEnd;
    });
    
    if (!isInInterval) {
      slots.push({
        hour,
        minute,
        time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      });
    }
    
    currentMinutes += sessionDuration;
  }
  
  return slots;
}


// ====================
// AUTENTICAÇÃO ADMIN
// ====================

async function loginAdmin() {
  const email = document.getElementById('adminLoginEmail').value.trim();
  const password = document.getElementById('adminLoginPassword').value;
  
  if (!email || !password) {
    alert('Preencha email e senha');
    return;
  }
  
  try {
    await loginUser(email, password);
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    let message = 'Erro ao fazer login';
    if (error.code === 'auth/user-not-found') message = 'Usuário não encontrado';
    else if (error.code === 'auth/wrong-password') message = 'Senha incorreta';
    else if (error.code === 'auth/invalid-email') message = 'Email inválido';
    alert(message);
  }
}

async function loginAdminWithGoogle() {
  try {
    await loginWithGoogleProvider();
  } catch (error) {
    console.error('Erro ao fazer login com Google:', error);
    if (error.code !== 'auth/popup-closed-by-user') {
      alert('Erro ao fazer login com Google');
    }
  }
}

async function logoutAdmin() {
  if (confirm('Deseja sair do painel administrativo?')) {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      alert('Erro ao sair da conta');
    }
  }
}

onAuthChange(async (user) => {
  if (user) {
    currentAdminUser = user;
    
    const profile = await getUserProfile(user.uid);
    if (profile && profile.name) {
      adminGreeting.textContent = `Olá, ${profile.name.split(' ')[0]}!`;
    } else {
      adminGreeting.textContent = 'Gerencie agendamentos';
    }
    
    loginScreenAdmin.classList.add('hidden');
    mainScreenAdmin.classList.remove('hidden');
    
    await init();
    
    console.log('✅ Admin autenticado!');
  } else {
    currentAdminUser = null;
    
    if (unsubscribeTypes) unsubscribeTypes();
    if (unsubscribeAppointments) unsubscribeAppointments();
    if (unsubscribeUsers) unsubscribeUsers();
    
    loginScreenAdmin.classList.remove('hidden');
    mainScreenAdmin.classList.add('hidden');
  }
});

// ====================
// MÁSCARAS E VALIDAÇÕES
// ====================

function maskMoney(input) {
  let value = input.value.replace(/\D/g, '');
  value = (value / 100).toFixed(2);
  value = value.replace('.', ',');
  value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  input.value = 'R$ ' + value;
}

function unmaskMoney(value) {
  return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

typePrice.addEventListener('input', function() {
  maskMoney(this);
});

// ====================
// MENU LATERAL
// ====================

btnMenu.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  mainContent.classList.toggle('shift');
});

sbItems.forEach(item => {
  item.addEventListener('click', () => {
    sbItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    const tab = item.dataset.tab;
    openTab(tab);
    sidebar.classList.remove('open');
    mainContent.classList.remove('shift');
  });
});

function openTab(tab) {
  tabDashboard.classList.add('hidden');
  if (tabSchedule) tabSchedule.classList.add('hidden'); // ADICIONE ESTA LINHA
  tabTypes.classList.add('hidden');
  tabClients.classList.add('hidden');
  tabAppointments.classList.add('hidden');
  tabFinance.classList.add('hidden');
  document.getElementById('tab-backup').classList.add('hidden');

  if (tab === 'dashboard') tabDashboard.classList.remove('hidden');
  // ADICIONE ESTAS LINHAS
  if (tab === 'schedule' && tabSchedule) {
    tabSchedule.classList.remove('hidden');
    loadScheduleConfig();
  }
  if (tab === 'types') tabTypes.classList.remove('hidden');

if (tab === 'schedule' && document.getElementById('tab-schedule')) {
  document.getElementById('tab-schedule').classList.remove('hidden');
  loadScheduleConfig();
}
  if (tab === 'clients') {
    tabClients.classList.remove('hidden');
    loadClientsUI();
  }
  if (tab === 'appointments') tabAppointments.classList.remove('hidden');
  if (tab === 'finance') {
    tabFinance.classList.remove('hidden');
    computeFinanceData();
  }
  if (tab === 'backup') {
    document.getElementById('tab-backup').classList.remove('hidden');
    document.getElementById('backupStatus').textContent = '';
  }
}

// ====================
// GERENCIAMENTO DE CONFIGURAÇÃO DE HORÁRIOS
// ====================

function getDayName(dayIndex) {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[dayIndex];
}

async function loadScheduleConfig() {
  try {
    const doc = await firebase.firestore().collection('system_config').doc('schedule').get();
    if (doc.exists) {
      scheduleConfig = doc.data();
    } else {
      scheduleConfig = { ...DEFAULT_SCHEDULE_CONFIG };
      await firebase.firestore().collection('system_config').doc('schedule').set(scheduleConfig);
    }
    renderScheduleConfig();
  } catch (error) {
    console.error('Erro ao carregar configuração:', error);
    scheduleConfig = { ...DEFAULT_SCHEDULE_CONFIG };
    renderScheduleConfig();
  }
}

async function saveScheduleConfig() {
  try {
    // Coletar duração da sessão
    const sessionDuration = parseInt(document.getElementById('sessionDuration').value);
    
    // Coletar dias habilitados
    const enabledDays = [];
    document.querySelectorAll('.day-checkbox:checked').forEach(cb => {
      enabledDays.push(parseInt(cb.value));
    });
    
    if (enabledDays.length === 0) {
      alert('Selecione pelo menos um dia de atendimento!');
      return;
    }
    
    // Verificar se deve aplicar intervalo global
    const applyGlobalInterval = document.getElementById('applyIntervalToAll').checked;
    let globalInterval = null;
    
    if (applyGlobalInterval) {
      const globalStart = document.getElementById('globalIntervalStart').value;
      const globalEnd = document.getElementById('globalIntervalEnd').value;
      
      if (globalStart && globalEnd) {
        if (globalStart >= globalEnd) {
          alert('Intervalo global inválido: início deve ser antes do fim!');
          return;
        }
        globalInterval = { start: globalStart, end: globalEnd };
      }
    }
    
    // Coletar horários por dia
    const schedules = {};
    for (let i = 0; i < 7; i++) {
      const enabled = enabledDays.includes(i);
      const start = document.getElementById(`day${i}Start`)?.value || '08:00';
      const end = document.getElementById(`day${i}End`)?.value || '18:00';
      
      // Validar horários
      if (enabled && start >= end) {
        alert(`Horário inválido para ${getDayName(i)}: início deve ser antes do fim!`);
        return;
      }
      
      // Coletar intervalos
      let intervals = [];
      
      if (applyGlobalInterval && globalInterval && enabled) {
        intervals = [globalInterval];
      } else {
        const intervalContainer = document.getElementById(`day${i}Intervals`);
        if (intervalContainer) {
          intervalContainer.querySelectorAll('.interval-item').forEach(item => {
            const startInput = item.querySelector('.interval-start');
            const endInput = item.querySelector('.interval-end');
            if (startInput && endInput && startInput.value && endInput.value) {
              if (startInput.value >= endInput.value) {
                alert(`Intervalo inválido para ${getDayName(i)}: início deve ser antes do fim!`);
                throw new Error('Invalid interval');
              }
              intervals.push({
                start: startInput.value,
                end: endInput.value
              });
            }
          });
        }
      }
      
      schedules[i] = {
        enabled,
        start,
        end,
        intervals
      };
    }
    
    const newConfig = {
      sessionDuration,
      enabledDays,
      schedules
    };
    
    await firebase.firestore().collection('system_config').doc('schedule').set(newConfig);
    scheduleConfig = newConfig;
    
    document.getElementById('scheduleConfigStatus').textContent = '✅ Configuração salva com sucesso!';
    setTimeout(() => {
      document.getElementById('scheduleConfigStatus').textContent = '';
    }, 3000);
    
    // Atualizar visualização se estiver no dashboard
    if (selectedDate) {
      await updateDayDetail();
    }
    
  } catch (error) {
    if (error.message !== 'Invalid interval') {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configuração!');
    }
  }
}

function renderScheduleConfig() {
  if (!scheduleConfig) return;
  
  // Renderizar duração
  document.getElementById('sessionDuration').value = scheduleConfig.sessionDuration;
  
  // Renderizar dias habilitados
  document.querySelectorAll('.day-checkbox').forEach(cb => {
    cb.checked = scheduleConfig.enabledDays.includes(parseInt(cb.value));
  });
  
  // Renderizar horários por dia
  renderDaySchedules();
  
  // Renderizar intervalos
  renderDayIntervals();
}

function renderDaySchedules() {
  const container = document.getElementById('dayScheduleContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  for (let i = 0; i < 7; i++) {
    const daySchedule = scheduleConfig.schedules[i];
    const enabled = scheduleConfig.enabledDays.includes(i);
    
    if (!enabled) continue;
    
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day-schedule-item';
    dayDiv.innerHTML = `
      <div class="day-schedule-header">
        <strong>${getDayName(i)}</strong>
      </div>
      <div class="row" style="margin-top:8px">
        <input type="time" id="day${i}Start" class="input" value="${daySchedule.start}" style="width:140px">
        <span style="padding:12px">até</span>
        <input type="time" id="day${i}End" class="input" value="${daySchedule.end}" style="width:140px">
      </div>
    `;
    container.appendChild(dayDiv);
  }
}

function renderDayIntervals() {
  const container = document.getElementById('dayIntervalContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Checkbox de aplicar intervalo global
  const applyToAll = document.getElementById('applyIntervalToAll');
  const globalConfig = document.getElementById('globalIntervalConfig');
  
  if (applyToAll && globalConfig) {
    applyToAll.addEventListener('change', function() {
      if (this.checked) {
        globalConfig.classList.remove('hidden');
        container.classList.add('hidden');
      } else {
        globalConfig.classList.add('hidden');
        container.classList.remove('hidden');
      }
    });
  }
  
  // Renderizar intervalos por dia
  for (let i = 0; i < 7; i++) {
    const daySchedule = scheduleConfig.schedules[i];
    const enabled = scheduleConfig.enabledDays.includes(i);
    
    if (!enabled) continue;
    
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day-interval-section';
    dayDiv.innerHTML = `
      <div class="day-interval-header">
        <strong>${getDayName(i)}</strong>
        <button type="button" class="btn btn-ghost btn-sm" onclick="addInterval(${i})">
          <i class="fas fa-plus"></i> Adicionar Intervalo
        </button>
      </div>
      <div id="day${i}Intervals" class="intervals-list"></div>
    `;
    container.appendChild(dayDiv);
    
    // Renderizar intervalos existentes
    const intervalsList = dayDiv.querySelector('.intervals-list');
    daySchedule.intervals.forEach((interval, idx) => {
      const intervalItem = document.createElement('div');
      intervalItem.className = 'interval-item';
      intervalItem.innerHTML = `
        <input type="time" class="input interval-start" value="${interval.start}" style="width:120px">
        <span style="padding:8px">até</span>
        <input type="time" class="input interval-end" value="${interval.end}" style="width:120px">
        <button type="button" class="btn btn-danger btn-sm" onclick="removeIntervalFromDOM(this)">
          <i class="fas fa-trash"></i>
        </button>
      `;
      intervalsList.appendChild(intervalItem);
    });
  }
}

function addInterval(dayIndex) {
  const intervalsList = document.getElementById(`day${dayIndex}Intervals`);
  if (!intervalsList) return;
  
  const intervalItem = document.createElement('div');
  intervalItem.className = 'interval-item';
  intervalItem.innerHTML = `
    <input type="time" class="input interval-start" value="12:00" style="width:120px">
    <span style="padding:8px">até</span>
    <input type="time" class="input interval-end" value="13:00" style="width:120px">
    <button type="button" class="btn btn-danger btn-sm" onclick="removeIntervalFromDOM(this)">
      <i class="fas fa-trash"></i>
    </button>
  `;
  intervalsList.appendChild(intervalItem);
}

function removeIntervalFromDOM(button) {
  if (confirm('Remover este intervalo?')) {
    button.parentElement.remove();
  }
}

function generateTimeSlotsForDay(date) {
  if (!scheduleConfig) return [];
  
  const dayOfWeek = date.getDay();
  const daySchedule = scheduleConfig.schedules[dayOfWeek];
  
  if (!daySchedule || !daySchedule.enabled) return [];
  
  const slots = [];
  const sessionDuration = scheduleConfig.sessionDuration;
  
  // Converter horários para minutos
  const [startHour, startMin] = daySchedule.start.split(':').map(Number);
  const [endHour, endMin] = daySchedule.end.split(':').map(Number);
  
  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  while (currentMinutes + sessionDuration <= endMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;
    
    // Verificar se está em algum intervalo
    const isInInterval = daySchedule.intervals.some(interval => {
      const [intStartHour, intStartMin] = interval.start.split(':').map(Number);
      const [intEndHour, intEndMin] = interval.end.split(':').map(Number);
      const intStart = intStartHour * 60 + intStartMin;
      const intEnd = intEndHour * 60 + intEndMin;
      return currentMinutes >= intStart && currentMinutes < intEnd;
    });
    
    if (!isInInterval) {
      slots.push({
        hour,
        minute,
        time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      });
    }
    
    currentMinutes += sessionDuration;
  }
  
  return slots;
}

// ====================
// GESTÃO DE CLIENTES
// ====================

function loadClientsUI() {
  const clientsArray = Object.values(allClients);
  
  if (clientsArray.length === 0) {
    clientsList.innerHTML = '<div class="small" style="text-align:center;padding:48px;color:var(--text-secondary)">Nenhum cliente cadastrado ainda</div>';
    return;
  }
  
  const searchTerm = clientSearchInput.value.toLowerCase().trim();
  const filtered = searchTerm 
    ? clientsArray.filter(c => 
        c.name.toLowerCase().includes(searchTerm) || 
        c.email.toLowerCase().includes(searchTerm) ||
        (c.phone && c.phone.includes(searchTerm))
      )
    : clientsArray;
  
  filtered.sort((a, b) => a.name.localeCompare(b.name));
  
  clientsList.innerHTML = '';
  
  if (filtered.length === 0) {
    clientsList.innerHTML = '<div class="small" style="text-align:center;padding:48px;color:var(--text-secondary)">Nenhum cliente encontrado</div>';
    return;
  }
  
  filtered.forEach(client => {
    const card = document.createElement('div');
    card.className = 'client-card';
    card.onclick = () => openClientDetail(client.userId);
    
    const age = calculateAge(client.birthdate);
    const appointmentCount = allAppointments.filter(a => a.userId === client.userId).length;
    
    card.innerHTML = `
      <div class="client-card-header">
        <div class="client-avatar">
          <i class="fas fa-user"></i>
        </div>
        <div class="client-card-info">
          <div class="client-card-name">${client.name}</div>
          <div class="client-card-meta">
            <span><i class="fas fa-phone"></i> ${maskPhone(client.phone) || 'Sem telefone'}</span>
            <span><i class="fas fa-birthday-cake"></i> ${age !== 'N/A' ? age + ' anos' : 'Idade não informada'}</span>
          </div>
        </div>
      </div>
      <div class="client-card-stats">
        <div class="client-stat">
          <span class="client-stat-value">${appointmentCount}</span>
          <span class="client-stat-label">Agendamento${appointmentCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
    `;
    
    clientsList.appendChild(card);
  });
}

function openClientDetail(userId) {
  const client = allClients[userId];
  if (!client) {
    alert('Cliente não encontrado');
    return;
  }
  
  const age = calculateAge(client.birthdate);
  const clientAppointments = allAppointments
    .filter(a => a.userId === userId)
    .sort((a, b) => b.start - a.start);
  
  const totalPaid = clientAppointments.filter(a => a.paid).length;
  const totalValue = clientAppointments.filter(a => a.paid).reduce((sum, a) => sum + Number(a.price), 0);
  
  // Calcular Top 3 Massagens do Cliente
  const typeCounts = {};
  clientAppointments.forEach(ap => {
    if (ap.paid || ap.status === 'REALIZADO' || ap.status === 'CONFIRMADO') {
      typeCounts[ap.typeName] = (typeCounts[ap.typeName] || 0) + 1;
    }
  });

  const top3Types = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  let top3HTML = '';
  if (top3Types.length > 0) {
    top3HTML = `
      <div class="client-detail-section">
        <h4><i class="fas fa-trophy"></i> Top 3 Massagens</h4>
        <div class="small" style="margin-bottom:12px">Tipos mais realizados por este cliente</div>
        ${top3Types.map((item, index) => {
          const percentage = (item[1] / Math.max(1, clientAppointments.filter(a => a.paid || a.status === 'REALIZADO' || a.status === 'CONFIRMADO').length)) * 100;
          return `
            <div class="ranking-item" style="padding: 10px; margin-bottom: 8px;">
              <div class="ranking-position" style="font-size: 1.2rem; min-width: 40px; padding: 8px;">${index + 1}º</div>
              <div class="ranking-info">
                <div class="ranking-name" style="font-size: 0.95rem;">${item[0]}</div>
                <div class="ranking-bar-container" style="height: 6px;">
                  <div class="ranking-bar" style="width: ${percentage}%"></div>
                </div>
              </div>
              <div class="ranking-stats" style="min-width: 60px;">
                <div class="ranking-count" style="font-size: 0.9rem;">${item[1]}x</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  clientModalTitle.textContent = client.name;
  
  let appointmentsHTML = '';
  if (clientAppointments.length === 0) {
    appointmentsHTML = '<div class="small" style="text-align:center;padding:24px;color:var(--text-secondary)">Nenhum agendamento ainda</div>';
  } else {
    appointmentsHTML = clientAppointments.map(ap => {
      const d = new Date(ap.start);
      const statusDisplay = getStatusDisplay(ap.status);
      return `
        <div class="client-appointment-item">
          <div class="client-appointment-date">
            <i class="fas fa-calendar"></i>
            ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            às ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
          </div>
          <div class="client-appointment-type">${ap.typeName}</div>
          <div class="client-appointment-footer">
            <span class="${getStatusBadgeClass(ap.status)}">${statusDisplay.icon} ${statusDisplay.text}</span>
            ${ap.paid ? '<span class="status-badge status-realizado">✓ Pago</span>' : ''}
            <span class="client-appointment-price">${formatMoney(ap.price)}</span>
          </div>
        </div>
      `;
    }).join('');
  }
  
  clientModalBody.innerHTML = `
    <div class="client-detail-section">
      <h4><i class="fas fa-info-circle"></i> Informações Pessoais</h4>
      <div class="client-detail-grid">
        <div class="client-detail-item">
          <span class="client-detail-label">Email:</span>
          <span class="client-detail-value">${client.email}</span>
        </div>
        <div class="client-detail-item">
          <span class="client-detail-label">Telefone:</span>
          <span class="client-detail-value">${maskPhone(client.phone) || 'Não informado'}</span>
        </div>
        <div class="client-detail-item">
          <span class="client-detail-label">CPF:</span>
          <span class="client-detail-value">${maskCpf(client.cpf) || 'Não informado'}</span>
        </div>
        <div class="client-detail-item">
          <span class="client-detail-label">Data de Nascimento:</span>
          <span class="client-detail-value">${client.birthdate || 'Não informada'} ${age !== 'N/A' ? '(' + age + ' anos)' : ''}</span>
        </div>
      </div>
    </div>
    
    ${client.address && (client.address.street || client.address.cep) ? `
    <div class="client-detail-section">
      <h4><i class="fas fa-map-marker-alt"></i> Endereço</h4>
      <div class="client-detail-grid">
        ${client.address.cep ? `
        <div class="client-detail-item">
          <span class="client-detail-label">CEP:</span>
          <span class="client-detail-value">${maskCep(client.address.cep)}</span>
        </div>` : ''}
        ${client.address.street ? `
        <div class="client-detail-item full-width">
          <span class="client-detail-label">Endereço:</span>
          <span class="client-detail-value">
            ${client.address.street}, ${client.address.number || 'S/N'}
            ${client.address.complement ? ' - ' + client.address.complement : ''}
          </span>
        </div>` : ''}
        ${client.address.neighborhood ? `
        <div class="client-detail-item">
          <span class="client-detail-label">Bairro:</span>
          <span class="client-detail-value">${client.address.neighborhood}</span>
        </div>` : ''}
        ${client.address.city ? `
        <div class="client-detail-item">
          <span class="client-detail-label">Cidade/UF:</span>
          <span class="client-detail-value">${client.address.city}${client.address.state ? '/' + client.address.state : ''}</span>
        </div>` : ''}
      </div>
    </div>` : ''}
    
    <div class="client-detail-section">
      <h4><i class="fas fa-chart-line"></i> Estatísticas</h4>
      <div class="client-stats-grid">
        <div class="client-stat-card">
          <div class="client-stat-icon">📅</div>
          <div class="client-stat-value">${clientAppointments.length}</div>
          <div class="client-stat-label">Total de Agendamentos</div>
        </div>
        <div class="client-stat-card">
          <div class="client-stat-icon">✓</div>
          <div class="client-stat-value">${totalPaid}</div>
          <div class="client-stat-label">Sessões Realizadas</div>
        </div>
        <div class="client-stat-card">
          <div class="client-stat-icon">💰</div>
          <div class="client-stat-value">${formatMoney(totalValue)}</div>
          <div class="client-stat-label">Total Gasto</div>
        </div>
      </div>
    </div>

    ${top3HTML}
    
    <div class="client-detail-section">
      <h4><i class="fas fa-calendar-check"></i> Histórico de Agendamentos</h4>
      <div class="client-appointments-list">
        ${appointmentsHTML}
      </div>
    </div>
  `;
  
  clientDetailModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeClientModal(event) {
  if (event && event.target !== clientDetailModal) return;
  clientDetailModal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

clientSearchInput.addEventListener('input', () => {
  loadClientsUI();
});

function openAddClientModal() {
  newClientName.value = '';
  newClientPhone.value = '';
  newClientCpf.value = '';
  newClientBirthdate.value = '';
  newClientEmail.value = '';
  newClientCep.value = '';
  newClientStreet.value = '';
  newClientNumber.value = '';
  newClientComplement.value = '';
  newClientNeighborhood.value = '';
  newClientCity.value = '';
  newClientState.value = '';
  
  addClientModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  newClientName.focus();
}

function closeAddClientModal(event) {
  if (event && event.target !== addClientModal) return;
  addClientModal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

async function searchCepNewClient() {
  const cep = unmaskCep(newClientCep.value);
  if (cep.length !== 8) {
    alert('CEP inválido. Digite um CEP com 8 dígitos.');
    return;
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    if (data.erro) {
      alert('CEP não encontrado.');
      return;
    }
    newClientStreet.value = data.logradouro || '';
    newClientNeighborhood.value = data.bairro || '';
    newClientCity.value = data.localidade || '';
    newClientState.value = data.uf || '';
    newClientNumber.focus();
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    alert('Erro ao buscar CEP. Tente novamente.');
  }
}

async function saveNewClient() {
  const name = newClientName.value.trim();
  const phone = newClientPhone.value.trim();
  
  if (!name) {
    alert('Nome é obrigatório');
    newClientName.focus();
    return;
  }
  
  if (!phone) {
    alert('Telefone é obrigatório');
    newClientPhone.focus();
    return;
  }
  
  const phoneNumbers = unmaskPhone(phone);
  if (phoneNumbers.length < 10) {
    alert('Telefone inválido. Digite um número completo com DDD.');
    newClientPhone.focus();
    return;
  }
  
  const cpf = newClientCpf.value.trim();
  if (cpf && !validateCpf(cpf)) {
    alert('CPF inválido. Verifique e tente novamente.');
    newClientCpf.focus();
    return;
  }
  
  const birthdate = newClientBirthdate.value.trim();
  if (birthdate && !validateDate(birthdate)) {
    alert('Data de nascimento inválida.');
    newClientBirthdate.focus();
    return;
  }
  
  try {
    const userId = uid();
    const clientData = {
      userId,
      name,
      phone,
      email: newClientEmail.value.trim() || '',
      cpf: cpf ? unmaskCpf(cpf) : '',
      birthdate: birthdate || '',
      address: {
        cep: newClientCep.value.trim() ? unmaskCep(newClientCep.value) : '',
        street: newClientStreet.value.trim() || '',
        number: newClientNumber.value.trim() || '',
        complement: newClientComplement.value.trim() || '',
        neighborhood: newClientNeighborhood.value.trim() || '',
        city: newClientCity.value.trim() || '',
        state: newClientState.value.trim().toUpperCase() || ''
      },
      createdAt: Date.now()
    };
    
    await firebase.firestore().collection('users').doc(userId).set(clientData);
    
    alert('✅ Cliente cadastrado com sucesso!');
    closeAddClientModal();
    loadClientsUI();
  } catch (error) {
    console.error('Erro ao salvar cliente:', error);
    alert('Erro ao cadastrar cliente. Tente novamente.');
  }
}

// ====================
// TIPOS DE MASSAGEM
// ====================

btnAddType.addEventListener('click', async () => {
  const name = typeName.value.trim();
  const priceValue = unmaskMoney(typePrice.value);
  
  if (!name || isNaN(priceValue) || priceValue <= 0) {
    alert('Preencha nome e valor válido');
    return;
  }
  
  try {
    if (editingTypeId) {
      const typeToEdit = allTypes.find(t => t.id === editingTypeId);
      if (typeToEdit) {
        typeToEdit.name = name;
        typeToEdit.price = Number(priceValue);
        await saveType(typeToEdit);
        alert('Tipo de massagem atualizado com sucesso!');
      }
    } else {
      const obj = {
        id: uid(),
        name,
        price: Number(priceValue),
        createdAt: Date.now()
      };
      await saveType(obj);
      alert('Tipo de massagem cadastrado com sucesso!');
    }
    
    cancelEditType();
    
  } catch (error) {
    console.error('Erro ao salvar tipo:', error);
    alert('Erro ao salvar tipo de massagem.');
  }
});

function editType(typeId) {
  const type = allTypes.find(t => t.id === typeId);
  if (!type) return;
  
  editingTypeId = typeId;
  typeName.value = type.name;
  typePrice.value = formatMoney(type.price);
  
  btnAddType.textContent = 'Atualizar Tipo';
  btnAddType.classList.remove('btn-primary');
  btnAddType.classList.add('btn-success');
  
  typeName.scrollIntoView({ behavior: 'smooth', block: 'center' });
  typeName.focus();
}

function cancelEditType() {
  editingTypeId = null;
  typeName.value = '';
  typePrice.value = '';
  btnAddType.textContent = 'Salvar tipo';
  btnAddType.classList.add('btn-primary');
  btnAddType.classList.remove('btn-success');
}

btnReloadTypes.addEventListener('click', () => {
  cancelEditType();
  loadTypesUI();
});

async function loadTypesUI() {
  try {
    typesList.innerHTML = '<div class="small">Carregando...</div>';
    
    if (allTypes.length === 0) {
      typesList.innerHTML = '<div class="small">Nenhum tipo cadastrado</div>';
      return;
    }
    
    typesList.innerHTML = '';
    allTypes.sort((a, b) => a.name.localeCompare(b.name));
    
    allTypes.forEach(t => {
      const div = document.createElement('div');
      div.className = 'card';
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';
      div.style.gap = '12px';
      
      const info = document.createElement('div');
      info.style.flex = '1';
      info.innerHTML = `
        <div style="font-weight:800">${t.name}</div>
        <div class="small">${formatMoney(t.price)}</div>
      `;
      
      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '8px';
      actions.style.flexWrap = 'wrap';
      
      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn btn-ghost btn-sm';
      btnEdit.textContent = 'Editar';
      btnEdit.onclick = () => editType(t.id);
      
      const btnDel = document.createElement('button');
      btnDel.className = 'btn btn-danger btn-sm';
      btnDel.textContent = 'Excluir';
      btnDel.onclick = async () => {
        if (confirm('Excluir tipo? Isso não remove agendamentos existentes.')) {
          try {
            await deleteType(t.id);
            if (editingTypeId === t.id) {
              cancelEditType();
            }
            alert('Tipo excluído com sucesso!');
          } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Erro ao excluir tipo.');
          }
        }
      };
      
      actions.appendChild(btnEdit);
      actions.appendChild(btnDel);
      
      div.appendChild(info);
      div.appendChild(actions);
      typesList.appendChild(div);
    });
  } catch (error) {
    console.error('Erro ao carregar tipos:', error);
    typesList.innerHTML = '<div class="small">Erro ao carregar tipos</div>';
  }
}

// ====================
// AGENDAMENTOS
// ====================

function getStatusBadgeClass(status) {
  const statusLower = status.toLowerCase();
  return `status-badge status-${statusLower}`;
}

function getStatusDisplay(status) {
  const displays = {
    'PENDENTE': { icon: '⏳', text: 'PENDENTE' },
    'CONFIRMADO': { icon: '✓', text: 'CONFIRMADO' },
    'REALIZADO': { icon: '✓', text: 'REALIZADO' },
    'CANCELADO': { icon: '✗', text: 'CANCELADO' }
  };
  return displays[status] || { icon: '', text: status };
}

function setupPeriodFilters() {
  const periodButtons = document.querySelectorAll('.period-btn');
  
  periodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      periodButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriodFilter = btn.dataset.period;
      
      const customPeriodFilters = document.getElementById('customPeriodFilters');
      if (currentPeriodFilter === 'custom') {
        customPeriodFilters.classList.remove('hidden');
      } else {
        customPeriodFilters.classList.add('hidden');
        customDateStart = null;
        customDateEnd = null;
        loadAppointmentsUI();
      }
    });
  });
}

function setupFinancePeriodFilters() {
  const periodButtons = document.querySelectorAll('.finance-period-btn');
  
  periodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      periodButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFinancePeriodFilter = btn.dataset.period;
      
      const customFinancePeriodFilters = document.getElementById('customFinancePeriodFilters');
      if (currentFinancePeriodFilter === 'custom') {
        customFinancePeriodFilters.classList.remove('hidden');
      } else {
        customFinancePeriodFilters.classList.add('hidden');
        customFinanceDateStart = null;
        customFinanceDateEnd = null;
        computeFinanceData();
      }
    });
  });
}

function applyCustomPeriod() {
  const startInput = document.getElementById('filterDateStart');
  const endInput = document.getElementById('filterDateEnd');
  
  if (!startInput.value || !endInput.value) {
    alert('Preencha ambas as datas!');
    return;
  }
  
  customDateStart = new Date(startInput.value + 'T00:00:00');
  customDateEnd = new Date(endInput.value + 'T23:59:59');
  
  if (customDateStart > customDateEnd) {
    alert('A data de início deve ser anterior à data de fim!');
    return;
  }
  
  loadAppointmentsUI();
}

function applyCustomFinancePeriod() {
  const startInput = document.getElementById('financeFilterDateStart');
  const endInput = document.getElementById('financeFilterDateEnd');
  
  if (!startInput.value || !endInput.value) {
    alert('Preencha ambas as datas!');
    return;
  }
  
  customFinanceDateStart = new Date(startInput.value + 'T00:00:00');
  customFinanceDateEnd = new Date(endInput.value + 'T23:59:59');
  
  if (customFinanceDateStart > customFinanceDateEnd) {
    alert('A data de início deve ser anterior à data de fim!');
    return;
  }
  
  computeFinanceData();
}

function setupStatusFilters() {
  const filterButtons = document.querySelectorAll('.filter-status-btn');
  
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentStatusFilter = btn.dataset.filter;
      loadAppointmentsUI();
    });
  });
}

function filterAppointmentsByPeriod(appointments, periodFilter, customStart, customEnd) {
  let filtered = appointments.slice();
  
  if (periodFilter === 'current-week') {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    filtered = filtered.filter(a => a.start >= startOfWeek.getTime() && a.start < endOfWeek.getTime());
  } else if (periodFilter === 'current-month') {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
    
    filtered = filtered.filter(a => a.start >= startOfMonth && a.start <= endOfMonth);
  } else if (periodFilter === 'custom' && customStart && customEnd) {
    filtered = filtered.filter(a => {
      return a.start >= customStart.getTime() && a.start <= customEnd.getTime();
    });
  }
  
  return filtered;
}

async function loadAppointmentsUI() {
  try {
    appointmentsList.innerHTML = '';
    
    if (allAppointments.length === 0) {
      appointmentsList.innerHTML = '<div class="small">Sem agendamentos</div>';
      return;
    }
    
    let filtered = filterAppointmentsByPeriod(allAppointments, currentPeriodFilter, customDateStart, customDateEnd);

    if (currentStatusFilter !== 'todos') {
      if (currentStatusFilter === 'pago') {
        filtered = filtered.filter(a => a.paid === true);
      } else if (currentStatusFilter === 'nao-pago') {
        filtered = filtered.filter(a => a.paid === false);
      } else {
        filtered = filtered.filter(a => a.status === currentStatusFilter);
      }
    }

    filtered.sort((a, b) => a.start - b.start);
    
    if (filtered.length === 0) {
      appointmentsList.innerHTML = '<div class="small" style="text-align:center;padding:32px;color:var(--text-secondary)">Nenhum agendamento encontrado com os filtros selecionados</div>';
      return;
    }
    
    filtered.forEach(ap => {
      const div = document.createElement('div');
      div.className = 'card appointment-card';
      
      const d = new Date(ap.start);
      const left = document.createElement('div');
      left.style.flex = '1';
      
      const client = allClients[ap.userId];
      const clientAge = client ? calculateAge(client.birthdate) : '';
      const ageDisplay = clientAge && clientAge !== 'N/A' ? ` (${clientAge} anos)` : '';
      
      const clientNameHTML = `<span class="clickable-client-name" onclick="openClientDetail('${ap.userId}')" title="Ver detalhes do cliente">${ap.clientName}${ageDisplay}</span>`;
      
      let noteHTML = '';
      if (ap.note) {
        noteHTML = `<div class="small" style="margin-top:6px"><strong>Obs cliente:</strong> ${ap.note}</div>`;
      }
      if (ap.cancellationReason) {
        noteHTML += `<div class="small" style="margin-top:6px;color:#991b1b"><strong>Motivo cancelamento:</strong> ${ap.cancellationReason}</div>`;
      }
      
      left.innerHTML = `
        <div style="font-weight:800">${ap.typeName} • ${formatMoney(ap.price)}</div>
        <div class="small" style="margin-top:4px">${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} — ${clientNameHTML}${ap.clientPhone?' • '+ap.clientPhone:''}</div>
        ${noteHTML}
      `;
      
      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.flexDirection = 'column';
      right.style.gap = '8px';
      
      const statusSelect = document.createElement('select');
      statusSelect.className = 'status-select';
      statusSelect.style.background = getStatusColor(ap.status);
      statusSelect.style.color = getStatusTextColor(ap.status);
      statusSelect.innerHTML = `
        <option value="PENDENTE" ${ap.status === 'PENDENTE' ? 'selected' : ''}>⏳ Pendente</option>
        <option value="CONFIRMADO" ${ap.status === 'CONFIRMADO' ? 'selected' : ''}>✓ Confirmado</option>
        <option value="REALIZADO" ${ap.status === 'REALIZADO' ? 'selected' : ''}>✓ Realizado</option>
        <option value="CANCELADO" ${ap.status === 'CANCELADO' ? 'selected' : ''}>✗ Cancelado</option>
      `;
      statusSelect.onchange = async () => {
        const newStatus = statusSelect.value;
        if (newStatus === 'CANCELADO' && ap.status !== 'CANCELADO') {
          const reason = prompt('Informe o motivo do cancelamento (obrigatório):');
          if (reason && reason.trim()) {
            ap.status = newStatus;
            ap.cancellationReason = reason.trim();
            try {
              await saveAppointment(ap);
              loadAppointmentsUI();
            } catch (error) {
              console.error('Erro ao atualizar status:', error);
              alert('Erro ao atualizar status.');
            }
          } else if (reason !== null) {
            alert('O motivo do cancelamento é obrigatório!');
            statusSelect.value = ap.status;
          } else {
            statusSelect.value = ap.status;
          }
        } else {
          ap.status = newStatus;
          try {
            await saveAppointment(ap);
            loadAppointmentsUI();
          } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao atualizar status.');
          }
        }
      };
      
      const btnPaid = document.createElement('button');
      btnPaid.className = ap.paid ? 'btn btn-success btn-sm' : 'btn btn-ghost btn-sm';
      btnPaid.textContent = ap.paid ? '✓ Pago' : 'Marcar pago';
      btnPaid.onclick = async () => {
        ap.paid = !ap.paid;
        try {
          await saveAppointment(ap);
          loadAppointmentsUI();
        } catch (error) {
          console.error('Erro ao atualizar pagamento:', error);
          alert('Erro ao atualizar pagamento.');
        }
      };
      
      right.appendChild(statusSelect);
      right.appendChild(btnPaid);
      
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';
      div.appendChild(left);
      div.appendChild(right);
      appointmentsList.appendChild(div);
    });
  } catch (error) {
    console.error('Erro ao carregar agendamentos:', error);
  }
}

function getStatusColor(status) {
  const colors = {
    'PENDENTE': '#fef3c7',
    'CONFIRMADO': '#d1fae5',
    'REALIZADO': '#dbeafe',
    'CANCELADO': '#fee2e2'
  };
  return colors[status] || '#f5f5f5';
}

function getStatusTextColor(status) {
  const colors = {
    'PENDENTE': '#92400e',
    'CONFIRMADO': '#065f46',
    'REALIZADO': '#1e40af',
    'CANCELADO': '#991b1b'
  };
  return colors[status] || '#000000';
}

function openNewAppointmentModal() {
  // Limpar campos
  appointmentClientName.value = '';
  appointmentClientPhone.value = '';
  appointmentPhoneContainer.classList.add('hidden');
  clientSuggestions.classList.add('hidden');
  appointmentMassageType.value = '';
  appointmentPrice.textContent = 'R$ 0,00';
  appointmentNote.value = '';
  appointmentSelectedHour = null;
  selectedClientId = null;
  
  // Carregar tipos de massagem
  loadAppointmentTypes();
  
  // AJUSTE AQUI: Selecionar data atual automaticamente
  appointmentCurrentMonth = new Date();
  appointmentSelectedDate = new Date();
  appointmentSelectedDate.setHours(0, 0, 0, 0);
  
  // Renderizar calendário
  renderAppointmentCalendar();
  
  // NOVO: Carregar horários automaticamente para hoje
  loadAppointmentTimeSlots();
  
  newAppointmentModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  appointmentClientName.focus();
}

function closeNewAppointmentModal(event) {
  if (event && event.target !== newAppointmentModal) return;
  newAppointmentModal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

// Autocompletar cliente
appointmentClientName.addEventListener('input', function() {
  const searchTerm = this.value.trim().toLowerCase();
  
  if (searchTerm.length < 2) {
    clientSuggestions.classList.add('hidden');
    appointmentPhoneContainer.classList.add('hidden');
    selectedClientId = null;
    return;
  }
  
  const matches = Object.values(allClients).filter(c =>
    c.name.toLowerCase().includes(searchTerm)
  ).slice(0, 5);
  
  if (matches.length > 0) {
    clientSuggestions.innerHTML = '';
    matches.forEach(client => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.innerHTML = `
        <div style="font-weight:700">${client.name}</div>
        <div class="small">${maskPhone(client.phone)}</div>
      `;
      item.onclick = () => {
        appointmentClientName.value = client.name;
        selectedClientId = client.userId;
        appointmentClientPhone.value = client.phone;
        clientSuggestions.classList.add('hidden');
        appointmentPhoneContainer.classList.add('hidden');
      };
      clientSuggestions.appendChild(item);
    });
    clientSuggestions.classList.remove('hidden');
    appointmentPhoneContainer.classList.add('hidden');
  } else {
    clientSuggestions.classList.add('hidden');
    appointmentPhoneContainer.classList.remove('hidden');
    selectedClientId = null;
  }
});

// Fechar sugestões ao clicar fora
document.addEventListener('click', function(e) {
  if (!appointmentClientName.contains(e.target) && !clientSuggestions.contains(e.target)) {
    clientSuggestions.classList.add('hidden');
  }
});

function loadAppointmentTypes() {
  appointmentMassageType.innerHTML = '<option value="">Selecione o tipo</option>';
  allTypes.sort((a, b) => a.name.localeCompare(b.name));
  allTypes.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.name;
    opt.dataset.price = t.price;
    appointmentMassageType.appendChild(opt);
  });
}

appointmentMassageType.addEventListener('change', function() {
  const sel = this.value;
  if (!sel) {
    appointmentPrice.textContent = 'R$ 0,00';
    return;
  }
  const opt = this.querySelector(`option[value="${sel}"]`);
  const price = opt ? opt.dataset.price || 0 : 0;
  appointmentPrice.textContent = formatMoney(price || 0);
});

function renderAppointmentCalendar() {
  appointmentCalendar.innerHTML = '';
  
  const header = document.createElement('div');
  header.className = 'calendar-header';
  
  const btnPrev = document.createElement('button');
  btnPrev.className = 'btn-nav';
  btnPrev.innerHTML = '◀';
  btnPrev.onclick = () => {
    appointmentCurrentMonth.setMonth(appointmentCurrentMonth.getMonth() - 1);
    renderAppointmentCalendar();
  };
  
  const monthTitle = document.createElement('div');
  monthTitle.className = 'month-title';
  monthTitle.textContent = appointmentCurrentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  
  const btnNext = document.createElement('button');
  btnNext.className = 'btn-nav';
  btnNext.innerHTML = '▶';
  btnNext.onclick = () => {
    appointmentCurrentMonth.setMonth(appointmentCurrentMonth.getMonth() + 1);
    renderAppointmentCalendar();
  };
  
  header.appendChild(btnPrev);
  header.appendChild(monthTitle);
  header.appendChild(btnNext);
  appointmentCalendar.appendChild(header);
  
  const weekDays = document.createElement('div');
  weekDays.className = 'weekdays-header';
  ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach(day => {
    const dayEl = document.createElement('div');
    dayEl.className = 'weekday-label';
    dayEl.textContent = day;
    weekDays.appendChild(dayEl);
  });
  appointmentCalendar.appendChild(weekDays);
  
  const daysGrid = document.createElement('div');
  daysGrid.className = 'calendar-grid';
  
  const firstDay = new Date(appointmentCurrentMonth.getFullYear(), appointmentCurrentMonth.getMonth(), 1);
  const lastDay = new Date(appointmentCurrentMonth.getFullYear(), appointmentCurrentMonth.getMonth() + 1, 0);
  const firstWeekDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  for (let i = 0; i < firstWeekDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day empty';
    daysGrid.appendChild(emptyCell);
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(appointmentCurrentMonth.getFullYear(), appointmentCurrentMonth.getMonth(), day);
    dayDate.setHours(0, 0, 0, 0);
    
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    
    if (dayDate < today) {
      dayCell.classList.add('past');
      dayCell.textContent = day;
    } else {
      dayCell.classList.add('available');
      dayCell.textContent = day;
      if (dayDate.getTime() === today.getTime()) dayCell.classList.add('today');
      if (appointmentSelectedDate && dayDate.getTime() === appointmentSelectedDate.getTime()) {
        dayCell.classList.add('selected');
      }
      dayCell.onclick = () => selectAppointmentDate(dayDate);
    }
    
    daysGrid.appendChild(dayCell);
  }
  
  appointmentCalendar.appendChild(daysGrid);
}

async function selectAppointmentDate(date) {
  appointmentSelectedDate = new Date(date);
  appointmentSelectedDate.setHours(0, 0, 0, 0);
  appointmentSelectedHour = null;
  renderAppointmentCalendar();
  await loadAppointmentTimeSlots();
}

async function loadAppointmentTimeSlots() {
  if (!appointmentSelectedDate) {
    appointmentTimeSlotsSection.classList.add('hidden');
    return;
  }
  
  appointmentTimeSlotsSection.classList.remove('hidden');
  appointmentTimeSlots.innerHTML = '<div class="loading">Carregando horários...</div>';
  
  try {
    // Gerar slots baseado na configuração
    const slots = generateTimeSlotsForDay(appointmentSelectedDate);
    
    // ADICIONE ESTA VERIFICAÇÃO:
    if (slots.length === 0) {
      appointmentTimeSlots.innerHTML = `
        <div class="card" style="background: linear-gradient(135deg, #fee2e2, #fecaca); border: 2px solid #ef4444; padding: 20px; text-align: center; margin-top: 12px;">
          <i class="fas fa-times-circle" style="font-size: 2.5rem; color: #991b1b; margin-bottom: 12px;"></i>
          <div style="font-weight: 700; font-size: 1rem; color: #991b1b; margin-bottom: 8px;">
            Este dia não está disponível para agendamentos.
          </div>
          <div class="small" style="color: #7f1d1d;">
            Selecione outro dia ou configure os horários de atendimento.
          </div>
        </div>
      `;
      return;
    }
    
    const dateStr = toDateStr(appointmentSelectedDate);
    const dayAvailability = await getDayAvailability(dateStr);
    const dayAppointments = allAppointments.filter(ap => {
      const apDate = new Date(ap.start);
      return apDate.toDateString() === appointmentSelectedDate.toDateString();
    });
    
    appointmentTimeSlots.innerHTML = '';
    const now = new Date();
    const isToday = appointmentSelectedDate.toDateString() === now.toDateString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    let hasAvailableSlots = false;
    
    slots.forEach(slot => {
      const slotDate = new Date(appointmentSelectedDate);
      slotDate.setHours(slot.hour, slot.minute, 0, 0);
      
      const isPastHour = isToday && (slot.hour < currentHour || (slot.hour === currentHour && slot.minute <= currentMinute));
      
      // Pular horários passados
      if (isPastHour) return;
      
      const key = `${slot.hour}:${slot.minute}`;
      const isDisabled = dayAvailability[key] === false;
      
      const isBooked = dayAppointments.some(ap => {
        const apDate = new Date(ap.start);
        return apDate.getHours() === slot.hour && apDate.getMinutes() === slot.minute;
      });
      
      if (isBooked || isDisabled) return;
      
      hasAvailableSlots = true;
      const slotEl = document.createElement('div');
      slotEl.className = 'time-slot';
      if (appointmentSelectedHour === slot.hour) slotEl.classList.add('selected');
      
      const timeLabel = document.createElement('div');
      timeLabel.className = 'time-label';
      timeLabel.textContent = slot.time;
      
      const statusLabel = document.createElement('div');
      statusLabel.className = 'status-label available';
      statusLabel.textContent = 'Disponível';
      
      slotEl.appendChild(timeLabel);
      slotEl.appendChild(statusLabel);
      slotEl.onclick = () => selectAppointmentTimeSlot(slot.hour, slotEl);
      appointmentTimeSlots.appendChild(slotEl);
    });
    
    // SUBSTITUA O BLOCO EXISTENTE POR ESTE:
    if (!hasAvailableSlots) {
      appointmentTimeSlots.innerHTML = `
        <div class="card" style="background: linear-gradient(135deg, #fee2e2, #fecaca); border: 2px solid #ef4444; padding: 20px; text-align: center; margin-top: 12px;">
          <i class="fas fa-clock" style="font-size: 2.5rem; color: #991b1b; margin-bottom: 12px;"></i>
          <div style="font-weight: 700; font-size: 1rem; color: #991b1b; margin-bottom: 8px;">
            ${isToday ? 'Horário de atendimento encerrado.' : 'Nenhum horário disponível neste dia.'}
          </div>
          <div class="small" style="color: #7f1d1d;">
            ${isToday ? 'Todos os horários de hoje já passaram. Selecione outro dia.' : 'Todos os horários estão ocupados ou desabilitados.'}
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Erro ao carregar horários:', error);
    appointmentTimeSlots.innerHTML = '<div class="error">Erro ao carregar horários</div>';
  }
}

function selectAppointmentTimeSlot(hour, slotElement) {
  appointmentSelectedHour = hour;
  document.querySelectorAll('#appointmentTimeSlots .time-slot').forEach(slot => {
    slot.classList.remove('selected');
  });
  slotElement.classList.add('selected');
}

async function saveNewAppointment() {
  const clientName = appointmentClientName.value.trim();
  const clientPhone = appointmentClientPhone.value.trim();
  const typeId = appointmentMassageType.value;
  
  if (!clientName) {
    alert('Por favor, preencha o nome do cliente.');
    appointmentClientName.focus();
    return;
  }
  
  // Se não selecionou um cliente existente, verificar telefone
  if (!selectedClientId) {
    if (!clientPhone) {
      alert('Por favor, preencha o telefone do cliente.');
      appointmentClientPhone.focus();
      return;
    }
    const phoneNumbers = unmaskPhone(clientPhone);
    if (phoneNumbers.length < 10) {
      alert('Telefone inválido. Digite um número completo com DDD.');
      appointmentClientPhone.focus();
      return;
    }
  }
  
  if (!typeId) {
    alert('Por favor, selecione o tipo de massagem.');
    appointmentMassageType.focus();
    return;
  }
  
  if (!appointmentSelectedDate) {
    alert('Por favor, selecione uma data.');
    return;
  }
  
  if (appointmentSelectedHour === null) {
    alert('Por favor, selecione um horário.');
    return;
  }
  
  const type = allTypes.find(t => t.id === typeId);
  if (!type) {
    alert('Tipo inválido. Por favor, recarregue a página.');
    return;
  }
  
  try {
    let finalClientId = selectedClientId;
    let finalClientPhone = clientPhone;
    
    // Se não selecionou um cliente existente, cadastrar
    if (!selectedClientId) {
      finalClientId = uid();
      const newClientData = {
        userId: finalClientId,
        name: clientName,
        phone: clientPhone,
        email: '',
        cpf: '',
        birthdate: '',
        address: {
          cep: '',
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: ''
        },
        createdAt: Date.now()
      };
      
      await firebase.firestore().collection('users').doc(finalClientId).set(newClientData);
      console.log('✅ Novo cliente cadastrado:', clientName);
    } else {
      // Cliente existente - pegar telefone
      const client = allClients[selectedClientId];
      finalClientPhone = client.phone;
    }
    
    const startTs = new Date(appointmentSelectedDate);
    startTs.setHours(appointmentSelectedHour, 0, 0, 0);
    const endTs = startTs.getTime() + 60 * 60 * 1000;
    
    const appointment = {
      id: uid(),
      userId: finalClientId,
      clientName: clientName,
      clientPhone: finalClientPhone,
      typeId: type.id,
      typeName: type.name,
      price: Number(type.price),
      start: startTs.getTime(),
      end: endTs,
      note: appointmentNote.value.trim() || '',
      status: 'PENDENTE',
      paid: false,
      createdAt: Date.now()
    };
    
    await saveAppointment(appointment);
    
    alert('🎉 Agendamento realizado com sucesso!');
    closeNewAppointmentModal();
    loadAppointmentsUI();
  } catch (error) {
    console.error('Erro ao salvar agendamento:', error);
    alert('Erro ao realizar agendamento. Tente novamente.');
  }
}

// ====================
// FINANÇAS
// ====================

function computeFinanceData() {
  let filtered = filterAppointmentsByPeriod(allAppointments, currentFinancePeriodFilter, customFinanceDateStart, customFinanceDateEnd);
  
  const paid = filtered.filter(a => a.paid === true);
  
  const quantidade = paid.length;
  const total = paid.reduce((sum, a) => sum + Number(a.price), 0);
  const ticketMedio = quantidade > 0 ? total / quantidade : 0;
  
  financeTicketMedio.textContent = formatMoney(ticketMedio);
  financeQuantidade.textContent = quantidade;
  financeTotal.textContent = formatMoney(total);
  
  // Ranking de Massagens
  const typeCount = {};
  // Ranking de Clientes (Ticket Médio)
  const clientStats = {};

  paid.forEach(a => {
    // Para ranking de massagens
    if (!typeCount[a.typeName]) {
      typeCount[a.typeName] = 0;
    }
    typeCount[a.typeName]++;

    // Para ranking de clientes
    if (!clientStats[a.userId]) {
      clientStats[a.userId] = {
        name: a.clientName || 'Cliente',
        totalSpent: 0,
        sessions: 0,
        userId: a.userId
      };
    }
    clientStats[a.userId].totalSpent += Number(a.price);
    clientStats[a.userId].sessions++;
  });
  
  // Renderizar Ranking de Massagens
  const ranking = Object.entries(typeCount)
    .map(([name, count]) => ({
      name,
      count,
      percentage: (count / quantidade) * 100
    }))
    .sort((a, b) => b.count - a.count);
  
  massageRanking.innerHTML = '';
  
  if (ranking.length === 0) {
    massageRanking.innerHTML = '<div class="small" style="text-align:center;padding:24px;color:var(--text-secondary)">Nenhuma massagem paga no período selecionado</div>';
  } else {
    ranking.forEach((item, index) => {
      const rankItem = document.createElement('div');
      rankItem.className = 'ranking-item';
      
      const position = document.createElement('div');
      position.className = 'ranking-position';
      position.textContent = `${index + 1}º`;
      
      const info = document.createElement('div');
      info.className = 'ranking-info';
      
      const name = document.createElement('div');
      name.className = 'ranking-name';
      name.textContent = item.name;
      
      const barContainer = document.createElement('div');
      barContainer.className = 'ranking-bar-container';
      
      const bar = document.createElement('div');
      bar.className = 'ranking-bar';
      bar.style.width = `${item.percentage}%`;
      
      barContainer.appendChild(bar);
      info.appendChild(name);
      info.appendChild(barContainer);
      
      const stats = document.createElement('div');
      stats.className = 'ranking-stats';
      stats.innerHTML = `
        <div class="ranking-percentage">${item.percentage.toFixed(1)}%</div>
        <div class="ranking-count">${item.count} sessõ${item.count > 1 ? 'es' : 'ão'}</div>
      `;
      
      rankItem.appendChild(position);
      rankItem.appendChild(info);
      rankItem.appendChild(stats);
      massageRanking.appendChild(rankItem);
    });
  }

  // Renderizar Ranking de Clientes (Top 5 Ticket Médio)
  const clientRankingList = Object.values(clientStats)
    .map(c => ({
      ...c,
      avgTicket: c.totalSpent / c.sessions
    }))
    .sort((a, b) => b.avgTicket - a.avgTicket)
    .slice(0, 5);

  clientRanking.innerHTML = '';

  if (clientRankingList.length === 0) {
    clientRanking.innerHTML = '<div class="small" style="text-align:center;padding:24px;color:var(--text-secondary)">Nenhum dado disponível no período</div>';
  } else {
    const maxAvg = clientRankingList[0].avgTicket;
    
    clientRankingList.forEach((item, index) => {
      const rankItem = document.createElement('div');
      rankItem.className = 'ranking-item';
      
      const position = document.createElement('div');
      position.className = 'ranking-position';
      position.textContent = `${index + 1}º`;
      
      const info = document.createElement('div');
      info.className = 'ranking-info';
      
      // Nome clicável
      const name = document.createElement('div');
      name.className = 'ranking-name clickable-client-name';
      name.textContent = item.name;
      name.onclick = () => openClientDetail(item.userId);
      name.title = 'Ver cadastro do cliente';
      
      const barContainer = document.createElement('div');
      barContainer.className = 'ranking-bar-container';
      
      const bar = document.createElement('div');
      bar.className = 'ranking-bar';
      // Barra proporcional ao maior ticket médio da lista
      const percentage = (item.avgTicket / maxAvg) * 100;
      bar.style.width = `${percentage}%`;
      
      barContainer.appendChild(bar);
      info.appendChild(name);
      info.appendChild(barContainer);
      
      const stats = document.createElement('div');
      stats.className = 'ranking-stats';
      stats.style.minWidth = '100px';
      stats.innerHTML = `
        <div class="ranking-percentage" style="font-size: 1rem;">${formatMoney(item.avgTicket)}</div>
        <div class="ranking-count">${item.sessions} sessõ${item.sessions > 1 ? 'es' : 'ão'}</div>
      `;
      
      rankItem.appendChild(position);
      rankItem.appendChild(info);
      rankItem.appendChild(stats);
      clientRanking.appendChild(rankItem);
    });
  }
}

// ====================
// CALENDÁRIO
// ====================

function getStatusColor(status) {
  const colors = {
    'PENDENTE': '#fef3c7',
    'CONFIRMADO': '#d1fae5',
    'REALIZADO': '#dbeafe',
    'CANCELADO': '#fee2e2'
  };
  return colors[status] || '#f5f5f5';
}

function getStatusTextColor(status) {
  const colors = {
    'PENDENTE': '#92400e',
    'CONFIRMADO': '#065f46',
    'REALIZADO': '#1e40af',
    'CANCELADO': '#991b1b'
  };
  return colors[status] || '#000000';
}

function renderCalendar() {
  calendarClient.innerHTML = '';
  
  const header = document.createElement('div');
  header.className = 'calendar-header';
  
  const btnPrev = document.createElement('button');
  btnPrev.className = 'btn-nav';
  btnPrev.innerHTML = '◀';
  btnPrev.onclick = () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
  };
  
  const monthTitle = document.createElement('div');
  monthTitle.className = 'month-title';
  monthTitle.textContent = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  
  const btnNext = document.createElement('button');
  btnNext.className = 'btn-nav';
  btnNext.innerHTML = '▶';
  btnNext.onclick = () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
  };
  
  header.appendChild(btnPrev);
  header.appendChild(monthTitle);
  header.appendChild(btnNext);
  calendarClient.appendChild(header);
  
  const weekDays = document.createElement('div');
  weekDays.className = 'weekdays-header';
  ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach(day => {
    const dayEl = document.createElement('div');
    dayEl.className = 'weekday-label';
    dayEl.textContent = day;
    weekDays.appendChild(dayEl);
  });
  calendarClient.appendChild(weekDays);
  
  const daysGrid = document.createElement('div');
  daysGrid.className = 'calendar-grid';
  
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const firstWeekDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  for (let i = 0; i < firstWeekDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day empty';
    daysGrid.appendChild(emptyCell);
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    dayDate.setHours(0, 0, 0, 0);
    
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day available';
    dayCell.textContent = day;
    
    if (dayDate.getTime() === today.getTime()) {
      dayCell.classList.add('today');
    }
    
    if (selectedDate && dayDate.getTime() === selectedDate.getTime()) {
      dayCell.classList.add('selected');
    }
    
    const dayAppts = allAppointments.filter(a => {
      const d = new Date(a.start);
      return d.toDateString() === dayDate.toDateString();
    });
    
    if (dayAppts.length > 0) {
      const badge = document.createElement('div');
      badge.className = 'day-badge';
      badge.textContent = dayAppts.length;
      dayCell.appendChild(badge);
    }
    
    dayCell.onclick = () => selectDate(dayDate);
    
    daysGrid.appendChild(dayCell);
  }
  
  calendarClient.appendChild(daysGrid);
}

function renderWeek() {
  weekContainer.innerHTML = '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i <= 6; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    
    const div = document.createElement('div');
    div.className = 'week-day card';
    
    const isSelected = (selectedDate && selectedDate.toDateString() === d.toDateString());
    const isToday = (d.toDateString() === today.toDateString());
    
    if (isSelected) div.classList.add('selected');
    if (isToday) div.classList.add('today');
    
    const header = document.createElement('div');
    header.style.fontWeight = '800';
    header.style.marginBottom = '8px';
    header.textContent = d.toLocaleDateString('pt-BR', {weekday:'short', day:'numeric', month:'short'});
    div.appendChild(header);
    
    const appts = allAppointments.filter(a => {
      const dd = new Date(a.start);
      return dd.toDateString() === d.toDateString();
    }).sort((a, b) => a.start - b.start);
    
    if (appts.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'small';
      empty.style.fontStyle = 'italic';
      empty.style.color = '#9ca3af';
      empty.textContent = 'Sem reservas';
      div.appendChild(empty);
    } else {
      appts.slice(0, 3).forEach(a => {
        const el = document.createElement('div');
        el.className = 'small';
        const dd = new Date(a.start);
        el.textContent = `${dd.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} • ${a.typeName}`;
        div.appendChild(el);
      });
      
      if (appts.length > 3) {
        const more = document.createElement('div');
        more.className = 'small';
        more.style.fontWeight = '600';
        more.style.marginTop = '4px';
        more.textContent = `+ ${appts.length - 3} mais`;
        div.appendChild(more);
      }
    }
    
    div.addEventListener('click', () => selectDate(d));
    weekContainer.appendChild(div);
  }
}

async function selectDate(date) {
  selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);
  
  if (viewMode.value === 'month') {
    renderCalendar();
  } else {
    renderWeek();
  }
  
  await updateDayDetail();
}

async function updateDayDetail() {
  if (!selectedDate) {
    dayDetail.classList.add('hidden');
    return;
  }
  
  dayDetail.classList.remove('hidden');
  
  selectedDayTitle.textContent = selectedDate.toLocaleDateString('pt-BR', {weekday:'long', day:'2-digit', month:'long', year:'numeric'});
  selectedDaySub.textContent = '';
  
  hourlyList.innerHTML = '';

  const slots = generateTimeSlotsForDay(selectedDate);
  
  if (slots.length === 0) {
    hourlyList.innerHTML = `
      <div class="card" style="background: linear-gradient(135deg, #fee2e2, #fecaca); border: 2px solid #ef4444; padding: 20px; text-align: center;">
        <i class="fas fa-times-circle" style="font-size: 3rem; color: #991b1b; margin-bottom: 12px;"></i>
        <div style="font-weight: 700; font-size: 1.1rem; color: #991b1b; margin-bottom: 8px;">
          Este dia não está disponível para agendamentos.
        </div>
        <div class="small" style="color: #7f1d1d;">
          Configure os dias de atendimento na aba "Horários de Atendimento".
        </div>
      </div>
    `;
    return;
  }
  
  const dateStr = toDateStr(selectedDate);
  currentDayAvailability = await getDayAvailability(dateStr);
  
  const dayAppointments = allAppointments.filter(a => {
    const d = new Date(a.start);
    return d.toDateString() === selectedDate.toDateString();
  });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPastDate = selectedDate < today;
  const isToday = selectedDate.getTime() === today.getTime();
  const currentHour = today.getHours();
  const currentMinute = today.getMinutes();
  
  // Checkbox para habilitar/desabilitar todos
  const toggleAllRow = document.createElement('div');
  toggleAllRow.style.marginBottom = '16px';
  toggleAllRow.style.display = 'flex';
  toggleAllRow.style.alignItems = 'center';
  toggleAllRow.style.gap = '12px';
  toggleAllRow.style.padding = '12px';
  toggleAllRow.style.background = 'linear-gradient(135deg, #e6fff2, #f0fff8)';
  toggleAllRow.style.borderRadius = '12px';
  
  const toggleAllCheckbox = document.createElement('input');
  toggleAllCheckbox.type = 'checkbox';
  toggleAllCheckbox.id = 'toggleAll';
  toggleAllCheckbox.style.width = '20px';
  toggleAllCheckbox.style.height = '20px';
  toggleAllCheckbox.style.cursor = 'pointer';
  toggleAllCheckbox.style.accentColor = 'var(--primary)';
  
  // Verificar se todos os horários disponíveis estão habilitados
  const availableSlots = slots.filter(slot => {
    const slotDate = new Date(selectedDate);
    slotDate.setHours(slot.hour, slot.minute, 0, 0);
    const isPast = isPastDate || (isToday && (slot.hour < currentHour || (slot.hour === currentHour && slot.minute < currentMinute)));
    const hasAppointment = dayAppointments.some(a => {
      const d = new Date(a.start);
      return d.getHours() === slot.hour && d.getMinutes() === slot.minute;
    });
    return !isPast && !hasAppointment;
  });
  
  const allEnabled = availableSlots.every(slot => {
    const key = `${slot.hour}:${slot.minute}`;
    return currentDayAvailability[key] !== false;
  });
  
  toggleAllCheckbox.checked = allEnabled;
  
  if (isPastDate) {
    toggleAllCheckbox.disabled = true;
    toggleAllCheckbox.style.cursor = 'not-allowed';
  }
  
  const toggleAllLabel = document.createElement('label');
  toggleAllLabel.htmlFor = 'toggleAll';
  toggleAllLabel.style.fontWeight = '700';
  toggleAllLabel.style.cursor = isPastDate ? 'not-allowed' : 'pointer';
  toggleAllLabel.style.flex = '1';
  toggleAllLabel.textContent = 'Habilitar/Desabilitar todos os horários';
  
  if (!isPastDate) {
    toggleAllCheckbox.addEventListener('change', async () => {
      const newValue = toggleAllCheckbox.checked;
      availableSlots.forEach(slot => {
        const key = `${slot.hour}:${slot.minute}`;
        currentDayAvailability[key] = newValue;
      });
      try {
        await saveDayAvailability(dateStr, currentDayAvailability);
        await updateDayDetail();
      } catch (error) {
        console.error('Erro ao salvar disponibilidade:', error);
        alert('Erro ao atualizar disponibilidade');
      }
    });
  }
  
  toggleAllRow.appendChild(toggleAllCheckbox);
  toggleAllRow.appendChild(toggleAllLabel);
  hourlyList.appendChild(toggleAllRow);
  
  // Renderizar cada horário
  slots.forEach(slot => {
    const row = document.createElement('div');
    row.className = 'hour-row';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';
    
    const slotDate = new Date(selectedDate);
    slotDate.setHours(slot.hour, slot.minute, 0, 0);
    
    const isPastHour = isPastDate || (isToday && (slot.hour < currentHour || (slot.hour === currentHour && slot.minute < currentMinute)));
    
    const appt = dayAppointments.find(a => {
      const d = new Date(a.start);
      return d.getHours() === slot.hour && d.getMinutes() === slot.minute;
    });
    
    // Checkbox (desabilitado se for passado ou tiver agendamento)
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const key = `${slot.hour}:${slot.minute}`;
    checkbox.checked = currentDayAvailability[key] !== false;
    checkbox.style.width = '20px';
    checkbox.style.height = '20px';
    checkbox.style.cursor = (isPastHour || appt) ? 'not-allowed' : 'pointer';
    checkbox.style.flexShrink = '0';
    checkbox.style.accentColor = 'var(--primary)';
    checkbox.disabled = isPastHour || !!appt;
    
    if (!isPastHour && !appt) {
      checkbox.addEventListener('change', async () => {
        currentDayAvailability[key] = checkbox.checked;
        try {
          await saveDayAvailability(dateStr, currentDayAvailability);
          await updateDayDetail();
        } catch (error) {
          console.error('Erro ao salvar disponibilidade:', error);
          alert('Erro ao atualizar disponibilidade');
        }
      });
    }
    
    const time = document.createElement('div');
    time.className = 'hour-time';
    time.textContent = slot.time;
    
    const slotDiv = document.createElement('div');
    slotDiv.className = 'hour-slot card';
    slotDiv.style.flex = '1';
    
    if (appt) {
      const booked = document.createElement('div');
      booked.className = 'slot-booked';
      booked.style.display = 'flex';
      booked.style.justifyContent = 'space-between';
      booked.style.alignItems = 'center';
      booked.style.gap = '12px';
      
      const leftInfo = document.createElement('div');
      leftInfo.style.flex = '1';
      leftInfo.style.minWidth = '0';
      
      const client = allClients[appt.userId];
      const clientAge = client ? calculateAge(client.birthdate) : '';
      const ageDisplay = clientAge && clientAge !== 'N/A' ? ` (${clientAge} anos)` : '';
      
      const clientNameHTML = `<span class="clickable-client-name" onclick="openClientDetail('${appt.userId}')" title="Ver detalhes do cliente">${appt.clientName}${ageDisplay}</span>`;
      
      leftInfo.innerHTML = `
        <div style="font-weight:700;margin-bottom:4px">${appt.typeName}</div>
        <div class="small">${clientNameHTML}${appt.clientPhone ? ' • ' + appt.clientPhone : ''}</div>
      `;
      
      const statusSelect = document.createElement('select');
      statusSelect.className = 'status-select-compact';
      statusSelect.style.background = getStatusColor(appt.status);
      statusSelect.style.color = getStatusTextColor(appt.status);
      statusSelect.innerHTML = `
        <option value="PENDENTE" ${appt.status === 'PENDENTE' ? 'selected' : ''}>⏳ Pendente</option>
        <option value="CONFIRMADO" ${appt.status === 'CONFIRMADO' ? 'selected' : ''}>✓ Confirmado</option>
        <option value="REALIZADO" ${appt.status === 'REALIZADO' ? 'selected' : ''}>✓ Realizado</option>
        <option value="CANCELADO" ${appt.status === 'CANCELADO' ? 'selected' : ''}>✗ Cancelado</option>
      `;
      statusSelect.onchange = async () => {
        const newStatus = statusSelect.value;
        if (newStatus === 'CANCELADO' && appt.status !== 'CANCELADO') {
          const reason = prompt('Informe o motivo do cancelamento (obrigatório):');
          if (reason && reason.trim()) {
            appt.status = newStatus;
            appt.cancellationReason = reason.trim();
            try {
              await saveAppointment(appt);
              await updateDayDetail();
            } catch (error) {
              console.error('Erro ao atualizar status:', error);
              alert('Erro ao atualizar status.');
            }
          } else if (reason !== null) {
            alert('O motivo do cancelamento é obrigatório!');
            statusSelect.value = appt.status;
          } else {
            statusSelect.value = appt.status;
          }
        } else {
          appt.status = newStatus;
          try {
            await saveAppointment(appt);
            await updateDayDetail();
          } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao atualizar status.');
          }
        }
      };
      
      booked.appendChild(leftInfo);
      booked.appendChild(statusSelect);
      slotDiv.appendChild(booked);
    } else {
      const isAvailable = currentDayAvailability[key] !== false;
      const statusText = isPastHour ? 'Horário passado' : (isAvailable ? 'Livre' : 'Indisponível');
      const statusColor = isPastHour ? 'color: #9ca3af; font-style: italic;' : (isAvailable ? '' : 'color: #ef4444; font-weight: 600;');
      slotDiv.innerHTML = `<div class="slot-empty" style="${statusColor}">${statusText}</div>`;
    }
    
    row.appendChild(checkbox);
    row.appendChild(time);
    row.appendChild(slotDiv);
    hourlyList.appendChild(row);
  });
}

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPastDate = selectedDate < today;
  const isToday = selectedDate.getTime() === today.getTime();
  const currentHour = new Date().getHours();
  
  if (isPastDate || isToday) {
    for (let hour = 8; hour <= 22; hour++) {
      if (isPastDate || (isToday && hour < currentHour)) {
        const startTs = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hour, 0, 0, 0).getTime();
        const endTs = startTs + 60 * 60 * 1000;
        const appts = allAppointments.filter(a => a.start >= startTs && a.start < endTs);
        
        if (appts.length === 0) {
          currentDayAvailability[hour] = false;
        }
      }
    }
  }
  
  const toggleAllRow = document.createElement('div');
  toggleAllRow.style.marginBottom = '16px';
  toggleAllRow.style.display = 'flex';
  toggleAllRow.style.alignItems = 'center';
  toggleAllRow.style.gap = '12px';
  toggleAllRow.style.padding = '12px';
  toggleAllRow.style.background = 'linear-gradient(135deg, #e6fff2, #f0fff8)';
  toggleAllRow.style.borderRadius = '12px';
  
  const toggleAllCheckbox = document.createElement('input');
  toggleAllCheckbox.type = 'checkbox';
  toggleAllCheckbox.id = 'toggleAll';
  toggleAllCheckbox.style.width = '20px';
  toggleAllCheckbox.style.height = '20px';
  toggleAllCheckbox.style.cursor = 'pointer';
  
  const allEnabled = Object.values(currentDayAvailability).every(v => v === true);
  toggleAllCheckbox.checked = allEnabled;
  
  if (isPastDate) {
    toggleAllCheckbox.disabled = true;
    toggleAllCheckbox.style.cursor = 'not-allowed';
  }
  
  const toggleAllLabel = document.createElement('label');
  toggleAllLabel.htmlFor = 'toggleAll';
  toggleAllLabel.style.fontWeight = '700';
  toggleAllLabel.style.cursor = isPastDate ? 'not-allowed' : 'pointer';
  toggleAllLabel.style.flex = '1';
  toggleAllLabel.textContent = 'Habilitar/Desabilitar todos os horários';
  
  if (!isPastDate) {
    toggleAllCheckbox.addEventListener('change', async () => {
      const newValue = toggleAllCheckbox.checked;
      for (let hour = 8; hour <= 22; hour++) {
        if (isToday && hour < currentHour) continue;
        currentDayAvailability[hour] = newValue;
      }
      try {
        await saveDayAvailability(dateStr, currentDayAvailability);
        await updateDayDetail();
      } catch (error) {
        console.error('Erro ao salvar disponibilidade:', error);
        alert('Erro ao atualizar disponibilidade');
      }
    });
  }
  
  toggleAllRow.appendChild(toggleAllCheckbox);
  toggleAllRow.appendChild(toggleAllLabel);
  hourlyList.appendChild(toggleAllRow);
  
  for (let hour = 8; hour <= 22; hour++) {
    const row = document.createElement('div');
    row.className = 'hour-row';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';
    
    const isPastHour = isPastDate || (isToday && hour < currentHour);
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = currentDayAvailability[hour] !== false;
    checkbox.style.width = '20px';
    checkbox.style.height = '20px';
    checkbox.style.cursor = isPastHour ? 'not-allowed' : 'pointer';
    checkbox.style.flexShrink = '0';
    checkbox.disabled = isPastHour;
    
    if (!isPastHour) {
      checkbox.addEventListener('change', async () => {
        currentDayAvailability[hour] = checkbox.checked;
        try {
          await saveDayAvailability(dateStr, currentDayAvailability);
          await updateDayDetail();
        } catch (error) {
          console.error('Erro ao salvar disponibilidade:', error);
          alert('Erro ao atualizar disponibilidade');
        }
      });
    }
    
    const time = document.createElement('div');
    time.className = 'hour-time';
    time.textContent = (hour < 10 ? '0' + hour : hour) + ':00';
    
    const slot = document.createElement('div');
    slot.className = 'hour-slot card';
    slot.style.flex = '1';
    
    const startTs = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hour, 0, 0, 0).getTime();
    const endTs = startTs + 60 * 60 * 1000;
    
    const appts = allAppointments.filter(a => a.start >= startTs && a.start < endTs);
    
    if (appts.length === 0) {
      const statusText = currentDayAvailability[hour] !== false ? 'Livre' : 'Indisponível';
      const statusColor = currentDayAvailability[hour] !== false ? '' : 'color: #ef4444; font-weight: 600;';
      slot.innerHTML = `<div class="slot-empty" style="${statusColor}">${statusText}</div>`;
    } else {
      const a = appts[0];
      const booked = document.createElement('div');
      booked.className = 'slot-booked';
      booked.style.display = 'flex';
      booked.style.justifyContent = 'space-between';
      booked.style.alignItems = 'center';
      booked.style.gap = '12px';
      
      const leftInfo = document.createElement('div');
      leftInfo.style.flex = '1';
      leftInfo.style.minWidth = '0';
      
      // Buscar dados do cliente e exibir idade
      const client = allClients[a.userId];
      const clientAge = client ? calculateAge(client.birthdate) : '';
      const ageDisplay = clientAge && clientAge !== 'N/A' ? ` (${clientAge} anos)` : '';
      
      const clientNameHTML = `<span class="clickable-client-name" onclick="openClientDetail('${a.userId}')" title="Ver detalhes do cliente">${a.clientName}${ageDisplay}</span>`;
      
      leftInfo.innerHTML = `
        <div style="font-weight:700;margin-bottom:4px">${a.typeName}</div>
        <div class="small">${clientNameHTML}${a.clientPhone ? ' • ' + a.clientPhone : ''}</div>
      `;
      
      const statusSelect = document.createElement('select');
      statusSelect.className = 'status-select-compact';
      statusSelect.style.background = getStatusColor(a.status);
      statusSelect.style.color = getStatusTextColor(a.status);
      statusSelect.innerHTML = `
        <option value="PENDENTE" ${a.status === 'PENDENTE' ? 'selected' : ''}>⏳ Pendente</option>
        <option value="CONFIRMADO" ${a.status === 'CONFIRMADO' ? 'selected' : ''}>✓ Confirmado</option>
        <option value="REALIZADO" ${a.status === 'REALIZADO' ? 'selected' : ''}>✓ Realizado</option>
        <option value="CANCELADO" ${a.status === 'CANCELADO' ? 'selected' : ''}>✗ Cancelado</option>
      `;
      statusSelect.onchange = async () => {
        const newStatus = statusSelect.value;
        if (newStatus === 'CANCELADO' && a.status !== 'CANCELADO') {
          const reason = prompt('Informe o motivo do cancelamento (obrigatório):');
          if (reason && reason.trim()) {
            a.status = newStatus;
            a.cancellationReason = reason.trim();
            try {
              await saveAppointment(a);
              await updateDayDetail();
            } catch (error) {
              console.error('Erro ao atualizar status:', error);
              alert('Erro ao atualizar status.');
            }
          } else if (reason !== null) {
            alert('O motivo do cancelamento é obrigatório!');
            statusSelect.value = a.status;
          } else {
            statusSelect.value = a.status;
          }
        } else {
          a.status = newStatus;
          try {
            await saveAppointment(a);
            await updateDayDetail();
          } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao atualizar status.');
          }
        }
      };
      
      booked.appendChild(leftInfo);
      booked.appendChild(statusSelect);
      slot.appendChild(booked);
    }
    
    row.appendChild(checkbox);
    row.appendChild(time);
    row.appendChild(slot);
    hourlyList.appendChild(row);
  }


viewMode.addEventListener('change', () => {
  if (viewMode.value === 'week') {
    document.getElementById('calendarArea').classList.add('hidden');
    weekArea.classList.remove('hidden');
    if (!selectedDate) {
      selectedDate = new Date();
      selectedDate.setHours(0, 0, 0, 0);
    }
    renderWeek();
    updateDayDetail();
  } else {
    weekArea.classList.add('hidden');
    document.getElementById('calendarArea').classList.remove('hidden');
    renderCalendar();
  }
});

btnToday.addEventListener('click', () => {
  currentMonth = new Date();
  selectedDate = new Date();
  selectedDate.setHours(0, 0, 0, 0);
  
  if (viewMode.value === 'week') {
    renderWeek();
  } else {
    renderCalendar();
  }
  
  updateDayDetail();
});

if (btnExportBackup && inputRestoreBackup) {
  btnExportBackup.addEventListener('click', async () => {
    backupStatus.textContent = 'Gerando backup...';
    try {
      // Baixar todas as coleções
      const [typesSnap, apptsSnap, availSnap, usersSnap] = await Promise.all([
        firebase.firestore().collection('massage_types').get(),
        firebase.firestore().collection('appointments').get(),
        firebase.firestore().collection('availability').get(),
        firebase.firestore().collection('users').get()
      ]);
      const backup = {
        massage_types: typesSnap.docs.map(d => d.data()),
        appointments: apptsSnap.docs.map(d => d.data()),
        availability: availSnap.docs.map(d => d.data()),
        users: usersSnap.docs.map(d => d.data()),
        _meta: { generatedAt: new Date().toISOString() }
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], {type: "application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "backup-massagens-zen-" + new Date().toISOString().slice(0,19).replace(/[:T]/g,"-") + ".json";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      backupStatus.textContent = "Backup gerado com sucesso!";
    } catch (e) {
      console.error(e);
      backupStatus.textContent = "Erro ao gerar backup!";
    }
  });

  inputRestoreBackup.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm("Restaurar backup irá sobrescrever TODOS os dados atuais. Deseja continuar?")) {
      inputRestoreBackup.value = "";
      return;
    }
    backupStatus.textContent = "Restaurando backup...";
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Função para sobrescrever uma coleção
      async function restoreCollection(colName, arr, keyField) {
        const colRef = firebase.firestore().collection(colName);
        // Apagar todos os docs existentes
        const snap = await colRef.get();
        const batchDel = firebase.firestore().batch();
        snap.forEach(doc => batchDel.delete(doc.ref));
        await batchDel.commit();

        // Adicionar docs do backup
        for (const doc of arr) {
          let docId = doc[keyField] || doc.id || undefined;
          if (!docId) docId = colRef.doc().id;
          await colRef.doc(docId).set(doc);
        }
      }

      // Restaurar cada coleção
      await restoreCollection("massage_types", data.massage_types || [], "id");
      await restoreCollection("appointments", data.appointments || [], "id");
      await restoreCollection("availability", data.availability || [], "date");
      await restoreCollection("users", data.users || [], "uid");

      backupStatus.textContent = "Backup restaurado com sucesso! Recarregue a página para ver as alterações.";
    } catch (e) {
      console.error(e);
      backupStatus.textContent = "Erro ao restaurar backup!";
    } finally {
      inputRestoreBackup.value = "";
    }
  });
}

// ====================
// AGENDAMENTO DE BACKUP AUTOMÁTICO
// ====================

function getSavedBackupSchedule() {
  try {
    return JSON.parse(localStorage.getItem('backupSchedule') || '[]');
  } catch {
    return [];
  }
}

function saveBackupSchedule(schedule) {
  localStorage.setItem('backupSchedule', JSON.stringify(schedule));
}

function renderBackupScheduleForm() {
  const schedule = getSavedBackupSchedule();
  backupScheduleList.innerHTML = '';
  
  schedule.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.style.marginBottom = '8px';
    row.style.alignItems = 'center';

    // Horário
    const timeInput = document.createElement('input');
    timeInput.type = 'time';
    timeInput.className = 'input';
    timeInput.style.width = '120px';
    timeInput.value = item.time;
    timeInput.required = true;
    timeInput.disabled = !!schedule[0].interval && idx > 0; // Bloqueia se intervalo preenchido

    // Intervalo (apenas no primeiro)
    let intervalInput = null;
    if (idx === 0) {
      intervalInput = document.createElement('input');
      intervalInput.type = 'number';
      intervalInput.className = 'input';
      intervalInput.style.width = '120px';
      intervalInput.placeholder = 'Intervalo (min)';
      intervalInput.min = 1;
      intervalInput.max = 1440;
      intervalInput.value = item.interval || '';
      intervalInput.addEventListener('input', () => {
        if (intervalInput.value) {
          // Preencher automaticamente os horários
          const baseTime = timeInput.value;
          const intervalMin = parseInt(intervalInput.value, 10);
          if (!baseTime || isNaN(intervalMin) || intervalMin <= 0) return;
          const timesArr = [];
          let [h, m] = baseTime.split(':').map(Number);
          for (let i = 0; i < MAX_BACKUP_TIMES; i++) {
            if (h > 23 || (h === 23 && m > 59)) break;
            timesArr.push({
              time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
              interval: intervalMin
            });
            m += intervalMin;
            while (m >= 60) { m -= 60; h += 1; }
            if (h > 23) break;
          }
          saveBackupSchedule(timesArr);
          renderBackupScheduleForm();
        } else {
          // Limpa os demais horários e permite adicionar manualmente
          saveBackupSchedule([{
            time: timeInput.value,
            interval: ''
          }]);
          renderBackupScheduleForm();
        }
      });
    }

    // Remover botão (exceto se só houver um)
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-danger btn-sm';
    removeBtn.textContent = 'Remover';
    removeBtn.style.marginLeft = '8px';
    removeBtn.disabled = !!schedule[0].interval && idx > 0; // Bloqueia se intervalo preenchido
    removeBtn.onclick = () => {
      schedule.splice(idx, 1);
      saveBackupSchedule(schedule);
      renderBackupScheduleForm();
    };

    // Atualiza horário manualmente
    timeInput.addEventListener('change', () => {
      schedule[idx].time = timeInput.value;
      saveBackupSchedule(schedule);
      renderBackupScheduleForm();
    });

    row.appendChild(timeInput);

    if (intervalInput) {
      row.appendChild(intervalInput);
      // Label para intervalo
      const lbl = document.createElement('span');
      lbl.textContent = 'min';
      lbl.style.marginLeft = '4px';
      row.appendChild(lbl);
    }

    if (schedule.length > 1 || idx > 0) row.appendChild(removeBtn);

    backupScheduleList.appendChild(row);
  });

  // Se não houver nenhum horário, adiciona um por padrão
  if (schedule.length === 0) {
    saveBackupSchedule([{ time: '', interval: '' }]);
    renderBackupScheduleForm();
  }

  // Botão de adicionar só aparece se não tiver intervalo preenchido e menos de MAX_BACKUP_TIMES
  addBackupTimeBtn.disabled = !!schedule[0].interval || schedule.length >= MAX_BACKUP_TIMES;
}

addBackupTimeBtn.addEventListener('click', () => {
  const schedule = getSavedBackupSchedule();
  if (schedule.length >= MAX_BACKUP_TIMES) return;
  schedule.push({ time: '', interval: '' });
  saveBackupSchedule(schedule);
  renderBackupScheduleForm();
});

backupScheduleForm.addEventListener('submit', e => {
  e.preventDefault();
  const schedule = getSavedBackupSchedule();
  // Validação básica
  if (!schedule.length || !schedule[0].time) {
    scheduleMsg.textContent = "Defina pelo menos um horário!";
    scheduleMsg.style.color = "#991b1b";
    return;
  }
  if (!!schedule[0].interval && (!schedule[0].time || isNaN(parseInt(schedule[0].interval)))) {
    scheduleMsg.textContent = "Preencha um horário inicial e um intervalo válido!";
    scheduleMsg.style.color = "#991b1b";
    return;
  }
  saveBackupSchedule(schedule);
  scheduleMsg.textContent = "Agendamento salvo!";
  scheduleMsg.style.color = "#059669";
});

// Renderiza ao abrir a aba de backup
document.querySelector('.sb-item[data-tab="backup"]').addEventListener('click', () => {
  renderBackupScheduleForm();
});

// Opcional: Exemplo de como você poderia disparar backups automáticos em background usando setInterval
// (Apenas enquanto a página estiver aberta! Para agendamento real use Cloud Functions ou cron jobs no backend)
function checkAndRunScheduledBackups() {
  const schedule = getSavedBackupSchedule();
  if (!schedule.length) return;
  
  const nowStr = new Date().toTimeString().slice(0,5); // "HH:MM"
  
  for (const item of schedule) {
    if (item.time === nowStr && !window._lastBackupRun?.includes(nowStr)) {
      // Chame aqui sua função de backup automático!
      // Exemplo:
      // gerarBackupAutomatico();
      window._lastBackupRun = window._lastBackupRun || [];
      window._lastBackupRun.push(nowStr);
      setTimeout(() => {
        window._lastBackupRun = window._lastBackupRun.filter(t => t !== nowStr);
      },60000); // Libera para rodar novamente após um minuto
    }
  }
}
setInterval(checkAndRunScheduledBackups,30000); // Checa a cada meio minuto

// ====================
// INICIALIZAÇÃO
// ====================

async function init() {
  try {
    allTypes = await getAllTypes();
    allAppointments = await getAllAppointments();
    
    console.log('📄 Carregando clientes...');
    const usersSnapshot = await firebase.firestore().collection('users').get();
    allClients = {};
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.name && data.email) {
        allClients[doc.id] = {
          userId: doc.id,
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          cpf: data.cpf || '',
          birthdate: data.birthdate || '',
          address: data.address || {},
          createdAt: data.createdAt || Date.now()
        };
      }
    });
    
    console.log('✅ Clientes carregados:', Object.keys(allClients).length);
    
    loadTypesUI();
    await loadScheduleConfig(); // ADICIONE ESTA LINHA
    renderCalendar();
    
    setupPeriodFilters();
    setupFinancePeriodFilters();
    setupStatusFilters();
    loadAppointmentsUI();
    computeFinanceData();
    
    selectedDate = new Date();
    selectedDate.setHours(0, 0, 0, 0);
    await updateDayDetail();

    unsubscribeTypes = onTypesChange(types => {
      allTypes = types;
      loadTypesUI();
    });

    unsubscribeAppointments = onAppointmentsChange(appointments => {
      allAppointments = appointments;
      loadAppointmentsUI();
      computeFinanceData();
      if (viewMode.value === 'week') {
        renderWeek();
      } else {
        renderCalendar();
      }
      if (selectedDate) {
        updateDayDetail();
      }
    });

    // Listener em tempo real para mudanças nos perfis de usuários
    unsubscribeUsers = firebase.firestore().collection('users').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        const userId = change.doc.id;
        const data = change.doc.data();
        
        if (change.type === 'added' || change.type === 'modified') {
          if (data.name && data.email) {
            allClients[userId] = {
              userId,
              name: data.name,
              email: data.email,
              phone: data.phone || '',
              cpf: data.cpf || '',
              birthdate: data.birthdate || '',
              address: data.address || {},
              createdAt: data.createdAt || Date.now()
            };
            console.log('✅ Cliente atualizado:', data.name);
          }
        } else if (change.type === 'removed') {
          delete allClients[userId];
          console.log('🗑️ Cliente removido:', userId);
        }
      });
      
      // Se estamos na aba de clientes, atualizar a UI
      if (!tabClients.classList.contains('hidden')) {
        loadClientsUI();
      }
      
      // Atualizar agendamentos e dashboard se estiverem visíveis
      if (!tabAppointments.classList.contains('hidden')) {
        loadAppointmentsUI();
      }
      if (!tabDashboard.classList.contains('hidden') && selectedDate) {
        updateDayDetail();
      }
    }, error => {
      console.error('❌ Erro no listener de usuários:', error);
    });

    console.log('✅ Painel administrativo conectado ao Firebase!');
  } catch (error) {
    console.error('Erro na inicialização:', error);
    alert('Erro ao conectar com o servidor. Verifique a configuração do Firebase.');
  }
}

window.addEventListener('beforeunload', () => {
  if (unsubscribeTypes) unsubscribeTypes();
  if (unsubscribeAppointments) unsubscribeAppointments();
  if (unsubscribeUsers) unsubscribeUsers();
});
