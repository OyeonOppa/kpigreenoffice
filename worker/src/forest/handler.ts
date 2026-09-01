/**
 * REST API ของแคมเปญป่า 3R — อยู่บน Worker ตัวเดียวกับเกมแยกขยะแข่งสด
 *
 * ทุกเส้นทางขึ้นต้น /api/forest/ — คืน null ถ้าไม่ใช่เส้นทางของแคมเปญนี้ ให้ index.ts ไปลองเส้นทางอื่นต่อ
 *
 * หลักการความปลอดภัย: หน้าจอห้ามบอกว่าตัวเองเป็นใคร ทุก mutation อ่าน uid จากโทเคนที่เซ็นไว้เท่านั้น
 * (ดูโน้ตเดียวกันใน src/forest/backend.ts)
 */
import { ACTIVITY_POINTS, DAILY_CAP, GARDEN_MAX } from './activities'
import { issueToken, verifyPassword, verifyToken } from './crypto'

export interface ForestEnv {
  DB?: D1Database
  /** ความลับสำหรับเซ็นโทเคน session — ตั้งด้วย `wrangler secret put SESSION_SECRET` */
  SESSION_SECRET?: string
}

/** แคบลงหลังผ่านการเช็คว่ามีค่าครบแล้ว */
type ReadyEnv = Required<ForestEnv>

interface UserRow {
  uid: string
  username: string
  email: string | null
  name: string
  nickname: string | null
  team: string
  role: string
  pw_hash: string
  pw_salt: string
  look_json: string | null
  points: number
  updated_at: number
}

const json = (data: unknown, status = 200, cors: Record<string, string> = {}) =>
  Response.json(data, { status, headers: cors })

