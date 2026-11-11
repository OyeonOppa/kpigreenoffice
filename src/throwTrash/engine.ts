// ตัวเกม "โยนขยะ!" — ตรรกะล้วน ไม่ผูกกับ React (ดู docs/game-prototypes/rulebooks/throw-trash-prompt.md)
//
// สรุปกติกา: แต่ละคนมี "บ้าน" (ขยะที่ค้างอยู่) กับ "โซนบัฟ" (การ์ดบัฟที่ลงแล้ว)
// ใบไม้สุทธิ = ผลรวมใบไม้บนการ์ดบัฟ − จำนวนขยะค้างบ้าน ตอนจบตาตัวเอง ≥ 10 ชนะ
// ทุกตา: (ถ้ามีขยะแดงค้างบ้าน ทิ้งบัฟถูกสุด 1 ใบ) → จั่ว 1 ใบ → ทำ 2 การกระทำ (ลงบัฟ/แยกขยะ/โยนขยะ/การ์ดแกล้ง)
//
// ลดความซับซ้อนจากต้นแบบเดิม (ซึ่งเขียนไว้สำหรับโปรเจกต์ใหม่แบบ async UI):
//  - การ "เลือกเป้าหมาย/เลือกการ์ดที่จะทิ้ง" ทำที่ฝั่ง UI ก่อนเรียก engine (ส่งมาเป็นพารามิเตอร์) ไม่ผูก pending กลางเกม
//  - engine หยุดรอผู้เล่นจริง 2 จังหวะเท่านั้น: "ใช้การ์ดป้องกันไหม" (defend) และ "ช่วงจับผิด" (catch)
//  - "ของแถมฟรี" เลือกขยะ 2 ใบแรกในมือให้อัตโนมัติ (ไม่ให้เลือกเอง) เพื่อตัดขั้นตอน

import { BINS, BUFF_BY_KEY, buildDeck, type BinId, type Card, type DefKey, type PrankKey } from './cards'

export type Rng = () => number

export const WIN_TARGET = 10

export interface Player {
  name: string
  avatar: string
  human: boolean
  hand: Card[]
  /** ขยะที่ค้างอยู่ในบ้าน */
  home: Card[]
  /** การ์ดบัฟที่ลงแล้ว (อาจมีการ์ด "ถัง" ที่จับผิดได้มาด้วย นับเป็น +1 ใบไม้) */
  buffs: Card[]
  /** โยนขยะไปแล้วในตานี้หรือยัง (ได้แค่ 1 ครั้ง/ตา) */
  thrown: boolean
}

type DefendAction =
  | { type: 'throw'; thrower: number }
  | { type: 'bagsOne'; rest: number[] }
  | { type: 'gift'; thrower: number }
  | { type: 'wind'; toIdx: number }
  | { type: 'smokeOne'; rest: number[] }

export interface Pending {
  kind: 'defend' | 'catch'
  // defend
  victim?: number
  defKey?: DefKey
  action?: DefendAction
  card?: Card
  cards?: Card[]
  // catch
  sorter?: number
  binCard?: Card
  bin?: BinId
  deadline?: number
  resolveId?: number
}

export interface State {
  players: Player[]
  deck: Card[]
  discard: Card[]
  turn: number
  actionsLeft: number
  /** >0 = ต้องทิ้งการ์ดในมือให้เหลือ 7 ก่อนจบตา (คนจริงเท่านั้น บอทจัดการเองในตัว) */
  mustDiscard: number
  pending: Pending | null
  phase: 'turn' | 'over'
  winner: number | null
  log: string[]
  nextCatchId: number
}

const BOT_PROFILES = [
  { name: 'น้องกรีน', avatar: '🐸' },
  { name: 'พี่แยกขยะ', avatar: '🦊' },
  { name: 'หมีรีไซเคิล', avatar: '🐻' },
  { name: 'แพนด้าใจดี', avatar: '🐼' },
  { name: 'เสือโคร่ง', avatar: '🐯' },
]

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const clone = (s: State): State => structuredClone(s)

function pushLog(s: State, text: string) {
  s.log.push(text)
  if (s.log.length > 50) s.log.shift()
}

function take(arr: Card[], id: number): Card {
  const i = arr.findIndex((c) => c.id === id)
  const [c] = arr.splice(i, 1)
  return c
}

