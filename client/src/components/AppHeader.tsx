import { NavLink } from 'react-router-dom'
import './AppHeader.css'

/** In the order a reader moves through them: what they have, what to read, what they're reading. */
const NAV_ITEMS = [
  { to: '/', label: 'My Books' },
  { to: '/choose', label: 'Choose What to Read' },
  { to: '/reading', label: 'Reading Progress' },
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
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
