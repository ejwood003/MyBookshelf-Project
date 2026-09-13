/**
 * Shared plumbing for the function handlers.
 *
 * The client reads failures with `problem.errors`, then `problem.detail`, then
 * `problem.title` — the ProblemDetails shape ASP.NET produced. Error bodies here keep
 * that shape so client/src/api/client.ts keeps rendering useful messages.
 */

import { READING_STATUSES, type ReadingStatus } from './domain'
import { PICKER_MOODS, type PickerMood } from './recommend'

/**
 * The slice of Vercel's request and response objects these handlers touch.
 *
 * Declared here rather than imported from @vercel/node: that package exists to *build*
 * functions, and depending on it just for two type names pulls esbuild into the install,
 * whose postinstall script npm now blocks by default.
 */
export interface VercelRequest {
  method?: string
  query: Record<string, string | string[] | undefined>
  body?: unknown
}

export interface VercelResponse {
  status(code: number): VercelResponse
  json(body: unknown): VercelResponse
  setHeader(name: string, value: string): void
  end(): void
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'
type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void

export function json(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).json(body)
}

export function problem(res: VercelResponse, status: number, detail: string, title = 'Error'): void {
  res.status(status).json({ title, status, detail })
}

export function notFound(res: VercelResponse, detail: string): void {
  problem(res, 404, detail, 'Not Found')
}

export type ValidationErrors = Record<string, string[]>

export function validationProblem(res: VercelResponse, errors: ValidationErrors): void {
  res.status(400).json({
    title: 'One or more validation errors occurred.',
    status: 400,
    errors,
  })
}

/** Dispatches on HTTP method and turns anything thrown into a 500. */
export function route(handlers: Partial<Record<Method, Handler>>): Handler {
  return async (req, res) => {
    const handler = handlers[(req.method ?? 'GET') as Method]

    if (!handler) {
      res.setHeader('Allow', Object.keys(handlers).join(', '))
      problem(res, 405, `${req.method} is not supported here.`, 'Method Not Allowed')
      return
    }

    try {
      await handler(req, res)
    } catch (error) {
      console.error(error)
      problem(res, 500, 'Something went wrong on the bookshelf server.', 'Server Error')
    }
  }
}

// ---------------------------------------------------------------- parameters

export function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function routeId(req: VercelRequest): string {
  return firstValue(req.query.id) ?? ''
}

export function parseStatus(value: string | undefined): ReadingStatus | null | 'invalid' {
  if (value === undefined || value === '') return null
  return READING_STATUSES.includes(value as ReadingStatus) ? (value as ReadingStatus) : 'invalid'
}

export function parseMood(value: string | undefined): PickerMood {
  if (value === undefined || value === '') return 'AnyMood'
  return PICKER_MOODS.includes(value as PickerMood) ? (value as PickerMood) : 'AnyMood'
}

/** Vercel parses JSON bodies already; this just narrows the type. */
export function body(req: VercelRequest): Record<string, unknown> {
  const parsed = req.body
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>
  }
  return {}
}

// ---------------------------------------------------------------- validation
// Mirrors the DataAnnotations on server/Models/Requests.cs, including the messages.

export function requireInt(
  errors: ValidationErrors,
  field: string,
  value: unknown,
  { min, max, message }: { min: number; max: number; message: string },
): number {
  const parsed = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < min || parsed > max) {
    ;(errors[field] ??= []).push(message)
    return min
  }

  return parsed
}

export function requireText(
  errors: ValidationErrors,
  field: string,
  value: unknown,
  { maxLength, message }: { maxLength: number; message: string },
): string {
  const text = typeof value === 'string' ? value.trim() : ''

  if (text === '') {
    ;(errors[field] ??= []).push(message)
    return ''
  }

  if (text.length > maxLength) {
    ;(errors[field] ??= []).push(`${field} must be ${maxLength} characters or fewer.`)
    return text.slice(0, maxLength)
  }

  return text
}

export function optionalText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0
}
