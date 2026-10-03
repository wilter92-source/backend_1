import mongoose from 'mongoose';
import app from './app.js';
import config from './config/env.config.js';
import { connectDB } from './config/database.config.js';
import { createHttpServer } from './config/socket.config.js';
try {
  await connectDB(config.mongoUri);
  const { server, io } = createHttpServer(app);
  server.listen(config.port, () => console.log(`Servidor disponible en http://localhost:${config.port}/views/services`));
  server.on('error', async () => { console.error('No se pudo abrir el puerto.'); await mongoose.disconnect(); process.exitCode = 1; });
  const shutdown = () => io.close(async () => { await mongoose.disconnect(); });
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
} catch {
  console.error('No se pudo conectar a MongoDB. Revisa MONGO_URI, permisos de red y disponibilidad del servidor.');
  await mongoose.disconnect();
  process.exitCode = 1;
}
