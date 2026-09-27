import dao from '../dao/messages.dao.js';
export const create = data => dao.create(data);
export const getAll = (filter, options) => dao.getAll(filter, options);
export const getById = id => dao.getById(id);
