// รูปแบบข้อความที่รับส่งกับ Durable Object
// ต้องตรงกับ worker/src/protocol.ts เสมอ — แก้ที่ไหนต้องแก้อีกที่ด้วย

import type { AvatarLook, BinId, BoardEntry, PlayerState, Phase, PublicRound, RevealInfo, RoundHistory, RoundResult, TeamEntry } from './types'

/** สถานะห้องส่วนที่เซิร์ฟเวอร์ส่งให้ทุกคน (ไม่มีรายชื่อทั้งห้อง ไม่มีคำเฉลยของข้อที่ยังไม่จบ) */
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

export type ClientMessage =
  | { t: 'auth'; token?: string; devName?: string }
  | { t: 'join'; name: string; look: AvatarLook; team: string }
  | { t: 'answer'; round: number; bin: BinId }
  | { t: 'start' }
  | { t: 'skip' }
  | { t: 'pause' }
  | { t: 'nextFinale' }
  | { t: 'addBots'; count: number }
  | { t: 'ping' }

export type ServerMessage =
  | { t: 'authed'; uid: string; email: string; name: string; isHost: boolean }
  | { t: 'room'; room: PublicRoom }
  // เซิร์ฟเวอร์ส่ง results มาแยกจาก me — adapter เป็นคนรวมให้เป็น PlayerState เต็มรูป
  | { t: 'me'; me: Omit<PlayerState, 'results'> | null; results: Record<number, RoundResult> }
  | { t: 'roster'; players: PlayerState[] }
  | { t: 'joined'; ok: boolean; reason?: string }
  | { t: 'answerAck'; round: number; accepted: boolean; bin: BinId }
  | { t: 'error'; reason: string }
  | { t: 'pong'; serverNow: number }
