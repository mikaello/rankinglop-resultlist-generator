import { ResultList } from "./model";

import { JSDOM } from "jsdom";

type ResultListOptions = {
  /** Title for this race */
  title?: string;

  isoDate?: string;

  /** Which map was used, e.g. "Sognsvann" */
  map?: string;

  /** Which club was organising the event, e.g. "OSI" */
  organiserClub?: string;

  /** Which persons were organising the event, e.g. "Bern Nordmand" */
  organiserPersons?: string[];

  yearDistribution?: {
    /** 21 years or more */
    adults?: number;
    /** 17-20 years */
    oldTeenager?: number;
    /** 13-16 years */
    youngTeenager?: number;
    /** 0-12 years */
    child?: number;
  };

  startContingent?: { amount: number; quota: "number" }[];

  rentalDevices?: number;
};

const createResultListHeader = (doc: Document, options: ResultListOptions) => {
  let pre = doc.createElement("pre");

  const dateOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  pre.textContent = `
    Data/sted:    ${
      //@ts-ignore
      new Date().toLocaleDateString("nb-NO", dateOptions)
    }
    Kart:         ${options.map ?? ""}
    Arr:          ${options.organiserClub ?? "GeoForm"} v/${
    options.organiserPersons?.join(",") ?? ""
  }
    Antall:       Totalt: 
    `
    .trim()
    .replace(/^ {4}/gm, "");

  /*
Dato/sted:   4. august 2021 - 
Kart:        
Arr:         IL GeoForm v/
Antall:      Totalt: 134  (GeoForm: 11, OSI: 1, DNV/ESSO: 5, Andre: 117)
L&oslash;psrapport: Alder:  21-: 128,  17-20: 0,  13-16: 6,  0-12: 0
Startkont:   kr. 50: 111   kr. 30: 23   kr. 0: 0
Betalt:      kr. 50: 111   kr. 30: 18   kr. 0: 5
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
  doc.title = options.title ?? "Rankingløp";
  let header = doc.createElement("h1");
  header.textContent = doc.title;
  doc.body.append(header);

  doc.body.append(createResultListHeader(doc, options));

  console.log(dom.serialize());

  return "";
};

createResultList({}, {});
