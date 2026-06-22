# DateFlow — Claude Code guide

Lightweight vanilla TypeScript date/range picker for the web. No framework. Peer deps: `date-fns`, `@floating-ui/dom`.

## Commands

```bash
pnpm install
pnpm dev            # docs showcase (local)
pnpm build          # library → dist/
pnpm build:docs     # static docs site → dist-docs/
pnpm test           # unit tests (Vitest + jsdom)
pnpm check          # format, lint, types (vite-plus)
```

Before considering work done, run **`pnpm check`**, **`pnpm test`**, and **`pnpm build`**.

## Architecture

```
dateFlow (entry)
  → resolveInputs (selector / element resolution)
  → buildCalendarPicker (orchestrator — state, options, wiring)
      → render/     grid, month/year, weekdays, range presets panel
      → dom/        createElements, customSelect, floatingList
      → popover     Floating UI positioning
      → input/      typed input controller
      → time/       hour/minute/second selectors
      → utils/      dates, filters, format, locale, viewport
      → navigation, setDate, range/
```

- **Public API** lives in `src/calendar/index.ts` and `src/calendar/types/`.
- **Locales** are a separate entry: `src/calendar/locales/` (tree-shakeable).
- **`buildCalendarPicker.ts`** is the orchestrator (~1200 lines). Extend it in place; only extract modules when explicitly asked.
- **Styles** stay in `src/calendar/calendar.css` (`cal__*` classes, `data-cal-*` attributes).

## Conventions

- **Imports:** `@/` for cross-module imports under `src/`; relative imports for siblings in the same folder.
- **Types:** `verbatimModuleSyntax` is on — use `import type` for type-only imports.
- **Date math/formatting:** use `date-fns` and existing helpers in `utils/`; don't roll custom date logic.
- **CSS:** add to `calendar.css`; don't split or restructure styles without asking.
- **Peer deps:** never bundle `date-fns` or `@floating-ui/dom` (configured in `vite.config.ts` `pack.deps.neverBundle`).

## Adding features

When implementing a user-visible feature, update:

1. `src/calendar/` + matching tests in `test/calendar/`
2. `docs/showcase` (if the feature is demonstrable)
3. `README.md` (if new public options or API surface)

Extend `CalendarOptions` / instance methods moderately — new options should fit existing patterns. Breaking API changes need semver care.

## Testing

Match existing style in `test/calendar/`. Use helpers from `test/calendar/helpers.ts` (`createInput`, `clickDay`, `findDayButton`, etc.).

- **Utils/helpers:** unit test every new one.
- **UI behavior:** DOM/behavior tests (Vitest + jsdom).
- **Grid / keyboard / nav:** keyboard and a11y tests (see `gridKeyboard.test.ts`).

Write meaningful tests only — no trivial assertions.

## Accessibility

- **North star:** [WAI-ARIA APG date picker patterns](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/).
- **In practice:** match existing markup in `dom/createElements.ts` and keyboard behavior in `render/gridKeyboard.ts`.

Accessibility is non-negotiable on UI changes.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `test:`, `docs:`, etc.

---

## Hard rules

| Always                                       | Never                                        |
| -------------------------------------------- | -------------------------------------------- |
| Vanilla TypeScript + DOM                     | Add React, Vue, or any UI framework          |
| Keep peer deps external                      | Bundle `date-fns` or `@floating-ui/dom`      |
| Keep bundle size lean                        | Add runtime dependencies without asking      |
| Preserve a11y on UI changes                  | Break keyboard nav or ARIA semantics         |
| Treat public API changes as semver-sensitive | Ship breaking API changes without discussion |

**Ask before:**

- Adding new dependencies (runtime or dev)
- Breaking public API changes
- Publishing / version bumps

**Do not** refactor or split `buildCalendarPicker.ts` unless the task requires it or you are explicitly asked.
