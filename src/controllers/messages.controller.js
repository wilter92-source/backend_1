import * as service from '../services/messages.service.js';
import { respondError } from '../utils/errors.js';
export async function getMessages(req, res) {
  try { res.json({ status: 'success', payload: await service.getMessages(req.query) }); }
  catch (error) { respondError(res, error); }
}
export async function createMessage(req, res) {
  try { res.status(201).json({ status: 'success', payload: await service.createMessage(req.body) }); }
  catch (error) { respondError(res, error); }
}
export async function getMessageById(req, res) {
  try {
    const message = await service.getMessageById(req.params.mid);
    if (!message) return res.status(404).json({ status: 'error', message: 'Mensaje no encontrado' });
    res.json({ status: 'success', payload: message });
  } catch (error) { respondError(res, error); }
}
