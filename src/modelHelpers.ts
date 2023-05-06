import { Organisation, Person, ResultListClassResult } from "./model";

export const getClassName = (classResult: ResultListClassResult) => {
  return (classResult.clazz?.name ?? "").trim();
};

export const getCourseLengthKm = (
  classResult: ResultListClassResult,
): number => {
  const length =
    classResult.course != null ? classResult.course[0].length ?? 0 : 0;

  return Number((length / 1000).toFixed(1));
};

export const getName = (person: Person | undefined): string => {
  return `${person?.name?.given ?? ""} ${person?.name?.family ?? ""}`.trim();
};

export const getOrganisationName = (
  organisation: Organisation | undefined,
): string => {
  let name = "";
  if (organisation?.name != null) {
    name = organisation.name;
  } else if (organisation?.mediaName != null) {
    name = organisation.mediaName;
  } else if (organisation?.shortName != null) {
    name = organisation.shortName;
  }
  return name.trim();
};

/**
 * When `timeBehindSeconds` is `undefined` or `0`, the `+` part is skipped
 * @returns time in format `00:01:33 +  30:22`
 */
export const getResultTimeInHhMmSs = (
  timeSeconds: number | undefined,
  timeBehindSeconds: number | undefined = 0,
): string => {
  if (timeSeconds == null) {
    return "";
  }
  const time = new Date(1000 * timeSeconds).toISOString().substring(11, 19);
  if (timeBehindSeconds == 0) {
    return time;
  }

  const timeBehindDate = new Date(1000 * timeBehindSeconds);
  let hoursBehind = "";
  if (timeBehindSeconds >= 3600) {
    hoursBehind = timeBehindDate.getHours() + ":";
  }
  return (
    time +
    " +" +
    (hoursBehind + timeBehindDate.toISOString().substring(14, 19)).padStart(7)
  );
};
