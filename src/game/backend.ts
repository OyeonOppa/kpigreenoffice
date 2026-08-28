import type { AuthUser, BinId, JoinProfile, JoinResult, RoomSnapshot } from './types'

/**
 * สัญญากลางระหว่างหน้าเกมกับ "หลังบ้าน"
 *
 * ตอนนี้ใช้ mockBackend ที่จำลองห้องด้วย localStorage + BroadcastChannel
 * (เปิดหลายแท็บในเครื่องเดียวกัน = เล่นแข่งกันได้จริง ใช้ซ้อมระบบได้ครบทุกขั้น)
 *
 * เวลาเปลี่ยนไปใช้ของจริง (Firebase / Cloudflare) ให้เขียน adapter ตัวใหม่
 * ที่ทำตาม interface นี้ แล้วสลับ export ท้ายไฟล์ src/game/index.ts จุดเดียว
 * โค้ดหน้าจอทั้งหมดไม่ต้องแก้เลย
 */
export interface GameBackend {
  /** ชื่อ adapter — ใช้แสดงป้ายเตือนว่ากำลังอยู่โหมดซ้อม */
  readonly id: 'mock' | 'firebase' | 'cloudflare'
  /** โหมดจำลอง — หน้าจอจะโชว์ปุ่มเสริมสำหรับซ้อม (เช่น เพิ่มผู้เล่นจำลอง) */
  readonly isMock: boolean

  /** เวลาอ้างอิงกลาง — ของจริงต้องเป็นเวลาฝั่งเซิร์ฟเวอร์ ห้ามเชื่อนาฬิกาเครื่องผู้เล่น */
  now(): number

  // ---- บัญชีผู้ใช้ ----
  currentUser(): AuthUser | null
  /** ของจริง = เปิด Google popup แล้วบังคับโดเมน; ของจำลอง = ใช้ชื่อที่กรอกมา */
  signIn(hint?: { name?: string }): Promise<AuthUser>
  signOut(): void
  onAuthChanged(cb: (user: AuthUser | null) => void): () => void

  // ---- ฝั่งผู้เล่น ----
  joinRoom(pin: string, profile: JoinProfile): Promise<JoinResult>
  /**
   * ส่งคำตอบ — คืน true เมื่อระบบรับคำตอบไว้จริง
   * คืน false เมื่อไม่ทันเวลาหรือตอบซ้ำ หน้าจอต้องไม่ขึ้นว่า "ส่งคำตอบแล้ว" ในกรณีนั้น
   */
  submitAnswer(pin: string, roundIndex: number, bin: BinId): Promise<boolean>
  getMyAnswer(pin: string, roundIndex: number): BinId | null

  // ---- ฝั่งจอกลาง (สตาฟ) ----
  createRoom(): Promise<string>
  startGame(pin: string): Promise<void>
  /** ข้ามเฟสปัจจุบันทันที เช่น เฉลยเสร็จแล้วอยากไปต่อเลย */
  skipPhase(pin: string): Promise<void>
  togglePause(pin: string): Promise<void>
  /** ตอนประกาศผล — เฉลยอันดับถัดไป */
  nextFinale(pin: string): Promise<void>
  addBots(pin: string, count: number): Promise<void>
  /** ตัวจับเวลาของเกม รันบนเครื่องสตาฟเครื่องเดียว คืนฟังก์ชันสำหรับหยุด */
  runHostLoop(pin: string): () => void

  // ---- ข้อมูลสด ----
  subscribeRoom(pin: string, cb: (snapshot: RoomSnapshot | null) => void): () => void

  /** ไฟล์รายชื่อ+คะแนนสำหรับแจกรางวัลและทำรายงาน */
  exportCsv(pin: string): string
}
