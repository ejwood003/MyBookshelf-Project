import type { ReadingStatus } from '../api/types'

/**
 * Maps a reading status to the colour tone that represents it everywhere in the app.
 * Keeping this in one place is what stops the three screens from drifting apart.
 */
export const STATUS_TONE: Record<ReadingStatus, 'waiting' | 'reading' | 'finished'> = {
  WantToRead: 'waiting',
  CurrentlyReading: 'reading',
  Finished: 'finished',
}

export function statusDotClass(status: ReadingStatus): string {
  return `status-dot status-dot--${STATUS_TONE[status]}`
}
