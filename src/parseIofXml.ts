import { readFileSync } from "node:fs";
import { XMLParser } from "fast-xml-parser";
import type {
  ClassResult,
  Course,
  Event,
  Organisation,
  Person,
  PersonResult,
  Result,
  ResultList,
  ResultStatus,
  SplitTime,
} from "./model.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

const ARRAY_TAGS = new Set(["ClassResult", "PersonResult", "SplitTime"]);

function parseEvent(e: AnyObj): Event {
  return {
    name: e.Name ? String(e.Name) : undefined,
    startTime: e.StartTime
      ? { date: e.StartTime.Date, time: e.StartTime.Time }
      : undefined,
    endTime: e.EndTime
      ? { date: e.EndTime.Date, time: e.EndTime.Time }
      : undefined,
  };
}

function parseCourse(c: AnyObj): Course {
  return {
    name: c.Name ? String(c.Name) : undefined,
    length: typeof c.Length === "number" ? c.Length : undefined,
    climb: typeof c.Climb === "number" ? c.Climb : undefined,
    numberOfControls:
      typeof c.NumberOfControls === "number" ? c.NumberOfControls : undefined,
  };
}

function parseSplitTime(st: AnyObj): SplitTime {
  return {
    controlCode: st.ControlCode !== undefined ? String(st.ControlCode) : undefined,
    time: typeof st.Time === "number" ? st.Time : undefined,
    status: st["@_status"] ? String(st["@_status"]) : undefined,
  };
}

function parseResult(r: AnyObj): Result {
  const splitTimes: AnyObj[] = Array.isArray(r.SplitTime) ? r.SplitTime : [];
  return {
    startTime: r.StartTime ? String(r.StartTime) : undefined,
    finishTime: r.FinishTime ? String(r.FinishTime) : undefined,
    time: typeof r.Time === "number" ? r.Time : undefined,
    timeBehind: typeof r.TimeBehind === "number" ? r.TimeBehind : undefined,
    position: typeof r.Position === "number" ? r.Position : undefined,
    status: r.Status ? (String(r.Status) as ResultStatus) : undefined,
    splitTime: splitTimes.map(parseSplitTime),
  };
}

function parsePerson(p: AnyObj): Person {
  return {
    name: p.Name
      ? {
          family: p.Name.Family ? String(p.Name.Family) : undefined,
          given: p.Name.Given ? String(p.Name.Given) : undefined,
        }
      : undefined,
  };
}

function parseOrganisation(o: AnyObj): Organisation {
  return {
    name: o.Name ? String(o.Name) : undefined,
    shortName: o.ShortName ? String(o.ShortName) : undefined,
    mediaName: o.MediaName ? String(o.MediaName) : undefined,
  };
}

function parsePersonResult(pr: AnyObj): PersonResult {
  const result: Result[] = pr.Result ? [parseResult(pr.Result)] : [];
  return {
    person: pr.Person ? parsePerson(pr.Person) : undefined,
    organisation: pr.Organisation
      ? parseOrganisation(pr.Organisation)
      : undefined,
    result,
  };
}

function parseClassResult(cr: AnyObj): ClassResult {
  const personResults: AnyObj[] = Array.isArray(cr.PersonResult)
    ? cr.PersonResult
    : [];
  const course = cr.Course ? [parseCourse(cr.Course)] : undefined;
  return {
    clazz: cr.Class ? { name: cr.Class.Name ? String(cr.Class.Name) : undefined } : undefined,
    course,
    personResult: personResults.map(parsePersonResult),
  };
}

/**
 * Parse an IOF 3.0 XML result list file and return a typed ResultList.
 * Handles both UTF-8 and ISO-8859-1 (Otime export) encoded files transparently.
 */
export function parseIofXml(filePath: string): ResultList {
  const buffer = readFileSync(filePath);

  // Detect encoding from the XML declaration (first 200 bytes are ASCII)
  const xmlDeclSlice = buffer.slice(0, 200).toString("ascii");
  const encMatch = xmlDeclSlice.match(/encoding="([^"]+)"/i);
  const declaredEncoding = (encMatch?.[1] ?? "utf-8").toLowerCase();
  const isLatin1 =
    declaredEncoding === "iso-8859-1" || declaredEncoding === "latin1";

  // Node's 'latin1' encoding maps each byte to the same Unicode code point (ISO-8859-1)
  const content = buffer.toString(isLatin1 ? "latin1" : "utf8");

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => ARRAY_TAGS.has(name),
    parseTagValue: true,
    trimValues: true,
  });

  const raw = parser.parse(content);
  const rl: AnyObj = raw.ResultList ?? {};

  const classResults: AnyObj[] = Array.isArray(rl.ClassResult)
    ? rl.ClassResult
    : [];

  return {
    iofVersion: rl["@_iofVersion"]
      ? String(rl["@_iofVersion"])
      : undefined,
    createTime: rl["@_createTime"] ? String(rl["@_createTime"]) : undefined,
    creator: rl["@_creator"] ? String(rl["@_creator"]) : undefined,
    status: rl["@_status"] ? String(rl["@_status"]) : undefined,
    event: rl.Event ? parseEvent(rl.Event) : undefined,
    classResult: classResults.map(parseClassResult),
  };
}
