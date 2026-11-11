// การ์ด "โยนขยะ!" — คัดมาจาก docs/game-prototypes/cards/throw-trash-cards.html (ต้นแบบปริ้น)
// ถ้าแก้ข้อความ/จำนวนใบบนการ์ดพิมพ์ ให้แก้ที่นี่ด้วย เพื่อให้เว็บกับการ์ดพิมพ์ตรงกัน

export type BinId = 'green' | 'yellow' | 'blue' | 'red'
export const BIN_IDS: BinId[] = ['green', 'yellow', 'blue', 'red']

export interface BinDef {
  c: string
  t: string
  shape: string
  name: string
  hint: string
}

export const BINS: Record<BinId, BinDef> = {
  green: { c: '#16a34a', t: '#eafbee', shape: '●', name: 'ถังเขียว', hint: 'เศษอาหาร' },
  yellow: { c: '#d99a00', t: '#fff8e1', shape: '▲', name: 'ถังเหลือง', hint: 'รีไซเคิล' },
  blue: { c: '#0284c7', t: '#e6f6fe', shape: '■', name: 'ถังน้ำเงิน', hint: 'ขยะทั่วไป' },
  red: { c: '#e4573d', t: '#ffede9', shape: '◆', name: 'ถังแดง', hint: 'ขยะอันตราย' },
}

interface WasteSeed {
  emoji: string
  name: string
}

const WASTE_SEED: Record<BinId, WasteSeed[]> = {
  green: [
    { emoji: '🍌', name: 'เปลือกกล้วย' },
    { emoji: '🍚', name: 'เศษข้าว' },
    { emoji: '🍊', name: 'เปลือกส้ม' },
    { emoji: '🍗', name: 'กระดูกไก่' },
    { emoji: '🥬', name: 'เศษผัก' },
    { emoji: '🐟', name: 'ก้างปลา' },
    { emoji: '🍂', name: 'ใบไม้แห้ง' },
    { emoji: '☕', name: 'กากกาแฟ' },
    { emoji: '🥚', name: 'เปลือกไข่' },
    { emoji: '🍉', name: 'เปลือกแตงโม' },
  ],
  yellow: [
    { emoji: '🍾', name: 'ขวดน้ำพลาสติกใส' },
    { emoji: '🥫', name: 'กระป๋องน้ำอัดลม' },
    { emoji: '📦', name: 'กล่องกระดาษ' },
    { emoji: '📰', name: 'หนังสือพิมพ์' },
    { emoji: '🫙', name: 'ขวดแก้ว' },
    { emoji: '📄', name: 'กระดาษ A4' },
    { emoji: '🛢️', name: 'ขวดน้ำมันพืช' },
    { emoji: '🥛', name: 'กระป๋องนมเปล่า' },
    { emoji: '📚', name: 'หนังสือเก่า' },
    { emoji: '🥤', name: 'ขวดน้ำอัดลม PET' },
    { emoji: '🧃', name: 'กล่องนมล้างสะอาด' },
  ],
  blue: [
    { emoji: '🍿', name: 'ถุงขนมเปื้อน' },
    { emoji: '☕', name: 'แก้วกาแฟเปื้อน' },
    { emoji: '🧻', name: 'ทิชชู่ใช้แล้ว' },
    { emoji: '🍱', name: 'โฟมใส่อาหาร' },
    { emoji: '🛍️', name: 'ถุงพลาสติกเปื้อน' },
    { emoji: '🥢', name: 'หลอดดูด' },
    { emoji: '🍜', name: 'ซองบะหมี่' },
    { emoji: '🪥', name: 'แปรงสีฟันเก่า' },
    { emoji: '🍦', name: 'ถ้วยโยเกิร์ตเปื้อน' },
    { emoji: '🧽', name: 'ฟองน้ำล้างจาน' },
  ],
  red: [
    { emoji: '🔋', name: 'ถ่านไฟฉาย' },
    { emoji: '💡', name: 'หลอดไฟ' },
    { emoji: '🧴', name: 'กระป๋องสเปรย์' },
    { emoji: '☠️', name: 'ขวดยาฆ่าแมลง' },
    { emoji: '💊', name: 'ยาหมดอายุ' },
    { emoji: '📱', name: 'แบตเตอรี่มือถือ' },
    { emoji: '🌡️', name: 'เทอร์โมมิเตอร์ปรอท' },
    { emoji: '🖨️', name: 'ตลับหมึกพิมพ์' },
    { emoji: '🎨', name: 'กระป๋องสีทาบ้าน' },
  ],
}

