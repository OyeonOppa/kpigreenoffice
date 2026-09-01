// รูปแบบข้อความที่รับส่งระหว่างเบราว์เซอร์กับ Durable Object
// ไฟล์นี้ต้องตรงกับ src/game/protocol.ts ฝั่งเว็บเสมอ

export type BinId = 'organic' | 'recycle' | 'general' | 'hazard'

export const BIN_IDS: BinId[] = ['organic', 'recycle', 'general', 'hazard']

export type Phase =
  | 'lobby'
  | 'countdown'
  | 'answering'
  | 'reveal'
  | 'explain'
  | 'board'
  | 'finale'
  | 'ended'

export interface AvatarLook {
  base: string
  color: string
  /** '' = ไม่มีกรอบ; ไม่งั้นเป็นชื่อสไตล์กรอบ (solid/double/dashed/dotted/glow) */
  ring: string
  /** '' = ไม่มีเหรียญ; ไม่งั้นเป็น emoji เหรียญที่มุมขวาล่าง */
  badge: string
}

export interface PlayerState {
  uid: string
  name: string
  look: AvatarLook
  team: string
  score: number
  correct: number
  totalMs: number
  streak: number
  rank: number
  lastGain: number
  lastCorrect: boolean | null
  lastBin: BinId | null
  bot?: boolean
}

export interface PublicRound {
  index: number
  questionId: string
  itemName: string
  itemImage: string
  itemEmoji: string
  startedAt: number
}

export interface RevealInfo {
  index: number
  correctBin: BinId
  explanation: string
  /** แหล่งอ้างอิงคำเฉลย — ผู้เล่นกดเปิดตรวจสอบได้จากหน้าเฉลย */
  source: { label: string; url: string }
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
  delta: number
  rank: number
}

export interface TeamEntry {
  team: string
  avgScore: number
  members: number
}

export interface RoundHistory {
  round: PublicRound
  reveal: RevealInfo
}

export interface RoundResult {
  bin: BinId | null
  correct: boolean
}

/**
 * สถานะห้องส่วนที่ส่งให้ "ทุกคน"
 * ไม่มีรายชื่อผู้เล่นทั้งห้องและไม่มีคำเฉลยของข้อที่ยังไม่จบ
 */
export interface PublicRoom {
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
  finaleStep: number
  playerCount: number
  answeredCount: number
  history: RoundHistory[]
  serverNow: number
}

// ---------- เบราว์เซอร์ → เซิร์ฟเวอร์ ----------

export type ClientMessage =
  // ไม่มีล็อกอิน — ผู้เล่นสร้าง uid สุ่มของตัวเองแล้วเก็บไว้ในเครื่อง ส่งกลับมาทุกครั้งที่ต่อ
  // เพื่อให้เป็นคนเดิมตอน reconnect (เน็ตสะดุด/รีเฟรช) ไม่งั้นจะเสียคะแนน/เสียสิทธิ์สตาฟ
  | { t: 'auth'; uid: string; name: string }
  | { t: 'join'; name: string; look: AvatarLook; team: string }
  | { t: 'leave' }
  | { t: 'answer'; round: number; bin: BinId }
  | { t: 'start' }
  | { t: 'skip' }
  | { t: 'pause' }
  | { t: 'nextFinale' }
  | { t: 'addBots'; count: number }
  | { t: 'ping' }

// ---------- เซิร์ฟเวอร์ → เบราว์เซอร์ ----------

export type ServerMessage
  = { t: 'authed'; uid: string; name: string; isHost: boolean }
  | { t: 'room'; room: PublicRoom }
  /** สถานะของผู้เล่นคนที่ถือ socket นี้ */
  | { t: 'me'; me: PlayerState | null; results: Record<number, RoundResult> }
  /** รายชื่อทั้งห้อง — ส่งให้เครื่องสตาฟเท่านั้น */
  | { t: 'roster'; players: PlayerState[] }
  | { t: 'joined'; ok: boolean; reason?: string }
  | { t: 'answerAck'; round: number; accepted: boolean; bin: BinId }
  | { t: 'error'; reason: string }
  | { t: 'pong'; serverNow: number }
