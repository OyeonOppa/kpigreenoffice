import { FOREST } from '../content'
import { lookFromSeed } from '../game/avatar'
import type { AvatarLook } from '../game/types'
import type { ForestBackend, ForestProfile } from './backend'
import { DAILY_CAP, GARDEN_MAX, dayKey, growthFromPoints } from './config'
import type {
  ActivityId,
  ForestMember,
  ForestSnapshot,
  ForestUser,
  LogEntry,
  LogResult,
} from './types'

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

function readAuth(): ForestUser | null {
  const user = readJson<ForestUser>(AUTH_KEY)
  return user?.uid ? user : null
}

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

const entryId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

// ---------- adapter ----------

export const mockForestBackend: ForestBackend = {
  id: 'mock',
  isMock: true,

  now: () => Date.now(),

  currentUser: readAuth,

  async signIn(name) {
    const existing = readAuth()
    // ล็อกอินซ้ำด้วยชื่อใหม่ = คนเดิมเปลี่ยนชื่อ ไม่ใช่คนใหม่ ต้นเดิมจึงยังเป็นของเขา
    const user: ForestUser = {
      uid: existing?.uid ?? `local-${Math.random().toString(36).slice(2, 10)}`,
      name: name.trim() || 'ผู้ใช้ทดสอบ',
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

  async saveProfile(uid, profile: ForestProfile) {
    const existing = readJson<MemberDoc>(memberKey(uid))
    writeJson(memberKey(uid), {
      uid,
      name: profile.name,
      look: profile.look,
      team: profile.team,
      // แก้โปรไฟล์ไม่รีเซ็ตแต้ม — ย้ายสำนักแล้วต้นต้องย้ายตามไปทั้งต้น
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

    appendLog(uid, { id: entryId(), activityId, points: gained, at: now, source: 'self' })
    writeJson(memberKey(uid), { ...doc, points: doc.points + gained, updatedAt: now })
    notify()
    return { ok: true, gained }
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

  listMembers() {
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
