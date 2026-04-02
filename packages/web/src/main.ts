import "@picocss/pico/css/pico.classless.min.css";
import { createResultListHtml } from "@core/html";
import type { ResultListOptions, YearDistribution } from "@core/options";
import { parseIofXmlContent } from "@core/parseIofXmlContent";
import picoCSS from "@picocss/pico/css/pico.classless.min.css?inline";
import "./style.css";

const DEFAULT_ORGANISER_CLUB = "IL GeoForm";

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

function getVal(id: string): string {
	return (document.getElementById(id) as HTMLInputElement).value.trim();
}

function setVal(id: string, val: string): void {
	(document.getElementById(id) as HTMLInputElement).value = val;
}

function buildOptionsFromForm(): ResultListOptions {
	const options: ResultListOptions = {};

	const title = getVal("opt-title");
	if (title) options.title = title;

	const date = getVal("opt-date");
	if (date) options.isoDate = date;

	const place = getVal("opt-place");
	if (place) options.place = place;

	const map = getVal("opt-map");
	if (map) options.map = map;

	const club = getVal("opt-club");
	if (club) options.organiserClub = club;

	const persons = getVal("opt-persons");
	if (persons)
		options.organiserPersons = persons
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);

	const rental = getVal("opt-rental");
	if (rental) options.rentalDevices = Number(rental);

	const adults = getVal("opt-adults");
	const oldTeen = getVal("opt-old-teen");
	const youngTeen = getVal("opt-young-teen");
	const child = getVal("opt-child");
	if (adults || oldTeen || youngTeen || child) {
		const dist: YearDistribution = {};
		if (adults) dist.adults = Number(adults);
		if (oldTeen) dist.oldTeenager = Number(oldTeen);
		if (youngTeen) dist.youngTeenager = Number(youngTeen);
		if (child) dist.child = Number(child);
		options.yearDistribution = dist;
	}

	const contingentStr = getVal("opt-contingent");
	if (contingentStr) {
		options.startContingent = JSON.parse(contingentStr) as {
			amount: number;
			quota: number;
		}[];
	}

	return options;
}

