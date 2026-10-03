import { ValidationError } from '../utils/errors.js';
import { listOptions, textFilter } from './query.service.js';
import * as repository from '../repositories/services.repository.js';

import mongoose from 'mongoose';
import { serviceSchema, updateServiceSchema, validate } from '../validation/schemas.js';
import { changed } from '../events/domain.events.js';
const validId = id => mongoose.isObjectIdOrHexString(id);

function serviceQuery(query = {}) {
  const filter = {};
  if (query.category !== undefined) filter.category = textFilter(query.category, 'category');
  if (query.available !== undefined) {
    if (!['true', 'false'].includes(query.available)) throw new ValidationError('available debe ser true o false.');
    filter.available = query.available === 'true';
  }
  return { filter, options: listOptions(query, ['name', 'price', 'duration', 'category']) };
}

export async function getServices(query = {}) {
  const { filter, options } = serviceQuery(query);
  return repository.getAll(filter, options);
}
export async function getServicesPage(query = {}) {
  const { filter, options } = serviceQuery(query);
  const [payload, total] = await Promise.all([repository.getAll(filter, options), repository.count(filter)]);
  const page = options.skip / options.limit + 1;
  const totalPages = Math.ceil(total / options.limit);
  return { payload, pagination: { total, page, limit: options.limit, totalPages,
    hasPrevPage: page > 1, hasNextPage: page < totalPages } };
}

export const getServiceById = id => validId(id) ? repository.getById(id) : null;
export const createService = data => {
  const clean = validate(serviceSchema, data);
  return repository.create(clean).then(doc => changed('services', 'created', doc));
};

export async function updateService(id, data) {
  const clean = validate(updateServiceSchema, data);
  if (!validId(id)) return null;
  return changed('services', 'updated', await repository.update(id, clean));
}

export const deleteService = async id => validId(id) ? changed('services', 'deleted', await repository.delete(id)) : null;
