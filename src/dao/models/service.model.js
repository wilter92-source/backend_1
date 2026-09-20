import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  available: { type: Boolean, default: true }
}, { timestamps: true });

export const ServiceModel = mongoose.models.Service || mongoose.model('Service', serviceSchema);
