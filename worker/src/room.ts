import { DurableObject } from 'cloudflare:workers'
import { LIVE_CONFIG, PHASE_DURATION, roundScore } from './config'
import { getQuestion, pickQuestions } from './questions'
import {
  BIN_IDS,
  type AvatarLook,
  type BinId,
  type BoardEntry,
  type ClientMessage,
  type Phase,
  type PlayerState,
  type PublicRoom,
  type PublicRound,
  type RevealInfo,
  type RoundHistory,
  type RoundResult,
  type ServerMessage,
  type TeamEntry,
} from './protocol'

export interface Env {
  GAME_ROOM: DurableObjectNamespace<GameRoom>
  /** เว็บที่เปิด WebSocket มาที่ห้องนี้ได้ (คั่นด้วย ,) — กันเว็บอื่นแอบต่อเข้ามา */
  ALLOWED_ORIGINS: string
  /** ฐานข้อมูลแคมเปญป่า 3R — ผูกใน wrangler.jsonc (ไม่มีก็ต่อ /api/forest/* ไม่ได้) */
  DB?: D1Database
  /** ความลับเซ็นโทเคน session ของแคมเปญป่า — `wrangler secret put SESSION_SECRET` */
  SESSION_SECRET?: string
}

/** สถานะห้องส่วนที่เล็กพอจะเก็บเป็นก้อนเดียว */
interface RoomMeta {
  pin: string
  hostUid: string | null
  status: 'lobby' | 'running' | 'finished'
  phase: Phase
  phaseStartedAt: number
  phaseEndsAt: number
  paused: boolean
  pausedAt: number | null
  roundIndex: number
  questionIds: string[]
  finaleStep: number
  createdAt: number
}

/** ข้อมูลที่ผูกกับ WebSocket แต่ละเส้น — อยู่รอดข้าม hibernation */
interface SocketInfo {
  uid: string
  name: string
  isHost: boolean
}

const emptyDistribution = (): Record<BinId, number> =>
  BIN_IDS.reduce((acc, id) => ({ ...acc, [id]: 0 }), {} as Record<BinId, number>)

export class GameRoom extends DurableObject<Env> {
  private meta: RoomMeta
  /** เวลาที่กระจายจำนวนคนตอบครั้งล่าสุด ใช้หน่วงไม่ให้ยิงถี่เกินไปตอนคน 250 คนตอบพร้อมกัน */
  private lastCountBroadcast = 0
  /** หน่วง broadcast เต็มห้องตอนล็อบบี้ กันสตอร์มตอนคนสแกน QR เข้ามาพร้อมกัน */
  private lastLobbyBroadcast = 0
  private lobbyBroadcastPending = false

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    this.meta = {
      pin: '',
      hostUid: null,
      status: 'lobby',
      phase: 'lobby',
      phaseStartedAt: 0,
      phaseEndsAt: 0,
      paused: false,
      pausedAt: null,
      roundIndex: 0,
      questionIds: [],
      finaleStep: 0,
      createdAt: 0,
    }

    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS players (
          uid TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          look TEXT NOT NULL,
          team TEXT NOT NULL,
          score INTEGER NOT NULL DEFAULT 0,
          correct INTEGER NOT NULL DEFAULT 0,
          totalMs INTEGER NOT NULL DEFAULT 0,
          streak INTEGER NOT NULL DEFAULT 0,
          lastGain INTEGER NOT NULL DEFAULT 0,
          lastCorrect INTEGER,
          lastBin TEXT,
          bot INTEGER NOT NULL DEFAULT 0,
          joinedAt INTEGER NOT NULL
        );

        -- primary key (round, uid) คือกติกา "ตอบได้ครั้งเดียวต่อข้อ" ที่บังคับโดยฐานข้อมูลเอง
        CREATE TABLE IF NOT EXISTS answers (
          round INTEGER NOT NULL,
          uid TEXT NOT NULL,
          bin TEXT NOT NULL,
          at INTEGER NOT NULL,
          PRIMARY KEY (round, uid)
        );

