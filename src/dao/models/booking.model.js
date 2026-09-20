import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  services: [{
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    quantity: { type: Number, default: 1 }
  }]
}, { timestamps: true });

export const BookingModel = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
