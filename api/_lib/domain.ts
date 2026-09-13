/**
 * The domain that used to live in server/Models and server/Services/BookshelfService.cs.
 *
 * The React client is unchanged, so every shape here has to serialise to exactly what
 * ASP.NET was sending: camelCase keys, enums as names, and dates as bare yyyy-MM-dd
 * strings (the client builds `new Date(`${isoDate}T00:00:00`)` from them).
 */

export type ReadingStatus = 'CurrentlyReading' | 'WantToRead' | 'Finished'

export const READING_STATUSES: ReadingStatus[] = ['CurrentlyReading', 'WantToRead', 'Finished']

/** Average minutes an unhurried reader spends on one page. */
export const MINUTES_PER_PAGE = 1.2

/** A book as it is persisted. The three computed fields are added on the way out. */
export interface StoredBook {
  id: string
  title: string
  author: string
  genre: string
  pageCount: number
  status: ReadingStatus
  currentPage: number
  blurb: string
  moods: string[]
  coverPalette: string
  dateAdded: string
  dateStarted: string | null
  dateFinished: string | null
  rating: number | null
  lastSkippedAt: string | null
}

/** A book as the client receives it. */
export interface Book extends StoredBook {
  progressPercent: number
  pagesRemaining: number
  minutesRemaining: number
}

export interface ReadingGoal {
  year: number
  targetBooks: number
}

export interface Bookshelf {
  readerName: string
  goal: ReadingGoal
  books: StoredBook[]
}

// ---------------------------------------------------------------- dates

/** yyyy-MM-dd in local time, matching how DateOnly was serialised. */
export function toIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function today(): string {
  return toIsoDate(new Date())
}

export function daysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toIsoDate(date)
}

/** Whole days between two yyyy-MM-dd values, standing in for DateOnly.DayNumber. */
export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T00:00:00Z`)
  const to = Date.parse(`${toIso}T00:00:00Z`)
  return Math.round((to - from) / 86_400_000)
}

export function yearOf(isoDate: string): number {
  return Number(isoDate.slice(0, 4))
}

// ---------------------------------------------------------------- computed fields

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Math.Round in .NET breaks ties towards the even number; JavaScript's Math.round breaks
 * them upwards. A book on page 1 of 8 is 12.5% read, which the two would report
 * differently, so every rounded field the client displays goes through this.
 */
export function roundHalfToEven(value: number): number {
  const floor = Math.floor(value)
  const remainder = value - floor
  if (remainder > 0.5) return floor + 1
  if (remainder < 0.5) return floor
  return floor % 2 === 0 ? floor : floor + 1
}

export function progressPercent(book: StoredBook): number {
  if (book.pageCount <= 0) return 0
  return clamp(roundHalfToEven((book.currentPage * 100) / book.pageCount), 0, 100)
}

export function pagesRemaining(book: StoredBook): number {
  return Math.max(book.pageCount - book.currentPage, 0)
}

export function minutesRemaining(book: StoredBook): number {
  return roundHalfToEven(pagesRemaining(book) * MINUTES_PER_PAGE)
}

export function toWireBook(book: StoredBook): Book {
  return {
    ...book,
    progressPercent: progressPercent(book),
    pagesRemaining: pagesRemaining(book),
    minutesRemaining: minutesRemaining(book),
  }
}

// ---------------------------------------------------------------- status rules

/**
 * Keeps a book's dates, page count and status consistent with each other. Every shelf
 * change goes through here so the three screens can never disagree.
 */
export function applyStatusRules(
  book: StoredBook,
  status: ReadingStatus,
  rating: number | null,
  todayIso: string,
): void {
  switch (status) {
    case 'WantToRead':
      book.currentPage = 0
      book.dateStarted = null
      book.dateFinished = null
      break

    case 'CurrentlyReading':
      // Re-reading a finished book starts the progress bar over.
      if (book.status === 'Finished' || book.currentPage >= book.pageCount) {
        book.currentPage = 0
      }
      book.dateStarted ??= todayIso
      book.dateFinished = null
      book.lastSkippedAt = null
      break

    case 'Finished':
      book.currentPage = book.pageCount
      book.dateStarted ??= todayIso
      book.dateFinished = todayIso
      book.lastSkippedAt = null
      if (rating !== null) book.rating = rating
      break
  }

  book.status = status
}

// ---------------------------------------------------------------- ordering

/** Descending, with nulls last — how OrderByDescending treated a null DateOnly?. */
function descendingNullsLast(a: string | null, b: string | null): number {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1
  return a < b ? 1 : -1
}

/** Within a shelf, show the most relevant books first. */
export function order(books: StoredBook[]): StoredBook[] {
  return [...books].sort((a, b) => {
    const byFinished = descendingNullsLast(
      a.status === 'Finished' ? a.dateFinished : null,
      b.status === 'Finished' ? b.dateFinished : null,
    )
    if (byFinished !== 0) return byFinished

    const aProgress = a.status === 'CurrentlyReading' ? progressPercent(a) : 0
    const bProgress = b.status === 'CurrentlyReading' ? progressPercent(b) : 0
    if (aProgress !== bProgress) return bProgress - aProgress

    const byAdded = descendingNullsLast(a.dateAdded, b.dateAdded)
    if (byAdded !== 0) return byAdded

    return a.title.localeCompare(b.title)
  })
}

// ---------------------------------------------------------------- new books

const PALETTES = [
  'clay', 'sage', 'indigo', 'plum', 'amber', 'teal',
  'rust', 'slate', 'moss', 'cocoa', 'sand', 'ink',
]

/**
 * Derives a stable cover colour from the title so a new book looks at home on the shelf.
 * Math.imul reproduces the 32-bit overflow the C# version relied on.
 */
export function pickPalette(title: string): string {
  let hash = 7
  for (let i = 0; i < title.length; i++) {
    hash = (Math.imul(hash, 31) + title.charCodeAt(i)) | 0
  }
  return PALETTES[Math.abs(hash) % PALETTES.length]!
}

export function newBookId(): string {
  return globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 8)
}
