import { defineConfig } from 'tsup';
import pkg from './package.json';

export default defineConfig({
    entry: ['src/index.ts'],
    sourcemap: true,
    format: ['cjs', 'esm'],
    dts: true,
    external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
    minify: true,
})