// Redirects every `react` / `react-dom` import (ours and Testing Library's) to the
// React 18 copy installed in tests/react18, so one source tree runs against both majors.
import { createRequire, registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
const require18 = createRequire(new URL('../react18/package.json', import.meta.url));
process.env.AXC_EXPECT_REACT = '18';
let resolving = false; // require.resolve re-enters this hook
registerHooks({
	resolve(specifier, context, next) {
		if (resolving || !/^react(-dom)?(\/|$)/.test(specifier)) return next(specifier, context);
		resolving = true;
		try {
			return { url: pathToFileURL(require18.resolve(specifier)).href, format: 'commonjs', shortCircuit: true };
		} finally {
			resolving = false;
		}
	},
});
