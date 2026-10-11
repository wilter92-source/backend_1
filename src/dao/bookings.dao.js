import mongoose from 'mongoose';
import { BookingModel } from './models/booking.model.js';
export default {
  create: (data) => BookingModel.create(data),
  getAll: (filter = {}, options = {}) => BookingModel.find(filter, null, options).populate('services.service').lean(),
  getById: (id) => BookingModel.findById(id).populate('services.service').lean(),
  // Una única actualización atómica evita perder incrementos concurrentes.
  addService: (id, sid) => {
    const serviceId = new mongoose.Types.ObjectId(sid);
    return BookingModel.findOneAndUpdate({ _id: id, services: { $not: { $elemMatch: { service: serviceId, quantity: { $gte: Number.MAX_SAFE_INTEGER } } } } }, [{ $set: {
      services: { $cond: [
        { $in: [serviceId, '$services.service'] },
        { $map: { input: '$services', as: 'item', in: { $cond: [
          { $eq: ['$$item.service', serviceId] },
          { $mergeObjects: ['$$item', { quantity: { $add: ['$$item.quantity', 1] } }] }, '$$item'
        ] } } },
        { $concatArrays: ['$services', [{ service: serviceId, quantity: 1 }]] }
      ] }
    } }], { new: true }).populate('services.service').lean();
  },
  updateQuantity: (id, sid, quantity) => BookingModel.findOneAndUpdate(
    { _id: id, 'services.service': sid },
    { $set: { 'services.$.quantity': quantity } },
    { new: true, runValidators: true }
  ).populate('services.service').lean(),
  removeService: (id, sid) => BookingModel.findOneAndUpdate(
    { _id: id, 'services.service': sid }, { $pull: { services: { service: sid } } },
    { new: true, runValidators: true }
  ).populate('services.service').lean(),
  clear: id => BookingModel.findByIdAndUpdate(id, { $set: { services: [] } },
    { new: true, runValidators: true }).lean(),
  delete: id => BookingModel.findByIdAndDelete(id).lean()
};
