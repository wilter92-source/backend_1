import mongoose from 'mongoose';
import config from './env.config.js';

export async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Conexión a MongoDB exitosa');
  } catch (error) {
    console.error(`Error al conectar con MongoDB: ${error.message}`);
    process.exit(1);
  }
}