function leavesOf(c: Card): number {
  if (c.kind === 'buff') return BUFF_BY_KEY[c.key].leaves
  if (c.kind === 'bin') return 1 // ถ้วยรางวัลจากการจับผิด
  return 0
}

export function netLeaves(p: Player): number {
  return p.buffs.reduce((a, c) => a + leavesOf(c), 0) - p.home.length
}

function lowestBuff(p: Player): Card | null {
  if (!p.buffs.length) return null
  return [...p.buffs].sort((a, b) => leavesOf(a) - leavesOf(b))[0]
}

function discardBuff(s: State, idx: number, cardId: number) {
  const p = s.players[idx]
  const i = p.buffs.findIndex((c) => c.id === cardId)
  if (i < 0) return
  const [c] = p.buffs.splice(i, 1)
  s.discard.push(c)
}

function buffName(c: Card): string {
  return c.kind === 'buff' ? BUFF_BY_KEY[c.key].name : c.kind === 'bin' ? `${BINS[c.bin].name} (ที่จับผิดได้)` : ''
}

function draw(s: State, idx: number, n: number) {
  for (let i = 0; i < n; i++) {
    if (s.deck.length === 0) {
      if (s.discard.length === 0) return
      s.deck = shuffle(s.discard, Math.random)
      s.discard = []
      pushLog(s, '🔄 กองจั่วหมด สับกองทิ้งเป็นกองจั่วใหม่')
    }
    const c = s.deck.pop()!
    s.players[idx].hand.push(c)
  }
}

function findWasteInDeck(s: State, bin: BinId): Card | null {
  const i = s.deck.findIndex((c) => c.kind === 'waste' && c.bin === bin)
  if (i < 0) return null
  return s.deck.splice(i, 1)[0]
}

function cardValue(c: Card): number {
  if (c.kind === 'buff') return 10 + BUFF_BY_KEY[c.key].leaves
  if (c.kind === 'def') return 6
  if (c.kind === 'prank') return 4
  if (c.kind === 'bin') return 2
  return 0 // waste — ไม่มีประโยชน์ถือไว้ ทิ้งก่อนเพื่อน
}

/* ------------------------------------------------------------------ รถเทศบาล + เริ่ม/จบตา */

/** หลังทุกการกระทำ: บ้านใครมีขยะ ≥ 5 ใบ รถเทศบาลเก็บให้ 2 ใบ (ขยะแดงก่อน) */
function afterAction(s: State) {
  for (const p of s.players) {
    if (p.home.length >= 5) {
      p.home.sort((a, b) => Number(b.kind === 'waste' && b.bin === 'red') - Number(a.kind === 'waste' && a.bin === 'red'))
      const removed = p.home.splice(0, 2)
      s.discard.push(...removed)
      pushLog(s, `🚛 รถเทศบาลมาเก็บขยะให้ ${p.name} 2 ใบ (บ้านรกครบ 5 ใบ)`)
    }
  }
}

function startTurn(s: State) {
  const idx = s.turn
  const p = s.players[idx]
  if (p.home.some((c) => c.kind === 'waste' && c.bin === 'red')) {
    const worst = lowestBuff(p)
    if (worst) {
      discardBuff(s, idx, worst.id)
      pushLog(s, `☣️ ${p.name} มีขยะอันตรายค้างบ้าน ต้องทิ้งการ์ดบัฟ "${buffName(worst)}"`)
    }
  }
  draw(s, idx, 1)
  p.thrown = false
  s.actionsLeft = 2
  s.pending = null
  pushLog(s, `— ตาของ ${p.name} —`)
}

export function newGame(bots: number, opts: { humanName?: string } = {}, rng: Rng = Math.random): State {
  const total = Math.min(6, Math.max(2, bots + 1))
  const deck = shuffle(buildDeck(), rng)
  const profiles = shuffle(BOT_PROFILES, rng)
  const players: Player[] = []
  let bi = 0
  for (let i = 0; i < total; i++) {
    const human = i === 0
    const prof = human ? { name: opts.humanName ?? 'คุณ', avatar: '😎' } : profiles[bi++ % profiles.length]
    players.push({ name: prof.name, avatar: prof.avatar, human, hand: deck.splice(0, 5), home: [], buffs: [], thrown: false })
  }
  const s: State = {
    players,
    deck,
    discard: [],
    turn: 0,
    actionsLeft: 2,
    mustDiscard: 0,
    pending: null,
    phase: 'turn',
    winner: null,
    log: [`เริ่มเกม ${total} คน — ใครมีใบไม้สุทธิ ≥ ${WIN_TARGET} ตอนจบตาตัวเองก่อน ชนะ!`],
    nextCatchId: 1,
  }
  startTurn(s)
  return s
}

