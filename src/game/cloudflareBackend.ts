import type { GameBackend } from './backend'
import type { ClientMessage, PublicRoom, ServerMessage } from './protocol'
import type {
  AuthUser,
  BinId,
  JoinProfile,
  JoinResult,
  PlayerState,
  RoomSnapshot,
  RoundResult,
} from './types'

/**
 * หลังบ้านจริง — Cloudflare Worker + Durable Object ผ่าน WebSocket
 *
 * ต่างจากโหมดจำลองตรงที่ **เซิร์ฟเวอร์เป็นเจ้าของทุกอย่าง**: นาฬิกา คะแนน และคำเฉลย
 * เครื่องสตาฟเหลือหน้าที่แค่กดปุ่มกับแสดงผล ถ้าเน็ตเครื่องสตาฟสะดุด เกมยังเดินต่อให้ทุกคน
 *
 * ตั้งค่า endpoint ที่ .env: VITE_LIVE_API=https://kpigreenoffice-live.<subdomain>.workers.dev
 */

const API_BASE = (import.meta.env.VITE_LIVE_API as string | undefined)?.replace(/\/$/, '') ?? ''
const AUTH_KEY = 'kpi-live:auth'

/** สร้าง id ประจำเครื่องแบบสุ่ม — ไม่ใช่ข้อมูลลับ ใช้แค่ผูก "คนเดิม" ตอน reconnect */
function newGuestUid(): string {
  const rnd =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '')
      : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  return `g-${rnd.slice(0, 20)}`
}

type RoomListener = (snapshot: RoomSnapshot | null) => void

interface Connection {
  pin: string
  socket: WebSocket
  listeners: Set<RoomListener>
  room: PublicRoom | null
  me: Omit<PlayerState, 'results'> | null
  results: Record<number, RoundResult>
  roster: PlayerState[]
  /** เซิร์ฟเวอร์เป็นคนบอกว่าคนที่ถือ socket นี้เป็นสตาฟของห้องนี้จริงไหม (มาจาก 'authed') */
  isHost: boolean
  /** คำตอบที่ส่งไปแล้วและเซิร์ฟเวอร์รับ — ใช้ล็อกปุ่มหลังตอบ */
  answers: Map<number, BinId>
  closed: boolean
  retryAt: number
  retries: number
}

let connection: Connection | null = null
/** ส่วนต่างเวลาระหว่างนาฬิกาเครื่องนี้กับเซิร์ฟเวอร์ */
let clockSkew = 0
const authListeners = new Set<(u: AuthUser | null) => void>()
const joinWaiters = new Set<(result: JoinResult) => void>()

// ---------- ตัวช่วยเก็บสถานะล็อกอิน ----------

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
    // โหมดส่วนตัวเขียนไม่ได้ ไม่เป็นไร
  }
  for (const cb of authListeners) cb(user)
}

// ---------- การเชื่อมต่อ ----------

function wsUrl(pin: string): string {
  const base = API_BASE || window.location.origin
  const url = new URL(`${base}/api/ws`)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('pin', pin)
  return url.toString()
}

function send(msg: ClientMessage) {
  const conn = connection
  if (!conn || conn.socket.readyState !== WebSocket.OPEN) return
  conn.socket.send(JSON.stringify(msg))
}

function snapshotOf(conn: Connection): RoomSnapshot | null {
  if (!conn.room) return null
  const r = conn.room
  return {
    pin: r.pin,
    status: r.status,
    phase: r.phase,
    phaseStartedAt: r.phaseStartedAt,
    phaseEndsAt: r.phaseEndsAt,
    paused: r.paused,
    roundIndex: r.roundIndex,
    totalRounds: r.totalRounds,
    round: r.round,
    reveal: r.reveal,
    board: r.board,
    teamBoard: r.teamBoard,
    finaleStep: r.finaleStep,
    players: conn.roster,
    playerCount: r.playerCount,
    me: conn.me ? { ...conn.me, results: conn.results } : null,
    isHost: conn.isHost,
    answeredCount: r.answeredCount,
    history: r.history,
    serverNow: r.serverNow,
  }
}

function emit(conn: Connection) {
  const snap = snapshotOf(conn)
  for (const cb of conn.listeners) cb(snap)
}

