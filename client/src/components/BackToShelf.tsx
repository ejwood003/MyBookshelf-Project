import { Link } from 'react-router-dom'

/**
 * The way home, in the same words and the same spot on every screen that isn't
 * the shelf. The nav offers the same trip, but a reader shouldn't have to find it.
 */
export function BackToShelf() {
  return (
    <Link to="/" className="back-link">
      <span className="back-link__arrow" aria-hidden="true">
        &larr;
      </span>
      Back to My Books
    </Link>
  )
}
