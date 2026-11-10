const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/AppointmentController');

// Rotas de Agendamento
router.get('/slots', (req, res) => appointmentController.getSlots(req, res));
router.post('/appointments', (req, res) => appointmentController.createAppointment(req, res));

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    barber: 'Biel Cortes',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

