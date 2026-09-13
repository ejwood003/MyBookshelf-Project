import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Book, GoalProgress } from '../api/types'
import { BookCover } from '../components/BookCover'
import { describeDuration, formatDay, pluralize, stars } from '../lib/format'
import { useBookshelf } from '../state/useBookshelf'
import './ReadingProgress.css'

/**
 * Screen 3 — what am I reading?
 *
 * What happens after a book is chosen: one honest number per book, kept up to date
 * with as little effort as possible, and a year's worth of finished books to show for it.
 */
export function ReadingProgress() {
  const { overview, loading } = useBookshelf()

  if (loading && !overview) {
    return <p className="state-note">Finding your bookmarks…</p>
  }

  if (!overview) {
    return (
      <div className="state-note state-note--error">
        <h2>Your progress didn't load</h2>
        <p>Make sure the bookshelf server is running, then refresh.</p>
      </div>
    )
  }

  const reading = overview.shelves.find((s) => s.status === 'CurrentlyReading')?.books ?? []
  const finished = overview.shelves.find((s) => s.status === 'Finished')?.books ?? []

  return (
    <main className="page reading">
      <header className="reading__header">
        <p className="hero__eyebrow">In progress</p>
        <h1>What you're reading</h1>
        <p className="hero__lede">
          {reading.length > 0
            ? `${pluralize(reading.length, 'book')} open, ${pluralize(
                reading.reduce((total, book) => total + book.pagesRemaining, 0),
                'page',
              )} left between them.`
            : 'Nothing open at the moment — a good problem to have.'}
        </p>
      </header>

      <div className="reading__layout">
        <section className="reading__current">
          {reading.length === 0 ? (
            <div className="reading__empty card">
              <h2>No book open right now</h2>
              <p>
                Pick one from your shelf and it'll show up here with a progress bar you can keep
                nudging along.
              </p>
              <Link to="/choose" className="btn btn--primary">
                Choose My Next Book
              </Link>
            </div>
          ) : (
            reading.map((book) => (
              <CurrentBookCard key={`${book.id}-${book.currentPage}`} book={book} />
            ))
          )}
        </section>

        <GoalCard goal={overview.goal} />
      </div>

      {finished.length > 0 && (
        <section className="reading__finished">
          <div className="section-heading">
            <h2>Recently finished</h2>
            <span className="count">{pluralize(finished.length, 'book')}</span>
          </div>
          <p className="section-caption">Proof that the shelf moves.</p>

          <ul className="finished-list">
            {finished.slice(0, 6).map((book) => (
              <li key={book.id} className="finished-item">
                <BookCover book={book} size="sm" />
                <div className="finished-item__text">
                  <p className="finished-item__title">{book.title}</p>
                  <p className="finished-item__author">{book.author}</p>
                  {book.rating !== null && (
                    <p className="finished-item__rating" aria-label={`Rated ${book.rating} of 5`}>
                      {stars(book.rating)}
                    </p>
                  )}
                  {book.dateFinished && (
                    <p className="finished-item__date">{formatDay(book.dateFinished)}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

/* ------------------------------------------------------------------ current book */

function CurrentBookCard({ book }: { book: Book }) {
  const { updateProgress, setStatus } = useBookshelf()
  const [page, setPage] = useState(book.currentPage)
  const [finishing, setFinishing] = useState(false)
  const [rating, setRating] = useState(0)
  const [saving, setSaving] = useState(false)

  const percent = Math.round((page / book.pageCount) * 100)
  const unsaved = page !== book.currentPage

  const save = async (nextPage: number) => {
    setSaving(true)
    await updateProgress(book.id, nextPage)
    setSaving(false)
  }

  const finish = async () => {
    setSaving(true)
    await setStatus(book.id, 'Finished', rating > 0 ? rating : undefined)
    setSaving(false)
  }

  return (
    <article className="current card">
      <div className="current__top">
        <BookCover book={book} size="md" showProgress />

        <div className="current__info">
          <h2>{book.title}</h2>
          <p className="current__author">{book.author}</p>
          <div className="current__meta">
            <span className="pill pill--genre">{book.genre}</span>
            <span className="pill pill--accent">Currently reading</span>
            {book.dateStarted && <span className="pill">Started {formatDay(book.dateStarted)}</span>}
          </div>
          <p className="current__remaining">
            {book.pagesRemaining > 0
              ? `${pluralize(book.pagesRemaining, 'page')} left — ${describeDuration(book.minutesRemaining)}.`
              : 'You’re on the last page.'}
          </p>
        </div>
      </div>

      <div className="current__progress">
        <div className="current__progress-head">
          <span className="current__percent">{percent}%</span>
          <span className="current__pages">
            page {page} of {book.pageCount}
          </span>
        </div>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>

        <label className="visually-hidden" htmlFor={`slider-${book.id}`}>
          Current page in {book.title}
        </label>
        <input
          id={`slider-${book.id}`}
          className="current__slider"
          type="range"
          min={0}
          max={book.pageCount}
          value={page}
          onChange={(event) => setPage(Number(event.target.value))}
        />
        <span className="current__slider-hint">Drag to where your bookmark is.</span>
      </div>

      {finishing ? (
        <div className="current__finish">
          <p className="current__finish-prompt">How was it?</p>
          <div className="star-picker" role="group" aria-label={`Rate ${book.title}`}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                className={`star-picker__star ${value <= rating ? 'star-picker__star--on' : ''}`}
                onClick={() => setRating(value)}
                aria-label={`${value} star${value === 1 ? '' : 's'}`}
                aria-pressed={value === rating}
              >
                ★
              </button>
            ))}
          </div>
          <div className="current__actions">
            <button className="btn btn--primary" onClick={finish} disabled={saving}>
              {rating > 0 ? 'Finish and save rating' : 'Finish without rating'}
            </button>
            <button className="btn btn--quiet" onClick={() => setFinishing(false)} disabled={saving}>
              Not yet
            </button>
          </div>
        </div>
      ) : (
        <div className="current__actions">
          <button
            className={`btn ${unsaved ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => save(page)}
            disabled={!unsaved || saving}
          >
            {saving ? 'Saving…' : unsaved ? `Save page ${page}` : 'Progress saved'}
          </button>
          <button
            className="btn btn--secondary"
            onClick={() => save(Math.min(page + 25, book.pageCount))}
            disabled={saving || page >= book.pageCount}
          >
            +25 pages
          </button>
          <button className="btn btn--quiet" onClick={() => setFinishing(true)} disabled={saving}>
            I finished it
          </button>
        </div>
      )}
    </article>
  )
}

/* ------------------------------------------------------------------ goal */

function GoalCard({ goal }: { goal: GoalProgress }) {
  const { setGoal } = useBookshelf()
  const [editing, setEditing] = useState(false)
  const [target, setTarget] = useState(goal.targetBooks)

  const radius = 52
  const circumference = 2 * Math.PI * radius

  return (
    <aside className="goal card">
      <h2 className="goal__title">{goal.year} reading goal</h2>

      <div className="goal__ring">
        <svg viewBox="0 0 128 128" role="img" aria-label={`${goal.percentComplete}% of your goal`}>
          <circle className="goal__ring-track" cx="64" cy="64" r={radius} />
          <circle
            className="goal__ring-fill"
            cx="64"
            cy="64"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - goal.percentComplete / 100)}
          />
        </svg>
        <div className="goal__ring-label">
          <span className="goal__count">{goal.booksFinished}</span>
          <span className="goal__of">of {goal.targetBooks}</span>
        </div>
      </div>

      <p className="goal__note">
        {goal.booksRemaining === 0
          ? 'Goal met. Anything else this year is a bonus.'
          : `${pluralize(goal.booksRemaining, 'book')} to go.`}
      </p>

      {editing ? (
        <div className="goal__edit">
          <label htmlFor="goal-target">Books this year</label>
          <input
            id="goal-target"
            type="number"
            min={1}
            max={500}
            value={target}
            onChange={(event) => setTarget(Number(event.target.value))}
          />
          <button
            className="btn btn--primary"
            onClick={async () => {
              await setGoal(target)
              setEditing(false)
            }}
          >
            Save goal
          </button>
        </div>
      ) : (
        <button className="btn btn--quiet goal__edit-toggle" onClick={() => setEditing(true)}>
          Change my goal
        </button>
      )}
    </aside>
  )
}
