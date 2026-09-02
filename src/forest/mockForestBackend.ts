import { FOREST, FOREST_BADGES } from '../content'
import { lookFromSeed } from '../game/avatar'
import type { AvatarLook } from '../game/types'
import type { ForestBackend, ForestProfile } from './backend'
import {
  DAILY_CAP,
  GARDEN_MAX,
  dayKey,
  growthFromPoints,
  orgGrowthFromPoints,
  treeSeed,
} from './config'
import type {
  ActivityId,
  BadgeId,
  ForestMember,
  ForestSnapshot,
  ForestUser,
  LeaderboardSnapshot,
  LogEntry,
  LogResult,
  OrgSnapshot,
} from './types'

/** เกณฑ์ปลดล็อกเหรียญตรา — คู่กับ worker/src/forest/badges.ts (โหมดจริงคำนวณเหมือนกันฝั่งเซิร์ฟเวอร์) */
const STREAK_BADGE_DAYS = FOREST_BADGES.map((b) => b.days)
const badgeIdForStreak = (days: number) => `streak-${days}` as BadgeId

/**
 * หลังบ้านจำลองของแคมเปญป่า 3R
 *
 * แยกคีย์ตามเจ้าของเหมือนที่จะทำจริงบนเซิร์ฟเวอร์:
 *   member:<uid>   ข้อมูลต้นของคนคนนั้น (เจ้าตัวเขียนได้เอง สตาฟเขียนแต้มให้ได้)
 *   log:<uid>      ประวัติแต้มของคนคนนั้น
 * โครงนี้ย้ายไป Durable Object / D1 ได้ตรงๆ โดยไม่ต้องรื้อหน้าจอ
 *
 * ข้อมูลอยู่ใน localStorage ของเครื่องที่เปิดเท่านั้น เปิดคนละเครื่องคือคนละป่า
 * ใช้ดูหน้าตาและลองกติกาได้ครบ แต่ใช้ในงานจริงไม่ได้
 */

const NS = 'kpi-forest'
/** เก็บประวัติเท่าที่หน้าจอใช้จริง ไม่ให้ localStorage บวมเมื่อบันทึกทุกวันหลายเดือน */
const LOG_LIMIT = 60

interface MemberDoc {
  uid: string
  name: string
  look: AvatarLook
  team: string
  points: number
  updatedAt: number
  /** สมาชิกจำลองสำหรับดูหน้าตาสวน (โหมดจำลองเท่านั้น) */
  demo?: boolean
  /** สถิติต่อเนื่อง — คู่กับ current_streak/longest_streak/last_active_day ฝั่งจริง */
  currentStreak?: number
  longestStreak?: number
  lastActiveDay?: string
  /** เหรียญตราที่ปลดล็อกแล้ว */
  badges?: BadgeId[]
}

// ---------- storage ----------

const memberPrefix = `${NS}:member:`
const memberKey = (uid: string) => `${memberPrefix}${uid}`
const logKey = (uid: string) => `${NS}:log:${uid}`

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

function allMemberDocs(): MemberDoc[] {
  const out: MemberDoc[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k?.startsWith(memberPrefix)) continue
      const doc = readJson<MemberDoc>(k)
      if (doc?.uid) out.push(doc)
    }
  } catch {
    // เข้าถึง localStorage ไม่ได้ — คืนลิสต์ว่าง หน้าจอขึ้นสวนเปล่าแทนที่จะพัง
  }
  return out
}

const readLog = (uid: string) => readJson<LogEntry[]>(logKey(uid)) ?? []

function appendLog(uid: string, entry: LogEntry) {
  writeJson(logKey(uid), [entry, ...readLog(uid)].slice(0, LOG_LIMIT))
}

const toMember = (doc: MemberDoc): ForestMember => ({
  uid: doc.uid,
  name: doc.name,
  look: doc.look,
  team: doc.team,
  points: doc.points,
  growth: growthFromPoints(doc.points),
  updatedAt: doc.updatedAt,
})

// ---------- ตัวตน (จำลอง) ----------