/** ตาของใครตอนนี้ที่ต้องมีคน "ตัดสินใจ" จริง ๆ (ไม่รวมช่วงจับผิดซึ่งหลายคนแย่งกันได้) */
export function activePlayer(s: State): number {
  if (s.pending?.kind === 'defend') return s.pending.victim!
  return s.turn
}

/* ----------------------------------------------------------------------- แยกขยะ */

export function sortWaste(s0: State, binCardId: number, wasteCardId: number): State {
  if (s0.phase !== 'turn' || s0.actionsLeft < 1 || s0.pending || s0.mustDiscard) return s0
  const idx = s0.turn
  const p0 = s0.players[idx]
  const bin = p0.hand.find((c) => c.id === binCardId && c.kind === 'bin')
  const waste = p0.home.find((c) => c.id === wasteCardId && c.kind === 'waste')
  if (!bin || !waste) return s0
  const s = clone(s0)
  const p = s.players[idx]
  take(p.hand, binCardId)
  s.actionsLeft--
  const w = waste as Extract<Card, { kind: 'waste' }>
  const b = bin as Extract<Card, { kind: 'bin' }>
  if (b.bin === w.bin) {
    take(p.home, wasteCardId)
    s.discard.push(b, w)
    pushLog(s, `${p.name} แยก ${w.emoji}${w.name} ลง${BINS[b.bin].name} ถูกต้อง ✅`)
    afterAction(s)
    return s
  }
  pushLog(s, `${p.name} แยก ${w.emoji}${w.name} ลง${BINS[b.bin].name} ... ผิดถัง! ใครจะจับผิดทัน?`)
  s.pending = { kind: 'catch', sorter: idx, binCard: b, bin: b.bin, deadline: Date.now() + 3500, resolveId: s.nextCatchId++ }
  return s
}

/** คนที่จับผิดได้ (ทุกคนยกเว้นคนที่แยกผิดเอง) */
export function catchEligible(s: State): number[] {
  if (s.pending?.kind !== 'catch') return []
  return s.players.map((_, i) => i).filter((i) => i !== s.pending!.sorter)
}

export function resolveCatch(s0: State, catcherIdx: number | null): State {
  if (s0.phase !== 'turn' || s0.pending?.kind !== 'catch') return s0
  if (catcherIdx !== null && catcherIdx === s0.pending.sorter) return s0
  const s = clone(s0)
  const pend = s.pending!
  s.pending = null
  if (catcherIdx === null) {
    s.discard.push(pend.binCard!)
    pushLog(s, `ไม่มีใครจับทัน การ์ด${BINS[pend.bin!].name}เสียเปล่า`)
  } else {
    const catcher = s.players[catcherIdx]
    catcher.buffs.push(pend.binCard!)
    pushLog(s, `✋ ${catcher.name} ตะโกน "จับผิด!" ทัน ได้การ์ด${BINS[pend.bin!].name}ไปวางโซนบัฟ (+1 🍃)`)
  }
  afterAction(s)
  return s
}

/* ----------------------------------------------------------------------- ลงการ์ดบัฟ */

export interface BuffExtra {
  /** solar: ทิ้ง 2 ใบ · bank: ทิ้งขยะเหลือง 3 ใบ */
  discardIds?: number[]
  /** repair: ขยะในบ้านที่จะหยิบกลับมือ */
  wasteId?: number
  /** friend: ผู้เล่นที่ชวน */
  targetIdx?: number
}

function affordableBuff(p: Player, card: Extract<Card, { kind: 'buff' }>): boolean {
  if (card.key === 'solar') return p.hand.filter((c) => c.id !== card.id).length >= 2
  if (card.key === 'bank') return p.hand.filter((c) => c.kind === 'waste' && c.bin === 'yellow').length >= 3
  if (card.key === 'repair') return p.home.some((c) => c.kind === 'waste')
  return true
}

