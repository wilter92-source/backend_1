import config from './config/env.config.js';
import ServiceManager from './managers/ServiceManager.js';

const serviceManager = new ServiceManager();

async function main() {
  try {
    const services = await serviceManager.getServices();

    console.log('Aplicación inicializada correctamente.');
    console.log(`Entorno: ${config.nodeEnv}`);
    console.log(`Puerto configurado: ${config.port}`);
    console.log(`Servicios registrados: ${services.length}`);
  } catch (error) {
    console.error(`Error al iniciar la aplicación: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
