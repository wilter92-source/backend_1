import dao from '../dao/bookings.dao.js';

export const create = (data) => dao.create(data);
export const getById = (id) => dao.getById(id);
export const update = (id, data) => dao.update(id, data);
