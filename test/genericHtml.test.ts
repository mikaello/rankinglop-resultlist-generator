import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
	createGenericResultListHtml,
	createGenericResultListHtmlFromXml,
} from "../src/genericHtml.ts";
import { parseIofXmlContent } from "../src/parseIofXmlContent.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const exampleXml = join(rootDir, "src", "resources", "res2021-09-18.xml");

const _require = createRequire(import.meta.url);
const picoCSS = readFileSync(
	_require.resolve("@picocss/pico/css/pico.classless.min.css"),
	"utf8",
);

function renderExample(options = {}): string {
	const xml = readFileSync(exampleXml, "utf8");
	const resultList = parseIofXmlContent(xml);
	return createGenericResultListHtml(resultList, options, picoCSS);
}

describe("createGenericResultListHtml", () => {
	it("produces a complete HTML document", () => {
		const html = renderExample();
		assert.ok(html.startsWith("<!DOCTYPE html>"));
		assert.ok(html.includes("<title>"));
		assert.ok(html.includes("</html>"));
	});

	it("includes class result sections and split times", () => {
		const html = renderExample();
		assert.ok(html.includes("Resultater Lang"));
		assert.ok(html.includes("Resultater Mellom"));
		assert.ok(html.includes("Resultater Kort"));
		assert.ok(html.includes("Strekktider"));
	});

	it("includes a navigation element with anchors", () => {
		const html = renderExample();
		assert.ok(html.includes("<nav>"));
		assert.ok(html.includes("#class-0"));
		assert.ok(html.includes("#splits-0"));
	});

	it("omits Rankingløp-specific header fields", () => {
		const html = renderExample();
		// These dt labels are part of the Rankingløp wrapper only.
		assert.ok(!html.includes("Startkont"), "should not include Startkont");
		assert.ok(!html.includes("Leiebrikker"), "should not include Leiebrikker");
		assert.ok(!html.includes("Løpsrapport"), "should not include Løpsrapport");
		assert.ok(!html.includes("Antall</dt>"), "should not include Antall");
	});

	it("uses options.title when provided", () => {
		const html = renderExample({ title: "Forhåndsvisning" });
		assert.ok(html.includes("<h1>Forhåndsvisning</h1>"));
	});

	it("escapes HTML in the title to prevent injection", () => {
		const html = renderExample({ title: "<script>alert(1)</script>" });
		assert.ok(!html.includes("<script>alert(1)</script>"));
		assert.ok(html.includes("&lt;script&gt;"));
	});
});

describe("createGenericResultListHtmlFromXml", () => {
	it("produces the same output as parseIofXmlContent + createGenericResultListHtml", () => {
		const xml = readFileSync(exampleXml, "utf8");
		const viaXml = createGenericResultListHtmlFromXml(xml, {}, picoCSS);
		const viaModel = createGenericResultListHtml(
			parseIofXmlContent(xml),
			{},
			picoCSS,
		);
		assert.equal(viaXml, viaModel);
	});

	it("renders class sections from an IOF XML string", () => {
		const xml = readFileSync(exampleXml, "utf8");
		const html = createGenericResultListHtmlFromXml(xml, {}, picoCSS);
		assert.ok(html.startsWith("<!DOCTYPE html>"));
		assert.ok(html.includes("Resultater Lang"));
		assert.ok(html.includes("Strekktider"));
	});
});
