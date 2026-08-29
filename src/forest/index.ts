import type { ForestBackend } from './backend'
import { mockForestBackend } from './mockForestBackend'

/**
 * จุดสลับหลังบ้านของแคมเปญป่า 3R
 *
 * ตอนนี้มีแต่โหมดจำลอง (localStorage) — ทำ adapter ของจริงเสร็จเมื่อไรเปลี่ยนบรรทัดล่างนี้บรรทัดเดียว
 * หน้าจอทั้งหมดคุยผ่าน interface เดียวจึงไม่ต้องแก้ตาม
 */
export const forestBackend: ForestBackend = mockForestBackend

/** ยังอยู่โหมดซ้อม — ใช้ตัดสินใจว่าจะโชว์เครื่องมือซ้อม เช่น ปุ่มสร้างเพื่อนร่วมสวนจำลอง */
export const FOREST_REHEARSAL = forestBackend.isMock

export type { ForestBackend, ForestProfile } from './backend'
export * from './types'
export * from './config'
