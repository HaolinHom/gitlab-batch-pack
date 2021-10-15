import process from 'process';
import { fileURLToPath } from 'url';
import path from 'path';

export const currentPath = process.cwd();
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
export const basePath = path.resolve(__dirname, '../');
export const cachePath = path.resolve(basePath, '.cache');
