const appointmentService = require('../services/AppointmentService');

class AppointmentController {
  /**
   * GET /api/slots
   */
  async getSlots(req, res) {
    try {
      const { date, duration } = req.query;

      if (!date) {
        return res.status(400).json({ error: 'Parâmetro "date" é obrigatório no formato YYYY-MM-DD.' });
      }

      const result = await appointmentService.getAvailableSlots(date, duration);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Erro em getSlots:', error);
      return res.status(500).json({ error: 'Erro ao calcular horários livres.' });
    }
  }

  /**
   * POST /api/appointments
   */
  async createAppointment(req, res) {
    try {
      const { clientName, clientPhone, date, time, durationMinutes, serviceName } = req.body;

      if (!clientName || !clientPhone || !date || !time || !durationMinutes || !serviceName) {
        return res.status(400).json({ error: 'Dados incompletos para efetuar o agendamento.' });
      }

      const booking = await appointmentService.createAppointment(req.body);
      return res.status(201).json({
        message: 'Agendamento confirmado com sucesso!',
        booking
      });
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      console.error('Erro em createAppointment:', error);
      return res.status(500).json({ error: 'Erro interno ao processar o agendamento.' });
    }
  }
}

module.exports = new AppointmentController();

