/**
 * Ported from server/Services/RecommendationService.cs.
 *
 * Turns a Want to Read shelf into a short, explained shortlist. A shelf can only show a
 * reader what they own; the job here is to narrow that down to a handful of books and
 * say, in plain language, why each one is worth starting today.
 */

import {
  daysBetween,
  minutesRemaining,
  roundHalfToEven,
  today,
  toWireBook,
  type Book,
  type StoredBook,
} from './domain'
import { load } from './store'

export type PickerMood = 'AnyMood' | 'ShortRead' | 'Familiar' | 'Surprise'

export const PICKER_MOODS: PickerMood[] = ['AnyMood', 'ShortRead', 'Familiar', 'Surprise']

export interface Recommendation {
  book: Book
  reasonHeadline: string
  reasonDetail: string
  timeEstimate: string
}

export interface RecommendationSet {
  mood: PickerMood
  prompt: string
  picks: Recommendation[]
  wantToReadCount: number
}

/** How long a "save for later" keeps a book out of the running. */
const SKIP_COOLDOWN_MS = 12 * 60 * 60 * 1000

interface TasteProfile {
  finishedByGenre: Map<string, number>
  lovedBookByAuthor: Map<string, StoredBook>
  topGenre: string | null
}

function buildTasteProfile(books: StoredBook[]): TasteProfile {
  const finished = books.filter((book) => book.status === 'Finished')

  const finishedByGenre = new Map<string, number>()
  for (const book of finished) {
    finishedByGenre.set(book.genre, (finishedByGenre.get(book.genre) ?? 0) + 1)
  }

  // For each author, remember the single book the reader rated highest (4+ stars).
  const lovedBookByAuthor = new Map<string, StoredBook>()
  for (const book of finished) {
    if ((book.rating ?? 0) < 4) continue
    const existing = lovedBookByAuthor.get(book.author)
    if (!existing || (book.rating ?? 0) > (existing.rating ?? 0)) {
      lovedBookByAuthor.set(book.author, book)
    }
  }

  let topGenre: string | null = null
  let topCount = 0
  for (const [genre, count] of finishedByGenre) {
    if (count > topCount) {
      topGenre = genre
      topCount = count
    }
  }

  return { finishedByGenre, lovedBookByAuthor, topGenre }
}

// ---------------------------------------------------------------- scoring

/** Peaks around 300 pages — long enough to sink into, short enough to finish. */
function lengthComfort(pageCount: number): number {
  return Math.max(0, 30 - Math.abs(pageCount - 300) / 10)
}

function skipPenalty(book: StoredBook, now: number): number {
  if (book.lastSkippedAt === null) return 0
  return now - Date.parse(book.lastSkippedAt) < SKIP_COOLDOWN_MS ? 1000 : 0
}

function score(book: StoredBook, mood: PickerMood, taste: TasteProfile, todayIso: string): number {
  // A small jitter keeps "Show me another set" from returning an identical list when
  // several books score the same.
  const jitter = Math.random() * 4
  const daysWaiting = daysBetween(book.dateAdded, todayIso)
  const finishedInGenre = taste.finishedByGenre.get(book.genre) ?? 0
  const lovedAuthor = taste.lovedBookByAuthor.has(book.author)

  switch (mood) {
    // Shorter is better, with a firm preference for anything under ~250 pages.
    case 'ShortRead':
      return 400 - book.pageCount + jitter

    // Reward authors the reader has already enjoyed, then familiar genres.
    case 'Familiar':
      return (lovedAuthor ? 60 : 0) + finishedInGenre * 18 + jitter

    // Reward the genres the reader has spent the least time in.
    case 'Surprise':
      return 60 - finishedInGenre * 20 + (lovedAuthor ? -15 : 10) + jitter

    // Balanced: books that have waited a while, are a comfortable length, and lean
    // towards genres the reader tends to rate highly.
    default:
      return (
        Math.min(daysWaiting / 6, 40) + lengthComfort(book.pageCount) + finishedInGenre * 6 + jitter
      )
  }
}

// ---------------------------------------------------------------- phrasing

function stars(rating: number | null): string {
  if (rating === null) return 'a good review'
  return `${rating} star${rating === 1 ? '' : 's'}`
}

function startWithCapital(value: string): string {
  return value === '' ? value : value[0]!.toUpperCase() + value.slice(1)
}

/** Turns minutes into something a reader can weigh against their evening. */
function describeDuration(minutes: number): string {
  if (minutes < 60) return 'under an hour'

  const halves = roundHalfToEven(minutes / 30) / 2
  const whole = Math.floor(halves)
  const hasHalf = halves - whole >= 0.5

  if (whole === 0) return 'about half an hour'

  return hasHalf ? `about ${whole}\u00bd hours` : `about ${whole} hour${whole === 1 ? '' : 's'}`
}

