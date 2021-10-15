import download from './commands/download';
import { command } from './types';

export default [
  {
    command: 'gitlab',
    action: download,
    description: 'Use for batch pack and download of gitlab repo.',
  },
] as command[];
