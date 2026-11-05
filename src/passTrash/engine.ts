// ตัวเกม "ส่งต่อขยะ" — ตรรกะล้วน ไม่ผูกกับ React
//
// ทุกฟังก์ชันรับ State แล้วคืน State ใหม่ (ไม่แก้ของเดิม) จึงใช้กับ useState ได้ตรงๆ
// และทดสอบด้วย node ได้ (ดู scripts/sim-pass-trash.mjs)
//
// กติกาย่อ:
//  - แจกไพ่เท่าๆ กัน ถึงตาใคร เลือกไพ่ 1 ใบ คว่ำส่งให้อีกคน พร้อมบอกว่า "ทิ้งถังไหน" (จริงหรือโกหกก็ได้)
//  - ผู้รับเลือก: เชื่อ / ไม่เชื่อ / แอบดูแล้วส่งต่อให้คนที่ยังไม่เคยดู
//  - ทายถูก → ผู้ที่พูดล่าสุดเก็บไพ่ · ทายผิด → ผู้รับเก็บไพ่ · คนที่เก็บเป็นผู้เริ่มตาต่อไป
//  - ใครมีขยะถังเดียวกันครบ limit ใบ แพ้ทันที

import { BIN_IDS, BIN_TOTALS, BINS, ITEMS, type BinId, type ItemDef } from './cards.ts'

export interface Card {
  id: number
  item: ItemDef
}

export interface Player {
  name: string
  avatar: string
  human: boolean
  hand: Card[]
  pile: Card[]
  /** นิสัยของบอท: โอกาสโกหก (0–1) */
  lie: number
  /** นิสัยของบอท: ยิ่งสูงยิ่งระแวง ไม่เชื่อง่าย */
  sus: number
}

export interface Offer {
  card: Card
  claim: BinId
  /** คนที่พูดล่าสุด (ถ้าทายถูก คนนี้ต้องเก็บไพ่) */
  from: number
  /** คนที่ต้องตัดสินใจ */
  to: number
  /** คนที่เคยเห็นไพ่ใบนี้แล้ว (ส่งต่อให้คนเหล่านี้ไม่ได้) */
  seen: number[]
}

export interface Result {
  card: Card
  claim: BinId
  claimTrue: boolean
  guess: 'true' | 'false'
  correct: boolean
  /** คนที่พูดล่าสุด */
  from: number
  /** คนที่ตัดสิน */
  to: number
  /** คนที่ต้องเก็บไพ่ใบนี้ */
  taker: number
}

export type Phase = 'pick' | 'respond' | 'repick' | 'reveal' | 'over'

export interface State {
  players: Player[]
  phase: Phase
  /** คนที่ต้องเริ่มตา (เฟส pick) */
  starter: number
  offer: Offer | null
  result: Result | null
  limit: number
  loser: number | null
  overReason: 'limit' | 'empty' | null
  log: string[]
  round: number
  nextId: number
}

export type Rng = () => number

const DEAL: Record<number, number> = { 3: 13, 4: 10, 5: 8, 6: 6 }

const BOT_PROFILES = [
  { name: 'น้องกรีน', avatar: '🐸' },
  { name: 'พี่แยกขยะ', avatar: '🦊' },
  { name: 'หมีรีไซเคิล', avatar: '🐻' },
  { name: 'แพนด้าใจดี', avatar: '🐼' },
  { name: 'เสือโคร่ง', avatar: '🐯' },
]

