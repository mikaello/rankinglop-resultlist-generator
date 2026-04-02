import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { parseIofXml } from "../src/parseIofXml.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleXml = join(
	__dirname,
	"..",
	"src",
	"resources",
	"res2021-09-18.xml",
);

describe("parseIofXml", () => {
	it("returns three classes from the example file", () => {
		const rl = parseIofXml(exampleXml);
		assert.equal(rl.classResult?.length, 3);
	});

	it("parses class names correctly", () => {
		const rl = parseIofXml(exampleXml);
		const names = rl.classResult?.map((c) => c.clazz?.name);
		assert.deepEqual(names, ["Lang", "Mellom", "Kort"]);
	});

	it("parses course length for first class (5700 m)", () => {
		const rl = parseIofXml(exampleXml);
		assert.equal(rl.classResult?.[0].course?.[0].length, 5700);
	});

	it("parses the first finisher name and time in class Lang", () => {
		const rl = parseIofXml(exampleXml);
		const firstResult = rl.classResult?.[0].personResult?.[0];
		assert.equal(firstResult?.person?.name?.family, "Vogelsang");
		assert.equal(firstResult?.person?.name?.given, "Christian");
		assert.equal(firstResult?.result?.[0].time, 2282);
	});

	it("parses the first finisher organisation", () => {
		const rl = parseIofXml(exampleXml);
		const firstResult = rl.classResult?.[0].personResult?.[0];
		assert.equal(firstResult?.organisation?.name, "Nydalens SK");
	});

	it("parses split times for the first finisher", () => {
		const rl = parseIofXml(exampleXml);
		const splitTimes =
			rl.classResult?.[0].personResult?.[0].result?.[0].splitTime;
		assert.equal(splitTimes?.length, 18);
		assert.equal(splitTimes?.[0].controlCode, "101");
		assert.equal(splitTimes?.[0].time, 121);
	});

	it("parses OK status for finishers", () => {
		const rl = parseIofXml(exampleXml);
		const firstStatus =
			rl.classResult?.[0].personResult?.[0].result?.[0].status;
		assert.equal(firstStatus, "OK");
	});

	it("parses MissingPunch status correctly", () => {
		const rl = parseIofXml(exampleXml);
		const allStatuses = rl.classResult
			?.flatMap((c) => c.personResult ?? [])
			.map((pr) => pr.result?.[0]?.status)
			.filter((s) => s !== "OK" && s !== undefined);
		assert.ok(
			allStatuses && allStatuses.length > 0,
			"should have non-OK statuses",
		);
		assert.ok(
			allStatuses?.every((s) => s === "MissingPunch"),
			"all non-OK statuses should be MissingPunch",
		);
	});

	it("parses iofVersion attribute", () => {
		const rl = parseIofXml(exampleXml);
		assert.equal(rl.iofVersion, "3.0");
	});

	it("returns 31 participants in the Lang class", () => {
		const rl = parseIofXml(exampleXml);
		assert.equal(rl.classResult?.[0].personResult?.length, 31);
	});
});
