// ตัวเกม "ฝ่าด่านลดคาร์บอน" — ตรรกะล้วน ไม่ผูกกับ React
//
// ทุกฟังก์ชันรับ State คืน State ใหม่ (ไม่แก้ของเดิม) ใช้กับ useState ได้ตรงๆ และทดสอบด้วย node ได้
// (scripts/sim-barrier.mjs) กติกาเต็มอยู่ใน README.md ข้างๆ ไฟล์นี้
//
// ลำดับของ 1 ตา:
//   p-turn    ฝ่ายผลักดันทำ 1 อย่าง (🔍 เล่นฟรีก่อนได้)
//             · ถ้าวางมาตรการและมีด่านคว่ำ → เปิดด่านคว่ำทันที (counter ถ้าแก้ได้)
//   b-respond ฝ่ายต่อต้านตอบ 1 ใบ (หรือผ่าน)  · ถ้าเป็นการ์ดด่าน → counter · ถ้าเป็นข่าวลือ → negate
//   finish    นับคะแนน (ทุกอย่างที่ยังอยู่บนโต๊ะ) · จั่วเติม · ตรวจจบเกม

import {
  B_ITEM_IDS,
  BLOCKS,
  KEY_COUNTS,
  MEASURES,
  P_ITEM_IDS,
  RUMORS,
  type BItem,
  type BlockCard,
  type Card,
  type Cat,
  type Icon,
  type KeyCard,
  type KeyKind,
  type MeasureCard,
  type PItem,
  type RumorCard,
  type Side,
} from './cards.ts'

export interface Att {
  id: number
  kind: 'media' | 'meter'
}
export interface Entry {
  id: number
  card: MeasureCard
  att: Att[]
}

export type Phase = 'p-turn' | 'b-respond' | 'counter' | 'negate' | 'over'

export type Pending =
  | { kind: 'counter'; block: BlockCard; entryId: number; next: 'respond' | 'finish' }
  | { kind: 'negate'; rumor: RumorCard }

export interface State {
  /** ฝั่งที่คนจริงเล่น (อีกฝั่งเป็นบอท) · null = บอททั้งสองฝั่ง (ใช้จำลอง) */
  human: Side | null
  target: number
  phase: Phase
  pHand: Card[]
  bHand: Card[]
  pDeck: Card[]
  bDeck: Card[]
  pItems: PItem[]
  bItems: BItem[]
  table: Entry[]
  trap: BlockCard | null
  score: number
  turn: number
  /** ถูกตัดงบ: ตาหน้าของฝ่ายผลักดันวางการ์ดไม่ได้ ต้องทิ้ง 2 ใบ */
  frozen: boolean
  /** มาตรการที่เพิ่งวางในตานี้ (ฝ่ายต่อต้านปิดได้เฉพาะใบนี้) */
  ctx: number | null
  pending: Pending | null
  log: string[]
  won: boolean | null
  nextId: number
}

export type Rng = () => number

export interface NewGameOptions {
  human: Side | null
  target: number
  pStart: PItem
  bStart: BItem
}

const shuffle = <T>(arr: T[], rng: Rng): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const clone = (s: State): State => structuredClone(s)
const rm = <T>(arr: T[], x: T) => {
  const i = arr.indexOf(x)
  if (i >= 0) arr.splice(i, 1)
}
const say = (s: State, text: string) => {
  s.log.push(text)
  if (s.log.length > 60) s.log.shift()
}

/* ------------------------------------------------------------------ เริ่มเกม */