export function playBuff(s0: State, cardId: number, extra: BuffExtra = {}): State {
  if (s0.phase !== 'turn' || s0.actionsLeft < 1 || s0.pending || s0.mustDiscard) return s0
  const idx = s0.turn
  const p0 = s0.players[idx]
  const card = p0.hand.find((c) => c.id === cardId && c.kind === 'buff') as Extract<Card, { kind: 'buff' }> | undefined
  if (!card || !affordableBuff(p0, card)) return s0
  if (card.key === 'solar') {
    const ids = extra.discardIds ?? []
    if (ids.length !== 2 || !ids.every((id) => id !== cardId && p0.hand.some((c) => c.id === id))) return s0
  }
  if (card.key === 'bank') {
    const ids = extra.discardIds ?? []
    if (ids.length !== 3 || !ids.every((id) => p0.hand.some((c) => c.id === id && c.kind === 'waste' && c.bin === 'yellow'))) return s0
  }
  if (card.key === 'repair' && !p0.home.some((c) => c.id === extra.wasteId)) return s0
  if (card.key === 'friend' && (extra.targetIdx === undefined || extra.targetIdx === idx || !s0.players[extra.targetIdx])) return s0

  const s = clone(s0)
  const p = s.players[idx]
  take(p.hand, cardId)
  s.actionsLeft--
  p.buffs.push(card)
  pushLog(s, `${p.name} เล่นบัฟ ${BUFF_BY_KEY[card.key].emoji} "${BUFF_BY_KEY[card.key].name}"`)
  switch (card.key) {
    case 'solar':
      for (const id of extra.discardIds!) s.discard.push(take(p.hand, id))
      break
    case 'bank':
      for (const id of extra.discardIds!) s.discard.push(take(p.hand, id))
      break
    case 'compost': {
      const green = p.home.filter((c) => c.kind === 'waste' && c.bin === 'green')
      p.home = p.home.filter((c) => !(c.kind === 'waste' && c.bin === 'green'))
      s.discard.push(...green)
      if (green.length) pushLog(s, `🪱 ขยะเขียวในบ้าน ${p.name} ถูกหมักทิ้งไปทันที ${green.length} ใบ`)
      break
    }
    case 'light':
      draw(s, idx, 1)
      break
    case 'repair': {
      const w = take(p.home, extra.wasteId!)
      p.hand.push(w)
      break
    }
    case 'friend': {
      draw(s, idx, 1)
      draw(s, extra.targetIdx!, 1)
      pushLog(s, `🤝 ${p.name} ชวน ${s.players[extra.targetIdx!].name} แยกขยะด้วยกัน — จั่วคนละ 1 ใบ`)
      break
    }
  }
  afterAction(s)
  return s
}

/* ----------------------------------------------------------------------- โยนขยะ */

export function throwWaste(s0: State, cardId: number, targetIdx: number): State {
  if (s0.phase !== 'turn' || s0.actionsLeft < 1 || s0.pending || s0.mustDiscard) return s0
  const idx = s0.turn
  const p0 = s0.players[idx]
  if (p0.thrown || targetIdx === idx || !s0.players[targetIdx]) return s0
  const card = p0.hand.find((c) => c.id === cardId && c.kind === 'waste') as Extract<Card, { kind: 'waste' }> | undefined
  if (!card) return s0
  const s = clone(s0)
  const p = s.players[idx]
  take(p.hand, cardId)
  p.thrown = true
  s.actionsLeft--
  const target = s.players[targetIdx]
  pushLog(s, `🗑️ ${p.name} โยน ${card.emoji}${card.name} ใส่บ้าน ${target.name}`)
  const muni = target.hand.find((c) => c.kind === 'def' && c.key === 'muni')
  if (muni) {
    s.pending = { kind: 'defend', victim: targetIdx, defKey: 'muni', action: { type: 'throw', thrower: idx }, card }
    return s
  }
  target.home.push(card)
  afterAction(s)
  return s
}

/* ----------------------------------------------------------------------- การ์ดแกล้ง */

export interface PrankExtra {
  targetIdx?: number
  fromIdx?: number
  wasteId?: number
  toIdx?: number
}

