import { readFileSync } from "node:fs";
import type { ResultList } from "./model.ts";
import { parseIofXmlContent } from "./parseIofXmlContent.ts";

export { parseIofXmlContent } from "./parseIofXmlContent.ts";

/**
 * Parse an IOF 3.0 XML result list file (Node.js only).
 * Handles both UTF-8 and ISO-8859-1 (Otime export) encoded files transparently.
 * When the declared encoding is ISO-8859-1, the file is first attempted as
 * UTF-8 (Otime sometimes exports UTF-8 with a stale declaration); if the
 * bytes are not valid UTF-8 it falls back to latin1.
 */
export function parseIofXml(filePath: string): ResultList {
	const buffer = readFileSync(filePath);

	// Detect encoding from the XML declaration (first 200 bytes are ASCII-safe)
	const xmlDeclSlice = buffer.slice(0, 200).toString("ascii");
	const encMatch = xmlDeclSlice.match(/encoding="([^"]+)"/i);
	const declaredEncoding = (encMatch?.[1] ?? "utf-8").toLowerCase();

	let content: string;
	if (declaredEncoding === "utf-8" || declaredEncoding === "utf8") {
		content = buffer.toString("utf8");
	} else {
		// Declared ISO-8859-1 (or similar). Try UTF-8 first — Otime occasionally
		// exports a UTF-8 file with a stale ISO-8859-1 declaration.
		// TextDecoder with fatal:true throws on any invalid UTF-8 sequence.
		try {
			content = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
		} catch {
			// Genuine ISO-8859-1: Node 'latin1' maps each byte 1-to-1 to codepoints.
			content = buffer.toString("latin1");
		}
	}

	return parseIofXmlContent(content);
}
