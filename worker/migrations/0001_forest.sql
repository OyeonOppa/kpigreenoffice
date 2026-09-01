-- แคมเปญป่า 3R — ตารางผู้ใช้ + ประวัติแต้ม
--
-- ใช้กับ Cloudflare D1 (SQLite) บน Worker ตัวเดียวกับเกมแยกขยะแข่งสด
-- สร้างฐาน:   npx --prefix worker wrangler d1 create kpi-forest
-- ใส่ id ที่ได้ลงใน worker/wrangler.jsonc แล้ว:
--   npx --prefix worker wrangler d1 migrations apply kpi-forest --remote
--
-- ผู้ใช้ทั้งหมดถูกสร้างไว้ล่วงหน้าจากรายชื่อในองค์กร (ดู scripts/gen-users.mjs)
-- ไม่มีการสมัครเอง — เข้าระบบด้วย username + รหัสพนักงาน

CREATE TABLE IF NOT EXISTS forest_users (
  uid         TEXT PRIMARY KEY,
  username    TEXT NOT NULL,
  email       TEXT,
  name        TEXT NOT NULL,
  nickname    TEXT,
  team        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member',   -- 'member' | 'staff'
  pw_hash     TEXT NOT NULL,                    -- PBKDF2-SHA256 hex
  pw_salt     TEXT NOT NULL,                    -- hex
  look_json   TEXT,                             -- AvatarLook ที่ผู้ใช้เลือกตอนเข้าครั้งแรก (null = ยังไม่เลือก)
  points      INTEGER NOT NULL DEFAULT 0,       -- แต้มสะสม (denormalize จาก forest_points_log ไว้อ่านเร็ว)
  updated_at  INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_forest_users_username ON forest_users(username);
CREATE INDEX IF NOT EXISTS idx_forest_users_team ON forest_users(team);

CREATE TABLE IF NOT EXISTS forest_points_log (
  id          TEXT PRIMARY KEY,
  uid         TEXT NOT NULL REFERENCES forest_users(uid),
  activity_id TEXT,                             -- null = แต้มที่สตาฟกดให้
  points      INTEGER NOT NULL,
  at          INTEGER NOT NULL,
  source      TEXT NOT NULL,                    -- 'self' | 'staff'
  note        TEXT,
  day_key     TEXT NOT NULL                     -- 'YYYY-MM-DD' เขตเวลาไทย ใช้ตัดสินเพดานรายวัน
);

CREATE INDEX IF NOT EXISTS idx_forest_log_uid_day ON forest_points_log(uid, day_key);

-- กันบันทึกกิจกรรมเดิมซ้ำในวันเดียวกัน (เฉพาะที่ผู้ใช้กดเอง) — บังคับที่ระดับฐานข้อมูล
CREATE UNIQUE INDEX IF NOT EXISTS idx_forest_log_once_per_day
  ON forest_points_log(uid, day_key, activity_id)
  WHERE source = 'self' AND activity_id IS NOT NULL;
