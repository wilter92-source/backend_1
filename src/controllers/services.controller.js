import { respondError } from '../utils/errors.js';
import * as serviceService from '../services/services.service.js';

export const getServices = async (req, res) => {
  try {
    const services = await serviceService.getServices(req.query);

    res.status(200).json({ status: 'success', payload: services });
  } catch (error) {
    respondError(res, error);
  }
};

export const getServiceById = async (req, res) => {
  try {
    const service = await serviceService.getServiceById(req.params.sid);
    if (!service) {
      return res.status(404).json({ status: 'error', message: 'Servicio no encontrado' });
    }
    res.status(200).json({ status: 'success', payload: service });
  } catch (error) {
    respondError(res, error);
  }
};

export const createService = async (req, res) => {
  try {
    const service = await serviceService.createService(req.body);
    if (service) req.app.get('io')?.emit('services:changed', { action: 'created', id: String(service._id) });
    res.status(201).json({ status: 'success', payload: service });
  } catch (error) {
    respondError(res, error);
  }
};

export const updateService = async (req, res) => {
  try {
    const service = await serviceService.updateService(req.params.sid, req.body);
    if (service) req.app.get('io')?.emit('services:changed', { action: 'updated', id: String(service._id) });
    if (!service) {
      return res.status(404).json({ status: 'error', message: 'Servicio no encontrado' });
    }
    res.status(200).json({ status: 'success', payload: service });
  } catch (error) {
    respondError(res, error);
  }
};

export const deleteService = async (req, res) => {
  try {
    const service = await serviceService.deleteService(req.params.sid);
    if (service) req.app.get('io')?.emit('services:changed', { action: 'deleted', id: String(service._id) });
    if (!service) {
      return res.status(404).json({ status: 'error', message: 'Servicio no encontrado' });
    }
    res.status(200).json({ status: 'success', payload: service });
  } catch (error) {
    respondError(res, error);
  }
};
