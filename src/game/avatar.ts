import { AVATAR_PARTS } from '../content'
import type { AvatarLook } from './types'

const pick = <T,>(list: readonly T[], rand: () => number): T =>
  list[Math.floor(rand() * list.length)]

export function randomLook(): AvatarLook {
  return {
    base: pick(AVATAR_PARTS.bases, Math.random),
    color: pick(AVATAR_PARTS.colors, Math.random),
    hat: pick(AVATAR_PARTS.hats, Math.random),
    gear: pick(AVATAR_PARTS.gears, Math.random),
  }
}

/**
 * ลุคเริ่มต้นที่คิดจาก uid — คนละคนได้คนละลุคโดยไม่ต้องถามเซิร์ฟเวอร์ว่าลุคไหนถูกใช้แล้ว
 * ถ้าให้ทุกคนเริ่มที่ลุคเดียวกัน คนที่ไม่แต่งตัวต่อจะซ้ำกันหมดทั้งห้อง
 */
export function lookFromSeed(seed: string): AvatarLook {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let state = h >>> 0
  const rand = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
  return {
    base: pick(AVATAR_PARTS.bases, rand),
    color: pick(AVATAR_PARTS.colors, rand),
    hat: pick(AVATAR_PARTS.hats, rand),
    gear: pick(AVATAR_PARTS.gears, rand),
  }
}

/** เผื่อข้อมูลเก่าหรือข้อมูลเสีย — จะได้ไม่พังทั้งกระดานเพราะผู้เล่นคนเดียว */
export function safeLook(look: AvatarLook | undefined | null): AvatarLook {
  if (look?.base) return look
  return { base: AVATAR_PARTS.bases[0], color: AVATAR_PARTS.colors[0], hat: '', gear: '' }
}
