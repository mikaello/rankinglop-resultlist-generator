# rankinglop-resultlist-generator

A command-line tool **and library** that converts an IOF 3.0 XML result list
(as exported by Otime) into a self-contained HTML page
with modern, responsive styling.
Built for the [GeoForm Rankingløp](https://ilgeoform.no) series.

## Web app

A browser-based version is available at
<https://mikaello.github.io/rankinglop-resultlist-generator/>.
Upload an IOF 3.0 XML file, fill in optional event metadata, and download the
generated HTML — no installation required.

## Requirements

Node.js 22.18.0 or later (runs TypeScript files natively — no compilation step
needed for local development).

## Installation

### As a global CLI

```bash
npm install -g rankinglop-resultlist-generator
rankinglop --input result.xml --output result.html
```

### In a project

```bash
npm install rankinglop-resultlist-generator
```

### For local development

```bash
npm install
```

## CLI usage

```bash
node src/cli.ts \
  --input result.xml \
  [--config event.json] \
  [--output result.html]
```

If `--output` is omitted the HTML is written to stdout, so you can pipe it:

```bash
node src/cli.ts --input result.xml > result.html
```

When installed globally via npm:

```bash
rankinglop --input result.xml --output result.html
```

### Options

| Flag | Description |
|------|-------------|
| `--input <file.xml>` | IOF 3.0 XML result list (**required**) |
| `--config <file.json>` | Event metadata JSON (see below) |
| `--output <file.html>` | Output path (default: stdout) |

### Event metadata (`--config`)

```json
{
  "title": "Rankingløp 1 - 2024",
  "isoDate": "2024-05-08",
  "place": "Østmarksetra",
  "map": "Solbergvann",
  "organiserClub": "IL GeoForm",
  "organiserPersons": ["Ola Nordmann"],
  "rentalDevices": 8,
  "yearDistribution": {
    "adults": 80,
    "oldTeenager": 3,
    "youngTeenager": 2,
    "child": 3
  }
}
```

All fields are optional and fall back to sensible defaults or values from the
XML itself.

## Programmatic API

The package exposes a browser- and Node.js-compatible API:

```ts
import {
  parseIofXmlContent,
  createResultListHtml,
  type ResultList,
  type ResultListOptions,
} from "rankinglop-resultlist-generator";

// 1. Parse an IOF 3.0 XML string into a typed model
const resultList: ResultList = parseIofXmlContent(xmlString);

// 2. Generate the HTML, providing the Pico CSS string yourself
//    (load it however is right for your environment)
const html: string = createResultListHtml(resultList, options, picoCSS);
```

`parseIofXmlContent(xmlString: string): ResultList`
: Parse an IOF 3.0 XML result list from a string.
  No file-system access — works in Node.js and browsers.

`createResultListHtml(resultList, options, picoCSS): string`
: Generate a complete self-contained HTML document with the Rankingløp-specific
  header (club distribution, year distribution, kontingent, leiebrikker).
  `picoCSS` is the content of `@picocss/pico/css/pico.classless.min.css` as a
  string.
  In Node.js you can `readFileSync` it; in a Vite project use a `?inline` import.

`createGenericResultListHtml(resultList, options, picoCSS): string`
: Same signature, but emits a minimal generic event header (title, date, place,
  map, organiser) instead of the Rankingløp-specific one.
  Intended for reuse from other applications that want a clean result list
  preview without the GeoForm-specific reporting fields.

### Node.js convenience wrapper

If you don't want to manage the CSS yourself, the Node.js-only
`createResultListDocument` reads Pico CSS from the installed package
automatically:

```ts
import { createResultListDocument } from "rankinglop-resultlist-generator/node";
// or via the full path:
import { createResultListDocument } from "rankinglop-resultlist-generator/src/generateResultList.ts";
```

## npm scripts

| Script | Description |
|--------|-------------|
| `npm start` | Run the CLI (add arguments after `--`) |
| `npm run build` | Compile TypeScript to `dist/` with tsup |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm run lint` | Lint and format with Biome |
| `npm test` | Run all tests with `node:test` |

## Output

The generated HTML is a single self-contained file with no external requests:

- **Pico CSS** (classless flavour) is embedded inline in `<style>`.
- A `<nav>` at the top links to each class section and its split-time table.
- Each orienteering class gets a `<section>` with a results `<table>`.
- Columns: Plass · Navn · Klubb · Tid · Diff · km-tid.
- Non-finishers (DNS, DNF, DSQ, OVT, feilst, NC) are shown at the bottom of
  each table in a muted style.
- A second table per class shows leg split times and accumulated times.
- Best split per control highlighted red, second-best highlighted blue.

## Development

```bash
# Type-check
npm run typecheck

# Build dist/
npm run build

# Lint / format
npm run lint

# Run tests
npm test
```

## License

GPL-3.0 — see [LICENSE](LICENSE).

