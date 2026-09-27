import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import config from '../src/config/env.config.js';
import { connectDB } from '../src/config/database.config.js';
import { ServiceModel } from '../src/dao/models/service.model.js';
try {
  await connectDB(config.mongoUri);
  const data = JSON.parse(await fs.readFile(new URL('../src/data/services.json', import.meta.url), 'utf8'));
  let inserted = 0;
  for (const { id, ...service } of data) {
    const result = await ServiceModel.updateOne({ name: service.name, description: service.description, category: service.category }, { $setOnInsert: service }, { upsert: true });
    inserted += result.upsertedCount;
  }
  console.log(`Servicios nuevos: ${inserted}. No se borraron registros existentes.`);
} catch { console.error('No se pudo ejecutar seed. Revisa la conexión a MongoDB.'); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
