import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { BookshelfProvider } from './state/BookshelfProvider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <BookshelfProvider>
        <App />
      </BookshelfProvider>
    </BrowserRouter>
  </StrictMode>,
)
