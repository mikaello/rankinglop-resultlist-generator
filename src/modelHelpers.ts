import type { ClassResult, Organisation, Person } from "./model.ts";

export const getClassName = (classResult: ClassResult): string => {
	return (classResult.clazz?.name ?? "").trim();
};

export const getCourseLengthKm = (classResult: ClassResult): number => {
	const length =
		classResult.course != null ? (classResult.course[0].length ?? 0) : 0;
	return Number((length / 1000).toFixed(1));
};

export const getName = (person: Person | undefined): string => {
	return `${person?.name?.given ?? ""} ${person?.name?.family ?? ""}`.trim();
};

export const getOrganisationName = (
	organisation: Organisation | undefined,
): string => {
	const name =
		organisation?.name ?? organisation?.mediaName ?? organisation?.shortName;
	return (name ?? "").trim();
};

/**
 * Format seconds as H:MM:SS or M:SS
 */
export const formatTime = (seconds: number): string => {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	const mm = String(m).padStart(2, "0");
	const ss = String(s).padStart(2, "0");
	return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
};

/**
 * Format a "time behind" value as +M:SS or +H:MM:SS (empty string for winner)
 */
export const formatTimeBehind = (seconds: number): string => {
	if (seconds <= 0) return "";
	return `+${formatTime(seconds)}`;
};
