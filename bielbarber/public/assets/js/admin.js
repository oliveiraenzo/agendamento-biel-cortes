/**
 * BIEL CORTES — ADMIN CONTROLLER (Frontend)
 * Gerencia serviços, preços, dias de trabalho e horários com persistência local e suporte a API
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    AUTH: 'biel_admin_auth',
    SERVICES: 'biel_admin_services',
    WORKING_DAYS: 'biel_admin_working_days',
    WORKING_HOURS: 'biel_admin_working_hours',
    BLOCKED_SLOTS: 'biel_admin_blocked_slots'
  };

  // Senha padrão local para acesso rápido do Gabriel (alterável)
  const ADMIN_PASSCODE = 'biel123';

  // Configuração padrão dos dias de trabalho (0: Dom, 1: Seg, ..., 6: Sab)
  const DEFAULT_DAYS = [
    { day: 1, name: 'Segunda', active: true },
    { day: 2, name: 'Terça', active: true },
    { day: 3, name: 'Quarta', active: true },
    { day: 4, name: 'Quinta', active: true },
    { day: 5, name: 'Sexta', active: true },
    { day: 6, name: 'Sábado', active: true },
    { day: 0, name: 'Domingo', active: false }
  ];

  // Horários padrões
  const DEFAULT_HOURS = {
    start: '09:00',
    end: '19:00',
    interval: 30 // minutos
  };

  // Estado da aplicação admin
  let state = {
    isAuthenticated: false,
    services: [],
    workingDays: [],
    workingHours: {},
    blockedSlots: []
  };

  // Elementos do DOM
  const dom = {
    loginView: document.getElementById('login-view'),
    adminView: document.getElementById('admin-view'),
    loginForm: document.getElementById('admin-login-form'),
    passInput: document.getElementById('admin-password-input'),
    loginError: document.getElementById('admin-login-error'),
    btnLogout: document.getElementById('btn-logout'),

    // Abas
    tabBtns: document.querySelectorAll('.admin-tab-btn'),
    panels: document.querySelectorAll('.admin-panel'),

    // Serviços
    serviceList: document.getElementById('admin-services-list'),
    btnAddService: document.getElementById('btn-add-service'),
    serviceModal: document.getElementById('service-edit-modal'),
    serviceForm: document.getElementById('service-edit-form'),
    btnCancelService: document.getElementById('btn-cancel-service'),

    // Modal fields
    inputServiceId: document.getElementById('service-id'),
    inputServiceName: document.getElementById('service-name'),
    inputServiceCategory: document.getElementById('service-category'),
    inputServicePrice: document.getElementById('service-price'),
    inputServiceDesc: document.getElementById('service-desc'),

    // Dias e Horários
    daysContainer: document.getElementById('days-selector-grid'),
    inputTimeStart: document.getElementById('time-start'),
    inputTimeEnd: document.getElementById('time-end'),
    btnSaveSchedule: document.getElementById('btn-save-schedule'),
    slotsManagerGrid: document.getElementById('slots-manager-grid'),

    // Toast
    toast: document.getElementById('admin-toast'),
    toastMsg: document.getElementById('toast-message')
  };

  // Inicialização
  function init() {
    loadSavedData();
    checkAuthStatus();
    setupEventListeners();
  }

  // Carrega dados do LocalStorage ou do config.js padrão
  function loadSavedData() {
    // 1. Serviços
    const savedServices = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (savedServices) {
      try {
        state.services = JSON.parse(savedServices);
      } catch (e) {
        state.services = [...(window.BIEL_CONFIG?.services || [])];
      }
    } else {
      state.services = window.BIEL_CONFIG ? [...window.BIEL_CONFIG.services] : [];
    }

    // 2. Dias de trabalho
    const savedDays = localStorage.getItem(STORAGE_KEYS.WORKING_DAYS);
    if (savedDays) {
      try {
        state.workingDays = JSON.parse(savedDays);
      } catch (e) {
        state.workingDays = DEFAULT_DAYS;
      }
    } else {
      state.workingDays = DEFAULT_DAYS;
    }

    // 3. Horários de funcionamento
    const savedHours = localStorage.getItem(STORAGE_KEYS.WORKING_HOURS);
    if (savedHours) {
      try {
        state.workingHours = JSON.parse(savedHours);
      } catch (e) {
        state.workingHours = DEFAULT_HOURS;
      }
    } else {
      state.workingHours = DEFAULT_HOURS;
    }

    // 4. Slots bloqueados
    const savedSlots = localStorage.getItem(STORAGE_KEYS.BLOCKED_SLOTS);
    if (savedSlots) {
      try {
        state.blockedSlots = JSON.parse(savedSlots);
      } catch (e) {
        state.blockedSlots = [];
      }
    } else {
      state.blockedSlots = [];
    }
  }

  // Checa se já está autenticado
  function checkAuthStatus() {
    const isAuth = sessionStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
    if (isAuth) {
      showAdminView();
    } else {
      showLoginView();
    }
  }

  function showLoginView() {
    state.isAuthenticated = false;
    dom.loginView.classList.add('active');
    dom.adminView.classList.remove('active');
  }

  function showAdminView() {
    state.isAuthenticated = true;
    dom.loginView.classList.remove('active');
    dom.adminView.classList.add('active');

    renderServices();
    renderSchedule();
  }

  // Event Listeners
  function setupEventListeners() {
    // Login
    dom.loginForm.addEventListener('submit', handleLogin);
    dom.btnLogout.addEventListener('click', handleLogout);

    // Abas
    dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        dom.tabBtns.forEach(b => b.classList.remove('active'));
        dom.panels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const activePanel = document.getElementById(`panel-${targetTab}`);
        if (activePanel) activePanel.classList.add('active');
      });
    });

    // Serviços
    dom.btnAddService.addEventListener('click', () => openServiceModal());
    dom.btnCancelService.addEventListener('click', closeServiceModal);
    dom.serviceForm.addEventListener('submit', handleSaveService);

    // Salvar Horários e Dias
    dom.btnSaveSchedule.addEventListener('click', handleSaveSchedule);
  }

  // Processo de Login
  function handleLogin(e) {
    e.preventDefault();
    const pass = dom.passInput.value.trim();

    if (pass === ADMIN_PASSCODE) {
      sessionStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      dom.loginError.style.display = 'none';
      dom.passInput.value = '';
      showAdminView();
      showToast('Acesso concedido. Bem-vindo, Biel!');
    } else {
      dom.loginError.style.display = 'block';
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEYS.AUTH);
    showLoginView();
    showToast('Sessão encerrada.');
  }

  // Renderização de Serviços
  function renderServices() {
    dom.serviceList.innerHTML = '';

    if (!state.services.length) {
      dom.serviceList.innerHTML = `
        <div style="text-align: center; color: var(--color-gray); padding: 30px;">
          Nenhum serviço cadastrado ainda.
        </div>`;
      return;
    }

    state.services.forEach(service => {
      const row = document.createElement('div');
      row.className = 'admin-service-row';
      row.innerHTML = `
        <div class="admin-service-details">
          <div class="admin-service-name">${escapeHTML(service.name)}</div>
          <div class="admin-service-meta">
            <span style="color: var(--color-orange); font-weight: 700;">
              R$ ${Number(service.price).toFixed(2).replace('.', ',')}
            </span>
            <span>&bull;</span>
            <span style="text-transform: capitalize;">${escapeHTML(service.category || 'Geral')}</span>
          </div>
          <p style="font-size: 0.8rem; color: var(--color-gray); margin-top: 4px;">
            ${escapeHTML(service.description || '')}
          </p>
        </div>
        <div class="admin-service-actions">
          <button class="btn-icon-admin btn-edit-srv" data-id="${service.id}" title="Editar Serviço">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon-admin danger btn-delete-srv" data-id="${service.id}" title="Excluir Serviço">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;

      // Eventos de clique nos botões da linha
      row.querySelector('.btn-edit-srv').addEventListener('click', () => {
        openServiceModal(service);
      });

      row.querySelector('.btn-delete-srv').addEventListener('click', () => {
        handleDeleteService(service.id, service.name);
      });

      dom.serviceList.appendChild(row);
    });
  }

  // Modal de Serviço
  function openServiceModal(service = null) {
    if (service) {
      document.getElementById('service-modal-title').textContent = 'Editar Serviço';
      dom.inputServiceId.value = service.id;
      dom.inputServiceName.value = service.name;
      dom.inputServiceCategory.value = service.category || 'cortes';
      dom.inputServicePrice.value = service.price;
      dom.inputServiceDesc.value = service.description || '';
    } else {
      document.getElementById('service-modal-title').textContent = 'Novo Serviço';
      dom.inputServiceId.value = '';
      dom.serviceForm.reset();
    }

    dom.serviceModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeServiceModal() {
    dom.serviceModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function handleSaveService(e) {
    e.preventDefault();
    const id = dom.inputServiceId.value;
    const name = dom.inputServiceName.value.trim();
    const category = dom.inputServiceCategory.value;
    const price = parseFloat(dom.inputServicePrice.value);
    const desc = dom.inputServiceDesc.value.trim();

    if (!name || isNaN(price)) {
      alert('Por favor, preencha o nome e um preço válido.');
      return;
    }

    if (id) {
      // Editar existente
      const index = state.services.findIndex(s => s.id === id);
      if (index !== -1) {
        state.services[index] = {
          ...state.services[index],
          name,
          category,
          price,
          description: desc
        };
      }
    } else {
      // Criar novo
      const newId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + Date.now().toString().slice(-4);
      state.services.push({
        id: newId,
        name,
        category,
        price,
        durationMinutes: 30,
        description: desc,
        image: 'assets/img/service_corte.webp',
        featured: false
      });
    }

    // Salvar no LocalStorage
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(state.services));
    closeServiceModal();
    renderServices();
    showToast('Serviço salvo com sucesso!');
  }

  function handleDeleteService(id, name) {
    if (confirm(`Tem certeza que deseja excluir o serviço "${name}"?`)) {
      state.services = state.services.filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(state.services));
      renderServices();
      showToast('Serviço removido.');
    }
  }

  // Renderizar Dias e Horários
  function renderSchedule() {
    // 1. Grid de Dias
    dom.daysContainer.innerHTML = '';
    state.workingDays.forEach(item => {
      const card = document.createElement('div');
      card.className = `day-toggle-card ${item.active ? 'active' : ''}`;
      card.innerHTML = `
        <span class="day-name">${item.name}</span>
        <span class="day-status">${item.active ? 'Atende' : 'Folga'}</span>
      `;

      card.addEventListener('click', () => {
        item.active = !item.active;
        card.classList.toggle('active', item.active);
        card.querySelector('.day-status').textContent = item.active ? 'Atende' : 'Folga';
      });

      dom.daysContainer.appendChild(card);
    });

    // 2. Horários
    dom.inputTimeStart.value = state.workingHours.start || '09:00';
    dom.inputTimeEnd.value = state.workingHours.end || '19:00';

    renderTimeSlotsManager();
  }

  // Gerador e Bloqueador de horários do dia
  function renderTimeSlotsManager() {
    dom.slotsManagerGrid.innerHTML = '';

    const start = dom.inputTimeStart.value || '09:00';
    const end = dom.inputTimeEnd.value || '19:00';
    const slots = generateTimeSlots(start, end, 30);

    slots.forEach(time => {
      const isBlocked = state.blockedSlots.includes(time);
      const badge = document.createElement('div');
      badge.className = `slot-toggle-badge ${isBlocked ? 'blocked' : 'available'}`;
      badge.textContent = time;
      badge.title = isBlocked ? 'Horário Bloqueado (Clique para liberar)' : 'Horário Disponível (Clique para pausar)';

      badge.addEventListener('click', () => {
        if (state.blockedSlots.includes(time)) {
          state.blockedSlots = state.blockedSlots.filter(t => t !== time);
          badge.className = 'slot-toggle-badge available';
          badge.title = 'Horário Disponível';
        } else {
          state.blockedSlots.push(time);
          badge.className = 'slot-toggle-badge blocked';
          badge.title = 'Horário Bloqueado';
        }
      });

      dom.slotsManagerGrid.appendChild(badge);
    });
  }

  function generateTimeSlots(startTime, endTime, intervalMinutes = 30) {
    const slots = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let current = new Date();
    current.setHours(startH, startM, 0, 0);

    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    while (current < end) {
      const h = String(current.getHours()).padStart(2, '0');
      const m = String(current.getMinutes()).padStart(2, '0');
      slots.push(`${h}:${m}`);
      current.setMinutes(current.getMinutes() + intervalMinutes);
    }

    return slots;
  }

  function handleSaveSchedule() {
    const start = dom.inputTimeStart.value;
    const end = dom.inputTimeEnd.value;

    if (!start || !end) {
      alert('Preencha os horários de início e término.');
      return;
    }

    state.workingHours = {
      start,
      end,
      interval: 30
    };

    // Salva dias, horários e bloqueios
    localStorage.setItem(STORAGE_KEYS.WORKING_DAYS, JSON.stringify(state.workingDays));
    localStorage.setItem(STORAGE_KEYS.WORKING_HOURS, JSON.stringify(state.workingHours));
    localStorage.setItem(STORAGE_KEYS.BLOCKED_SLOTS, JSON.stringify(state.blockedSlots));

    renderTimeSlotsManager();
    showToast('Agenda de trabalho atualizada!');
  }

  // Notificação Toast
  let toastTimer = null;
  function showToast(msg) {
    dom.toastMsg.textContent = msg;
    dom.toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      dom.toast.classList.remove('show');
    }, 3500);
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Inicializa quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
