
import dns from 'node:dns/promises';

dns.setServers(['8.8.8.8', '1.1.1.1']);

import app from './app.js';
import config from './config/env.config.js';
import { getServices } from './services/services.service.js';
import { connectDB } from './config/database.config.js';

async function startServer() {
  try {
    await connectDB();
    const services = await getServices();

    app.listen(config.port, () => {
      console.log('Servidor iniciado correctamente.');
      console.log(`Entorno: ${config.nodeEnv}`);
      console.log(`Puerto: ${config.port}`);
      console.log(`Servicios registrados: ${services.length}`);
    });
  } catch (error) {
    console.error(`Error al iniciar servidor: ${error.message}`);
    process.exitCode = 1;
  }
}

startServer();
