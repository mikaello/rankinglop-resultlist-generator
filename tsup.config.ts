import { defineConfig } from "tsup";

export default defineConfig([
	{
		// Library entry — browser + Node.js compatible
		entry: { index: "src/index.ts" },
		format: ["esm"],
		dts: true,
		outDir: "dist",
		clean: true,
		external: ["fast-xml-parser"],
	},
	{
		// CLI entry — Node.js only
		entry: { cli: "src/cli.ts" },
		format: ["esm"],
		outDir: "dist",
		external: ["@picocss/pico", "fast-xml-parser"],
		banner: { js: "#!/usr/bin/env node" },
	},
]);
