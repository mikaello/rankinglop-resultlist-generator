export type YearDistribution = {
	/** 21 years or more */
	adults?: number;
	/** 17-20 years */
	oldTeenager?: number;
	/** 13-16 years */
	youngTeenager?: number;
	/** 0-12 years */
	child?: number;
};

export type ResultListOptions = {
	/** Title of this race */
	title?: string;

	/** Date of the event in ISO 8601 date format (YYYY-MM-DD) */
	isoDate?: string;

	/** Location of the event */
	place?: string;

	/** Which map was used, e.g. "Sognsvann" */
	map?: string;

	/** Which club was organising the event, e.g. "OSI" */
	organiserClub?: string;

	/** Which persons were organising the event, e.g. "Bern Nordmand" */
	organiserPersons?: string[];

	/** Age distribution of participants */
	yearDistribution?: YearDistribution;

	startContingent?: { amount: number; quota: number }[];

	rentalDevices?: number;
};
