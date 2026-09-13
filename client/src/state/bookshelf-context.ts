import { createContext } from 'react'
import type { Book, ReadingStatus, ShelfOverview } from '../api/types'

export interface BookshelfContextValue {
  overview: ShelfOverview | null
  loading: boolean
  error: string | null
  /** Every book keyed by id, so a screen can look one up without another request. */
  booksById: Map<string, Book>
  refresh: () => Promise<void>
  updateProgress: (id: string, currentPage: number) => Promise<void>
  setStatus: (id: string, status: ReadingStatus, rating?: number) => Promise<void>
  skipForNow: (id: string) => Promise<void>
  setGoal: (targetBooks: number) => Promise<void>
}

export const BookshelfContext = createContext<BookshelfContextValue | null>(null)
