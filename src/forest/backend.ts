import type { AvatarLook } from '../game/types'
import type { ActivityId, ForestMember, ForestSnapshot, ForestUser, LogResult } from './types'

export interface ForestProfile {
  name: string
  look: AvatarLook
  team: string
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
  // ของจริงต้องเปลี่ยนตรงนี้เป็น Google Sign-In + บังคับโดเมนแบบเดียวกับเกมแข่งสด
  // แล้วให้เซิร์ฟเวอร์เป็นคนบอก uid จาก token ที่ตรวจแล้ว

  currentUser(): ForestUser | null
  signIn(name: string): Promise<ForestUser>
  signOut(): void
  onAuthChanged(cb: (user: ForestUser | null) => void): () => void

  /** ลงทะเบียน/แก้ข้อมูลต้นของตัวเอง เรียกซ้ำได้ ไม่รีเซ็ตแต้ม */
  saveProfile(uid: string, profile: ForestProfile): Promise<void>

  /**
   * บันทึกกิจกรรม 3R ของตัวเอง
   * คืน ok:false พร้อมเหตุผลเมื่อบันทึกซ้ำในวันเดียวกัน หรือชนเพดานแต้มรายวัน
   */
  logActivity(uid: string, activityId: ActivityId): Promise<LogResult>

  /** สตาฟกดให้แต้ม — ไม่ติดเพดานรายวัน แต่ต้องมีเหตุผลกำกับเสมอเพื่อให้ตรวจย้อนหลังได้ */
  awardPoints(uid: string, points: number, note: string): Promise<LogResult>

  subscribeForest(uid: string, cb: (snapshot: ForestSnapshot) => void): () => void

  /** รายชื่อทั้งหน่วยงาน — สำหรับหน้าสตาฟ ไม่ใช่หน้าผู้ใช้ทั่วไป */
  listMembers(): ForestMember[]

  /**
   * สร้างเพื่อนร่วมสวนจำลองไว้ดูหน้าตาสวนตอนยังไม่มีคนใช้จริง (โหมดจำลองเท่านั้น)
   * ต้องระบุสำนักด้วย ไม่งั้นคนจำลองไปกระจายอยู่สำนักอื่น สวนของคนที่กดก็ยังว่างเหมือนเดิม
   */
  seedDemoMembers(count: number, team: string): Promise<void>
}
