import { Router } from 'express';
import {
  getBookings,
  createBooking,
  getBookingById,
  addServiceToBooking
} from '../controllers/bookings.controller.js';

const router = Router();

router.get('/', getBookings);
router.post('/', createBooking);
router.get('/:bid', getBookingById);
router.post('/:bid/services/:sid', addServiceToBooking);

export default router;
