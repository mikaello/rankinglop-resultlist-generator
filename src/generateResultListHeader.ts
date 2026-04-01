import { escapeHtml } from "./escapeHtml.ts";
import type { ResultList } from "./model.ts";
import { getClassName, getOrganisationName } from "./modelHelpers.ts";
import type { ResultListOptions, YearDistribution } from "./options.ts";

type ClubRegex = { clubName: string; clubRegex: RegExp };
type ClubParticipation = { clubName: string; count: number };

export const getClubDistribution = (
	clubs: ClubRegex[],
	resultList: ResultList,
): ClubParticipation[] => {
	const clubP = new Map(
		clubs.map((club) => [club.clubName, { clubName: club.clubName, count: 0 }]),
	);

	resultList.classResult?.forEach((classResult) => {
		classResult.personResult?.forEach((personResult) => {
			for (const c of clubs) {
				const org = getOrganisationName(personResult.organisation);
				if (org && c.clubRegex.test(org)) {
					const club = clubP.get(c.clubName);
					if (club) club.count++;
					break;
				}
			}
		});
	});

	return Array.from(clubP.values());
};

const getNumDiscountPrice = (
	yearDistribution: YearDistribution,
	clubDistribution: ClubParticipation[],
): number => {
	const discountClubs = clubDistribution.filter((club) =>
		/(DNV|GeoForm|OSI|Oslostudentenes)/i.test(club.clubName),
	);
	return (
		discountClubs.reduce((acc, curr) => acc + curr.count, 0) +
		(yearDistribution.child ?? 0) +
		(yearDistribution.youngTeenager ?? 0)
	);
};

const getNumPostInvoicing = (clubDistribution: ClubParticipation[]): number => {
	return clubDistribution.find((club) => club.clubName === "DNV")?.count ?? 0;
};

export const createResultListHeader = (
	options: ResultListOptions,
	resultList: ResultList,
): string => {
	const raceDate = options.isoDate ? new Date(options.isoDate) : new Date();
	const dateOptions: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "long",
		day: "numeric",
	};
	const localeRaceDate = raceDate.toLocaleDateString("nb-NO", dateOptions);

	const clubDistribution = getClubDistribution(
		[
			{ clubName: "GeoForm", clubRegex: /GeoForm/i },
			{ clubName: "OSI", clubRegex: /(OSI|Oslostudentene)/i },
			{ clubName: "DNV", clubRegex: /(DNV|ESSO|Veritas|VBIL)/i },
			{ clubName: "Andre", clubRegex: /.*/i },
		],
		resultList,
	);

	const totalParticipation = clubDistribution.reduce(
		(acc, curr) => acc + curr.count,
		0,
	);

	const distributionStr =
		clubDistribution.length > 0
			? `(${clubDistribution.map((d) => `${escapeHtml(d.clubName)}: ${d.count}`).join(", ")})`
			: "";

	const yearDistribution = options.yearDistribution
		? { ...options.yearDistribution }
		: {
				adults: totalParticipation,
				oldTeenager: 0,
				youngTeenager: 0,
				child: 0,
			};

	const numDiscounts = getNumDiscountPrice(yearDistribution, clubDistribution);
	const numPostInvoices = getNumPostInvoicing(clubDistribution);

	const place = options.place ? ` - ${escapeHtml(options.place)}` : "";
	const map = escapeHtml(options.map ?? "");
	const organiserClub = escapeHtml(options.organiserClub ?? "GeoForm");
	const organiserPersons = (options.organiserPersons ?? [])
		.map(escapeHtml)
		.join(", ");
	const arrStr = organiserPersons
		? `${organiserClub} v/${organiserPersons}`
		: organiserClub;

	const navLinks = (resultList.classResult ?? [])
		.map((cr, i) => {
			const name = escapeHtml(getClassName(cr));
			const count = cr.personResult?.length ?? 0;
			return `<li><a href="#class-${i}">${name} (${count})</a></li>
        <li><a href="#splits-${i}">${name} strekktider</a></li>`;
		})
		.join("\n        ");

	return `
  <header>
    <hgroup>
      <h1>${escapeHtml(options.title ?? resultList.event?.name ?? "Rankingløp")}</h1>
    </hgroup>
    <dl>
      <dt>Dato/sted</dt><dd>${escapeHtml(localeRaceDate)}${place}</dd>
      <dt>Kart</dt><dd>${map}</dd>
      <dt>Arr</dt><dd>${arrStr}</dd>
      <dt>Antall</dt><dd>Totalt: ${totalParticipation} ${distributionStr}</dd>
      <dt>Løpsrapport</dt><dd>Alder: 21-: ${yearDistribution.adults ?? 0}, 17-20: ${yearDistribution.oldTeenager ?? 0}, 13-16: ${yearDistribution.youngTeenager ?? 0}, 0-12: ${yearDistribution.child ?? 0}</dd>
      <dt>Startkont</dt><dd>kr. 50: ${totalParticipation - numDiscounts} &nbsp; kr. 30: ${numDiscounts} &nbsp; kr. 0: 0</dd>
      <dt>Betalt</dt><dd>kr. 50: ${totalParticipation - numDiscounts} &nbsp; kr. 30: ${numDiscounts - numPostInvoices} &nbsp; kr. 0: ${numPostInvoices}</dd>
      <dt>Leiebrikker</dt><dd>${options.rentalDevices ?? 0} stk</dd>
    </dl>
  </header>
  <nav>
    <ul>
      ${navLinks}
    </ul>
  </nav>`;
};
