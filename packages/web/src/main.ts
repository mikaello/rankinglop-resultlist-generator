import "@picocss/pico/css/pico.classless.min.css";
import picoCSS from "@picocss/pico/css/pico.classless.min.css?inline";
import { createResultListHtml } from "@core/html";
import { parseIofXmlContent } from "@core/parseIofXmlContent";
import type { ResultListOptions } from "@core/options";
import "./style.css";

function validateIofXml(xmlStr: string): string | null {
	if (!xmlStr.includes("<ResultList")) {
		return "Filen er ikke en IOF ResultList XML.";
	}
	if (!/iofVersion="3\.0"/i.test(xmlStr)) {
		return 'Filen mangler iofVersion="3.0". Kun IOF XML 3.0 støttes.';
	}
	if (!xmlStr.includes("<ClassResult")) {
		return "Filen inneholder ingen klassresultater.";
	}
	return null;
}

function render(): void {
	document.body.innerHTML = `
    <main>
      <h1>Rankingløp resultatliste-generator</h1>
      <p>Last opp en IOF 3.0 XML resultatliste og få en selvinneholdt HTML-fil til nedlasting.</p>
      <form id="upload-form">
        <div>
          <label for="xml-file"><strong>IOF 3.0 XML-fil (påkrevd)</strong></label>
          <input type="file" id="xml-file" accept=".xml" required />
        </div>
        <div>
          <label for="config-json">Hendelsesoppsett JSON (valgfritt)</label>
          <input type="file" id="config-json" accept=".json" />
        </div>
        <button id="generate-btn" disabled>Generer resultatliste</button>
      </form>
      <div id="error-msg" style="display: none; color: #c00; margin: 1rem 0;"></div>
      <section id="result-section" style="display: none;">
        <a id="download-link" style="display: inline-block; margin: 1rem 0; padding: 0.5rem 1rem; background: #007bff; color: white; text-decoration: none; border-radius: 4px;"></a>
        <h2>Forhåndsvisning</h2>
        <iframe id="preview" style="width: 100%; height: 600px; border: 1px solid #ccc; border-radius: 4px;"></iframe>
      </section>
    </main>
  `;

	const uploadForm = document.getElementById("upload-form") as HTMLFormElement;
	const xmlInput = document.getElementById("xml-file") as HTMLInputElement;
	const configInput = document.getElementById("config-json") as HTMLInputElement;
	const generateBtn = document.getElementById("generate-btn") as HTMLButtonElement;
	const errorMsg = document.getElementById("error-msg") as HTMLDivElement;
	const resultSection = document.getElementById("result-section") as HTMLElement;
	const downloadLink = document.getElementById("download-link") as HTMLAnchorElement;
	const preview = document.getElementById("preview") as HTMLIFrameElement;

	xmlInput.addEventListener("change", () => {
		generateBtn.disabled = !xmlInput.files?.length;
		resultSection.style.display = "none";
		errorMsg.style.display = "none";
	});

	generateBtn.addEventListener("click", async (e) => {
		e.preventDefault();
		const xmlFile = xmlInput.files?.[0];
		if (!xmlFile) return;

		try {
			// Read XML
			const xmlStr = await xmlFile.text();

			// Validate
			const validError = validateIofXml(xmlStr);
			if (validError) {
				errorMsg.textContent = validError;
				errorMsg.style.display = "";
				return;
			}

			// Read optional config
			let options: ResultListOptions = {};
			const configFile = configInput.files?.[0];
			if (configFile) {
				try {
					options = JSON.parse(await configFile.text()) as ResultListOptions;
				} catch {
					errorMsg.textContent =
						"Ugyldig JSON i konfigurasjonsfilen.";
					errorMsg.style.display = "";
					return;
				}
			}

			// Parse and generate
			const resultList = parseIofXmlContent(xmlStr);
			const html = createResultListHtml(resultList, options, picoCSS);

			// Create download blob
			const blob = new Blob([html], { type: "text/html;charset=utf-8" });
			const url = URL.createObjectURL(blob);
			const filename =
				xmlFile.name.replace(/\.xml$/i, "") + ".html";
			downloadLink.href = url;
			downloadLink.download = filename;
			downloadLink.textContent = `Last ned ${filename}`;

			// Show preview
			preview.srcdoc = html;
			resultSection.style.display = "";
			errorMsg.style.display = "none";
		} catch (err) {
			errorMsg.textContent = `Feil under generering: ${err instanceof Error ? err.message : String(err)}`;
			errorMsg.style.display = "";
		}
	});
}

render();