export function newGame(o: NewGameOptions, rng: Rng = Math.random): State {
  let id = 1
  const pCards: Card[] = []
  MEASURES.forEach((m) => pCards.push({ ...m, id: id++, kind: 'measure' }))
  ;(Object.keys(KEY_COUNTS) as (keyof typeof KEY_COUNTS)[]).forEach((k) => {
    for (let i = 0; i < KEY_COUNTS[k]; i++) pCards.push({ id: id++, kind: 'key', k })
  })
  for (let i = 0; i < 3; i++) pCards.push({ id: id++, kind: 'key', k: 'S' }) // 📏 ใช้เป็นกุญแจหรือประกบก็ได้
  for (let i = 0; i < 2; i++) pCards.push({ id: id++, kind: 'media' })
  for (let i = 0; i < 2; i++) pCards.push({ id: id++, kind: 'search' })
  P_ITEM_IDS.filter((x) => x !== o.pStart).forEach((item) => pCards.push({ id: id++, kind: 'pitem', item }))

  const bCards: Card[] = []
  BLOCKS.forEach((b) => bCards.push({ ...b, id: id++, kind: 'block' }))
  RUMORS.forEach((r) => bCards.push({ ...r, id: id++, kind: 'rumor' }))
  bCards.push({ id: id++, kind: 'wipe' })
  for (let i = 0; i < 2; i++) bCards.push({ id: id++, kind: 'freeze' })
  for (let i = 0; i < 2; i++) bCards.push({ id: id++, kind: 'scatter' })
  B_ITEM_IDS.filter((x) => x !== o.bStart).forEach((item) => bCards.push({ id: id++, kind: 'bitem', item }))

  const s: State = {
    human: o.human,
    target: o.target,
    phase: 'p-turn',
    pHand: [],
    bHand: [],
    pDeck: shuffle(pCards, rng),
    bDeck: shuffle(bCards, rng),
    pItems: [o.pStart],
    bItems: [o.bStart],
    table: [],
    trap: null,
    score: 0,
    turn: 1,
    frozen: false,
    ctx: null,
    pending: null,
    log: ['เริ่มเกม — ฝ่ายผลักดันเล่นก่อน'],
    won: null,
    nextId: id,
  }
  drawP(s)
  drawB(s)
  return s
}

/* ------------------------------------------------------------------ ตัวช่วยอ่านสถานะ */

export const pHas = (s: State, i: PItem) => s.pItems.includes(i)
export const bHas = (s: State, i: BItem) => s.bItems.includes(i)
export const handMax = (s: State) => (pHas(s, 'edu') ? 5 : 4)

function drawP(s: State) {
  while (s.pHand.length < handMax(s) && s.pDeck.length) s.pHand.push(s.pDeck.pop()!)
}
function drawB(s: State) {
  while (s.bHand.length < 4 && s.bDeck.length) s.bHand.push(s.bDeck.pop()!)
}

/** ใครต้องตัดสินใจตอนนี้ */
export function actor(s: State): Side | null {
  if (s.phase === 'p-turn' || s.phase === 'counter' || s.phase === 'negate') return 'P'
  if (s.phase === 'b-respond') return 'B'
  return null
}

export const entryOf = (s: State, id: number | null) => (id === null ? undefined : s.table.find((e) => e.id === id))

export function catCounts(s: State): Record<Cat, number> {
  const c: Record<Cat, number> = { energy: 0, waste: 0, travel: 0, nature: 0 }
  for (const e of s.table) c[e.card.cat]++
  return c
}
/** หมวดที่ได้ "ระบบครบวงจร" (มาตรการหมวดเดียวกันรอด ≥ 3 ใบ) */
export function comboCats(s: State): Cat[] {
  const c = catCounts(s)
  return (Object.keys(c) as Cat[]).filter((k) => c[k] >= 3)
}

/** แต้มที่ฝ่ายผลักดันจะได้ในตานี้ ถ้านับตอนนี้ */
export function turnScore(s: State, newEntryId: number | null = s.ctx): number {
  let t = 0
  for (const e of s.table) {
    let v = e.card.pts + e.att.length
    if (bHas(s, 'red') && e.id === newEntryId && e.card.icons.includes('E')) v = 0
    t += v
  }
  t += 2 * comboCats(s).length
  if (bHas(s, 'ad') && s.table.length > 0) t -= 1
  return Math.max(0, t)
}

/** ไอคอนที่ด่านนี้ปิดมาตรการนี้ได้จริง (หลังหักผลไอเท็ม 📊) */
export function matchedIcons(s: State, block: BlockCard, entry: Entry): Icon[] {
  return block.icons.filter((i) => entry.card.icons.includes(i) && !(i === 'S' && pHas(s, 'board')))
}

/** กุญแจในมือที่ใช้แก้ด่านนี้ได้ */
export function counterKeys(s: State, block: BlockCard, entry: Entry): KeyCard[] {
  const matched = matchedIcons(s, block, entry)
  if (!matched.length) return []
  return s.pHand.filter(
    (c): c is KeyCard =>
      c.kind === 'key' &&
      (c.k === 'W' || (matched.includes(c.k as Icon) && !(c.k === 'P' && bHas(s, 'comfort')))),
  )
}

