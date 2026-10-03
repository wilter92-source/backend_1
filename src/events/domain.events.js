import { EventEmitter } from 'node:events';
// Las reglas de negocio publican solo después de una escritura exitosa.
export const domainEvents = new EventEmitter();
export function changed(resource, action, document) {
  if (document) domainEvents.emit(`${resource}:changed`, { action, id: String(document._id) });
  return document;
}
