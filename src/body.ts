import { escapeHtml } from "./escapeHtml.ts";
import type { ClassResult, ResultList, ResultStatus } from "./model.ts";
import {
	formatKmTime,
	formatTime,
	formatTimeBehind,
	getClassName,
	getCourseLengthKm,
	getName,
	getOrganisationName,
} from "./modelHelpers.ts";

export const BODY_CUSTOM_CSS = `
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
  .second-split { color: #3366ff; font-weight: bold; }
  .splits-cumul-row td { color: var(--pico-muted-color, #666); font-style: italic; font-size: 0.85em; }
  .splits-cumul-row td.best-split { color: #c00; }
  .splits-cumul-row td.second-split { color: #3366ff; }
  .splits-table tbody + tbody { border-top: 1px solid var(--pico-table-border-color, #ccc); }
  .time-behind { color: var(--pico-muted-color, #666); font-size: 0.85em; }
`;

function statusLabel(status: ResultStatus | undefined): string {
	switch (status) {
		case "MissingPunch":
			return "feilst";
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
	const lengthKm = getCourseLengthKm(classResult);
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
			const kmTid =
				result?.time !== undefined
					? escapeHtml(formatKmTime(result.time, lengthKm))
					: "–";
			finishers.push(
				`<tr><td>${pos}</td><td>${name}</td><td>${club}</td><td>${time}</td><td>${behind}</td><td>${kmTid}</td></tr>`,
			);
		} else {
			const cssClass = statusCssClass(status);
			const label = escapeHtml(statusLabel(status));
			const time =
				result?.time !== undefined ? escapeHtml(formatTime(result.time)) : "–";
			nonFinishers.push(
				`<tr class="${cssClass}"><td>${label}</td><td>${name}</td><td>${club}</td><td>${time}</td><td>–</td><td>–</td></tr>`,
			);
		}
	}

	return [...finishers, ...nonFinishers].join("\n");
}

function splitLegLabel(i: number, n: number): string {
	if (i === 0) return "S-1";
	if (i === n - 1) return `${i}-M`;
	return `${i}-${i + 1}`;
}

