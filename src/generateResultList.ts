import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createResultListHtml } from "./html.ts";
import type { ResultList } from "./model.ts";
import type { ResultListOptions } from "./options.ts";

export { createResultListHtml } from "./html.ts";

const _require = createRequire(import.meta.url);
const picoCSS = readFileSync(
	_require.resolve("@picocss/pico/css/pico.classless.min.css"),
	"utf8",
);

/**
 * Convenience wrapper for Node.js: loads Pico CSS from the installed package
 * and delegates to createResultListHtml.
 */
export const createResultListDocument = (
	resultList: ResultList,
	options: ResultListOptions,
): string => createResultListHtml(resultList, options, picoCSS);
