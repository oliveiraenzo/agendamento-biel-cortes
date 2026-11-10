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

  /**
   * GET /api/appointments
   * Lista os agendamentos (filtro opcional por data: ?date=YYYY-MM-DD)
   */
  async listAppointments(req, res) {
    try {
      const { date } = req.query;
      const appointments = await appointmentService.getAppointmentsByDate(date);
      return res.status(200).json({
        total: appointments.length,
        appointments
      });
    } catch (error) {
      console.error('Erro em listAppointments:', error);
      return res.status(500).json({ error: 'Erro ao consultar agendamentos.' });
    }
  }

  /**
   * GET /api/appointments/:id
   * Consulta os dados de um agendamento específico (para tela de cancelamento)
   */
  async getAppointmentById(req, res) {
    try {
      const { id } = req.params;
      const appointment = await appointmentService.getAppointmentById(id);
      return res.status(200).json(appointment);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro ao buscar agendamento.' });
    }
  }

  /**
   * PATCH /api/appointments/:id/payment
   * Atualiza status de pagamento (ex: Biel confere extrato e marca como recebido)
   */
  async updatePayment(req, res) {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;
      const updated = await appointmentService.updatePaymentStatus(id, paymentStatus);
      return res.status(200).json({
        message: 'Status de pagamento atualizado!',
        appointment: updated
      });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      return res.status(500).json({ error: 'Erro ao atualizar pagamento.' });
    }
  }

  /**
   * DELETE /api/appointments/:id
   * Cancela/remove um agendamento liberando a vaga para outro cliente
   */
  async cancelAppointment(req, res) {
    try {
      const { id } = req.params;
      const isClient = req.query.isClient === 'true'; // flag se a solicitação veio da página do cliente

      if (!id) {
        return res.status(400).json({ error: 'ID do agendamento é obrigatório.' });
      }

      const result = await appointmentService.cancelAppointment(id, isClient);
      return res.status(200).json(result);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      console.error('Erro em cancelAppointment:', error);
      return res.status(500).json({ error: 'Erro ao cancelar o agendamento.' });
    }
  }
}

module.exports = new AppointmentController();

