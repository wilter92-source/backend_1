import { Router } from 'express';
import { getMessages, createMessage, getMessageById } from '../controllers/messages.controller.js';
const router = Router();
router.get('/', getMessages);
router.post('/', createMessage);
router.get('/:mid', getMessageById);
export default router;
