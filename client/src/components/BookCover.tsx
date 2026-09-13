import type { Book } from '../api/types'
import './BookCover.css'

type CoverSize = 'sm' | 'md' | 'lg'

interface BookCoverProps {
  book: Book
  size?: CoverSize
  /** Draws a progress band across the bottom of the cover. */
  showProgress?: boolean
}

/**
 * Covers are drawn in CSS from the book's palette rather than loaded as images, so the
 * shelf always renders instantly and a newly added book never shows a broken placeholder.
 */
export function BookCover({ book, size = 'md', showProgress = false }: BookCoverProps) {
  const titleLength = book.title.length

  return (
    <div className={`cover cover--${size} palette-${book.coverPalette}`} aria-hidden="true">
      <div className="cover__spine" />
      <div className="cover__face">
        <span className="cover__rule" />
        <span
          className={`cover__title ${titleLength > 30 ? 'cover__title--long' : ''}`}
          // Long titles get a tighter line so they stay inside the cover.
          style={titleLength > 46 ? { fontSize: '0.82em' } : undefined}
        >
          {book.title}
        </span>
        <span className="cover__rule cover__rule--short" />
        <span className="cover__author">{book.author}</span>
      </div>
      <div className="cover__glare" />
      {showProgress && book.progressPercent > 0 && (
        <div className="cover__progress">
          <div className="cover__progress-fill" style={{ width: `${book.progressPercent}%` }} />
        </div>
      )}
    </div>
  )
}