function handleMessage(conn: Connection, msg: ServerMessage) {
  switch (msg.t) {
    case 'authed':
      writeAuth({ uid: msg.uid, name: msg.name })
      conn.isHost = msg.isHost
      emit(conn)
      break
    case 'room':
      // เทียบนาฬิกาเครื่องเรากับเซิร์ฟเวอร์ทุกครั้งที่มีข้อมูลเข้ามา
      // วงแหวนนับถอยหลังจะได้ตรงกับเวลาจริงแม้เครื่องผู้เล่นตั้งนาฬิกาเพี้ยน
      clockSkew = msg.room.serverNow - Date.now()
      conn.room = msg.room
      emit(conn)
      break
    case 'me':
      conn.me = msg.me
      conn.results = msg.results
      emit(conn)
      break
    case 'roster':
      conn.roster = msg.players
      emit(conn)
      break
    case 'joined':
      for (const w of joinWaiters) w({ ok: msg.ok, reason: msg.reason })
      joinWaiters.clear()
      break
    case 'answerAck':
      if (msg.accepted) conn.answers.set(msg.round, msg.bin)
      break
    case 'pong':
      clockSkew = msg.serverNow - Date.now()
      break
    case 'error':
      console.warn('[live]', msg.reason)
      break
  }
}

function authenticate() {
  // ส่ง uid เดิมกลับไปทุกครั้งที่ต่อ เพื่อให้เป็นคนเดิมตอน reconnect (เน็ตสะดุด/รีเฟรช)
  // ไม่งั้นเซิร์ฟเวอร์จะออก uid ใหม่ให้ = เสียคะแนน/เสียสิทธิ์สตาฟแบบเงียบๆ
  const user = readAuth() ?? { uid: newGuestUid(), name: 'ผู้เล่น' }
  writeAuth(user)
  send({ t: 'auth', uid: user.uid, name: user.name })
}

function connect(pin: string): Connection {
  if (connection && connection.pin === pin && !connection.closed) return connection

  if (connection && connection.pin !== pin) {
    connection.closed = true
    connection.socket.close(1000, 'เปลี่ยนห้อง')
  }

  const listeners = connection?.pin === pin ? connection.listeners : new Set<RoomListener>()

  const socket = new WebSocket(wsUrl(pin))
  const conn: Connection = {
    pin,
    socket,
    listeners,
    room: connection?.pin === pin ? (connection.room ?? null) : null,
    me: connection?.pin === pin ? (connection.me ?? null) : null,
    results: connection?.pin === pin ? connection.results : {},
    roster: connection?.pin === pin ? connection.roster : [],
    isHost: connection?.pin === pin ? connection.isHost : false,
    answers: connection?.pin === pin ? connection.answers : new Map(),
    closed: false,
    retryAt: 0,
    retries: connection?.pin === pin ? connection.retries : 0,
  }
  connection = conn

  socket.addEventListener('open', () => {
    conn.retries = 0
    authenticate()
  })

  socket.addEventListener('message', (event) => {
    try {
      handleMessage(conn, JSON.parse(event.data as string) as ServerMessage)
    } catch {
      // ข้อความเสีย ข้ามไป
    }
  })

  socket.addEventListener('close', () => {
    if (conn.closed) return
    // เน็ตหลุดกลางเกมต้องกลับเข้ามาเองได้ ผู้เล่นไม่ควรต้องรีเฟรชเอง
    // ถอยเวลารอเพิ่มขึ้นเรื่อยๆ กันเคสเซิร์ฟเวอร์ล่มแล้ว 250 เครื่องรุมต่อใหม่พร้อมกัน
    const delay = Math.min(500 * 2 ** conn.retries, 10_000) + Math.random() * 400
    conn.retries += 1
    window.setTimeout(() => {
      if (connection === conn && !conn.closed) connect(pin)
    }, delay)
  })

  return conn
}

// ---------- adapter ----------

