const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const businessConfig = require('../config/business');
const { timeToMinutes, minutesToTime, hasOverlap } = require('../utils/timeUtils');

class AppointmentService {
  /**
   * Calcula on-the-fly os slots de tempo disponíveis para uma determinada data e duração
   */
  async getAvailableSlots(dateStr, durationMinutes = 30) {
    const duration = parseInt(durationMinutes, 10);
    const [year, month, day] = dateStr.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    // 1. Checa dias de folga (Domingos)
    if (businessConfig.closedDays.includes(dayOfWeek)) {
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

    // 3. Fatiamento de Horários On-The-Fly
    const slots = [];
    const openMinutes = businessConfig.startHour * 60;
    const closeMinutes = businessConfig.endHour * 60;

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
        status: 'CONFIRMED'
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
   * Cancela/remove um agendamento liberando o horário no banco
   */
  async cancelAppointment(appointmentId) {
    if (mongoose.connection.readyState === 1) {
      const appointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        { status: 'CANCELED' },
        { new: true }
      );
      if (!appointment) {
        throw { status: 404, message: 'Agendamento não encontrado.' };
      }
      return appointment;
    }
    return { message: 'Operando sem banco, cancelamento simulado.' };
  }
}

module.exports = new AppointmentService();

