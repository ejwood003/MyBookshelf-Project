import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Book } from '../api/types'
import { describeDuration, formatMonthYear, pluralize, stars } from '../lib/format'
import { useBookshelf } from '../state/useBookshelf'
import { BookCover } from './BookCover'
import './BookDetailDialog.css'

interface BookDetailDialogProps {
  book: Book
  onClose: () => void
}

/**
 * One book, up close. Which actions appear depends on the shelf the book is on,
 * so the reader is only ever offered the moves that make sense from here.
 */
export function BookDetailDialog({ book, onClose }: BookDetailDialogProps) {
  const { setStatus } = useBookshelf()
  const navigate = useNavigate()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const startReading = async () => {
    await setStatus(book.id, 'CurrentlyReading')
    onClose()
    navigate('/reading')
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button ref={closeButtonRef} className="dialog__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="dialog__body">
          <BookCover book={book} size="lg" showProgress={book.status === 'CurrentlyReading'} />

          <div className="dialog__details">
            <h2 id="book-dialog-title">{book.title}</h2>
            <p className="dialog__author">{book.author}</p>

            <div className="dialog__meta">
              <span className="pill pill--genre">{book.genre}</span>
              <span className="pill">{pluralize(book.pageCount, 'page')}</span>
              {book.moods.map((mood) => (
                <span key={mood} className="pill">
                  {mood}
                </span>
              ))}
            </div>

            {book.blurb && <p className="dialog__blurb">{book.blurb}</p>}

            <p className="dialog__status">{describeShelfPosition(book)}</p>

            <div className="dialog__actions">
              {book.status === 'WantToRead' && (
                <button className="btn btn--primary" onClick={startReading}>
                  Start reading this
                </button>
              )}

              {book.status === 'CurrentlyReading' && (
                <>
                  <button
                    className="btn btn--primary"
                    onClick={() => {
                      onClose()
                      navigate('/reading')
                    }}
                  >
                    Update my progress
                  </button>
                  <button
                    className="btn btn--secondary"
                    onClick={() => setStatus(book.id, 'Finished').then(onClose)}
                  >
                    Mark as finished
                  </button>
                </>
              )}

              {book.status === 'Finished' && (
                <button className="btn btn--secondary" onClick={startReading}>
                  Read it again
                </button>
              )}

              {book.status !== 'WantToRead' && (
                <button
                  className="btn btn--quiet"
                  onClick={() => setStatus(book.id, 'WantToRead').then(onClose)}
                >
                  Move back to Want to Read
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** A plain sentence about where this book stands, rather than a status label. */
function describeShelfPosition(book: Book): string {
  if (book.status === 'CurrentlyReading') {
    return `You're on page ${book.currentPage} of ${book.pageCount} — ${book.progressPercent}% in, ${describeDuration(book.minutesRemaining)} to go.`
  }

  if (book.status === 'Finished') {
    const when = book.dateFinished ? ` in ${formatMonthYear(book.dateFinished)}` : ''
    const rated = book.rating ? ` You rated it ${stars(book.rating)}.` : ''
    return `Finished${when}.${rated}`
  }

  return `On your Want to Read shelf since ${formatMonthYear(book.dateAdded)}. ${describeDuration(book.minutesRemaining).replace(/^about/, 'About')} from start to finish.`
}
