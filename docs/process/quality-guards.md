# Quality Guards

## Goal

Keep local commits fast, deterministic, and strict enough that normal `git commit` does not need `--no-verify`.

## Current Guards

- `.husky/pre-commit` runs staged-file formatting checks first, then a full TypeScript check.
- `lint-staged.config.mjs` converts staged paths to workspace-relative paths before invoking tools.
- Biome pre-commit formatting is limited to file types the repo toolchain actually supports: `ts`, `tsx`, `js`, `jsx`, and `json`.
- `scripts/check-file-length.js` enforces the 500-line limit for staged TypeScript source changes.

## Structural Rules

- Split oversized React files by responsibility instead of letting orchestration, layout, and transport logic accumulate in one file.
- Prefer extracting hooks for stateful controller logic and colocated subcomponents for large view trees.
- Exclude unsupported file types from automated format commands instead of forcing tools to run on paths they ignore.

## Maintenance Notes

- If a new formatter or linter is added, update `lint-staged.config.mjs` rather than growing shell one-liners in `package.json`.
- If a file repeatedly hits the length gate, refactor it before adding more exceptions.
- Avoid bypassing hooks unless the hook itself is broken; fix the hook chain first.