/** เกณฑ์แพ้ตามจำนวนผู้เล่น (จากการจำลอง ดู README) */
export function defaultLimit(players: number): number {
  return players <= 4 ? 5 : 4
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const clone = (s: State): State => structuredClone(s)

export const binName = (b: BinId) => `${BINS[b].shape} ${BINS[b].name}`

function pushLog(s: State, text: string) {
  s.log.push(text)
  if (s.log.length > 40) s.log.shift()
}

export function newGame(
  bots: number,
  opts: { limit?: number; humanName?: string; allBots?: boolean } = {},
  rng: Rng = Math.random,
): State {
  const total = Math.min(6, Math.max(3, bots + 1))
  const limit = opts.limit ?? defaultLimit(total)
  const deck = shuffle(
    ITEMS.map((item, i) => ({ id: i + 1, item })),
    rng,
  )
  const per = DEAL[total]
  const profiles = shuffle(BOT_PROFILES, rng)
  const players: Player[] = []
  let botIdx = 0
  for (let i = 0; i < total; i++) {
    const human = i === 0 && !opts.allBots
    const prof = human ? { name: opts.humanName ?? 'คุณ', avatar: '😎' } : profiles[botIdx++ % profiles.length]
    players.push({
      name: prof.name,
      avatar: prof.avatar,
      human,
      hand: deck.slice(i * per, (i + 1) * per),
      pile: [],
      lie: 0.3 + rng() * 0.3,
      sus: 0.4 + rng() * 0.2,
    })
  }
  const starter = Math.floor(rng() * total)
  const s: State = {
    players,
    phase: 'pick',
    starter,
    offer: null,
    result: null,
    limit,
    loser: null,
    overReason: null,
    log: [`เริ่มเกม ${total} คน · ใครมีขยะถังเดียวกันครบ ${limit} ใบ แพ้`],
    round: 1,
    nextId: 100,
  }
  return s
}

/* ----------------------------- ใครต้องทำอะไร ----------------------------- */

/** คนที่ต้องตัดสินใจตอนนี้ (-1 = ไม่มี เช่นกำลังเฉลย) */
export function actor(s: State): number {
  if (s.phase === 'pick') return s.starter
  if (s.phase === 'respond' || s.phase === 'repick') return s.offer!.to
  return -1
}

/** คนที่ส่งการ์ดให้ได้ในตอนนี้ (เฟส pick = ทุกคนยกเว้นตัวเอง · เฟส repick = คนที่ยังไม่เคยดูไพ่) */
export function targetsFor(s: State): number[] {
  const me = actor(s)
  const seen = s.phase === 'repick' ? s.offer!.seen : [me]
  return s.players.map((_, i) => i).filter((i) => !seen.includes(i))
}

/** ผู้รับแอบดูแล้วส่งต่อได้ไหม — ต้องมีคนที่ยังไม่เคยดูไพ่ใบนี้เหลืออยู่ */
export function canPeek(s: State): boolean {
  if (s.phase !== 'respond') return false
  const o = s.offer!
  return s.players.some((_, i) => i !== o.to && !o.seen.includes(i))
}

/** นับไพ่ที่ "ยังไม่โผล่" ในแต่ละถัง จากมุมของ viewer (หักไพ่ที่เก็บแล้วบนโต๊ะ และไพ่ในมือตัวเอง) — ใช้เป็นตัวช่วยนับไพ่ */
export function unseenCounts(s: State, viewer: number): Record<BinId, number> {
  const rem = { ...BIN_TOTALS }
  for (const p of s.players) for (const c of p.pile) rem[c.item.bin]--
  for (const c of s.players[viewer].hand) rem[c.item.bin]--
  // ไพ่ที่แอบดูไปแล้วในรอบนี้ก็รู้แล้วเช่นกัน
  if (s.offer && s.offer.seen.includes(viewer) && s.phase !== 'reveal') rem[s.offer.card.item.bin]--
  for (const b of BIN_IDS) rem[b] = Math.max(0, rem[b])
  return rem
}

export const maxPile = (p: Player): number =>
  Math.max(0, ...BIN_IDS.map((b) => p.pile.filter((c) => c.item.bin === b).length))

export const pileCount = (p: Player, bin: BinId): number => p.pile.filter((c) => c.item.bin === bin).length

/* --------------------------------- การเดินเกม --------------------------------- */

/** ส่งไพ่ในมือ (เฟส pick) */
export function offerCard(s0: State, cardId: number, to: number, claim: BinId): State {
  if (s0.phase !== 'pick') return s0
  const s = clone(s0)
  const me = s.starter
  const p = s.players[me]
  const idx = p.hand.findIndex((c) => c.id === cardId)
  if (idx < 0 || to === me || !s.players[to]) return s0
  const [card] = p.hand.splice(idx, 1)
  s.offer = { card, claim, from: me, to, seen: [me] }
  s.phase = 'respond'
  pushLog(s, `${p.name} ส่งไพ่คว่ำให้ ${s.players[to].name} บอกว่า “${binName(claim)}”`)
  return s
}

/** ผู้รับตัดสินใจ */
export function respond(s0: State, action: 'true' | 'false' | 'peek'): State {
  if (s0.phase !== 'respond' || !s0.offer) return s0
  const s = clone(s0)
  const o = s.offer!
  if (action === 'peek') {
    if (!canPeek(s)) return s0
    o.seen.push(o.to)
    s.phase = 'repick'
    pushLog(s, `${s.players[o.to].name} แอบดูไพ่แล้ว กำลังจะส่งต่อ`)
    return s
  }
  const actual = o.card.item.bin
  const claimTrue = actual === o.claim
  const correct = (action === 'true') === claimTrue
  const taker = correct ? o.from : o.to
  const tp = s.players[taker]
  tp.pile.push(o.card)
  s.result = {
    card: o.card,
    claim: o.claim,
    claimTrue,
    guess: action,
    correct,
    from: o.from,
    to: o.to,
    taker,
  }
  s.phase = 'reveal'
  const who = s.players[o.to].name
  pushLog(
    s,
    `${who} ทายว่า${action === 'true' ? 'จริง' : 'โกหก'} → ${correct ? 'ถูก' : 'ผิด'} ${tp.name} เก็บ ${o.card.item.emoji}${o.card.item.name} (${binName(actual)})`,
  )
  const count = tp.pile.filter((c) => c.item.bin === actual).length
  if (count >= s.limit) {
    s.loser = taker
    s.overReason = 'limit'
    pushLog(s, `${tp.name} มี ${binName(actual)} ครบ ${s.limit} ใบ — แพ้!`)
  }
  return s
}

/** ส่งต่อไพ่ที่แอบดูแล้ว (เฟส repick) */
export function repass(s0: State, to: number, claim: BinId): State {
  if (s0.phase !== 'repick' || !s0.offer) return s0
  const s = clone(s0)
  const o = s.offer!
  if (o.seen.includes(to) || !s.players[to]) return s0
  const me = o.to
  o.from = me
  o.to = to
  o.claim = claim
  s.phase = 'respond'
  pushLog(s, `${s.players[me].name} ส่งต่อให้ ${s.players[to].name} บอกว่า “${binName(claim)}”`)
  return s
}

/** หลังเฉลย: ไปตาถัดไป (หรือจบเกม) */
export function next(s0: State): State {
  if (s0.phase !== 'reveal' || !s0.result) return s0
  const s = clone(s0)
  const taker = s.result!.taker
  s.offer = null
  s.result = null
  s.round++
  if (s.loser !== null) {
    s.phase = 'over'
    return s
  }
  s.starter = taker
  if (s.players[taker].hand.length === 0) {
    // ถึงตาใครแล้วไม่มีไพ่ในมือ — เกมจบ คนที่มีขยะถังเดียวกันมากที่สุดแพ้ (เท่ากันดูจำนวนรวม)
    let worst = 0
    for (let i = 1; i < s.players.length; i++) {
      const a = s.players[i]
      const b = s.players[worst]
      if (maxPile(a) > maxPile(b) || (maxPile(a) === maxPile(b) && a.pile.length > b.pile.length)) worst = i
    }
    s.loser = worst
    s.overReason = 'empty'
    s.phase = 'over'
    pushLog(s, `${s.players[taker].name} ไม่มีไพ่ในมือ — จบเกม ${s.players[worst].name} มีขยะถังเดียวกันมากสุด แพ้`)
    return s
  }
  s.phase = 'pick'
  return s
}

/* ----------------------------------- บอท ----------------------------------- */

function remaining(s: State, viewer: number | null): Record<BinId, number> {
  const rem = { ...BIN_TOTALS }
  for (const p of s.players) for (const c of p.pile) rem[c.item.bin]--
  if (viewer !== null) for (const c of s.players[viewer].hand) rem[c.item.bin]--
  for (const b of BIN_IDS) rem[b] = Math.max(0.2, rem[b])
  return rem
}

/** ความเสี่ยงของการได้ไพ่ถังนี้เพิ่ม — ใกล้แพ้ = เสี่ยงมาก */
function danger(s: State, who: number, bin: BinId): number {
  const cnt = pileCount(s.players[who], bin)
  return cnt + 1 >= s.limit ? 10 : 1 + (2 * cnt) / s.limit
}

/** ความน่าจะเป็นที่คำบอกเป็นจริง ถ้าไม่รู้ว่าไพ่คืออะไร (คิดจากไพ่ที่เหลือ + สมมติว่าคนพูดซื่อสัตย์ t) */
function belief(rem: Record<BinId, number>, claim: BinId, t = 0.5) {
  const total = BIN_IDS.reduce((a, b) => a + rem[b], 0)
  const pi = rem[claim] / total
  const pTrue = (pi * t) / (pi * t + ((1 - pi) * (1 - t)) / 3)
  const others = BIN_IDS.filter((b) => b !== claim)
  const otherTotal = others.reduce((a, b) => a + rem[b], 0)
  const q: Record<BinId, number> = { organic: 0, recycle: 0, general: 0, hazard: 0 }
  for (const b of others) q[b] = rem[b] / otherTotal
  return { pTrue, q }
}

interface PassChoice {
  cardId: number
  to: number
  claim: BinId
}

/** เลือกว่าจะส่งไพ่ใบไหน ให้ใคร และบอกว่าอะไร — ประเมินว่าผู้รับน่าจะทายถูกไหม */
function choosePass(s: State, who: number, cards: Card[], targets: number[], rng: Rng): PassChoice | null {
  const me = s.players[who]
  const pub = remaining(s, null)
  let best: (PassChoice & { score: number }) | null = null
  for (const card of cards) {
    const actual = card.item.bin
    for (const to of targets) {
      for (const claim of BIN_IDS) {
        const { pTrue } = belief(pub, claim)
        const guessTrue = pTrue >= 0.5
        const det = claim === actual ? (guessTrue ? 1 : 0) : guessTrue ? 0 : 1
        const pCorrect = 0.15 + 0.7 * det
        const gain = danger(s, to, actual)
        const cost = danger(s, who, actual)
        let score = (1 - pCorrect) * gain - pCorrect * cost
        score += (claim === actual ? -(me.lie - 0.45) : me.lie - 0.45) * 1.2
        score += (rng() - 0.5) * 0.6
        if (!best || score > best.score) best = { cardId: card.id, to, claim, score }
      }
    }
  }
  return best
}

function decideRespond(s: State, rng: Rng): 'true' | 'false' | 'peek' {
  const o = s.offer!
  const me = o.to
  const rem = remaining(s, me)
  const { pTrue, q } = belief(rem, o.claim)
  const p = Math.min(0.95, Math.max(0.05, pTrue + (0.5 - s.players[me].sus) * 0.3))
  const bw = (who: number, bin: BinId) => 0.5 * danger(s, who, bin)

  let costTrue = 0
  let costFalse = p * danger(s, me, o.claim)
  for (const b of BIN_IDS) if (b !== o.claim) costTrue += (1 - p) * q[b] * danger(s, me, b)
  // ถ้าทายถูก ผู้ส่งต้องเก็บไพ่ — ถือเป็นข้อดี
  costTrue -= p * bw(o.from, o.claim)
  for (const b of BIN_IDS) if (b !== o.claim) costFalse -= (1 - p) * q[b] * bw(o.from, b)

  costTrue += (rng() - 0.5) * 0.4
  costFalse += (rng() - 0.5) * 0.4

  let best: 'true' | 'false' | 'peek' = costTrue <= costFalse ? 'true' : 'false'
  let bestCost = Math.min(costTrue, costFalse)
  if (canPeek(s)) {
    let peekCost = 0.1
    peekCost += p * 0.45 * danger(s, me, o.claim)
    for (const b of BIN_IDS) if (b !== o.claim) peekCost += (1 - p) * q[b] * 0.45 * danger(s, me, b)
    peekCost += (rng() - 0.5) * 0.4
    if (peekCost < bestCost) {
      best = 'peek'
      bestCost = peekCost
    }
  }
  return best
}

/** ให้บอทที่ถึงตาตัวเองทำ 1 ก้าว (ถ้าเป็นคนจริง ไม่ทำอะไร) */
export function botAct(s: State, rng: Rng = Math.random): State {
  const who = actor(s)
  if (who < 0 || s.players[who].human) return s
  if (s.phase === 'pick') {
    const c = choosePass(s, who, s.players[who].hand, targetsFor(s), rng)
    return c ? offerCard(s, c.cardId, c.to, c.claim) : s
  }
  if (s.phase === 'respond') {
    return respond(s, decideRespond(s, rng))
  }
  if (s.phase === 'repick') {
    const card = s.offer!.card
    const c = choosePass(s, who, [card], targetsFor(s), rng)
    return c ? repass(s, c.to, c.claim) : s
  }
  return s
}

/** ตัวช่วยสำหรับ UI/ทดสอบ: เล่นต่อจนถึงจุดที่ต้องให้คนจริงตัดสินใจ หรือเกมจบ */
export function advanceBots(s0: State, rng: Rng = Math.random, maxSteps = 400): State {
  let s = s0
  for (let i = 0; i < maxSteps; i++) {
    if (s.phase === 'over') return s
    if (s.phase === 'reveal') {
      s = next(s)
      continue
    }
    const a = actor(s)
    if (a >= 0 && s.players[a].human) return s
    s = botAct(s, rng)
  }
  return s
}
