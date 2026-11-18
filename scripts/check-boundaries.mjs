// Enforces the package's architectural rules on real source (TypeScript AST, not regexes over text):
// 1. src/core imports nothing outside src/core (no React, no DOM libraries).
// 2. Runtime code imports only React; no production dependencies, React is the only peer.
// 3. Native form elements (input/select/textarea/button/option/form) appear only in src/ui.
// 4. Outside src/ui, code reaches controls only through ui/controls, ui/types and ui/provider.
// 5. Every <button> in src/ui has a literal type="button".
// 6. No hard-coded UI text: no JSX text with letters, no string-literal label/placeholder/title/aria-label/alt,
//    and no CJK characters outside src/core/locales/.
import ts from 'typescript';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const walk = (dir) =>
	readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
		entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
	);
const NATIVE = ['input', 'select', 'textarea', 'button', 'option', 'form'];
const TEXT_ATTRIBUTES = ['label', 'placeholder', 'title', 'aria-label', 'alt'];
const UI_ENTRIES = ['src/ui/controls.tsx', 'src/ui/types.ts', 'src/ui/provider.tsx'];
const CJK = /[\u3000-\u303f\u3400-\u9fff\uff00-\uffef]/;
const failures = [];

for (const file of walk('src').filter((name) => /\.[jt]sx?$/.test(name))) {
	const text = readFileSync(file, 'utf8');
	const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
	const core = file.startsWith('src/core/');
	const ui = file.startsWith('src/ui/');
	const fail = (node, message) => {
		const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
		failures.push(`${file}:${line + 1}: ${message}`);
	};
	if (!file.startsWith('src/core/locales/') && CJK.test(text))
		failures.push(`${file}: CJK text belongs in src/core/locales/`);
	const visit = (node) => {
		if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
			const tag = node.tagName.getText(source);
			if (NATIVE.includes(tag) && !ui) fail(node, `<${tag}> must be rendered through the UI adapter (src/ui/controls)`);
			if (tag === 'button') {
				const type = node.attributes.properties.find(
					(attr) => ts.isJsxAttribute(attr) && attr.name.getText(source) === 'type',
				);
				if (!type || !type.initializer || !ts.isStringLiteral(type.initializer) || type.initializer.text !== 'button')
					fail(node, '<button> needs a literal type="button" so it never submits a host form');
			}
		}
		if (ts.isJsxText(node) && /\p{L}/u.test(node.text))
			fail(node, `hard-coded text "${node.text.trim()}"; use the locale`);
		if (
			ts.isJsxAttribute(node) &&
			TEXT_ATTRIBUTES.includes(node.name.getText(source)) &&
			node.initializer &&
			ts.isStringLiteral(node.initializer)
		)
			fail(node, `hard-coded ${node.name.getText(source)}="${node.initializer.text}"; use the locale`);
		let specifier;
		if (
			(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
			node.moduleSpecifier &&
			ts.isStringLiteral(node.moduleSpecifier)
		)
			specifier = node.moduleSpecifier.text;
		if (
			ts.isCallExpression(node) &&
			node.expression.kind === ts.SyntaxKind.ImportKeyword &&
			ts.isStringLiteral(node.arguments[0])
		)
			specifier = node.arguments[0].text;
		if (specifier) {
			if (!specifier.startsWith('.')) {
				if (core || !['react', 'react/jsx-runtime'].includes(specifier))
					fail(node, `dependency not allowed: ${specifier}`);
			} else {
				const target = path.normalize(path.join(path.dirname(file), specifier)).replace(/\.js$/, '');
				if (!target.startsWith('src/')) fail(node, `import escapes src/: ${specifier}`);
				if (core && !target.startsWith('src/core/')) fail(node, `src/core must not import ${specifier}`);
				if (!ui && target.startsWith('src/ui/') && !UI_ENTRIES.some((entry) => entry.replace(/\.tsx?$/, '') === target))
					fail(node, `import controls through src/ui/controls, types or provider, not ${specifier}`);
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(source);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (Object.keys(pkg.dependencies ?? {}).length) failures.push('package.json: dependencies must be empty');
if (Object.keys(pkg.peerDependencies ?? {}).some((name) => name !== 'react'))
	failures.push('package.json: react is the only allowed peerDependency');

if (failures.length) {
	console.error(failures.join('\n'));
	process.exitCode = 1;
} else
	console.log(
		'Boundaries OK: core has no dependencies, UI uses only React, controls go through src/ui, no hard-coded text.',
	);
