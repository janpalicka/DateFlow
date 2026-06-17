<p align="center">
  <img src="./assets/logo.png" alt="DateFlow — pick, select, flow" width="320" />
</p>

Lightweight date and date-range calendar picker for the web. Vanilla TypeScript, no framework required. Built-in popover positioning via [Floating UI](https://floating-ui.com/).

## Install

```bash
npm install dateflow date-fns @floating-ui/dom
```

`date-fns` and `@floating-ui/dom` are peer dependencies — install them in your app.

## Quick start

```html
<input id="trip" type="text" placeholder="Pick a date" />
```

```ts
import { dateFlow } from "dateflow";
import "dateflow/style.css";

const input = document.querySelector<HTMLInputElement>("#trip")!;

dateFlow(input, {
  value: new Date(),
  popover: true, // default — opens below the input
});
```

## Locales

Locales are a separate entry so you only pay for what you import:

```ts
import { dateFlow } from "dateflow";
import { de } from "dateflow/locales";
import "dateflow/style.css";

dateFlow(input, { locale: de });
```

Built-in locales: `en`, `de`, `cs`, `fr`. Pass a partial `CalendarLocale` object to override individual strings.

## Options

| Option                           | Description                                     |
| -------------------------------- | ----------------------------------------------- |
| `mode`                           | `"single"` (default) or `"range"`               |
| `value`                          | `Date` or `{ start, end }` for range mode       |
| `showTime`                       | Enable time selectors                           |
| `minuteStep`                     | Minute increment (default `5`)                  |
| `minDate` / `maxDate`            | Bounds                                          |
| `disabledDates` / `enabledDates` | Allow/deny lists                                |
| `inline`                         | Render calendar in-page instead of a popover    |
| `appendTo`                       | Popover mount target (default `document.body`)  |
| `locale`                         | Locale object from `dateflow/locales` or custom |
| `onChange`                       | Called when the committed value changes         |

See the [showcase](docs/index.html) in this repo for live examples.

## Development

```bash
pnpm install
pnpm dev          # docs showcase
pnpm build        # library → dist/
pnpm build:docs   # static docs site
pnpm check        # format, lint, types
```

## License

MIT
