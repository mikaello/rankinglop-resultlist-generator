import { ResultList } from "./model";

import { JSDOM } from "jsdom";

type ResultListOptions = {
  /** Title for this race */
  title?: String;

  /** Which map was used, e.g. "Sognsvann" */
  map?: String;

  /** Which club was organising the event, e.g. "OSI" */
  organiserClub?: String;

  /** Which persons were organising the event, e.g. "Bern Nordmand" */
  organiserPersons?: String[];

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

export const createResultList = (
  resultList: ResultList,
  options: ResultListOptions,
) => {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><head><meta HTTP-EQUIV="Content-Type" content="text/html; charset=UTF-8"></head><body></body></html>`,
  );
  //

  dom.window.document.title = "Rankingløp";

  console.log(dom.window.document);

  console.log(dom.serialize());

  return "";
};

createResultList({}, {});

console.log("hei");

const createResultListHeader = (options: ResultListOptions) => {};
