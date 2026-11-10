const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'main_settings'
    },
    services: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        category: { type: String, default: 'cortes' },
        price: { type: Number, required: true },
        durationMinutes: { type: Number, default: 30 },
        description: { type: String, default: '' },
        image: { type: String, default: 'assets/img/service_corte.webp' },
        featured: { type: Boolean, default: false }
      }
    ],
    workingDays: [
      {
        day: { type: Number, required: true }, // 0: Dom, 1: Seg, ..., 6: Sab
        name: { type: String, required: true },
        active: { type: Boolean, default: true }
      }
    ],
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '19:00' },
      interval: { type: Number, default: 30 }
    },
    blockedSlots: [
      { type: String } // ex: ["12:00", "12:30"]
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Settings', settingsSchema);
