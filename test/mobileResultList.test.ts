import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { createGenericResultListHtml } from "../src/genericHtml.ts";
import { createResultListHtml } from "../src/html.ts";
import { parseIofXmlContent } from "../src/parseIofXmlContent.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const resultList = parseIofXmlContent(
	readFileSync(join(root, "src/resources/res2021-09-18.xml"), "utf8"),
);
const require = createRequire(import.meta.url);
const picoCSS = readFileSync(
	require.resolve("@picocss/pico/css/pico.classless.min.css"),
	"utf8",
);

describe("mobile result lists", () => {
	for (const [name, render] of [
		["Rankingløp", createResultListHtml],
		["generic", createGenericResultListHtml],
	] as const) {
		it(`${name}: defaults to a zoomable full-page layout`, () => {
			const html = render(resultList, {}, picoCSS);
			assert.doesNotMatch(html, /<meta name="viewport"/);
			assert.doesNotMatch(html, /<ul class="mobile-results">/);
			assert.match(html, /<table>/);
			assert.match(html, /class="splits-scroll"/);
		});

		it(`${name}: includes the compact results and scrollable splits when selected`, () => {
			const html = render(resultList, { responsive: true }, picoCSS);
			assert.match(html, /width=device-width, initial-scale=1/);
			assert.match(html, /<table class="results-table">/);
			assert.doesNotMatch(html, /results-scroll/);
			assert.match(html, /<ul class="mobile-results">/);
			assert.match(html, /Christian Vogelsang/);
			assert.match(html, /<dt>Diff<\/dt>/);
			assert.match(html, /Sveip sidelengs/);
			assert.match(html, /role="region" aria-label="Strekktider Lang"/);
		});
	}
});
