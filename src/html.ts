import {
	BODY_CUSTOM_CSS,
	THEME_TOGGLE_SCRIPT,
	createResultListNav,
	createResultListSections,
} from "./body.ts";
import { escapeHtml } from "./escapeHtml.ts";
import { createResultListHeader } from "./generateResultListHeader.ts";
import type { ResultList } from "./model.ts";
import type { ResultListOptions } from "./options.ts";

/**
 * Generate a complete self-contained HTML result list document with the
 * Rankingløp-specific event header (club distribution, year distribution,
 * kontingent, leiebrikker, etc.).
 *
 * Browser and Node.js compatible — the caller supplies the Pico CSS string.
 *
 * @param resultList - Parsed IOF result list model
 * @param options    - Optional event metadata (title, date, organiser, etc.)
 * @param picoCSS    - Pico CSS classless stylesheet as a string (embedded inline)
 */
export const createResultListHtml = (
	resultList: ResultList,
	options: ResultListOptions,
	picoCSS: string,
): string => {
	const title = escapeHtml(
		options.title ?? resultList.event?.name ?? "Rankingløp",
	);

	const headerHtml = createResultListHeader(options, resultList);
	const navHtml = createResultListNav(resultList);
	const sectionsHtml = createResultListSections(resultList);

	return `<!DOCTYPE html>
<html lang="nb">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${picoCSS}</style>
  <style>${BODY_CUSTOM_CSS}</style>
</head>
<body>
  <button id="theme-toggle" aria-label="Bytt tema">🌙</button>
  ${headerHtml}
  ${navHtml}
  <main>
    ${sectionsHtml}
  </main>
  ${THEME_TOGGLE_SCRIPT}
</body>
</html>`;
};
