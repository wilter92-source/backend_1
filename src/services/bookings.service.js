import { bookingSchema, addServiceSchema, bookingIdSchema, bookingServiceIdsSchema, quantitySchema, validate } from '../validation/schemas.js';
import { changed } from '../events/domain.events.js';
import { ValidationError } from '../utils/errors.js';
import { objectId } from '../validation/schemas.js';
import * as bookingsRepository from '../repositories/bookings.repository.js';
import * as servicesRepository from '../repositories/services.repository.js';
import { listOptions, textFilter } from './query.service.js';
const validId = id => objectId.safeParse(id).success;
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
  data = validate(bookingSchema, data);
  const { clientName, clientEmail, status } = data;
  const grouped = new Map();
  for (const item of data.services ?? []) {
    if (!item || !validId(item.service) || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) throw new ValidationError('Servicio o cantidad inválidos.');
    if (!await servicesRepository.getById(item.service)) throw new ValidationError('El servicio no existe.');
    const id = item.service.toLowerCase();
    const quantity = (grouped.get(id) ?? 0) + item.quantity;
    if (!Number.isSafeInteger(quantity)) throw new ValidationError('Cantidad fuera de rango.');
    grouped.set(id, quantity);
  }
  return changed('bookings', 'created', await bookingsRepository.create({ clientName, clientEmail, date: data.date, time: data.time, status,
    services: Array.from(grouped, ([service, quantity]) => ({ service, quantity })) }));
}
export const getBookingById = id => validId(id) ? bookingsRepository.getById(id) : null;
export async function addServiceToBooking(bookingId, serviceId) {
  validate(addServiceSchema, { bookingId, serviceId });
  if (!await servicesRepository.getById(serviceId)) return null;
  const updated = await bookingsRepository.addService(bookingId, serviceId);
  if (!updated && await bookingsRepository.getById(bookingId)) throw new ValidationError('Cantidad fuera de rango.');
  return changed('bookings', 'updated', updated);
}

export async function updateServiceQuantity(bid, sid, data) {
  validate(bookingServiceIdsSchema, { bid, sid });
  const { quantity } = validate(quantitySchema, data);
  return changed('bookings', 'updated', await bookingsRepository.updateQuantity(bid, sid, quantity));
}
export async function removeServiceFromBooking(bid, sid) {
  validate(bookingServiceIdsSchema, { bid, sid });
  return changed('bookings', 'updated', await bookingsRepository.removeService(bid, sid));
}
export async function clearBooking(bid) {
  validate(bookingIdSchema, { bid });
  return changed('bookings', 'updated', await bookingsRepository.clear(bid));
}
export async function deleteBooking(bid) {
  validate(bookingIdSchema, { bid });
  return changed('bookings', 'deleted', await bookingsRepository.deleteBooking(bid));
}
