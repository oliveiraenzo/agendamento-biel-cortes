const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Settings = require('../models/Settings');
const businessConfig = require('../config/business');
const { timeToMinutes, minutesToTime, hasOverlap } = require('../utils/timeUtils');

class AppointmentService {
  /**
   * Calcula on-the-fly os slots de tempo disponíveis para uma determinada data e duração
   * Respeitando dias de atendimento, expediente e horários bloqueados pelo Biel no painel admin
   */
  async getAvailableSlots(dateStr, durationMinutes = 30) {
    const duration = parseInt(durationMinutes, 10);
    const [year, month, day] = dateStr.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    // 1. Busca configurações dinâmicas salvas pelo Biel no MongoDB Atlas
    let dbSettings = null;
    if (mongoose.connection.readyState === 1) {
      dbSettings = await Settings.findOne({ key: 'main_settings' }).lean();
    }

    // Checa dias de folga (pelo banco se existir, ou fallback padrão)
    if (dbSettings && dbSettings.workingDays && dbSettings.workingDays.length > 0) {
      const dayConfig = dbSettings.workingDays.find(d => d.day === dayOfWeek);
      if (dayConfig && !dayConfig.active) {
        return {
          date: dateStr,
          durationMinutes: duration,
          slots: [],
          message: 'Barbearia fechada neste dia da semana.'
        };
      }
    } else if (businessConfig.closedDays.includes(dayOfWeek)) {
      return {
        date: dateStr,
        durationMinutes: duration,
        slots: [],
        message: 'Barbearia fechada neste dia da semana.'
      };
    }

    // 2. Coleta ocupações (MongoDB ou fallback em memória)
    let busyAppointments = [];
    if (mongoose.connection.readyState === 1) {
      busyAppointments = await Appointment.find({
        date: dateStr,
        status: 'CONFIRMED'
      })
      .select('startMinutes endMinutes')
      .lean();
    }

    // Intervalos de bloqueio (Almoço + Agendamentos já realizados)
    const busyIntervals = [
      {
        start: businessConfig.lunchBreak.startMinutes,
        end: businessConfig.lunchBreak.endMinutes
      },
      ...busyAppointments.map(app => ({
        start: app.startMinutes,
        end: app.endMinutes
      }))
    ];

    // Adiciona horários que o Biel bloqueou no painel admin (ex: "14:00", "15:30")
    const blockedSlots = dbSettings?.blockedSlots || [];
    blockedSlots.forEach(blockedTime => {
      const bStart = timeToMinutes(blockedTime);
      busyIntervals.push({
        start: bStart,
        end: bStart + 30
      });
    });

    // 3. Fatiamento de Horários On-The-Fly
    const slots = [];
    let openMinutes = businessConfig.startHour * 60;
    let closeMinutes = businessConfig.endHour * 60;

    if (dbSettings?.workingHours?.start) {
      openMinutes = timeToMinutes(dbSettings.workingHours.start);
    }
    if (dbSettings?.workingHours?.end) {
      closeMinutes = timeToMinutes(dbSettings.workingHours.end);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = dateStr === todayStr;
    const now = new Date();
    const currentMinutesNow = now.getHours() * 60 + now.getMinutes() + 15; // 15 min de antecedência mínima

    for (let slotStart = openMinutes; slotStart + duration <= closeMinutes; slotStart += businessConfig.slotIntervalMinutes) {
      const slotEnd = slotStart + duration;

      // Pula horários passados se a data consultada for hoje
      if (isToday && slotStart <= currentMinutesNow) {
        continue;
      }

      // Prevenção de conflito
      const conflict = busyIntervals.some(busy => hasOverlap(slotStart, slotEnd, busy.start, busy.end));
      if (!conflict) {
        slots.push(minutesToTime(slotStart));
      }
    }

    return {
      date: dateStr,
      durationMinutes: duration,
      slots
    };
  }

  /**
   * Criação de agendamento com validação atômica de concorrência
   */
  async createAppointment(data) {
    const {
      serviceId,
      serviceName,
      durationMinutes,
      price,
      date,
      time,
      clientName,
      clientPhone
    } = data;

    const startMinutes = timeToMinutes(time);
    const endMinutes = startMinutes + parseInt(durationMinutes, 10);
    const endTime = minutesToTime(endMinutes);

    // Validações de limites de horário
    const openMinutes = businessConfig.startHour * 60;
    const closeMinutes = businessConfig.endHour * 60;

    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      throw { status: 400, message: 'Horário solicitado fora do expediente da barbearia (09:00 às 19:00).' };
    }

    // Validação de intervalo de almoço
    if (hasOverlap(startMinutes, endMinutes, businessConfig.lunchBreak.startMinutes, businessConfig.lunchBreak.endMinutes)) {
      throw { status: 400, message: 'Horário selecionado coincide com o intervalo de almoço do profissional.' };
    }

    // Bloqueio de Concorrência no MongoDB
    if (mongoose.connection.readyState === 1) {
      const conflict = await Appointment.findOne({
        date,
        status: 'CONFIRMED',
        startMinutes: { $lt: endMinutes },
        endMinutes: { $gt: startMinutes }
      });

      if (conflict) {
        throw { status: 409, message: 'Conflito de horário! Este período acabou de ser reservado por outro cliente.' };
      }

      const newAppointment = new Appointment({
        clientName,
        clientPhone,
        serviceId: serviceId || 'custom',
        serviceName,
        price: Number(price) || 0,
        date,
        startTime: time,
        endTime,
        startMinutes,
        endMinutes,
        durationMinutes: parseInt(durationMinutes, 10),
        status: 'CONFIRMED',
        paymentMethod: data.paymentMethod || 'PIX',
        paymentStatus: data.paymentMethod === 'NO_LOCAL' ? 'PAGAR_NA_HORA' : 'PAGO_PELO_CLIENTE'
      });

      await newAppointment.save();

      return {
        id: newAppointment._id,
        clientName: newAppointment.clientName,
        clientPhone: newAppointment.clientPhone,
        serviceName: newAppointment.serviceName,
        price: newAppointment.price,
        date: newAppointment.date,
        time: newAppointment.startTime,
        endTime: newAppointment.endTime,
        durationMinutes: newAppointment.durationMinutes
      };
    }

    // Fallback Mock Standalone
    return {
      id: 'mock-' + Date.now(),
      clientName,
      clientPhone,
      serviceName,
      price: Number(price) || 0,
      date,
      time,
      endTime,
      durationMinutes: parseInt(durationMinutes, 10)
    };
  }

