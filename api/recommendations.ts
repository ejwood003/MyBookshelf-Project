/**
 * GET /api/recommendations — a shortlist of books from the reader's own collection,
 * each with the reason it was chosen. Powers the Choose What to Read screen.
 */

import { firstValue, json, parseMood, route } from './_lib/http'
import { getRecommendations } from './_lib/recommend'

export default route({
  GET: async (req, res) => {
    const mood = parseMood(firstValue(req.query.mood))
    const requested = Number(firstValue(req.query.count) ?? 3)
    const count = Number.isFinite(requested) ? Math.min(Math.max(Math.trunc(requested), 1), 12) : 3

    json(res, 200, await getRecommendations(mood, count))
  },
})
