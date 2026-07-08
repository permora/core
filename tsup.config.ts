import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    scoped: 'src/scoped/index.ts',
  },
  format: ['esm'],
  dts: true,
  treeshake: true,
  splitting: false,
  clean: true,
  sourcemap: true,
  minify: true,
  target: 'es2022',
  platform: 'neutral',
  outDir: 'dist',
});