/**
 * เก็บใน localStorage ไม่ใช่ sessionStorage — ต่างจากเกมแข่งสดโดยตั้งใจ
 *
 * เกมแข่งสดเก็บแยกตามแท็บเพื่อให้เปิดหลายแท็บซ้อมเป็นคนละคนได้
 * แต่ต้นไม้เป็นของสะสมระยะยาว ปิดแท็บแล้วเปิดใหม่ต้องเจอต้นเดิม ไม่ใช่ต้องปลูกใหม่
 */
const AUTH_KEY = `${NS}:auth`
const authListeners = new Set<(u: ForestUser | null) => void>()

/**
 * บัญชีทดสอบสำหรับโหมดจำลอง — ของจริงมาจากรายชื่อในองค์กร (D1) ที่สร้างด้วย scripts/gen-users.mjs
 * รหัสคือ "รหัสพนักงาน" ตามที่ตกลงไว้ ในโหมดจำลองตั้งเลขสั้นๆ พอ
 */
const DEMO_USERS: (ForestUser & { password: string })[] = [
  { uid: 'u-demo1', username: 'demo1', password: '1111', name: 'สมชาย ใจดี (ตัวอย่าง)', nickname: 'ชาย', team: '(ตัวอย่าง) สำนักงานเลขาธิการ', role: 'member', mustChangePassword: true },
  { uid: 'u-demo2', username: 'demo2', password: '2222', name: 'สมหญิง รักษ์โลก (ตัวอย่าง)', nickname: 'หญิง', team: '(ตัวอย่าง) สำนักงานเลขาธิการ', role: 'member' },
  { uid: 'u-demo3', username: 'demo3', password: '3333', name: 'อนุชา ประหยัด (ตัวอย่าง)', nickname: 'ชา', team: '(ตัวอย่าง) สำนักวิจัยและพัฒนา', role: 'member' },
  { uid: 'u-staff', username: 'staff', password: 'staff', name: 'เจ้าหน้าที่ 3R (ตัวอย่าง)', nickname: 'สตาฟ', team: '(ตัวอย่าง) สำนักงานเลขาธิการ', role: 'staff' },
]

const stripPw = ({ password: _pw, ...u }: (typeof DEMO_USERS)[number]): ForestUser => u

function readAuth(): ForestUser | null {
  const user = readJson<ForestUser>(AUTH_KEY)
  return user?.uid ? user : null
}

/** หา demo user จาก uid — ใช้ดึงชื่อ/สำนักที่ตั้งไว้ในบัญชี ไม่ให้หน้าจอกรอกเอง */
const demoByUid = (uid: string) => DEMO_USERS.find((u) => u.uid === uid) ?? null

function writeAuth(user: ForestUser | null) {
  try {
    if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    else localStorage.removeItem(AUTH_KEY)
  } catch {
    // เข้าถึง localStorage ไม่ได้ — ตัวตนจะอยู่แค่รอบนี้ ไม่ถึงกับใช้งานไม่ได้
  }
  for (const cb of authListeners) cb(user)
}

// ---------- realtime (จำลองด้วย BroadcastChannel) ----------

const listeners = new Map<string, Set<(s: ForestSnapshot) => void>>()
/** คนที่ดูหน้าแรกอยู่ — ยังไม่ล็อกอินก็อยู่ในนี้ได้ ต้นองค์กรต้องโตให้เห็นสดๆ เหมือนกัน */
const orgListeners = new Set<(o: OrgSnapshot) => void>()
/**
 * คนที่เปิดหน้าอันดับคะแนนอยู่ — คีย์ด้วย uid เหมือน `listeners` เพราะ leaderboard ต้องรู้ว่า
 * "อันดับของฉัน" คือของใคร (ต่างจาก orgListeners ที่ไม่ผูกกับใครเพราะไม่มีชื่อคนติดไปด้วย)
 */
const leaderboardListeners = new Map<string, Set<(lb: LeaderboardSnapshot) => void>>()

/** จำนวนอันดับที่ส่งให้หน้าจอ — คู่กับ LEADERBOARD_TOP_N ฝั่งจริงใน worker/src/forest/badges.ts */
const LEADERBOARD_TOP_N = 10
let channel: BroadcastChannel | null = null
let storageBound = false

function bindStorage() {
  if (storageBound || typeof window === 'undefined') return
  storageBound = true
  // เผื่อเบราว์เซอร์ที่ไม่มี BroadcastChannel — storage event ยิงข้ามแท็บได้เหมือนกัน
  window.addEventListener('storage', (e) => {
    if (e.key?.startsWith(`${NS}:`)) emitAll()
  })
}

