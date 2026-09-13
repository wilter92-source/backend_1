import dao from '../dao/services.dao.js';

export const getAll = () => dao.getAll();
export const getById = (id) => dao.getById(id);
export const create = (data) => dao.create(data);
export const update = (id, data) => dao.update(id, data);
const deleteById = (id) => dao.delete(id);
export { deleteById as delete };
