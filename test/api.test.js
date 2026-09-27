import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { io as connect } from 'socket.io-client';
import { JSDOM } from 'jsdom';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import app from '../src/app.js';
import { createHttpServer } from '../src/config/socket.config.js';
import { ServiceModel } from '../src/dao/models/service.model.js';
import { BookingModel } from '../src/dao/models/booking.model.js';
const waitFor = async predicate => {
  for (let i = 0; i < 150; i++) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.fail('No llegó la actualización esperada en 3 segundos.');
};
test('Integración con MongoDB real aislado, API, vistas y Socket.io', { timeout: 120000 }, async t => {
  let mongo, server, io;
  const clients = [];
  const doms = [];
  const dbName = `modulo7_test_${randomUUID().replaceAll('-', '')}`;
  try {
    const uri = process.env.MONGO_TEST_URI || (mongo = await MongoMemoryServer.create()).getUri();
    await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000 });
    ({ server, io } = createHttpServer(app));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    async function request(method, path, body, expected = 200) {
      const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      const data = await response.json();
      assert.equal(response.status, expected, JSON.stringify(data));
      assert.equal(data.status, expected < 400 ? 'success' : 'error');
      return data.payload;
    }
    const service = { name: 'Consulta', description: 'Consulta general', duration: 30, price: 25, category: 'salud', available: true };
    const booking = { clientName: 'Ana', clientEmail: 'ana@example.com', date: '2026-10-10', time: '10:30', status: 'pending' };
    let sid, bid;
    await t.test('CRUD y filtros, orden y paginación ejecutados en MongoDB', async () => {
      await request('GET', '/');
      sid = (await request('POST', '/api/services', service, 201))._id;
      assert.match(sid, /^[a-f0-9]{24}$/);
      await request('POST', '/api/services', { ...service, name: 'Otra', price: 50 }, 201);
      assert.equal((await request('GET', '/api/services?sort=price&order=asc&limit=1&page=2'))[0].price, 50);
      assert.equal((await request('GET', '/api/services?available=false')).length, 0);
      assert.equal((await request('GET', '/api/services?category=salud')).length, 2);
      assert.equal((await request('GET', `/api/services/${sid}`)).name, 'Consulta');
      for (const data of [{}, [], { ...service, duration: 0 }, { ...service, price: -1 }, { ...service, available: 'true' }]) await request('POST', '/api/services', data, 400);
      for (const query of ['available=wrong', 'page=0', 'limit=101', 'sort=unknown', 'category[$ne]=x', 'order=bad']) {
        // Express usa query simple: una clave desconocida se ignora, no se interpreta como operador.
        if (query.startsWith('category[')) continue;
        await request('GET', `/api/services?${query}`, undefined, 400);
      }
      const updated = await request('PUT', `/api/services/${sid}`, { _id: 'wrong', price: 0, available: false });
      assert.equal(updated._id, sid); assert.equal(updated.price, 0);
      await request('PUT', `/api/services/${sid}`, { price: null }, 400);
      await request('GET', '/api/services/1', undefined, 404);
    });
    await t.test('reservas: validación, referencias, populate y concurrencia', async () => {
      for (const data of [{}, [], { ...booking, date: '2026-02-30' }, { ...booking, time: '25:00' }, { ...booking, clientEmail: 'bad' }, { ...booking, status: 'bad' }, { ...booking, services: {} }, { ...booking, services: [null] }, { ...booking, services: [{ service: sid, quantity: 0 }] }]) await request('POST', '/api/bookings', data, 400);
      assert.equal(await BookingModel.countDocuments(), 0);
      bid = (await request('POST', '/api/bookings', { ...booking, services: [{ service: sid, quantity: 2 }, { service: sid, quantity: 3 }] }, 201))._id;
      const loaded = await request('GET', `/api/bookings/${bid}`);
      assert.equal(loaded.services.length, 1);
      assert.equal(loaded.services[0].quantity, 5);
      assert.equal(loaded.services[0].service.name, 'Consulta');
      await Promise.all(Array.from({ length: 10 }, () => request('POST', `/api/bookings/${bid}/services/${sid}`)));
      assert.equal((await request('GET', `/api/bookings/${bid}`)).services[0].quantity, 15);
      assert.equal((await request('GET', '/api/bookings?status=pending&date=2026-10-10&sort=date&order=asc&limit=1')).length, 1);
      assert.equal((await request('GET', '/api/bookings?status=confirmed')).length, 0);
      await request('GET', '/api/bookings?date=bad', undefined, 400);
      await request('POST', `/api/bookings/${bid}/services/1`, undefined, 404);
    });
    await t.test('messages recorre todas las capas y persiste', async () => {
      const message = await request('POST', '/api/messages', { user: 'Ana', message: 'Consulta de prueba' }, 201);
      assert.equal((await request('GET', `/api/messages/${message._id}`)).message, 'Consulta de prueba');
      assert.equal((await request('GET', '/api/messages?user=Ana&limit=1')).length, 1);
      await request('POST', '/api/messages', { user: ' ', message: 'hola' }, 400);
      await request('GET', '/api/messages/1', undefined, 404);
    });
    await t.test('vistas SSR, estados vacíos, errores y archivos estáticos', async () => {
      const html = await (await fetch(base + '/views/services')).text();
      for (const term of ['Consulta', 'Consulta general', 'Duración:', 'Precio:', 'Categoría:', 'Disponible:']) assert.ok(html.includes(term));
      const reservations = await (await fetch(base + '/views/bookings')).text();
      assert.ok(reservations.includes('Ana')); assert.ok(reservations.includes('Consulta'));
      assert.ok((await (await fetch(base + '/views/services?category=missing')).text()).includes('No hay servicios'));
      assert.equal((await fetch(base + '/views/services?limit=0')).status, 400);
      for (const path of ['/css/styles.css', '/js/socket.js', '/socket.io/socket.io.js']) assert.equal((await fetch(base + path)).status, 200);
    });
    await t.test('dos clientes reciben mutaciones y actualizan DOM sin recargar; filtros y XSS', async () => {
      async function browser(path) {
        const html = await (await fetch(base + path)).text();
        const dom = new JSDOM(html, { url: base + path, runScripts: 'outside-only' });
        dom.window.fetch = (url, options) => fetch(new URL(url, base), options);
        const socket = connect(base, { transports: ['websocket'] }); clients.push(socket);
        dom.window.io = () => socket;
        dom.window.eval(await readFile(new URL('../public/js/socket.js', import.meta.url), 'utf8'));
        doms.push(dom);
        await waitFor(() => dom.window.document.getElementById('connection-status').textContent.includes('Conectado'));
        return { dom, socket, list: dom.window.document.getElementById('live-list') };
      }
      const a = await browser('/views/services?available=true');
      const b = await browser('/views/services');
      const c = await browser('/views/bookings');
      const name = '<img src=x onerror="window.hacked=true">';
      const created = await request('POST', '/api/services', { ...service, name }, 201);
      await waitFor(() => a.list.textContent.includes(name) && b.list.textContent.includes(name));
      assert.equal(a.list.querySelector('img'), null);
      assert.equal(a.dom.window.hacked, undefined);
      const escaped = await (await fetch(base + '/views/services')).text();
      assert.ok(escaped.includes('&lt;img'));
      await request('PUT', `/api/services/${created._id}`, { available: false, name: 'Cambio realtime' });
      await waitFor(() => !a.list.textContent.includes(name) && b.list.textContent.includes('Cambio realtime'));
      await request('POST', '/api/bookings', { ...booking, clientName: 'Cliente realtime', services: [{ service: created._id, quantity: 1 }] }, 201);
      await waitFor(() => c.list.textContent.includes('Cliente realtime'));
      await request('DELETE', `/api/services/${created._id}`);
      await waitFor(() => !b.list.textContent.includes('Cambio realtime') && c.list.textContent.includes('Servicio eliminado'));
      // La reserva con una referencia eliminada sigue siendo actualizable.
      const other = (await request('GET', '/api/bookings')).find(x => x.clientName === 'Cliente realtime');
      await request('POST', `/api/bookings/${other._id}/services/${sid}`);
      await waitFor(() => c.list.textContent.includes('Consulta'));
      b.socket.disconnect();
      await request('POST', '/api/services', { ...service, name: 'Durante desconexión' }, 201);
      b.socket.connect();
      await waitFor(() => b.list.textContent.includes('Durante desconexión'));
    });
    await t.test('persistencia al reconectar Mongoose', async () => {
      await mongoose.disconnect();
      await mongoose.connect(uri, { dbName });
      assert.ok(await ServiceModel.findById(sid));
      assert.equal((await request('GET', `/api/bookings/${bid}`)).services[0].quantity, 15);
    });
  } finally {
    clients.forEach(client => client.close()); doms.forEach(dom => dom.window.close());
    if (io) await new Promise(resolve => io.close(resolve));
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  }
});
