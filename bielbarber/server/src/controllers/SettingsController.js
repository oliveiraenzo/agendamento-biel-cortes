const Settings = require('../models/Settings');

const DEFAULT_SERVICES = [
  {
    id: 'corte',
    name: 'Corte',
    category: 'cortes',
    price: 35.00,
    durationMinutes: 30,
    description: 'Corte masculino tradicional ou fade na máquina e tesoura com acabamento preciso.',
    featured: true
  },
  {
    id: 'barba',
    name: 'Barba',
    category: 'barba',
    price: 20.00,
    durationMinutes: 30,
    description: 'Modelagem e alinhamento de barba na navalha com toalha quente e pós-barba.',
    featured: true
  },
  {
    id: 'sobrancelha',
    name: 'Sobrancelha',
    category: 'cortes',
    price: 10.00,
    durationMinutes: 30,
    description: 'Design e limpeza da sobrancelha na navalha com contorno limpo.',
    featured: false
  },
  {
    id: 'penteado',
    name: 'Penteado',
    category: 'cortes',
    price: 10.00,
    durationMinutes: 30,
    description: 'Lavagem, secagem e finalização com pomada ou spray fixador de alta fixação.',
    featured: false
  },
  {
    id: 'platinado',
    name: 'Platinado',
    category: 'quimica',
    price: 70.00,
    durationMinutes: 30,
    description: 'Descoloração global e matização platinada de alto padrão.',
    featured: true
  },
  {
    id: 'combo-completo',
    name: 'Combo Completo',
    category: 'combos',
    price: 60.00,
    durationMinutes: 30,
    description: 'Experiência total: Corte masculino, Sobrancelha na navalha e Barba alinhada.',
    featured: true
  }
];

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

class SettingsController {
  /**
   * GET /api/settings
   * Retorna as configurações do Gabriel (ou cria as padrões se não existirem)
   */
  async getSettings(req, res) {
    try {
      let doc = await Settings.findOne({ key: 'main_settings' });
      if (!doc) {
        doc = await Settings.create({
          key: 'main_settings',
          services: DEFAULT_SERVICES,
          workingDays: DEFAULT_DAYS,
          workingHours: DEFAULT_HOURS,
          blockedSlots: []
        });
      }
      return res.status(200).json(doc);
    } catch (error) {
      console.error('Erro em getSettings:', error);
      return res.status(500).json({ error: 'Erro ao buscar configurações.' });
    }
  }

  /**
   * POST /api/settings
   * Atualiza serviços, preços, dias e horários
   */
  async updateSettings(req, res) {
    try {
      const { services, workingDays, workingHours, blockedSlots } = req.body;

      const updateData = {};
      if (services) updateData.services = services;
      if (workingDays) updateData.workingDays = workingDays;
      if (workingHours) updateData.workingHours = workingHours;
      if (blockedSlots) updateData.blockedSlots = blockedSlots;

      const updated = await Settings.findOneAndUpdate(
        { key: 'main_settings' },
        { $set: updateData },
        { new: true, upsert: true }
      );

      return res.status(200).json({
        message: 'Configurações atualizadas com sucesso!',
        settings: updated
      });
    } catch (error) {
      console.error('Erro em updateSettings:', error);
      return res.status(500).json({ error: 'Erro ao salvar configurações no banco.' });
    }
  }
}

module.exports = new SettingsController();
