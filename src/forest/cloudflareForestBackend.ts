import { lookFromSeed } from '../game/avatar'
import type { AvatarLook } from '../game/types'
import type { ForestBackend, ForestProfile } from './backend'
import { growthFromPoints, orgGrowthFromPoints } from './config'
import type {
  ActivityId,
  ForestMember,
  ForestSnapshot,
  ForestUser,
  LeaderboardEntry,
  LeaderboardSnapshot,
  LogEntry,
  LogResult,
  OrgSnapshot,
  TeamStanding,
} from './types'

/**
 * หลังบ้านจริงของแคมเปญป่า 3R — คุยกับ Worker + D1 ผ่าน REST
 *
 * ตั้ง endpoint ที่ .env:  VITE_FOREST_API=https://kpigreenoffice-live.<subdomain>.workers.dev
 * (ปกติเป็น URL เดียวกับ VITE_LIVE_API เพราะอยู่บน Worker ตัวเดียวกัน)
 *
 * ตัวตน: เก็บ "โทเคนที่เซิร์ฟเวอร์เซ็น" ไว้ใน localStorage ไม่เก็บรหัสผ่าน
 * ทุก mutation เซิร์ฟเวอร์อ่าน uid จากโทเคนเอง — ค่า uid ที่หน้าจอส่งมาถือเป็นแค่ใบ้ ไม่เชื่อ
 *
 * เรียลไทม์: poll ทุก POLL_MS + สั่งดึงทันทีหลัง action ของตัวเอง (pokePolls) จังหวะแคมเปญนี้ไม่ต้องสดระดับวินาที
 */

const API_BASE = (import.meta.env.VITE_FOREST_API as string | undefined)?.replace(/\/$/, '') ?? ''

const NS = 'kpi-forest'
const TOKEN_KEY = `${NS}:token`
const USER_KEY = `${NS}:user`
// 8 วิ — พอให้เห็นแต้มของคนอื่นในสำนักไหลเข้ามาเกือบสด โดยที่ /api/forest/me (คิวรีสวน+ยอดรวม)
// ยังไม่หนักเกินสำหรับ D1 แม้ทั้งหน่วยงานเปิดหน้าค้างพร้อมกัน · action ของตัวเองรีเฟรชทันทีอยู่แล้ว (pokePolls)
const POLL_MS = 8_000

// ---------- storage ----------

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function readUser(): ForestUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as ForestUser) : null
  } catch {
    return null
  }
}

const authListeners = new Set<(u: ForestUser | null) => void>()

function setSession(token: string | null, user: ForestUser | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  } catch {
    // localStorage ใช้ไม่ได้ (โหมดส่วนตัว) — ตัวตนจะอยู่แค่รอบนี้
  }
  for (const cb of authListeners) cb(user)
}

// ---------- fetch ----------

async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<{ ok: boolean; status: number; data: T }> {
  const headers: Record<string, string> = {}
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.auth) {
    const token = readToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
  } catch {
    return { ok: false, status: 0, data: {} as T }
  }
  // โทเคนหมดอายุ/ถูกเพิกถอน — ล้าง session ให้หน้าจอเด้งกลับไปหน้าเข้าระบบ
  if (res.status === 401 && opts.auth && readToken()) setSession(null, null)
  let data: T
  try {
    data = (await res.json()) as T
  } catch {
    data = {} as T
  }
  return { ok: res.ok, status: res.status, data }
}

// ---------- mapping ----------

interface WireMember {
  uid: string
  name: string
  look: AvatarLook | null
  team: string
  points: number
  updatedAt: number
}

const toMember = (m: WireMember): ForestMember => ({
  uid: m.uid,
  name: m.name,
  look: m.look ?? lookFromSeed(m.uid),
  team: m.team,
  points: m.points,
  growth: growthFromPoints(m.points),
  updatedAt: m.updatedAt,
})

interface WireSnapshot {
  me: WireMember | null
  log: Omit<LogEntry, never>[]
  todayPoints: number
  todayDone: string[]
  garden: WireMember[]
  teamCount: number
  officeCount: number
  officePoints: number
}

function toSnapshot(w: WireSnapshot): ForestSnapshot {
  return {
    me: w.me ? toMember(w.me) : null,
    log: (w.log ?? []) as LogEntry[],
    todayPoints: w.todayPoints ?? 0,
    todayDone: (w.todayDone ?? []) as ActivityId[],
    garden: (w.garden ?? []).map(toMember),
    teamCount: w.teamCount ?? 0,
    officeCount: w.officeCount ?? 0,
    officePoints: w.officePoints ?? 0,
  }
}

interface WireOrg {
  memberCount: number
  totalPoints: number
  trees: { seed: string; points: number }[]
}

function toOrg(w: WireOrg): OrgSnapshot {
  const totalPoints = w.totalPoints ?? 0
  return {
    memberCount: w.memberCount ?? 0,
    totalPoints,
    growth: orgGrowthFromPoints(totalPoints),
    trees: (w.trees ?? []).map((t) => ({ seed: t.seed, growth: growthFromPoints(t.points) })),
  }
}

interface WireLeaderboardEntry {
  uid: string
  name: string
  team: string
  points: number
  rank: number
  look: AvatarLook | null
  badges: string[]
}

