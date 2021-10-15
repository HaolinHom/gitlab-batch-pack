import download from './commands/download';
import { command } from './types';

export default [
  {
    command: 'git-dl',
    action: download,
    description: 'Use for batch download of gitlab repo.',
  },
] as command[];
