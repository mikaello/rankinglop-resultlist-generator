import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const exampleXml = join(rootDir, "examples", "example_iof_resultlist.xml");

function runCli(args: string[]): {
	stdout: string;
	stderr: string;
	status: number | null;
} {
	const result = spawnSync(
		process.execPath,
		["--import", "tsx", join(rootDir, "src", "cli.ts"), ...args],
		{ encoding: "utf8" },
	);
	return {
		stdout: result.stdout ?? "",
		stderr: result.stderr ?? "",
		status: result.status,
	};
}

describe("CLI smoke tests", () => {
	it("exits with code 1 and prints usage when --input is missing", () => {
		const { status, stderr } = runCli([]);
		assert.equal(status, 1);
		assert.ok(
			stderr.includes("--input is required"),
			"stderr should mention --input",
		);
	});

	it("generates HTML from the example XML file", () => {
		const { stdout, status } = runCli(["--input", exampleXml]);
		assert.equal(status, 0);
		assert.ok(
			stdout.startsWith("<!DOCTYPE html>"),
			"output should start with DOCTYPE",
		);
	});

	it("HTML contains a <title> element", () => {
		const { stdout } = runCli(["--input", exampleXml]);
		assert.ok(stdout.includes("<title>"), "should contain <title>");
	});

	it("HTML contains headings for all three class result sections", () => {
		const { stdout } = runCli(["--input", exampleXml]);
		assert.ok(stdout.includes("Resultater Lang"), "should contain Lang");
		assert.ok(stdout.includes("Resultater Mellom"), "should contain Mellom");
		assert.ok(stdout.includes("Resultater Kort"), "should contain Kort");
	});

	it("HTML contains the winner's name", () => {
		const { stdout } = runCli(["--input", exampleXml]);
		assert.ok(stdout.includes("Melsom"), "should contain winner Melsom");
	});

	it("HTML contains status label for MissingPunch results", () => {
		const { stdout } = runCli(["--input", exampleXml]);
		assert.ok(
			stdout.includes("feilst"),
			"should contain MissingPunch status marker",
		);
	});

	it("HTML contains split times section", () => {
		const { stdout } = runCli(["--input", exampleXml]);
		assert.ok(
			stdout.includes("Strekktider"),
			"should contain split times section heading",
		);
	});

	it("HTML contains Pico CSS inline", () => {
		const { stdout } = runCli(["--input", exampleXml]);
		// Pico CSS has a distinctive comment or class selector in its minified output
		assert.ok(stdout.includes("<style>"), "should contain <style> tag");
	});

	it("HTML has a nav element with links to class sections", () => {
		const { stdout } = runCli(["--input", exampleXml]);
		assert.ok(stdout.includes("<nav>"), "should contain <nav> element");
		assert.ok(stdout.includes("#class-0"), "should have link to class 0");
	});

	it("HTML has table structure for results", () => {
		const { stdout } = runCli(["--input", exampleXml]);
		assert.ok(stdout.includes("<table>"), "should contain <table>");
		assert.ok(stdout.includes("<thead>"), "should contain <thead>");
		assert.ok(stdout.includes("<tbody>"), "should contain <tbody>");
	});
});
