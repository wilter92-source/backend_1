import * as bookingsRepository from '../repositories/bookings.repository.js';
import * as servicesRepository from '../repositories/services.repository.js';

const validId = id => Number.isSafeInteger(Number(id)) && Number(id) > 0;
let pendingAddition = Promise.resolve();

export async function createBooking(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Los datos de la reserva deben ser un objeto válido.');
  }
  const required = ['clientName', 'clientEmail', 'date', 'time', 'status'];
  const missing = required.filter(field => typeof data[field] !== 'string' || !data[field].trim());
  if (missing.length) throw new Error(`Faltan campos obligatorios o son inválidos: ${missing.join(', ')}`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.clientEmail)) {
    throw new Error('clientEmail debe tener un formato de email válido.');
  }
  const parsedDate = new Date(`${data.date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || !Number.isFinite(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== data.date) {
    throw new Error('date debe ser una fecha válida con formato YYYY-MM-DD.');
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time)) throw new Error('time debe tener formato HH:mm (24 horas).');
  if (data.services !== undefined && !Array.isArray(data.services)) {
    throw new Error('services debe ser un array.');
  }
  const services = [];
  for (const item of data.services ?? []) {
    if (!item || !validId(item.service) || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('Cada servicio debe tener un ID válido y quantity entero mayor que cero.');
    }
    const id = Number(item.service);
    if (!await servicesRepository.getById(id)) throw new Error(`El servicio ${id} no existe.`);
    const existing = services.find(entry => entry.service === id);
    if (existing) {
      if (!Number.isSafeInteger(existing.quantity + item.quantity)) throw new Error('quantity es demasiado grande.');
      existing.quantity += item.quantity;
    } else services.push({ service: id, quantity: item.quantity });
  }
  return bookingsRepository.create({
    clientName: data.clientName, clientEmail: data.clientEmail,
    date: data.date, time: data.time, status: data.status, services
  });
}

export const getBookingById = id => validId(id) ? bookingsRepository.getById(Number(id)) : null;

export function addServiceToBooking(bookingId, serviceId) {
  // Evita perder incrementos si llegan varias peticiones a la vez.
  const operation = pendingAddition.then(async () => {
    if (!validId(bookingId) || !validId(serviceId)) return null;
    const booking = await bookingsRepository.getById(Number(bookingId));
    const service = await servicesRepository.getById(Number(serviceId));
    if (!booking || !service) return null;
    const existing = booking.services.find(item => item.service === service.id);
    if (existing) {
      if (!Number.isSafeInteger(existing.quantity + 1)) throw new Error('quantity es demasiado grande.');
      existing.quantity += 1;
    } else booking.services.push({ service: service.id, quantity: 1 });
    return bookingsRepository.update(booking.id, { services: booking.services });
  });
  pendingAddition = operation.catch(() => {});
  return operation;
}
