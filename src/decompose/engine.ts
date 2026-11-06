// ตัวเกม "ย่อยนานแค่ไหน?" — ตรรกะล้วน ไม่ผูกกับ React
// State เข้า → State ใหม่ออก (ไม่แก้ของเดิม) ใช้กับ useState ได้ตรงๆ และทดสอบด้วย node ได้
//
// กติกาตรวจ: ระดับของการ์ดใหม่ต้อง ≥ ใบซ้ายที่ติดกัน และ ≤ ใบขวาที่ติดกัน (ระดับเท่ากันวางสลับกันได้)
// โหมด coop    ผลัดกันจั่วใบบนสุดของกอง วางผิด = ความร้อน +1 ครบ 3 แพ้ · แถวยาวถึง 10 ชนะ
// โหมด versus  แข่งกับบอท คนละ 4 ใบ วางถูก = ใบหมดไป วางผิด = จั่วเพิ่ม 1 ใบ ใครหมดมือก่อนชนะ

import { ITEMS, type Item } from './cards.ts'

export type Mode = 'coop' | 'versus'
export type Rng = () => number

export const HEAT_MAX = 3
export const ROW_GOAL = 10
export const HAND_SIZE = 4

export interface Player {
  name: string
  avatar: string
  human: boolean
  hand: number[] // id การ์ดในมือ (โหมด versus)
  /** บอท: โอกาสเดาระดับผิด */
  err: number
}

export interface Reveal {
  who: number
  card: number
  index: number
  ok: boolean
}

export interface State {
  mode: Mode
  row: number[]
  deck: number[]
  players: Player[]
  turn: number
  heat: number
  /** coop: การ์ดที่จั่วมาให้วาง */
  drawn: number | null
  phase: 'place' | 'reveal' | 'over'
  reveal: Reveal | null
  won: boolean | null
  winner: number | null
  log: string[]
}

export const itemOf = (id: number): Item => ITEMS.find((i) => i.id === id)!

function shuffle<T>(a: T[], rng: Rng): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

/** วางการ์ด tier t ที่ตำแหน่ง index (0..row.length) ได้ไหม */
export function fits(row: number[], index: number, tier: number): boolean {
  const left = index > 0 ? itemOf(row[index - 1]).tier : 0
  const right = index < row.length ? itemOf(row[index]).tier : 99
  return left <= tier && tier <= right
}

const BOTS = [
  { name: 'น้องกล้วย', avatar: '🍌', err: 0.3 },
  { name: 'พี่กระป๋อง', avatar: '🥫', err: 0.22 },
  { name: 'ลุงเต่า', avatar: '🐢', err: 0.15 },
]

export function newGame(mode: Mode, bots: number, rng: Rng = Math.random): State {
  const deck = shuffle(ITEMS.map((i) => i.id), rng)
  const row = [deck.pop()!]
  const players: Player[] = [{ name: 'คุณ', avatar: '🙂', human: true, hand: [], err: 0 }]
  if (mode === 'versus') {
    BOTS.slice(0, bots).forEach((b) => players.push({ ...b, human: false, hand: [] }))
    players.forEach((p) => {
      for (let i = 0; i < HAND_SIZE; i++) p.hand.push(deck.pop()!)
    })
  }
  const s: State = {
    mode,
    row,
    deck,
    players,
    turn: 0,
    heat: 0,
    drawn: null,
    phase: 'place',
    reveal: null,
    won: null,
    winner: null,
    log: [],
  }
  if (mode === 'coop') s.drawn = deck.pop()!
  return s
}

/** ผู้เล่นที่ต้องลงมือตอนนี้ (-1 = ไม่มี) */
export const actor = (s: State) => (s.phase === 'place' ? s.turn : -1)

/** วางการ์ดลงตำแหน่ง index แล้วเข้าเฟสเฉลย */
export function place(s: State, cardId: number, index: number): State {
  if (s.phase !== 'place') return s
  const n = structuredClone(s)
  const card = itemOf(cardId)
  const ok = fits(n.row, index, card.tier)
  const me = n.players[n.turn]
  if (n.mode === 'versus') me.hand = me.hand.filter((c) => c !== cardId)
  if (ok) n.row.splice(index, 0, cardId)
  else if (n.mode === 'coop') n.heat++
  else if (n.deck.length) me.hand.push(n.deck.pop()!)
  n.reveal = { who: n.turn, card: cardId, index, ok }
  n.drawn = null
  n.phase = 'reveal'
  n.log.push(`${me.name} วาง ${card.name} ${ok ? 'ถูก' : 'ผิด'}`)
  return n
}

/** ปิดเฉลย ไปตาต่อไป / ตรวจจบเกม */
export function next(s: State): State {
  if (s.phase !== 'reveal') return s
  const n = structuredClone(s)
  const r = n.reveal!
  n.reveal = null
  if (n.mode === 'coop') {
    if (n.heat >= HEAT_MAX) return { ...n, phase: 'over', won: false }
    if (n.row.length >= ROW_GOAL) return { ...n, phase: 'over', won: true }
    if (!n.deck.length) return { ...n, phase: 'over', won: n.row.length >= ROW_GOAL }
    n.drawn = n.deck.pop()!
    n.turn = (n.turn + 1) % n.players.length
    n.phase = 'place'
    return n
  }
  if (n.players[r.who].hand.length === 0) {
    return { ...n, phase: 'over', winner: r.who, won: n.players[r.who].human }
  }
  // ถ้าทุกคนยังมีการ์ดแต่กองหมดและไม่มีใครวางได้อีก ก็จบแบบเสมอด้วยจำนวนใบน้อยสุด
  n.turn = (n.turn + 1) % n.players.length
  n.phase = 'place'
  return n
}

/** บอทเลือกวาง: เดาระดับ (อาจผิด) แล้วเลือกช่องที่เข้ากับระดับที่เดา */
export function botAct(s: State, rng: Rng = Math.random): State {
  const p = s.players[s.turn]
  const cardId = p.hand[Math.floor(rng() * p.hand.length)]
  const real = itemOf(cardId).tier
  let guess = real
  if (rng() < p.err) guess = Math.min(6, Math.max(1, real + (rng() < 0.5 ? -1 : 1) * (rng() < 0.7 ? 1 : 2)))
  const slots: number[] = []
  for (let i = 0; i <= s.row.length; i++) if (fits(s.row, i, guess)) slots.push(i)
  const index = slots.length ? slots[Math.floor(rng() * slots.length)] : s.row.length
  return place(s, cardId, index)
}

/** ตำแหน่งที่วางได้ทั้งหมดตามระดับจริง (ใช้ในสคริปต์ทดสอบ/เฉลยท้ายเกม) */
export const legalSlots = (row: number[], tier: number) =>
  Array.from({ length: row.length + 1 }, (_, i) => i).filter((i) => fits(row, i, tier))