export type BuffKey = 'tree' | 'solar' | 'compost' | 'bank' | 'bag' | 'light' | 'repair' | 'friend'

export interface BuffDef {
  key: BuffKey
  emoji: string
  name: string
  leaves: number
  desc: string
  qty: number
}

export const BUFFS: BuffDef[] = [
  { key: 'tree', emoji: '🌳', name: 'ปลูกต้นไม้', leaves: 1, desc: 'วางในโซนบัฟ นับเป็น 1 ใบไม้', qty: 6 },
  { key: 'solar', emoji: '☀️', name: 'โซลาร์รูฟ', leaves: 3, desc: 'ลงทุนสูง: ต้องทิ้งการ์ดอื่นในมือ 2 ใบก่อน', qty: 2 },
  { key: 'compost', emoji: '🪱', name: 'ทำปุ๋ยหมัก', leaves: 1, desc: 'ขยะสีเขียว (●) ทุกใบในบ้านคุณ ทิ้งทันทีโดยไม่ต้องใช้ถัง', qty: 3 },
  { key: 'bank', emoji: '🏦', name: 'ธนาคารขยะ', leaves: 2, desc: 'ต้องทิ้งการ์ดขยะสีเหลือง 3 ใบจากมือก่อน', qty: 3 },
  { key: 'bag', emoji: '👜', name: 'ใช้ถุงผ้า', leaves: 1, desc: 'กันการ์ด "แจกถุงพลาสติก"/"ของแถมฟรี" ไม่ต้องรับขยะ', qty: 3 },
  { key: 'light', emoji: '💡', name: 'ปิดไฟก่อนกลับ', leaves: 1, desc: 'จั่วการ์ดเพิ่ม 1 ใบทันที', qty: 3 },
  { key: 'repair', emoji: '🔧', name: 'ซ่อมแทนซื้อใหม่', leaves: 2, desc: 'นำขยะ 1 ใบจากบ้านคุณกลับขึ้นมือ', qty: 2 },
  { key: 'friend', emoji: '🤝', name: 'ชวนเพื่อนแยกขยะ', leaves: 1, desc: 'เลือกผู้เล่นอีกคน คุณและเขาจั่วคนละ 1 ใบ', qty: 3 },
]

export type PrankKey = 'burn' | 'bags' | 'lights' | 'wind' | 'gift' | 'smoke'

export interface PrankDef {
  key: PrankKey
  emoji: string
  name: string
  big: string
  desc: string
  qty: number
}