function ensureChannel() {
  bindStorage()
  if (channel || typeof BroadcastChannel === 'undefined') return
  channel = new BroadcastChannel(NS)
  channel.onmessage = () => emitAll()
}

/**
 * ส่งข้อมูลใหม่ให้ทุกคนที่กำลังดูอยู่ ไม่ใช่เฉพาะคนที่เพิ่งกด
 * เพราะสวนเป็นข้อมูลร่วม — คนอื่นได้แต้ม ต้นในสวนของเราก็ต้องสูงขึ้นตาม
 */
function emitAll() {
  for (const [uid, set] of listeners) {
    const snap = buildSnapshot(uid)
    for (const cb of set) cb(snap)
  }
  if (orgListeners.size) {
    const org = buildOrgSnapshot()
    for (const cb of orgListeners) cb(org)
  }
  for (const [uid, set] of leaderboardListeners) {
    const lb = buildLeaderboard(uid)
    for (const cb of set) cb(lb)
  }
}

function notify() {
  emitAll()
  ensureChannel()
  channel?.postMessage({ at: Date.now() })
}

// ---------- snapshot ----------

function buildSnapshot(uid: string): ForestSnapshot {
  const docs = allMemberDocs()
  const meDoc = docs.find((d) => d.uid === uid) ?? null
  const log = readLog(uid)

  const today = dayKey(Date.now())
  const todaySelf = log.filter((e) => e.source === 'self' && dayKey(e.at) === today)

  const teamDocs = meDoc ? docs.filter((d) => d.team === meDoc.team) : []
  // เรียงแต้มมากไปน้อย แต้มเท่ากันเรียงตามชื่อ — ตำแหน่งต้นในสวนจะได้ไม่สลับไปมาทุกครั้งที่วาดใหม่
  teamDocs.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'th'))

  return {
    me: meDoc ? toMember(meDoc) : null,
    log,
    todayPoints: todaySelf.reduce((sum, e) => sum + e.points, 0),
    todayDone: todaySelf.map((e) => e.activityId).filter((id): id is ActivityId => id !== null),
    garden: teamDocs.slice(0, GARDEN_MAX).map(toMember),
    teamCount: teamDocs.length,
    officeCount: docs.length,
    officePoints: docs.reduce((sum, d) => sum + d.points, 0),
  }
}

/** ยอดรวมทั้งหน่วยงาน — ไม่มีรายชื่อ เพราะคนที่ยังไม่ล็อกอินก็เห็นก้อนนี้ */
function buildOrgSnapshot(): OrgSnapshot {
  const docs = allMemberDocs()
  const totalPoints = docs.reduce((sum, d) => sum + d.points, 0)
  return {
    memberCount: docs.length,
    totalPoints,
    growth: orgGrowthFromPoints(totalPoints),
    trees: docs.slice(0, GARDEN_MAX).map((d) => ({
      seed: treeSeed(d.uid),
      growth: growthFromPoints(d.points),
    })),
  }
}

/** อันดับคะแนน — เหมือน buildOrgSnapshot แต่มีชื่อคนติดไปด้วย จึงต้องรู้ว่าใครกำลังดูอยู่ (uid) เพื่อหา "อันดับของฉัน" */
function buildLeaderboard(uid: string): LeaderboardSnapshot {
  const docs = [...allMemberDocs()].sort(
    (a, b) => b.points - a.points || a.name.localeCompare(b.name, 'th'),
  )

  const ranked = docs.map((d, i) => ({
    uid: d.uid,
    name: d.name,
    team: d.team,
    points: d.points,
    rank: i + 1,
    look: d.look,
    badges: d.badges ?? [],
  }))

  const teamAgg = new Map<string, { count: number; total: number }>()
  for (const d of docs) {
    const t = teamAgg.get(d.team) ?? { count: 0, total: 0 }
    t.count += 1
    t.total += d.points
    teamAgg.set(d.team, t)
  }
  const teams = [...teamAgg.entries()]
    .map(([team, v]) => ({
      team,
      memberCount: v.count,
      totalPoints: v.total,
      avgPoints: v.count ? v.total / v.count : 0,
    }))
    .sort((a, b) => b.avgPoints - a.avgPoints)

  return {
    top: ranked.slice(0, LEADERBOARD_TOP_N),
    me: ranked.find((r) => r.uid === uid) ?? null,
    teams,
  }
}

