/** Mirrors the models in server/Models. Enums are sent as names, not numbers. */

export type ReadingStatus = 'CurrentlyReading' | 'WantToRead' | 'Finished'

export type PickerMood = 'AnyMood' | 'ShortRead' | 'Familiar' | 'Surprise'

export interface Book {
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
  progressPercent: number
  pagesRemaining: number
  minutesRemaining: number
}

export interface Shelf {
  status: ReadingStatus
  label: string
  caption: string
  books: Book[]
}

export interface CollectionSummary {
  totalBooks: number
  currentlyReading: number
  wantToRead: number
  finished: number
  pagesInProgress: number
}

export interface GoalProgress {
  year: number
  targetBooks: number
  booksFinished: number
  percentComplete: number
  booksRemaining: number
}

export interface ShelfOverview {
  readerName: string
  shelves: Shelf[]
  summary: CollectionSummary
  goal: GoalProgress
}

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
