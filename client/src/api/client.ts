import type {
  Book,
  GoalProgress,
  PickerMood,
  ReadingStatus,
  RecommendationSet,
  ShelfOverview,
} from './types'

/** In dev the Vite proxy forwards /api to the ASP.NET app; in production they share an origin. */
const BASE_URL = '/api'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
  } catch {
    throw new ApiError("Couldn't reach the bookshelf server. Is it running on port 5229?", 0)
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

/** ASP.NET returns ProblemDetails for both validation failures and explicit errors. */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const problem = await response.json()
    if (problem?.errors && typeof problem.errors === 'object') {
      const first = Object.values(problem.errors).flat()[0]
      if (typeof first === 'string') return first
    }
    if (typeof problem?.detail === 'string') return problem.detail
    if (typeof problem?.title === 'string') return problem.title
  } catch {
    // Fall through to the generic message below.
  }
  return `Something went wrong (${response.status}).`
}

export const api = {
  getOverview: () => request<ShelfOverview>('/shelf'),

  getRecommendations: (mood: PickerMood, count = 3) =>
    request<RecommendationSet>(`/recommendations?mood=${mood}&count=${count}`),

  updateProgress: (id: string, currentPage: number) =>
    request<Book>(`/books/${id}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ currentPage }),
    }),

  setStatus: (id: string, status: ReadingStatus, rating?: number) =>
    request<Book>(`/books/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, rating: rating ?? null }),
    }),

  skipForNow: (id: string) => request<Book>(`/books/${id}/skip`, { method: 'POST' }),

  setGoal: (targetBooks: number) =>
    request<GoalProgress>('/shelf/goal', {
      method: 'PUT',
      body: JSON.stringify({ targetBooks }),
    }),

  addBook: (book: {
    title: string
    author: string
    genre: string
    pageCount: number
    status: ReadingStatus
    blurb: string
  }) => request<Book>('/books', { method: 'POST', body: JSON.stringify(book) }),
}
