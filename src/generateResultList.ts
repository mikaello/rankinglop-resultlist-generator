import { ResultList, ResultListClassResult } from "./model";
import {
  getCourseLengthKm,
  getClassName,
  getName,
  getOrganisationName,
  getResultTimeInHhMmSs,
} from "./modelHelpers.js";
import { JSDOM } from "jsdom";

const createClassResult = (
  doc: Document,
  classResult: ResultListClassResult | undefined,
): HTMLElement => {
  const header = doc.createElement("b");
  header.textContent =
    "Plass Navn                          Klubb                     Tid                   Poeng";

  let rawResults = "\n";
  classResult?.personResult?.forEach((pr) => {
    const r = pr?.result ? pr.result[0] : undefined;

    if (r != null) {
      const pos = `${r.position}`.padEnd(6);
      const name = getName(pr.person).padEnd(30);
      const org = getOrganisationName(pr.organisation).padEnd(26);
      const time = getResultTimeInHhMmSs(r.time, r.timeBehind).padEnd(22);

      rawResults += `${pos}${name}${org}${time}\n`;
    }
  });

  const resultPre = doc.createElement("pre");
  resultPre.append(header, rawResults);
  return resultPre;
};

export const createResultList = (
  { window: { document: doc } }: JSDOM,
  resultList: ResultList,
): HTMLElement[] => {
  const resultElement: HTMLElement[] = [];

  resultList.classResult?.forEach((classResult, index) => {
    const title = doc.createElement("h3");
    const titleA = doc.createElement("a"); // necessary for anchor tags to work
    titleA.setAttribute("name", `Res${index + 1}`);
    titleA.textContent = `Resultater ${getClassName(
      classResult,
    )} (${getCourseLengthKm(classResult)} km)`;
    title.append(titleA);

    resultElement.push(title, createClassResult(doc, classResult));
  });

  return resultElement;
};