function applyBagsFrom(s: State, queue: number[]) {
  if (!queue.length) return
  const [i, ...rest] = queue
  const pl = s.players[i]
  if (pl.buffs.some((c) => c.kind === 'buff' && c.key === 'bag')) {
    pushLog(s, `👜 ${pl.name} มี "ใช้ถุงผ้า" ไม่ต้องรับขยะ`)
    applyBagsFrom(s, rest)
    return
  }
  const card = findWasteInDeck(s, 'blue') ?? undefined
  const nobag = pl.hand.find((c) => c.kind === 'def' && c.key === 'nobag')
  if (nobag) {
    s.pending = { kind: 'defend', victim: i, defKey: 'nobag', action: { type: 'bagsOne', rest }, card }
    return
  }
  if (card) pl.home.push(card)
  applyBagsFrom(s, rest)
}

function discardRandomHandCard(s: State, idx: number) {
  const p = s.players[idx]
  if (!p.hand.length) return
  const i = Math.floor(Math.random() * p.hand.length)
  const [c] = p.hand.splice(i, 1)
  s.discard.push(c)
  pushLog(s, `💨 ${p.name} สำลักควัน ทิ้งการ์ด 1 ใบแบบสุ่ม`)
}

function applySmokeFrom(s: State, queue: number[]) {
  if (!queue.length) return
  const [i, ...rest] = queue
  const pl = s.players[i]
  const lid = pl.hand.find((c) => c.kind === 'def' && c.key === 'lid')
  if (lid) {
    s.pending = { kind: 'defend', victim: i, defKey: 'lid', action: { type: 'smokeOne', rest } }
    return
  }
  discardRandomHandCard(s, i)
  applySmokeFrom(s, rest)
}

export function playPrank(s0: State, key: PrankKey, extra: PrankExtra = {}): State {
  if (s0.phase !== 'turn' || s0.actionsLeft < 1 || s0.pending || s0.mustDiscard) return s0
  const idx = s0.turn
  const p0 = s0.players[idx]
  const card = p0.hand.find((c) => c.kind === 'prank' && c.key === key)
  if (!card) return s0
  if (key === 'burn' && p0.home.length === 0) return s0
  if (key === 'lights' && (extra.targetIdx === undefined || extra.targetIdx === idx || !s0.players[extra.targetIdx])) return s0
  if (key === 'gift') {
    if (extra.targetIdx === undefined || extra.targetIdx === idx || !s0.players[extra.targetIdx]) return s0
    if (!p0.hand.some((c) => c.kind === 'waste')) return s0
  }
  if (key === 'wind') {
    if (extra.fromIdx === undefined || extra.toIdx === undefined || extra.wasteId === undefined) return s0
    if (extra.fromIdx === extra.toIdx || !s0.players[extra.fromIdx] || !s0.players[extra.toIdx]) return s0
    if (!s0.players[extra.fromIdx].home.some((c) => c.id === extra.wasteId)) return s0
  }

  const s = clone(s0)
  const p = s.players[idx]
  take(p.hand, card.id)
  s.actionsLeft--
  s.discard.push(card)

  switch (key) {
    case 'burn': {
      s.discard.push(...p.home)
      p.home = []
      pushLog(s, `🔥 ${p.name} เผาขยะ! บ้านตัวเองโล่งทันที`)
      const n = s.players.length
      const affected = n <= 2 ? [idx] : Array.from(new Set([idx, (idx - 1 + n) % n, (idx + 1) % n]))
      for (const i of affected) {
        const w = lowestBuff(s.players[i])
        if (w) {
          discardBuff(s, i, w.id)
          pushLog(s, `🔥 ${s.players[i].name} โดนไฟลาม ทิ้งบัฟ "${buffName(w)}"`)
        }
      }
      break
    }
    case 'bags': {
      pushLog(s, `🛍️ ${p.name} เล่น "แจกถุงพลาสติก" ทุกคนเตรียมรับขยะ!`)
      applyBagsFrom(s, s.players.map((_, i) => i))
      break
    }
    case 'smoke': {
      pushLog(s, `💨 ${p.name} เล่น "ควันจากการเผา" ใครบ้านรก 3 ใบขึ้นไปวุ่นแน่`)
      const affected = s.players.map((_, i) => i).filter((i) => s.players[i].home.length >= 3)
      applySmokeFrom(s, affected)
      break
    }
    case 'lights': {
      const t = s.players[extra.targetIdx!]
      pushLog(s, `💡 ${p.name} เล่น "เปิดไฟทิ้งไว้" ใส่ ${t.name}`)
      const w = lowestBuff(t)
      if (w) {
        discardBuff(s, extra.targetIdx!, w.id)
        pushLog(s, `💡 ${t.name} ต้องทิ้งบัฟ "${buffName(w)}"`)
      }
      break
    }
    case 'wind': {
      const src = s.players[extra.fromIdx!]
      const wcard = src.home.find((c) => c.id === extra.wasteId) as Extract<Card, { kind: 'waste' }>
      pushLog(s, `🌪️ ${p.name} เล่น "ลมพัดขยะ" พัด ${wcard.emoji}${wcard.name} จากบ้าน ${src.name} ไปหา ${s.players[extra.toIdx!].name}`)
      const lid = src.hand.find((c) => c.kind === 'def' && c.key === 'lid')
      if (lid) {
        s.pending = { kind: 'defend', victim: extra.fromIdx!, defKey: 'lid', action: { type: 'wind', toIdx: extra.toIdx! }, card: wcard }
        return s
      }
      take(src.home, wcard.id)
      s.players[extra.toIdx!].home.push(wcard)
      break
    }
    case 'gift': {
      const picks = p.hand.filter((c) => c.kind === 'waste').slice(0, 2)
      for (const c of picks) take(p.hand, c.id)
      p.thrown = true
      const t = s.players[extra.targetIdx!]
      pushLog(s, `🎁 ${p.name} ยัด "ของแถมฟรี" ${picks.length} ใบให้ ${t.name}`)
      const nobag = t.hand.find((c) => c.kind === 'def' && c.key === 'nobag')
      if (nobag) {
        s.pending = { kind: 'defend', victim: extra.targetIdx!, defKey: 'nobag', action: { type: 'gift', thrower: idx }, cards: picks }
        return s
      }
      t.home.push(...picks)
      break
    }
  }
  if (s.pending === null) afterAction(s)
  return s
}

