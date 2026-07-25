import { getJwtSecret } from '@/lib/db'

function base64UrlEncode(data: Uint8Array): string {
  let base64 = btoa(String.fromCharCode(...data))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) base64 += '='
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function getSigningKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function generateToken(userId: string, expiresInDays: number = 7): Promise<string> {
  const secret = await getJwtSecret()
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    userId,
    iat: now,
    exp: now + expiresInDays * 24 * 60 * 60,
  }

  const encoder = new TextEncoder()
  const headerEncoded = base64UrlEncode(encoder.encode(JSON.stringify(header)))
  const payloadEncoded = base64UrlEncode(encoder.encode(JSON.stringify(payload)))

  const signingInput = `${headerEncoded}.${payloadEncoded}`
  const key = await getSigningKey(secret)
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput))
  const signatureEncoded = base64UrlEncode(new Uint8Array(signatureBuffer))

  return `${signingInput}.${signatureEncoded}`
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const secret = await getJwtSecret()
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts
    const signingInput = `${headerEncoded}.${payloadEncoded}`

    const encoder = new TextEncoder()
    const key = await getSigningKey(secret)
    const signature = base64UrlDecode(signatureEncoded)
    const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(signingInput))

    if (!isValid) return null

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadEncoded)))
    const now = Math.floor(Date.now() / 1000)

    if (payload.exp && payload.exp < now) return null

    return { userId: payload.userId }
  } catch {
    return null
  }
}
