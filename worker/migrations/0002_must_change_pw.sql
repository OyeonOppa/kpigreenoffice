-- บังคับตั้งรหัสผ่านใหม่ตอนเข้าระบบครั้งแรก
--
-- ตอน seed ทุกคนใช้ "รหัสพนักงาน" เป็นรหัสผ่านเหมือนกันหมด (เดากันได้)
-- ธงนี้ = 1 แปลว่ายังไม่เคยตั้งรหัสเอง หน้าจอจะบังคับให้ตั้งก่อนใช้งานต่อ
-- ตั้งรหัสใหม่สำเร็จเมื่อไหร่ เซิร์ฟเวอร์เซ็ตเป็น 0
--
-- apply:  npx --prefix worker wrangler d1 migrations apply kpi-forest --remote

ALTER TABLE forest_users ADD COLUMN must_change_pw INTEGER NOT NULL DEFAULT 1;
