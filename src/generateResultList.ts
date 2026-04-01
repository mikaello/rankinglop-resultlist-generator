import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { escapeHtml } from "./escapeHtml.ts";
import { createResultListHeader } from "./generateResultListHeader.ts";
import type { ClassResult, ResultList, ResultStatus } from "./model.ts";
import {
	formatTime,
	formatTimeBehind,
	getClassName,
	getCourseLengthKm,
	getName,
	getOrganisationName,
} from "./modelHelpers.ts";
import type { ResultListOptions } from "./options.ts";

const _require = createRequire(import.meta.url);
const picoCSS = readFileSync(
	_require.resolve("@picocss/pico/css/pico.classless.min.css"),
	"utf8",
);

const CUSTOM_CSS = `
  body { max-width: 960px; margin: 0 auto; padding: 0 1rem; }
  header dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.25rem 1rem; }
  header dt { font-weight: bold; white-space: nowrap; }
  nav ul { display: flex; flex-wrap: wrap; gap: 0.5rem; list-style: none; padding: 0; }
  nav ul li a { font-size: 0.9em; }
  table { width: 100%; font-size: 0.9em; }
  td, th { padding: 0.3rem 0.5rem; }
  .status-dnf, .status-dns, .status-dsq, .status-ovt, .status-nc { color: var(--pico-muted-color, #888); }
  .splits-table th, .splits-table td { font-size: 0.8em; white-space: nowrap; }
  .best-split { color: #c00; font-weight: bold; }
`;

function statusLabel(status: ResultStatus | undefined): string {
	switch (status) {
		case "MissingPunch":
			return "OVT";
		case "Disqualified":
			return "DSQ";
		case "DidNotFinish":
			return "DNF";
		case "OverTime":
			return "OVT";
		case "SportingWithdrawal":
			return "Disk";
		case "NotCompeting":
			return "NC";
		case "DidNotStart":
		case "DidNotEnter":
			return "DNS";
		case "Cancelled":
			return "Disk";
		default:
			return status ?? "–";
	}
}

function statusCssClass(status: ResultStatus | undefined): string {
	switch (status) {
		case "MissingPunch":
		case "OverTime":
			return "status-ovt";
		case "Disqualified":
		case "SportingWithdrawal":
		case "Cancelled":
			return "status-dsq";
		case "DidNotFinish":
			return "status-dnf";
		case "NotCompeting":
			return "status-nc";
		case "DidNotStart":
		case "DidNotEnter":
			return "status-dns";
		default:
			return "";
	}
}

function createClassResultRows(classResult: ClassResult): string {
	const finishers: string[] = [];
	const nonFinishers: string[] = [];

	for (const pr of classResult.personResult ?? []) {
		const result = pr.result?.[0];
		const name = escapeHtml(getName(pr.person));
		const club = escapeHtml(getOrganisationName(pr.organisation));
		const status = result?.status;

		if (!status || status === "OK") {
			const pos = result?.position ?? "–";
			const time =
				result?.time !== undefined ? escapeHtml(formatTime(result.time)) : "–";
			const behind =
				result?.timeBehind !== undefined
					? escapeHtml(formatTimeBehind(result.timeBehind))
					: "";
			finishers.push(
				`<tr><td>${pos}</td><td>${name}</td><td>${club}</td><td>${time}</td><td>${behind}</td></tr>`,
			);
		} else {
			const cssClass = statusCssClass(status);
			const label = escapeHtml(statusLabel(status));
			const time =
				result?.time !== undefined ? escapeHtml(formatTime(result.time)) : "–";
			nonFinishers.push(
				`<tr class="${cssClass}"><td>${label}</td><td>${name}</td><td>${club}</td><td>${time}</td><td>–</td></tr>`,
			);
		}
	}

	return [...finishers, ...nonFinishers].join("\n");
}

