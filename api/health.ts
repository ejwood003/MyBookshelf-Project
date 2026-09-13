/**
 * GET /api/health — deployment diagnostics.
 *
 * Deliberately has no imports beyond the store so that it still answers when something
 * further down the domain is broken. Reports whether storage is configured and reachable
 * without echoing any credential.
 */

import { json, route } from './_lib/http'
import { describeStorage } from './_lib/store'

export default route({
  GET: async (_req, res) => {
    const checks: Record<string, unknown> = {
      ok: true,
      node: process.version,
      region: process.env.VERCEL_REGION ?? null,
      storage: await describeStorage(),
    }

    try {
      const { getOverview } = await import('./_lib/shelf')
      const overview = await getOverview()
      checks.shelf = {
        readerName: overview.readerName,
        totalBooks: overview.summary.totalBooks,
        shelves: overview.shelves.length,
      }
    } catch (error) {
      checks.ok = false
      checks.shelf = {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 4) : undefined,
      }
    }

    json(res, 200, checks)
  },
})
