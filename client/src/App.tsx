import { Navigate, Route, Routes } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { ChooseWhatToRead } from './pages/ChooseWhatToRead'
import { MyBooks } from './pages/MyBooks'
import { ReadingProgress } from './pages/ReadingProgress'
import { useBookshelf } from './state/useBookshelf'

export function App() {
  const { error } = useBookshelf()

  return (
    <>
      <AppHeader />
      {error && (
        <div className="app-error" role="alert">
          {error}
        </div>
      )}
      <Routes>
        <Route path="/" element={<MyBooks />} />
        <Route path="/choose" element={<ChooseWhatToRead />} />
        <Route path="/reading" element={<ReadingProgress />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
