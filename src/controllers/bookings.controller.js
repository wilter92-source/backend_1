import { respondError } from '../utils/errors.js';
import * as bookingService from '../services/bookings.service.js';

export const createBooking = async (req, res) => {
  try {
    const booking = await bookingService.createBooking(req.body);
    req.app.get('io')?.emit('bookings:changed', { action: 'created', id: String(booking._id) });
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

    req.app.get('io')?.emit('bookings:changed', { action: 'updated', id: String(booking._id) });
    res.status(200).json({ status: 'success', payload: booking });
  } catch (error) {
    respondError(res, error);
  }
};

export const getBookings = async (req, res) => {
  try { res.json({ status: 'success', payload: await bookingService.getBookings(req.query) }); }
  catch (error) { respondError(res, error); }
};
