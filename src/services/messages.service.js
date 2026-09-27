import { ValidationError } from '../utils/errors.js';
import mongoose from 'mongoose';
import * as repository from '../repositories/messages.repository.js';
import { listOptions, textFilter } from './query.service.js';
export function createMessage(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new ValidationError('Mensaje inválido.');
  const user = textFilter(data.user, 'user');
  const message = textFilter(data.message, 'message');
  if (user.length > 100 || message.length > 2000) throw new ValidationError('Mensaje demasiado largo.');
  return repository.create({ user, message });
}
export function getMessages(query = {}) {
  const filter = query.user === undefined ? {} : { user: textFilter(query.user, 'user') };
  return repository.getAll(filter, listOptions(query, ['user']));
}
export const getMessageById = id => mongoose.isObjectIdOrHexString(id) ? repository.getById(id) : null;
