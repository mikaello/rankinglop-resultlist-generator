export interface Id {
	value?: string;
	type?: string;
}

export interface PersonName {
	family?: string;
	given?: string;
}

export interface Person {
	name?: PersonName;
}

export interface Organisation {
	id?: Id;
	name?: string;
	shortName?: string;
	mediaName?: string;
}

export interface Event {
	id?: Id;
	name?: string;
	startTime?: { date?: string; time?: string };
	endTime?: { date?: string; time?: string };
}

export interface Course {
	id?: Id;
	name?: string;
	length?: number;
	climb?: number;
	numberOfControls?: number;
	raceNumber?: number;
}

export type ResultStatus =
	| "OK"
	| "MissingPunch"
	| "Disqualified"
	| "DidNotFinish"
	| "OverTime"
	| "SportingWithdrawal"
	| "NotCompeting"
	| "DidNotStart"
	| "DidNotEnter"
	| "Cancelled"
	| "Inactive"
	| "Active";

export interface SplitTime {
	controlCode?: string;
	time?: number;
	status?: string;
}

export interface Result {
	startTime?: string;
	finishTime?: string;
	time?: number;
	timeBehind?: number;
	position?: number;
	status?: ResultStatus;
	splitTime?: SplitTime[];
}

export interface PersonResult {
	person?: Person;
	organisation?: Organisation;
	result?: Result[];
}

export interface ClassResult {
	clazz?: { id?: Id; name?: string };
	course?: Course[];
	personResult?: PersonResult[];
}

export interface ResultList {
	iofVersion?: string;
	createTime?: string;
	creator?: string;
	event?: Event;
	classResult?: ClassResult[];
	status?: string;
}