  /**
   * Lista todos os agendamentos de uma data específica ou período (para o painel do Biel)
   */
  async getAppointmentsByDate(dateStr) {
    if (mongoose.connection.readyState === 1) {
      const query = { status: { $ne: 'CANCELED' } };
      if (dateStr) {
        query.date = dateStr;
      }
      return await Appointment.find(query)
        .sort({ date: 1, startMinutes: 1 })
        .lean();
    }
    return [];
  }

  /**
   * Busca um agendamento por ID para conferência dos dados na tela de cancelamento
   */
  async getAppointmentById(appointmentId) {
    if (mongoose.connection.readyState === 1) {
      const appointment = await Appointment.findById(appointmentId).lean();
      if (!appointment) {
        throw { status: 404, message: 'Agendamento não encontrado.' };
      }

      // Calcula quantas horas faltam para o horário
      const [year, month, day] = appointment.date.split('-').map(Number);
      const [hour, minute] = appointment.startTime.split(':').map(Number);
      const appointmentDateTime = new Date(year, month - 1, day, hour, minute);
      const now = new Date();

      const diffMs = appointmentDateTime - now;
      const diffHours = diffMs / (1000 * 60 * 60);

      // Regra de Negócio: menor que 3 horas é considerado cancelamento tardio (com taxa/cobrança)
      const isLateCancellation = diffHours < 3;

      return {
        ...appointment,
        hoursUntilAppointment: Math.round(diffHours * 10) / 10,
        isLateCancellation
      };
    }
    throw { status: 503, message: 'Banco de dados indisponível.' };
  }

  /**
   * Atualiza status de pagamento pelo Biel (ex: confirmou recebimento do Pix)
   */
  async updatePaymentStatus(appointmentId, paymentStatus) {
    if (mongoose.connection.readyState === 1) {
      const updated = await Appointment.findByIdAndUpdate(
        appointmentId,
        { paymentStatus },
        { new: true }
      );
      if (!updated) throw { status: 404, message: 'Agendamento não encontrado.' };
      return updated;
    }
    return { message: 'Operando sem banco' };
  }

  /**
   * Cancela/remove um agendamento liberando o horário no banco
   * Com validação da política de antecedência de 3 horas
   */
  async cancelAppointment(appointmentId, isClientRequest = false) {
    if (mongoose.connection.readyState === 1) {
      const existing = await Appointment.findById(appointmentId);
      if (!existing) {
        throw { status: 404, message: 'Agendamento não encontrado.' };
      }

      if (existing.status === 'CANCELED') {
        throw { status: 400, message: 'Este agendamento já se encontra cancelado.' };
      }

      // Se for pedido pelo próprio cliente, verifica a regra de 3 horas
      let feeRequired = false;
      if (isClientRequest) {
        const [year, month, day] = existing.date.split('-').map(Number);
        const [hour, minute] = existing.startTime.split(':').map(Number);
        const appointmentDateTime = new Date(year, month - 1, day, hour, minute);
        const now = new Date();
        const diffHours = (appointmentDateTime - now) / (1000 * 60 * 60);

        if (diffHours < 3) {
          feeRequired = true;
        }
      }

      existing.status = 'CANCELED';
      await existing.save();

      return {
        appointment: existing,
        feeRequired,
        message: feeRequired
          ? 'Agendamento cancelado com menos de 3h de antecedência. Cobrança de taxa aplicável.'
          : 'Agendamento cancelado gratuitamente com antecedência.'
      };
    }
    return { message: 'Operando sem banco, cancelamento simulado.' };
  }
}

module.exports = new AppointmentService();

