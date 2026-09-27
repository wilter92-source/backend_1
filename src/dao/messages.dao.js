import { MessageModel } from './models/message.model.js';
export default {
  create: data => MessageModel.create(data),
  getAll: (filter, options) => MessageModel.find(filter, null, options).lean(),
  getById: id => MessageModel.findById(id).lean()
};
