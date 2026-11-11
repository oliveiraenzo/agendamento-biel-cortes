const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/AppointmentController');
const settingsController = require('../controllers/SettingsController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Rotas Públicas de Agendamento (Clientes)
router.get('/slots', (req, res) => appointmentController.getSlots(req, res));
router.post('/appointments', (req, res) => appointmentController.createAppointment(req, res));
router.get('/appointments/:id', (req, res) => appointmentController.getAppointmentById(req, res));
router.delete('/appointments/:id', (req, res) => appointmentController.cancelAppointment(req, res));

// Rotas Administrativas Protegidas por Token JWT
router.get('/appointments', authMiddleware, (req, res) => appointmentController.listAppointments(req, res));
router.patch('/appointments/:id/payment', authMiddleware, (req, res) => appointmentController.updatePayment(req, res));
router.get('/settings', (req, res) => settingsController.getSettings(req, res));
router.post('/settings', authMiddleware, (req, res) => settingsController.updateSettings(req, res));

// Autenticação e Recuperação de Senha
router.post('/admin/login', (req, res) => settingsController.login(req, res));
router.post('/admin/forgot-password', (req, res) => settingsController.forgotPassword(req, res));
router.post('/admin/reset-password', (req, res) => settingsController.resetPassword(req, res));

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    barber: 'Biel Cortes',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
