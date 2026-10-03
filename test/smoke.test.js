// Comprobaciones sin base: no sustituyen test/api.test.js ni simulan persistencia.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFile } from 'node:fs/promises';
import { io as connect } from 'socket.io-client';
import app from '../src/app.js';
import { createHttpServer } from '../src/config/socket.config.js';
import { listOptions } from '../src/services/query.service.js';
import { createBooking } from '../src/services/bookings.service.js';
import { updateService } from '../src/services/services.service.js';
import { addServiceToBooking } from '../src/services/bookings.service.js';
import { createService } from '../src/services/services.service.js';
import { createMessage } from '../src/services/messages.service.js';
const waitFor = async predicate => {
  for (let i = 0; i < 150; i++) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 20)); }
  assert.fail('Timeout esperando actualización');
};
test('validación antes de acceder a la base', async () => {
  for (const query of [{ page: '0' }, { limit: '101' }, { sort: '$where' }, { order: 'bad' }]) assert.throws(() => listOptions(query));
  assert.deepEqual(listOptions({ page: '2', limit: '5', sort: 'price', order: 'asc' }, ['price']), { skip: 5, limit: 5, sort: { price: 1, _id: 1 } });
  const booking = { clientName: 'Ana', clientEmail: 'ana@example.com', date: '2026-10-10', time: '10:30' };
  for (const data of [{}, [], { ...booking, date: '2026-02-30' }, { ...booking, time: '25:00' }, { ...booking, services: {} }, { ...booking, services: [null] }, { ...booking, status: 'bad' }]) await assert.rejects(() => createBooking(data));
  assert.throws(() => createService({}));
  await assert.rejects(() => updateService('507f1f77bcf86cd799439011', { price: -1 }), /price/);
  await assert.rejects(() => addServiceToBooking('invalid', 'invalid'), /ObjectId/);
  assert.throws(() => createMessage({ user: ' ', message: 'hola' }));
});
test('Handlebars renderiza y escapa datos; plantillas vacías y reservas', async () => {
  const render = (name, data) => new Promise((resolve, reject) => app.render(name, data, (error, html) => error ? reject(error) : resolve(html)));
  const html = await render('services', { services: [{ name: '<script>alert(1)</script>', description: 'Prueba', duration: 30, price: 25, category: 'salud', available: false }] });
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('Disponible: No'));
  assert.ok((await render('services', { services: [] })).includes('No hay servicios'));
  assert.ok((await render('bookings', { bookings: [{ clientName: 'Ana', services: [{ service: null, quantity: 2 }] }] })).includes('Servicio eliminado'));
});
test('Socket.io real + script del navegador: DOM, reconexión y ausencia de duplicados', async () => {
  const { server, io } = createHttpServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let socket, dom;
  try {
    for (const path of ['/', '/css/styles.css', '/js/socket.js', '/socket.io/socket.io.js']) assert.equal((await fetch(base + path)).status, 200);
    assert.equal((await fetch(base + '/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken' })).status, 400);
    const html = await new Promise((resolve, reject) => app.render('services', { services: [] }, (error, result) => error ? reject(error) : resolve(result)));
    dom = new JSDOM(html, { url: base + '/views/services?available=true', runScripts: 'outside-only' });
    let items = []; const urls = [];
    // Solo la consulta HTTP se sustituye aquí; el transporte Socket.io es real.
    dom.window.fetch = async url => { urls.push(url); return { ok: true, json: async () => ({ payload: items }) }; };
    socket = connect(base, { transports: ['websocket'] });
    dom.window.io = () => socket;
    dom.window.eval(await readFile(new URL('../public/js/socket.js', import.meta.url), 'utf8'));
    const list = dom.window.document.getElementById('live-list');
    await waitFor(() => urls.length > 0);
    items = [{ name: '<img src=x onerror=alert(1)>', description: 'Actualizado', duration: 30, price: 10, category: 'salud', available: true }];
    io.emit('services:changed', { action: 'created' });
    await waitFor(() => list.textContent.includes('Actualizado'));
    assert.equal(list.querySelector('img'), null);
    io.emit('services:changed', { action: 'updated' });
    await waitFor(() => urls.length >= 3);
    assert.equal(list.querySelectorAll('article').length, 1);
    assert.ok(urls.every(url => url === '/api/services?available=true'));
    socket.disconnect(); items = [];
    socket.connect();
    await waitFor(() => list.textContent.includes('No hay servicios'));
  } finally {
    socket?.close(); dom?.window.close(); await new Promise(resolve => io.close(resolve));
  }
});
