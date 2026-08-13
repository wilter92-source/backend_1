import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_FILE_PATH = path.join(__dirname, '..', 'data', 'services.json');

const REQUIRED_FIELDS = [
  'name',
  'description',
  'duration',
  'price',
  'category',
  'available'
];

class ServiceManager {
  constructor(filePath = DEFAULT_FILE_PATH) {
    this.filePath = filePath;
  }

  async readServices() {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');

      if (data.trim() === '') {
        return [];
      }

      const services = JSON.parse(data);

      if (!Array.isArray(services)) {
        throw new Error('El archivo de servicios debe contener un array JSON.');
      }

      return services;
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        await this.writeServices([]);
        return [];
      }

      throw new Error(`No se pudieron leer los servicios: ${error.message}`);
    }
  }

  async writeServices(services) {
    try {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(
        this.filePath,
        JSON.stringify(services, null, 2) + '\n',
        'utf-8'
      );
    } catch (error) {
      throw new Error(`No se pudieron guardar los servicios: ${error.message}`);
    }
  }

  async getServices() {
    return this.readServices();
  }

  async getServiceById(id) {
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return null;
    }

    const services = await this.readServices();
    return services.find((service) => service.id === numericId) ?? null;
  }

  async addService(serviceData) {
    this.validateRequiredFields(serviceData);

    const services = await this.readServices();

    const nextId =
      services.length === 0
        ? 1
        : Math.max(...services.map((service) => Number(service.id) || 0)) + 1;

    const newService = {
      id: nextId,
      name: serviceData.name,
      description: serviceData.description,
      duration: serviceData.duration,
      price: serviceData.price,
      category: serviceData.category,
      available: serviceData.available
    };

    services.push(newService);
    await this.writeServices(services);

    return newService;
  }

  async updateService(id, updatedData) {
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return null;
    }

    if (
      updatedData === null ||
      typeof updatedData !== 'object' ||
      Array.isArray(updatedData)
    ) {
      throw new Error('updatedData debe ser un objeto válido.');
    }

    const services = await this.readServices();
    const serviceIndex = services.findIndex(
      (service) => service.id === numericId
    );

    if (serviceIndex === -1) {
      return null;
    }

    const safeUpdates = {};

    for (const field of REQUIRED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(updatedData, field)) {
        safeUpdates[field] = updatedData[field];
      }
    }

    this.validateUpdatedFields(safeUpdates);

    const updatedService = {
      ...services[serviceIndex],
      ...safeUpdates,
      id: services[serviceIndex].id
    };

    services[serviceIndex] = updatedService;
    await this.writeServices(services);

    return updatedService;
  }

  async deleteService(id) {
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return null;
    }

    const services = await this.readServices();
    const serviceIndex = services.findIndex(
      (service) => service.id === numericId
    );

    if (serviceIndex === -1) {
      return null;
    }

    const [deletedService] = services.splice(serviceIndex, 1);
    await this.writeServices(services);

    return deletedService;
  }

  validateRequiredFields(serviceData) {
    if (
      serviceData === null ||
      typeof serviceData !== 'object' ||
      Array.isArray(serviceData)
    ) {
      throw new Error('serviceData debe ser un objeto válido.');
    }

    const missingFields = REQUIRED_FIELDS.filter((field) => {
      if (!Object.prototype.hasOwnProperty.call(serviceData, field)) {
        return true;
      }

      const value = serviceData[field];

      if (value === undefined || value === null) {
        return true;
      }

      if (
        ['name', 'description', 'category'].includes(field) &&
        typeof value === 'string' &&
        value.trim() === ''
      ) {
        return true;
      }

      return false;
    });

    if (missingFields.length > 0) {
      throw new Error(
        `Faltan campos obligatorios del servicio: ${missingFields.join(', ')}.`
      );
    }
  }

  validateUpdatedFields(updatedData) {
    for (const [field, value] of Object.entries(updatedData)) {
      if (value === undefined || value === null) {
        throw new Error(`El campo "${field}" no puede ser null ni undefined.`);
      }

      if (
        ['name', 'description', 'category'].includes(field) &&
        typeof value === 'string' &&
        value.trim() === ''
      ) {
        throw new Error(`El campo "${field}" no puede estar vacío.`);
      }
    }
  }
}

export default ServiceManager;
