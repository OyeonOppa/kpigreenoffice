/**
 * เกณฑ์ปลดล็อกเหรียญตรา — ตอนนี้มีแบบเดียวคือ "ทำกิจกรรมต่อเนื่องกี่วัน"
 *
 * ต้องตรงกับ FOREST_BADGES ใน src/content.ts (ที่นั่นเก็บชื่อ/emoji/คำอธิบายที่คนอ่าน
 * ส่วนนี่เก็บแค่ตัวเลขที่เซิร์ฟเวอร์ใช้ตัดสินว่าจะให้เหรียญเมื่อไร) — แก้ต้องแก้คู่กันทั้งสองไฟล์
 */
export const STREAK_BADGE_DAYS = [7, 15, 30, 60] as const

export const badgeIdForStreak = (days: number) => `streak-${days}`

/** จำนวนอันดับที่ leaderboard ส่งให้หน้าจอ (นอกเหนือจากอันดับของตัวเองที่ส่งแยกเสมอ) */
export const LEADERBOARD_TOP_N = 10
