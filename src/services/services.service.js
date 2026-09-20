import * as repository from '../repositories/services.repository.js';

const fields = ['name', 'description', 'duration', 'price', 'category', 'available'];
import mongoose from 'mongoose';

const validId = id => mongoose.Types.ObjectId.isValid(id);

function validate(data, required = false) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Los datos deben ser un objeto válido.');
  }
  if (required) {
    const missing = fields.filter(field => data[field] === undefined || data[field] === null);
    if (missing.length) throw new Error(`Faltan campos obligatorios del servicio: ${missing.join(', ')}.`);
  }
  const clean = {};
  for (const field of fields) {
    if (!Object.hasOwn(data, field)) continue;
    const value = data[field];
    if (['name', 'description', 'category'].includes(field) &&
        (typeof value !== 'string' || !value.trim())) {
      throw new Error(`El campo "${field}" debe ser un texto no vacío.`);
    }
    if (['duration', 'price'].includes(field) &&
        (typeof value !== 'number' || !Number.isFinite(value) ||
         (field === 'duration' ? value <= 0 : value < 0))) {
      throw new Error(`El campo "${field}" debe ser un número ${field === 'duration' ? 'mayor que cero' : 'mayor o igual a cero'}.`);
    }
    if (field === 'available' && typeof value !== 'boolean') {
      throw new Error('available debe ser true o false.');
    }
    clean[field] = value;
  }
  return clean;
}

export async function getServices({ category, available } = {}) {
  let services = await repository.getAll();
  if (category) services = services.filter(item => item.category === category);
  if (available !== undefined) services = services.filter(item => item.available === (available === 'true'));
  return services;
}

export const getServiceById = id => validId(id) ? repository.getById(id) : null;
export const createService = data => repository.create(validate(data, true));

export async function updateService(id, data) {
  if (!validId(id)) return null;
  if (!await repository.getById(id)) return null;
  return repository.update(id, validate(data));
}

export const deleteService = id => validId(id) ? repository.delete(id) : null;
