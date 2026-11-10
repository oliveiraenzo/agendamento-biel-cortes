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

  /**
   * POST /api/admin/login
   * Valida a senha do Biel direto no banco
   */
  async login(req, res) {
    try {
      const { password } = req.body;
      let settings = await Settings.findOne({ key: 'main_settings' });
      const validPass = settings?.adminPassword || 'biel123';

      if (password === validPass) {
        return res.status(200).json({ success: true, message: 'Autenticado com sucesso!' });
      }
      return res.status(401).json({ success: false, error: 'Código de acesso incorreto.' });
    } catch (e) {
      return res.status(500).json({ error: 'Erro na autenticação.' });
    }
  }

  /**
   * POST /api/admin/forgot-password
   * Solicita redefinição de senha com base no e-mail cadastrado
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const cleanEmail = email?.trim().toLowerCase();

      let settings = await Settings.findOne({ key: 'main_settings' });
      if (!settings) {
        settings = await Settings.create({ key: 'main_settings' });
      }

      const registeredEmail = (settings.adminEmail || 'bielcortes@gmail.com').trim().toLowerCase();

      // Confere se o e-mail bate com o do Biel
      if (cleanEmail !== registeredEmail) {
        return res.status(400).json({ error: 'E-mail não reconhecido como administrador da barbearia.' });
      }

      // Gera código de recuperação de 6 dígitos válido por 15 minutos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      settings.resetToken = code;
      settings.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
      await settings.save();

      return res.status(200).json({
        success: true,
        message: 'Código de recuperação gerado com sucesso!',
        code: code // Retorna de forma transparente para permitir redefinição imediata
      });
    } catch (e) {
      return res.status(500).json({ error: 'Erro ao processar recuperação de senha.' });
    }
  }

  /**
   * POST /api/admin/reset-password
   * Define a nova senha permanente no MongoDB Atlas
   */
  async resetPassword(req, res) {
    try {
      const { code, newPassword } = req.body;
      if (!newPassword || newPassword.length < 4) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 4 caracteres.' });
      }

      let settings = await Settings.findOne({ key: 'main_settings' });
      if (!settings || !settings.resetToken || settings.resetToken !== code?.trim()) {
        return res.status(400).json({ error: 'Código de recuperação inválido ou expirado.' });
      }

      if (new Date() > new Date(settings.resetTokenExpires)) {
        return res.status(400).json({ error: 'Código de recuperação expirou. Solicite um novo.' });
      }

      settings.adminPassword = newPassword;
      settings.resetToken = null;
      settings.resetTokenExpires = null;
      await settings.save();

      return res.status(200).json({
        success: true,
        message: 'Nova senha cadastrada com sucesso no banco de dados!'
      });
    } catch (e) {
      return res.status(500).json({ error: 'Erro ao redefinir senha.' });
    }
  }
}

module.exports = new SettingsController();
