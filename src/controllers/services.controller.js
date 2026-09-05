import ServiceManager from '../managers/ServiceManager.js';

const serviceManager = new ServiceManager();

export const getServices = async (req, res) => {
  try {
    let services = await serviceManager.getServices();
    const { category, available } = req.query;

    if (category) {
      services = services.filter((service) => service.category === category);
    }

    if (available !== undefined) {
      services = services.filter(
        (service) => service.available === (available === 'true')
      );
    }

    res.status(200).json({ status: 'success', payload: services });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getServiceById = async (req, res) => {
  try {
    const service = await serviceManager.getServiceById(req.params.sid);
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
    const service = await serviceManager.addService(req.body);
    res.status(201).json({ status: 'success', payload: service });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const service = await serviceManager.updateService(req.params.sid, req.body);
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
    const service = await serviceManager.deleteService(req.params.sid);
    if (!service) {
      return res.status(404).json({ status: 'error', message: 'Servicio no encontrado' });
    }
    res.status(200).json({ status: 'success', payload: service });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
