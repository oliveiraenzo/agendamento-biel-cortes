/**
 * BIEL CORTES — ADMIN CONTROLLER (MOBILE FIRST)
 * 4 seções em botões: Preços, Serviços, Dias, Horários
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

  const API_URL = window.BIEL_CONFIG?.apiUrl || 'http://localhost:3001/api';

  const ADMIN_PASSCODE = 'biel123';

  const DEFAULT_DAYS = [
    { day: 1, name: 'Segunda-feira', active: true },
    { day: 2, name: 'Terça-feira', active: true },
    { day: 3, name: 'Quarta-feira', active: true },
    { day: 4, name: 'Quinta-feira', active: true },
    { day: 5, name: 'Sexta-feira', active: true },
    { day: 6, name: 'Sábado', active: true },
    { day: 0, name: 'Domingo', active: false }
  ];

  const DEFAULT_HOURS = {
    start: '09:00',
    end: '19:00',
    interval: 30
  };

  let state = {
    isAuthenticated: false,
    services: [],
    workingDays: [],
    workingHours: {},
    blockedSlots: []
  };

  // Cache do DOM
  const dom = {
    loginView: document.getElementById('login-view'),
    adminView: document.getElementById('admin-view'),
    loginForm: document.getElementById('admin-login-form'),
    passInput: document.getElementById('admin-password-input'),
    loginError: document.getElementById('admin-login-error'),
    btnLogout: document.getElementById('btn-logout'),

    // Botões de Navegação (Pills no topo e barra inferior)
    navPills: document.querySelectorAll('.admin-nav-pill'),
    bottomBtns: document.querySelectorAll('.bottom-bar-btn'),
    panels: document.querySelectorAll('.admin-panel'),

    // Painel 1: Preços
    quickPriceList: document.getElementById('quick-price-list'),
    btnSavePrices: document.getElementById('btn-save-prices'),

    // Painel 2: Serviços
    serviceList: document.getElementById('admin-services-list'),
    btnAddService: document.getElementById('btn-add-service'),
    serviceModal: document.getElementById('service-edit-modal'),
    serviceForm: document.getElementById('service-edit-form'),
    btnCancelService: document.getElementById('btn-cancel-service'),
    inputServiceId: document.getElementById('service-id'),
    inputServiceName: document.getElementById('service-name'),
    inputServiceCategory: document.getElementById('service-category'),
    inputServicePrice: document.getElementById('service-price'),
    inputServiceDesc: document.getElementById('service-desc'),

    // Painel 3: Dias
    daysContainer: document.getElementById('days-selector-grid'),
    btnSaveDays: document.getElementById('btn-save-days'),

    // Painel 4: Horários
    inputTimeStart: document.getElementById('time-start'),
    inputTimeEnd: document.getElementById('time-end'),
    slotsManagerGrid: document.getElementById('slots-manager-grid'),
    btnSaveHours: document.getElementById('btn-save-hours'),

    // Painel 0: Agenda
    agendaDateInput: document.getElementById('admin-agenda-date'),
    btnRefreshAgenda: document.getElementById('btn-refresh-agenda'),
    appointmentsList: document.getElementById('admin-appointments-list'),
    btnAdminNewBooking: document.getElementById('btn-admin-new-booking'),
    adminBookingModal: document.getElementById('admin-booking-modal'),
    btnCloseAdminBooking: document.getElementById('btn-close-admin-booking'),
    adminBookingForm: document.getElementById('admin-new-booking-form'),
    adminBookName: document.getElementById('admin-book-name'),
    adminBookPhone: document.getElementById('admin-book-phone'),
    adminBookService: document.getElementById('admin-book-service'),
    adminBookDate: document.getElementById('admin-book-date'),
    adminBookTime: document.getElementById('admin-book-time'),

    // Toast
    toast: document.getElementById('admin-toast'),
    toastMsg: document.getElementById('toast-message')
  };

  function init() {
    loadSavedData();
    checkAuthStatus();
    setupEventListeners();
  }

  function loadSavedData() {
    // 1. Serviços e Preços
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

    // 2. Dias de Trabalho
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

    // 3. Horários
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

    // 4. Bloqueios
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

    // Inicializa a data de hoje no filtro
    if (dom.agendaDateInput && !dom.agendaDateInput.value) {
      dom.agendaDateInput.value = new Date().toISOString().split('T')[0];
    }

    loadAgenda();
    renderPricesPanel();
    renderServicesPanel();
    renderDaysPanel();
    renderHoursPanel();
  }

  function switchTab(targetTab) {
    // Sincroniza botões superiores e barra inferior
    dom.navPills.forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-tab') === targetTab);
    });
    dom.bottomBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === targetTab);
    });

    // Exibe o painel correspondente
    dom.panels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `panel-${targetTab}`);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setupEventListeners() {
    // Login & Logout
    dom.loginForm.addEventListener('submit', handleLogin);
    dom.btnLogout.addEventListener('click', handleLogout);

    // Navegação por Botões (Pills superiores)
    dom.navPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const tab = pill.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    // Navegação Barra Inferior Mobile
    dom.bottomBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    // PAINEL 1: Salvar Preços
    dom.btnSavePrices.addEventListener('click', handleSavePrices);

    // PAINEL 2: Serviços
    dom.btnAddService.addEventListener('click', () => openServiceModal());
    dom.btnCancelService.addEventListener('click', closeServiceModal);
    dom.serviceForm.addEventListener('submit', handleSaveService);

    // PAINEL 3: Salvar Dias
    dom.btnSaveDays.addEventListener('click', handleSaveDays);

    // PAINEL 4: Salvar Horários
    dom.btnSaveHours.addEventListener('click', handleSaveHours);
    dom.inputTimeStart.addEventListener('change', renderSlotsManager);
    dom.inputTimeEnd.addEventListener('change', renderSlotsManager);

    // PAINEL 0: Agenda
    if (dom.btnRefreshAgenda) {
      dom.btnRefreshAgenda.addEventListener('click', loadAgenda);
    }
    if (dom.agendaDateInput) {
      dom.agendaDateInput.addEventListener('change', loadAgenda);
    }
    if (dom.btnAdminNewBooking) {
      dom.btnAdminNewBooking.addEventListener('click', openAdminBookingModal);
    }
    if (dom.btnCloseAdminBooking) {
      dom.btnCloseAdminBooking.addEventListener('click', closeAdminBookingModal);
    }
    if (dom.adminBookDate) {
      dom.adminBookDate.addEventListener('change', loadAdminAvailableSlots);
    }
    if (dom.adminBookingForm) {
      dom.adminBookingForm.addEventListener('submit', handleAdminCreateBooking);
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    if (dom.passInput.value.trim() === ADMIN_PASSCODE) {
      sessionStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      dom.loginError.style.display = 'none';
      dom.passInput.value = '';
      showAdminView();
      showToast('Bem-vindo, Biel!');
    } else {
      dom.loginError.style.display = 'block';
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEYS.AUTH);
    showLoginView();
    showToast('Sessão encerrada.');
  }

  // =========================================================================
  // 0. PAINEL DE AGENDA (CARREGAR, CANCELAR E NOVO AGENDAMENTO)
  // =========================================================================
  async function loadAgenda() {
    if (!dom.appointmentsList) return;
    const date = dom.agendaDateInput ? dom.agendaDateInput.value : '';

    dom.appointmentsList.innerHTML = '<div style="text-align: center; color: var(--color-gray); padding: 24px;">Carregando agendamentos...</div>';

    try {
      const url = date ? `${API_URL}/appointments?date=${date}` : `${API_URL}/appointments`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Falha ao buscar agendamentos');
      const data = await res.json();
      renderAppointments(data.appointments || []);
    } catch (err) {
      console.warn('Erro ao carregar agenda:', err.message);
      dom.appointmentsList.innerHTML = `
        <div style="text-align: center; color: var(--color-gray); padding: 24px;">
          Nenhum agendamento encontrado no banco para esta data ou backend offline.
        </div>
      `;
    }
  }

  function renderAppointments(list) {
    dom.appointmentsList.innerHTML = '';
    if (list.length === 0) {
      dom.appointmentsList.innerHTML = `
        <div style="text-align: center; color: var(--color-gray); padding: 28px; background: #141414; border-radius: 12px;">
          Nenhum cliente agendado para este dia.
        </div>
      `;
      return;
    }

    list.forEach(app => {
      const isPix = (app.paymentMethod || 'PIX') === 'PIX';
      const isConfirmed = app.paymentStatus === 'CONFIRMADO_PELO_BIEL';

      let badgeHtml = '';
      if (isConfirmed) {
        badgeHtml = `<span style="background: rgba(46, 213, 115, 0.2); color: #2ed573; border: 1px solid #2ed573; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;">✓ PAGO CONFIRMADO</span>`;
      } else if (isPix) {
        badgeHtml = `<span style="background: rgba(243, 146, 0, 0.2); color: var(--color-orange); border: 1px solid var(--color-orange); font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;">PIX - CONFERIR EXTRATO</span>`;
      } else {
        badgeHtml = `<span style="background: rgba(255, 255, 255, 0.1); color: var(--color-gray); border: 1px solid #444; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;">PAGAR NA HORA</span>`;
      }

      const card = document.createElement('div');
      card.className = 'admin-service-item';
      card.style.cssText = 'display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; border-left: 3px solid ' + (isConfirmed ? '#2ed573' : (isPix ? 'var(--color-orange)' : '#666')) + ';';
      card.innerHTML = `
        <div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="background: var(--color-orange); color: #000; font-weight: 700; font-size: 0.8rem; padding: 2px 8px; border-radius: 4px;">
              ${escapeHTML(app.startTime || app.time)}
            </span>
            <strong style="color: var(--color-ice); font-size: 1.05rem;">${escapeHTML(app.clientName)}</strong>
            ${badgeHtml}
          </div>
          <div style="font-size: 0.85rem; color: var(--color-gray); margin-top: 4px;">
            ✂️ ${escapeHTML(app.serviceName)} &bull; 💰 R$ ${Number(app.price || 0).toFixed(2)} &bull; 📱 ${escapeHTML(app.clientPhone)}
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          ${!isConfirmed ? `
            <button type="button" class="btn-confirm-pay" data-id="${app._id || app.id}" style="background: #143521; border: 1px solid #2ed573; color: #2ed573; padding: 6px 10px; border-radius: 8px; font-size: 0.78rem; cursor: pointer;" title="Confirmar recebimento do dinheiro ou Pix">
              ✓ Marcar Pago
            </button>
          ` : ''}
          <a href="https://wa.me/55${app.clientPhone.replace(/\D/g, '')}" target="_blank" class="btn-secondary" style="padding: 6px 12px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 4px;">
            WhatsApp
          </a>
          <button type="button" class="btn-cancel-app" data-id="${app._id || app.id}" style="background: #331515; border: 1px solid var(--color-error); color: #ff6b6b; padding: 6px 12px; border-radius: 8px; font-size: 0.8rem; cursor: pointer;">
            Desmarcar
          </button>
        </div>
      `;

      // Evento de Marcar Pago
      const btnConfirm = card.querySelector('.btn-confirm-pay');
      if (btnConfirm) {
        btnConfirm.addEventListener('click', async () => {
          try {
            await fetch(`${API_URL}/appointments/${app._id || app.id}/payment`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentStatus: 'CONFIRMADO_PELO_BIEL' })
            });
            showToast('Pagamento confirmado!');
            loadAgenda();
          } catch (e) {
            alert('Erro: ' + e.message);
          }
        });
      }

      card.querySelector('.btn-cancel-app').addEventListener('click', () => {
        handleCancelAppointment(app._id || app.id, app.clientName, app.startTime || app.time);
      });

      dom.appointmentsList.appendChild(card);
    });
  }

  async function handleCancelAppointment(id, name, time) {
    if (!confirm(`Deseja realmente desmarcar o agendamento de ${name} às ${time}? O horário será liberado imediatamente.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/appointments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao desmarcar');
      showToast('Horário desmarcado e liberado!');
      loadAgenda();
    } catch (err) {
      alert('Erro ao cancelar: ' + err.message);
    }
  }

  function openAdminBookingModal() {
    if (!dom.adminBookingModal) return;
    // Popula select de serviços
    if (dom.adminBookService) {
      dom.adminBookService.innerHTML = state.services.map(s => `
        <option value="${s.id}" data-duration="${s.durationMinutes || 30}" data-price="${s.price}">
          ${s.name} - R$ ${Number(s.price).toFixed(2)}
        </option>
      `).join('');
    }

    if (dom.adminBookDate) {
      dom.adminBookDate.value = dom.agendaDateInput ? dom.agendaDateInput.value : new Date().toISOString().split('T')[0];
      loadAdminAvailableSlots();
    }

    dom.adminBookingModal.classList.add('open');
  }

  function closeAdminBookingModal() {
    if (dom.adminBookingModal) {
      dom.adminBookingModal.classList.remove('open');
    }
  }

  async function loadAdminAvailableSlots() {
    const date = dom.adminBookDate.value;
    if (!date || !dom.adminBookTime) return;

    dom.adminBookTime.innerHTML = '<option value="">Buscando horários...</option>';
    try {
      const selectedOption = dom.adminBookService.options[dom.adminBookService.selectedIndex];
      const duration = selectedOption ? selectedOption.getAttribute('data-duration') : 30;

      const res = await fetch(`${API_URL}/slots?date=${date}&duration=${duration}`);
      if (res.ok) {
        const data = await res.json();
        const slots = data.slots || [];
        if (slots.length === 0) {
          dom.adminBookTime.innerHTML = '<option value="">Nenhum horário livre neste dia</option>';
        } else {
          dom.adminBookTime.innerHTML = slots.map(t => `<option value="${t}">${t}</option>`).join('');
        }
      }
    } catch (e) {
      dom.adminBookTime.innerHTML = '<option value="09:00">09:00</option><option value="10:00">10:00</option><option value="14:00">14:00</option><option value="15:00">15:00</option>';
    }
  }

  async function handleAdminCreateBooking(e) {
    e.preventDefault();
    const selectedOption = dom.adminBookService.options[dom.adminBookService.selectedIndex];
    const duration = parseInt(selectedOption.getAttribute('data-duration') || '30', 10);
    const price = parseFloat(selectedOption.getAttribute('data-price') || '0');

    const payload = {
      clientName: dom.adminBookName.value.trim(),
      clientPhone: dom.adminBookPhone.value.trim(),
      serviceId: dom.adminBookService.value,
      serviceName: selectedOption.textContent.split('-')[0].trim(),
      price: price,
      date: dom.adminBookDate.value,
      time: dom.adminBookTime.value,
      durationMinutes: duration
    };

    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao registrar');
      }

      showToast('Agendamento criado com sucesso!');
      closeAdminBookingModal();
      dom.adminBookingForm.reset();
      loadAgenda();
    } catch (err) {
      alert('Aviso: ' + err.message);
    }
  }

  // =========================================================================
  // 1. PAINEL DE PREÇOS (AJUSTE FÁCIL E RÁPIDO)
  // =========================================================================
  function renderPricesPanel() {
    dom.quickPriceList.innerHTML = '';

    state.services.forEach(service => {
      const row = document.createElement('div');
      row.className = 'admin-price-row';
      row.innerHTML = `
        <div class="admin-price-info">
          <div class="admin-price-name">${escapeHTML(service.name)}</div>
          <div class="admin-price-category">${escapeHTML(service.category || 'Corte')}</div>
        </div>
        <div class="admin-price-input-box">
          <span class="admin-price-currency">R$</span>
          <input type="number" step="0.50" min="0" class="admin-price-field" data-id="${service.id}" value="${Number(service.price).toFixed(2)}">
        </div>
      `;
      dom.quickPriceList.appendChild(row);
    });
  }

  function handleSavePrices() {
    const inputs = dom.quickPriceList.querySelectorAll('.admin-price-field');
    inputs.forEach(input => {
      const id = input.getAttribute('data-id');
      const val = parseFloat(input.value);
      if (!isNaN(val)) {
        const item = state.services.find(s => s.id === id);
        if (item) item.price = val;
      }
    });

    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(state.services));
    renderServicesPanel();
    showToast('Tabela de preços atualizada com sucesso!');
  }

  // =========================================================================
  // 2. PAINEL DE SERVIÇOS (ADICIONAR / EDITAR / EXCLUIR)
  // =========================================================================
  function renderServicesPanel() {
    dom.serviceList.innerHTML = '';

    if (!state.services.length) {
      dom.serviceList.innerHTML = '<p style="text-align: center; color: var(--color-gray); padding: 20px;">Nenhum serviço cadastrado.</p>';
      return;
    }

    state.services.forEach(service => {
      const card = document.createElement('div');
      card.className = 'admin-service-row';
      card.innerHTML = `
        <div class="admin-service-header-row">
          <span class="admin-service-name">${escapeHTML(service.name)}</span>
          <span class="admin-service-badge-price">R$ ${Number(service.price).toFixed(2).replace('.', ',')}</span>
        </div>
        <p class="admin-service-desc">${escapeHTML(service.description || 'Sem descrição cadastrada.')}</p>
        <div class="admin-service-btn-group">
          <button class="btn-card-action btn-edit-srv" data-id="${service.id}" type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            <span>Editar</span>
          </button>
          <button class="btn-card-action danger btn-del-srv" data-id="${service.id}" type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
            <span>Excluir</span>
          </button>
        </div>
      `;

      card.querySelector('.btn-edit-srv').addEventListener('click', () => openServiceModal(service));
      card.querySelector('.btn-del-srv').addEventListener('click', () => handleDeleteService(service.id, service.name));

      dom.serviceList.appendChild(card);
    });
  }

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

    if (!name || isNaN(price)) return;

    if (id) {
      const idx = state.services.findIndex(s => s.id === id);
      if (idx !== -1) {
        state.services[idx] = { ...state.services[idx], name, category, price, description: desc };
      }
    } else {
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

    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(state.services));
    closeServiceModal();
    renderServicesPanel();
    renderPricesPanel();
    showToast('Serviço salvo!');
  }

  function handleDeleteService(id, name) {
    if (confirm(`Excluir "${name}" do catálogo?`)) {
      state.services = state.services.filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(state.services));
      renderServicesPanel();
      renderPricesPanel();
      showToast('Serviço excluído.');
    }
  }

  // =========================================================================
  // 3. PAINEL DE DIAS (BOTÕES GRANDES DE ATENDE / FOLGA)
  // =========================================================================
  function renderDaysPanel() {
    dom.daysContainer.innerHTML = '';

    state.workingDays.forEach(item => {
      const btn = document.createElement('div');
      btn.className = `day-btn-card ${item.active ? 'active' : ''}`;
      btn.innerHTML = `
        <span class="day-btn-name">${item.name}</span>
        <span class="day-btn-pill">${item.active ? 'Atende' : 'Folga'}</span>
      `;

      btn.addEventListener('click', () => {
        item.active = !item.active;
        btn.classList.toggle('active', item.active);
        btn.querySelector('.day-btn-pill').textContent = item.active ? 'Atende' : 'Folga';
      });

      dom.daysContainer.appendChild(btn);
    });
  }

  function handleSaveDays() {
    localStorage.setItem(STORAGE_KEYS.WORKING_DAYS, JSON.stringify(state.workingDays));
    showToast('Dias de trabalho salvos!');
  }

  // =========================================================================
  // 4. PAINEL DE HORÁRIOS & BLOQUEIOS DE SLOTS
  // =========================================================================
  function renderHoursPanel() {
    dom.inputTimeStart.value = state.workingHours.start || '09:00';
    dom.inputTimeEnd.value = state.workingHours.end || '19:00';
    renderSlotsManager();
  }

  function renderSlotsManager() {
    dom.slotsManagerGrid.innerHTML = '';
    const start = dom.inputTimeStart.value || '09:00';
    const end = dom.inputTimeEnd.value || '19:00';

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    for (let m = startMin; m < endMin; m += 30) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;

      const isBlocked = state.blockedSlots.includes(timeStr);
      const btn = document.createElement('div');
      btn.className = `slot-btn-mobile ${isBlocked ? 'blocked' : 'available'}`;
      btn.textContent = timeStr;

      btn.addEventListener('click', () => {
        if (state.blockedSlots.includes(timeStr)) {
          state.blockedSlots = state.blockedSlots.filter(t => t !== timeStr);
          btn.className = 'slot-btn-mobile available';
        } else {
          state.blockedSlots.push(timeStr);
          btn.className = 'slot-btn-mobile blocked';
        }
      });

      dom.slotsManagerGrid.appendChild(btn);
    }
  }

  function handleSaveHours() {
    state.workingHours = {
      start: dom.inputTimeStart.value || '09:00',
      end: dom.inputTimeEnd.value || '19:00',
      interval: 30
    };

    localStorage.setItem(STORAGE_KEYS.WORKING_HOURS, JSON.stringify(state.workingHours));
    localStorage.setItem(STORAGE_KEYS.BLOCKED_SLOTS, JSON.stringify(state.blockedSlots));
    showToast('Horários e intervalos salvos!');
  }

  // Toast
  let toastTimer = null;
  function showToast(msg) {
    dom.toastMsg.textContent = msg;
    dom.toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      dom.toast.classList.remove('show');
    }, 3000);
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