/* ----------------------------------------------------------------------- ใช้การ์ดป้องกัน */

export function resolveDefend(s0: State, use: boolean): State {
  if (s0.phase !== 'turn' || s0.pending?.kind !== 'defend') return s0
  const s = clone(s0)
  const pend = s.pending!
  s.pending = null
  const victim = s.players[pend.victim!]
  if (use) {
    const def = victim.hand.find((c) => c.kind === 'def' && c.key === pend.defKey)
    if (def) {
      take(victim.hand, def.id)
      s.discard.push(def)
    } else {
      // ไม่มีการ์ดจริงแล้ว (เผื่อ state ไม่ตรง) — ถือว่าไม่ใช้
      return resolveDefendApply(s, pend, false, victim)
    }
  }
  return resolveDefendApply(s, pend, use, victim)
}

function resolveDefendApply(s: State, pend: Pending, use: boolean, victim: Player): State {
  switch (pend.action!.type) {
    case 'throw': {
      const a = pend.action as Extract<DefendAction, { type: 'throw' }>
      if (use) {
        s.players[a.thrower].home.push(pend.card!)
        pushLog(s, `📞 ${victim.name} ใช้ "แจ้งเทศบาล" ส่งขยะกลับให้ ${s.players[a.thrower].name}!`)
      } else {
        victim.home.push(pend.card!)
      }
      break
    }
    case 'gift': {
      if (use) {
        s.discard.push(...pend.cards!)
        pushLog(s, `🙅 ${victim.name} ใช้ "ไม่รับถุงค่ะ" ปฏิเสธของแถม`)
      } else {
        victim.home.push(...pend.cards!)
      }
      break
    }
    case 'wind': {
      const a = pend.action as Extract<DefendAction, { type: 'wind' }>
      if (use) {
        pushLog(s, `🪣 ${victim.name} ใช้ "ถังมีฝาปิด" กันลมพัดขยะไว้ได้`)
      } else {
        s.players[a.toIdx].home.push(pend.card!)
      }
      break
    }
    case 'bagsOne': {
      const a = pend.action as Extract<DefendAction, { type: 'bagsOne' }>
      if (use) pushLog(s, `🙅 ${victim.name} ใช้ "ไม่รับถุงค่ะ" ปฏิเสธถุงพลาสติก`)
      else if (pend.card) victim.home.push(pend.card)
      applyBagsFrom(s, a.rest)
      break
    }
    case 'smokeOne': {
      const a = pend.action as Extract<DefendAction, { type: 'smokeOne' }>
      if (use) pushLog(s, `🪣 ${victim.name} ใช้ "ถังมีฝาปิด" กันควันไว้ได้`)
      else discardRandomHandCard(s, s.players.indexOf(victim))
      applySmokeFrom(s, a.rest)
      break
    }
  }
  if (s.pending === null) afterAction(s)
  return s
}

