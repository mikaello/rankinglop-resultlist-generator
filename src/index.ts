import { ResultList } from "./model";

type ResultListOptions = {
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
  return "";
};
