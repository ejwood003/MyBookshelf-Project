import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { PickerMood, Recommendation, RecommendationSet } from '../api/types'
import { BackToShelf } from '../components/BackToShelf'
import { BookCover } from '../components/BookCover'
import { pluralize } from '../lib/format'
import { statusDotClass } from '../lib/status'
import { useBookshelf } from '../state/useBookshelf'
import './ChooseWhatToRead.css'

const MOODS: { value: PickerMood; label: string }[] = [
  { value: 'AnyMood', label: 'Anything' },
  { value: 'ShortRead', label: 'A short read' },
  { value: 'Familiar', label: 'Something familiar' },
  { value: 'Surprise', label: 'Surprise me' },
]

/**
 * Screen 2 — what should I read?
 *
 * A shelf can only show a reader what they own. This screen cuts the Want to Read
 * shelf down to three books and says why each one suits them today.
 */
export function ChooseWhatToRead() {
  const { setStatus, skipForNow } = useBookshelf()
  const navigate = useNavigate()

  const [mood, setMood] = useState<PickerMood>('AnyMood')
  const [picks, setPicks] = useState<RecommendationSet | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  // Which book is mid-action, and which action, so only the button that was pressed changes.
  const [busy, setBusy] = useState<{ id: string; action: 'start' | 'save' } | null>(null)

  const load = useCallback(async (nextMood: PickerMood) => {
    setLoading(true)
    try {
      setPicks(await api.getRecommendations(nextMood))
      setLoadError(null)
    } catch (caught) {
      setLoadError(caught instanceof ApiError ? caught.message : 'Could not pick any books.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(mood)
  }, [load, mood])

  const startReading = async (bookId: string) => {
    setBusy({ id: bookId, action: 'start' })
    await setStatus(bookId, 'CurrentlyReading')
    navigate('/reading')
  }

  const saveForLater = async (bookId: string) => {
    setBusy({ id: bookId, action: 'save' })
    await skipForNow(bookId)
    await load(mood)
    setBusy(null)
  }

  return (
    <main className="page choose">
      <header className="page-intro">
        <BackToShelf />
        <p className="page-intro__eyebrow">Your next book</p>
        <h1 className="page-intro__title">What should I read next?</h1>
        <p className="page-intro__lede">
          Three books from your own shelf, each with the reason it's worth starting today.
          Pick one, or put it back and see three more.
        </p>
      </header>

      <div className="choose__moods" role="group" aria-label="What are you in the mood for?">
        <span className="choose__moods-label">I'm in the mood for</span>
        {MOODS.map((option) => (
          <button
            key={option.value}
            className={`mood-chip ${mood === option.value ? 'mood-chip--active' : ''}`}
            aria-pressed={mood === option.value}
            onClick={() => setMood(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loadError && <p className="state-note state-note--error">{loadError}</p>}

      {picks && picks.wantToReadCount === 0 ? (
        <div className="state-note">
          <h2>Nothing waiting to be read</h2>
          <p>Every book you own is either open or finished. Time to visit a bookshop.</p>
          <p style={{ marginTop: '1rem' }}>
            <Link to="/" className="btn btn--secondary">
              Back to my shelf
            </Link>
          </p>
        </div>
      ) : (
        <>
          {picks && (
            /* One label for the whole set, rather than the same badge repeated on
               all three cards: these books all come off the Want to Read shelf. */
            <div className="choose__prompt-row">
              <p className="choose__prompt">{picks.prompt}</p>
              <span className="pill">
                <span className={statusDotClass('WantToRead')} aria-hidden="true" />
                From your Want to Read shelf
              </span>
            </div>
          )}

          <div className={`choose__picks ${loading ? 'choose__picks--loading' : ''}`}>
            {picks?.picks.map((pick) => (
              <PickCard
                key={pick.book.id}
                pick={pick}
                busyAction={busy?.id === pick.book.id ? busy.action : null}
                disabled={busy !== null}
                onStart={() => startReading(pick.book.id)}
                onSaveForLater={() => saveForLater(pick.book.id)}
              />
            ))}
          </div>

          {picks && (
            <footer className="choose__footer">
              <p>
                Narrowed down from the {pluralize(picks.wantToReadCount, 'book')} on your Want to
                Read shelf.
              </p>
              <div className="choose__footer-actions">
                <button
                  className="btn btn--secondary"
                  onClick={() => load(mood)}
                  disabled={loading || picks.wantToReadCount <= picks.picks.length}
                >
                  Show me three others
                </button>
                <Link to="/" className="btn btn--quiet">
                  Browse the whole shelf instead
                </Link>
              </div>
            </footer>
          )}
        </>
      )}
    </main>
  )
}

interface PickCardProps {
  pick: Recommendation
  busyAction: 'start' | 'save' | null
  disabled: boolean
  onStart: () => void
  onSaveForLater: () => void
}

function PickCard({ pick, busyAction, disabled, onStart, onSaveForLater }: PickCardProps) {
  const { book } = pick

  return (
    <article className="pick card">
      <div className="pick__cover">
        <BookCover book={book} size="lg" />
      </div>

      <h2 className="pick__title">{book.title}</h2>
      <p className="pick__author">{book.author}</p>

      <div className="pick__meta">
        <span className="pill pill--genre">{book.genre}</span>
        <span className="pill">{pluralize(book.pageCount, 'page')}</span>
        <span className="pill pill--gold">{pick.timeEstimate}</span>
      </div>

      {book.blurb && <p className="pick__blurb">{book.blurb}</p>}

      <div className="pick__reason">
        <p className="pick__reason-headline">{pick.reasonHeadline}</p>
        <p className="pick__reason-detail">{pick.reasonDetail}</p>
      </div>

      <div className="pick__actions">
        <button className="btn btn--primary" onClick={onStart} disabled={disabled}>
          {busyAction === 'start' ? 'Opening…' : "I'll read this"}
        </button>
        <button className="btn btn--quiet" onClick={onSaveForLater} disabled={disabled}>
          {busyAction === 'save' ? 'Putting it back…' : 'Save for later'}
        </button>
      </div>
    </article>
  )
}
