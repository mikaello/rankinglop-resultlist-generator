import { ResultListOptions, YearDistribution } from ".";
import { ResultList } from "./model";

type ClubRegex = { clubName: string; clubRegex: RegExp };

type ClubParticipation = { clubName: string; count: number };

export const getClubDistribution = (
  clubs: ClubRegex[],
  resultList: ResultList
): ClubParticipation[] => {
  const clubP = new Map(
    clubs.map((club) => [club.clubName, { clubName: club.clubName, count: 0 }])
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
    })
  );

  return Array.from(clubP.values());
};

const getNumDiscountPrice = (
  yearDistribution: YearDistribution,
  clubDistribution: ClubParticipation[]
) => {
  const discountClubs = clubDistribution.filter((club) =>
    /(DNV|GeoForm|OSI|Oslostudentenes)/i.test(club.clubName)
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

export const createResultListHeader = (
  doc: Document,
  options: ResultListOptions,
  resultList: ResultList
) => {
  let pre = doc.createElement("pre");

  const raceDate = options.isoDate ? new Date(options.isoDate) : new Date();
  const dateOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  //@ts-ignore
  const localeRaceDate = raceDate.toLocaleDateString("nb-NO", dateOptions);

  const clubDistribution = getClubDistribution(
    [
      { clubName: "GeoForm", clubRegex: new RegExp(/GeoForm/i) },
      { clubName: "OSI", clubRegex: new RegExp(/(OSI|Oslostudentene)/i) },
      { clubName: "DNV", clubRegex: new RegExp(/(DNV|ESSO|Veritas|VBIL)/i) },
      { clubName: "Andre", clubRegex: new RegExp(/.*/i) },
    ],
    resultList
  );
  const distributionStr =
    clubDistribution.length > 0
      ? `(${clubDistribution
          .map((d) => `${d.clubName}: ${d.count}`)
          .join(", ")})`
      : "";

  const totalParticipation = clubDistribution.reduce(
    (acc, curr) => acc + curr.count,
    0
  );

  const yearDistribution = options.yearDistribution
    ? { ...options.yearDistribution }
    : { adult: totalParticipation, oldTeenager: 0, youngTeenager: 0, child: 0 };

  const numDiscounts = getNumDiscountPrice(yearDistribution, clubDistribution);
  const numPostInvoices = getNumPostInvoicing(clubDistribution);

  // prettier-ignore
  pre.textContent = `
    Data/sted:    ${ localeRaceDate } ${options.place ? "- " + options.place : ""}
    Kart:         ${options.map ?? ""}
    Arr:          ${options.organiserClub ?? "GeoForm"} v/${ options.organiserPersons?.join(", ") ?? "" }
    Antall:       Totalt: ${totalParticipation} ${distributionStr}
    Løpsrapport:  Alder:  21-: ${yearDistribution.adult ?? 0},  17-20: ${ yearDistribution.oldTeenager ?? 0 },  13-16: ${yearDistribution.youngTeenager ?? 0},  0-12: ${ yearDistribution.child ?? 0 }
    Startkont:    kr. 50: ${ totalParticipation - numDiscounts }   kr. 30: ${numDiscounts}   kr. 0: 0
    Betalt:       kr. 50: ${totalParticipation - numDiscounts}   kr. 30: ${ numDiscounts - numPostInvoices }   kr. 0: ${numPostInvoices}
    Leiebrikker:  ${options.rentalDevices ?? 0} stk
    `
    .trim()
    .replace(/^ {4}/gm, "");

  return pre;
};
