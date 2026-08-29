/**
 * กติกาแคมเปญป่า 3R — ตัวเลขทุกตัวปรับที่ไฟล์นี้ไฟล์เดียว
 *
 * แยกจาก content.ts เพราะไฟล์นั้นเก็บ "ข้อความที่คนอ่าน" ส่วนไฟล์นี้เก็บ "กติกาที่ระบบคิด"
 * (เหมือนที่เกมแข่งสดแยก LIVE_GAME ใน content.ts ออกจาก game/config.ts)
 */

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
 * มาจากการวัดจริง: 48 ต้นที่ LOD 'low' = ~265,000 สามเหลี่ยม ซึ่งมือถือรับไหว
 * 250 ต้นจะเป็นล้านกว่า เฟรมตกทันที คนที่เกินโควตานี้แสดงเป็นตัวเลข "และอีก N คน" แทน
 */
export const GARDEN_MAX = 60

/**
 * ระยะการเติบโต 7 ขั้น — ค่า growth ตรงกับพารามิเตอร์ที่ส่งให้ buildTree()
 *
 * ชื่อระยะอิงขนาดต้นล้วนๆ ไม่มี "ออกดอก/ออกผล" เพราะ treeGeometry ยังสร้างแต่กิ่งกับใบ
 * ถ้าจะใช้ชื่อพวกนั้นต้องเพิ่มดอก/ผลใน geometry ก่อน ไม่งั้นป้ายบอกอย่างแต่ต้นเป็นอีกอย่าง
 *
 * และไม่เริ่มที่ "เมล็ด" เพราะ growth 0 วาดออกมาเป็นต้นเล็กสูงราว 0.9 เมตรที่มีใบแล้ว
 * ไม่ใช่เมล็ดในดิน — ป้ายต้องตรงกับสิ่งที่เห็นบนจอ
 */
export const STAGES = [
  { id: 'sapling', label: 'ต้นกล้า', growth: 0 },
  { id: 'young', label: 'ต้นอ่อน', growth: 0.15 },
  { id: 'juvenile', label: 'ต้นรุ่น', growth: 0.3 },
  { id: 'grown', label: 'ต้นโต', growth: 0.5 },
  { id: 'large', label: 'ต้นใหญ่', growth: 0.7 },
  { id: 'full', label: 'ทรงพุ่มเต็ม', growth: 0.85 },
  { id: 'shade', label: 'ไม้ใหญ่ให้ร่มเงา', growth: 1 },
] as const

export type StageId = (typeof STAGES)[number]['id']
export type Stage = (typeof STAGES)[number]

/** แต้มสะสม → ค่า growth 0–1 ที่ส่งให้ buildTree */
export function growthFromPoints(points: number): number {
  return Math.max(0, Math.min(1, points / FULL_POINTS))
}

/** ระยะปัจจุบัน + ต้องอีกกี่แต้มถึงระยะถัดไป (null = โตเต็มแล้ว) */
export function stageOf(points: number): {
  index: number
  stage: Stage
  next: Stage | null
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
