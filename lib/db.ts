import { getCloudflareContext } from '@opennextjs/cloudflare'

export type Env = {
  DB: D1Database
  JWT_SECRET: string
}

export async function getDb(): Promise<D1Database> {
  try {
    const ctx = await getCloudflareContext()
    const env = ctx.env as Env
    return env.DB
  } catch {
    throw new Error('D1 database binding not found. Make sure DB is configured in wrangler.toml')
  }
}

export async function getJwtSecret(): Promise<string> {
  try {
    const ctx = await getCloudflareContext()
    const env = ctx.env as Env
    return env.JWT_SECRET
  } catch {
    return process.env.JWT_SECRET || 'fallback-secret-change-in-production'
  }
}

export function generateId(): string {
  return crypto.randomUUID()
}
