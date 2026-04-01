import { readFileSync, writeFileSync } from "node:fs";
import { createResultListDocument } from "./generateResultList.ts";
import type { ResultList } from "./model.ts";
import type { ResultListOptions } from "./options.ts";
import { parseIofXml } from "./parseIofXml.ts";

function printUsage(): void {
	console.error(
		`Usage: rankinglop --input <file.xml> [--config <options.json>] [--output <file.html>]

Options:
  --input  <file.xml>       IOF 3.0 XML result list (required)
  --config <options.json>   Event metadata (organiser, place, map, etc.) in JSON
  --output <file.html>      Output file (default: stdout)

If --output is omitted, the generated HTML is written to stdout.

Example config JSON:
  {
    "title": "Rankingløp 1 - 2024",
    "isoDate": "2024-05-08",
    "place": "Østmarksetra",
    "map": "Solbergvann",
    "organiserClub": "IL GeoForm",
    "organiserPersons": ["Harald Iwe"],
    "rentalDevices": 8
  }
`,
	);
}

function parseArgs(argv: string[]): {
	input?: string;
	config?: string;
	output?: string;
} {
	const args: { input?: string; config?: string; output?: string } = {};
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === "--input" && argv[i + 1]) {
			args.input = argv[++i];
		} else if (argv[i] === "--config" && argv[i + 1]) {
			args.config = argv[++i];
		} else if (argv[i] === "--output" && argv[i + 1]) {
			args.output = argv[++i];
		}
	}
	return args;
}

const args = parseArgs(process.argv.slice(2));

if (!args.input) {
	console.error("Error: --input is required.\n");
	printUsage();
	process.exit(1);
}

let options: ResultListOptions = {};
if (args.config) {
	try {
		options = JSON.parse(
			readFileSync(args.config, "utf8"),
		) as ResultListOptions;
	} catch (err) {
		console.error(`Error reading config file: ${args.config}\n${err}`);
		process.exit(1);
	}
}

let resultList: ResultList;
try {
	resultList = parseIofXml(args.input);
} catch (err) {
	console.error(`Error parsing XML: ${args.input}\n${err}`);
	process.exit(1);
}

const html = createResultListDocument(resultList, options);

if (args.output) {
	writeFileSync(args.output, html, "utf8");
} else {
	process.stdout.write(html);
}
