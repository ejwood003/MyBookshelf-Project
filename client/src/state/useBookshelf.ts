import { useContext } from 'react'
import { BookshelfContext, type BookshelfContextValue } from './bookshelf-context'

export function useBookshelf(): BookshelfContextValue {
  const value = useContext(BookshelfContext)
  if (!value) {
    throw new Error('useBookshelf must be used inside a BookshelfProvider.')
  }
  return value
}
