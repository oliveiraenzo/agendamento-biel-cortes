const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: [true, 'Nome do cliente é obrigatório'],
      trim: true,
      minlength: 3
    },
    clientPhone: {
      type: String,
      required: [true, 'WhatsApp do cliente é obrigatório'],
      trim: true
    },
    serviceId: {
      type: String,
      required: true
    },
    serviceName: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    date: {
      type: String, // Formato YYYY-MM-DD
      required: true,
      index: true
    },
    startTime: {
      type: String, // "HH:mm"
      required: true
    },
    endTime: {
      type: String, // "HH:mm"
      required: true
    },
    startMinutes: {
      type: Number, // Minutos absolutos desde 00:00 (indexado para queries ultrarrápidas)
      required: true,
      index: true
    },
    endMinutes: {
      type: Number, // Minutos absolutos desde 00:00
      required: true,
      index: true
    },
    durationMinutes: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED', 'CANCELED'],
      default: 'CONFIRMED',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Índice composto de alta performance para prevenção instantânea de colisões
appointmentSchema.index({ date: 1, status: 1, startMinutes: 1, endMinutes: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);

