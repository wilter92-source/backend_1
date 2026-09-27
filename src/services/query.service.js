import { ValidationError } from '../utils/errors.js';
export function listOptions(query = {}, allowed = []) {
  const integer = (value, fallback, max) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || Number(value) > max) throw new ValidationError('Paginación inválida.');
    return Number(value);
  };
  const page = integer(query.page, 1, 1000000);
  const limit = integer(query.limit, 20, 100);
  const sort = query.sort ?? 'createdAt';
  if (!['createdAt', ...allowed].includes(sort)) throw new ValidationError('Campo sort inválido.');
  const order = query.order ?? 'desc';
  if (!['asc', 'desc'].includes(order)) throw new ValidationError('order debe ser asc o desc.');
  return { skip: (page - 1) * limit, limit, sort: { [sort]: order === 'asc' ? 1 : -1, _id: 1 } };
}
export function textFilter(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new ValidationError(`${name} debe ser texto no vacío.`);
  return value.trim();
}
