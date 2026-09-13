/** Phrasings shared across the three screens, so the app speaks with one voice. */

/** Turns minutes into something a reader can weigh against their evening. */
export function describeDuration(minutes: number): string {
  if (minutes < 60) return 'under an hour'
  const halves = Math.round(minutes / 30) / 2
  const whole = Math.floor(halves)
  if (whole === 0) return 'about half an hour'
  return halves - whole >= 0.5 ? `about ${whole}½ hours` : `about ${whole} hour${whole === 1 ? '' : 's'}`
}

export function formatMonthYear(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export function formatDay(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function stars(rating: number | null): string {
  return rating === null ? '' : '★'.repeat(rating) + '☆'.repeat(5 - rating)
}