/* ----------------------------------------------------------------------- จบตา */

function autoDiscard(s: State, idx: number, n: number) {
  const p = s.players[idx]
  const ranked = [...p.hand].sort((a, b) => cardValue(a) - cardValue(b))
  for (let i = 0; i < n; i++) s.discard.push(take(p.hand, ranked[i].id))
}

function finishTurn(s: State): State {
  const idx = s.turn
  const net = netLeaves(s.players[idx])
  if (net >= WIN_TARGET) {
    s.winner = idx
    s.phase = 'over'
    pushLog(s, `🏆 ${s.players[idx].name} ใบไม้สุทธิ ${net} ครบเป้า ${WIN_TARGET} ชนะ!`)
    return s
  }
  s.turn = (idx + 1) % s.players.length
  startTurn(s)
  return s
}

export function endTurn(s0: State): State {
  if (s0.phase !== 'turn' || s0.pending || s0.mustDiscard) return s0
  const s = clone(s0)
  const idx = s.turn
  const p = s.players[idx]
  if (p.hand.length > 7) {
    if (p.human) {
      s.mustDiscard = p.hand.length - 7
      return s
    }
    autoDiscard(s, idx, p.hand.length - 7)
  }
  return finishTurn(s)
}

export function discardExtra(s0: State, ids: number[]): State {
  if (!s0.mustDiscard) return s0
  const idx = s0.turn
  const p0 = s0.players[idx]
  if (ids.length !== s0.mustDiscard || !ids.every((id) => p0.hand.some((c) => c.id === id))) return s0
  const s = clone(s0)
  const p = s.players[idx]
  for (const id of ids) s.discard.push(take(p.hand, id))
  s.mustDiscard = 0
  return finishTurn(s)
}

/* ----------------------------------------------------------------------------- บอท */

function affordable(p: Player, card: Extract<Card, { kind: 'buff' }>) {
  return affordableBuff(p, card)
}

function pickBotBuff(s: State, idx: number): Extract<Card, { kind: 'buff' }> | null {
  const p = s.players[idx]
  const cands = (p.hand.filter((c) => c.kind === 'buff') as Extract<Card, { kind: 'buff' }>[]).filter((c) => affordable(p, c))
  if (!cands.length) return null
  cands.sort((a, b) => BUFF_BY_KEY[b.key].leaves - BUFF_BY_KEY[a.key].leaves)
  return cands[0]
}

function applyBotBuff(s: State, idx: number, card: Extract<Card, { kind: 'buff' }>, rng: Rng): State {
  const p = s.players[idx]
  const extra: BuffExtra = {}
  if (card.key === 'solar')
    extra.discardIds = p.hand
      .filter((c) => c.id !== card.id)
      .sort((a, b) => cardValue(a) - cardValue(b))
      .slice(0, 2)
      .map((c) => c.id)
  if (card.key === 'bank')
    extra.discardIds = p.hand
      .filter((c) => c.kind === 'waste' && c.bin === 'yellow')
      .slice(0, 3)
      .map((c) => c.id)
  if (card.key === 'repair') extra.wasteId = p.home.find((c) => c.kind === 'waste')?.id
  if (card.key === 'friend') {
    const others = s.players.map((_, i) => i).filter((i) => i !== idx)
    extra.targetIdx = others[Math.floor(rng() * others.length)]
  }
  return playBuff(s, card.id, extra)
}