/** การ์ดด่านในมือฝ่ายต่อต้านที่ปิดมาตรการล่าสุดได้ */
export function legalBlocks(s: State): BlockCard[] {
  const e = entryOf(s, s.ctx)
  if (!e) return []
  return s.bHand.filter((c): c is BlockCard => c.kind === 'block' && matchedIcons(s, c, e).length > 0)
}

/** การ์ดที่เล่นได้ในตอนนี้ (ใช้ตัดสินจบเกม และเปิด/ปิดปุ่ม) */
export function isPlayable(s: State, c: Card): boolean {
  if (c.kind === 'measure' || c.kind === 'pitem') return true
  if (c.kind === 'media') return s.table.length > 0
  if (c.kind === 'search') return s.trap !== null
  if (c.kind === 'key' && c.k === 'S') return s.table.length > 0
  return false
}

const cardLabel = (c: Card): string => {
  switch (c.kind) {
    case 'measure':
      return `${c.emoji}${c.name}`
    case 'block':
      return `ด่าน “${c.name}”`
    case 'rumor':
      return `${c.emoji}${c.name}`
    default:
      return c.kind
  }
}

/* ------------------------------------------------------------------ จบตา / จบเกม */

function finishTurn(s: State) {
  const gained = turnScore(s)
  s.score += gained
  say(s, `นับคะแนนตานี้ +${gained} → รวม ${s.score}`)
  s.ctx = null
  s.pending = null
  drawP(s)
  drawB(s)
  const out = s.pDeck.length === 0 && !s.pHand.some((c) => isPlayable(s, c))
  if (out || s.turn >= 150) {
    s.phase = 'over'
    s.won = s.score >= s.target
    say(s, s.won ? `จบเกม ได้ ${s.score} ถึงเป้า ${s.target} — ฝ่ายผลักดันชนะ` : `จบเกม ได้ ${s.score} ไม่ถึงเป้า ${s.target} — ฝ่ายต่อต้านชนะ`)
    return
  }
  s.turn++
  s.phase = 'p-turn'
}

function goNext(s: State, next: 'respond' | 'finish') {
  if (next === 'respond') s.phase = 'b-respond'
  else finishTurn(s)
}

/* ------------------------------------------------------------------ ด่านและการตอบโต้ */

function removeEntry(s: State, id: number) {
  const i = s.table.findIndex((e) => e.id === id)
  if (i >= 0) s.table.splice(i, 1)
}

function applyBlocked(s: State, entry: Entry) {
  removeEntry(s, entry.id)
  say(s, `${cardLabel(entry.card)} ถูกปิด${entry.att.length ? ` (ตัวเสริม ${entry.att.length} ใบหายไปด้วย)` : ''}`)
  if (pHas(s, 'net') && s.pDeck.length) {
    s.pHand.push(s.pDeck.pop()!)
    say(s, '🤝 เครือข่ายอาสา: จั่วการ์ด 1 ใบ')
  }
}

function resolveBlock(s: State, block: BlockCard, entryId: number, next: 'respond' | 'finish') {
  const entry = entryOf(s, entryId)
  if (!entry) return goNext(s, next)
  const matched = matchedIcons(s, block, entry)
  if (!matched.length) {
    say(s, `${cardLabel(block)} ไม่มีผลกับ ${cardLabel(entry.card)}`)
    return goNext(s, next)
  }
  const keys = counterKeys(s, block, entry)
  if (s.human === 'P') {
    if (keys.length) {
      s.pending = { kind: 'counter', block, entryId, next }
      s.phase = 'counter'
      return
    }
    applyBlocked(s, entry)
    return goNext(s, next)
  }
  // บอทฝ่ายผลักดัน: ใช้กุญแจที่ตรงก่อน ⭐ ใช้เฉพาะมาตรการ 2 แต้มขึ้นไป
  const pick = keys.find((k) => k.k !== 'W') ?? (entry.card.pts >= 2 ? keys.find((k) => k.k === 'W') : undefined)
  if (pick) {
    rm(s.pHand, s.pHand.find((c) => c.id === pick.id)!)
    say(s, `ฝ่ายผลักดันทิ้งกุญแจ ${pick.k === 'W' ? '⭐' : pick.k} แก้ด่านได้ — ${cardLabel(entry.card)} รอด`)
  } else {
    applyBlocked(s, entry)
  }
  goNext(s, next)
}