export const PRANKS: PrankDef[] = [
  { key: 'burn', emoji: '🔥', name: 'เผาขยะ!', big: 'ขยะในบ้านคุณหมดทันที', desc: 'แต่คุณและคนซ้าย-ขวาของคุณ ทิ้งการ์ดบัฟมูลค่าต่ำสุดคนละ 1 ใบ เผาแล้วทุกคนเดือดร้อน! (เล่นได้เมื่อบ้านคุณมีขยะ)', qty: 2 },
  { key: 'bags', emoji: '🛍️', name: 'แจกถุงพลาสติก', big: 'ทุกคนรับขยะ', desc: 'ผู้เล่นทุกคน (ที่ไม่มี 👜 ถุงผ้า) รับขยะสีน้ำเงิน 1 ใบลงบ้าน (ของฟรีมีต้นทุน)', qty: 2 },
  { key: 'lights', emoji: '💡', name: 'เปิดไฟทิ้งไว้', big: 'เลือก 1 คน', desc: 'เลือกผู้เล่น 1 คน ทิ้งการ์ดบัฟมูลค่าต่ำสุด 1 ใบ', qty: 3 },
  { key: 'wind', emoji: '🌪️', name: 'ลมพัดขยะ', big: 'สลับขยะ', desc: 'เลือกขยะ 1 ใบจากบ้านใครก็ได้ ย้ายไปบ้านคนอื่นที่คุณเลือก', qty: 3 },
  { key: 'gift', emoji: '🎁', name: 'ของแถมฟรี', big: 'ยัดเยียด', desc: 'ให้ผู้เล่น 1 คนรับขยะ 2 ใบจากมือคุณลงบ้านเขา (นับเป็นการโยนขยะ)', qty: 3 },
  { key: 'smoke', emoji: '💨', name: 'ควันจากการเผา', big: 'ทุกคนหายใจลำบาก', desc: 'ผู้เล่นทุกคนที่มีขยะในบ้าน 3 ใบขึ้นไป ทิ้งการ์ดในมือ 1 ใบแบบสุ่ม', qty: 2 },
]

export type DefKey = 'nobag' | 'muni' | 'lid'

export interface DefDef {
  key: DefKey
  emoji: string
  name: string
  big: string
  desc: string
  qty: number
}

export const DEFS: DefDef[] = [
  { key: 'nobag', emoji: '🙅', name: 'ไม่รับถุงค่ะ', big: 'ยกเลิก', desc: 'ยกเลิกการ์ด "แจกถุงพลาสติก" หรือ "ของแถมฟรี" ที่เล่นใส่คุณ', qty: 4 },
  { key: 'muni', emoji: '📞', name: 'แจ้งเทศบาล', big: 'ส่งกลับ', desc: 'เมื่อมีการโยนขยะใส่บ้านคุณ ส่งขยะใบนั้นกลับบ้านคนโยน', qty: 3 },
  { key: 'lid', emoji: '🪣', name: 'ถังมีฝาปิด', big: 'กันไว้', desc: 'ยกเลิกการ์ด "ลมพัดขยะ" หรือ "ควันจากการเผา" ที่เล่นใส่คุณ', qty: 3 },
]

export const BUFF_BY_KEY = Object.fromEntries(BUFFS.map((b) => [b.key, b])) as Record<BuffKey, BuffDef>
export const PRANK_BY_KEY = Object.fromEntries(PRANKS.map((p) => [p.key, p])) as Record<PrankKey, PrankDef>
export const DEF_BY_KEY = Object.fromEntries(DEFS.map((d) => [d.key, d])) as Record<DefKey, DefDef>

export type Card =
  | { id: number; kind: 'waste'; bin: BinId; emoji: string; name: string }
  | { id: number; kind: 'bin'; bin: BinId }
  | { id: number; kind: 'buff'; key: BuffKey }
  | { id: number; kind: 'prank'; key: PrankKey }
  | { id: number; kind: 'def'; key: DefKey }

/** สร้างกองการ์ดทั้งหมด 110 ใบ (ยังไม่สับ) */
export function buildDeck(): Card[] {
  const cards: Card[] = []
  let id = 1
  for (const bin of BIN_IDS) for (const w of WASTE_SEED[bin]) cards.push({ id: id++, kind: 'waste', bin, emoji: w.emoji, name: w.name })
  for (const bin of BIN_IDS) for (let i = 0; i < 5; i++) cards.push({ id: id++, kind: 'bin', bin })
  for (const b of BUFFS) for (let i = 0; i < b.qty; i++) cards.push({ id: id++, kind: 'buff', key: b.key })
  for (const p of PRANKS) for (let i = 0; i < p.qty; i++) cards.push({ id: id++, kind: 'prank', key: p.key })
  for (const d of DEFS) for (let i = 0; i < d.qty; i++) cards.push({ id: id++, kind: 'def', key: d.key })
  return cards
}
