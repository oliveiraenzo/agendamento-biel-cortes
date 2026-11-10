const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/AppointmentController');
const settingsController = require('../controllers/SettingsController');

// Rotas de Agendamento
router.get('/slots', (req, res) => appointmentController.getSlots(req, res));
router.get('/appointments', (req, res) => appointmentController.listAppointments(req, res));
router.get('/appointments/:id', (req, res) => appointmentController.getAppointmentById(req, res));
router.post('/appointments', (req, res) => appointmentController.createAppointment(req, res));
router.patch('/appointments/:id/payment', (req, res) => appointmentController.updatePayment(req, res));
router.delete('/appointments/:id', (req, res) => appointmentController.cancelAppointment(req, res));

// Rotas de Configurações e Autenticação do Biel
router.get('/settings', (req, res) => settingsController.getSettings(req, res));
router.post('/settings', (req, res) => settingsController.updateSettings(req, res));
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
