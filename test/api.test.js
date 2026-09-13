import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Se copia src para probar con datos temporales, sin tocar los datos de entrega.
test('API completa y persistencia del refactor', async t => {
  const directory = await mkdtemp(path.join(process.cwd(), '.test-'));
  let server;
  try {
    await cp('src', path.join(directory, 'src'), { recursive: true });
    for (const resource of ['services', 'bookings']) {
      await writeFile(path.join(directory, 'src/data', `${resource}.json`), '[]');
      await writeFile(path.join(directory, 'src/data', `${resource}.counter.json`), '{"lastId":0}');
    }
    const { default: app } = await import(pathToFileURL(path.join(directory, 'src/app.js')));
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    async function request(method, route, body, status = 200) {
      const response = await fetch(base + route, {
        method, headers: { 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
      const json = await response.json();
      assert.equal(response.status, status, JSON.stringify(json));
      assert.equal(json.status, status < 400 ? 'success' : 'error');
      return json.payload;
    }
    const service = { name: 'Consulta', description: 'Consulta general', duration: 30, price: 25, category: 'salud', available: true };
    const booking = { clientName: 'Ana', clientEmail: 'ana@example.com', date: '2026-10-10', time: '10:30', status: 'pending' };
    let sid, bid;
    await t.test('crear, listar, filtrar y consultar servicios', async () => {
      await request('GET', '/');
      const created = await request('POST', '/api/services', service, 201);
      sid = created.id;
      assert.equal((await request('GET', `/api/services/${sid}`)).name, service.name);
      assert.equal((await request('GET', '/api/services?category=salud&available=true')).length, 1);
      assert.equal((await request('GET', '/api/services?available=false')).length, 0);
      assert.equal((await request('GET', '/api/services?category=otra')).length, 0);
    });
    await t.test('validar servicios y proteger id en PUT', async () => {
      for (const data of [{}, [], { ...service, duration: 0 }, { ...service, price: -1 }, { ...service, available: 'true' }, { ...service, name: ' ' }]) {
        await request('POST', '/api/services', data, 400);
      }
      const updated = await request('PUT', `/api/services/${sid}`, { price: 0, available: false, id: 900 });
      assert.equal(updated.id, sid);
      assert.equal(updated.price, 0);
      assert.equal(updated.available, false);
      await request('PUT', `/api/services/${sid}`, { price: null }, 400);
      await request('PUT', '/api/services/999', { price: 20 }, 404);
      await request('GET', '/api/services/invalido', undefined, 404);
    });
    await t.test('validar reservas antes de persistir', async () => {
      for (const data of [{}, [], { ...booking, clientEmail: 'mal@' }, { ...booking, date: '2026-02-30' }, { ...booking, time: '25:00' }, { ...booking, services: {} }, { ...booking, services: [{ service: 999, quantity: 1 }] }, { ...booking, services: [{ service: sid, quantity: 0 }] }]) {
        await request('POST', '/api/bookings', data, 400);
      }
      const items = JSON.parse(await readFile(path.join(directory, 'src/data/bookings.json')));
      assert.equal(items.length, 0);
      bid = (await request('POST', '/api/bookings', booking, 201)).id;
      assert.deepEqual((await request('GET', `/api/bookings/${bid}`)).services, []);
      const initial = await request('POST', '/api/bookings', { ...booking, services: [{ service: sid, quantity: 2 }, { service: sid, quantity: 3 }] }, 201);
      assert.deepEqual(initial.services, [{ service: sid, quantity: 5 }]);
    });
    await t.test('agregar dos veces y en paralelo incrementa quantity sin duplicar', async () => {
      const route = `/api/bookings/${bid}/services/${sid}`;
      await request('POST', route);
      assert.deepEqual((await request('POST', route)).services, [{ service: sid, quantity: 2 }]);
      await Promise.all(Array.from({ length: 10 }, () => request('POST', route)));
      assert.deepEqual((await request('GET', `/api/bookings/${bid}`)).services, [{ service: sid, quantity: 12 }]);
      await request('POST', `/api/bookings/${bid}/services/999`, undefined, 404);
      await request('POST', `/api/bookings/999/services/${sid}`, undefined, 404);
      await request('GET', '/api/bookings/999', undefined, 404);
    });
    await t.test('borrar, crear y reiniciar DAO no reutiliza IDs', async () => {
      assert.equal((await request('DELETE', `/api/services/${sid}`)).id, sid);
      await request('DELETE', `/api/services/${sid}`, undefined, 404);
      const newer = await request('POST', '/api/services', service, 201);
      assert.ok(newer.id > sid);
      const { default: JsonDao } = await import('../src/dao/json.dao.js');
      const dao = new JsonDao(path.join(directory, 'src/data/services.json'));
      await dao.delete(newer.id);
      const reloaded = new JsonDao(dao.filePath);
      assert.ok((await reloaded.create(service)).id > newer.id);
      const created = await Promise.all(Array.from({ length: 8 }, () => request('POST', '/api/services', service, 201)));
      assert.equal(new Set(created.map(item => item.id)).size, 8);
      assert.equal((await request('GET', '/api/services')).length, 9);
      const storedBookings = new JsonDao(path.join(directory, 'src/data/bookings.json'));
      assert.equal((await storedBookings.getById(bid)).services[0].quantity, 12);
    });
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
