/**
 * PUT /api/books/{id}/progress — records how far the reader has got. Crossing zero or
 * the last page moves the book to the right shelf automatically.
 */

import {
  body,
  hasErrors,
  json,
  notFound,
  requireInt,
  route,
  routeId,
  validationProblem,
  type ValidationErrors,
} from '../../_lib/http'
import { updateProgress } from '../../_lib/shelf'

export default route({
  PUT: async (req, res) => {
    const errors: ValidationErrors = {}
    const currentPage = requireInt(errors, 'CurrentPage', body(req).currentPage, {
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      message: 'Page number cannot be negative.',
    })

    if (hasErrors(errors)) return validationProblem(res, errors)

    const id = routeId(req)
    const book = await updateProgress(id, currentPage)
    return book === null ? notFound(res, `No book with id '${id}'.`) : json(res, 200, book)
  },
})
