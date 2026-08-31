import { LIVE_CONFIG, PHASE_DURATION, roundScore } from './config'
import { getQuestion, pickQuestions } from './questions'
import { randomLook } from './avatar'
import type { GameBackend } from './backend'
import type {
  AuthUser,
  BinId,
  BoardEntry,
  JoinProfile,
  JoinResult,
  Phase,
  PlayerState,
  PublicRound,
  RevealInfo,
  RoomSnapshot,
  RoundHistory,
  TeamEntry,
} from './types'
import { BIN_IDS } from './types'

/**
 * หลังบ้านจำลองสำหรับพัฒนา/ซ้อมระบบ
 *
 * แยกคีย์ตามเจ้าของเหมือนที่จะทำจริงบน Firestore:
 *   room:<pin>              เครื่องสตาฟเขียนเท่านั้น
 *   player:<pin>:<uid>      ผู้เล่นเขียนของตัวเอง
 *   answer:<pin>:<n>:<uid>  ผู้เล่นเขียนของตัวเอง ครั้งเดียวต่อข้อ
 * โครงนี้ย้ายไป Firestore ได้ตรงๆ โดยไม่ต้องรื้อ
 *
 * ล็อกอินเก็บใน sessionStorage (แยกตามแท็บ) — เปิดหลายแท็บ = คนละคน ซ้อมได้สมจริง
 */

const NS = 'kpi-live'

interface AnswerDoc {
  bin: BinId
  at: number
}

interface PlayerDoc extends JoinProfile {
  uid: string
  joinedAt: number
  bot?: boolean
}

interface RoomDoc {
  pin: string
  hostUid: string
  status: 'lobby' | 'running' | 'finished'
  phase: Phase
  phaseStartedAt: number
  phaseEndsAt: number
  paused: boolean
  pausedAt: number | null
  roundIndex: number
  questionIds: string[]
  finaleStep: number
  answeredCount: number
  /** เวลาที่นับจำนวนคนตอบครั้งล่าสุด ใช้หน่วงไม่ให้เขียนถี่เกินไป */
  answeredCountAt: number
  players: Record<string, PlayerState>
  rounds: Record<number, PublicRound>
  reveals: Record<number, RevealInfo>
  boards: Record<number, BoardEntry[]>
}

// ---------- storage helpers ----------

const roomKey = (pin: string) => `${NS}:room:${pin}`
const playerKey = (pin: string, uid: string) => `${NS}:player:${pin}:${uid}`
const playerPrefix = (pin: string) => `${NS}:player:${pin}:`
const answerKey = (pin: string, n: number, uid: string) => `${NS}:answer:${pin}:${n}:${uid}`

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // โควตาเต็ม/โหมดส่วนตัว — ปล่อยผ่าน ระบบจริงไม่ได้พึ่ง localStorage อยู่แล้ว
  }
}

function keysWithPrefix(prefix: string): string[] {
  const out: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(prefix)) out.push(k)
  }
  return out
}

// ---------- realtime (จำลองด้วย BroadcastChannel) ----------

const listeners = new Map<string, Set<(s: RoomSnapshot | null) => void>>()
let channel: BroadcastChannel | null = null

function ensureChannel() {
  bindStorageListener()
  if (channel || typeof BroadcastChannel === 'undefined') return
  channel = new BroadcastChannel(NS)
  channel.onmessage = (e: MessageEvent<{ pin: string }>) => emit(e.data?.pin)
}

function emit(pin: string | undefined) {
  if (!pin) return
  const set = listeners.get(pin)
  if (!set) return
  const snap = buildSnapshot(pin)
  for (const cb of set) cb(snap)
}

function notify(pin: string) {
  emit(pin)
  ensureChannel()
  channel?.postMessage({ pin })
}

let storageListenerBound = false

// ผูก listener แบบ lazy ไม่ใช่ตอนโหลดโมดูล
// ถ้าทำที่ระดับโมดูล มันจะกลายเป็น side effect ที่ bundler ตัดทิ้งไม่ได้
// แล้วคลังคำถาม (ที่มีคำเฉลย) จะติดไปกับ bundle ของโหมดจริงด้วย
function bindStorageListener() {
  if (storageListenerBound || typeof window === 'undefined') return
  storageListenerBound = true
  // เผื่อเบราว์เซอร์ที่ไม่มี BroadcastChannel — storage event ยิงข้ามแท็บได้เหมือนกัน
  window.addEventListener('storage', (e) => {
    const parts = e.key?.split(':')
    if (parts && parts[0] === NS && parts[2]) emit(parts[2])
  })
}

