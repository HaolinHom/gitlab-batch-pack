import typescript from 'rollup-plugin-typescript2';
import cleaner from 'rollup-plugin-cleaner';
import { babel } from '@rollup/plugin-babel';
import path from 'path';
const pkg = require('./package.json');

const resolve = function (...args) {
  return path.resolve(__dirname, ...args);
};

const externalDeps = ['axios', 'chalk', 'chalk-ex', 'ora'];

const externalNode = [
  'console',
  'fs',
  'process',
  'url',
  'path',
  'module',
  'buffer',
];

module.exports = {
  input: resolve('./src/index.ts'),
  output: {
    format: 'esm',
    name: pkg.name,
    file: resolve(pkg.exports),
    banner: '#!/usr/bin/env node',
  },
  external: [...externalDeps, ...externalNode],
  plugins: [
    typescript({
      tsconfig: 'tsconfig.json',
    }),
    cleaner({
      targets: ['./bin/index.js'],
    }),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      extensions: ['.js', '.ts'],
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current',
            },
          },
        ],
      ],
    }),
  ],
};
