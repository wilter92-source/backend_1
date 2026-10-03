import fs from 'node:fs/promises';
import config from '../src/config/env.config.js';
// Usar la API del servidor activo permite notificar también a sus navegadores.
const base = `http://127.0.0.1:${config.port}`;
try {
  const catalog = JSON.parse(await fs.readFile(new URL('../src/data/services.json', import.meta.url), 'utf8'));
  const existing = [];
  let page = 1, hasNextPage;
  do {
    const response = await fetch(`${base}/api/services?limit=100&page=${page}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    existing.push(...data.payload);
    hasNextPage = data.pagination.hasNextPage;
    page++;
  } while (hasNextPage);
  let inserted = 0;
  for (const { id, ...service } of catalog) {
    if (existing.some(item => ['name', 'description', 'category'].every(key => item[key] === service[key]))) continue;
    const response = await fetch(`${base}/api/services`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(service)
    });
    if (!response.ok) throw new Error('No se pudo crear un servicio del catálogo.');
    existing.push(service);
    inserted++;
  }
  console.log(`Servicios nuevos: ${inserted}. No se borraron registros existentes.`);
} catch {
  console.error('No se pudo ejecutar seed. Inicia npm start y comprueba PORT y MongoDB.');
  process.exitCode = 1;
}
