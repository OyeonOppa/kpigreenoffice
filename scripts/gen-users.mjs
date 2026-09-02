#!/usr/bin/env node
/**
 * สร้างผู้ใช้แคมเปญป่า 3R จากไฟล์รายชื่อองค์กร
 *
 *   node scripts/gen-users.mjs รายชื่อ.csv
 *
 * อ่าน CSV (มีบรรทัดหัวตาราง) แล้วออกไฟล์:
 *   worker/seed/users.sql        — รันเข้า D1:  npx --prefix worker wrangler d1 execute kpi-forest --remote --file=seed/users.sql
 *   worker/seed/credentials.csv  — username + รหัส (เลขประจำตัว) ไว้แจกให้แต่ละคน
 *
 * คอลัมน์ที่รองรับ (ชื่อหัวตารางไทยหรืออังกฤษก็ได้ ไม่สนตัวพิมพ์/ช่องว่าง):
 *   เลขประจำตัว / รหัสพนักงาน / employee_id / empid   → ใช้เป็น "รหัสผ่าน" และเป็นกุญแจถาวรของผู้ใช้ (บังคับ)
 *   ชื่อ-สกุล / ชื่อ / name                            → ชื่อจริง (บังคับ)
 *   สำนัก / กอง / สำนัก/กอง / team / unit               → สำนัก/กอง (บังคับ)
 *   อีเมล / email                                       → อีเมล (ไม่บังคับ) ใช้ตั้ง username ได้ และใช้ตัดสิน staff
 *   ชื่อเล่น / nickname                                  → ชื่อที่แสดงในสวน (ไม่บังคับ ถ้าไม่มีใช้ชื่อจริง)
 *   username / ชื่อผู้ใช้ / english_name / ชื่ออังกฤษ     → username สำหรับเข้าระบบ (ไม่บังคับ ดูลำดับการเดาด้านล่าง)
 *   role / บทบาท                                        → 'staff' เพื่อให้กดแต้มให้คนอื่นได้ (ไม่บังคับ)
 *
 * username เลือกจาก (ตามลำดับ): คอลัมน์ username → ชื่ออังกฤษ (slug) → ส่วนหน้า @ ของอีเมล
 * ถ้าไม่ได้สักทางจะข้ามแถวนั้นและเตือน
 *
 * staff: role === 'staff' หรือ อีเมลตรงกับ STAFF_EMAILS ด้านล่าง
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const STAFF_EMAILS = new Set(['webmaster@kpi.ac.th'])

// ต้องตรงกับ worker/src/forest/crypto.ts
const PBKDF2_ITERATIONS = 100_000
const HASH_BYTES = 32
const SALT_BYTES = 16

// ---------- CSV ----------

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  const src = text.replace(/^﻿/, '')
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((v) => v.trim() !== '')) rows.push(row)
      row = []
    } else field += c
  }
  if (field !== '' || row.length) {
    row.push(field)
    if (row.some((v) => v.trim() !== '')) rows.push(row)
  }
  return rows
}

const norm = (s) => (s ?? '').toString().trim().toLowerCase().replace(/[\s_./-]/g, '')

const COL_ALIASES = {
  empId: ['เลขประจำตัว', 'รหัสพนักงาน', 'รหัสประจำตัว', 'employeeid', 'empid', 'staffid', 'id'],
  name: ['ชื่อสกุล', 'ชื่อนามสกุล', 'ชื่อ', 'name', 'fullname'],
  team: ['สำนัก', 'กอง', 'สำนักกอง', 'หน่วยงาน', 'team', 'unit', 'department', 'division'],
  email: ['อีเมล', 'อีเมล์', 'email', 'mail'],
  nickname: ['ชื่อเล่น', 'nickname', 'nick'],
  username: ['username', 'ชื่อผู้ใช้', 'user', 'login'],
  englishName: ['ชื่ออังกฤษ', 'englishname', 'nameen', 'enname'],
  role: ['role', 'บทบาท', 'สิทธิ์'],
}

function mapHeader(header) {
  const idx = {}
  header.forEach((h, i) => {
    const n = norm(h)
    for (const [key, aliases] of Object.entries(COL_ALIASES)) {
      if (aliases.includes(n)) idx[key] = i
    }
  })
  return idx
}

// ---------- helpers ----------

function slugUsername(s) {
  return (s ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w.@-]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.{2,}/g, '.')
}

function hashPassword(password, saltHex) {
  return pbkdf2Sync(password, Buffer.from(saltHex, 'hex'), PBKDF2_ITERATIONS, HASH_BYTES, 'sha256').toString('hex')
}

const sql = (v) => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)

// ---------- main ----------

const inputPath = process.argv[2]
if (!inputPath) {
  console.error('ใช้:  node scripts/gen-users.mjs <ไฟล์รายชื่อ.csv>')
  process.exit(1)
}

const rows = parseCsv(readFileSync(resolve(inputPath), 'utf8'))
if (rows.length < 2) {
  console.error('ไฟล์ว่างหรือมีแต่หัวตาราง')
  process.exit(1)
}

const idx = mapHeader(rows[0])
for (const req of ['empId', 'name', 'team']) {
  if (idx[req] === undefined) {
    console.error(`หาไม่เจอคอลัมน์สำหรับ "${req}" — หัวตารางที่อ่านได้: ${rows[0].join(' | ')}`)
    process.exit(1)
  }
}

const at = (row, key) => (idx[key] === undefined ? '' : (row[idx[key]] ?? '').trim())

const users = []
const usernames = new Set()
const teams = new Set()
const skipped = []

for (const row of rows.slice(1)) {
  const empId = at(row, 'empId')
  const name = at(row, 'name')
  const team = at(row, 'team')
  const email = at(row, 'email').toLowerCase()
  const nickname = at(row, 'nickname')
  const roleRaw = norm(at(row, 'role'))

  if (!empId || !name || !team) {
    skipped.push({ name, reason: 'เลขประจำตัว/ชื่อ/สำนัก ไม่ครบ' })
    continue
  }

  let username =
    slugUsername(at(row, 'username')) ||
    slugUsername(at(row, 'englishName')) ||
    (email.includes('@') ? slugUsername(email.split('@')[0]) : '')
  if (!username) {
    skipped.push({ name, reason: 'ตั้ง username ไม่ได้ (ไม่มีคอลัมน์ username/ชื่ออังกฤษ/อีเมล)' })
    continue
  }
  if (usernames.has(username)) {
    let n = 2
    while (usernames.has(`${username}${n}`)) n++
    username = `${username}${n}`
  }
  usernames.add(username)
  teams.add(team)

  const role = roleRaw === 'staff' || STAFF_EMAILS.has(email) ? 'staff' : 'member'
  const saltHex = randomBytes(SALT_BYTES).toString('hex')
  const pwHash = hashPassword(empId, saltHex)
  // uid ถาวร ผูกกับเลขประจำตัว — รันสคริปต์ซ้ำเพื่อแก้ชื่อ/สำนัก ไม่รีเซ็ตแต้ม
  const uid = `u_${slugUsername(empId).replace(/[^\w]/g, '') || Buffer.from(empId).toString('hex')}`

  users.push({
    uid,
    username,
    email: email || null,
    name,
    nickname: nickname || null,
    team,
    role,
    pwHash,
    saltHex,
    password: empId,
  })
}

const now = Date.now()
const lines = [
  '-- สร้างโดย scripts/gen-users.mjs — อย่าแก้มือ',
  `-- ${users.length} คน · ${teams.size} สำนัก · ${new Date(now).toISOString()}`,
  'PRAGMA foreign_keys = OFF;',
  '',
]
for (const u of users) {
  // must_change_pw = 1 ตอนสร้าง — บังคับตั้งรหัสใหม่ตอนเข้าครั้งแรก
  // รันซ้ำเพื่อแก้ชื่อ/สำนัก จงใจไม่แตะ pw_hash/pw_salt/must_change_pw จะได้ไม่รีเซ็ตรหัสที่ผู้ใช้เปลี่ยนเอง
  lines.push(
    `INSERT INTO forest_users (uid, username, email, name, nickname, team, role, pw_hash, pw_salt, must_change_pw, created_at)\n` +
      `VALUES (${sql(u.uid)}, ${sql(u.username)}, ${sql(u.email)}, ${sql(u.name)}, ${sql(u.nickname)}, ${sql(u.team)}, ${sql(u.role)}, ${sql(u.pwHash)}, ${sql(u.saltHex)}, 1, ${now})\n` +
      `ON CONFLICT(uid) DO UPDATE SET username=excluded.username, email=excluded.email, name=excluded.name,\n` +
      `  nickname=excluded.nickname, team=excluded.team, role=excluded.role;`,
  )
}
lines.push('')

const seedDir = resolve(ROOT, 'worker/seed')
mkdirSync(seedDir, { recursive: true })
writeFileSync(resolve(seedDir, 'users.sql'), lines.join('\n'), 'utf8')

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
const cred = ['username,password,ชื่อ,สำนัก,role']
for (const u of users) {
  cred.push([u.username, u.password, u.name, u.team, u.role].map(csvCell).join(','))
}
writeFileSync(resolve(seedDir, 'credentials.csv'), cred.join('\n'), 'utf8')

console.log(`เขียน worker/seed/users.sql (${users.length} คน)`)
console.log(`เขียน worker/seed/credentials.csv`)
console.log(`สำนัก: ${[...teams].sort().join(', ')}`)
if (skipped.length) {
  console.log(`\nข้าม ${skipped.length} แถว:`)
  for (const s of skipped) console.log(`  - ${s.name || '(ไม่มีชื่อ)'}: ${s.reason}`)
}
console.log('\nต่อไป:')
console.log('  npx --prefix worker wrangler d1 execute kpi-forest --remote --file=seed/users.sql')
