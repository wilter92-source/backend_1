import { ValidationError } from '../utils/errors.js';
import mongoose from 'mongoose';
import * as bookingsRepository from '../repositories/bookings.repository.js';
import * as servicesRepository from '../repositories/services.repository.js';
import { listOptions, textFilter } from './query.service.js';
const validId = id => typeof id === 'string' && mongoose.isObjectIdOrHexString(id);
const states = ['pending', 'confirmed', 'cancelled'];
function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export async function getBookings(query = {}) {
  const filter = {};
  if (query.status !== undefined) {
    if (!states.includes(query.status)) throw new ValidationError('Estado inválido.');
    filter.status = query.status;
  }
  if (query.date !== undefined) {
    if (!validDate(query.date)) throw new ValidationError('Fecha inválida.');
    filter.date = query.date;
  }
  if (query.clientEmail !== undefined) filter.clientEmail = textFilter(query.clientEmail, 'clientEmail');
  return bookingsRepository.getAll(filter, listOptions(query, ['date', 'time', 'clientName', 'status']));
}
export async function createBooking(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new ValidationError('La reserva debe ser un objeto.');
  const clientName = textFilter(data.clientName, 'clientName');
  const clientEmail = textFilter(data.clientEmail, 'clientEmail');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) throw new ValidationError('Email inválido.');
  if (!validDate(data.date)) throw new ValidationError('Fecha inválida; usar YYYY-MM-DD.');
  if (typeof data.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time)) throw new ValidationError('Hora inválida; usar HH:mm.');
  const status = data.status ?? 'pending';
  if (!states.includes(status)) throw new ValidationError('Estado inválido.');
  if (data.services !== undefined && !Array.isArray(data.services)) throw new ValidationError('services debe ser un array.');
  const grouped = new Map();
  for (const item of data.services ?? []) {
    if (!item || !validId(item.service) || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) throw new ValidationError('Servicio o cantidad inválidos.');
    if (!await servicesRepository.getById(item.service)) throw new ValidationError('El servicio no existe.');
    const id = item.service.toLowerCase();
    const quantity = (grouped.get(id) ?? 0) + item.quantity;
    if (!Number.isSafeInteger(quantity)) throw new ValidationError('Cantidad fuera de rango.');
    grouped.set(id, quantity);
  }
  return bookingsRepository.create({ clientName, clientEmail, date: data.date, time: data.time, status,
    services: Array.from(grouped, ([service, quantity]) => ({ service, quantity })) });
}
export const getBookingById = id => validId(id) ? bookingsRepository.getById(id) : null;
export async function addServiceToBooking(bookingId, serviceId) {
  if (!validId(bookingId) || !validId(serviceId)) return null;
  if (!await servicesRepository.getById(serviceId)) return null;
  return bookingsRepository.addService(bookingId, serviceId);
}
