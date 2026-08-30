import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_FILE_PATH = path.join(__dirname, '..', 'data', 'bookings.json');

class BookingManager {
  constructor(filePath = DEFAULT_FILE_PATH) {
    this.filePath = filePath;
  }

  async readBookings() {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');

      if (!data.trim()) return [];

      const bookings = JSON.parse(data);

      if (!Array.isArray(bookings)) {
        throw new Error('El archivo de reservas debe contener un array JSON.');
      }

      return bookings;
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        await this.writeBookings([]);
        return [];
      }

      throw new Error(`No se pudieron leer las reservas: ${error.message}`);
    }
  }

  async writeBookings(bookings) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(
      this.filePath,
      JSON.stringify(bookings, null, 2) + '\n',
      'utf-8'
    );
  }

  async createBooking(data) {
    const required = ['clientName', 'clientEmail', 'date', 'time', 'status'];

    const missing = required.filter(
      (field) => data[field] === undefined || data[field] === ''
    );

    if (missing.length) {
      throw new Error(`Faltan campos obligatorios: ${missing.join(', ')}`);
    }

    const bookings = await this.readBookings();

    const id =
      bookings.length === 0
        ? 1
        : Math.max(...bookings.map((booking) => Number(booking.id) || 0)) + 1;

    const newBooking = {
      id,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      date: data.date,
      time: data.time,
      status: data.status,
      services: Array.isArray(data.services) ? data.services : []
    };

    bookings.push(newBooking);
    await this.writeBookings(bookings);

    return newBooking;
  }

  async getBookingById(id) {
    const bookings = await this.readBookings();
    return bookings.find((booking) => booking.id === Number(id)) ?? null;
  }

  async addServiceToBooking(bookingId, serviceId, serviceManager) {
    const booking = await this.getBookingById(bookingId);
    const service = await serviceManager.getServiceById(serviceId);

    if (!booking || !service) {
      return null;
    }

    const existing = booking.services.find(
      (item) => item.service === Number(serviceId)
    );

    if (existing) {
      existing.quantity += 1;
    } else {
      booking.services.push({
        service: Number(serviceId),
        quantity: 1
      });
    }

    const bookings = await this.readBookings();
    const index = bookings.findIndex((item) => item.id === booking.id);
    bookings[index] = booking;

    await this.writeBookings(bookings);

    return booking;
  }
}

export default BookingManager;
