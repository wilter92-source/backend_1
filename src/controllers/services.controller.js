import * as serviceService from '../services/services.service.js';

export const getServices = async (req, res) => {
  try {
    const services = await serviceService.getServices(req.query);

    res.status(200).json({ status: 'success', payload: services });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
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
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const service = await serviceService.createService(req.body);
    res.status(201).json({ status: 'success', payload: service });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const service = await serviceService.updateService(req.params.sid, req.body);
    if (!service) {
      return res.status(404).json({ status: 'error', message: 'Servicio no encontrado' });
    }
    res.status(200).json({ status: 'success', payload: service });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const service = await serviceService.deleteService(req.params.sid);
    if (!service) {
      return res.status(404).json({ status: 'error', message: 'Servicio no encontrado' });
    }
    res.status(200).json({ status: 'success', payload: service });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
