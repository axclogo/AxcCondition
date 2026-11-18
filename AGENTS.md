# AGENTS.md

Rules for anyone (human or AI) changing this repository. Every rule in the first table is enforced by a
command; if you cannot make the command pass, stop and report instead of working around it.

## Before you finish

```sh
npm run verify   # format, types, boundaries, lint, knip, tests on React 19 (+coverage gate) and 18, build, API report, size
```

All of it must pass. CI runs the same command plus the release gate.

## Enforced rules

| Rule                                                                                                                                             | Enforced by                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `src/core` imports nothing outside `src/core`: no React, DOM or packages                                                                         | `scripts/check-boundaries.mjs` (`npm run check`)                                      |
| No production `dependencies`; `react` is the only peer                                                                                           | `check-boundaries.mjs`                                                                |
| `<input> <select> <textarea> <button> <option> <form>` only in `src/ui`; elsewhere use `src/ui/controls`                                         | `check-boundaries.mjs`                                                                |
| Code outside `src/ui` imports only `ui/controls`, `ui/types`, `ui/provider`                                                                      | `check-boundaries.mjs`                                                                |
| Every `<button>` has a literal `type="button"`                                                                                                   | `check-boundaries.mjs`                                                                |
| No hard-coded UI text: no JSX text with letters, no literal `label`/`placeholder`/`title`/`aria-label`/`alt`, no CJK outside `src/core/locales/` | `check-boundaries.mjs`                                                                |
| No `any`, no `@ts-ignore`, no double casts in `src/`, no `console` in `src/`, no floating promises, hooks rules                                  | ESLint (`eslint.config.js`); inline `eslint-disable` has no effect (`noInlineConfig`) |
| No unused files, exports or dependencies                                                                                                         | knip (`npm run check`)                                                                |
| Strict TypeScript, no unused locals/parameters                                                                                                   | `tsc --noEmit`                                                                        |
| Formatting                                                                                                                                       | Prettier (`npm run format:check`)                                                     |
| Line ≥ 98 %, branch ≥ 95 %, function ≥ 93 % coverage of `src/`                                                                                   | `npm run test:react19`                                                                |
| Works on React 18 and 19                                                                                                                         | `npm test` runs every test on both                                                    |
| Public API changes are explicit                                                                                                                  | `api/*.api.md` reports; `npm run api:check` fails on drift. Update with `npm run api` |
| Protocol behaviour is frozen: issue codes, their order, and the issues returned for each fixture                                                 | `protocol/*.json` + `tests/protocol.test.ts`                                          |
| Every issue code is covered by a fixture and has text in every locale                                                                            | `tests/protocol.test.ts`, `tests/i18n.test.tsx`                                       |
| Published bundle stays small                                                                                                                     | `scripts/check-size.mjs` (`npm run size`)                                             |
| `src/` or `protocol/` changes need a CHANGELOG entry; API or issue-code changes need a version bump                                              | `scripts/check-release.mjs` (CI)                                                      |

Changing a rule means changing its enforcement (script, config, fixture or threshold) in the same change, with
a reason in the commit message. Do not lower a threshold or budget to make a change pass.

## Design rules (checked in review)

These cannot be fully automated; keep them short and follow them literally.

- Do not repair caller mistakes. Wrong input is reported as an issue (data) or thrown as `TypeError` (configuration).
  No coercion ("1" → 1), no splitting strings into arrays, no silent defaults for invalid values.
- Validation returns every issue as `{ code, path, params }`. New failure kinds need a new code, a fixture, and
  messages in every locale; never branch on message text.
- No new abstraction, option or dependency without a real use case in this repository.
- The protocol carries no editor state (no node IDs). Editor-only state stays in `src/internal`.
- Public functions have English JSDoc stating semantics and failure conditions.

## Where things live

```text
src/core/        protocol: types, operators, validation, schemas, prompts, locales (no dependencies)
src/ui/          control contracts, provider, native controls
src/internal/    editor helpers shared by components
src/components/  the four public components
protocol/        frozen protocol fixtures and issue codes
api/             public API reports (generated by `npm run api`)
tests/           node:test + Testing Library + happy-dom; tests/react18 holds the React 18 runtime
```