/** ฝ่ายผลักดัน (คน) เลือกกุญแจแก้ด่าน หรือปล่อยให้ปิด (null) */
export function counter(s0: State, keyId: number | null): State {
  if (s0.phase !== 'counter' || s0.pending?.kind !== 'counter') return s0
  const s = clone(s0)
  const p = s.pending as Extract<Pending, { kind: 'counter' }>
  const entry = entryOf(s, p.entryId)
  s.pending = null
  if (!entry) {
    goNext(s, p.next)
    return s
  }
  if (keyId !== null) {
    const legal = counterKeys(s, p.block, entry).find((k) => k.id === keyId)
    if (!legal) return s0
    rm(s.pHand, s.pHand.find((c) => c.id === keyId)!)
    say(s, `คุณทิ้งกุญแจแก้ด่านได้ — ${cardLabel(entry.card)} รอด`)
  } else {
    applyBlocked(s, entry)
  }
  goNext(s, p.next)
  return s
}

/** ฝ่ายผลักดัน (คน) ตัดสินใจว่าจะทิ้ง 📏 ยกเลิกข่าวลือหรือไม่ */
export function negate(s0: State, yes: boolean): State {
  if (s0.phase !== 'negate' || s0.pending?.kind !== 'negate') return s0
  const s = clone(s0)
  const r = (s.pending as Extract<Pending, { kind: 'negate' }>).rumor
  s.pending = null
  if (yes) {
    const k = s.pHand.find((c) => c.kind === 'key' && c.k === 'S')
    if (!k) return s0
    rm(s.pHand, k)
    say(s, `คุณทิ้ง 📏 ยกเลิก ${r.emoji}${r.name} ได้`)
  } else {
    s.score = Math.max(0, s.score - r.v)
    say(s, `${r.emoji}${r.name} หัก ${r.v} แต้ม → เหลือ ${s.score}`)
  }
  finishTurn(s)
  return s
}

/* ------------------------------------------------------------------ การกระทำของฝ่ายผลักดัน */

function canActP(s: State) {
  return s.phase === 'p-turn' && !s.frozen
}

/** 🔍 เล่นฟรี ไม่เสียตา: เปิดดูด่านคว่ำแล้วทิ้ง */
export function playSearch(s0: State): State {
  if (!canActP(s0) || !s0.trap) return s0
  const c = s0.pHand.find((x) => x.kind === 'search')
  if (!c) return s0
  const s = clone(s0)
  rm(s.pHand, s.pHand.find((x) => x.id === c.id)!)
  const t = s.trap!
  say(s, `🔍 สำรวจก่อนทำ: เปิดด่านคว่ำ คือ “${t.name}” (${t.icons.join('')}) แล้วทิ้ง`)
  s.trap = null
  // 🔍 เป็นใบสุดท้ายในมือ และกองหมดแล้ว — ไม่มีอะไรให้ทำต่อ ให้ตานี้จบ (นับคะแนน แล้วตรวจจบเกม)
  if (s.pHand.length === 0 && s.pDeck.length === 0) finishTurn(s)
  return s
}

function enterBResponse(s: State, entryId: number | null) {
  s.ctx = entryId
  s.phase = 'b-respond'
}

export function playMeasure(s0: State, cardId: number): State {
  if (!canActP(s0)) return s0
  const card = s0.pHand.find((c) => c.id === cardId)
  if (!card || card.kind !== 'measure') return s0
  const s = clone(s0)
  rm(s.pHand, s.pHand.find((c) => c.id === cardId)!)
  const entry: Entry = { id: card.id, card, att: [] }
  s.table.push(entry)
  say(s, `ฝ่ายผลักดันวาง ${cardLabel(card)} (${card.pts} แต้ม)`)
  s.ctx = entry.id
  if (s.trap) {
    const t = s.trap
    s.trap = null
    say(s, `เปิดด่านคว่ำ: “${t.name}”`)
    resolveBlock(s, t, entry.id, 'respond')
  } else {
    s.phase = 'b-respond'
  }
  return s
}

