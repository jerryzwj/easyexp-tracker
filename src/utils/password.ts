const SALT_LENGTH = 16
const HASH_ITERATIONS = 100000
const HASH_LENGTH = 64

function base64Encode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
}

function base64Decode(str: string): Uint8Array {
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: HASH_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    HASH_LENGTH * 8
  )
  const hash = new Uint8Array(hashBuffer)
  return `pbkdf2$${HASH_ITERATIONS}$${base64Encode(salt)}$${base64Encode(hash)}`
}

export async function comparePassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split('$')
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
      return false
    }
    const iterations = parseInt(parts[1], 10)
    const salt = base64Decode(parts[2])
    const storedHashBytes = base64Decode(parts[3])

    const encoder = new TextEncoder()
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    )
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256',
      },
      passwordKey,
      HASH_LENGTH * 8
    )
    const hash = new Uint8Array(hashBuffer)

    if (hash.length !== storedHashBytes.length) {
      return false
    }

    let diff = 0
    for (let i = 0; i < hash.length; i++) {
      diff |= hash[i] ^ storedHashBytes[i]
    }
    return diff === 0
  } catch {
    return false
  }
}
