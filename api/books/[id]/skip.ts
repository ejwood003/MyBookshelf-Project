/**
 * POST /api/books/{id}/skip — "Save for later". The book stays on the shelf but stops
 * being suggested for a while.
 */

import { json, notFound, route, routeId } from '../../_lib/http'
import { skipForNow } from '../../_lib/shelf'

export default route({
  POST: async (req, res) => {
    const id = routeId(req)
    const book = await skipForNow(id)
    return book === null ? notFound(res, `No book with id '${id}'.`) : json(res, 200, book)
  },
})