function createSplitTimesTable(
	classResult: ClassResult,
	sectionId: string,
): string {
	const okResults = (classResult.personResult ?? []).filter(
		(pr) => !pr.result?.[0]?.status || pr.result[0].status === "OK",
	);

	if (okResults.length === 0) return "";

	// Collect control codes in order from the first finisher with split times
	const firstWithSplits = okResults.find(
		(pr) => (pr.result?.[0]?.splitTime?.length ?? 0) > 0,
	);
	if (!firstWithSplits) return "";

	const controlCodes =
		firstWithSplits.result?.[0]?.splitTime?.map((st) => st.controlCode ?? "") ??
		[];

	// Compute leg times for every finisher (undefined = missing split)
	const allLegTimes: (number | undefined)[][] = okResults.map((pr) => {
		const result = pr.result?.[0];
		const splitTimes = result?.splitTime ?? [];
		const timeByCode = new Map(
			splitTimes.map((st) => [st.controlCode ?? "", st.time]),
		);
		return controlCodes.map((code, i) => {
			const cumulative = timeByCode.get(code);
			if (cumulative === undefined) return undefined;
			const prevCode = i > 0 ? controlCodes[i - 1] : undefined;
			const prevCumulative =
				prevCode !== undefined ? (timeByCode.get(prevCode) ?? 0) : 0;
			return cumulative - prevCumulative;
		});
	});

	// Find the best (minimum) leg time per column
	const bestLegTime: number[] = controlCodes.map((_, colIdx) => {
		let best = Number.POSITIVE_INFINITY;
		for (const row of allLegTimes) {
			const t = row[colIdx];
			if (t !== undefined && t < best) best = t;
		}
		return best;
	});

	const headerCells = controlCodes
		.map((code) => `<th>${escapeHtml(code)}</th>`)
		.join("");

	const rows = okResults
		.map((pr, personIdx) => {
			const result = pr.result?.[0];
			const name = escapeHtml(getName(pr.person));
			const pos = result?.position ?? "–";

			const cells = controlCodes
				.map((_, i) => {
					const legTime = allLegTimes[personIdx][i];
					if (legTime === undefined) return "<td>–</td>";
					const isBest = legTime === bestLegTime[i];
					const attr = isBest ? ' class="best-split"' : "";
					return `<td${attr}>${escapeHtml(formatTime(legTime))}</td>`;
				})
				.join("");

			const totalTime =
				result?.time !== undefined ? escapeHtml(formatTime(result.time)) : "–";

			return `<tr><td>${pos}</td><td>${name}</td>${cells}<td>${totalTime}</td></tr>`;
		})
		.join("\n");

	const finishHeader = `<th>Totaltid</th>`;

	return `
  <section id="${sectionId}">
    <h3>Strekktider ${escapeHtml(getClassName(classResult))}</h3>
    <div style="overflow-x: auto;">
      <table class="splits-table">
        <thead>
          <tr><th>Plass</th><th>Navn</th>${headerCells}${finishHeader}</tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  </section>`;
}

function createClassSection(classResult: ClassResult, index: number): string {
	const className = escapeHtml(getClassName(classResult));
	const lengthKm = getCourseLengthKm(classResult);
	const rows = createClassResultRows(classResult);
	const splitsTable = createSplitTimesTable(classResult, `splits-${index}`);

	return `
  <section id="class-${index}">
    <h2>Resultater ${className} (${lengthKm} km)</h2>
    <table>
      <thead>
        <tr><th>Plass</th><th>Navn</th><th>Klubb</th><th>Tid</th><th>+Bak</th></tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </section>
  ${splitsTable}`;
}

export const createResultListDocument = (
	resultList: ResultList,
	options: ResultListOptions,
): string => {
	const title = escapeHtml(
		options.title ?? resultList.event?.name ?? "Rankingløp",
	);

	const headerHtml = createResultListHeader(options, resultList);

	const sectionsHtml = (resultList.classResult ?? [])
		.map((cr, i) => createClassSection(cr, i))
		.join("\n");

	return `<!DOCTYPE html>
<html lang="nb">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${picoCSS}</style>
  <style>${CUSTOM_CSS}</style>
</head>
<body>
  ${headerHtml}
  <main>
    ${sectionsHtml}
  </main>
</body>
</html>`;
};