/** 'YYYY-MM-DD' เขตเวลาไทย — ตรึงที่เซิร์ฟเวอร์ ไม่เชื่อนาฬิกาเครื่องผู้ใช้ */
function bangkokDayKey(now: number): string {
  return new Date(now + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function treeSeed(uid: string): string {
  let h = 2166136261
  for (let i = 0; i < uid.length; i++) {
    h ^= uid.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

function parseLook(row: UserRow): unknown {
  if (!row.look_json) return null
  try {
    return JSON.parse(row.look_json)
  } catch {
    return null
  }
}

/** ตัวตนที่ส่งกลับหน้าจอ — ไม่มี hash/salt */
function publicUser(row: UserRow) {
  return {
    uid: row.uid,
    username: row.username,
    email: row.email,
    name: row.name,
    nickname: row.nickname,
    team: row.team,
    role: row.role,
    look: parseLook(row),
  }
}

async function authUser(request: Request, env: ReadyEnv): Promise<UserRow | null> {
  const header = request.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return null
  const uid = await verifyToken(token, env.SESSION_SECRET)
  if (!uid) return null
  return env.DB.prepare('SELECT * FROM forest_users WHERE uid = ?').bind(uid).first<UserRow>()
}

const entryId = () => `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`

export async function handleForest(
  request: Request,
  url: URL,
  rawEnv: ForestEnv,
  cors: Record<string, string>,
): Promise<Response | null> {
  const path = url.pathname
  if (!path.startsWith('/api/forest/')) return null

  if (!rawEnv.DB || !rawEnv.SESSION_SECRET) {
    return json({ error: 'ยังไม่ได้ตั้งค่าฐานข้อมูลป่า (DB / SESSION_SECRET)' }, 503, cors)
  }
  const env: ReadyEnv = { DB: rawEnv.DB, SESSION_SECRET: rawEnv.SESSION_SECRET }

  const now = Date.now()

  // ---- ยอดรวมทั้งหน่วยงาน (สาธารณะ ไม่ต้องล็อกอิน) ----
  if (path === '/api/forest/org' && request.method === 'GET') {
    const agg = await env.DB.prepare(
      'SELECT COUNT(*) AS n, COALESCE(SUM(points), 0) AS total FROM forest_users',
    ).first<{ n: number; total: number }>()
    const rows = await env.DB.prepare(
      'SELECT uid, points FROM forest_users ORDER BY points DESC LIMIT ?',
    )
      .bind(GARDEN_MAX)
      .all<{ uid: string; points: number }>()
    return json(
      {
        memberCount: agg?.n ?? 0,
        totalPoints: agg?.total ?? 0,
        trees: (rows.results ?? []).map((r) => ({ seed: treeSeed(r.uid), points: r.points })),
      },
      200,
      cors,
    )
  }

  // ---- เข้าสู่ระบบ ----
  if (path === '/api/forest/login' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as {
      username?: string
      password?: string
    }
    const username = (body.username ?? '').trim().toLowerCase()
    const password = body.password ?? ''
    if (!username || !password) {
      return json({ error: 'กรอกชื่อผู้ใช้และรหัสให้ครบ' }, 400, cors)
    }
    const row = await env.DB.prepare('SELECT * FROM forest_users WHERE username = ?')
      .bind(username)
      .first<UserRow>()
    // ตอบข้อความเดียวกันทั้งกรณีไม่มี user และรหัสผิด ไม่บอกใบ้ว่ามี username นี้อยู่ไหม
    const ok = row ? await verifyPassword(password, row.pw_salt, row.pw_hash) : false
    if (!row || !ok) {
      return json({ error: 'ชื่อผู้ใช้หรือรหัสไม่ถูกต้อง' }, 401, cors)
    }
    const token = await issueToken(row.uid, env.SESSION_SECRET)
    return json({ token, user: publicUser(row) }, 200, cors)
  }

  // ---- ตั้งแต่ตรงนี้ต้องล็อกอิน ----
  const me = await authUser(request, env)
  if (!me) return json({ error: 'ต้องเข้าสู่ระบบก่อน' }, 401, cors)

  if (path === '/api/forest/session' && request.method === 'GET') {
    return json({ user: publicUser(me) }, 200, cors)
  }

  // ---- เลือก/เปลี่ยนตัวละคร (เขียนได้แค่ look — ชื่อกับสำนักมาจากรายชื่อองค์กร) ----
  if (path === '/api/forest/profile' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { look?: unknown }
    if (!body.look || typeof body.look !== 'object') {
      return json({ error: 'ข้อมูลตัวละครไม่ถูกต้อง' }, 400, cors)
    }
    await env.DB.prepare('UPDATE forest_users SET look_json = ?, updated_at = ? WHERE uid = ?')
      .bind(JSON.stringify(body.look), now, me.uid)
      .run()
    return json({ ok: true }, 200, cors)
  }

  // ---- ข้อมูลป่าของฉัน ----
  if (path === '/api/forest/me' && request.method === 'GET') {
    const day = bangkokDayKey(now)
    const logRows = await env.DB.prepare(
      'SELECT id, activity_id, points, at, source, note, day_key FROM forest_points_log WHERE uid = ? ORDER BY at DESC LIMIT 60',
    )
      .bind(me.uid)
      .all<{
        id: string
        activity_id: string | null
        points: number
        at: number
        source: string
        note: string | null
        day_key: string
      }>()
    const log = (logRows.results ?? []).map((e) => ({
      id: e.id,
      activityId: e.activity_id,
      points: e.points,
      at: e.at,
      source: e.source,
      note: e.note ?? undefined,
    }))
    const todaySelf = (logRows.results ?? []).filter(
      (e) => e.source === 'self' && e.day_key === day,
    )

    const gardenRows = await env.DB.prepare(
      'SELECT uid, name, nickname, team, look_json, points, updated_at FROM forest_users WHERE team = ? ORDER BY points DESC, name ASC LIMIT ?',
    )
      .bind(me.team, GARDEN_MAX)
      .all<Pick<UserRow, 'uid' | 'name' | 'nickname' | 'team' | 'look_json' | 'points' | 'updated_at'>>()
    const teamCount = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM forest_users WHERE team = ?',
    )
      .bind(me.team)
      .first<{ n: number }>()
    const office = await env.DB.prepare(
      'SELECT COUNT(*) AS n, COALESCE(SUM(points), 0) AS total FROM forest_users',
    ).first<{ n: number; total: number }>()

    const toMember = (r: {
      uid: string
      name: string
      nickname: string | null
      team: string
      look_json: string | null
      points: number
      updated_at: number
    }) => ({
      uid: r.uid,
      name: r.nickname || r.name,
      look: r.look_json ? safeJson(r.look_json) : null,
      team: r.team,
      points: r.points,
      updatedAt: r.updated_at,
    })

    return json(
      {
        // me = null จนกว่าจะเลือกตัวละคร — หน้าจอใช้จุดนี้ตัดสินว่าจะโชว์การ์ด "เลือกตัวละครครั้งแรก"
        me: me.look_json
          ? toMember({
              uid: me.uid,
              name: me.name,
              nickname: me.nickname,
              team: me.team,
              look_json: me.look_json,
              points: me.points,
              updated_at: me.updated_at,
            })
          : null,
        profile: { name: me.nickname || me.name, team: me.team },
        log,
        todayPoints: todaySelf.reduce((s, e) => s + e.points, 0),
        todayDone: todaySelf.map((e) => e.activity_id).filter((id): id is string => id !== null),
        garden: (gardenRows.results ?? []).map(toMember),
        teamCount: teamCount?.n ?? 0,
        officeCount: office?.n ?? 0,
        officePoints: office?.total ?? 0,
      },
      200,
      cors,
    )
  }

  // ---- บันทึกกิจกรรม 3R ของตัวเอง ----
  if (path === '/api/forest/activity' && request.method === 'POST') {
    if (!me.look_json) return json({ ok: false, reason: 'ยังไม่ได้เลือกตัวละคร' }, 200, cors)
    const body = (await request.json().catch(() => ({}))) as { activityId?: string }
    const activityId = body.activityId ?? ''
    const base = ACTIVITY_POINTS[activityId]
    if (base === undefined) return json({ ok: false, reason: 'ไม่มีกิจกรรมนี้' }, 200, cors)

    const day = bangkokDayKey(now)
    const todaySelf = await env.DB.prepare(
      "SELECT activity_id, points FROM forest_points_log WHERE uid = ? AND day_key = ? AND source = 'self'",
    )
      .bind(me.uid, day)
      .all<{ activity_id: string | null; points: number }>()
    const rows = todaySelf.results ?? []

    if (rows.some((e) => e.activity_id === activityId)) {
      return json({ ok: false, reason: 'ข้อนี้บันทึกไปแล้ววันนี้ พรุ่งนี้บันทึกได้อีก' }, 200, cors)
    }
    const used = rows.reduce((s, e) => s + e.points, 0)
    const remaining = DAILY_CAP - used
    if (remaining <= 0) {
      return json(
        { ok: false, reason: `วันนี้ครบเพดาน ${DAILY_CAP} แต้มแล้ว พรุ่งนี้เริ่มใหม่` },
        200,
        cors,
      )
    }
    const gained = Math.min(base, remaining)

    try {
      await env.DB.batch([
        env.DB.prepare(
          "INSERT INTO forest_points_log (id, uid, activity_id, points, at, source, note, day_key) VALUES (?, ?, ?, ?, ?, 'self', NULL, ?)",
        ).bind(entryId(), me.uid, activityId, gained, now, day),
        env.DB.prepare('UPDATE forest_users SET points = points + ?, updated_at = ? WHERE uid = ?').bind(
          gained,
          now,
          me.uid,
        ),
      ])
    } catch {
      // ชนดัชนี unique (กดสองครั้งพร้อมกัน) — ถือว่าบันทึกไปแล้ว
      return json({ ok: false, reason: 'ข้อนี้บันทึกไปแล้ววันนี้' }, 200, cors)
    }
    return json({ ok: true, gained }, 200, cors)
  }

  // ---- สตาฟกดให้แต้ม ----
  if (path === '/api/forest/award' && request.method === 'POST') {
    if (me.role !== 'staff') return json({ error: 'ต้องเป็นสตาฟ' }, 403, cors)
    const body = (await request.json().catch(() => ({}))) as {
      uid?: string
      points?: number
      note?: string
    }
    const targetUid = body.uid ?? ''
    const note = (body.note ?? '').trim()
    const gained = Math.round(Math.max(1, Math.min(200, Number(body.points) || 0)))
    if (!targetUid || !note) return json({ ok: false, reason: 'ระบุคนและเหตุผลให้ครบ' }, 200, cors)

    const target = await env.DB.prepare('SELECT uid FROM forest_users WHERE uid = ?')
      .bind(targetUid)
      .first<{ uid: string }>()
    if (!target) return json({ ok: false, reason: 'ไม่พบคนนี้' }, 200, cors)

    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO forest_points_log (id, uid, activity_id, points, at, source, note, day_key) VALUES (?, ?, NULL, ?, ?, 'staff', ?, ?)",
      ).bind(entryId(), targetUid, gained, now, note, bangkokDayKey(now)),
      env.DB.prepare('UPDATE forest_users SET points = points + ?, updated_at = ? WHERE uid = ?').bind(
        gained,
        now,
        targetUid,
      ),
    ])
    return json({ ok: true, gained }, 200, cors)
  }

  // ---- รายชื่อทั้งหน่วยงาน (หน้าสตาฟ) ----
  if (path === '/api/forest/members' && request.method === 'GET') {
    if (me.role !== 'staff') return json({ error: 'ต้องเป็นสตาฟ' }, 403, cors)
    const rows = await env.DB.prepare(
      'SELECT uid, name, nickname, team, look_json, points, updated_at FROM forest_users ORDER BY points DESC, name ASC',
    ).all<Pick<UserRow, 'uid' | 'name' | 'nickname' | 'team' | 'look_json' | 'points' | 'updated_at'>>()
    return json(
      {
        members: (rows.results ?? []).map((r) => ({
          uid: r.uid,
          name: r.nickname || r.name,
          look: r.look_json ? safeJson(r.look_json) : null,
          team: r.team,
          points: r.points,
          updatedAt: r.updated_at,
        })),
      },
      200,
      cors,
    )
  }

  return json({ error: 'ไม่พบเส้นทางนี้' }, 404, cors)
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
