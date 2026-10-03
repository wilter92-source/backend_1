import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { domainEvents } from '../events/domain.events.js';
export function createHttpServer(app) {
  const server = createServer(app);
  const io = new Server(server);
  const listeners = ['services:changed', 'bookings:changed'].map(event => {
    const listener = payload => io.emit(event, payload);
    domainEvents.on(event, listener);
    return [event, listener];
  });
  server.once('close', () => {
    for (const [event, listener] of listeners) domainEvents.off(event, listener);
  });
  return { server, io };
}
