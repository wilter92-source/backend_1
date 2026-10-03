import { z } from 'zod';
import { ValidationError } from '../utils/errors.js';
const text = z.string().trim().min(1, 'Debe ser texto no vacío');
const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'ObjectId inválido');
export const serviceSchema = z.object({
  name: text, description: text, category: text,
  duration: z.number().finite().positive(), price: z.number().finite().nonnegative(),
  available: z.boolean()
});
export const updateServiceSchema = serviceSchema.partial();
export const bookingSchema = z.object({
  clientName: text, clientEmail: text.email('Email inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value =>
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value,
    'Fecha inexistente; usar YYYY-MM-DD'),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida; usar HH:mm'),
  status: z.enum(['pending', 'confirmed', 'cancelled']).default('pending'),
  services: z.array(z.object({ service: objectId, quantity: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) })).default([])
});
export const addServiceSchema = z.object({ bookingId: objectId, serviceId: objectId });
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) throw new ValidationError(result.error.issues.map(issue =>
    `${issue.path.join('.') || 'datos'}: ${issue.message}`).join('; '));
  return result.data;
}
