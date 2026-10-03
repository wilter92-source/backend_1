import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_ENV_VARS = ['PORT', 'NODE_ENV', 'MONGO_URI'];

const missingVariables = REQUIRED_ENV_VARS.filter((variableName) => {
  const value = process.env[variableName];
  return value === undefined || value.trim() === '';
});

if (missingVariables.length > 0) {
  throw new Error(
    `Faltan variables de entorno requeridas: ${missingVariables.join(', ')}. ` +
    'Crea un archivo .env tomando .env.example como referencia.'
  );
}

const port = Number(process.env.PORT);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error('PORT debe ser un número entero válido entre 1 y 65535.');
}

const config = Object.freeze({
  port,
  nodeEnv: process.env.NODE_ENV,
  mongoUri: process.env.MONGO_URI
});

export default config;
