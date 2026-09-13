/** Ported from server/Services/BookshelfService.cs. */

import {
  applyStatusRules,
  newBookId,
  order,
  pagesRemaining,
  pickPalette,
  roundHalfToEven,
  toWireBook,
  today,
  yearOf,
  type Book,
  type Bookshelf,
  type ReadingStatus,
  type StoredBook,
} from './domain'
import { load, mutate } from './store'

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

const SHELF_COPY: { status: ReadingStatus; label: string; caption: string }[] = [
  {
    status: 'CurrentlyReading',
    label: 'Currently Reading',
    caption: 'Open right now — pick up where you left off.',
  },
  {
    status: 'WantToRead',
    label: 'Want to Read',
    caption: 'Bought, borrowed, and waiting for their turn.',
  },
  { status: 'Finished', label: 'Finished', caption: 'Read and shelved. Your year so far.' },
]

function buildGoal(bookshelf: Bookshelf): GoalProgress {
  const { year, targetBooks } = bookshelf.goal
  const booksFinished = bookshelf.books.filter(
    (book) => book.status === 'Finished' && book.dateFinished !== null && yearOf(book.dateFinished) === year,
  ).length

  const percentComplete =
    targetBooks <= 0
      ? 0
      : Math.min(Math.max(roundHalfToEven((booksFinished * 100) / targetBooks), 0), 100)

  return {
    year,
    targetBooks,
    booksFinished,
    percentComplete,
    booksRemaining: Math.max(targetBooks - booksFinished, 0),
  }
}

export async function getOverview(): Promise<ShelfOverview> {
  const bookshelf = await load()
  const books = bookshelf.books

  return {
    readerName: bookshelf.readerName,
    shelves: SHELF_COPY.map(({ status, label, caption }) => ({
      status,
      label,
      caption,
      books: order(books.filter((book) => book.status === status)).map(toWireBook),
    })),
    summary: {
      totalBooks: books.length,
      currentlyReading: books.filter((book) => book.status === 'CurrentlyReading').length,
      wantToRead: books.filter((book) => book.status === 'WantToRead').length,
      finished: books.filter((book) => book.status === 'Finished').length,
      pagesInProgress: books
        .filter((book) => book.status === 'CurrentlyReading')
        .reduce((total, book) => total + pagesRemaining(book), 0),
    },
    goal: buildGoal(bookshelf),
  }
}

export async function getBooks(status: ReadingStatus | null): Promise<Book[]> {
  const bookshelf = await load()
  const filtered = status === null ? bookshelf.books : bookshelf.books.filter((b) => b.status === status)
  return order(filtered).map(toWireBook)
}

export async function getBook(id: string): Promise<Book | null> {
  const bookshelf = await load()
  const book = bookshelf.books.find((candidate) => candidate.id === id)
  return book ? toWireBook(book) : null
}

export interface AddBookInput {
  title: string
  author: string
  genre: string
  pageCount: number
  status: ReadingStatus
  blurb: string
}

export async function addBook(input: AddBookInput): Promise<Book> {
  const todayIso = today()

  return mutate((bookshelf) => {
    const book: StoredBook = {
      id: newBookId(),
      title: input.title.trim(),
      author: input.author.trim(),
      genre: input.genre.trim() === '' ? 'Unsorted' : input.genre.trim(),
      pageCount: input.pageCount,
      status: input.status,
      currentPage: 0,
      blurb: input.blurb.trim(),
      moods: [],
      coverPalette: pickPalette(input.title),
      dateAdded: todayIso,
      dateStarted: null,
      dateFinished: null,
      rating: null,
      lastSkippedAt: null,
    }

    applyStatusRules(book, input.status, null, todayIso)
    bookshelf.books.push(book)
    return toWireBook(book)
  })
}

/** Applies `change` to one book and persists, or returns null when the id is unknown. */
async function updateBook(id: string, change: (book: StoredBook) => void): Promise<Book | null> {
  return mutate((bookshelf) => {
    const book = bookshelf.books.find((candidate) => candidate.id === id)
    if (!book) return null
    change(book)
    return toWireBook(book)
  })
}

export async function updateProgress(id: string, currentPage: number): Promise<Book | null> {
  const todayIso = today()

  return updateBook(id, (book) => {
    book.currentPage = Math.min(Math.max(currentPage, 0), book.pageCount)

    // The page number itself decides which shelf the book belongs on, so the reader
    // never has to update a status and a page count separately.
    if (book.currentPage >= book.pageCount && book.pageCount > 0) {
      applyStatusRules(book, 'Finished', book.rating, todayIso)
    } else if (book.currentPage > 0) {
      applyStatusRules(book, 'CurrentlyReading', book.rating, todayIso)
    } else if (book.status === 'Finished') {
      applyStatusRules(book, 'CurrentlyReading', book.rating, todayIso)
    }
  })
}

export async function setStatus(
  id: string,
  status: ReadingStatus,
  rating: number | null,
): Promise<Book | null> {
  const todayIso = today()
  return updateBook(id, (book) => applyStatusRules(book, status, rating, todayIso))
}

export async function skipForNow(id: string): Promise<Book | null> {
  return updateBook(id, (book) => {
    book.lastSkippedAt = new Date().toISOString()
  })
}

export async function removeBook(id: string): Promise<boolean> {
  return mutate((bookshelf) => {
    const index = bookshelf.books.findIndex((candidate) => candidate.id === id)
    if (index === -1) return false
    bookshelf.books.splice(index, 1)
    return true
  })
}

export async function getGoal(): Promise<GoalProgress> {
  return buildGoal(await load())
}

export async function setGoal(targetBooks: number): Promise<GoalProgress> {
  return mutate((bookshelf) => {
    bookshelf.goal.targetBooks = targetBooks
    return buildGoal(bookshelf)
  })
}
