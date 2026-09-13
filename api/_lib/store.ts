/**
 * Replaces server/Services/JsonBookshelfRepository.cs.
 *
 * The C# version mirrored the collection to a JSON file on disk. Serverless functions
 * get a read-only bundle and a /tmp that is not shared between invocations, so the same
 * document now lives in Redis instead. It is still one JSON blob, which keeps the shape
 * of the data identical to what the file held.
 */

import { Redis } from '@upstash/redis'
import type { Bookshelf } from './domain'
import { createBookshelf } from './seed'

const KEY = 'bookshelf:v1'

function readEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]
    if (value) return value
  }
  return undefined
}

// Vercel's Upstash integration provisions KV_REST_API_*; a Redis database created
// directly on Upstash provisions UPSTASH_REDIS_REST_*. Accept either.
const url = readEnv('KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL')
const token = readEnv('KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN')

const redis = url && token ? new Redis({ url, token }) : null

/**
 * Used only when no Redis credentials are configured, so `vercel dev` and a plain
 * `npm test` still work. Serverless instances do not share this, and it is lost on every
 * cold start — which is exactly why the deployed app needs the database.
 */
let memory: Bookshelf | null = null
let warned = false

function warnOnce(): void {
  if (warned) return
  warned = true
  console.warn(
    '[bookshelf] No KV credentials found. Falling back to in-memory storage; ' +
      'changes will not survive a cold start.',
  )
}

export function isPersistent(): boolean {
  return redis !== null
}

export async function load(): Promise<Bookshelf> {
  if (!redis) {
    warnOnce()
    memory ??= createBookshelf()
    return memory
  }

  const stored = await redis.get<Bookshelf>(KEY)
  if (stored) return stored

  const seeded = createBookshelf()
  await redis.set(KEY, seeded)
  return seeded
}

export async function save(bookshelf: Bookshelf): Promise<void> {
  if (!redis) {
    memory = bookshelf
    return
  }
  await redis.set(KEY, bookshelf)
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
