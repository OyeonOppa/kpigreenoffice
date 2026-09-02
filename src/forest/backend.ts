import type { AvatarLook } from '../game/types'
import type {
  ActivityId,
  ForestMember,
  ForestSnapshot,
  ForestUser,
  LeaderboardSnapshot,
  LogResult,
  OrgSnapshot,
} from './types'

export interface ForestProfile {
  /** สิ่งเดียวที่ผู้ใช้ตั้งเองได้ — ชื่อกับสำนักมาจากรายชื่อองค์กร */
  look: AvatarLook
}

/**
 * สัญญากลางระหว่างหน้าป่ากับหลังบ้าน
 *
 * ตอนนี้มีแต่ mockForestBackend (localStorage + BroadcastChannel) พอให้เห็นหน้าจอจริงและลองกติกา
 * เวลาทำของจริงให้เขียน adapter ใหม่ตาม interface นี้แล้วสลับที่ forest/index.ts จุดเดียว
 * หน้าจอไม่ต้องแก้ — แบบเดียวกับที่เกมแข่งสดสลับจาก mock ไป Cloudflare Worker มาแล้ว
 *
 * uid ส่งเข้ามาจากหน้าจอเพราะโหมดจำลองเก็บตัวตนไว้ในเครื่อง
 * ของจริงห้ามเชื่อ uid ที่ส่งมา ต้องอ่านจาก token ที่เซิร์ฟเวอร์ตรวจแล้วเสมอ
 * ไม่งั้นใครก็ยิงขอแต้มใส่ uid คนอื่นได้
 */
export interface ForestBackend {
  readonly id: 'mock' | 'cloudflare'
  /** โหมดจำลอง — หน้าจอจะโชว์เครื่องมือซ้อม เช่น ปุ่มสร้างเพื่อนร่วมสวนจำลอง */
  readonly isMock: boolean

  now(): number

  // ---- ตัวตน ----
  //
  // แคมเปญนี้มีการล็อกอินของตัวเอง ไม่ได้ใช้ของเกมแข่งสด เพราะที่นั่นเซิร์ฟเวอร์แจก uid
  // ตอนเข้าห้องแข่งเท่านั้น ก่อนเข้าห้อง uid ยังว่าง — เป็นเจ้าของต้นไม้ไม่ได้
  //
  // ของจริงเป็น Google Workspace ของหน่วยงาน (โดเมน kpi.ac.th)
  // adapter จริงต้องรับ id_token จาก Google แล้วให้เซิร์ฟเวอร์เป็นคนตรวจลายเซ็น + โดเมน
  // แล้วคืน uid ที่ผูกกับอีเมลนั้น — ห้ามให้หน้าจอเป็นคนบอกว่าตัวเองเป็นใคร

  currentUser(): ForestUser | null

  /**
   * เข้าระบบด้วยชื่อผู้ใช้ + รหัส (รหัสพนักงาน) จากรายชื่อที่สร้างไว้ล่วงหน้า
   *
   * เซิร์ฟเวอร์เป็นคนตรวจรหัสแล้วคืนโทเคนที่เซ็นไว้ — หน้าจอเก็บโทเคน ไม่เก็บรหัส
   * คืน ok:false พร้อมเหตุผลเมื่อชื่อผู้ใช้/รหัสไม่ถูกต้อง
   */
  signIn(
    username: string,
    password: string,
  ): Promise<{ ok: boolean; user?: ForestUser; reason?: string }>
  signOut(): void
  onAuthChanged(cb: (user: ForestUser | null) => void): () => void

  /**
   * ตั้งรหัสผ่านใหม่ให้คนที่ล็อกอินอยู่ — ใช้ตอนถูกบังคับเปลี่ยนครั้งแรก (mustChangePassword)
   * สำเร็จแล้ว currentUser().mustChangePassword จะกลายเป็น false
   */
  changePassword(newPassword: string): Promise<{ ok: boolean; reason?: string }>

  /**
   * ยอดรวมทั้งหน่วยงานสำหรับต้นไม้องค์กรในหน้าแรก — คนที่ยังไม่ล็อกอินก็เรียกได้
   *
   * ของจริงให้ตอบจากค่าที่สรุปไว้แล้ว (นับใหม่ตอนมีคนได้แต้ม) ไม่ใช่ไล่รวมทั้งตารางทุกครั้ง
   * หน้าแรกเป็นหน้าที่คนเข้าเยอะสุด ถ้าคิวรีหนักทุกครั้งที่โหลดจะเป็นจุดที่ล้มก่อนเพื่อน
   */
  subscribeOrg(cb: (org: OrgSnapshot) => void): () => void

  /** เลือก/เปลี่ยนตัวละคร — ครั้งแรกที่เรียกคือ "ปลูกต้น" ให้ตัวเอง เรียกซ้ำได้ ไม่รีเซ็ตแต้ม */
  saveProfile(uid: string, profile: ForestProfile): Promise<void>

  /**
   * บันทึกกิจกรรม 3R ของตัวเอง
   * คืน ok:false พร้อมเหตุผลเมื่อบันทึกซ้ำในวันเดียวกัน หรือชนเพดานแต้มรายวัน
   */
  logActivity(uid: string, activityId: ActivityId): Promise<LogResult>

  /** สตาฟกดให้แต้ม — ไม่ติดเพดานรายวัน แต่ต้องมีเหตุผลกำกับเสมอเพื่อให้ตรวจย้อนหลังได้ */
  awardPoints(uid: string, points: number, note: string): Promise<LogResult>

  subscribeForest(uid: string, cb: (snapshot: ForestSnapshot) => void): () => void

  /**
   * อันดับคะแนนทั้งหน่วยงาน — ต้องล็อกอิน (ต่างจาก subscribeOrg ที่หน้าแรกใช้ได้โดยไม่ล็อกอิน)
   * เพราะอันดับนี้มีชื่อคนติดมาด้วย ให้เห็นเฉพาะเพื่อนร่วมงานที่ล็อกอินแล้วเหมือนกัน
   */
  subscribeLeaderboard(cb: (lb: LeaderboardSnapshot) => void): () => void

  /** รายชื่อทั้งหน่วยงาน — สำหรับหน้าสตาฟ ไม่ใช่หน้าผู้ใช้ทั่วไป (ของจริงเช็คสิทธิ์ที่เซิร์ฟเวอร์) */
  listMembers(): Promise<ForestMember[]>

  /**
   * สร้างเพื่อนร่วมสวนจำลองไว้ดูหน้าตาสวนตอนยังไม่มีคนใช้จริง (โหมดจำลองเท่านั้น)
   * ต้องระบุสำนักด้วย ไม่งั้นคนจำลองไปกระจายอยู่สำนักอื่น สวนของคนที่กดก็ยังว่างเหมือนเดิม
   */
  seedDemoMembers(count: number, team: string): Promise<void>
}