export const cloudflareBackend: GameBackend = {
  id: 'cloudflare',
  isMock: false,

  now: () => Date.now() + clockSkew,

  currentUser: readAuth,

  async signIn(hint) {
    // ไม่มีล็อกอิน — แค่สร้างตัวตนแบบไม่ระบุชื่อ (uid สุ่ม เก็บในเครื่อง)
    // ชื่อจริงมากรอกอีกทีตอนกด "เข้าห้อง" (ส่งผ่านข้อความ join)
    const existing = readAuth()
    const user: AuthUser = {
      uid: existing?.uid || newGuestUid(),
      name: hint?.name?.trim() || existing?.name || 'ผู้เล่น',
    }
    writeAuth(user)
    if (connection && connection.socket.readyState === WebSocket.OPEN) {
      send({ t: 'auth', uid: user.uid, name: user.name })
    }
    return user
  },

  signOut() {
    writeAuth(null)
    if (connection) {
      connection.closed = true
      connection.socket.close(1000, 'ออกจากระบบ')
      connection = null
    }
  },

  onAuthChanged(cb) {
    authListeners.add(cb)
    cb(readAuth())
    return () => authListeners.delete(cb)
  },

  async joinRoom(pin, profile: JoinProfile) {
    const conn = connect(pin)
    await waitOpen(conn)
    return new Promise<JoinResult>((resolve) => {
      joinWaiters.add(resolve)
      send({ t: 'join', ...profile })
      window.setTimeout(() => {
        if (joinWaiters.delete(resolve)) {
          resolve({ ok: false, reason: 'เซิร์ฟเวอร์ไม่ตอบ ลองใหม่อีกครั้ง' })
        }
      }, 8000)
    })
  },

  async submitAnswer(pin, roundIndex, bin) {
    const conn = connection
    if (!conn || conn.pin !== pin) return false
    if (conn.answers.has(roundIndex)) return false
    send({ t: 'answer', round: roundIndex, bin })

    // รอ ack สั้นๆ เพื่อให้หน้าจอไม่ขึ้นว่า "ส่งคำตอบแล้ว" ทั้งที่เซิร์ฟเวอร์ไม่รับ
    return new Promise<boolean>((resolve) => {
      const started = Date.now()
      const check = () => {
        if (conn.answers.get(roundIndex) === bin) return resolve(true)
        if (Date.now() - started > 3000) return resolve(false)
        window.setTimeout(check, 60)
      }
      check()
    })
  },

  getMyAnswer(pin, roundIndex) {
    if (!connection || connection.pin !== pin) return null
    return connection.answers.get(roundIndex) ?? null
  },

  async createRoom() {
    const base = API_BASE || window.location.origin
    const res = await fetch(`${base}/api/room`, { method: 'POST' })
    if (!res.ok) throw new Error('สร้างห้องไม่สำเร็จ')
    const body = (await res.json()) as { pin: string }
    connect(body.pin)
    return body.pin
  },

  async startGame(pin) {
    connect(pin)
    send({ t: 'start' })
  },

  async skipPhase(pin) {
    connect(pin)
    send({ t: 'skip' })
  },

  async togglePause(pin) {
    connect(pin)
    send({ t: 'pause' })
  },

  async nextFinale(pin) {
    connect(pin)
    send({ t: 'nextFinale' })
  },

  async addBots(pin, count) {
    connect(pin)
    send({ t: 'addBots', count })
  },

  // เซิร์ฟเวอร์เป็นคนจับเวลาเอง เครื่องสตาฟไม่ต้องทำอะไร
  // นี่คือข้อได้เปรียบหลักของ Durable Object — เน็ตเครื่องสตาฟสะดุด เกมก็ยังเดินต่อ
  runHostLoop() {
    return () => {}
  },

  subscribeRoom(pin, cb) {
    const conn = connect(pin)
    conn.listeners.add(cb)
    cb(snapshotOf(conn))
    return () => {
      conn.listeners.delete(cb)
    }
  },

  exportCsv(pin) {
    const conn = connection
    if (!conn || conn.pin !== pin) return ''
    const total = conn.room?.totalRounds ?? 0
    const rows = [['อันดับ', 'ชื่อ', 'สำนัก/กอง', 'คะแนน', 'ตอบถูก (ข้อ)', 'เวลารวม (วินาที)']]
    for (const p of conn.roster) {
      rows.push([
        String(p.rank),
        p.name,
        p.team,
        String(p.score),
        `${p.correct}/${total}`,
        (p.totalMs / 1000).toFixed(1),
      ])
    }
    return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  },
}

/** ชื่อกลางที่ vite alias 'virtual:live-backend' หยิบไปใช้ */
export const backend = cloudflareBackend

function waitOpen(conn: Connection): Promise<void> {
  if (conn.socket.readyState === WebSocket.OPEN) return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => resolve()
    conn.socket.addEventListener('open', done, { once: true })
    window.setTimeout(done, 5000)
  })
}
