import { createServer } from 'node:http';
import { Server } from 'socket.io';
export function createHttpServer(app) {
  const server = createServer(app);
  const io = new Server(server);
  app.set('io', io);
  // Las mutaciones REST emiten los eventos después de persistir en MongoDB.
  // Reconectar no sustituye dichos eventos; el cliente vuelve a consultar su lista.
  return { server, io };
}