        -- ผลรายข้อของ "ทุกคน" เก็บรวมเป็นก้อนเดียวต่อข้อ ไม่ใช่แถวละคน
        --
        -- โควตาของ Durable Objects นับเป็น "จำนวนแถวที่เขียน" ห้อง 250 คนแบบแถวละคน
        -- กินไป 250 แถวต่อข้อ = 2,500 แถวต่อเกม เฉพาะตารางนี้ตารางเดียว
        -- เก็บเป็นก้อนเดียวเหลือ 10 แถวต่อเกม และตอนอ่าน (ทุกครั้งที่เปลี่ยนเฟส)
        -- ก็เหลืออ่านไม่เกิน 10 แถวแทนที่จะเป็น 2,500 แถว
        CREATE TABLE IF NOT EXISTS roundResults (
          round INTEGER PRIMARY KEY,
          payload TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS reveals (
          round INTEGER PRIMARY KEY,
          payload TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS rounds (
          round INTEGER PRIMARY KEY,
          payload TEXT NOT NULL
        );
      `)

      const stored = await this.ctx.storage.get<RoomMeta>('meta')
      if (stored) this.meta = stored
    })
  }

  // ---------- ทางเข้า ----------

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.endsWith('/create')) {
      const pin = url.searchParams.get('pin') ?? ''
      const host = url.searchParams.get('host') ?? ''
      await this.ensureRoom(pin, host)
      return Response.json({ pin })
    }

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('ต้องเป็น WebSocket', { status: 426 })
    }

    const pin = url.searchParams.get('pin') ?? ''
    if (!this.meta.pin) return new Response('ไม่พบห้องนี้', { status: 404 })
    if (pin !== this.meta.pin) return new Response('PIN ไม่ตรง', { status: 404 })

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    // acceptWebSocket (ไม่ใช่ server.accept) เพื่อให้ DO หลับได้ตอนไม่มีอะไรเกิดขึ้น
    // ห้อง 250 คนที่นั่งรอในห้อง lobby จึงไม่กินเวลาประมวลผลเลย
    this.ctx.acceptWebSocket(server)
    return new Response(null, { status: 101, webSocket: client })
  }

  private async ensureRoom(pin: string, hostUid = '') {
    if (this.meta.pin) return
    this.meta.pin = pin
    this.meta.createdAt = Date.now()
    // เครื่องที่กด "สร้างห้อง" เป็นเจ้าของห้องทันที ไม่ต้องรอให้ต่อ WebSocket ก่อน
    if (/^g-[a-z0-9]{8,40}$/i.test(hostUid)) this.meta.hostUid = hostUid
    this.meta.questionIds = pickQuestions(pin, LIVE_CONFIG.totalRounds)
    await this.saveMeta()
  }

  private async saveMeta() {
    await this.ctx.storage.put('meta', this.meta)
  }

  // ---------- ข้อความจากเบราว์เซอร์ ----------

  override async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    if (typeof raw !== 'string') return
    let msg: ClientMessage
    try {
      msg = JSON.parse(raw) as ClientMessage
    } catch {
      return
    }

    const info = ws.deserializeAttachment() as SocketInfo | null

    if (msg.t === 'auth') {
      await this.handleAuth(ws, msg)
      return
    }
    if (msg.t === 'ping') {
      this.send(ws, { t: 'pong', serverNow: Date.now() })
      return
    }
    if (!info) {
      this.send(ws, { t: 'error', reason: 'ยังไม่ได้เข้าสู่ระบบ' })
      return
    }

    switch (msg.t) {
      case 'join':
        await this.handleJoin(ws, info, msg.name, msg.look, msg.team)
        break
      case 'leave':
        await this.handleLeave(ws, info)
        break
      case 'answer':
        await this.handleAnswer(ws, info, msg.round, msg.bin)
        break
      case 'start':
        if (info.isHost) await this.startGame()
        break
      case 'skip':
        if (info.isHost) await this.skipPhase()
        break
      case 'pause':
        if (info.isHost) await this.togglePause()
        break
      case 'nextFinale':
        if (info.isHost) await this.advanceFinale(Date.now())
        break
      case 'addBots':
        if (info.isHost) await this.addBots(msg.count)
        break
    }
  }

  override async webSocketClose(ws: WebSocket) {
    // ไม่ต้องลบผู้เล่นออกจากห้อง — คะแนนต้องอยู่ต่อแม้เน็ตหลุด กลับมาต่อได้เลย
    try {
      ws.close(1000, 'ปิดการเชื่อมต่อ')
    } catch {
      // ปิดไปแล้ว
    }
  }

  private async handleAuth(ws: WebSocket, msg: { uid?: string; name?: string }) {
    // ไม่มีล็อกอิน — เชื่อ uid ที่เบราว์เซอร์สร้างเองและเก็บไว้ในเครื่อง
    // uid ใช้แค่ผูก "คนเดิม" ตอน reconnect กับตัดสินว่าใครเป็นสตาฟ ไม่ใช่ข้อมูลลับ
    // รูปแบบบังคับเป็น g-<โทเคนสุ่ม> ถ้าส่งอะไรแปลกมาก็ออกให้ใหม่ กันคนยัด uid ซ้ำของคนอื่น
    const rawUid = (msg.uid ?? '').trim()
    const uid = /^g-[a-z0-9]{8,40}$/i.test(rawUid)
      ? rawUid
      : `g-${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`
    const name = (msg.name ?? '').trim().slice(0, 24) || 'ผู้เล่น'

    // คนแรกที่เปิดห้อง = สตาฟ ห้องหนึ่งมีสตาฟได้คนเดียว
    if (!this.meta.hostUid) {
      this.meta.hostUid = uid
      await this.saveMeta()
    }

    const info: SocketInfo = { uid, name, isHost: uid === this.meta.hostUid }
    ws.serializeAttachment(info)

    this.send(ws, { t: 'authed', uid, name, isHost: info.isHost })
    this.sendRoom(ws)
    this.sendMe(ws, uid)
    if (info.isHost) this.sendRoster(ws)
  }

  // ---------- ผู้เล่น ----------

  private async handleJoin(
    ws: WebSocket,
    info: SocketInfo,
    name: string,
    look: AvatarLook,
    team: string,
  ) {
    const existing = this.getPlayer(info.uid)

    if (!existing && this.meta.status !== 'lobby') {
      this.send(ws, {
        t: 'joined',
        ok: false,
        reason:
          this.meta.status === 'finished' ? 'เกมนี้จบไปแล้ว' : 'เกมเริ่มไปแล้ว รอรอบถัดไปนะ',
      })
      return
    }

    const safeName = (name ?? '').trim().slice(0, 24) || info.name
    if (existing) {
      this.ctx.storage.sql.exec(
        'UPDATE players SET name = ?, look = ?, team = ? WHERE uid = ?',
        safeName,
        JSON.stringify(look),
        team,
        info.uid,
      )
    } else {
      this.ctx.storage.sql.exec(
        `INSERT INTO players (uid, name, look, team, joinedAt) VALUES (?, ?, ?, ?, ?)`,
        info.uid,
        safeName,
        JSON.stringify(look),
        team,
        Date.now(),
      )
    }

    this.send(ws, { t: 'joined', ok: true })
    this.sendMe(ws, info.uid)
    // ตอนคน 250 คนสแกน QR เข้ามาไล่ๆ กัน ถ้ายิง broadcast เต็มห้องต่อ 1 คนที่เข้า
    // จะกลายเป็น O(N²) ส่ง — รวบให้เหลือ ~วินาทีละ 2 ครั้งพอ ตัวเลขในล็อบบี้ไม่ต้องเป๊ะวินาที
    this.queueRoomBroadcast()
  }

  /**
   * ผู้เล่นกด "ออกจากห้อง" เอง — ต่างจากเน็ตหลุด (webSocketClose) ที่ตั้งใจไม่ลบผู้เล่น
   * ตรงนี้ต้องเอาออกจากห้องจริง ไม่งั้นตัวละครค้างบนจอสตาฟ และกลับเข้ามาใหม่จะเจอสถานะเดิมค้าง
   * ล้างคำตอบด้วย เผื่อออกกลางเกมแล้วกลับเข้ามารอบใหม่
   * ไม่แตะบอท (bot = 1) และไม่แตะ hostUid — ปุ่มนี้มีเฉพาะหน้าผู้เล่นตอน lobby
   */
  private async handleLeave(ws: WebSocket, info: SocketInfo) {
    this.ctx.storage.sql.exec('DELETE FROM answers WHERE uid = ?', info.uid)
    this.forgetResults(info.uid)
    this.ctx.storage.sql.exec('DELETE FROM players WHERE uid = ? AND bot = 0', info.uid)
    this.queueRoomBroadcast()
    try {
      ws.close(1000, 'ออกจากห้อง')
    } catch {
      // ปิดไปแล้ว
    }
  }

  /** รวบ broadcast เต็มห้อง (room + roster) ให้ถี่สุดราว 2.5 ครั้ง/วินาที กันสตอร์มตอนคนเข้าพร้อมกัน */
  private queueRoomBroadcast() {
    const now = Date.now()
    if (now - this.lastLobbyBroadcast >= 400) {
      this.lastLobbyBroadcast = now
      this.broadcastRoom()
      this.broadcastRoster()
      return
    }
    if (this.lobbyBroadcastPending) return
    this.lobbyBroadcastPending = true
    this.ctx.waitUntil(
      new Promise<void>((resolve) => setTimeout(resolve, 400)).then(() => {
        this.lobbyBroadcastPending = false
        this.lastLobbyBroadcast = Date.now()
        this.broadcastRoom()
        this.broadcastRoster()
      }),
    )
  }

  private async handleAnswer(ws: WebSocket, info: SocketInfo, round: number, bin: BinId) {
    const accepted = this.recordAnswer(info.uid, round, bin, Date.now())
    this.send(ws, { t: 'answerAck', round, accepted, bin })
    if (!accepted) return

    // กระจายจำนวนคนตอบไม่เกินวินาทีละครั้ง — ที่ 250 คนถ้ายิงทุกคำตอบจะเป็น 250 broadcast ต่อข้อ
    const now = Date.now()
    if (now - this.lastCountBroadcast >= 1000) {
      this.lastCountBroadcast = now
      this.broadcastRoom()
    }
  }

  /** คืน true เมื่อบันทึกคำตอบจริง — เป็นจุดเดียวที่ตัดสินว่าทันเวลาหรือไม่ */
  private recordAnswer(uid: string, round: number, bin: BinId, at: number): boolean {
    if (!BIN_IDS.includes(bin)) return false
    if (this.meta.phase !== 'answering' || round !== this.meta.roundIndex) return false
    if (!this.getPlayer(uid)) return false

    const roundDoc = this.getRound(round)
    if (!roundDoc) return false
    const elapsed = at - roundDoc.startedAt
    if (elapsed < 0 || elapsed > LIVE_CONFIG.answerMs + LIVE_CONFIG.graceMs) return false

    // INSERT ธรรมดา ถ้ามีแถวอยู่แล้วจะโยน constraint error = ตอบซ้ำไม่ได้
    try {
      this.ctx.storage.sql.exec(
        'INSERT INTO answers (round, uid, bin, at) VALUES (?, ?, ?, ?)',
        round,
        uid,
        bin,
        at,
      )
    } catch {
      return false
    }
    return true
  }

  // ---------- คำสั่งของสตาฟ ----------

  private async startGame() {
    if (this.meta.status !== 'lobby') return
    if (this.countPlayers() === 0) return
    this.meta.status = 'running'
    this.meta.roundIndex = 0
    await this.setPhase('countdown', Date.now())
    this.broadcastAll()
  }

  private async skipPhase() {
    if (this.meta.status !== 'running') return
    this.meta.paused = false
    this.meta.pausedAt = null
    await this.advancePhase(Date.now())
    this.broadcastAll()
  }

  private async togglePause() {
    const now = Date.now()
    if (this.meta.paused && this.meta.pausedAt !== null) {
      const pausedMs = now - this.meta.pausedAt
      this.meta.phaseEndsAt += pausedMs
      // ถ้าพักตอนกำลังตอบ ต้องเลื่อน startedAt ของข้อด้วย ไม่งั้นคำตอบหลังเล่นต่อ
      // จะถูกนับว่า "ช้าเกิน 10 วิ" ทั้งที่วงแหวนยังมีเวลาเหลือ — กดถังแล้วเงียบ
      if (this.meta.phase === 'answering') {
        const rd = this.getRound(this.meta.roundIndex)
        if (rd) {
          rd.startedAt += pausedMs
          this.ctx.storage.sql.exec(
            'INSERT OR REPLACE INTO rounds (round, payload) VALUES (?, ?)',
            this.meta.roundIndex,
            JSON.stringify(rd),
          )
        }
      }
      this.meta.paused = false
      this.meta.pausedAt = null
      await this.ctx.storage.setAlarm(this.meta.phaseEndsAt)
    } else {
      this.meta.paused = true
      this.meta.pausedAt = now
      await this.ctx.storage.deleteAlarm()
    }
    await this.saveMeta()
    this.broadcastAll()
  }

  private async addBots(count: number) {
    if (this.meta.status !== 'lobby') return
    const names = [
      'พี่ก้อย', 'น้องปอนด์', 'พี่เอ', 'ครูหนึ่ง', 'พี่ตั้ม', 'น้องมิ้นท์',
      'พี่หน่อย', 'พี่โบว์', 'น้องเจ', 'พี่นัท', 'พี่แดง', 'น้องแพร',
    ]
    const bases = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮']
    const colors = ['#ffd6a5', '#caffbf', '#9bf6ff', '#bdb2ff', '#ffc6ff', '#fdffb6']
    const rings = ['', 'solid', 'double', 'dashed', 'dotted', 'glow']
    const badges = ['', '🌱', '♻️', '🍃', '💧', '☀️', '⚡', '🌍', '🌳', '🚲']

    const existing = this.ctx.storage.sql
      .exec<{ n: number }>('SELECT COUNT(*) AS n FROM players WHERE bot = 1')
      .one().n

    const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

    for (let i = 0; i < Math.min(count, 50); i++) {
      const n = existing + i
      const look: AvatarLook = {
        base: pick(bases),
        color: pick(colors),
        ring: pick(rings),
        badge: pick(badges),
      }
      this.ctx.storage.sql.exec(
        'INSERT OR IGNORE INTO players (uid, name, look, team, bot, joinedAt) VALUES (?, ?, ?, ?, 1, ?)',
        `bot-${n}`,
        `${names[n % names.length]} (ซ้อม)`,
        JSON.stringify(look),
        '',
        Date.now(),
      )
    }
    this.broadcastAll()
  }

  // ---------- นาฬิกาของเกม ----------

  override async alarm() {
    if (this.meta.paused) return
    await this.advancePhase(Date.now())
    this.broadcastAll()
  }

  private async setPhase(phase: Phase, now: number) {
    this.meta.phase = phase
    this.meta.phaseStartedAt = now
    const duration = (PHASE_DURATION as Record<string, number | undefined>)[phase]
    this.meta.phaseEndsAt = duration ? now + duration : 0
    await this.saveMeta()
    if (this.meta.phaseEndsAt) await this.ctx.storage.setAlarm(this.meta.phaseEndsAt)
    else await this.ctx.storage.deleteAlarm()
  }

  private async advancePhase(now: number) {
    switch (this.meta.phase) {
      case 'countdown':
        await this.openRound(this.meta.roundIndex, now)
        break
      case 'answering':
        this.closeRound()
        await this.setPhase('reveal', now)
        break
      case 'reveal':
        await this.setPhase('explain', now)
        break
      case 'explain':
        await this.setPhase('board', now)
        break
      case 'board':
        if (this.meta.roundIndex + 1 < this.meta.questionIds.length) {
          this.meta.roundIndex += 1
          await this.setPhase('countdown', now)
        } else {
          this.meta.finaleStep = 0
          await this.setPhase('finale', now)
        }
        break
      case 'finale':
        await this.advanceFinale(now)
        break
      default:
        break
    }
  }

  private async advanceFinale(now: number) {
    const total = Math.min(LIVE_CONFIG.boardSize, this.countPlayers())
    if (this.meta.finaleStep >= total) {
      this.meta.phase = 'ended'
      this.meta.status = 'finished'
      this.meta.phaseStartedAt = now
      this.meta.phaseEndsAt = 0
      await this.saveMeta()
      await this.ctx.storage.deleteAlarm()
      this.broadcastAll()
      return
    }
    this.meta.finaleStep += 1
    this.meta.phaseStartedAt = now
    this.meta.phaseEndsAt = now + LIVE_CONFIG.finaleStepMs
    await this.saveMeta()
    await this.ctx.storage.setAlarm(this.meta.phaseEndsAt)
    this.broadcastAll()
  }

  private async openRound(index: number, now: number) {
    const question = getQuestion(this.meta.questionIds[index])
    this.meta.roundIndex = index
    this.lastCountBroadcast = 0

    const round: PublicRound = {
      index,
      questionId: question.id,
      itemName: question.name,
      itemImage: question.image,
      itemEmoji: question.emoji,
      startedAt: now,
    }
    this.ctx.storage.sql.exec(
      'INSERT OR REPLACE INTO rounds (round, payload) VALUES (?, ?)',
      index,
      JSON.stringify(round),
    )

    this.scheduleBots(index, question.bin, now)
    await this.setPhase('answering', now)
  }

  /**
   * ผู้เล่นจำลองสำหรับซ้อม — เขียนคำตอบล่วงหน้าพร้อมเวลาที่กระจายทั่วช่วง 10 วินาที
   * ตัวนับ "ตอบแล้วกี่คน" นับเฉพาะคำตอบที่ถึงเวลาแล้ว จึงยังไต่ขึ้นเหมือนคนจริงตอบ
   */
  private scheduleBots(round: number, correctBin: BinId, startedAt: number) {
    const bots = this.ctx.storage.sql
      .exec<{ uid: string }>('SELECT uid FROM players WHERE bot = 1')
      .toArray()

    for (const bot of bots) {
      const wrong = BIN_IDS.filter((b) => b !== correctBin)
      const bin =
        Math.random() < 0.7 ? correctBin : wrong[Math.floor(Math.random() * wrong.length)]
      const at = startedAt + 900 + Math.random() * (LIVE_CONFIG.answerMs - 1500)
      this.ctx.storage.sql.exec(
        'INSERT OR IGNORE INTO answers (round, uid, bin, at) VALUES (?, ?, ?, ?)',
        round,
        bot.uid,
        bin,
        Math.round(at),
      )
    }
  }

  /** ปิดข้อ: คิดคะแนนทุกคน เขียนเฉลย — ทั้งหมดอยู่ในหน่วยความจำของ DO ไม่มีการอ่านข้ามเครื่อง */
  private closeRound() {
    const round = this.meta.roundIndex
    const question = getQuestion(this.meta.questionIds[round])
    const roundDoc = this.getRound(round)
    if (!roundDoc) return

    const deadline = roundDoc.startedAt + LIVE_CONFIG.answerMs + LIVE_CONFIG.graceMs
    const answers = new Map(
      this.ctx.storage.sql
        .exec<{ uid: string; bin: string; at: number }>(
          'SELECT uid, bin, at FROM answers WHERE round = ?',
          round,
        )
        .toArray()
        .map((r) => [r.uid, r]),
    )

    const distribution = emptyDistribution()
    const roundResults: Record<string, RoundResult> = {}
    let answeredCount = 0

    for (const player of this.listPlayers()) {
      const answer = answers.get(player.uid)
      const elapsed = answer ? answer.at - roundDoc.startedAt : Infinity
      const inTime = !!answer && answer.at <= deadline && elapsed >= 0

      if (inTime && answer) {
        answeredCount++
        distribution[answer.bin as BinId]++
      }

      const correct = inTime && answer?.bin === question.bin
      const streak = correct ? player.streak + 1 : 0
      const gain = correct ? roundScore(elapsed, streak) : 0

      this.ctx.storage.sql.exec(
        `UPDATE players SET score = score + ?, correct = correct + ?, totalMs = totalMs + ?,
         streak = ?, lastGain = ?, lastCorrect = ?, lastBin = ? WHERE uid = ?`,
        gain,
        correct ? 1 : 0,
        inTime ? Math.round(elapsed) : LIVE_CONFIG.answerMs,
        streak,
        gain,
        inTime ? (correct ? 1 : 0) : null,
        inTime && answer ? answer.bin : null,
        player.uid,
      )

      roundResults[player.uid] = {
        bin: inTime && answer ? (answer.bin as BinId) : null,
        correct,
      }
    }

    this.ctx.storage.sql.exec(
      'INSERT OR REPLACE INTO roundResults (round, payload) VALUES (?, ?)',
      round,
      JSON.stringify(roundResults),
    )

    const reveal: RevealInfo = {
      index: round,
      correctBin: question.bin,
      explanation: question.explanation,
      source: question.source,
      checkLocal: question.checkLocal === true,
      distribution,
      answeredCount,
    }
    this.ctx.storage.sql.exec(
      'INSERT OR REPLACE INTO reveals (round, payload) VALUES (?, ?)',
      round,
      JSON.stringify(reveal),
    )
  }

  // ---------- อ่านข้อมูล ----------

  private countPlayers(): number {
    return this.ctx.storage.sql
      .exec<{ n: number }>('SELECT COUNT(*) AS n FROM players')
      .one().n
  }

  private getPlayer(uid: string): PlayerState | null {
    const rows = this.ctx.storage.sql
      .exec('SELECT * FROM players WHERE uid = ?', uid)
      .toArray()
    if (rows.length === 0) return null
    return this.rowToPlayer(rows[0] as Record<string, unknown>, this.rankOf(uid))
  }

  private rankOf(uid: string): number {
    const row = this.ctx.storage.sql
      .exec<{ rank: number }>(
        `SELECT COUNT(*) + 1 AS rank FROM players p
         WHERE p.score > (SELECT score FROM players WHERE uid = ?1)
            OR (p.score = (SELECT score FROM players WHERE uid = ?1)
                AND p.totalMs < (SELECT totalMs FROM players WHERE uid = ?1))`,
        uid,
      )
      .toArray()
    return row[0]?.rank ?? 0
  }

  private listPlayers(): PlayerState[] {
    const rows = this.ctx.storage.sql
      .exec('SELECT * FROM players ORDER BY score DESC, totalMs ASC, name ASC')
      .toArray()
    return rows.map((r, i) => this.rowToPlayer(r as Record<string, unknown>, i + 1))
  }

  private rowToPlayer(row: Record<string, unknown>, rank: number): PlayerState {
    let look: AvatarLook
    try {
      look = JSON.parse(String(row.look)) as AvatarLook
    } catch {
      look = { base: '🐨', color: '#ffd6a5', ring: '', badge: '' }
    }
    return {
      uid: String(row.uid),
      name: String(row.name),
      look,
      team: String(row.team),
      score: Number(row.score),
      correct: Number(row.correct),
      totalMs: Number(row.totalMs),
      streak: Number(row.streak),
      rank,
      lastGain: Number(row.lastGain),
      lastCorrect: row.lastCorrect === null ? null : Number(row.lastCorrect) === 1,
      lastBin: (row.lastBin as BinId | null) ?? null,
      bot: Number(row.bot) === 1,
    }
  }

  private getRound(index: number): PublicRound | null {
    const rows = this.ctx.storage.sql
      .exec<{ payload: string }>('SELECT payload FROM rounds WHERE round = ?', index)
      .toArray()
    return rows[0] ? (JSON.parse(rows[0].payload) as PublicRound) : null
  }

  private getReveal(index: number): RevealInfo | null {
    const rows = this.ctx.storage.sql
      .exec<{ payload: string }>('SELECT payload FROM reveals WHERE round = ?', index)
      .toArray()
    return rows[0] ? (JSON.parse(rows[0].payload) as RevealInfo) : null
  }

  private answeredSoFar(): number {
    if (this.meta.phase !== 'answering') return 0
    return this.ctx.storage.sql
      .exec<{ n: number }>(
        'SELECT COUNT(*) AS n FROM answers WHERE round = ? AND at <= ?',
        this.meta.roundIndex,
        Date.now(),
      )
      .one().n
  }

  private buildBoard(): BoardEntry[] {
    return this.listPlayers()
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

  private buildTeamBoard(): TeamEntry[] {
    return this.ctx.storage.sql
      .exec<{ team: string; total: number; members: number }>(
        'SELECT team, SUM(score) AS total, COUNT(*) AS members FROM players GROUP BY team',
      )
      .toArray()
      .map((r) => ({
        team: r.team,
        avgScore: Math.round(r.total / Math.max(r.members, 1)),
        members: r.members,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
  }

  private buildHistory(): RoundHistory[] {
    if (this.meta.phase !== 'ended') return []
    const out: RoundHistory[] = []
    for (let i = 0; i < this.meta.questionIds.length; i++) {
      const round = this.getRound(i)
      const reveal = this.getReveal(i)
      if (round && reveal) out.push({ round, reveal })
    }
    return out
  }

  private buildPublicRoom(): PublicRoom {
    const showReveal =
      this.meta.phase === 'reveal' || this.meta.phase === 'explain' || this.meta.phase === 'board'

    return {
      pin: this.meta.pin,
      status: this.meta.status,
      phase: this.meta.phase,
      phaseStartedAt: this.meta.phaseStartedAt,
      phaseEndsAt: this.meta.phaseEndsAt,
      paused: this.meta.paused,
      roundIndex: this.meta.roundIndex,
      totalRounds: this.meta.questionIds.length,
      // โจทย์ (ชื่อ/รูป ไม่มีคำเฉลย) ส่งได้ตั้งแต่ข้อเริ่มจนจบข้อ — หน้าเฉลย/อธิบายยังต้องใช้ชื่อไอเท็ม
      // กันเฉพาะช่วง countdown ที่ยังไม่ควรให้เห็นข้อถัดไปล่วงหน้า
      round:
        this.meta.phase === 'answering' ||
        this.meta.phase === 'reveal' ||
        this.meta.phase === 'explain' ||
        this.meta.phase === 'board'
          ? this.getRound(this.meta.roundIndex)
          : null,
      // เฉลยส่งออกไปหลังหมดเวลาแล้วเท่านั้น
      reveal: showReveal ? this.getReveal(this.meta.roundIndex) : null,
      board: this.meta.status === 'lobby' ? [] : this.buildBoard(),
      teamBoard: this.meta.status === 'lobby' ? [] : this.buildTeamBoard(),
      finaleStep: this.meta.finaleStep,
      playerCount: this.countPlayers(),
      answeredCount: this.answeredSoFar(),
      history: this.buildHistory(),
      serverNow: Date.now(),
    }
  }

  /** ผลรายข้อทุกข้อที่จบไปแล้ว — แต่ละข้อเป็นก้อนเดียว (uid → ผล) */
  private roundResultBlobs(): { round: number; map: Record<string, RoundResult> }[] {
    return this.ctx.storage.sql
      .exec<{ round: number; payload: string }>('SELECT round, payload FROM roundResults')
      .toArray()
      .map((r) => ({ round: r.round, map: JSON.parse(r.payload) as Record<string, RoundResult> }))
  }

  private getResults(uid: string): Record<number, RoundResult> {
    const out: Record<number, RoundResult> = {}
    for (const { round, map } of this.roundResultBlobs()) {
      const hit = map[uid]
      if (hit) out[round] = hit
    }
    return out
  }

  /** ลบผลของคนที่กดออกจากห้อง เพื่อไม่ให้ผลเก่าค้างถ้ากลับเข้ามาใหม่ */
  private forgetResults(uid: string) {
    for (const { round, map } of this.roundResultBlobs()) {
      if (!(uid in map)) continue
      delete map[uid]
      this.ctx.storage.sql.exec(
        'INSERT OR REPLACE INTO roundResults (round, payload) VALUES (?, ?)',
        round,
        JSON.stringify(map),
      )
    }
  }

  // ---------- ส่งข้อมูล ----------

  private send(ws: WebSocket, msg: ServerMessage) {
    try {
      ws.send(JSON.stringify(msg))
    } catch {
      // socket ปิดไปแล้ว
    }
  }

  private sendRoom(ws: WebSocket) {
    this.send(ws, { t: 'room', room: this.buildPublicRoom() })
  }

  private sendMe(ws: WebSocket, uid: string) {
    this.send(ws, { t: 'me', me: this.getPlayer(uid), results: this.getResults(uid) })
  }

  private sendRoster(ws: WebSocket) {
    this.send(ws, { t: 'roster', players: this.listPlayers() })
  }

  /** สร้าง JSON ก้อนเดียวแล้วส่งให้ทุกคน — ที่ 250 คนต้องไม่ serialize ซ้ำ 250 รอบ */
  private broadcastRoom() {
    const payload = JSON.stringify({ t: 'room', room: this.buildPublicRoom() })
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(payload)
      } catch {
        // socket ปิดไปแล้ว
      }
    }
  }

  private broadcastRoster() {
    const sockets = this.ctx.getWebSockets()
    const hostSockets = sockets.filter(
      (ws) => (ws.deserializeAttachment() as SocketInfo | null)?.isHost,
    )
    if (hostSockets.length === 0) return
    const payload = JSON.stringify({ t: 'roster', players: this.listPlayers() })
    for (const ws of hostSockets) {
      try {
        ws.send(payload)
      } catch {
        // socket ปิดไปแล้ว
      }
    }
  }

  /** ส่งครบทุกอย่าง — ใช้ตอนเปลี่ยนเฟส ซึ่งคะแนนของทุกคนอาจเปลี่ยนพร้อมกัน */
  private broadcastAll() {
    this.broadcastRoom()
    this.broadcastRoster()

    // จัดอันดับครั้งเดียวแล้วแจกให้ทุก socket — แทนการ query rank ทีละคน 250 รอบต่อการเปลี่ยนเฟส
    const byUid = new Map(this.listPlayers().map((p) => [p.uid, p]))
    const resultsByUid = this.allResults()
    for (const ws of this.ctx.getWebSockets()) {
      const info = ws.deserializeAttachment() as SocketInfo | null
      if (!info) continue
      this.send(ws, {
        t: 'me',
        me: byUid.get(info.uid) ?? null,
        results: resultsByUid.get(info.uid) ?? {},
      })
    }
  }

  /** ผลรายข้อของทุกคนในครั้งเดียว — uid → { รอบ: ผล } */
  private allResults(): Map<string, Record<number, RoundResult>> {
    const out = new Map<string, Record<number, RoundResult>>()
    for (const { round, map } of this.roundResultBlobs()) {
      for (const uid of Object.keys(map)) {
        const rec = out.get(uid) ?? {}
        rec[round] = map[uid]
        out.set(uid, rec)
      }
    }
    return out
  }
}
