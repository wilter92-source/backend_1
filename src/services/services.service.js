import { ValidationError } from '../utils/errors.js';
import { listOptions, textFilter } from './query.service.js';
import * as repository from '../repositories/services.repository.js';

const fields = ['name', 'description', 'duration', 'price', 'category', 'available'];
import mongoose from 'mongoose';

const validId = id => mongoose.Types.ObjectId.isValid(id);

function validate(data, required = false) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError('Los datos deben ser un objeto válido.');
  }
  if (required) {
    const missing = fields.filter(field => data[field] === undefined || data[field] === null);
    if (missing.length) throw new ValidationError(`Faltan campos obligatorios del servicio: ${missing.join(', ')}.`);
  }
  const clean = {};
  for (const field of fields) {
    if (!Object.hasOwn(data, field)) continue;
    const value = data[field];
    if (['name', 'description', 'category'].includes(field) &&
        (typeof value !== 'string' || !value.trim())) {
      throw new ValidationError(`El campo "${field}" debe ser un texto no vacío.`);
    }
    if (['duration', 'price'].includes(field) &&
        (typeof value !== 'number' || !Number.isFinite(value) ||
         (field === 'duration' ? value <= 0 : value < 0))) {
      throw new ValidationError(`El campo "${field}" debe ser un número ${field === 'duration' ? 'mayor que cero' : 'mayor o igual a cero'}.`);
    }
    if (field === 'available' && typeof value !== 'boolean') {
      throw new ValidationError('available debe ser true o false.');
    }
    clean[field] = typeof value === 'string' ? value.trim() : value;
  }
  return clean;
}

export async function getServices(query = {}) {
  const filter = {};
  if (query.category !== undefined) filter.category = textFilter(query.category, 'category');
  if (query.available !== undefined) {
    if (!['true', 'false'].includes(query.available)) throw new ValidationError('available debe ser true o false.');
    filter.available = query.available === 'true';
  }
  return repository.getAll(filter, listOptions(query, ['name', 'price', 'duration', 'category']));
}

export const getServiceById = id => validId(id) ? repository.getById(id) : null;
export const createService = data => repository.create(validate(data, true));

export async function updateService(id, data) {
  if (!validId(id)) return null;
  if (!await repository.getById(id)) return null;
  return repository.update(id, validate(data));
}

export const deleteService = id => validId(id) ? repository.delete(id) : null;
