import mongoose from 'mongoose';
import * as bookingsRepository from '../repositories/bookings.repository.js';
import * as servicesRepository from '../repositories/services.repository.js';

const validId = id => mongoose.Types.ObjectId.isValid(id);

export async function createBooking(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Los datos de la reserva deben ser un objeto válido.');
  }

  const required = ['clientName', 'clientEmail', 'date', 'time'];
  const missing = required.filter(field => !data[field]);
  if (missing.length) throw new Error(`Faltan campos obligatorios: ${missing.join(', ')}`);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.clientEmail)) {
    throw new Error('clientEmail debe tener formato válido.');
  }

  const services = [];
  for (const item of data.services ?? []) {
    if (!validId(item.service) || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('Servicio inválido.');
    }
    if (!await servicesRepository.getById(item.service)) {
      throw new Error('El servicio no existe.');
    }
    services.push({ service: item.service, quantity: item.quantity });
  }

  return bookingsRepository.create({
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    date: data.date,
    time: data.time,
    status: data.status ?? 'pending',
    services
  });
}

export const getBookingById = id => validId(id) ? bookingsRepository.getById(id) : null;

export async function addServiceToBooking(bookingId, serviceId) {
  if (!validId(bookingId) || !validId(serviceId)) return null;
  const booking = await bookingsRepository.getById(bookingId);
  const service = await servicesRepository.getById(serviceId);
  if (!booking || !service) return null;

  const services = booking.services.map(item => ({
    service: item.service._id ?? item.service,
    quantity: item.quantity
  }));

  const existing = services.find(item => String(item.service) === String(serviceId));
  if (existing) existing.quantity += 1;
  else services.push({ service: serviceId, quantity: 1 });

  return bookingsRepository.update(bookingId, { services });
}
