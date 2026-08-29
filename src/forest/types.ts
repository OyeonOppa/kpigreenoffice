import type { FOREST } from '../content'
import type { AvatarLook } from '../game/types'

export type ActivityKind = (typeof FOREST.kinds)[number]['id']
export type ActivityId = (typeof FOREST.activities)[number]['id']

/**
 * ตัวตนของคนที่กำลังใช้หน้าป่า
 *
 * แคมเปญนี้มีตัวตนของตัวเอง ไม่ได้ยืมของเกมแข่งสด เพราะ uid ฝั่งนั้นเซิร์ฟเวอร์เป็นคนแจก
 * ตอนเข้าห้องแข่ง — ก่อนเข้าห้องจะยังว่างอยู่ ใช้เป็นเจ้าของต้นไม้ไม่ได้
 */
export interface ForestUser {
  uid: string
  name: string
}

/** ที่มาของแต้ม — บันทึกเอง หรือสตาฟกดให้ (เช่น มาช่วยงานกิจกรรมใหญ่) */
export type PointSource = 'self' | 'staff'

export interface LogEntry {
  id: string
  /** กิจกรรมที่บันทึก — null เมื่อเป็นแต้มที่สตาฟให้ ซึ่งไม่ผูกกับกิจกรรมในรายการ */
  activityId: ActivityId | null
  points: number
  at: number
  source: PointSource
  /** เหตุผลที่สตาฟให้แต้ม — โชว์ในประวัติเพื่อให้ตรวจย้อนหลังได้ว่าใครได้แต้มเพราะอะไร */
  note?: string
}

/** หนึ่งคน = หนึ่งต้น */
export interface ForestMember {
  uid: string
  name: string
  look: AvatarLook
  team: string
  points: number
  /** 0–1 สำหรับส่งให้ buildTree — คำนวณจาก points ที่เดียวใน config.ts */
  growth: number
  updatedAt: number
}

/** ข้อมูลทั้งหมดที่หน้าป่าต้องใช้ในการวาดหนึ่งรอบ */
export interface ForestSnapshot {
  /** null = ยังไม่ได้ลงทะเบียนต้นของตัวเอง */
  me: ForestMember | null
  /** ประวัติแต้มล่าสุดของตัวเอง (ใหม่ก่อน) */
  log: LogEntry[]
  /** แต้มที่บันทึกเองไปแล้ววันนี้ — ใช้เทียบเพดานรายวัน */
  todayPoints: number
  /** กิจกรรมที่บันทึกไปแล้ววันนี้ บันทึกซ้ำในวันเดียวกันไม่ได้ */
  todayDone: ActivityId[]
  /**
   * ต้นไม้ในสวนของสำนักเดียวกัน เรียงแต้มมากไปน้อย และตัดที่ GARDEN_MAX
   *
   * ตัดเพราะข้อจำกัดของ 3D ไม่ใช่เพราะข้อมูลไม่มี — วัดจริงแล้วสวน 48 ต้นที่ LOD low
   * อยู่ที่ ~265,000 สามเหลี่ยม ถ้าปล่อยให้ครบ 250 คนจะเป็นล้านกว่า มือถือไม่ไหว
   */
  garden: ForestMember[]
  /** จำนวนคนทั้งสำนัก (ก่อนตัด) — เอาไว้บอกว่า "และอีก N คน" */
  teamCount: number
  /** ภาพรวมทั้งหน่วยงาน */
  officeCount: number
  officePoints: number
}

export interface LogResult {
  ok: boolean
  reason?: string
  gained?: number
}
