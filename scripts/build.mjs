import { build } from 'esbuild';
import { rm } from 'node:fs/promises';
// Only this package's own output directory is removed.
await rm(new URL('../dist', import.meta.url), { recursive: true, force: true });
await build({
	entryPoints: { index: 'src/index.ts', core: 'src/core/index.ts', styles: 'src/styles.css' },
	outdir: 'dist',
	entryNames: '[name]',
	chunkNames: 'chunks/[name]-[hash]',
	bundle: true,
	// Shared code (all of core) lives in one chunk instead of being copied into index.js and core.js.
	splitting: true,
	format: 'esm',
	platform: 'neutral',
	target: 'es2022',
	external: ['react', 'react/jsx-runtime'],
	logLevel: 'info',
});
