/**
 * แต้มต่อกิจกรรม 3R — ต้องอยู่ฝั่งเซิร์ฟเวอร์ ห้ามให้หน้าจอบอกว่าตัวเองควรได้กี่แต้ม
 *
 * ค่านี้ต้องตรงกับ FOREST.activities ใน src/content.ts
 * ถ้าแก้แต้มหรือเพิ่ม/ลบกิจกรรมที่นั่น ต้องมาแก้ที่นี่ด้วย แล้ว deploy worker ใหม่
 */
export const ACTIVITY_POINTS: Record<string, number> = {
  'own-bottle': 10,
  'no-plastic': 10,
  'print-less': 8,
  'power-off': 8,
  stairs: 6,
  'paper-reuse': 8,
  'bag-reuse': 10,
  refill: 12,
  'pass-on': 12,
  'sort-bin': 10,
  'drop-recycle': 12,
  'drop-hazard': 15,
  compost: 12,
}

/** เพดานแต้มที่บันทึกเองได้ต่อวัน — ตรงกับ DAILY_CAP ใน src/forest/config.ts */
export const DAILY_CAP = 40

/** จำนวนต้นสูงสุดที่ส่งกลับไปวาดในสวนหนึ่งฉาก — ตรงกับ GARDEN_MAX ใน src/forest/config.ts */
export const GARDEN_MAX = 300
