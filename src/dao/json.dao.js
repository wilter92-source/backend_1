import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// Las escrituras del mismo archivo se ejecutan en orden dentro del proceso.
const queues = new Map();

export default class JsonDao {
  constructor(filePath) {
    this.filePath = path.resolve(filePath);
    this.counterPath = this.filePath.replace(/\.json$/, '.counter.json');
  }

  async read() {
    try {
      const text = await fs.readFile(this.filePath, 'utf8');
      const data = text.trim() ? JSON.parse(text) : [];
      if (!Array.isArray(data)) throw new Error('Se esperaba un array JSON.');
      return data;
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  async write(filePath, data) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temporary = `${filePath}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, JSON.stringify(data, null, 2) + '\n');
      await fs.rename(temporary, filePath);
    } finally {
      await fs.rm(temporary, { force: true });
    }
  }

  runWrite(operation) {
    const pending = (queues.get(this.filePath) ?? Promise.resolve()).then(operation);
    queues.set(this.filePath, pending.catch(() => {}));
    return pending;
  }

  async getAll() {
    await queues.get(this.filePath);
    return this.read();
  }

  async getById(id) {
    return (await this.getAll()).find(item => item.id === id) ?? null;
  }

  create(data) {
    return this.runWrite(async () => {
      const items = await this.read();
      let lastId = 0;
      try {
        ({ lastId } = JSON.parse(await fs.readFile(this.counterPath, 'utf8')));
        if (!Number.isSafeInteger(lastId) || lastId < 0) throw new Error('Contador de IDs inválido.');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      const id = Math.max(lastId, ...items.map(item => item.id)) + 1;
      if (!Number.isSafeInteger(id)) throw new Error('Se agotaron los IDs disponibles.');
      // Se reserva el ID antes de guardar: una interrupción puede dejar un salto,
      // pero no permite reutilizar un ID que ya fue asignado.
      await this.write(this.counterPath, { lastId: id });
      const item = { ...data, id };
      items.push(item);
      await this.write(this.filePath, items);
      return item;
    });
  }

  update(id, data) {
    return this.runWrite(async () => {
      const items = await this.read();
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return null;
      items[index] = { ...items[index], ...data, id };
      await this.write(this.filePath, items);
      return items[index];
    });
  }

  delete(id) {
    return this.runWrite(async () => {
      const items = await this.read();
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return null;
      const [item] = items.splice(index, 1);
      await this.write(this.filePath, items);
      return item;
    });
  }
}
