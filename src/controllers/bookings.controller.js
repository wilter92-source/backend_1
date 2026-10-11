import { respondError } from '../utils/errors.js';
import * as bookingService from '../services/bookings.service.js';

export const createBooking = async (req, res) => {
  try {
    const booking = await bookingService.createBooking(req.body);
    res.status(201).json({ status: 'success', payload: booking });
  } catch (error) {
    respondError(res, error);
  }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.bid);

    if (!booking) {
      return res.status(404).json({ status: 'error', message: 'Reserva no encontrada' });
    }

    res.status(200).json({ status: 'success', payload: booking });
  } catch (error) {
    respondError(res, error);
  }
};

export const addServiceToBooking = async (req, res) => {
  try {
    const booking = await bookingService.addServiceToBooking(
      req.params.bid,
      req.params.sid
    );

    if (!booking) {
      return res.status(404).json({ status: 'error', message: 'La reserva o el servicio no existen' });
    }

    res.status(200).json({ status: 'success', payload: booking });
  } catch (error) {
    respondError(res, error);
  }
};

export const getBookings = async (req, res) => {
  try { res.json({ status: 'success', payload: await bookingService.getBookings(req.query) }); }
  catch (error) { respondError(res, error); }
};

// Express 5 deriva los rechazos al middleware centralizado de errores.
export async function updateServiceQuantity(req, res) {
  const booking = await bookingService.updateServiceQuantity(req.params.bid, req.params.sid, req.body);
  if (!booking) return res.status(404).json({ status: 'error', message: 'Reserva o servicio asociado no encontrado' });
  res.json({ status: 'success', payload: booking });
}
export async function removeServiceFromBooking(req, res) {
  const booking = await bookingService.removeServiceFromBooking(req.params.bid, req.params.sid);
  if (!booking) return res.status(404).json({ status: 'error', message: 'Reserva o servicio asociado no encontrado' });
  res.json({ status: 'success', payload: booking });
}
export async function clearBooking(req, res) {
  const booking = await bookingService.clearBooking(req.params.bid);
  if (!booking) return res.status(404).json({ status: 'error', message: 'Reserva no encontrada' });
  res.json({ status: 'success', payload: booking });
}
export async function deleteBooking(req, res) {
  const booking = await bookingService.deleteBooking(req.params.bid);
  if (!booking) return res.status(404).json({ status: 'error', message: 'Reserva no encontrada' });
  res.json({ status: 'success', payload: booking });
}
