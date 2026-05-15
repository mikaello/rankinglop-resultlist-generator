import { escapeHtml } from "./escapeHtml.ts";
import type { ResultList } from "./model.ts";
import type { ResultListOptions } from "./options.ts";

/**
 * Render a minimal, generic event header.
 * Shows title, date, place, map, and organiser when available.
 * Unlike the Rankingløp header, it includes no club distribution,
 * year distribution, kontingent, or rental-device fields.
 */
export const createGenericHeader = (
	resultList: ResultList,
	options: ResultListOptions,
): string => {
	const title = escapeHtml(
		options.title ?? resultList.event?.name ?? "Resultatliste",
	);

	const isoDate = options.isoDate ?? resultList.event?.startTime?.date;
	const localeDate = isoDate
		? new Date(isoDate).toLocaleDateString("nb-NO", {
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: undefined;

	const rows: string[] = [];
	if (localeDate) {
		const place = options.place ? ` - ${escapeHtml(options.place)}` : "";
		rows.push(`<dt>Dato/sted</dt><dd>${escapeHtml(localeDate)}${place}</dd>`);
	} else if (options.place) {
		rows.push(`<dt>Sted</dt><dd>${escapeHtml(options.place)}</dd>`);
	}

	if (options.map) {
		rows.push(`<dt>Kart</dt><dd>${escapeHtml(options.map)}</dd>`);
	}

	if (options.organiserClub || options.organiserPersons?.length) {
		const club = escapeHtml(options.organiserClub ?? "");
		const persons = (options.organiserPersons ?? []).map(escapeHtml).join(", ");
		const arr = persons && club ? `${club} v/${persons}` : club || persons;
		rows.push(`<dt>Arr</dt><dd>${arr}</dd>`);
	}

	const dlBlock =
		rows.length > 0
			? `\n    <dl>\n      ${rows.join("\n      ")}\n    </dl>`
			: "";

	return `
  <header>
    <hgroup>
      <h1>${title}</h1>
    </hgroup>${dlBlock}
  </header>`;
};
