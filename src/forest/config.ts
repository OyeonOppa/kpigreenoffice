/**
 * กติกาแคมเปญป่า 3R — ตัวเลขทุกตัวปรับที่ไฟล์นี้ไฟล์เดียว
 *
 * แยกจาก content.ts เพราะไฟล์นั้นเก็บ "ข้อความที่คนอ่าน" ส่วนไฟล์นี้เก็บ "กติกาที่ระบบคิด"
 * (เหมือนที่เกมแข่งสดแยก LIVE_GAME ใน content.ts ออกจาก game/config.ts)
 */

import { ORG_TREE } from '../content'
import { TREE_STAGES, type TreeStage } from '../components/tree/stages'

/** แต้มที่ทำให้ต้นโตเต็มที่ */
export const FULL_POINTS = 600

/**
 * เพดานแต้มที่บันทึกเองได้ต่อวัน
 *
 * ถ้าไม่มีเพดาน คนกดครบทุกกิจกรรมในวันเดียวได้ 131 แต้ม = ต้นโตเต็มใน 5 วัน แล้วแคมเปญจบ
 * เพดาน 40 ทำให้ต้องกลับมาทำต่อเนื่องอย่างน้อย 15 วันถึงจะเต็ม ซึ่งเป็นพฤติกรรมที่แคมเปญต้องการจริงๆ
 * แต้มที่สตาฟกดให้ไม่นับรวมเพดานนี้ (เป็นรางวัลกิจกรรมพิเศษ ไม่ใช่การกดเองรายวัน)
 */
export const DAILY_CAP = 40

/**
 * จำนวนต้นสูงสุดที่วาดในสวนหนึ่งฉาก
 *
 * เดิมตัดที่ 60 เพราะข้อจำกัดของ WebGL (250 ต้นคือสามเหลี่ยมล้านกว่าชิ้น)
 * ตอนนี้ต้นไม้เป็น SVG แล้ว เพดานจึงสูงขึ้นมาก — ที่ยังมีอยู่เพราะจำนวนชิ้นใน DOM
 * ยังโตตามจำนวนต้นอยู่ดี ไม่ใช่เพราะการ์ดจอไม่ไหวเหมือนก่อน
 */
export const GARDEN_MAX = 300

/**
 * ระยะการเติบโต 10 ขั้น — นิยามอยู่ที่ `components/tree/stages.ts` ที่เดียว
 *
 * อยู่ที่นั่นเพราะตัววาดต้นไม้อ่านค่า growth ของแต่ละระยะไปใช้เป็นจุดสลับรูปร่างจริง
 * (เมล็ด → หน่ออ่อน → ต้น → ออกดอก → ติดผล) ถ้าแยกกันคนละไฟล์ วันหนึ่งจะมีป้ายว่า
 * "ออกดอก" ทั้งที่บนจอยังไม่มีดอก
 */
export const STAGES = TREE_STAGES
export type { TreeStageId as StageId, TreeStage as Stage } from '../components/tree/stages'

/** แต้มสะสม → ค่า growth 0–1 ที่ส่งให้ buildTree */
export function growthFromPoints(points: number): number {
  return Math.max(0, Math.min(1, points / FULL_POINTS))
}

/**
 * uid → รหัสสุ่มรูปทรงต้นไม้สำหรับป่าหน้าแรก
 *
 * ป่าหน้าแรกคนนอกเห็น จึงส่งค่านี้แทน uid — ต้นเดิมได้รูปทรงเดิมทุกครั้ง
 * แต่ผู้ชมย้อนกลับไปหาว่าเป็นใครไม่ได้ เจ้าตัวหาต้นตัวเองเจอเพราะคำนวณค่าเดียวกันได้จาก uid ของตัวเอง
 */
export function treeSeed(uid: string): string {
  let h = 2166136261
  for (let i = 0; i < uid.length; i++) {
    h ^= uid.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

/** แต้มรวมทั้งหน่วยงาน → ค่า growth ของต้นไม้องค์กรในหน้าแรก */
export function orgGrowthFromPoints(points: number): number {
  return Math.max(0, Math.min(1, points / ORG_TREE.goalPoints))
}

/** ระยะปัจจุบัน + ต้องอีกกี่แต้มถึงระยะถัดไป (null = โตเต็มแล้ว) */
export function stageOf(points: number): {
  index: number
  stage: TreeStage
  next: TreeStage | null
  pointsToNext: number
} {
  const g = growthFromPoints(points)
  let index = 0
  for (let i = 0; i < STAGES.length; i++) {
    if (g >= STAGES[i].growth) index = i
  }
  const next = index < STAGES.length - 1 ? STAGES[index + 1] : null
  return {
    index,
    stage: STAGES[index],
    next,
    pointsToNext: next ? Math.max(0, Math.ceil(next.growth * FULL_POINTS) - points) : 0,
  }
}

/**
 * คีย์ของวัน ตามเวลาเครื่องผู้ใช้ — ใช้ตัดสินว่า "บันทึกไปแล้ววันนี้หรือยัง"
 *
 * ใช้เวลาเครื่องเพราะ "วันนี้" ของคนใช้คือวันตามนาฬิกาที่เขาเห็น
 * ตอนต่อหลังบ้านจริงต้องตรึงเป็นเขตเวลาไทยที่ฝั่งเซิร์ฟเวอร์ ไม่งั้นคนตั้งนาฬิกาเครื่องเองแล้วบันทึกซ้ำได้
 */
export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
