// ตรวจ Google ID token ด้วย WebCrypto — ไม่ต้องพึ่งไลบรารีภายนอก
//
// ขั้นตอน: แยก JWT → หา public key ที่ตรง kid จาก JWKS ของ Google → ตรวจลายเซ็น
// → ตรวจ iss / aud / exp → ตรวจว่าอีเมลอยู่ในโดเมนที่อนุญาตและยืนยันแล้ว
//
// ทำไมต้องตรวจโดเมนที่นี่ด้วย: พารามิเตอร์ hd ตอน sign-in เป็นแค่ "คำใบ้" ให้หน้าจอเลือกบัญชี
// ไม่ใช่การบังคับ ใครแก้ค่านั้นแล้วล็อกอินด้วย gmail ธรรมดาก็ได้ ต้องมากันจริงตรงนี้

export interface VerifiedUser {
  uid: string
  email: string
  name: string
}

interface Jwk {
  kid: string
  n: string
  e: string
  alg?: string
  kty: string
}

const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs'

let cachedKeys: { keys: Jwk[]; expiresAt: number } | null = null

async function getKeys(): Promise<Jwk[]> {
  const now = Date.now()
  if (cachedKeys && cachedKeys.expiresAt > now) return cachedKeys.keys

  const res = await fetch(JWKS_URL)
  if (!res.ok) throw new Error('โหลดกุญแจสาธารณะของ Google ไม่สำเร็จ')
  const body = (await res.json()) as { keys: Jwk[] }

  // เคารพ Cache-Control ของ Google แต่ไม่เกิน 1 ชั่วโมง
  const cc = res.headers.get('cache-control') ?? ''
  const maxAge = Number(/max-age=(\d+)/.exec(cc)?.[1] ?? 3600)
  cachedKeys = { keys: body.keys, expiresAt: now + Math.min(maxAge, 3600) * 1000 }
  return body.keys
}

function base64UrlToBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function decodeJson(part: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(part)))
}

export interface VerifyOptions {
  clientId: string
  allowedDomain: string
}

export async function verifyGoogleToken(
  token: string,
  { clientId, allowedDomain }: VerifyOptions,
): Promise<VerifiedUser> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('รูปแบบโทเคนไม่ถูกต้อง')

  const header = decodeJson(parts[0]) as { kid?: string; alg?: string }
  if (header.alg !== 'RS256') throw new Error('อัลกอริทึมของโทเคนไม่รองรับ')

  const jwk = (await getKeys()).find((k) => k.kid === header.kid)
  if (!jwk) throw new Error('ไม่พบกุญแจที่ตรงกับโทเคนนี้')

  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )

  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64UrlToBytes(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  )
  if (!valid) throw new Error('ลายเซ็นของโทเคนไม่ถูกต้อง')

  const payload = decodeJson(parts[1]) as {
    iss?: string
    aud?: string
    exp?: number
    sub?: string
    email?: string
    email_verified?: boolean | string
    name?: string
    hd?: string
  }

  if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
    throw new Error('ผู้ออกโทเคนไม่ใช่ Google')
  }
  if (payload.aud !== clientId) throw new Error('โทเคนนี้ไม่ได้ออกให้แอปนี้')
  if (!payload.exp || payload.exp * 1000 < Date.now()) throw new Error('โทเคนหมดอายุแล้ว')

  const email = (payload.email ?? '').toLowerCase()
  const verified = payload.email_verified === true || payload.email_verified === 'true'
  if (!email || !verified) throw new Error('อีเมลยังไม่ได้รับการยืนยัน')
  if (!email.endsWith(`@${allowedDomain.toLowerCase()}`)) {
    throw new Error(`เข้าเล่นได้เฉพาะบัญชี @${allowedDomain} เท่านั้น`)
  }

  return {
    uid: payload.sub ?? email,
    email,
    name: payload.name?.trim() || email.split('@')[0],
  }
}
