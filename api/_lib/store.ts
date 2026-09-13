/**
 * Replaces server/Services/JsonBookshelfRepository.cs.
 *
 * The C# version mirrored the collection to a JSON file on disk. Serverless functions
 * get a read-only bundle and a /tmp that is not shared between invocations, so the same
 * document now lives in Redis instead. It is still one JSON blob, which keeps the shape
 * of the data identical to what the file held.
 *
 * Nothing here touches the network while the module is being imported. A client built at
 * module scope that throws takes the whole function down before any handler can run, and
 * the platform reports that as an opaque invocation failure rather than a usable error.
 */

import type { Bookshelf } from './domain'
import { createBookshelf } from './seed'

const KEY = 'bookshelf:v1'

type RedisLike = {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<unknown>
}

function readEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]
    if (value && value.trim() !== '') return value.trim()
  }
  return undefined
}

// Vercel's Upstash integration provisions KV_REST_API_*; a Redis database created
// directly on Upstash provisions UPSTASH_REDIS_REST_*. Accept either.
export function credentials(): { url?: string; token?: string } {
  return {
    url: readEnv('KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL'),
    token: readEnv('KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN'),
  }
}

let clientPromise: Promise<RedisLike | null> | null = null

/** Resolves to null whenever Redis is unavailable, for any reason. */
async function getClient(): Promise<RedisLike | null> {
  if (clientPromise) return clientPromise

  clientPromise = (async () => {
    const { url, token } = credentials()
    if (!url || !token) {
      console.warn(
        '[bookshelf] No KV credentials found. Using in-memory storage; ' +
          'changes will not survive a cold start.',
      )
      return null
    }

    try {
      const { Redis } = await import('@upstash/redis')
      return new Redis({ url, token }) as RedisLike
    } catch (error) {
      console.error('[bookshelf] Could not create the Redis client:', error)
      return null
    }
  })()

  return clientPromise
}

/**
 * Used when Redis is not configured or not reachable, so the app still renders. Instances
 * do not share this and it is lost on every cold start.
 */
let memory: Bookshelf | null = null

export async function load(): Promise<Bookshelf> {
  const redis = await getClient()

  if (redis) {
    try {
      const stored = await redis.get<Bookshelf>(KEY)
      if (stored && Array.isArray(stored.books)) return stored

      const seeded = createBookshelf()
      await redis.set(KEY, seeded)
      return seeded
    } catch (error) {
      console.error('[bookshelf] Redis read failed, serving from memory:', error)
    }
  }

  memory ??= createBookshelf()
  return memory
}

export async function save(bookshelf: Bookshelf): Promise<void> {
  memory = bookshelf

  const redis = await getClient()
  if (!redis) return

  try {
    await redis.set(KEY, bookshelf)
  } catch (error) {
    console.error('[bookshelf] Redis write failed:', error)
  }
}

/**
 * Read, change, write. The C# repository took a lock around this; a single reader's
 * shelf has no concurrent writers worth serialising, so two edits landing in the same
 * millisecond would resolve last-write-wins.
 */
export async function mutate<T>(change: (bookshelf: Bookshelf) => T): Promise<T> {
  const bookshelf = await load()
  const result = change(bookshelf)
  await save(bookshelf)
  return result
}

export async function reset(): Promise<Bookshelf> {
  const seeded = createBookshelf()
  await save(seeded)
  return seeded
}

/** Reports storage state for /api/health without revealing any secret. */
export async function describeStorage(): Promise<Record<string, unknown>> {
  const { url, token } = credentials()
  const detail: Record<string, unknown> = {
    hasUrl: Boolean(url),
    hasToken: Boolean(token),
    urlScheme: url ? url.split(':')[0] : null,
  }

  const redis = await getClient()
  detail.clientCreated = redis !== null

  if (redis) {
    try {
      await redis.get<Bookshelf>(KEY)
      detail.roundTrip = 'ok'
    } catch (error) {
      detail.roundTrip = 'failed'
      detail.error = error instanceof Error ? error.message : String(error)
    }
  }

  return detail
}
