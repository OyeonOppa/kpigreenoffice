import type { CSSProperties } from 'react'
import { AVATAR_PARTS } from '../content'
import type { AvatarLook } from './types'

const pick = <T,>(list: readonly T[], rand: () => number): T =>
  list[Math.floor(rand() * list.length)]

export function randomLook(): AvatarLook {
  return {
    base: pick(AVATAR_PARTS.bases, Math.random),
    color: pick(AVATAR_PARTS.colors, Math.random),
    ring: pick(AVATAR_PARTS.rings, Math.random),
    badge: pick(AVATAR_PARTS.badges, Math.random),
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
    ring: pick(AVATAR_PARTS.rings, rand),
    badge: pick(AVATAR_PARTS.badges, rand),
  }
}

/** เผื่อข้อมูลเก่าหรือข้อมูลเสีย — จะได้ไม่พังทั้งกระดานเพราะผู้เล่นคนเดียว */
export function safeLook(look: AvatarLook | undefined | null): AvatarLook {
  if (look?.base) {
    return { base: look.base, color: look.color, ring: look.ring ?? '', badge: look.badge ?? '' }
  }
  return { base: AVATAR_PARTS.bases[0], color: AVATAR_PARTS.colors[0], ring: '', badge: '' }
}

/** สีของกรอบ — เขียวเข้มคงที่ ให้ทั้งกระดานดูเป็นชุดเดียวกัน ต่างกันที่ "สไตล์" ไม่ใช่สี */
const RING_COLOR = 'oklch(45% 0.11 155)'

/**
 * สไตล์ของกรอบวงแหวนรอบรูป — ใช้ทั้งในตัวละครจริง (PlayerAvatar) และตัวอย่างในหน้าแต่งตัว
 * เป็น box-shadow / outline ล้วน วาดนอกกรอบ ไม่โดน border-radius ตัด และไม่เบียดหน้าสัตว์
 */
export function ringStyle(ring: string): CSSProperties {
  switch (ring) {
    case 'solid':
      return { boxShadow: `0 0 0 3px ${RING_COLOR}` }
    case 'double':
      return { boxShadow: `0 0 0 2px #fff, 0 0 0 5px ${RING_COLOR}` }
    case 'dashed':
      return { outline: `2px dashed ${RING_COLOR}`, outlineOffset: '2px' }
    case 'dotted':
      return { outline: `3px dotted ${RING_COLOR}`, outlineOffset: '2px' }
    case 'glow':
      return { boxShadow: `0 0 10px 2px ${RING_COLOR}` }
    default:
      return {}
  }
}