export function attach(s0: State, cardId: number, entryId: number): State {
  if (!canActP(s0)) return s0
  const card = s0.pHand.find((c) => c.id === cardId)
  const isAtt = card && (card.kind === 'media' || (card.kind === 'key' && card.k === 'S'))
  if (!card || !isAtt || !entryOf(s0, entryId)) return s0
  const s = clone(s0)
  rm(s.pHand, s.pHand.find((c) => c.id === cardId)!)
  const e = entryOf(s, entryId)!
  e.att.push({ id: card.id, kind: card.kind === 'media' ? 'media' : 'meter' })
  say(s, `ประกบ ${card.kind === 'media' ? '📰 ออกสื่อ' : '📏 วัดผลให้เห็น'} บน ${cardLabel(e.card)} (+1 แต้ม/ตา)`)
  enterBResponse(s, null)
  return s
}

export function playPItem(s0: State, cardId: number): State {
  if (!canActP(s0)) return s0
  const card = s0.pHand.find((c) => c.id === cardId)
  if (!card || card.kind !== 'pitem') return s0
  const s = clone(s0)
  rm(s.pHand, s.pHand.find((c) => c.id === cardId)!)
  s.pItems.push(card.item)
  say(s, `ฝ่ายผลักดันวางไอเท็มถาวร`)
  enterBResponse(s, null)
  return s
}

export function pDiscard(s0: State, cardId: number): State {
  if (!canActP(s0)) return s0
  const card = s0.pHand.find((c) => c.id === cardId)
  if (!card) return s0
  const s = clone(s0)
  rm(s.pHand, s.pHand.find((c) => c.id === cardId)!)
  say(s, 'ฝ่ายผลักดันทิ้งการ์ด 1 ใบ')
  enterBResponse(s, null)
  return s
}

/** ถูกตัดงบ: ทิ้งการ์ด 2 ใบ (หรือเท่าที่เหลือ) แล้วข้ามการวางการ์ดตานี้ */
export function frozenDiscard(s0: State, ids: number[]): State {
  if (s0.phase !== 'p-turn' || !s0.frozen) return s0
  const need = Math.min(2, s0.pHand.length)
  const uniq = [...new Set(ids)].filter((id) => s0.pHand.some((c) => c.id === id))
  if (uniq.length !== need) return s0
  const s = clone(s0)
  for (const id of uniq) rm(s.pHand, s.pHand.find((c) => c.id === id)!)
  s.frozen = false
  say(s, `✂️ ถูกตัดงบ: ฝ่ายผลักดันวางการ์ดไม่ได้ และทิ้ง ${uniq.length} ใบ`)
  enterBResponse(s, null)
  return s
}

/* ------------------------------------------------------------------ การตอบของฝ่ายต่อต้าน */

export type BAct =
  | { t: 'pass' }
  | { t: 'block'; cardId: number }
  | { t: 'trap'; cardId: number }
  | { t: 'item'; cardId: number }
  | { t: 'special'; cardId: number; targetEntryId?: number }

/** ข่าวลือ/ฟอกเขียว: หักคะแนน (ฝ่ายผลักดันทิ้ง 📏 ยกเลิกได้) */
function playRumor(s: State, r: RumorCard) {
  say(s, `ฝ่ายต่อต้านเล่น ${r.emoji}${r.name} (−${r.v})`)
  const meter = s.pHand.find((c) => c.kind === 'key' && c.k === 'S')
  if (s.human === 'P') {
    if (meter) {
      s.pending = { kind: 'negate', rumor: r }
      s.phase = 'negate'
      return
    }
  } else if (meter && r.v >= 8) {
    // บอท: ยกเลิกเฉพาะใบแรงๆ เก็บ 📏 ไว้ประกบมาตรการถ้าเป็นใบเล็ก
    rm(s.pHand, meter)
    say(s, `ฝ่ายผลักดันทิ้ง 📏 ยกเลิกได้`)
    return finishTurn(s)
  }
  s.score = Math.max(0, s.score - r.v)
  say(s, `คะแนนเหลือ ${s.score}`)
  finishTurn(s)
}

function doWipe(s: State) {
  const counts = catCounts(s)
  const victims = s.table.filter((e) => !e.att.some((a) => a.kind === 'meter') && counts[e.card.cat] < 3)
  victims.forEach((e) => removeEntry(s, e.id))
  say(s, `📉 เปลี่ยนคนทำ ไม่มีใครสานต่อ: ทิ้ง ${victims.length} มาตรการ${victims.length === 0 ? ' (ทุกใบมี 📏 หรืออยู่ในระบบครบวงจร จึงรอดหมด)' : ''}`)
}

