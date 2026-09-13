import { fileURLToPath } from 'node:url';
import JsonDao from './json.dao.js';

export default new JsonDao(fileURLToPath(new URL('../data/services.json', import.meta.url)));
