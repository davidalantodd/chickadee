// How far back to look for observations. eBird accepts 1-30 days; the server accepts only these values so cached
// responses get reused.
export const DAYS_BACK = [1, 3, 7, 14, 30]
export const DEFAULT_DAYS_BACK = 30

export const daysLabel = (days) => (days === 1 ? '1 day' : `${days} days`)

// " in the last 7 days" / " in the last day", for the result count
export const daysSuffix = (days) => (days === 1 ? ' in the last day' : ` in the last ${days} days`)

// "Last 7 days" / "Last day", for the collapsed filter summary
export const daysSummary = (days) => (days === 1 ? 'Last day' : `Last ${days} days`)

// A days value from the URL, or the default when it's missing or not one of the choices
export const parseDaysBack = (value) => (DAYS_BACK.includes(Number(value)) ? Number(value) : DEFAULT_DAYS_BACK)