export function bRespond(s0: State, act: BAct): State {
  if (s0.phase !== 'b-respond') return s0
  const s = clone(s0)
  if (act.t === 'pass') {
    say(s, 'ฝ่ายต่อต้านผ่าน')
    finishTurn(s)
    return s
  }
  const card = s.bHand.find((c) => c.id === ('cardId' in act ? act.cardId : -1))
  if (!card) return s0
  if (act.t === 'block') {
    if (card.kind !== 'block') return s0
    const e = entryOf(s, s.ctx)
    if (!e || matchedIcons(s, card, e).length === 0) return s0
    rm(s.bHand, card)
    say(s, `ฝ่ายต่อต้านวางด่าน “${card.name}” ใส่ ${cardLabel(e.card)}`)
    resolveBlock(s, card, e.id, 'finish')
    return s
  }
  if (act.t === 'trap') {
    if (card.kind !== 'block' || s.trap) return s0
    rm(s.bHand, card)
    s.trap = card
    say(s, 'ฝ่ายต่อต้านวางด่านคว่ำไว้ 1 ใบ (จะเปิดเมื่อมีมาตรการใหม่)')
    finishTurn(s)
    return s
  }
  if (act.t === 'item') {
    if (card.kind !== 'bitem') return s0
    rm(s.bHand, card)
    s.bItems.push(card.item)
    say(s, 'ฝ่ายต่อต้านวางไอเท็มถาวร')
    finishTurn(s)
    return s
  }
  // special
  if (card.kind === 'rumor') {
    rm(s.bHand, card)
    playRumor(s, card)
    return s
  }
  if (card.kind === 'wipe') {
    rm(s.bHand, card)
    doWipe(s)
    finishTurn(s)
    return s
  }
  if (card.kind === 'freeze') {
    rm(s.bHand, card)
    s.frozen = true
    say(s, '✂️ ฝ่ายต่อต้านตัดงบกลางปี — ตาหน้าฝ่ายผลักดันวางการ์ดไม่ได้')
    finishTurn(s)
    return s
  }
  if (card.kind === 'scatter') {
    const target = entryOf(s, act.targetEntryId ?? -1) ?? s.table.find((e) => e.att.length)
    if (!target || target.att.length === 0) return s0
    rm(s.bHand, card)
    target.att.pop()
    say(s, `🗂️ ข้อมูลกระจัดกระจาย: ตัวเสริมบน ${cardLabel(target.card)} หายไป 1 ใบ`)
    finishTurn(s)
    return s
  }
  return s0
}

/** ผู้เล่นฝ่ายต่อต้านเลือกเล่นการ์ดพิเศษได้เมื่อไหร่ */
export function scatterTargets(s: State): Entry[] {
  return s.table.filter((e) => e.att.length > 0)
}

/* ------------------------------------------------------------------ บอท */

const BOT = { baseSurvive: 0.45, blockMin: 2, wipeAt: 5, rumorAt: 6, freezeP: 0.4 }

