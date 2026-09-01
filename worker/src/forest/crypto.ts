/**
 * แฮชรหัสผ่าน + โทเคน session สำหรับแคมเปญป่า 3R
 *
 * ทั้งหมดใช้ WebCrypto ที่มีอยู่แล้วใน Workers runtime — ไม่ต้องพึ่งไลบรารีภายนอก
 * พารามิเตอร์ PBKDF2 ต้องตรงกับ scripts/gen-users.mjs เป๊ะ ไม่งั้นแฮชที่ seed ไว้จะ verify ไม่ผ่าน
 */

const PBKDF2_ITERATIONS = 100_000
const HASH_BYTES = 32
const SALT_BYTES = 16

const enc = new TextEncoder()

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

/** เทียบสตริงแบบเวลาคงที่ กันการเดารหัสจากเวลาตอบ */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: PBKDF2_ITERATIONS },
    key,
    HASH_BYTES * 8,
  )
  return toHex(bits)
}

export function randomSaltHex(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(SALT_BYTES)).buffer)
}

export async function verifyPassword(
  password: string,
  saltHex: string,
  expectedHashHex: string,
): Promise<boolean> {
  const actual = await hashPassword(password, saltHex)
  return timingSafeEqual(actual, expectedHashHex)
}

// ---------- session token ----------
//
// รูปแบบ: <uid>.<expMs>.<sig>  โดย sig = base64url(HMAC-SHA256(secret, "<uid>.<expMs>"))
// ไม่มี state ฝั่งเซิร์ฟเวอร์ — ตรวจลายเซ็นกับวันหมดอายุพอ ถ้าจะเพิกถอนก่อนเวลาให้เปลี่ยน SESSION_SECRET

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 วัน — แคมเปญยาวหลายเดือน ไม่อยากให้ล็อกอินบ่อย

function b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)))
}

export async function issueToken(uid: string, secret: string): Promise<string> {
  const exp = Date.now() + TOKEN_TTL_MS
  const body = `${uid}.${exp}`
  return `${body}.${await sign(body, secret)}`
}

/** คืน uid ถ้าโทเคนถูกต้องและยังไม่หมดอายุ, คืน null ถ้าไม่ผ่าน */
export async function verifyToken(token: string, secret: string): Promise<string | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [uid, expStr, sig] = parts
  const exp = Number(expStr)
  if (!uid || !Number.isFinite(exp) || exp < Date.now()) return null
  const expected = await sign(`${uid}.${expStr}`, secret)
  return timingSafeEqual(sig, expected) ? uid : null
}
