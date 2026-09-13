/** PUT /api/books/{id}/status — moves a book between shelves, optionally rating it. */

import {
  body,
  hasErrors,
  json,
  notFound,
  parseStatus,
  requireInt,
  route,
  routeId,
  validationProblem,
  type ValidationErrors,
} from '../../_lib/http'
import { setStatus } from '../../_lib/shelf'

export default route({
  PUT: async (req, res) => {
    const input = body(req)
    const errors: ValidationErrors = {}

    const status = parseStatus(typeof input.status === 'string' ? input.status : undefined)
    if (status === null || status === 'invalid') {
      ;(errors.Status ??= []).push('A reading status is required.')
    }

    // Rating is optional, but a supplied one still has to be 1-5.
    const hasRating = input.rating !== undefined && input.rating !== null
    const rating = hasRating
      ? requireInt(errors, 'Rating', input.rating, {
          min: 1,
          max: 5,
          message: 'A rating must be between 1 and 5 stars.',
        })
      : null

    if (hasErrors(errors)) return validationProblem(res, errors)

    const id = routeId(req)
    const book = await setStatus(id, status as Exclude<typeof status, null | 'invalid'>, rating)
    return book === null ? notFound(res, `No book with id '${id}'.`) : json(res, 200, book)
  },
})
