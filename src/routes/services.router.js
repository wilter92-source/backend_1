import { Router } from 'express';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService
} from '../controllers/services.controller.js';

import { validateRequest, serviceSchema, updateServiceSchema } from '../validation/schemas.js';
const router = Router();

router.get('/', getServices);
router.get('/:sid', getServiceById);
router.post('/', validateRequest(serviceSchema), createService);
router.put('/:sid', validateRequest(updateServiceSchema), updateService);
router.delete('/:sid', deleteService);

export default router;
