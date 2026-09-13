import { NavLink } from 'react-router-dom'
import './AppHeader.css'

/**
 * The nav doubles as the story of the app: what do I have, what should I read,
 * what am I reading. The questions are the labels a reader actually has in mind.
 */
const NAV_ITEMS = [
  { to: '/', label: 'My Books', question: 'What do I have?' },
  { to: '/choose', label: 'Choose What to Read', question: 'What should I read?' },
  { to: '/reading', label: 'Reading Progress', question: "What am I reading?" },
]

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <NavLink to="/" className="app-header__brand">
          <span className="app-header__mark" aria-hidden="true">
            <i /> <i /> <i />
          </span>
          My Bookshelf
        </NavLink>

        <nav className="app-header__nav" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `app-header__link ${isActive ? 'app-header__link--active' : ''}`
              }
            >
              <span className="app-header__link-label">{item.label}</span>
              <span className="app-header__link-question">{item.question}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
