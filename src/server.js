import app from './app.js';
import config from './config/env.config.js';
import ServiceManager from './managers/ServiceManager.js';

const serviceManager = new ServiceManager();

async function startServer() {
  try {
    const services = await serviceManager.getServices();

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
