import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError } from '../api/client'
import type { Book, ReadingStatus, ShelfOverview } from '../api/types'
import { BookshelfContext, type BookshelfContextValue } from './bookshelf-context'

/**
 * Holds the one collection the whole app reads from. Every mutation re-fetches the
 * overview so the three screens can never show different versions of the same shelf.
 */
export function BookshelfProvider({ children }: { children: ReactNode }) {
  const [overview, setOverview] = useState<ShelfOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setOverview(await api.getOverview())
      setError(null)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not load your bookshelf.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  /** Runs a change against the API, then reloads the shelf. Errors surface as a banner. */
  const mutate = useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        await action()
        setError(null)
      } catch (caught) {
        setError(caught instanceof ApiError ? caught.message : 'That change did not save.')
      }
      await refresh()
    },
    [refresh],
  )

  const value = useMemo<BookshelfContextValue>(() => {
    const booksById = new Map<string, Book>()
    for (const shelf of overview?.shelves ?? []) {
      for (const book of shelf.books) booksById.set(book.id, book)
    }

    return {
      overview,
      loading,
      error,
      booksById,
      refresh,
      updateProgress: (id, currentPage) => mutate(() => api.updateProgress(id, currentPage)),
      setStatus: (id, status: ReadingStatus, rating) => mutate(() => api.setStatus(id, status, rating)),
      skipForNow: (id) => mutate(() => api.skipForNow(id)),
      setGoal: (targetBooks) => mutate(() => api.setGoal(targetBooks)),
    }
  }, [overview, loading, error, refresh, mutate])

  return <BookshelfContext.Provider value={value}>{children}</BookshelfContext.Provider>
}
