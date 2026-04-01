# rankinglop-resultlist-generator

A command-line tool that converts an IOF 3.0 XML result list (as exported by
[Otime](https://otime.no)) into a self-contained HTML page with modern,
responsive styling. Built for the
[GeoForm Rankingløp](https://www.ilgeoform.no) series.

## Requirements

Node.js 22.18.0 or later (runs TypeScript files natively — no compilation step
needed).

## Installation

```bash
npm install
```

## Usage

```bash
node src/index.ts \
  --input result.xml \
  [--config event.json] \
  [--output result.html]
```

If `--output` is omitted the HTML is written to stdout, so you can pipe it:

```bash
node src/index.ts --input result.xml > result.html
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

## npm scripts

| Script | Description |
|--------|-------------|
| `npm start` | Run the CLI (add arguments after `--`) |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm run lint` | Lint and format with Biome |
| `npm test` | Run all tests with `node:test` |

## Output

The generated HTML is a single self-contained file with no external requests:

- **Pico CSS** (classless flavour) is embedded inline in `<style>`.
- A `<nav>` at the top links to each class section and its split-time table.
- Each orienteering class gets a `<section>` with a results `<table>`.
- Non-finishers (DNS, DNF, DSQ, OVT, NC) are shown at the bottom of each
  table in a muted style.
- A second table per class shows individual leg times derived from the
  `<SplitTime>` elements in the XML.

## Development

```bash
# Type-check
npm run typecheck

# Lint / format
npm run lint

# Run tests
npm test
```

## License

GPL-3.0 — see [LICENSE](LICENSE).
