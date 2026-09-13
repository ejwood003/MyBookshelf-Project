import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Book, Shelf } from '../api/types'
import { BookCover } from '../components/BookCover'
import { BookDetailDialog } from '../components/BookDetailDialog'
import { pluralize } from '../lib/format'
import { useBookshelf } from '../state/useBookshelf'
import './MyBooks.css'

/**
 * Screen 1 — what do I have?
 *
 * The shelves come first and the covers do the talking. The one prominent action
 * is the way out of the "I own too many books to choose" problem.
 */
export function MyBooks() {
  const { overview, loading } = useBookshelf()
  const [selected, setSelected] = useState<Book | null>(null)

  if (loading && !overview) {
    return <p className="state-note">Pulling your books off the shelf…</p>
  }

  if (!overview) {
    return (
      <div className="state-note state-note--error">
        <h2>Your shelf didn't load</h2>
        <p>Make sure the bookshelf server is running, then refresh.</p>
      </div>
    )
  }

  const { readerName, summary, goal, shelves } = overview

  return (
    <main className="page">
      <section className="hero">
        <p className="hero__eyebrow">Your collection</p>
        <h1>Everything on your shelf, {readerName}.</h1>
        <p className="hero__lede">
          {pluralize(summary.totalBooks, 'book')} in one place, sorted by where each one stands.
          When the waiting shelf feels like too much, let it narrow the choice down to three.
        </p>

        <div className="hero__actions">
          <Link to="/choose" className="btn btn--primary btn--large">
            Choose My Next Book
          </Link>
          {summary.currentlyReading > 0 && (
            <Link to="/reading" className="btn btn--secondary btn--large">
              Pick up where I left off
            </Link>
          )}
        </div>

        <dl className="hero__stats">
          <Stat value={summary.totalBooks} label="books owned" />
          <Stat value={summary.currentlyReading} label="open right now" />
          <Stat value={summary.wantToRead} label="waiting their turn" />
          <Stat value={goal.booksFinished} label={`finished in ${goal.year}`} />
        </dl>
      </section>

      {shelves.map((shelf) => (
        <ShelfSection key={shelf.status} shelf={shelf} onSelect={setSelected} />
      ))}

      {selected && <BookDetailDialog book={selected} onClose={() => setSelected(null)} />}
    </main>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="hero__stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function ShelfSection({ shelf, onSelect }: { shelf: Shelf; onSelect: (book: Book) => void }) {
  return (
    <section className="shelf">
      <div className="section-heading">
        <h2>{shelf.label}</h2>
        <span className="count">{pluralize(shelf.books.length, 'book')}</span>
      </div>
      <p className="section-caption">{shelf.caption}</p>

      {shelf.books.length === 0 ? (
        <p className="shelf__empty">{emptyShelfMessage(shelf)}</p>
      ) : (
        <div className="shelf__books">
          {shelf.books.map((book) => (
            <div key={book.id} className="shelf__slot">
              <button
                className="shelf__book"
                onClick={() => onSelect(book)}
                aria-label={`${book.title} by ${book.author}. ${describeForScreenReader(book)}`}
              >
                <BookCover book={book} showProgress={book.status === 'CurrentlyReading'} />
                {book.status === 'CurrentlyReading' && (
                  <span className="shelf__badge">{book.progressPercent}%</span>
                )}
                {book.status === 'Finished' && book.rating !== null && (
                  <span className="shelf__badge shelf__badge--rating">★ {book.rating}</span>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function emptyShelfMessage(shelf: Shelf): string {
  switch (shelf.status) {
    case 'CurrentlyReading':
      return "Nothing open at the moment. Choose your next book and it'll appear here."
    case 'WantToRead':
      return "Nothing waiting — you've read everything you own."
    default:
      return "Nothing finished yet. Your first one will land here."
  }
}

function describeForScreenReader(book: Book): string {
  switch (book.status) {
    case 'CurrentlyReading':
      return `${book.progressPercent} percent read.`
    case 'Finished':
      return book.rating ? `Finished, rated ${book.rating} out of 5.` : 'Finished.'
    default:
      return `${book.pageCount} pages, waiting to be read.`
  }
}
