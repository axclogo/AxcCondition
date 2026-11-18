// Fails when the published bundle grows past its budget (gzip bytes), e.g. because a dependency or
// duplicated code slipped in. Raise a budget only deliberately, in the same change that needs it.
import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET = { js: 22_000, css: 1_500 };
const files = ['dist/index.js', 'dist/core.js', ...readdirSync('dist/chunks').map((name) => `dist/chunks/${name}`)];
const size = (file) => gzipSync(readFileSync(file)).length;
const js = files.reduce((total, file) => total + size(file), 0);
const css = size('dist/styles.css');
const failures = [
	js > BUDGET.js && `JavaScript ${js} B gzip exceeds ${BUDGET.js} B`,
	css > BUDGET.css && `CSS ${css} B gzip exceeds ${BUDGET.css} B`,
].filter(Boolean);
if (failures.length) {
	console.error(failures.join('\n'));
	process.exitCode = 1;
} else console.log(`Size OK: JS ${js} B / ${BUDGET.js} B, CSS ${css} B / ${BUDGET.css} B (gzip)`);