/** Matches the "MMMM yyyy" format the C# version used, e.g. "September 2025". */
function formatMonthYear(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function promptFor(mood: PickerMood): string {
  switch (mood) {
    case 'ShortRead':
      return 'Books you could realistically finish soon.'
    case 'Familiar':
      return 'More of what you already know you love.'
    case 'Surprise':
      return 'Something different from your usual shelves.'
    default:
      return 'Three books from your shelf, narrowed down for you.'
  }
}

// ---------------------------------------------------------------- reasons

interface Reason {
  key: string
  headline: string
  detail: string
}

/**
 * Every true thing worth saying about this book, strongest first. A reason the reader
 * recognises as accurate is what makes the shortlist trustworthy.
 */
function buildReasons(
  book: StoredBook,
  mood: PickerMood,
  taste: TasteProfile,
  todayIso: string,
): Reason[] {
  const duration = describeDuration(minutesRemaining(book))
  const daysWaiting = daysBetween(book.dateAdded, todayIso)
  const genreLower = book.genre.toLowerCase()
  const finishedInGenre = taste.finishedByGenre.get(book.genre) ?? 0
  const reasons: Reason[] = []

  if (mood === 'Surprise') {
    reasons.push(
      finishedInGenre === 0
        ? {
            key: `genre-new:${book.genre}`,
            headline: "A genre you haven't tried",
            detail: `Nothing in ${book.genre} has made it off your shelf yet. This one is ${duration}.`,
          }
        : {
            key: `genre-light:${book.genre}`,
            headline: 'A change of pace',
            detail: `You've only finished ${finishedInGenre} ${genreLower} book${
              finishedInGenre === 1 ? '' : 's'
            }, so this would be a shift.`,
          },
    )
  } else {
    const loved = taste.lovedBookByAuthor.get(book.author)
    if (loved) {
      reasons.push({
        key: `author:${book.author}`,
        headline: 'By an author you loved',
        detail: `You gave ${loved.title} ${stars(loved.rating)}, and this is ${book.author} again.`,
      })
    }
  }

  if (mood === 'ShortRead') {
    // The headline is pitched at the actual length so three short books don't all come
    // back saying exactly the same thing.
    const headline =
      book.pageCount < 200
        ? 'An evening or two'
        : book.pageCount < 280
          ? 'Finishes quickly'
          : 'Shorter than most of your shelf'

    reasons.push({
      key: `short:${book.id}`,
      headline,
      detail: `${book.pageCount} pages, ${duration} — one of the quickest things waiting on your shelf.`,
    })
  }

  if (taste.topGenre !== null && book.genre === taste.topGenre) {
    reasons.push({
      key: 'top-genre',
      headline: 'Your most-read genre',
      detail: `${book.genre} is what you finish most — ${taste.finishedByGenre.get(
        taste.topGenre,
      )} of them so far.`,
    })
  }

  if (finishedInGenre === 0 && mood !== 'Surprise') {
    reasons.push({
      key: `genre-new:${book.genre}`,
      headline: "A corner of the shelf you haven't read",
      detail: `You own it but haven't finished any ${genreLower} yet.`,
    })
  }

  if (daysWaiting >= 90) {
    reasons.push({
      key: 'waiting',
      headline: 'Waiting the longest',
      detail: `It's been on your shelf since ${formatMonthYear(book.dateAdded)}. ${startWithCapital(
        duration,
      )} would clear it.`,
    })
  }

  if (book.pageCount <= 260) {
    reasons.push({
      key: 'short-generic',
      headline: 'A short one',
      detail: `${book.pageCount} pages, ${duration} — easy to actually finish this week.`,
    })
  }

  if (book.moods.length > 0) {
    reasons.push({
      key: `mood:${book.moods[0]}`,
      headline: `Something ${book.moods[0]}`,
      detail: `You shelved this one as ${book.moods.join(' and ')}. ${startWithCapital(duration)}.`,
    })
  }

  // Always last, and always unique, so the list can never come up empty.
  reasons.push({
    key: `default:${book.id}`,
    headline: 'Ready when you are',
    detail: `${book.pageCount} pages of ${genreLower}, ${duration}.`,
  })

  return reasons
}

function buildRecommendation(
  book: StoredBook,
  mood: PickerMood,
  taste: TasteProfile,
  todayIso: string,
  usedReasons: Set<string>,
): Recommendation {
  const candidates = buildReasons(book, mood, taste, todayIso)

  // Take the strongest reason that hasn't already been used in this set; the last
  // candidate is always book-specific, so there is guaranteed to be something left.
  const reason = candidates.find((c) => !usedReasons.has(c.key)) ?? candidates[candidates.length - 1]!
  usedReasons.add(reason.key)

  return {
    book: toWireBook(book),
    reasonHeadline: reason.headline,
    reasonDetail: reason.detail,
    timeEstimate: describeDuration(minutesRemaining(book)),
  }
}

export async function getRecommendations(mood: PickerMood, count = 3): Promise<RecommendationSet> {
  const bookshelf = await load()
  const unread = bookshelf.books.filter((book) => book.status === 'WantToRead')

  if (unread.length === 0) {
    return {
      mood,
      prompt:
        "There's nothing on your Want to Read shelf yet. Add a book and we'll help you start it.",
      picks: [],
      wantToReadCount: 0,
    }
  }

  const taste = buildTasteProfile(bookshelf.books)
  const now = Date.now()
  const todayIso = today()

  // Books the reader just passed on drop to the bottom rather than disappearing, so a
  // short shelf still fills all three slots.
  const scored = unread
    .map((book) => ({ book, value: score(book, mood, taste, todayIso) - skipPenalty(book, now) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, count)

  // Reasons are assigned in score order, and each one is used at most once per set.
  // Three cards that all say "by an author you loved" would not help anyone choose.
  const usedReasons = new Set<string>()

  return {
    mood,
    prompt: promptFor(mood),
    picks: scored.map((entry) => buildRecommendation(entry.book, mood, taste, todayIso, usedReasons)),
    wantToReadCount: unread.length,
  }
}
