module.exports = {
  // Horário de funcionamento comercial (09:00 às 19:00)
  startHour: 9,
  endHour: 19,
  slotIntervalMinutes: 30, // Intervalos de agendamento (30 em 30 min)
  
  // Pausa para almoço do profissional único
  lunchBreak: {
    startMinutes: 12 * 60, // 12:00 (720 min)
    endMinutes: 13 * 60    // 13:00 (780 min)
  },

  // Dias fechados (0 = Domingo)
  closedDays: [0],

  // Serviços e preços oficiais (marcações padronizadas a cada 30 min)
  services: [
    {
      id: 'corte',
      name: 'Corte',
      durationMinutes: 30,
      price: 35.0
    },
    {
      id: 'barba',
      name: 'Barba',
      durationMinutes: 30,
      price: 20.0
    },
    {
      id: 'sobrancelha',
      name: 'Sobrancelha',
      durationMinutes: 30,
      price: 10.0
    },
    {
      id: 'penteado',
      name: 'Penteado',
      durationMinutes: 30,
      price: 10.0
    },
    {
      id: 'platinado',
      name: 'Platinado',
      durationMinutes: 30,
      price: 70.0
    },
    {
      id: 'combo-completo',
      name: 'Combo Completo (Corte, Sobrancelha e Barba)',
      durationMinutes: 30,
      price: 60.0
    }
  ]
};

