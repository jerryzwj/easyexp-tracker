'use client'

export function decodeTokenPayload(token: string): { userId: string; exp: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='
    const binary = atob(base64)
    const payload = JSON.parse(binary)

    return { userId: payload.userId, exp: payload.exp }
  } catch {
    return null
  }
}

export function isTokenValid(token: string): boolean {
  const payload = decodeTokenPayload(token)
  if (!payload) return false
  const now = Math.floor(Date.now() / 1000)
  return payload.exp > now
}
