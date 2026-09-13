/** POST /api/shelf/reset — restores the starting collection. Handy when demoing. */

import { json, route } from '../_lib/http'
import { getOverview } from '../_lib/shelf'
import { reset } from '../_lib/store'

export default route({
  POST: async (_req, res) => {
    await reset()
    json(res, 200, await getOverview())
  },
})
