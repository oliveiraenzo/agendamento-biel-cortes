/**
 * BIEL CORTES - Configurações Gerais da Barbearia
 * Baseado no Manual Oficial de Identidade Visual (Urban Premium • Mobile-First)
 */
window.BIEL_CONFIG = Object.freeze({
  // Nome oficial e slogan
  brandName: 'Biel Cortes',
  slogan: 'Estilo, atitude e confiança.',

  // URL da API Backend (em desenvolvimento local ou URL da nuvem)
  apiUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3001/api' 
    : '/api',

  // WhatsApp oficial do Biel (formato internacional sem caracteres especiais)
  whatsappNumber: '5511964835563',

  // Instagram oficial
  instagramHandle: 'bielcortes_oficial',
  instagramUrl: 'https://instagram.com/bielcortes_oficial',

  // Localização física e horários
  address: 'Rua Francisco Mendes Pereira, 68 - Vila das Paineiras, São Bernardo do Campo - SP',
  workingHours: 'Segunda a Sábado das 09:00 às 19:00',

  // Catálogo Oficial com preços reais do Biel (agendamento a cada 30 min)
  services: [
    {
      id: 'corte',
      name: 'Corte',
      category: 'cortes',
      price: 35.00,
      durationMinutes: 30,
      description: 'Corte masculino tradicional ou fade na máquina e tesoura com acabamento preciso.',
      image: 'assets/img/service_corte.webp',
      featured: true
    },
    {
      id: 'barba',
      name: 'Barba',
      category: 'barba',
      price: 20.00,
      durationMinutes: 30,
      description: 'Modelagem e alinhamento de barba na navalha com toalha quente e pós-barba.',
      image: 'assets/img/service_barba.webp',
      featured: true
    },
    {
      id: 'sobrancelha',
      name: 'Sobrancelha',
      category: 'cortes',
      price: 10.00,
      durationMinutes: 30,
      description: 'Design e limpeza da sobrancelha na navalha com contorno limpo.',
      image: 'assets/img/service_sobrancelha.webp',
      featured: false
    },
    {
      id: 'penteado',
      name: 'Penteado',
      category: 'cortes',
      price: 10.00,
      durationMinutes: 30,
      description: 'Lavagem, secagem e finalização com pomada ou spray fixador de alta fixação.',
      image: 'assets/img/service_corte.webp',
      featured: false
    },
    {
      id: 'platinado',
      name: 'Platinado',
      category: 'quimica',
      price: 70.00,
      durationMinutes: 30,
      description: 'Descoloração global e matização platinada de alto padrão.',
      image: 'assets/img/service_degrade.webp',
      featured: true
    },
    {
      id: 'combo-completo',
      name: 'Combo Completo',
      category: 'combos',
      price: 60.00,
      durationMinutes: 30,
      description: 'Experiência total: Corte masculino, Sobrancelha na navalha e Barba alinhada.',
      image: 'assets/img/service_combo.webp',
      featured: true
    }
  ],

  // Galeria de Trabalhos Reais
  gallery: [
    {
      id: 1,
      title: 'Mid Fade Texturizado',
      category: 'Fade',
      image: 'assets/img/gallery_1.webp'
    },
    {
      id: 2,
      title: 'Barba Esculpida & Navalha',
      category: 'Barba',
      image: 'assets/img/gallery_2.webp'
    },
    {
      id: 3,
      title: 'Low Fade com Acabamento',
      category: 'Corte',
      image: 'assets/img/gallery_3.webp'
    }
  ]
});
