/** GET and POST /api/books — the whole collection, or one shelf of it. */

import type { ReadingStatus } from '../_lib/domain'
import {
  body,
  firstValue,
  hasErrors,
  json,
  optionalText,
  parseStatus,
  problem,
  requireInt,
  requireText,
  route,
  validationProblem,
  type ValidationErrors,
} from '../_lib/http'
import { addBook, getBooks } from '../_lib/shelf'

export default route({
  GET: async (req, res) => {
    const status = parseStatus(firstValue(req.query.status))
    if (status === 'invalid') {
      return problem(res, 400, 'Unknown reading status.', 'Bad Request')
    }
    json(res, 200, await getBooks(status))
  },

  POST: async (req, res) => {
    const input = body(req)
    const errors: ValidationErrors = {}

    const title = requireText(errors, 'Title', input.title, {
      maxLength: 200,
      message: 'A book needs a title.',
    })
    const author = requireText(errors, 'Author', input.author, {
      maxLength: 120,
      message: 'A book needs an author.',
    })
    const pageCount = requireInt(errors, 'PageCount', input.pageCount ?? 300, {
      min: 1,
      max: 10000,
      message: 'Page count must be between 1 and 10,000.',
    })

    const status = parseStatus(typeof input.status === 'string' ? input.status : undefined)
    if (status === 'invalid') {
      ;(errors.Status ??= []).push('Unknown reading status.')
    }

    if (hasErrors(errors)) return validationProblem(res, errors)

    const book = await addBook({
      title,
      author,
      genre: optionalText(input.genre, 'Unsorted').slice(0, 60),
      pageCount,
      status: (status ?? 'WantToRead') as ReadingStatus,
      blurb: optionalText(input.blurb).slice(0, 500),
    })

    res.setHeader('Location', `/api/books/${book.id}`)
    json(res, 201, book)
  },
})
