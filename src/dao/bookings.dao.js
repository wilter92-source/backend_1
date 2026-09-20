import { BookingModel } from './models/booking.model.js';

export default {
  create: (data) => BookingModel.create(data),
  getById: (id) => BookingModel.findById(id).populate('services.service').lean(),
  update: (id, data) => BookingModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean()
};