function createSplitTimesTable(
	classResult: ClassResult,
	sectionId: string,
): string {
	const allPersonResults = classResult.personResult ?? [];
	const okResults = allPersonResults.filter(
		(pr) => !pr.result?.[0]?.status || pr.result[0].status === "OK",
	);
	const nonOkWithSplits = allPersonResults.filter(
		(pr) =>
			pr.result?.[0]?.status &&
			pr.result[0].status !== "OK" &&
			(pr.result[0].splitTime?.length ?? 0) > 0,
	);

	if (okResults.length === 0 && nonOkWithSplits.length === 0) return "";

	const firstWithSplits =
		okResults.find((pr) => (pr.result?.[0]?.splitTime?.length ?? 0) > 0) ??
		nonOkWithSplits[0];
	if (!firstWithSplits) return "";

	const controlCodes =
		firstWithSplits.result?.[0]?.splitTime?.map((st) => st.controlCode ?? "") ??
		[];
	// n = number of legs: one per intermediate control + one finish leg (last control → Mål)
	const n = controlCodes.length + 1;

	// Compute leg times and cumulative times for all runners (OK first, non-OK at bottom).
	const allPersonData = [...okResults, ...nonOkWithSplits].map((pr) => {
		const result = pr.result?.[0];
		const splitTimes = result?.splitTime ?? [];
		const timeByCode = new Map(
			splitTimes.map((st) => [st.controlCode ?? "", st.time]),
		);
		const cumulTimes: (number | undefined)[] = controlCodes.map((code) =>
			timeByCode.get(code),
		);
		const legTimes: (number | undefined)[] = controlCodes.map((code, i) => {
			const cumulative = timeByCode.get(code);
			if (cumulative === undefined) return undefined;
			const prevCode = i > 0 ? controlCodes[i - 1] : undefined;
			const prevCumulative =
				prevCode !== undefined ? (timeByCode.get(prevCode) ?? 0) : 0;
			return cumulative - prevCumulative;
		});
		// Finish leg: total time minus last intermediate cumulative
		const lastCumul = cumulTimes[n - 2];
		const finishTime = result?.time;
		legTimes.push(
			finishTime !== undefined && lastCumul !== undefined
				? finishTime - lastCumul
				: undefined,
		);
		cumulTimes.push(finishTime);
		const statusStr =
			result?.status && result.status !== "OK"
				? statusLabel(result.status)
				: undefined;
		return { pr, result, legTimes, cumulTimes, statusStr };
	});

	// Best and second-best leg time per column (0..n-1)
	const bestLegTime: number[] = Array.from({ length: n }, (_, colIdx) => {
		let best = Number.POSITIVE_INFINITY;
		for (const { legTimes } of allPersonData) {
			const t = legTimes[colIdx];
			if (t !== undefined && t < best) best = t;
		}
		return best;
	});

	const secondBestLegTime: number[] = Array.from({ length: n }, (_, colIdx) => {
		let second = Number.POSITIVE_INFINITY;
		const best = bestLegTime[colIdx];
		for (const { legTimes } of allPersonData) {
			const t = legTimes[colIdx];
			if (t !== undefined && t > best && t < second) second = t;
		}
		return second;
	});

	// Best and second-best cumulative time per column (0..n-1)
	const bestCumulTime: number[] = Array.from({ length: n }, (_, colIdx) => {
		let best = Number.POSITIVE_INFINITY;
		for (const { cumulTimes } of allPersonData) {
			const t = cumulTimes[colIdx];
			if (t !== undefined && t < best) best = t;
		}
		return best;
	});

	const secondBestCumulTime: number[] = Array.from(
		{ length: n },
		(_, colIdx) => {
			let second = Number.POSITIVE_INFINITY;
			const best = bestCumulTime[colIdx];
			for (const { cumulTimes } of allPersonData) {
				const t = cumulTimes[colIdx];
				if (t !== undefined && t > best && t < second) second = t;
			}
			return second;
		},
	);

	// Header: intermediate controls include code in parens; finish leg has no code
	const headerCells = [
		...controlCodes.map(
			(code, i) =>
				`<th>${escapeHtml(splitLegLabel(i, n))} (${escapeHtml(code)})</th>`,
		),
		`<th>${escapeHtml(splitLegLabel(n - 1, n))}</th>`,
	].join("");

	const tbodies = allPersonData
		.map(({ pr, result, legTimes, cumulTimes, statusStr }) => {
			const name = escapeHtml(getName(pr.person));
			const pos = statusStr ?? String(result?.position ?? "–");
			const totalTime =
				result?.time !== undefined ? escapeHtml(formatTime(result.time)) : "–";
			const diffStr =
				result?.timeBehind !== undefined && result.timeBehind > 0
					? `<br><span class="time-behind">${escapeHtml(formatTimeBehind(result.timeBehind))}</span>`
					: "";

			const legCells = Array.from({ length: n }, (_, i) => {
				const legTime = legTimes[i];
				if (legTime === undefined) return "<td>–</td>";
				const isBest = legTime === bestLegTime[i];
				const isSecond = !isBest && legTime === secondBestLegTime[i];
				const attr = isBest
					? ' class="best-split"'
					: isSecond
						? ' class="second-split"'
						: "";
				return `<td${attr}>${escapeHtml(formatTime(legTime))}</td>`;
			}).join("");

			const cumulCells = Array.from({ length: n }, (_, i) => {
				const t = cumulTimes[i];
				if (t === undefined) return "<td>–</td>";
				const isBest = t === bestCumulTime[i];
				const isSecond = !isBest && t === secondBestCumulTime[i];
				const attr = isBest
					? ' class="best-split"'
					: isSecond
						? ' class="second-split"'
						: "";
				return `<td${attr}>${escapeHtml(formatTime(t))}</td>`;
			}).join("");

			return `<tbody>
            <tr><td rowspan="2">${pos}</td><td rowspan="2">${name}</td>${legCells}<td rowspan="2">${totalTime}${diffStr}</td></tr>
            <tr class="splits-cumul-row">${cumulCells}</tr>
          </tbody>`;
		})
		.join("\n");

	return `
  <section id="${sectionId}">
    <h3>Strekktider ${escapeHtml(getClassName(classResult))}</h3>
    <div style="overflow-x: auto;">
      <table class="splits-table">
        <thead>
          <tr><th rowspan="2">Plass</th><th rowspan="2">Navn</th>${headerCells}<th rowspan="2">Totaltid</th></tr>
          <tr><td colspan="${n}" style="text-align:center;font-size:0.8em;color:var(--pico-muted-color,#888)">↑ Strekktid · ↓ Akkumulert</td></tr>
        </thead>
        ${tbodies}
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
        <tr><th>Plass</th><th>Navn</th><th>Klubb</th><th>Tid</th><th>Diff</th><th>km-tid</th></tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </section>
  ${splitsTable}`;
}

/**
 * Render the navigation element linking to each class section and its split times.
 * Anchors match the section IDs produced by createResultListSections.
 */
export const createResultListNav = (resultList: ResultList): string => {
	const navLinks = (resultList.classResult ?? [])
		.map((cr, i) => {
			const name = escapeHtml(getClassName(cr));
			const count = cr.personResult?.length ?? 0;
			return `<li><a href="#class-${i}">${name} (${count})</a></li>
        <li><a href="#splits-${i}">${name} strekktider</a></li>`;
		})
		.join("\n        ");

	return `
  <nav>
    <ul>
      ${navLinks}
    </ul>
  </nav>`;
};

/**
 * Render the body sections (class result tables + split time tables) for all classes.
 * Does not include the surrounding <main>, navigation, or document header.
 */
export const createResultListSections = (resultList: ResultList): string =>
	(resultList.classResult ?? [])
		.map((cr, i) => createClassSection(cr, i))
		.join("\n");
