# Contributing to DateFlow

Bug reports, fixes, and thoughtful feature suggestions are welcome.

## Reporting bugs

Open an issue and include:

- DateFlow version
- Minimal reproduction (CodeSandbox or inline snippet)
- Expected vs. actual behaviour
- Browser / OS if it looks rendering-related

## Suggesting features

Open an issue first so we can align on scope before any code is written. New options should fit existing patterns and keep the bundle lean.

## Pull requests

```bash
pnpm install
pnpm dev        # live showcase
pnpm test       # Vitest + jsdom
pnpm check      # format, lint, types
```

- Target `main`.
- One logical change per PR.
- New behaviour needs a matching test in `test/calendar/`.
- UI changes must preserve keyboard navigation and ARIA semantics.
- Follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, etc.
- Run `pnpm check && pnpm test && pnpm build` before pushing.

## Adding locales

Copy an existing locale from `src/calendar/locales/` as a starting point, export it from `src/calendar/locales/index.ts`, and add a smoke test.

## License

By contributing you agree that your changes will be released under the [MIT licence](./LICENSE).
