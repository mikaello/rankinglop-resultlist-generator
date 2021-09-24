import { ResultList } from "./model";

import { JSDOM } from "jsdom";

import result_ from "./resources/res2021-09-18.json";

type YearDistribution = {
  /** 21 years or more */
  adults?: number;
  /** 17-20 years */
  oldTeenager?: number;
  /** 13-16 years */
  youngTeenager?: number;
  /** 0-12 years */
  child?: number;
};

type ResultListOptions = {
  /** Title for this race */
  title?: string;

  isoDate?: string;

  /** Location of the event */
  place?: string;

  /** Which map was used, e.g. "Sognsvann" */
  map?: string;

  /** Which club was organising the event, e.g. "OSI" */
  organiserClub?: string;

  /** Which persons were organising the event, e.g. "Bern Nordmand" */
  organiserPersons?: string[];

  yearDistribution?: YearDistribution;

  startContingent?: { amount: number; quota: "number" }[];

  rentalDevices?: number;
};

type ClubRegex = { clubName: string; clubRegex: RegExp };
type ClubParticipation = { clubName: string; count: number };
export const getClubDistribution = (
  clubs: ClubRegex[],
  resultList: ResultList,
): ClubParticipation[] => {
  const clubP = new Map(
    clubs.map((club) => [club.clubName, { clubName: club.clubName, count: 0 }]),
  );

  resultList.classResult?.forEach((classType) =>
    classType.personResult?.forEach((personResult) => {
      for (const c of clubs) {
        const org = personResult.organisation?.name;
        if (org && c.clubRegex.test(org)) {
          let club = clubP.get(c.clubName);
          if (club) {
            club.count++;
          }
          break;
        }
      }
    }),
  );

  return Array.from(clubP.values());
};

const getNumDiscountPrice = (
  yearDistribution: YearDistribution,
  clubDistribution: ClubParticipation[],
) => {
  const discountClubs = clubDistribution.filter((club) =>
    /(DNV|GeoForm|OSI)/i.test(club.clubName),
  );

  return (
    discountClubs.reduce((acc, curr) => acc + curr.count, 0) +
    (yearDistribution.child ?? 0) +
    (yearDistribution.youngTeenager ?? 0)
  );
};

const getNumPostInvoicing = (getClubDistribution: ClubParticipation[]) => {
  return getClubDistribution.find((club) => club.clubName == "DNV")?.count ?? 0;
};

const createResultListHeader = (
  doc: Document,
  options: ResultListOptions,
  resultList: ResultList,
) => {
  let pre = doc.createElement("pre");

  const dateOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const clubDistribution = getClubDistribution(
    [
      { clubName: "GeoForm", clubRegex: new RegExp(/GeoForm/i) },
      { clubName: "OSI", clubRegex: new RegExp(/(OSI|Oslostudentene)/i) },
      { clubName: "DNV", clubRegex: new RegExp(/(DNV|ESSO|Veritas|VBIL)/i) },
      { clubName: "Andre", clubRegex: new RegExp(/.*/i) },
    ],
    resultList,
  );
  const distributionStr =
    clubDistribution.length > 0
      ? `(${clubDistribution
          .map((d) => `${d.clubName}: ${d.count}`)
          .join(", ")})`
      : "";

  const totalParticipation = clubDistribution.reduce(
    (acc, curr) => acc + curr.count,
    0,
  );

  const yearDistribution = options.yearDistribution
    ? { ...options.yearDistribution }
    : { adult: totalParticipation, oldTeenager: 0, youngTeenager: 0, child: 0 };

  const numDiscounts = getNumDiscountPrice(yearDistribution, clubDistribution);
  const numPostInvoices = getNumPostInvoicing(clubDistribution);

  const raceDate = options.isoDate ? new Date(options.isoDate) : new Date();
  pre.textContent = `
    Data/sted:    ${
      //@ts-ignore
      raceDate.toLocaleDateString("nb-NO", dateOptions)
    } ${options.place ? "- " + options.place : ""}
    Kart:         ${options.map ?? ""}
    Arr:          ${options.organiserClub ?? "GeoForm"} v/${
    options.organiserPersons?.join(", ") ?? ""
  }
    Antall:       Totalt: ${totalParticipation} ${distributionStr}
    Løpsrapport:  Alder:  21-: ${yearDistribution.adult ?? 0},  17-20: ${
    yearDistribution.oldTeenager ?? 0
  },  13-16: ${yearDistribution.youngTeenager ?? 0},  0-12: ${
    yearDistribution.child ?? 0
  }
    Startkont:    kr. 50: ${
      totalParticipation - numDiscounts
    }   kr. 30: ${numDiscounts}   kr. 0: 0
    Betalt:       kr. 50: ${totalParticipation - numDiscounts}   kr. 30: ${
    numDiscounts - numPostInvoices
  }   kr. 0: ${numPostInvoices}
    Leiebrikker:  ${options.rentalDevices ?? 0} stk
    `
    .trim()
    .replace(/^ {4}/gm, "");

  /*
Dato/sted:   18. september 2021 - Svartkulp
Kart:        Sognsvann
Arr:         Sentrum OK v/Magne Vollen å Lenny Enstrøm
Antall:      Totalt: 106  (GeoForm: 8, OSI: 2, DNV/ESSO: 3, Andre: 93)
Løpsrapport: Alder:  21-: 106,  17-20: 0,  13-16: 0,  0-12: 0
Startkont:   kr. 50: 93   kr. 30: 13   kr. 0: 0
Betalt:      kr. 50: 93   kr. 30: 10   kr. 0: 3
Leiebrikker: 0 stk
*/

  // TODO add result list links
  // TODO add split times links

  return pre;
};

export const createResultList = (
  resultList: ResultList,
  options: ResultListOptions,
) => {
  const generatorName = "Webbotime";
  const generatorVersion = "1.0.0";
  const dom = new JSDOM(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta HTTP-EQUIV="Content-Type" content="text/html; charset=UTF-8">
        <meta name="Generator" content="${generatorName} ${generatorVersion}">
      </head>
      <body></body>
    </html>`,
  );

  const doc = dom.window.document;

  // Add titles
  doc.title = options.title ?? resultList.event?.name ?? "Rankingløp";
  let header = doc.createElement("h1");
  header.textContent = doc.title;
  doc.body.append(header);

  doc.body.append(createResultListHeader(doc, options, resultList));

  console.log(dom.serialize());

  return "";
};

createResultList(result_.resultList as ResultList, {
  place: "Svartkulp",
  map: "Sognsvann",
  organiserClub: "OSI",
  organiserPersons: ["Magne Vollen", "Lenny Enström"],
});
