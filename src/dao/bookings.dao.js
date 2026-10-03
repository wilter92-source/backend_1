import mongoose from 'mongoose';
import { BookingModel } from './models/booking.model.js';
export default {
  create: (data) => BookingModel.create(data),
  getAll: (filter = {}, options = {}) => BookingModel.find(filter, null, options).populate('services.service').lean(),
  getById: (id) => BookingModel.findById(id).populate('services.service').lean(),
  // Una única actualización atómica evita perder incrementos concurrentes.
  addService: (id, sid) => {
    const serviceId = new mongoose.Types.ObjectId(sid);
    return BookingModel.findByIdAndUpdate(id, [{ $set: {
      services: { $cond: [
        { $in: [serviceId, '$services.service'] },
        { $map: { input: '$services', as: 'item', in: { $cond: [
          { $eq: ['$$item.service', serviceId] },
          { $mergeObjects: ['$$item', { quantity: { $add: ['$$item.quantity', 1] } }] }, '$$item'
        ] } } },
        { $concatArrays: ['$services', [{ service: serviceId, quantity: 1 }]] }
      ] }
    } }], { new: true }).populate('services.service').lean();
  }
};