// ---------- auth (จำลอง) ----------

const AUTH_KEY = `${NS}:auth`
const authListeners = new Set<(u: AuthUser | null) => void>()

function readAuth(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function writeAuth(user: AuthUser | null) {
  try {
    if (user) sessionStorage.setItem(AUTH_KEY, JSON.stringify(user))
    else sessionStorage.removeItem(AUTH_KEY)
  } catch {
    // ไม่เป็นไร
  }
  for (const cb of authListeners) cb(user)
}

// ---------- game logic ----------

function emptyDistribution(): Record<BinId, number> {
  return BIN_IDS.reduce(
    (acc, id) => {
      acc[id] = 0
      return acc
    },
    {} as Record<BinId, number>,
  )
}

function rankPlayers(doc: RoomDoc) {
  const sorted = Object.values(doc.players).sort(
    (a, b) => b.score - a.score || a.totalMs - b.totalMs || a.name.localeCompare(b.name, 'th'),
  )
  sorted.forEach((p, i) => {
    p.rank = i + 1
  })
  return sorted
}

function buildBoard(doc: RoomDoc): BoardEntry[] {
  return rankPlayers(doc)
    .slice(0, LIVE_CONFIG.boardSize)
    .map((p) => ({
      uid: p.uid,
      name: p.name,
      look: p.look,
      team: p.team,
      score: p.score,
      delta: p.lastGain,
      rank: p.rank,
    }))
}

function buildTeamBoard(doc: RoomDoc): TeamEntry[] {
  const groups = new Map<string, { total: number; members: number }>()
  for (const p of Object.values(doc.players)) {
    const g = groups.get(p.team) ?? { total: 0, members: 0 }
    g.total += p.score
    g.members += 1
    groups.set(p.team, g)
  }
  return [...groups.entries()]
    .map(([team, g]) => ({ team, avgScore: Math.round(g.total / g.members), members: g.members }))
    .sort((a, b) => b.avgScore - a.avgScore)
}

function syncPlayersFromDocs(doc: RoomDoc): boolean {
  let changed = false
  for (const key of keysWithPrefix(playerPrefix(doc.pin))) {
    const pd = readJson<PlayerDoc>(key)
    if (!pd) continue
    const existing = doc.players[pd.uid]
    if (!existing) {
      // เข้าห้องได้เฉพาะตอนยังไม่เริ่มเกม — คนมาสายจะโดนกันตั้งแต่ joinRoom แล้ว
      if (doc.status !== 'lobby') continue
      doc.players[pd.uid] = {
        uid: pd.uid,
        name: pd.name,
        look: pd.look,
        team: pd.team,
        score: 0,
        correct: 0,
        totalMs: 0,
        streak: 0,
        rank: 0,
        lastGain: 0,
        lastCorrect: null,
        lastBin: null,
        results: {},
        bot: pd.bot,
      }
      changed = true
    } else if (
      existing.name !== pd.name ||
      existing.team !== pd.team ||
      existing.look.base !== pd.look.base ||
      existing.look.color !== pd.look.color ||
      existing.look.ring !== pd.look.ring ||
      existing.look.badge !== pd.look.badge
    ) {
      existing.name = pd.name
      existing.look = pd.look
      existing.team = pd.team
      changed = true
    }
  }
  return changed
}

function countAnswers(doc: RoomDoc): number {
  let n = 0
  for (const uid of Object.keys(doc.players)) {
    if (localStorage.getItem(answerKey(doc.pin, doc.roundIndex, uid))) n++
  }
  return n
}

/** ปิดข้อ: อ่านคำตอบทุกคน คิดคะแนน แล้วเขียนเฉลย + ลีดเดอร์บอร์ด */
function closeRound(doc: RoomDoc) {
  const question = getQuestion(doc.questionIds[doc.roundIndex])
  const round = doc.rounds[doc.roundIndex]
  const distribution = emptyDistribution()
  let answeredCount = 0

  for (const player of Object.values(doc.players)) {
    const answer = readJson<AnswerDoc>(answerKey(doc.pin, doc.roundIndex, player.uid))
    const elapsed = answer ? Math.max(0, answer.at - round.startedAt) : Infinity
    const inTime = !!answer && elapsed <= LIVE_CONFIG.answerMs + LIVE_CONFIG.graceMs

    if (inTime && answer) {
      answeredCount++
      distribution[answer.bin]++
    }

    const correct = inTime && answer?.bin === question.bin
    player.streak = correct ? player.streak + 1 : 0
    const gain = correct ? roundScore(elapsed, player.streak) : 0

    player.score += gain
    if (correct) player.correct++
    player.totalMs += inTime ? elapsed : LIVE_CONFIG.answerMs
    player.lastGain = gain
    player.lastCorrect = inTime ? correct : null
    player.lastBin = inTime && answer ? answer.bin : null
    player.results[doc.roundIndex] = {
      bin: inTime && answer ? answer.bin : null,
      correct,
    }
  }

  doc.reveals[doc.roundIndex] = {
    index: doc.roundIndex,
    correctBin: question.bin,
    explanation: question.explanation,
    checkLocal: question.checkLocal === true,
    distribution,
    answeredCount,
  }
  doc.answeredCount = answeredCount
  doc.boards[doc.roundIndex] = buildBoard(doc)
}

function openRound(doc: RoomDoc, index: number, now: number) {
  const question = getQuestion(doc.questionIds[index])
  doc.roundIndex = index
  doc.answeredCount = 0
  doc.answeredCountAt = 0
  doc.rounds[index] = {
    index,
    questionId: question.id,
    itemName: question.name,
    itemImage: question.image,
    itemEmoji: question.emoji,
    startedAt: now,
  }
  setPhase(doc, 'answering', now)
  scheduleBots(doc, now)
}

function setPhase(doc: RoomDoc, phase: Phase, now: number) {
  doc.phase = phase
  doc.phaseStartedAt = now
  const duration = phase in PHASE_DURATION ? PHASE_DURATION[phase as keyof typeof PHASE_DURATION] : 0
  doc.phaseEndsAt = duration ? now + duration : Number.POSITIVE_INFINITY
}

// ---------- ผู้เล่นจำลอง (ใช้ซ้อมระบบเท่านั้น) ----------

interface BotPlan {
  uid: string
  at: number
  bin: BinId
}

const botPlans = new Map<string, BotPlan[]>()

function scheduleBots(doc: RoomDoc, now: number) {
  const question = getQuestion(doc.questionIds[doc.roundIndex])
  const plans: BotPlan[] = []
  for (const player of Object.values(doc.players)) {
    if (!player.bot) continue
    const wrongBins = BIN_IDS.filter((b) => b !== question.bin)
    const correct = Math.random() < 0.7
    plans.push({
      uid: player.uid,
      at: now + 900 + Math.random() * (LIVE_CONFIG.answerMs - 1500),
      bin: correct ? question.bin : wrongBins[Math.floor(Math.random() * wrongBins.length)],
    })
  }
  botPlans.set(doc.pin, plans)
}

function runBots(doc: RoomDoc, now: number): boolean {
  const plans = botPlans.get(doc.pin)
  if (!plans?.length) return false
  let wrote = false
  const remaining: BotPlan[] = []
  for (const plan of plans) {
    if (plan.at <= now) {
      writeJson(answerKey(doc.pin, doc.roundIndex, plan.uid), { bin: plan.bin, at: now })
      wrote = true
    } else {
      remaining.push(plan)
    }
  }
  botPlans.set(doc.pin, remaining)
  return wrote
}

// ---------- snapshot ----------

function buildSnapshot(pin: string): RoomSnapshot | null {
  const doc = readJson<RoomDoc>(roomKey(pin))
  if (!doc) return null
  const viewer = readAuth()
  const isHost = viewer?.uid === doc.hostUid
  const players = Object.values(doc.players)
  const showReveal =
    doc.phase === 'reveal' || doc.phase === 'explain' || doc.phase === 'board'

  return {
    pin: doc.pin,
    status: doc.status,
    phase: doc.phase,
    phaseStartedAt: doc.phaseStartedAt,
    phaseEndsAt: doc.phaseEndsAt,
    paused: doc.paused,
    roundIndex: doc.roundIndex,
    totalRounds: doc.questionIds.length,
    round: doc.rounds[doc.roundIndex] ?? null,
    reveal: showReveal ? (doc.reveals[doc.roundIndex] ?? null) : null,
    board:
      doc.phase === 'finale' || doc.phase === 'ended'
        ? (doc.boards[doc.questionIds.length - 1] ?? buildBoard(doc))
        : (doc.boards[doc.roundIndex] ?? []),
    teamBoard: buildTeamBoard(doc),
    finaleStep: doc.finaleStep,
    // adapter จริงต้องไม่ส่งรายชื่อทั้งห้องไปที่เครื่องผู้เล่น — จำลองพฤติกรรมนั้นไว้ตั้งแต่ตอนนี้
    // จะได้ไม่มีหน้าจอไหนแอบไปพึ่งข้อมูลก้อนนี้โดยไม่ตั้งใจ
    players: isHost ? players : [],
    playerCount: players.length,
    me: viewer ? (doc.players[viewer.uid] ?? null) : null,
    isHost,
    answeredCount: doc.answeredCount,
    history: doc.phase === 'ended' ? buildHistory(doc) : [],
    serverNow: Date.now(),
  }
}

/** สรุปทุกข้อ — เปิดให้ดูได้หลังเกมจบเท่านั้น ระหว่างเล่นห้ามส่งคำเฉลยล่วงหน้าไปที่เครื่องผู้เล่น */
function buildHistory(doc: RoomDoc): RoundHistory[] {
  const out: RoundHistory[] = []
  for (let i = 0; i < doc.questionIds.length; i++) {
    const round = doc.rounds[i]
    const reveal = doc.reveals[i]
    if (round && reveal) out.push({ round, reveal })
  }
  return out
}

// ---------- backend ----------

function makePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function makeUid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function slugFromName(name: string): string {
  const ascii = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')
  return ascii || `player.${makeUid().slice(0, 4)}`
}

export const mockBackend: GameBackend = {
  id: 'mock',
  isMock: true,

  now: () => Date.now(),

  currentUser: readAuth,

  async signIn(hint) {
    const name = hint?.name?.trim() || 'ผู้เล่นทดสอบ'
    const user: AuthUser = {
      uid: makeUid(),
      name,
      email: `${slugFromName(name)}@kpi.ac.th`,
    }
    writeAuth(user)
    return user
  },

  signOut() {
    writeAuth(null)
  },

  onAuthChanged(cb) {
    authListeners.add(cb)
    cb(readAuth())
    return () => authListeners.delete(cb)
  },

  async joinRoom(pin, profile): Promise<JoinResult> {
    const user = readAuth()
    if (!user) return { ok: false, reason: 'ยังไม่ได้เข้าสู่ระบบ' }
    const doc = readJson<RoomDoc>(roomKey(pin))
    if (!doc) return { ok: false, reason: 'ไม่พบห้องนี้ ลองเช็ค PIN อีกครั้ง' }
    const rejoining = !!doc.players[user.uid]
    if (doc.status === 'finished' && !rejoining) return { ok: false, reason: 'เกมนี้จบไปแล้ว' }
    if (doc.status === 'running' && !rejoining) {
      return { ok: false, reason: 'เกมเริ่มไปแล้ว รอรอบถัดไปนะ' }
    }
    writeJson(playerKey(pin, user.uid), {
      uid: user.uid,
      joinedAt: Date.now(),
      ...profile,
    } satisfies PlayerDoc)
    notify(pin)
    return { ok: true }
  },

  async submitAnswer(pin, roundIndex, bin) {
    const user = readAuth()
    if (!user) return false
    const key = answerKey(pin, roundIndex, user.uid)
    // ตอบได้ครั้งเดียวต่อข้อ — ของจริงบังคับด้วย security rule ฝั่งเซิร์ฟเวอร์
    if (localStorage.getItem(key)) return false

    // กันคำตอบที่มาหลังหมดเวลา (เช่น เครื่องหน่วงแล้วเพิ่งส่ง) ไม่ให้ถูกบันทึกเลย
    // ถ้าปล่อยให้เขียนได้ ตัวสรุปตอนจบจะเห็นคำตอบที่ระบบไม่ได้นับคะแนนให้
    const doc = readJson<RoomDoc>(roomKey(pin))
    const startedAt = doc?.rounds[roundIndex]?.startedAt
    const now = Date.now()
    if (!startedAt || now - startedAt > LIVE_CONFIG.answerMs + LIVE_CONFIG.graceMs) return false

    writeJson(key, { bin, at: now } satisfies AnswerDoc)
    notify(pin)
    return true
  },

  getMyAnswer(pin, roundIndex) {
    const user = readAuth()
    if (!user) return null
    return readJson<AnswerDoc>(answerKey(pin, roundIndex, user.uid))?.bin ?? null
  },

  async createRoom() {
    const user = readAuth()
    if (!user) throw new Error('ต้องเข้าสู่ระบบก่อนสร้างห้อง')
    const pin = makePin()
    const now = Date.now()
    const doc: RoomDoc = {
      pin,
      hostUid: user.uid,
      status: 'lobby',
      phase: 'lobby',
      phaseStartedAt: now,
      phaseEndsAt: Number.POSITIVE_INFINITY,
      paused: false,
      pausedAt: null,
      roundIndex: 0,
      questionIds: pickQuestions(pin, LIVE_CONFIG.totalRounds),
      finaleStep: 0,
      answeredCount: 0,
      answeredCountAt: 0,
      players: {},
      rounds: {},
      reveals: {},
      boards: {},
    }
    writeJson(roomKey(pin), doc)
    notify(pin)
    return pin
  },

  async startGame(pin) {
    const doc = readJson<RoomDoc>(roomKey(pin))
    if (!doc || doc.status !== 'lobby') return
    syncPlayersFromDocs(doc)
    doc.status = 'running'
    doc.roundIndex = 0
    setPhase(doc, 'countdown', Date.now())
    writeJson(roomKey(pin), doc)
    notify(pin)
  },

  async skipPhase(pin) {
    const doc = readJson<RoomDoc>(roomKey(pin))
    if (!doc || doc.status !== 'running') return
    doc.phaseEndsAt = Date.now()
    doc.paused = false
    doc.pausedAt = null
    writeJson(roomKey(pin), doc)
    notify(pin)
  },

  async togglePause(pin) {
    const doc = readJson<RoomDoc>(roomKey(pin))
    if (!doc) return
    const now = Date.now()
    if (doc.paused && doc.pausedAt !== null) {
      const pausedMs = now - doc.pausedAt
      if (Number.isFinite(doc.phaseEndsAt)) doc.phaseEndsAt += pausedMs
      // พักตอนกำลังตอบ → เลื่อน startedAt ด้วย ไม่งั้นคำตอบหลังเล่นต่อจะถูกนับว่าช้าเกินเวลา
      if (doc.phase === 'answering' && doc.rounds[doc.roundIndex]) {
        doc.rounds[doc.roundIndex].startedAt += pausedMs
      }
      doc.paused = false
      doc.pausedAt = null
    } else {
      doc.paused = true
      doc.pausedAt = now
    }
    writeJson(roomKey(pin), doc)
    notify(pin)
  },

  async nextFinale(pin) {
    const doc = readJson<RoomDoc>(roomKey(pin))
    if (!doc || doc.phase !== 'finale') return
    advanceFinale(doc, Date.now())
    writeJson(roomKey(pin), doc)
    notify(pin)
  },

  async addBots(pin, count) {
    const doc = readJson<RoomDoc>(roomKey(pin))
    if (!doc || doc.status !== 'lobby') return
    const names = [
      'พี่ก้อย', 'น้องปอนด์', 'พี่เอ', 'ครูหนึ่ง', 'พี่ตั้ม', 'น้องมิ้นท์',
      'พี่หน่อย', 'พี่โบว์', 'น้องเจ', 'พี่นัท', 'พี่แดง', 'น้องแพร',
    ]
    const existing = Object.values(doc.players).filter((p) => p.bot).length
    for (let i = 0; i < count; i++) {
      const n = existing + i
      const uid = `bot-${n}`
      writeJson(playerKey(pin, uid), {
        uid,
        name: `${names[n % names.length]} (ซ้อม)`,
        look: randomLook(),
        team: '',
        joinedAt: Date.now(),
        bot: true,
      } satisfies PlayerDoc)
    }
    notify(pin)
  },

  runHostLoop(pin) {
    const timer = window.setInterval(() => {
      const doc = readJson<RoomDoc>(roomKey(pin))
      if (!doc) return
      const now = Date.now()
      let dirty = false

      if (doc.status === 'lobby') {
        dirty = syncPlayersFromDocs(doc)
      }

      if (doc.paused) {
        if (dirty) {
          writeJson(roomKey(pin), doc)
          notify(pin)
        }
        return
      }

      if (doc.phase === 'answering') {
        if (runBots(doc, now)) dirty = true
        // นับคนที่ตอบแล้วไม่เกินวินาทีละครั้ง — ถ้าอัปเดตทุกครั้งที่มีคนตอบ
        // ห้อง 250 คนจะเขียนห้อง 250 รอบต่อข้อ และทุกเครื่องต้องโหลดใหม่ทุกรอบ
        if (now - doc.answeredCountAt >= 1000) {
          const answered = countAnswers(doc)
          if (answered !== doc.answeredCount) {
            doc.answeredCount = answered
            dirty = true
          }
          doc.answeredCountAt = now
        }
        // ไม่ตัดจบก่อนเวลาแม้ทุกคนตอบครบแล้ว — ให้นับถอยหลังจนหมด 10 วินาทีจริงๆ
        // ก่อนค่อยเฉลย ตามกติกาที่ประกาศกับผู้เล่นไว้
      }

      if (now >= doc.phaseEndsAt) {
        advancePhase(doc, now)
        dirty = true
      }

      if (dirty) {
        writeJson(roomKey(pin), doc)
        notify(pin)
      }
    }, 150)

    return () => window.clearInterval(timer)
  },

  subscribeRoom(pin, cb) {
    ensureChannel()
    const set = listeners.get(pin) ?? new Set()
    set.add(cb)
    listeners.set(pin, set)
    cb(buildSnapshot(pin))
    return () => {
      set.delete(cb)
      if (set.size === 0) listeners.delete(pin)
    }
  },

  exportCsv(pin) {
    const doc = readJson<RoomDoc>(roomKey(pin))
    if (!doc) return ''
    const rows = [['อันดับ', 'ชื่อ', 'สำนัก/กอง', 'คะแนน', 'ตอบถูก (ข้อ)', 'เวลารวม (วินาที)']]
    for (const p of rankPlayers(doc)) {
      rows.push([
        String(p.rank),
        p.name,
        p.team,
        String(p.score),
        `${p.correct}/${doc.questionIds.length}`,
        (p.totalMs / 1000).toFixed(1),
      ])
    }
    return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  },
}

function advanceFinale(doc: RoomDoc, now: number) {
  const total = Math.min(LIVE_CONFIG.boardSize, doc.boards[doc.questionIds.length - 1]?.length ?? 0)
  if (doc.finaleStep >= total) {
    doc.phase = 'ended'
    doc.status = 'finished'
    doc.phaseStartedAt = now
    doc.phaseEndsAt = Number.POSITIVE_INFINITY
    return
  }
  doc.finaleStep += 1
  doc.phaseStartedAt = now
  doc.phaseEndsAt = now + LIVE_CONFIG.finaleStepMs
}

function advancePhase(doc: RoomDoc, now: number) {
  switch (doc.phase) {
    case 'countdown':
      openRound(doc, doc.roundIndex, now)
      break
    case 'answering':
      closeRound(doc)
      setPhase(doc, 'reveal', now)
      break
    case 'reveal':
      setPhase(doc, 'explain', now)
      break
    case 'explain':
      setPhase(doc, 'board', now)
      break
    case 'board':
      if (doc.roundIndex + 1 < doc.questionIds.length) {
        doc.roundIndex += 1
        setPhase(doc, 'countdown', now)
      } else {
        doc.finaleStep = 0
        setPhase(doc, 'finale', now)
      }
      break
    case 'finale':
      advanceFinale(doc, now)
      break
    default:
      doc.phaseEndsAt = Number.POSITIVE_INFINITY
  }
}

/** ชื่อกลางที่ vite alias 'virtual:live-backend' หยิบไปใช้ */
export const backend = mockBackend
