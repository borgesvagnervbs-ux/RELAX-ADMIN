// admin.js - Painel Administrativo Completo com Gestão de Clientes

// Elementos da UI
const loginScreenAdmin = document.getElementById('loginScreenAdmin');
const mainScreenAdmin = document.getElementById('mainScreenAdmin');
const sidebar = document.getElementById('sidebar');
const btnMenu = document.getElementById('btnMenu');
const mainContent = document.getElementById('mainContent');
const sbItems = Array.from(document.querySelectorAll('.sb-item'));
const tabDashboard = document.getElementById('tab-dashboard');
const tabTypes = document.getElementById('tab-types');
const tabClients = document.getElementById('tab-clients');
const tabAppointments = document.getElementById('tab-appointments');
const tabFinance = document.getElementById('tab-finance');
const tabBackup = document.getElementById('tab-backup'); // Nova Aba
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

// Elementos Financeiros
const financeTicketMedio = document.getElementById('financeTicketMedio');
const financeQuantidade = document.getElementById('financeQuantidade');
const financeTotal = document.getElementById('financeTotal');
const massageRanking = document.getElementById('massageRanking');
const clientRanking = document.getElementById('clientRanking');

// Elementos de Backup
const btnGenerateBackup = document.getElementById('btnGenerateBackup');
const btnRestoreBackup = document.getElementById('btnRestoreBackup');
const backupFileInput = document.getElementById('backupFileInput');
const restoreStatus = document.getElementById('restoreStatus');

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

function maskCep(cep) {
  if (!cep) return '';
  cep = cep.replace(/\D/g, '');
  cep = cep.replace(/(\d{5})(\d)/, '$1-$2');
  return cep;
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
  tabTypes.classList.add('hidden');
  tabClients.classList.add('hidden');
  tabAppointments.classList.add('hidden');
  tabFinance.classList.add('hidden');
  tabBackup.classList.add('hidden');
  
  if (tab === 'dashboard') tabDashboard.classList.remove('hidden');
  if (tab === 'types') tabTypes.classList.remove('hidden');
  if (tab === 'clients') {
    tabClients.classList.remove('hidden');
    loadClientsUI();
  }
  if (tab === 'appointments') tabAppointments.classList.remove('hidden');
  if (tab === 'finance') {
    tabFinance.classList.remove('hidden');
    computeFinanceData();
  }
  if (tab === 'backup') tabBackup.classList.remove('hidden');
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
      
      // Buscar dados do cliente
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
// BACKUP E RESTAURAÇÃO
// ====================

// Gerar Backup
btnGenerateBackup.addEventListener('click', async () => {
  btnGenerateBackup.disabled = true;
  btnGenerateBackup.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
  
  try {
    const backupData = await getFullBackup();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    
    const date = new Date();
    const fileName = `backup_massagens_${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}.json`;
    
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    alert('Backup gerado e download iniciado com sucesso!');
  } catch (error) {
    console.error('Erro ao gerar backup:', error);
    alert('Erro ao gerar backup: ' + error.message);
  } finally {
    btnGenerateBackup.disabled = false;
    btnGenerateBackup.innerHTML = '<i class="fas fa-file-export"></i> Gerar e Baixar Backup';
  }
});

// Acionar input de arquivo
btnRestoreBackup.addEventListener('click', () => {
  backupFileInput.value = ''; // Reset input
  restoreStatus.textContent = '';
  restoreStatus.className = 'small';
  backupFileInput.click();
});

// Ler arquivo e restaurar
backupFileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    alert('Por favor, selecione um arquivo JSON válido.');
    return;
  }
  
  if (!confirm('ATENÇÃO: Esta ação irá substituir dados existentes no banco de dados com as informações do arquivo de backup. Deseja continuar?')) {
    backupFileInput.value = '';
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    try {
      btnRestoreBackup.disabled = true;
      btnRestoreBackup.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Restaurando...';
      restoreStatus.textContent = 'Processando arquivo...';
      restoreStatus.style.color = 'var(--text-secondary)';
      
      const jsonData = JSON.parse(e.target.result);
      await restoreBackup(jsonData);
      
      restoreStatus.textContent = 'Backup restaurado com sucesso! A página será recarregada.';
      restoreStatus.style.color = 'var(--success)';
      
      setTimeout(() => {
        location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Erro na restauração:', error);
      restoreStatus.textContent = 'Erro ao restaurar: ' + error.message;
      restoreStatus.style.color = 'var(--danger)';
      alert('Erro ao restaurar backup. Verifique o console para mais detalhes.');
      
      btnRestoreBackup.disabled = false;
      btnRestoreBackup.innerHTML = '<i class="fas fa-file-import"></i> Selecionar Arquivo e Restaurar';
    }
  };
  
  reader.readAsText(file);
});


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
  
  const dateStr = toDateStr(selectedDate);
  currentDayAvailability = await getDayAvailability(dateStr);
  
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

// ====================
// INICIALIZAÇÃO
// ====================

async function init() {
  try {
    allTypes = await getAllTypes();
    allAppointments = await getAllAppointments();
    
    // Carregar todos os clientes inicialmente
    console.log('🔄 Carregando clientes...');
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

