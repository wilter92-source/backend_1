import dao from '../dao/bookings.dao.js';
export const create = data => dao.create(data);
export const getAll = (filter, options) => dao.getAll(filter, options);
export const getById = id => dao.getById(id);
export const addService = (id, sid) => dao.addService(id, sid);
