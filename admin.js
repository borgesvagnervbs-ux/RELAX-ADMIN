// admin.js - Painel Administrativo com Autenticação e Melhorias

// Elementos da UI
const loginScreenAdmin = document.getElementById('loginScreenAdmin');
const mainScreenAdmin = document.getElementById('mainScreenAdmin');
const sidebar = document.getElementById('sidebar');
const btnMenu = document.getElementById('btnMenu');
const mainContent = document.getElementById('mainContent');
const sbItems = Array.from(document.querySelectorAll('.sb-item'));
const tabDashboard = document.getElementById('tab-dashboard');
const tabTypes = document.getElementById('tab-types');
const tabAppointments = document.getElementById('tab-appointments');
const tabFinance = document.getElementById('tab-finance');
const typeName = document.getElementById('typeName');
const typePrice = document.getElementById('typePrice');
const typesList = document.getElementById('typesList');
const btnAddType = document.getElementById('btnAddType');
const btnReloadTypes = document.getElementById('btnReloadTypes');
const filterDay = document.getElementById('filterDay');
const filterWeek = document.getElementById('filterWeek');
const appointmentsList = document.getElementById('appointmentsList');
const sumDay = document.getElementById('sumDay');
const sumMonth = document.getElementById('sumMonth');
const sumYear = document.getElementById('sumYear');
const paidList = document.getElementById('paidList');
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

let allTypes = [];
let allAppointments = [];
let currentMonth = new Date();
let selectedDate = null;
let unsubscribeTypes = null;
let unsubscribeAppointments = null;
let currentDayAvailability = {};
let currentAdminUser = null;
let editingTypeId = null;

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

// Listener de autenticação
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
  tabAppointments.classList.add('hidden');
  tabFinance.classList.add('hidden');
  
  if (tab === 'dashboard') tabDashboard.classList.remove('hidden');
  if (tab === 'types') tabTypes.classList.remove('hidden');
  if (tab === 'appointments') tabAppointments.classList.remove('hidden');
  if (tab === 'finance') tabFinance.classList.remove('hidden');
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

// Função auxiliar para obter classe do status
function getStatusBadgeClass(status) {
  const statusLower = status.toLowerCase();
  return `status-badge status-${statusLower}`;
}

// Função auxiliar para obter ícone e texto do status
function getStatusDisplay(status) {
  const displays = {
    'PENDENTE': { icon: '⏳', text: 'PENDENTE' },
    'CONFIRMADO': { icon: '✓', text: 'CONFIRMADO' },
    'REALIZADO': { icon: '✓', text: 'REALIZADO' },
    'CANCELADO': { icon: '✗', text: 'CANCELADO' }
  };
  return displays[status] || { icon: '', text: status };
}

filterDay.addEventListener('change', loadAppointmentsUI);
filterWeek.addEventListener('change', loadAppointmentsUI);

