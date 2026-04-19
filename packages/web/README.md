# rankinglop-resultlist-generator — web app

Browser-based frontend for the result list generator.
No installation required — visit the live site:
<https://mikaello.github.io/rankinglop-resultlist-generator/>

## What it does

Upload an IOF 3.0 XML result list (as exported by Otime), fill in optional event
metadata, and download a self-contained HTML result page.
All processing happens client-side; no data is sent to a server.

## Development

```bash
# From repo root — build the core package first
npm ci && npm run build

# Then in this directory
npm ci
npm run dev
```

The Vite dev server aliases `@core` to `../../src` so changes to the core
library are picked up immediately without a rebuild step.
