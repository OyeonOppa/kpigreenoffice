import { backend as liveBackend } from 'virtual:live-backend'
import type { GameBackend } from './backend'

/**
 * จุดสลับหลังบ้านของเกมแข่งสด
 *
 * ตั้ง VITE_LIVE_API ใน .env = ใช้ Cloudflare Worker + Durable Object (ของจริง)
 * ไม่ตั้ง = ใช้โหมดจำลองในเครื่อง (ซ้อมข้ามแท็บได้ ไม่ต้องมีเซิร์ฟเวอร์)
 *
 * ตัวเลือกนี้ทำที่ vite.config.ts เป็น alias ของ 'virtual:live-backend'
 * โมดูลที่ไม่ได้เลือกจะไม่เข้ากราฟตั้งแต่แรก — พอ build โหมดจริง คลังคำถาม
 * (ที่มีคำเฉลย) จึงไม่ติดไปกับ bundle เลย ตรวจได้ด้วย `npm run check:answers`
 */
export const backend: GameBackend = liveBackend

/**
 * โหมดซ้อม — โชว์เครื่องมือทดสอบ เช่น ปุ่ม "เพิ่มผู้เล่นซ้อม"
 * - โหมดจำลองในเครื่อง = ซ้อมเสมอ
 * - หลังบ้านจริง = ซ้อมเฉพาะเมื่อเปิดหน้าด้วย ?rehearsal (เช่น #/live/host?rehearsal=1)
 *   งานจริงเปิดลิงก์ปกติ ปุ่มพวกนี้จะไม่โผล่มากวน
 */
export const IS_REHEARSAL =
  backend.isMock ||
  (typeof window !== 'undefined' &&
    (window.location.search.includes('rehearsal') || window.location.hash.includes('rehearsal')))

export * from './types'
export * from './config'
