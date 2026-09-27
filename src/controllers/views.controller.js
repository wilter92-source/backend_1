import { getServices } from '../services/services.service.js';
import { getBookings } from '../services/bookings.service.js';
export async function servicesView(req, res) {
  res.render('services', { title: 'Servicios', services: await getServices(req.query) });
}
export async function bookingsView(req, res) {
  res.render('bookings', { title: 'Reservas', bookings: await getBookings(req.query) });
}
