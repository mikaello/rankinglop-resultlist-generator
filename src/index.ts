import { writeFileSync } from "fs";
import { ResultList } from "./model";

import { JSDOM } from "jsdom";

import result_ from "./resources/res2021-09-18.json" with { type: "json" };

import { createResultListHeader } from "./generateResultListHeader.js";
import { createResultList } from "./generateResultList.js";

export type YearDistribution = {
  /** 21 years or more */
  adults?: number;
  /** 17-20 years */
  oldTeenager?: number;
  /** 13-16 years */
  youngTeenager?: number;
  /** 0-12 years */
  child?: number;
};

export type ResultListOptions = {
  /** Title of this race */
  title?: string;

  /** Date of the event in ISO 8601 date format (YYYY-MM-DD) */
  isoDate?: string;

  /** Location of the event */
  place?: string;

  /** Which map was used, e.g. "Sognsvann" */
  map?: string;

  /** Which club was organising the event, e.g. "OSI" */
  organiserClub?: string;

  /** Which persons were organising the event, e.g. "Bern Nordmand" */
  organiserPersons?: string[];

  /** How old were the participants */
  yearDistribution?: YearDistribution;

  startContingent?: { amount: number; quota: "number" }[];

  rentalDevices?: number;
};

export const createResultListDocument = (
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

  doc.body.append(createResultListHeader(dom, options, resultList));
  doc.body.append(...createResultList(dom, resultList));

  // TODO append split times

  console.log(dom.serialize());
  writeFileSync("dist/resultList.html", dom.serialize());

  return "";
};

createResultListDocument(result_.resultList as ResultList, {
  isoDate: "2021-09-18",
  place: "Svartkulp",
  map: "Sognsvann",
  organiserClub: "OSI",
  organiserPersons: ["Magne Vollen", "Lenny Enström"],
});
