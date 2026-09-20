import mongoose from 'mongoose';
import fs from 'fs/promises';
import config from '../src/config/env.config.js';
import { ServiceModel } from '../src/dao/models/service.model.js';

async function seed() {
  await mongoose.connect(config.mongoUri);

  const services = JSON.parse(
    await fs.readFile(new URL('../src/data/services.json', import.meta.url))
  );

  await ServiceModel.deleteMany({});
  await ServiceModel.insertMany(services.map(({ id, ...service }) => service));

  console.log(`Servicios cargados: ${services.length}`);
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error('Error ejecutando seed:', error.message);
  process.exit(1);
});
