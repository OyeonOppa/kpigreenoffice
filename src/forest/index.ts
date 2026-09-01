import type { ForestBackend } from './backend'
import { cloudflareForestBackend } from './cloudflareForestBackend'
import { mockForestBackend } from './mockForestBackend'

/**
 * จุดสลับหลังบ้านของแคมเปญป่า 3R
 *
 * ตั้ง VITE_FOREST_API ใน .env = ใช้ Cloudflare Worker + D1 (ของจริง เข้าระบบด้วย username/รหัสพนักงาน)
 * ไม่ตั้ง = โหมดจำลองใน localStorage (บัญชีทดสอบ demo1..demo3 / staff ดู mockForestBackend)
 */
const hasApi = Boolean((import.meta.env.VITE_FOREST_API as string | undefined)?.trim())
export const forestBackend: ForestBackend = hasApi ? cloudflareForestBackend : mockForestBackend

/** ยังอยู่โหมดซ้อม — ใช้ตัดสินใจว่าจะโชว์เครื่องมือซ้อม เช่น ปุ่มสร้างเพื่อนร่วมสวนจำลอง */
export const FOREST_REHEARSAL = forestBackend.isMock

export type { ForestBackend, ForestProfile } from './backend'
export * from './types'
export * from './config'
