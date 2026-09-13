import { getHome } from './controllers/home.controller.js';
import express from 'express';
import servicesRouter from './routes/services.router.js';
import bookingsRouter from './routes/bookings.router.js';

const app = express();

app.use(express.json());

app.get('/', getHome);

app.use('/api/services', servicesRouter);
app.use('/api/bookings', bookingsRouter);

export default app;
