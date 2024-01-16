import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rollup } from 'rollup';
import solid from 'rollup-plugin-solid';
import pkg from './package.json';

const __dirname = fileURLToPath(new URL('.', import.meta.url))

async function build() {
  const bundle = await rollup({
    input: 'src/index.ts',
    plugins: [
      typescript({
        tsconfig: path.resolve(__dirname, 'tsconfig.json'),
        declaration: true,
        declarationDir: 'dist/types',
      }),
      resolve({
        browser: true,
        exportConditions: ['svelte'],
        extensions: ['.mjs', '.js', '.json', '.ts', 'tsx'],
      }),
      commonjs(),
      json(),
      solid()
    ],
    treeshake: true,
    external: [...Object.keys(pkg.dependencies || {})],
  })

  await bundle.write({
    format: 'esm',
    dir: 'dist',
  })
}

build().catch((err) => console.error(err))