function leaderIdx(s: State, exclude: number): number {
  let best = -1
  let bestVal = -Infinity
  s.players.forEach((p, i) => {
    if (i === exclude) return
    const v = netLeaves(p)
    if (v > bestVal) {
      bestVal = v
      best = i
    }
  })
  return best
}

function pickBotPrank(s: State, idx: number): State | null {
  const p = s.players[idx]
  const pranks = p.hand.filter((c) => c.kind === 'prank') as Extract<Card, { kind: 'prank' }>[]
  for (const c of pranks) {
    if (c.key === 'burn' && p.home.length > 0) return playPrank(s, 'burn')
    if (c.key === 'bags') return playPrank(s, 'bags')
    if (c.key === 'smoke') return playPrank(s, 'smoke')
    if (c.key === 'lights') {
      const t = leaderIdx(s, idx)
      if (t >= 0) return playPrank(s, 'lights', { targetIdx: t })
    }
    if (c.key === 'gift') {
      const t = leaderIdx(s, idx)
      if (t >= 0 && p.hand.some((x) => x.kind === 'waste')) return playPrank(s, 'gift', { targetIdx: t })
    }
    if (c.key === 'wind') {
      for (let si = 0; si < s.players.length; si++) {
        const w = s.players[si].home.find((x) => x.kind === 'waste')
        if (w) {
          const dst = s.players.map((_, i) => i).find((i) => i !== si)
          if (dst !== undefined) return playPrank(s, 'wind', { fromIdx: si, wasteId: w.id, toIdx: dst })
        }
      }
    }
  }
  return null
}

function botTakeAction(s: State, rng: Rng): State {
  if (s.actionsLeft <= 0) return endTurn(s)
  const idx = s.turn
  const p = s.players[idx]
  // 1) แยกขยะถ้ามีคู่ที่ใช้ได้ (ตั้งใจแยกผิด 12% เพื่อเปิดจังหวะให้จับผิด)
  const bins = p.hand.filter((c) => c.kind === 'bin') as Extract<Card, { kind: 'bin' }>[]
  const wastes = p.home.filter((c) => c.kind === 'waste') as Extract<Card, { kind: 'waste' }>[]
  if (bins.length && wastes.length) {
    const mistake = rng() < 0.12
    for (const w of wastes) {
      if (mistake) {
        const wrong = bins.find((b) => b.bin !== w.bin)
        if (wrong) return sortWaste(s, wrong.id, w.id)
      } else {
        const match = bins.find((b) => b.bin === w.bin)
        if (match) return sortWaste(s, match.id, w.id)
      }
    }
  }
  // 2) ลงบัฟที่คุ้มสุด
  const buff = pickBotBuff(s, idx)
  if (buff) return applyBotBuff(s, idx, buff, rng)
  // 3) โยนขยะใส่คนนำอยู่ (ยังไม่เคยโยนในตานี้)
  if (!p.thrown) {
    const waste = p.hand.find((c) => c.kind === 'waste') as Extract<Card, { kind: 'waste' }> | undefined
    if (waste) {
      const target = leaderIdx(s, idx)
      if (target >= 0) return throwWaste(s, waste.id, target)
    }
  }
  // 4) การ์ดแกล้งที่เล่นได้
  const prankResult = pickBotPrank(s, idx)
  if (prankResult) return prankResult
  // ไม่มีอะไรทำได้แล้ว — จบตาก่อนเวลา
  return endTurn(s)
}

/** true = ต้องให้บอทเดินต่อ (ไม่ว่าจะเป็นตาบอท หรือบอทเป็นฝ่ายต้องตัดสินใจเรื่องการ์ดป้องกัน) */
export function needsBot(s: State): boolean {
  if (s.phase !== 'turn') return false
  if (s.pending?.kind === 'defend') return !s.players[s.pending.victim!].human
  if (s.pending?.kind === 'catch') return false // ฝั่ง UI จัดการช่วงจับผิดเองด้วยตัวจับเวลาแยก
  if (s.mustDiscard) return false // มีแต่คนจริงเท่านั้นที่ตั้ง mustDiscard ค้างได้
  return !s.players[s.turn].human
}

export function botStep(s: State, rng: Rng = Math.random): State {
  if (!needsBot(s)) return s
  if (s.pending?.kind === 'defend') return resolveDefend(s, rng() < 0.9)
  return botTakeAction(s, rng)
}
