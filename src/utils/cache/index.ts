import fs from 'fs';
import { cache } from '../../types';
import { cachePath } from '../path';
import { DEFAULT_CACHE } from '../../constants/defaultConfig';
import { fsExtra } from '../../deps';

export function getCache(): cache {
  if (!fs.existsSync(cachePath)) {
    return DEFAULT_CACHE;
  }
  return fsExtra.readJsonSync(cachePath) as cache;
}

export function setCache(cacheJson: cache) {
  fs.writeFileSync(cachePath, JSON.stringify(cacheJson, null, 2), {
    encoding: 'utf8',
  });
}
