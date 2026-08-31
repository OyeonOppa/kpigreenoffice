import { WASTE } from '../content'

export type BinId = (typeof WASTE.bins)[number]['id']

export const BIN_IDS = WASTE.bins.map((b) => b.id) as BinId[]

/**
 * เฟสของเกม — ทุกเครื่องเห็นเฟสเดียวกันเสมอ เพราะอ่านจาก state กลาง
 * lobby → countdown → answering → reveal → explain → board → (ข้อถัดไป) … → finale → ended
 */
export type Phase =
  | 'lobby'
  | 'countdown'
  | 'answering'
  | 'reveal'
  | 'explain'
  | 'board'
  | 'finale'
  | 'ended'

/** ตัวละครประจำตัวผู้เล่น — ประกอบจากชิ้นส่วนใน AVATAR_PARTS (content.ts) */
export interface AvatarLook {
  base: string
  color: string
  /** '' = ไม่มีกรอบ; ไม่งั้นเป็นชื่อสไตล์กรอบ (solid/double/dashed/dotted/glow) */
  ring: string
  /** '' = ไม่มีเหรียญ; ไม่งั้นเป็น emoji เหรียญที่มุมขวาล่าง */
  badge: string
}

export interface AuthUser {
  uid: string
  name: string
  /** เกมนี้ไม่มีล็อกอิน — ไม่มีอีเมล ฟิลด์นี้เหลือไว้เผื่อโหมดจำลองเก่าเท่านั้น */
  email?: string
}

export interface PlayerState {
  uid: string
  name: string
  look: AvatarLook
  team: string
  score: number
  /** จำนวนข้อที่ตอบถูก */
  correct: number
  /** เวลารวมที่ใช้ตอบ (ใช้ตัดสินกรณีคะแนนเท่ากัน) */
  totalMs: number
  /** ตอบถูกติดกันกี่ข้อแล้ว */
  streak: number
  rank: number
  /** คะแนนที่เพิ่งได้จากข้อล่าสุด */
  lastGain: number
  lastCorrect: boolean | null
  lastBin: BinId | null
  /** ผลรายข้อของคนนี้ ใช้ทำสรุปตอนจบ — คิดด้วยกติกาเดียวกับตอนให้คะแนน */
  results: Record<number, RoundResult>
  /** ผู้เล่นจำลองสำหรับซ้อมระบบ (mock backend เท่านั้น) */
  bot?: boolean
}

/** ข้อมูลโจทย์ที่ "เปิดเผยได้" — ไม่มีคำเฉลยอยู่ในนี้ */
export interface PublicRound {
  index: number
  questionId: string
  itemName: string
  itemImage: string
  itemEmoji: string
  startedAt: number
}

/** เฉลย — เขียนหลังหมดเวลาตอบเท่านั้น */
export interface RevealInfo {
  index: number
  correctBin: BinId
  explanation: string
  /** ข้อที่คำตอบขึ้นกับว่าหน่วยงานมีจุดรับเฉพาะหรือไม่ */
  checkLocal: boolean
  distribution: Record<BinId, number>
  answeredCount: number
}

export interface BoardEntry {
  uid: string
  name: string
  look: AvatarLook
  team: string
  score: number
  /** คะแนนที่ได้จากข้อล่าสุด */
  delta: number
  rank: number
}

export interface TeamEntry {
  team: string
  /** คะแนนเฉลี่ยต่อคน — ใช้ค่าเฉลี่ยเพื่อไม่ให้ทีมคนเยอะได้เปรียบ */
  avgScore: number
  members: number
}

/** ภาพรวมห้องที่หน้าจอทุกเครื่องรับไปแสดง */
export interface RoomSnapshot {
  pin: string
  status: 'lobby' | 'running' | 'finished'
  phase: Phase
  phaseStartedAt: number
  phaseEndsAt: number
  paused: boolean
  roundIndex: number
  totalRounds: number
  round: PublicRound | null
  reveal: RevealInfo | null
  board: BoardEntry[]
  teamBoard: TeamEntry[]
  /** ตอนประกาศผล เฉลยไปแล้วกี่อันดับ (นับจากอันดับท้ายขึ้นมา) */
  finaleStep: number
  /**
   * รายชื่อผู้เล่นทั้งห้อง — **ส่งให้เครื่องสตาฟเท่านั้น**
   *
   * ห้อง 250 คนจะมีข้อมูลราว 50 KB ถ้าส่งก้อนนี้ให้ทุกเครื่องทุกครั้งที่คะแนนเปลี่ยน
   * จะกิน bandwidth หลักร้อย MB ต่อเกมบนไวไฟงาน และไม่มีอะไรในหน้าผู้เล่นที่ต้องใช้
   * หน้าผู้เล่นใช้ me + playerCount + board (10 อันดับ) พอ
   */
  players: PlayerState[]
  /** จำนวนคนในห้อง — ส่งให้ทุกเครื่อง แทนการส่งรายชื่อทั้งหมด */
  playerCount: number
  /** ข้อมูลของคนที่กำลังดูจออยู่ */
  me: PlayerState | null
  /**
   * คนที่กำลังดูจอนี้เป็นสตาฟของห้องนี้จริงไหม (คนแรกที่เข้าห้อง = สตาฟ)
   * หน้าจอกลางใช้ตัดสินใจว่าจะโชว์ปุ่มควบคุมให้กดไหม — ไม่งั้นใครก็เปิดลิงก์ #/live/host
   * มาเจอปุ่มพัก/ข้าม/เริ่มเกม กดได้ตามหน้าตา ทั้งที่เซิร์ฟเวอร์จะเงียบๆ ไม่ทำตามอยู่แล้ว
   */
  isHost: boolean
  answeredCount: number
  /** สรุปทุกข้อ — ใส่ให้เฉพาะตอนเกมจบแล้ว ระหว่างเล่นต้องไม่มีข้อมูลนี้หลุดไปถึงผู้เล่น */
  history: RoundHistory[]
  serverNow: number
}

export interface RoundResult {
  /** ถังที่ตอบ — null คือตอบไม่ทัน */
  bin: BinId | null
  correct: boolean
}

export interface RoundHistory {
  round: PublicRound
  reveal: RevealInfo
}

export interface JoinResult {
  ok: boolean
  reason?: string
}

export interface JoinProfile {
  name: string
  look: AvatarLook
  team: string
}