const entryId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

// ---------- adapter ----------

export const mockForestBackend: ForestBackend = {
  id: 'mock',
  isMock: true,

  now: () => Date.now(),

  currentUser: readAuth,

  async signIn(username, password) {
    const u = username.trim().toLowerCase()
    const match = DEMO_USERS.find((d) => d.username === u && d.password === password)
    if (!match) return { ok: false, reason: 'ชื่อผู้ใช้หรือรหัสไม่ถูกต้อง' }
    const user = stripPw(match)
    writeAuth(user)
    return { ok: true, user }
  },

  signOut() {
    writeAuth(null)
  },

  async changePassword(newPassword) {
    const pw = newPassword.trim()
    if (pw.length < 6) return { ok: false, reason: 'รหัสผ่านต้องยาวอย่างน้อย 6 ตัว' }
    const current = readAuth()
    if (!current) return { ok: false, reason: 'ต้องเข้าสู่ระบบก่อน' }
    // โหมดจำลอง: อัปเดตรหัสในหน่วยความจำ (รีเซ็ตเมื่อรีโหลด) แล้วปลดธงบังคับเปลี่ยน
    const match = DEMO_USERS.find((d) => d.uid === current.uid)
    if (match && pw === match.password) return { ok: false, reason: 'ตั้งรหัสใหม่ที่ไม่ซ้ำรหัสเดิม' }
    if (match) {
      match.password = pw
      match.mustChangePassword = false
    }
    writeAuth({ ...current, mustChangePassword: false })
    return { ok: true }
  },

  onAuthChanged(cb) {
    authListeners.add(cb)
    cb(readAuth())
    return () => authListeners.delete(cb)
  },

  async saveProfile(uid, profile: ForestProfile) {
    const existing = readJson<MemberDoc>(memberKey(uid))
    // ชื่อกับสำนักมาจากบัญชี ไม่ให้หน้าจอกรอก — ผู้ใช้ตั้งได้แค่ตัวละคร (look)
    const account = demoByUid(uid)
    writeJson(memberKey(uid), {
      uid,
      name: account?.nickname || account?.name || existing?.name || 'ผู้ใช้',
      look: profile.look,
      team: account?.team ?? existing?.team ?? '',
      points: existing?.points ?? 0,
      updatedAt: Date.now(),
    } satisfies MemberDoc)
    notify()
  },

  async logActivity(uid, activityId: ActivityId): Promise<LogResult> {
    const doc = readJson<MemberDoc>(memberKey(uid))
    if (!doc) return { ok: false, reason: 'ยังไม่ได้ลงทะเบียนต้นไม้' }

    const activity = FOREST.activities.find((a) => a.id === activityId)
    if (!activity) return { ok: false, reason: 'ไม่มีกิจกรรมนี้' }

    const now = Date.now()
    const today = dayKey(now)
    const todaySelf = readLog(uid).filter((e) => e.source === 'self' && dayKey(e.at) === today)

    if (todaySelf.some((e) => e.activityId === activityId)) {
      return { ok: false, reason: 'ข้อนี้บันทึกไปแล้ววันนี้ พรุ่งนี้บันทึกได้อีก' }
    }

    const used = todaySelf.reduce((sum, e) => sum + e.points, 0)
    const remaining = DAILY_CAP - used
    if (remaining <= 0) {
      return { ok: false, reason: `วันนี้ครบเพดาน ${DAILY_CAP} แต้มแล้ว พรุ่งนี้เริ่มใหม่` }
    }

    // ชนเพดานกลางคัน ให้แต้มเท่าที่เหลือแทนการปฏิเสธ — คนที่ทำจริงแล้วไม่ควรได้ศูนย์
    const gained = Math.min(activity.points, remaining)

    // สถิติต่อเนื่อง — นับเฉพาะวันแรกที่กลับมาทำ ไม่ใช่ทุกครั้งที่กดในวันเดียวกัน
    const isNewActiveDay = doc.lastActiveDay !== today
    let currentStreak = doc.currentStreak ?? 0
    let longestStreak = doc.longestStreak ?? 0
    let earnedBadges: BadgeId[] = []
    if (isNewActiveDay) {
      const yesterday = dayKey(now - 24 * 60 * 60 * 1000)
      currentStreak = doc.lastActiveDay === yesterday ? currentStreak + 1 : 1
      longestStreak = Math.max(longestStreak, currentStreak)
      earnedBadges = STREAK_BADGE_DAYS.filter((d) => d === currentStreak).map(badgeIdForStreak)
    }
    const badges = [...new Set([...(doc.badges ?? []), ...earnedBadges])]

    appendLog(uid, { id: entryId(), activityId, points: gained, at: now, source: 'self' })
    writeJson(memberKey(uid), {
      ...doc,
      points: doc.points + gained,
      updatedAt: now,
      currentStreak,
      longestStreak,
      lastActiveDay: isNewActiveDay ? today : doc.lastActiveDay,
      badges,
    })
    notify()
    return { ok: true, gained, streak: currentStreak, earnedBadges }
  },

  async awardPoints(uid, points, note): Promise<LogResult> {
    const doc = readJson<MemberDoc>(memberKey(uid))
    if (!doc) return { ok: false, reason: 'ยังไม่ได้ลงทะเบียนต้นไม้' }
    const gained = Math.round(Math.max(1, Math.min(200, points)))
    const now = Date.now()

    appendLog(uid, {
      id: entryId(),
      activityId: null,
      points: gained,
      at: now,
      source: 'staff',
      note,
    })
    writeJson(memberKey(uid), { ...doc, points: doc.points + gained, updatedAt: now })
    notify()
    return { ok: true, gained }
  },

  subscribeOrg(cb) {
    ensureChannel()
    orgListeners.add(cb)
    cb(buildOrgSnapshot())
    return () => {
      orgListeners.delete(cb)
    }
  },

  subscribeForest(uid, cb) {
    ensureChannel()
    const set = listeners.get(uid) ?? new Set()
    set.add(cb)
    listeners.set(uid, set)
    cb(buildSnapshot(uid))
    return () => {
      set.delete(cb)
      if (set.size === 0) listeners.delete(uid)
    }
  },

  subscribeLeaderboard(cb) {
    ensureChannel()
    // โหมดจำลองไม่มี "โทเคน" ให้ถาม uid จาก readAuth() ตรงๆ แบบเดียวกับหน้าจออื่นในไฟล์นี้
    const uid = readAuth()?.uid ?? ''
    const set = leaderboardListeners.get(uid) ?? new Set()
    set.add(cb)
    leaderboardListeners.set(uid, set)
    cb(buildLeaderboard(uid))
    return () => {
      set.delete(cb)
      if (set.size === 0) leaderboardListeners.delete(uid)
    }
  },

  async listMembers() {
    return allMemberDocs()
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'th'))
      .map(toMember)
  },

  async seedDemoMembers(count, team) {
    // ชื่อเล่นกลางๆ + วงเล็บ (ตัวอย่าง) — ต้องดูออกทันทีว่าไม่ใช่คนจริงในหน่วยงาน
    const names = [
      'พี่ก้อย', 'น้องปอนด์', 'พี่เอ', 'ครูหนึ่ง', 'พี่ตั้ม', 'น้องมิ้นท์',
      'พี่หนุ่ย', 'น้องบีม', 'พี่แนน', 'น้องเจ', 'พี่โบว์', 'น้องปุ๊ก',
    ]
    const existing = allMemberDocs().filter((d) => d.demo).length
    const now = Date.now()

    for (let i = 0; i < count; i++) {
      const n = existing + i
      const uid = `demo-${n}`
      // แต้มกระจายตั้งแต่เพิ่งเริ่มจนเกือบเต็ม เพื่อให้เห็นต้นหลายระยะพร้อมกันในสวนเดียว
      const points = 20 + Math.round((((n * 37) % 100) / 100) * 520)
      writeJson(memberKey(uid), {
        uid,
        name: `${names[n % names.length]} (ตัวอย่าง)`,
        look: lookFromSeed(uid),
        team,
        points,
        updatedAt: now,
        demo: true,
      } satisfies MemberDoc)
    }
    notify()
  },
}
