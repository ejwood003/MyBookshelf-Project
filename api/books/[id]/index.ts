/** GET and DELETE /api/books/{id}. */

import { json, notFound, route, routeId } from '../../_lib/http'
import { getBook, removeBook } from '../../_lib/shelf'

export default route({
  GET: async (req, res) => {
    const id = routeId(req)
    const book = await getBook(id)
    return book === null ? notFound(res, `No book with id '${id}'.`) : json(res, 200, book)
  },

  DELETE: async (req, res) => {
    const id = routeId(req)
    const removed = await removeBook(id)
    if (!removed) return notFound(res, `No book with id '${id}'.`)
    res.status(204).end()
  },
})
