/**
 * BIEL CORTES — URBAN PREMIUM BARBER (ENGINE RESPONSIVO)
 * Gerenciamento de Filtros, Busca, Seleção e Agendamento WhatsApp
 */

(function () {
  'use strict';

  const CONFIG = window.BIEL_CONFIG || {};
  const API_URL = CONFIG.apiUrl || 'https://agendamento-biel-cortes.onrender.com/api';

  // Carrega serviços sincronizados com o Painel Admin (LocalStorage) ou fallback do config.js
  let SERVICES = [...(CONFIG.services || [])];
  try {
    const adminServices = localStorage.getItem('biel_admin_services');
    if (adminServices) {
      SERVICES = JSON.parse(adminServices);
    }
  } catch (e) { }

  const GALLERY = CONFIG.gallery || [];
  const WHATSAPP_NUMBER = CONFIG.whatsappNumber || '551196483-5563';

  // Estado da Aplicação
  const state = {
    activeCategory: 'todos',
    searchQuery: '',
    selectedServices: [],
    bookingDate: '',
    bookingTime: '',
    clientName: '',
    clientPhone: ''
  };

  // Cache de Elementos
  const dom = {
    pixModal: document.getElementById('pix-payment-modal'),
    btnClosePixModal: document.getElementById('btn-close-pix-modal'),
    pixQrImg: document.getElementById('pix-qr-img'),
    pixModalAmount: document.getElementById('pix-modal-amount'),
    btnCopyPix: document.getElementById('btn-copy-pix'),
    btnFinishPix: document.getElementById('btn-finish-pix'),
    featuredContainer: document.getElementById('featured-cards-container'),
    servicesContainer: document.getElementById('services-catalog-container'),
    galleryContainer: document.getElementById('gallery-container'),
    categoryFilterBar: document.getElementById('category-filter-bar'),
    searchInput: document.getElementById('services-search-input'),
    floatingBar: document.getElementById('floating-selection-bar'),
    floatingBarCount: document.getElementById('floating-bar-count'),
    floatingBarPrice: document.getElementById('floating-bar-price'),
    btnOpenBookingModal: document.getElementById('btn-open-booking-modal'),
    modalOverlay: document.getElementById('booking-modal-overlay'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    modalServiceName: document.getElementById('modal-service-name'),
    modalServiceDuration: document.getElementById('modal-service-duration'),
    modalServicePrice: document.getElementById('modal-service-price'),
    bookingDateInput: document.getElementById('booking-date-input'),
    modalTimeSlots: document.getElementById('modal-time-slots'),
    clientNameInput: document.getElementById('client-name-input'),
    clientPhoneInput: document.getElementById('client-phone-input'),
    btnConfirmAppointment: document.getElementById('btn-confirm-appointment'),
    btnHeaderAgendar: document.getElementById('btn-header-agendar'),
    btnHeroAgendar: document.getElementById('btn-hero-agendar'),
    btnLocationAgendar: document.getElementById('btn-location-agendar'),
    btnBottomAgendar: document.getElementById('btn-bottom-agendar'),
    mainHeader: document.getElementById('main-header'),
    toast: document.getElementById('app-toast'),
    desktopNavLinks: document.querySelectorAll('.desktop-nav-link'),
    bottomNavLinks: document.querySelectorAll('.nav-tab-item')
  };

  function formatMoney(amount) {
    return Number(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatDateBR(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  let toastTimer = null;
  function showToast(message, type = 'normal') {
    if (!dom.toast) return;
    clearTimeout(toastTimer);
    dom.toast.textContent = message;
    dom.toast.className = `app-toast show ${type}`;
    toastTimer = setTimeout(() => {
      dom.toast.classList.remove('show');
    }, 3200);
  }

  /**
   * Renderiza os Cards de Serviços em Destaque
   */
  function renderFeaturedCards(category = 'todos') {
    if (!dom.featuredContainer) return;
    dom.featuredContainer.innerHTML = '';

    const filtered = SERVICES.filter(s => {
      if (category === 'todos') return s.featured;
      return s.category === category;
    });

    const listToRender = filtered.length > 0 ? filtered : SERVICES.filter(s => s.featured);

    const fragment = document.createDocumentFragment();
    listToRender.forEach(service => {
      const isSelected = state.selectedServices.some(s => s.id === service.id);
      const card = document.createElement('div');
      card.className = `featured-card ${isSelected ? 'selected' : ''}`;
      card.dataset.id = service.id;

      card.innerHTML = `
        <div class="featured-img-wrap">
          <div class="photo-placeholder-box featured-placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>Foto do Serviço</span>
          </div>
          <span class="featured-badge">${service.durationMinutes} min</span>
        </div>
        <div class="featured-body">
          <div>
            <h4 class="featured-name">${service.name}</h4>
            <p class="featured-desc">${service.description}</p>
          </div>
          <div class="featured-footer">
            <div>
              <span class="featured-price">${formatMoney(service.price)}</span>
            </div>
            <button class="btn-primary btn-sm btn-select-card" data-id="${service.id}" type="button">
              ${isSelected ? 'Selecionado' : 'Agendar'}
            </button>
          </div>
        </div>
      `;
      fragment.appendChild(card);
    });

    dom.featuredContainer.appendChild(fragment);
  }

  /**
   * Renderiza o Catálogo Completo de Serviços
   */
  function renderServicesCatalog() {
    if (!dom.servicesContainer) return;
    dom.servicesContainer.innerHTML = '';

    const query = state.searchQuery.toLowerCase().trim();
    const category = state.activeCategory;

    const filtered = SERVICES.filter(service => {
      const matchCat = category === 'todos' || service.category === category;
      const matchQuery = !query ||
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      dom.servicesContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 16px; color: var(--color-gray);">
          <p style="font-size: 1.1rem; color: var(--color-ice); margin-bottom: 6px;">Nenhum serviço encontrado</p>
          <p style="font-size: 0.9rem;">Tente buscar por outro termo ou selecione a categoria "Todos".</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    filtered.forEach(service => {
      const isSelected = state.selectedServices.some(s => s.id === service.id);
      const item = document.createElement('div');
      item.className = `service-item-card ${isSelected ? 'selected' : ''}`;
      item.dataset.id = service.id;

      item.innerHTML = `
        <div class="photo-placeholder-box catalog-thumb-placeholder">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </div>
        <div class="service-item-info">
          <h4 class="service-item-title">${service.name}</h4>
          <p class="service-item-desc">${service.description}</p>
          <div class="service-item-meta">
            <span class="service-item-price">${formatMoney(service.price)}</span>
          </div>
        </div>
        <div class="service-select-btn" aria-label="${isSelected ? 'Remover' : 'Selecionar'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      `;
      fragment.appendChild(item);
    });

    dom.servicesContainer.appendChild(fragment);
  }

  /**
   * Renderiza a Galeria
   */
  function renderGallery() {
    if (!dom.galleryContainer) return;
    dom.galleryContainer.innerHTML = GALLERY.map(item => `
      <div class="gallery-item">
        <div class="photo-placeholder-box gallery-placeholder">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <span style="font-size: 0.78rem; color: var(--color-gray); margin-top: 6px;">Foto do Corte</span>
        </div>
        <div class="gallery-item-overlay">
          <span class="gallery-item-tag">${item.category}</span>
          <span class="gallery-item-title">${item.title}</span>
        </div>
      </div>
    `).join('');
  }

  /**
   * Alterna Seleção de Serviços
   */
  function toggleService(serviceId) {
    const service = SERVICES.find(s => s.id === serviceId);
    if (!service) return;

    const idx = state.selectedServices.findIndex(s => s.id === serviceId);
    if (idx >= 0) {
      state.selectedServices.splice(idx, 1);
    } else {
      state.selectedServices.push(service);
    }

    renderFeaturedCards(state.activeCategory);
    renderServicesCatalog();
    updateFloatingBar();
  }

  /**
   * Atualiza a Barra Flutuante
   */
  function updateFloatingBar() {
    if (!dom.floatingBar) return;
    const count = state.selectedServices.length;
    if (count > 0) {
      const totalPrice = state.selectedServices.reduce((sum, s) => sum + s.price, 0);
      dom.floatingBarCount.textContent = count === 1 ? '1 serviço selecionado' : `${count} serviços selecionados`;
      dom.floatingBarPrice.textContent = formatMoney(totalPrice);
      dom.floatingBar.classList.add('show');
    } else {
      dom.floatingBar.classList.remove('show');
    }
  }

  /**
   * Abre o Modal de Agendamento
   */
  function openModal() {
    if (state.selectedServices.length === 0) {
      state.selectedServices.push(SERVICES[0]);
      updateFloatingBar();
    }

    const totalPrice = state.selectedServices.reduce((sum, s) => sum + s.price, 0);
    const names = state.selectedServices.map(s => s.name).join(' + ');

    dom.modalServiceName.textContent = names;
    if (dom.modalServiceDuration) {
      dom.modalServiceDuration.textContent = '30 min';
    }
    dom.modalServicePrice.textContent = formatMoney(totalPrice);

    const now = new Date();
    if (now.getHours() >= 18) now.setDate(now.getDate() + 1);
    const dateStr = now.toISOString().split('T')[0];
    dom.bookingDateInput.min = new Date().toISOString().split('T')[0];
    dom.bookingDateInput.value = dateStr;
    state.bookingDate = dateStr;

    renderTimeSlots(dateStr);

    dom.modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    dom.modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /**
   * Gera Horários Disponíveis buscando da API com fallback local
   */
  async function renderTimeSlots(dateStr) {
    if (!dom.modalTimeSlots) return;
    dom.modalTimeSlots.innerHTML = '<span style="grid-column: span 4; font-size: 0.85rem; color: var(--color-gray); text-align: center; padding: 12px 0;">Consultando horários livres...</span>';

    const duration = state.selectedServices.reduce((sum, s) => sum + (s.durationMinutes || 30), 0) || 30;
    let slots = [];

    try {
      const response = await fetch(`${API_URL}/slots?date=${encodeURIComponent(dateStr)}&duration=${duration}`);
      if (response.ok) {
        const data = await response.json();
        slots = data.slots || [];
      } else {
        throw new Error('Falha na resposta da API');
      }
    } catch (err) {
      console.warn('API indisponível, gerando slots com fallback local:', err.message);
      // Fallback local sincronizado com as configurações do Painel Admin (LocalStorage)
      let workHours = { start: '09:00', end: '19:00' };
      let workingDays = null;
      let blockedSlots = [];

      try {
        const savedHours = localStorage.getItem('biel_admin_working_hours');
        if (savedHours) workHours = JSON.parse(savedHours);

        const savedDays = localStorage.getItem('biel_admin_working_days');
        if (savedDays) workingDays = JSON.parse(savedDays);

        const savedBlocked = localStorage.getItem('biel_admin_blocked_slots');
        if (savedBlocked) blockedSlots = JSON.parse(savedBlocked);
      } catch (e) { }

      // Verifica se o dia selecionado é folga
      if (workingDays && Array.isArray(workingDays)) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const selectedDayOfWeek = new Date(year, month - 1, day).getDay();
        const dayConfig = workingDays.find(d => d.day === selectedDayOfWeek);
        if (dayConfig && !dayConfig.active) {
          dom.modalTimeSlots.innerHTML = '<span style="grid-column: span 4; font-size: 0.85rem; color: #ff6b81; text-align: center; padding: 12px 0;">O Gabriel não atende neste dia da semana (Folga). Por favor, selecione outra data.</span>';
          return;
        }
      }

      const now = new Date();
      const isToday = dateStr === now.toISOString().split('T')[0];
      const currentMin = now.getHours() * 60 + now.getMinutes();

      const [startH, startM] = (workHours.start || '09:00').split(':').map(Number);
      const [endH, endM] = (workHours.end || '19:00').split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;

      for (let m = startMin; m < endMin; m += 30) {
        if (isToday && m <= currentMin + 15) continue;
        const hh = String(Math.floor(m / 60)).padStart(2, '0');
        const mm = String(m % 60).padStart(2, '0');
        const timeFormatted = `${hh}:${mm}`;
        if (!blockedSlots.includes(timeFormatted)) {
          slots.push(timeFormatted);
        }
      }
    }

    dom.modalTimeSlots.innerHTML = '';

    if (slots.length === 0) {
      dom.modalTimeSlots.innerHTML = `<span style="grid-column: span 4; font-size: 0.85rem; color: var(--color-gray); text-align: center; padding: 12px 0;">Sem horários livres para esta data. Escolha outro dia.</span>`;
      state.bookingTime = '';
      return;
    }

    const fragment = document.createDocumentFragment();
    slots.forEach((time, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `time-slot-btn ${idx === 0 ? 'selected' : ''}`;
      btn.textContent = time;
      btn.dataset.time = time;
      fragment.appendChild(btn);
    });

    dom.modalTimeSlots.appendChild(fragment);
    state.bookingTime = slots[0];
  }

  /**
   * Helper para gerar a payload do Pix Padrão Banco Central (BR Code EMV)
   */
  function generatePixPayload(key, name, city, amount, txid = 'BIELCORTES') {
    function emv(id, value) {
      const len = String(value.length).padStart(2, '0');
      return `${id}${len}${value}`;
    }

    const cleanKey = key.replace(/\D/g, '');
    const merchantAccount = 
      emv('00', 'br.gov.bcb.pix') +
      emv('01', cleanKey);

    const formattedAmount = Number(amount).toFixed(2);

    let payload = 
      emv('00', '01') + // Format Indicator
      emv('26', merchantAccount) +
      emv('52', '0000') + // Merchant Category Code
      emv('53', '986') + // Currency Real (986)
      emv('54', formattedAmount) + // Amount
      emv('58', 'BR') + // Country
      emv('59', name.substring(0, 25).toUpperCase()) + // Name
      emv('60', city.substring(0, 15).toUpperCase()) + // City
      emv('62', emv('05', txid)) + // Additional Data (txid)
      '6304'; // CRC16 placeholder

    // Calcula CRC16 CCITT
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
      crc ^= (payload.charCodeAt(i) << 8);
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    const crcHex = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    return payload + crcHex;
  }

  let activePixCode = '';
  let pendingBookingData = null;

  /**
   * Confirmação salvando na API e abrindo WhatsApp ou Pix
   */
  async function confirmAppointment() {
    const name = dom.clientNameInput.value.trim();
    const phone = dom.clientPhoneInput.value.trim();

    if (!name || name.length < 3) {
      showToast('Por favor, informe seu nome completo.', 'error');
      dom.clientNameInput.focus();
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showToast('Informe seu WhatsApp com DDD.', 'error');
      dom.clientPhoneInput.focus();
      return;
    }

    if (!state.bookingDate) {
      showToast('Escolha a data do agendamento.', 'error');
      return;
    }

    if (!state.bookingTime) {
      showToast('Selecione um horário disponível.', 'error');
      return;
    }

    const paymentChoice = document.querySelector('input[name="payment-method-choice"]:checked')?.value || 'PIX';
    const serviceNames = state.selectedServices.map(s => s.name).join(' + ');
    const serviceIds = state.selectedServices.map(s => s.id).join('+') || 'corte';
    const totalPrice = state.selectedServices.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = state.selectedServices.reduce((sum, s) => sum + (s.durationMinutes || 30), 0) || 30;

    // Desabilita botão enquanto processa
    if (dom.btnConfirmAppointment) {
      dom.btnConfirmAppointment.disabled = true;
      dom.btnConfirmAppointment.textContent = 'Reservando vaga...';
    }

    let createdId = null;
    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: name,
          clientPhone: phone,
          serviceId: serviceIds,
          serviceName: serviceNames,
          price: totalPrice,
          date: state.bookingDate,
          time: state.bookingTime,
          durationMinutes: totalDuration,
          paymentMethod: paymentChoice
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Não foi possível confirmar o horário.');
      }

      const resData = await response.json();
      createdId = resData.booking?.id || resData.booking?._id;
    } catch (err) {
      console.warn('Aviso: Falha ao persistir no backend, seguindo:', err.message);
    } finally {
      if (dom.btnConfirmAppointment) {
        dom.btnConfirmAppointment.disabled = false;
        dom.btnConfirmAppointment.innerHTML = 'Continuar Agendamento <i class="ph-bold ph-arrow-right"></i>';
      }
    }

    // Dados para o fluxo de finalização
    pendingBookingData = {
      id: createdId,
      name,
      phone,
      serviceNames,
      totalPrice,
      paymentChoice
    };

    // Se escolheu pagar via PIX, abre o modal do QR Code Pix
    if (paymentChoice === 'PIX') {
      closeModal();
      openPixModal(totalPrice);
    } else {
      // Se for pagar no local, abre direto o WhatsApp informando
      finalizeBookingOnWhatsApp(pendingBookingData);
    }
  }

  function openPixModal(amount) {
    if (!dom.pixModal) return;

    // Oculta a barra flutuante para não disputar espaço com o modal
    if (dom.floatingBar) {
      dom.floatingBar.classList.remove('show');
    }

    const pixConfig = CONFIG.pix || {
      key: '11964835563',
      name: 'GABRIEL DOS SANTOS JERONIMO',
      city: 'SAO BERNARDO DO CAMPO'
    };

    activePixCode = generatePixPayload(pixConfig.key, pixConfig.name, pixConfig.city, amount);
    
    // Gera QR Code via API de alta velocidade
    if (dom.pixQrImg) {
      dom.pixQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(activePixCode)}`;
    }
    if (dom.pixModalAmount) {
      dom.pixModalAmount.textContent = formatMoney(amount);
    }

    dom.pixModal.classList.add('open');
  }

  function finalizeBookingOnWhatsApp(data) {
    const manageLink = data.id
      ? `\n\n🔗 *Gerenciar/Desmarcar horário:*\n${window.location.origin}/cancelar.html?id=${data.id}`
      : '';

    let paymentText = '';
    if (data.paymentChoice === 'PIX') {
      paymentText = `\n💳 *Pagamento:* Feito via Pix (Comprovante anexado)`;
    } else {
      paymentText = `\n💳 *Pagamento:* Acerto na barbearia (Dinheiro/Cartão)`;
    }

    const text =
      `Olá Biel! Meu corte já está agendado e confirmado no site:\n\n` +
      `✂️ *Serviço:* ${data.serviceNames}\n` +
      `💰 *Valor:* ${formatMoney(data.totalPrice)}\n` +
      `📅 *Data:* ${formatDateBR(state.bookingDate)}\n` +
      `⏰ *Horário:* ${state.bookingTime}\n\n` +
      `👤 *Cliente:* ${data.name}\n` +
      `📱 *Contato:* ${data.phone}` +
      paymentText +
      manageLink;

    const cleanWaNumber = String(WHATSAPP_NUMBER).replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(text)}`;

    showToast('Agendamento salvo na agenda! Abrindo WhatsApp...', 'success');
    setTimeout(() => {
      window.open(waUrl, '_blank');
      if (dom.pixModal) dom.pixModal.classList.remove('open');
      closeModal();
    }, 400);
  }

  /**
   * Setup de Eventos
   */
  function setupEvents() {
    // Filtros de Categoria
    if (dom.categoryFilterBar) {
      dom.categoryFilterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-pill');
        if (!btn) return;
        dom.categoryFilterBar.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeCategory = btn.dataset.category;
        renderFeaturedCards(state.activeCategory);
        renderServicesCatalog();
      });
    }

    // Busca
    if (dom.searchInput) {
      dom.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderServicesCatalog();
      });
    }

    // Cards Destaques
    if (dom.featuredContainer) {
      dom.featuredContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-select-card');
        if (btn) {
          toggleService(btn.dataset.id);
          return;
        }
        const card = e.target.closest('.featured-card');
        if (card) {
          toggleService(card.dataset.id);
        }
      });
    }

    // Catálogo de Serviços
    if (dom.servicesContainer) {
      dom.servicesContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.service-item-card');
        if (!card) return;
        toggleService(card.dataset.id);
      });
    }

    // Botões que abrem o modal de agendamento
    const triggerButtons = [
      dom.btnOpenBookingModal,
      dom.btnHeaderAgendar,
      dom.btnHeroAgendar,
      dom.btnLocationAgendar,
      dom.btnBottomAgendar
    ];
    triggerButtons.forEach(btn => {
      if (btn) btn.addEventListener('click', openModal);
    });

    // Fechar modal
    if (dom.btnCloseModal) dom.btnCloseModal.addEventListener('click', closeModal);
    if (dom.modalOverlay) {
      dom.modalOverlay.addEventListener('click', (e) => {
        if (e.target === dom.modalOverlay) closeModal();
      });
    }

    // Data e Horário
    if (dom.bookingDateInput) {
      dom.bookingDateInput.addEventListener('change', (e) => {
        state.bookingDate = e.target.value;
        renderTimeSlots(state.bookingDate);
      });
    }

    if (dom.modalTimeSlots) {
      dom.modalTimeSlots.addEventListener('click', (e) => {
        const btn = e.target.closest('.time-slot-btn');
        if (!btn) return;
        dom.modalTimeSlots.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.bookingTime = btn.dataset.time;
      });
    }

    // Telefone com máscara
    if (dom.clientPhoneInput) {
      dom.clientPhoneInput.addEventListener('input', (e) => {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : `(${x[1]}) ${x[2]}` + (x[3] ? `-${x[3]}` : '');
      });
    }

    // Confirmação
    if (dom.btnConfirmAppointment) {
      dom.btnConfirmAppointment.addEventListener('click', confirmAppointment);
    }

    // Eventos do Modal Pix
    if (dom.btnClosePixModal) {
      dom.btnClosePixModal.addEventListener('click', () => {
        if (dom.pixModal) dom.pixModal.classList.remove('open');
      });
    }

    if (dom.btnCopyPix) {
      dom.btnCopyPix.addEventListener('click', () => {
        if (!activePixCode) return;
        navigator.clipboard.writeText(activePixCode).then(() => {
          showToast('Código Pix copiado! Cole no seu banco.', 'success');
          dom.btnCopyPix.textContent = '✓ Código Copiado!';
          setTimeout(() => {
            dom.btnCopyPix.textContent = '📋 Copiar Código Pix (Copia e Cola)';
          }, 3000);
        }).catch(() => {
          // Fallback caso clipboard API falhe
          const input = document.createElement('textarea');
          input.value = activePixCode;
          document.body.appendChild(input);
          input.select();
          document.execCommand('copy');
          document.body.removeChild(input);
          showToast('Código Pix copiado!', 'success');
        });
      });
    }

    if (dom.btnFinishPix) {
      dom.btnFinishPix.addEventListener('click', () => {
        if (pendingBookingData) {
          finalizeBookingOnWhatsApp(pendingBookingData);
        }
      });
    }

    // ScrollSpy para navegação desktop e mobile & controle dinâmico do header e bottom-nav
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;

      if (dom.mainHeader) {
        dom.mainHeader.classList.toggle('is-scrolled', scrollY > 30);
      }

      // Bottom nav aparece suavemente após sair da primeira dobra
      const bottomNav = document.getElementById('bottom-navigation');
      if (bottomNav) {
        bottomNav.classList.toggle('is-visible', scrollY > 80);
      }

      const sections = ['hero', 'servicos', 'galeria', 'sobre'];
      const scrollPos = scrollY + 140;

      for (let id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            dom.desktopNavLinks.forEach(link => {
              link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
            });
            dom.bottomNavLinks.forEach(link => {
              link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
            });
            break;
          }
        }
      }
    }, { passive: true });
  }

  /**
   * Carrossel Cinematográfico Automático da Primeira Dobra
   */
  function initHeroCarousel() {
    const slides = document.querySelectorAll('.hero-carousel-slide');
    const desktopSlides = document.querySelectorAll('.hero-desktop-slide');
    const indicators = document.querySelectorAll('.hero-progress-seg');
    const desktopBadgeLabel = document.getElementById('hero-desktop-badge-label');
    const badgeLabels = [
      'Visagismo & Navalha',
      'Degradê na Régua / Fade',
      'Estilização & Acabamento'
    ];

    if (!slides.length) return;

    let currentIndex = 0;
    const totalSlides = slides.length;
    const slideDuration = 4500; // 4.5 segundos
    let intervalId = null;
    let isPaused = false;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function goToSlide(index) {
      if (index === currentIndex) return;
      currentIndex = (index + totalSlides) % totalSlides;

      // Atualiza Slides Mobile
      slides.forEach((slide, i) => {
        const isActive = i === currentIndex;
        slide.classList.toggle('active', isActive);
        slide.setAttribute('aria-hidden', !isActive);
      });

      // Atualiza Slides Desktop (sincronizados)
      desktopSlides.forEach((dSlide, i) => {
        dSlide.classList.toggle('active', i === currentIndex);
      });

      // Atualiza Indicadores Interativos
      indicators.forEach((indicator, i) => {
        const isActive = i === currentIndex;
        indicator.classList.toggle('active', isActive);
        indicator.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      // Atualiza Legenda Desktop
      if (desktopBadgeLabel && badgeLabels[currentIndex]) {
        desktopBadgeLabel.textContent = badgeLabels[currentIndex];
      }
    }

    function nextSlide() {
      goToSlide(currentIndex + 1);
    }

    function startAutoplay() {
      if (prefersReducedMotion || intervalId) return;
      intervalId = setInterval(() => {
        if (!isPaused) {
          nextSlide();
        }
      }, slideDuration);
    }

    function stopAutoplay() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    // Navegação Manual via Toque/Clique nos Indicadores
    indicators.forEach((seg, i) => {
      seg.addEventListener('click', (e) => {
        e.preventDefault();
        goToSlide(i);
        stopAutoplay();
        startAutoplay();
      });
    });

    // Pausar ao interagir com o carrossel
    const carouselContainer = document.getElementById('hero-carousel');
    if (carouselContainer) {
      carouselContainer.addEventListener('mouseenter', () => { isPaused = true; });
      carouselContainer.addEventListener('mouseleave', () => { isPaused = false; });
      carouselContainer.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
      carouselContainer.addEventListener('touchend', () => {
        setTimeout(() => { isPaused = false; }, 2000);
      }, { passive: true });
    }

    // Pausar quando a aba estiver em segundo plano para economia de CPU/bateria
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    startAutoplay();
  }

  function init() {
    initHeroCarousel();
    renderServicesCatalog();
    renderGallery();
    setupEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
