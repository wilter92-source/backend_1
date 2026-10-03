import { ServiceModel } from './models/service.model.js';

export default {
  count: (filter = {}) => ServiceModel.countDocuments(filter),
  getAll: (filter = {}, options = {}) => ServiceModel.find(filter, null, options).lean(),
  getById: (id) => ServiceModel.findById(id).lean(),
  create: (data) => ServiceModel.create(data),
  update: (id, data) => ServiceModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean(),
  delete: (id) => ServiceModel.findByIdAndDelete(id).lean()
};
