import type { FOREST, FOREST_BADGES } from '../content'
import type { AvatarLook } from '../game/types'

export type ActivityKind = (typeof FOREST.kinds)[number]['id']
export type ActivityId = (typeof FOREST.activities)[number]['id']
export type BadgeId = (typeof FOREST_BADGES)[number]['id']

/**
 * ตัวตนของคนที่กำลังใช้หน้าป่า
 *
 * แคมเปญนี้มีตัวตนของตัวเอง ไม่ได้ยืมของเกมแข่งสด เพราะ uid ฝั่งนั้นเซิร์ฟเวอร์เป็นคนแจก
 * ตอนเข้าห้องแข่ง — ก่อนเข้าห้องจะยังว่างอยู่ ใช้เป็นเจ้าของต้นไม้ไม่ได้
 */
export interface ForestUser {
  uid: string
  /** ชื่อผู้ใช้ที่ใช้เข้าระบบ (ตั้งไว้ล่วงหน้าจากรายชื่อองค์กร) */
  username: string
  /** อีเมลองค์กร — มีไว้อ้างอิง ไม่ได้ใช้เข้าระบบแล้ว */
  email?: string
  /** ชื่อจริง มาจากรายชื่อองค์กร ผู้ใช้แก้เองไม่ได้ */
  name: string
  /** ชื่อเล่นที่แสดงในสวน (ถ้าไม่มีใช้ name) */
  nickname?: string
  /** สำนัก/กอง มาจากรายชื่อองค์กร ผู้ใช้แก้เองไม่ได้ — กำหนดว่าต้นไปยืนในสวนไหน */
  team: string
  /** 'staff' = กดให้แต้มคนอื่นได้ (หน้า #/forest/staff) */
  role: 'member' | 'staff'
  /** true = ยังใช้รหัสพนักงานเป็นรหัสผ่าน ต้องตั้งรหัสใหม่ก่อนใช้งานต่อ */
  mustChangePassword?: boolean
}

/**
 * ตัวเลขรวมทั้งหน่วยงานสำหรับต้นไม้องค์กรในหน้าแรก — คนที่ยังไม่ล็อกอินก็เห็น
 *
 * มีแค่ยอดรวม ไม่มีรายชื่อ โดยตั้งใจ — หน้าแรกเปิดให้คนนอกเห็น
 * ถ้าส่งรายชื่อคนทั้งหน่วยงานออกไปด้วย เท่ากับประกาศต่อสาธารณะว่าใครทำ/ไม่ทำ
 */
export interface OrgSnapshot {
  memberCount: number
  totalPoints: number
  /** 0–1 ของทั้งองค์กรรวมกัน — คำนวณจาก totalPoints ที่เดียวใน config.ts */
  growth: number
  /**
   * ต้นไม้ทุกต้นแบบไม่ระบุตัวตน — มีแค่รูปทรงกับความโต
   *
   * `seed` เป็นค่าที่ย่อมาจาก uid ไว้สุ่มรูปทรงให้ต้นเดิมหน้าตาเดิม ไม่ใช่ชื่อและย้อนกลับเป็นคนไม่ได้
   * ตั้งใจไม่ส่งชื่อมาด้วย เพราะป่านี้อยู่หน้าแรกที่คนนอกเห็น
   */
  trees: { seed: string; growth: number }[]
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
   * เพดานเดิม 60 ต้นมาจากข้อจำกัดของ 3D ซึ่งไม่มีแล้ว ตอนนี้ตัดที่ 300
   * เพราะจำนวนชิ้นใน DOM ยังโตตามจำนวนต้นอยู่ ไม่ใช่เพราะการ์ดจอไม่ไหว
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
  /** จำนวนวันต่อเนื่องหลังบันทึกครั้งนี้ (เฉพาะตอน ok:true) — ไว้โชว์ "ต่อเนื่อง N วัน" ทันทีไม่ต้องรอ poll รอบถัดไป */
  streak?: number
  /** เหรียญที่เพิ่งปลดล็อกจากการบันทึกครั้งนี้ (ปกติว่างเปล่า) — ไว้ขึ้นข้อความฉลองแยกจากที่เคยได้ไปแล้ว */
  earnedBadges?: BadgeId[]
}

/** หนึ่งแถวใน leaderboard — คนละอันดับ */
export interface LeaderboardEntry {
  uid: string
  /** nickname ถ้ามี ไม่งั้น name — เซิร์ฟเวอร์เลือกให้แล้ว */
  name: string
  team: string
  points: number
  /** อันดับ 1 = คะแนนสูงสุด (แต้มเท่ากันเรียงตามชื่อ) */
  rank: number
  look: AvatarLook
  badges: BadgeId[]
}

/** อันดับของหนึ่งสำนัก — เรียงด้วยแต้มเฉลี่ยต่อหัว ไม่ใช่แต้มรวม (ดูเหตุผลใน content.ts: LEADERBOARD.teamNote) */
export interface TeamStanding {
  team: string
  memberCount: number
  totalPoints: number
  avgPoints: number
}

/** ข้อมูลหน้าอันดับคะแนน — อยู่หลังล็อกอินเท่านั้น (ต่างจาก OrgSnapshot ที่หน้าแรกใช้ได้โดยไม่ล็อกอิน) */
export interface LeaderboardSnapshot {
  /** Top N อันดับแรกของทั้งหน่วยงาน */
  top: LeaderboardEntry[]
  /** อันดับของคนที่กำลังดูอยู่ — null ถ้ายังไม่ได้ปลูกต้น (ยังไม่เข้าอันดับ) */
  me: LeaderboardEntry | null
  /** อันดับสำนัก เรียงแต้มเฉลี่ยมากไปน้อยแล้ว */
  teams: TeamStanding[]
}
