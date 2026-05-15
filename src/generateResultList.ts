import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createGenericResultListHtml } from "./genericHtml.ts";
import { createResultListHtml } from "./html.ts";
import type { ResultList } from "./model.ts";
import type { ResultListOptions } from "./options.ts";

export { createGenericResultListHtml } from "./genericHtml.ts";
export { createResultListHtml } from "./html.ts";

const _require = createRequire(import.meta.url);
const picoCSS = readFileSync(
	_require.resolve("@picocss/pico/css/pico.classless.min.css"),
	"utf8",
);

/**
 * Convenience wrapper for Node.js: loads Pico CSS from the installed package
 * and delegates to createResultListHtml (Rankingløp-flavoured header).
 */
export const createResultListDocument = (
	resultList: ResultList,
	options: ResultListOptions,
): string => createResultListHtml(resultList, options, picoCSS);

/**
 * Convenience wrapper for Node.js: loads Pico CSS from the installed package
 * and delegates to createGenericResultListHtml (minimal generic header).
 */
export const createGenericResultListDocument = (
	resultList: ResultList,
	options: ResultListOptions,
): string => createGenericResultListHtml(resultList, options, picoCSS);
