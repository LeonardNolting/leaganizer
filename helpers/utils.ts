export const ordinalSuffix = number => {
	switch (number % 10) {
		case 1:
			return "st"
		case 2:
			return "nd"
		case 3:
			return "rd"
		default:
			return "th"
	}
}
export const ordinal = number => number + ordinalSuffix(number)

export const dateToTimeString = (date: Date) =>
	date.toLocaleTimeString("en-US", {
		timeZone: "America/New_York",
		hour: "2-digit",
		minute: "2-digit"
	}) + " (America/New_York) / " +
	date.toLocaleTimeString("en-GB", {
		timeZone: "UTC",
		hour: "2-digit",
		minute: "2-digit"
	}) + " (UTC)"

export const dateToMonthDayString = (date: Date) => date.toLocaleDateString("en-US", {
	weekday: "long",
	month: "long",
	day: "numeric"
}) + ordinalSuffix(date.toLocaleDateString("en-US", {
	day: "numeric"
}))

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)