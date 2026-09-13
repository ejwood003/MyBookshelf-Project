/** GET /api/shelf — shelves, counts and goal progress in one request. */

import { json, route } from '../_lib/http'
import { getOverview } from '../_lib/shelf'

export default route({
  GET: async (_req, res) => json(res, 200, await getOverview()),
})
