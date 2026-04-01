import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	base: "/rankinglop-resultlist-generator/",
	resolve: {
		alias: {
			"@core": path.resolve(__dirname, "../../src"),
		},
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
});
