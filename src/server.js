import app from './app.js';
import config from './config/env.config.js';
import { getServices } from './services/services.service.js';

async function startServer() {
  try {
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