function botP(s0: State, rng: Rng): State {
  let s = s0
  if (s.frozen) {
    const ids = [...s.pHand]
      .sort((a, b) => Number(b.kind === 'key') - Number(a.kind === 'key'))
      .slice(0, Math.min(2, s.pHand.length))
      .map((c) => c.id)
    return frozenDiscard(s, ids)
  }
  if (s.trap && s.pHand.some((c) => c.kind === 'search')) s = playSearch(s)

  const item = s.pHand.find((c) => c.kind === 'pitem')
  if (item) return playPItem(s, item.id)

  const keys = s.pHand.filter((c): c is KeyCard => c.kind === 'key')
  const hasW = keys.some((k) => k.k === 'W')
  const scoreM = (m: MeasureCard) => {
    const used = [...keys]
    let cov = 0
    for (const ic of m.icons) {
      if (pHas(s, 'board') && ic === 'S') {
        cov++
        continue
      }
      const i = used.findIndex((k) => k.k === ic && !(ic === 'P' && bHas(s, 'comfort')))
      if (i >= 0) {
        used.splice(i, 1)
        cov++
      }
    }
    const c = Math.max(cov / m.icons.length, hasW ? 0.4 : 0)
    const survive = c + (1 - c) * BOT.baseSurvive
    return m.pts * survive * (1 + 0.1 * (s.pDeck.length / 5))
  }
  const ms = s.pHand
    .filter((c): c is MeasureCard => c.kind === 'measure')
    .map((c) => ({ c, v: scoreM(c) }))
    .sort((a, b) => b.v - a.v)
  const media = s.pHand.find((c) => c.kind === 'media')
  const meters = keys.filter((k) => k.k === 'S')
  const top = [...s.table].sort((a, b) => b.card.pts + b.att.length - (a.card.pts + a.att.length))[0]

  if (media && top && (!ms.length || ms[0].v < 1.2)) return attach(s, media.id, top.id)
  if (meters.length >= 2 && top && (!ms.length || ms[0].v < 1.6)) return attach(s, meters[0].id, top.id)
  if (ms.length) return playMeasure(s, ms[0].c.id)
  if (media && top) return attach(s, media.id, top.id)
  if (meters.length && top) return attach(s, meters[0].id, top.id)

  const count: Record<string, number> = {}
  keys.forEach((k) => (count[k.k] = (count[k.k] ?? 0) + 1))
  const disc = keys.filter((k) => k.k !== 'W').sort((a, b) => count[b.k] - count[a.k])[0] ?? s.pHand[0]
  if (!disc) return s
  void rng
  return pDiscard(s, disc.id)
}

function botB(s: State, rng: Rng): State {
  const has = (k: Card['kind']) => s.bHand.find((c) => c.kind === k)
  const bItem = has('bitem')
  if (bItem) return bRespond(s, { t: 'item', cardId: bItem.id })

  const wipe = has('wipe')
  if (wipe) {
    const counts = catCounts(s)
    const victims = s.table.filter((e) => !e.att.some((a) => a.kind === 'meter') && counts[e.card.cat] < 3)
    const val = victims.reduce((t, e) => t + e.card.pts + e.att.length, 0)
    if (val >= BOT.wipeAt) return bRespond(s, { t: 'special', cardId: wipe.id })
  }

  const rumors = s.bHand.filter((c): c is RumorCard => c.kind === 'rumor').sort((a, b) => b.v - a.v)
  if (rumors.length && s.score >= BOT.rumorAt) return bRespond(s, { t: 'special', cardId: rumors[0].id })

  const scatter = has('scatter')
  if (scatter && scatterTargets(s).length) {
    return bRespond(s, { t: 'special', cardId: scatter.id, targetEntryId: scatterTargets(s)[0].id })
  }

  const freeze = has('freeze')
  if (freeze && rng() < BOT.freezeP) return bRespond(s, { t: 'special', cardId: freeze.id })

  const e = entryOf(s, s.ctx)
  if (e) {
    const blocks = legalBlocks(s)
    if (blocks.length && (e.card.pts >= BOT.blockMin || rng() < 0.5)) {
      blocks.sort((a, b) => matchedIcons(s, b, e).length - matchedIcons(s, a, e).length)
      return bRespond(s, { t: 'block', cardId: blocks[0].id })
    }
  }

  if (!s.trap) {
    const bl = s.bHand.filter((c): c is BlockCard => c.kind === 'block')
    if (bl.length >= 2) return bRespond(s, { t: 'trap', cardId: bl[Math.floor(rng() * bl.length)].id })
  }
  return bRespond(s, { t: 'pass' })
}

/** ให้บอทที่ถึงตาตัวเองทำ 1 ก้าว (ถ้าคนจริงต้องตัดสินใจ ไม่ทำอะไร) */
export function botStep(s: State, rng: Rng = Math.random): State {
  const a = actor(s)
  if (!a || a === s.human) return s
  if (s.phase === 'p-turn') return botP(s, rng)
  if (s.phase === 'b-respond') return botB(s, rng)
  return s
}

/** เล่นต่อจนถึงจุดที่ต้องให้คนจริงตัดสินใจ หรือเกมจบ (ใช้กับ allBots ในสคริปต์จำลอง) */
export function advance(s0: State, rng: Rng = Math.random, maxSteps = 2000): State {
  let s = s0
  for (let i = 0; i < maxSteps; i++) {
    const a = actor(s)
    if (!a || a === s.human) return s
    s = botStep(s, rng)
  }
  return s
}

export type { KeyKind }
