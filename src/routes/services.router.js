import { Router } from 'express';
import ServiceManager from '../managers/ServiceManager.js';

const router = Router();
const serviceManager = new ServiceManager();

router.get('/', async (req, res) => {
  try {
    let services = await serviceManager.getServices();

    const { category, available } = req.query;

    if (category) {
      services = services.filter((service) => service.category === category);
    }

    if (available !== undefined) {
      const availableValue = available === 'true';
      services = services.filter((service) => service.available === availableValue);
    }

    return res.status(200).json({
      status: 'success',
      payload: services
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

router.get('/:sid', async (req, res) => {
  try {
    const service = await serviceManager.getServiceById(req.params.sid);

    if (!service) {
      return res.status(404).json({
        status: 'error',
        message: 'Servicio no encontrado'
      });
    }

    return res.status(200).json({
      status: 'success',
      payload: service
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const service = await serviceManager.addService(req.body);

    return res.status(201).json({
      status: 'success',
      payload: service
    });
  } catch (error) {
    return res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

router.put('/:sid', async (req, res) => {
  try {
    const service = await serviceManager.updateService(req.params.sid, req.body);

    if (!service) {
      return res.status(404).json({
        status: 'error',
        message: 'Servicio no encontrado'
      });
    }

    return res.status(200).json({
      status: 'success',
      payload: service
    });
  } catch (error) {
    return res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

router.delete('/:sid', async (req, res) => {
  try {
    const service = await serviceManager.deleteService(req.params.sid);

    if (!service) {
      return res.status(404).json({
        status: 'error',
        message: 'Servicio no encontrado'
      });
    }

    return res.status(200).json({
      status: 'success',
      payload: service
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;
