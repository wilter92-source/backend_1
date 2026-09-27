import { Router } from 'express';
import { servicesView, bookingsView } from '../controllers/views.controller.js';
const router = Router();
router.get('/services', servicesView);
router.get('/bookings', bookingsView);
export default router;
