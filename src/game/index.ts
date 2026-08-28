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

/** OAuth Client ID ของ Google — ว่าง = ยังไม่ได้ตั้งค่า ให้ใช้ล็อกอินแบบทดสอบแทน */
export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? ''

/**
 * ยังอยู่ช่วงซ้อม (โหมดจำลอง หรือยังไม่ได้ผูก Google)
 * ใช้ตัดสินใจว่าจะโชว์เครื่องมือซ้อม เช่น ปุ่มเพิ่มผู้เล่นจำลอง
 * พอตั้ง VITE_GOOGLE_CLIENT_ID แล้ว เครื่องมือพวกนี้จะหายไปเองไม่ต้องมาตามลบ
 */
export const IS_REHEARSAL = backend.isMock || !GOOGLE_CLIENT_ID

export * from './types'
export * from './config'