function populateFormFromOptions(opts: ResultListOptions): void {
	setVal("opt-title", opts.title ?? "");
	setVal("opt-date", opts.isoDate ?? "");
	setVal("opt-place", opts.place ?? "");
	setVal("opt-map", opts.map ?? "");
	setVal("opt-club", opts.organiserClub ?? DEFAULT_ORGANISER_CLUB);
	setVal("opt-persons", opts.organiserPersons?.join(", ") ?? "");
	setVal(
		"opt-rental",
		opts.rentalDevices != null ? String(opts.rentalDevices) : "",
	);
	setVal(
		"opt-adults",
		opts.yearDistribution?.adults != null
			? String(opts.yearDistribution.adults)
			: "",
	);
	setVal(
		"opt-old-teen",
		opts.yearDistribution?.oldTeenager != null
			? String(opts.yearDistribution.oldTeenager)
			: "",
	);
	setVal(
		"opt-young-teen",
		opts.yearDistribution?.youngTeenager != null
			? String(opts.yearDistribution.youngTeenager)
			: "",
	);
	setVal(
		"opt-child",
		opts.yearDistribution?.child != null
			? String(opts.yearDistribution.child)
			: "",
	);
	setVal(
		"opt-contingent",
		opts.startContingent ? JSON.stringify(opts.startContingent, null, 2) : "",
	);
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

				<details class="config-accordion" open>
					<summary>
						<span>Hendelsesoppsett (valgfritt)</span>
						<small>Utvid for manuell utfylling</small>
					</summary>
          <div>
            <div>
							<label for="config-json" class="json-upload-label">
								<span>Last opp JSON-konfigurasjon</span>
								<button type="button" id="json-help-btn" class="info-badge" aria-label="Vis forventet JSON-format">i</button>
							</label>
              <input type="file" id="config-json" accept=".json" />
              <small>Laster inn verdiene i feltene under automatisk.</small>
            </div>
						<dialog id="json-help-dialog">
							<article>
								<header>
									<button type="button" aria-label="Lukk" rel="prev" id="json-help-close"></button>
									<p><strong>Forventet JSON-format</strong></p>
								</header>
								<p>Du kan bruke én eller flere av disse feltene:</p>
								<pre><code>{
	"title": "Rankingløp 1",
	"isoDate": "2026-04-02",
	"place": "Sognsvann",
	"map": "Sognsvann",
	"organiserClub": "IL GeoForm",
	"organiserPersons": ["Ola Nordmann", "Kari Nordmann"],
	"yearDistribution": {
		"adults": 120,
		"oldTeenager": 35,
		"youngTeenager": 42,
		"child": 18
	},
	"startContingent": [
		{ "amount": 50, "quota": 100 },
		{ "amount": 80, "quota": 50 }
	],
	"rentalDevices": 12
}</code></pre>
							</article>
						</dialog>
            <hr />
            <div class="grid">
              <label>
                Tittel
                <input type="text" id="opt-title" placeholder="f.eks. Rankingløp 1" />
              </label>
              <label>
                Dato
                <input type="date" id="opt-date" />
              </label>
            </div>
            <div class="grid">
              <label>
                Sted
                <input type="text" id="opt-place" placeholder="f.eks. Sognsvann" />
              </label>
              <label>
                Kart
                <input type="text" id="opt-map" placeholder="f.eks. Sognsvann" />
              </label>
            </div>
            <div class="grid">
              <label>
                Arrangørklubb
								<input type="text" id="opt-club" value="IL GeoForm" placeholder="f.eks. IL GeoForm" />
              </label>
              <label>
                Arrangørpersoner <small>(kommaseparert)</small>
                <input type="text" id="opt-persons" placeholder="f.eks. Ola Nordmann, Kari Nordmann" />
              </label>
            </div>
            <label>
              Leieenheter
              <input type="number" id="opt-rental" min="0" placeholder="0" style="max-width: 12rem;" />
            </label>
            <fieldset>
              <legend>Aldersdistribusjon av deltakere</legend>
              <div class="grid">
                <label>
                  Voksne (≥21 år)
									<input type="number" id="opt-adults" min="0" placeholder="0" />
                </label>
                <label>
                  Eldre ungdom (17–20 år)
									<input type="number" id="opt-old-teen" min="0" placeholder="0" />
                </label>
                <label>
                  Yngre ungdom (13–16 år)
									<input type="number" id="opt-young-teen" min="0" placeholder="0" />
                </label>
                <label>
                  Barn (0–12 år)
									<input type="number" id="opt-child" min="0" placeholder="0" />
                </label>
              </div>
            </fieldset>
            <label>
              Startkontigent (JSON)
              <textarea id="opt-contingent" rows="3" placeholder='[{"amount": 50, "quota": 100}]'></textarea>
            </label>
          </div>
        </details>

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

	const xmlInput = document.getElementById("xml-file") as HTMLInputElement;
	const configInput = document.getElementById(
		"config-json",
	) as HTMLInputElement;
	const generateBtn = document.getElementById(
		"generate-btn",
	) as HTMLButtonElement;
	const errorMsg = document.getElementById("error-msg") as HTMLDivElement;
	const resultSection = document.getElementById(
		"result-section",
	) as HTMLElement;
	const jsonHelpBtn = document.getElementById(
		"json-help-btn",
	) as HTMLButtonElement;
	const jsonHelpDialog = document.getElementById(
		"json-help-dialog",
	) as HTMLDialogElement;
	const jsonHelpClose = document.getElementById(
		"json-help-close",
	) as HTMLButtonElement;
	const downloadLink = document.getElementById(
		"download-link",
	) as HTMLAnchorElement;
	const preview = document.getElementById("preview") as HTMLIFrameElement;

	jsonHelpBtn.addEventListener("click", () => {
		jsonHelpDialog.showModal();
	});

	jsonHelpClose.addEventListener("click", () => {
		jsonHelpDialog.close();
	});

	jsonHelpDialog.addEventListener("click", (event) => {
		if (event.target === jsonHelpDialog) {
			jsonHelpDialog.close();
		}
	});

	xmlInput.addEventListener("change", () => {
		generateBtn.disabled = !xmlInput.files?.length;
		resultSection.style.display = "none";
		errorMsg.style.display = "none";
	});

	configInput.addEventListener("change", async () => {
		const file = configInput.files?.[0];
		if (!file) return;
		try {
			const opts = JSON.parse(await file.text()) as ResultListOptions;
			populateFormFromOptions(opts);
			errorMsg.style.display = "none";
		} catch {
			errorMsg.textContent = "Ugyldig JSON i konfigurasjonsfilen.";
			errorMsg.style.display = "";
		}
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

			// Build options from form fields
			const options = buildOptionsFromForm();

			// Parse and generate
			const resultList = parseIofXmlContent(xmlStr);
			const html = createResultListHtml(resultList, options, picoCSS);

			// Create download blob
			const blob = new Blob([html], { type: "text/html;charset=utf-8" });
			const url = URL.createObjectURL(blob);
			const filename = `${xmlFile.name.replace(/\.xml$/i, "")}.html`;
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
