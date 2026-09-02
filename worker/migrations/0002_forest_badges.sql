-- แคมเปญป่า 3R — เก็บสถิติต่อเนื่อง (streak) + เหรียญตราที่ปลดล็อกได้
--
-- ใช้กับ leaderboard (/api/forest/leaderboard) และระบบ badge — ดู worker/src/forest/badges.ts
-- ใช้:  npx --prefix worker wrangler d1 migrations apply kpi-forest --remote

-- วันล่าสุดที่ทำกิจกรรมเอง + สถิติต่อเนื่อง — คำนวณตอนบันทึกกิจกรรม (ดู handler.ts /api/forest/activity)
-- ไม่คำนวณจาก forest_points_log ทุกครั้งที่ถาม เพราะยิ่งสะสมนานยิ่งต้องไล่ log ยาวขึ้นเรื่อยๆ
ALTER TABLE forest_users ADD COLUMN current_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE forest_users ADD COLUMN longest_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE forest_users ADD COLUMN last_active_day TEXT;

-- เหรียญตราที่ปลดล็อกแล้ว — แยกตารางแทนการยัดเป็น JSON คอลัมน์เดียว เพราะต้อง query ข้ามคน
-- ได้ง่ายตอนแสดงผลใน leaderboard (join ทีเดียวได้ทุกคน ไม่ต้อง parse JSON ทีละแถว)
CREATE TABLE IF NOT EXISTS forest_badges (
  uid        TEXT NOT NULL REFERENCES forest_users(uid),
  badge_id   TEXT NOT NULL,             -- เช่น 'streak-7' — รายชื่อเต็มดู FOREST_BADGES ใน src/content.ts
  earned_at  INTEGER NOT NULL,
  PRIMARY KEY (uid, badge_id)
);
