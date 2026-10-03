export class ValidationError extends Error {
  constructor(message) { super(message); this.name = 'InputValidationError'; this.status = 400; }
}
export function errorStatus(error) {
  if (error.status === 400 || ['ValidationError', 'CastError'].includes(error.name)) return 400;
  return 500;
}
export function respondError(res, error) {
  const status = errorStatus(error);
  return res.status(status).json({ status: 'error', message: status === 500 ? 'Error interno del servidor.' : error.message });
}
