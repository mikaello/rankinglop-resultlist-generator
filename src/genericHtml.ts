import {
	BODY_CUSTOM_CSS,
	createResultListNav,
	createResultListSections,
} from "./body.ts";
import { escapeHtml } from "./escapeHtml.ts";
import { createGenericHeader } from "./genericHeader.ts";
import type { ResultList } from "./model.ts";
import type { ResultListOptions } from "./options.ts";
import { parseIofXmlContent } from "./parseIofXmlContent.ts";

/**
 * Generate a complete self-contained HTML result list document with a
 * minimal, generic event header.
 *
 * Unlike createResultListHtml, this entry point omits the Rankingløp-specific
 * sections (club distribution, year distribution, kontingent, leiebrikker).
 * It is intended for general IOF result list rendering and reuse from other
 * applications that just want a clean result list preview.
 *
 * @param resultList - Parsed IOF result list model
 * @param options    - Optional event metadata; only title/date/place/map/organiser are used
 * @param picoCSS    - Pico CSS classless stylesheet as a string (embedded inline)
 */
export const createGenericResultListHtml = (
	resultList: ResultList,
	options: ResultListOptions,
	picoCSS: string,
): string => {
	const title = escapeHtml(
		options.title ?? resultList.event?.name ?? "Resultatliste",
	);

	const headerHtml = createGenericHeader(resultList, options);
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
  ${headerHtml}
  ${navHtml}
  <main>
    ${sectionsHtml}
  </main>
</body>
</html>`;
};

/**
 * Generate a generic result list HTML document directly from an IOF 3.0 XML
 * string. Parses the XML with parseIofXmlContent and delegates to
 * createGenericResultListHtml.
 *
 * This is the recommended entry point for consumers whose contract with this
 * library is "IOF XML in, HTML out" — for example, an editor that exports
 * IOF XML and wants to render that exact same XML as a verification step.
 */
export const createGenericResultListHtmlFromXml = (
	xmlString: string,
	options: ResultListOptions,
	picoCSS: string,
): string =>
	createGenericResultListHtml(parseIofXmlContent(xmlString), options, picoCSS);