interface WireLeaderboard {
  top: WireLeaderboardEntry[]
  me: WireLeaderboardEntry | null
  teams: TeamStanding[]
}

const toLeaderboardEntry = (e: WireLeaderboardEntry): LeaderboardEntry => ({
  uid: e.uid,
  name: e.name,
  team: e.team,
  points: e.points,
  rank: e.rank,
  look: e.look ?? lookFromSeed(e.uid),
  badges: (e.badges ?? []) as LeaderboardEntry['badges'],
})

function toLeaderboard(w: WireLeaderboard): LeaderboardSnapshot {
  return {
    top: (w.top ?? []).map(toLeaderboardEntry),
    me: w.me ? toLeaderboardEntry(w.me) : null,
    teams: w.teams ?? [],
  }
}

// ---------- polling ----------

/** tick ของ poll ที่ยัง subscribe อยู่ — mutation เรียกให้ดึงข้อมูลใหม่ทันที ไม่ต้องรอครบ POLL_MS */
const activePolls = new Set<() => void>()

/** เรียกหลัง mutation สำเร็จ — สวน/ต้น/แต้ม อัปเดตทันทีโดยไม่ต้องรีเฟรชหน้า */
function pokePolls() {
  for (const tick of activePolls) void tick()
}

function poll<T>(fetcher: () => Promise<T | null>, cb: (v: T) => void): () => void {
  let stopped = false
  const tick = async () => {
    const v = await fetcher()
    if (!stopped && v) cb(v)
  }
  void tick()
  const timer = setInterval(tick, POLL_MS)
  activePolls.add(tick)
  return () => {
    stopped = true
    clearInterval(timer)
    activePolls.delete(tick)
  }
}

// ---------- adapter ----------

export const cloudflareForestBackend: ForestBackend = {
  id: 'cloudflare',
  isMock: false,

  now: () => Date.now(),

  currentUser: readUser,

  async signIn(username, password) {
    const { ok, data } = await api<{ token?: string; user?: ForestUser; error?: string }>(
      '/api/forest/login',
      { method: 'POST', body: { username: username.trim(), password } },
    )
    if (!ok || !data.token || !data.user) {
      return { ok: false, reason: data.error ?? 'เข้าสู่ระบบไม่สำเร็จ' }
    }
    setSession(data.token, data.user)
    return { ok: true, user: data.user }
  },

  signOut() {
    setSession(null, null)
  },

  async changePassword(newPassword) {
    const { ok, data } = await api<{ ok?: boolean; reason?: string }>('/api/forest/password', {
      method: 'POST',
      auth: true,
      body: { newPassword },
    })
    if (!ok || !data.ok) {
      return { ok: false, reason: data.reason ?? 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ' }
    }
    const user = readUser()
    if (user) setSession(readToken(), { ...user, mustChangePassword: false })
    return { ok: true }
  },

  onAuthChanged(cb) {
    authListeners.add(cb)
    cb(readUser())
    // ยืนยันโทเคนกับเซิร์ฟเวอร์เงียบๆ — อัปเดตชื่อ/สำนัก/สิทธิ์ให้ตรง หรือล้างถ้าโทเคนตาย
    if (readToken()) {
      void api<{ user?: ForestUser }>('/api/forest/session', { auth: true }).then(({ ok, data }) => {
        if (ok && data.user) setSession(readToken(), data.user)
      })
    }
    return () => authListeners.delete(cb)
  },

  async saveProfile(_uid, profile: ForestProfile) {
    await api('/api/forest/profile', { method: 'POST', auth: true, body: { look: profile.look } })
    pokePolls()
  },

  async logActivity(_uid, activityId): Promise<LogResult> {
    const { ok, data } = await api<LogResult>('/api/forest/activity', {
      method: 'POST',
      auth: true,
      body: { activityId },
    })
    if (!ok) return { ok: false, reason: 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง' }
    if (data.ok) pokePolls()
    return data
  },

  async awardPoints(uid, points, note): Promise<LogResult> {
    const { ok, data } = await api<LogResult>('/api/forest/award', {
      method: 'POST',
      auth: true,
      body: { uid, points, note },
    })
    if (!ok) return { ok: false, reason: 'ให้แต้มไม่สำเร็จ' }
    if (data.ok) pokePolls()
    return data
  },

  subscribeOrg(cb) {
    return poll(async () => {
      const { ok, data } = await api<WireOrg>('/api/forest/org')
      return ok ? toOrg(data) : null
    }, cb)
  },

  subscribeLeaderboard(cb) {
    return poll(async () => {
      const { ok, data } = await api<WireLeaderboard>('/api/forest/leaderboard', { auth: true })
      return ok ? toLeaderboard(data) : null
    }, cb)
  },

  subscribeForest(_uid, cb) {
    return poll(async () => {
      const { ok, data } = await api<WireSnapshot>('/api/forest/me', { auth: true })
      return ok ? toSnapshot(data) : null
    }, cb)
  },

  async listMembers() {
    const { ok, data } = await api<{ members: WireMember[] }>('/api/forest/members', { auth: true })
    return ok ? (data.members ?? []).map(toMember) : []
  },

  async seedDemoMembers() {
    throw new Error('สร้างสมาชิกจำลองได้เฉพาะโหมดจำลอง')
  },
}