async function loadAppointmentsUI() {
  try {
    appointmentsList.innerHTML = '';
    
    if (allAppointments.length === 0) {
      appointmentsList.innerHTML = '<div class="small">Sem agendamentos</div>';
      computeFinance([]);
      return;
    }
    
    const selectedDayVal = filterDay.value ? new Date(filterDay.value) : null;
    const weekFilter = filterWeek.value || 'all';
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    let filtered = allAppointments.slice();
    
    if (selectedDayVal) {
      filtered = filtered.filter(a => {
        const d = new Date(a.start);
        return d.toDateString() === selectedDayVal.toDateString();
      });
    } else if (weekFilter === 'current') {
      filtered = filtered.filter(a => a.start >= startOfWeek.getTime() && a.start < endOfWeek.getTime());
    } else if (weekFilter === 'next') {
      const nextStart = new Date(endOfWeek);
      const nextEnd = new Date(nextStart);
      nextEnd.setDate(nextStart.getDate() + 7);
      filtered = filtered.filter(a => a.start >= nextStart.getTime() && a.start < nextEnd.getTime());
    }

    filtered.sort((a, b) => a.start - b.start);
    
    filtered.forEach(ap => {
      const div = document.createElement('div');
      div.className = 'card appointment-card';
      
      const d = new Date(ap.start);
      const left = document.createElement('div');
      left.style.flex = '1';
      
      const statusDisplay = getStatusDisplay(ap.status);
      const statusBadge = document.createElement('span');
      statusBadge.className = getStatusBadgeClass(ap.status);
      statusBadge.textContent = `${statusDisplay.icon} ${statusDisplay.text}`;
      statusBadge.style.display = 'inline-block';
      statusBadge.style.marginBottom = '8px';
      
      let noteHTML = '';
      if (ap.note) {
        noteHTML = `<div class="small" style="margin-top:6px"><strong>Obs cliente:</strong> ${ap.note}</div>`;
      }
      if (ap.cancellationReason) {
        noteHTML += `<div class="small" style="margin-top:6px;color:#991b1b"><strong>Motivo cancelamento:</strong> ${ap.cancellationReason}</div>`;
      }
      
      left.innerHTML = `
        <div style="font-weight:800;margin-top:8px">${ap.typeName} • ${formatMoney(ap.price)}</div>
        <div class="small">${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} — ${ap.clientName}${ap.clientPhone?' • '+ap.clientPhone:''}</div>
        ${noteHTML}
      `;
      left.insertBefore(statusBadge, left.firstChild);
      
      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.flexDirection = 'column';
      right.style.gap = '8px';
      
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
      
      right.appendChild(btnPaid);
      
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';
      div.appendChild(left);
      div.appendChild(right);
      appointmentsList.appendChild(div);
    });

    computeFinance(allAppointments);
  } catch (error) {
    console.error('Erro ao carregar agendamentos:', error);
  }
}

// ====================
// FINANÇAS
// ====================

function computeFinance(list) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

  const paid = list.filter(a => a.paid);
  const daySum = paid.filter(a => a.start >= startOfDay && a.start < startOfDay + 24 * 3600 * 1000).reduce((s, a) => s + Number(a.price), 0);
  const monthSum = paid.filter(a => a.start >= startOfMonth).reduce((s, a) => s + Number(a.price), 0);
  const yearSum = paid.filter(a => a.start >= startOfYear).reduce((s, a) => s + Number(a.price), 0);

  sumDay.textContent = formatMoney(daySum);
  sumMonth.textContent = formatMoney(monthSum);
  sumYear.textContent = formatMoney(yearSum);

  paid.sort((a, b) => b.start - a.start);
  paidList.innerHTML = '';
  
  if (paid.length === 0) {
    paidList.innerHTML = '<div class="small">Nenhuma sessão paga</div>';
    return;
  }
  
  paid.forEach(p => {
    const dd = new Date(p.start);
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <div style="font-weight:800">${p.typeName} • ${formatMoney(p.price)}</div>
      <div class="small">${dd.toLocaleDateString()} ${dd.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} — ${p.clientName}</div>
    `;
    paidList.appendChild(el);
  });
}

// ====================
// CALENDÁRIO
// ====================

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
        updateDayDetail();
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
      leftInfo.innerHTML = `
        <div style="font-weight:700;margin-bottom:4px">${a.typeName}</div>
        <div class="small">${a.clientName}${a.clientPhone ? ' • ' + a.clientPhone : ''}</div>
      `;
      
      const statusDisplay = getStatusDisplay(a.status);
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
              updateDayDetail();
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
            updateDayDetail();
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

// Funções auxiliares para cores do status
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
    
    loadTypesUI();
    renderCalendar();
    computeFinance(allAppointments);
    loadAppointmentsUI();
    
    selectedDate = new Date();
    selectedDate.setHours(0, 0, 0, 0);
    await updateDayDetail();

    unsubscribeTypes = onTypesChange(types => {
      allTypes = types;
      loadTypesUI();
    });

    unsubscribeAppointments = onAppointmentsChange(appointments => {
      allAppointments = appointments;
      computeFinance(appointments);
      loadAppointmentsUI();
      if (viewMode.value === 'week') {
        renderWeek();
      } else {
        renderCalendar();
      }
      if (selectedDate) {
        updateDayDetail();
      }
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
});
