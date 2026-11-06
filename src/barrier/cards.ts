// การ์ดของเกม "ฝ่าด่านลดคาร์บอน" — ฝ่ายผลักดัน vs ฝ่ายต่อต้าน
//
// ด่าน (icon): M แพง · K ไม่รู้วิธี · P เคยชิน · E ยุ่งยาก · S มองไม่เห็นผล
// กุญแจ: ชนิดเดียวกับด่านแก้ด่านนั้น · W (⭐) แก้ได้ทุกด่าน · S (📏) ประกบมาตรการได้อีกแบบ
//
// เนื้อหา "รู้ไหม" เขียนเป็นหลักการทั่วไปที่ไม่ผูกกับนโยบายหรือราคาของปีใดปีหนึ่ง
// (ตัวเลขที่ยังเหลือ เช่น แอร์ 5–10% / LED 75% ควรให้ผู้เชี่ยวชาญตรวจอีกครั้งก่อนเผยแพร่จริง)

export type Icon = 'M' | 'K' | 'P' | 'E' | 'S'
export type KeyKind = Icon | 'W'
export type Cat = 'energy' | 'waste' | 'travel' | 'nature'
export type PItem = 'edu' | 'board' | 'net'
export type BItem = 'ad' | 'comfort' | 'red'
export type Side = 'P' | 'B'

export const ICON_IDS: Icon[] = ['M', 'K', 'P', 'E', 'S']

export const ICONS: Record<Icon, { emoji: string; name: string; fix: string }> = {
  M: { emoji: '💸', name: 'แพง', fix: 'คิดความคุ้ม' },
  K: { emoji: '❓', name: 'ไม่รู้วิธี', fix: 'ความรู้' },
  P: { emoji: '🙄', name: 'เคยชิน', fix: 'ชวนกัน' },
  E: { emoji: '🌀', name: 'ยุ่งยาก', fix: 'ทำให้ง่าย' },
  S: { emoji: '👀', name: 'มองไม่เห็นผล', fix: 'วัดผลให้เห็น' },
}

export const KEYS: Record<KeyKind, { emoji: string; name: string; hint: string }> = {
  M: { emoji: '💰', name: 'คิดความคุ้ม', hint: 'แก้ด่าน 💸 แพง' },
  K: { emoji: '📚', name: 'ความรู้', hint: 'แก้ด่าน ❓ ไม่รู้วิธี' },
  P: { emoji: '👥', name: 'ชวนกัน', hint: 'แก้ด่าน 🙄 เคยชิน' },
  E: { emoji: '🛠️', name: 'ทำให้ง่าย', hint: 'แก้ด่าน 🌀 ยุ่งยาก' },
  S: { emoji: '📏', name: 'วัดผลให้เห็น', hint: 'แก้ด่าน 👀 · ยกเลิกข่าวลือ · หรือประกบมาตรการ' },
  W: { emoji: '⭐', name: 'ทำให้ดูเป็นตัวอย่าง', hint: 'แก้ได้ทุกด่าน' },
}

export const CATS: Record<Cat, { emoji: string; name: string; color: string; tint: string; size: number }> = {
  energy: { emoji: '⚡', name: 'พลังงาน', color: '#b45309', tint: '#fff4d6', size: 4 },
  waste: { emoji: '♻️', name: 'ขยะ', color: '#15803d', tint: '#e8f8ec', size: 4 },
  travel: { emoji: '🚲', name: 'เดินทาง', color: '#0369a1', tint: '#e3f2fc', size: 3 },
  nature: { emoji: '🌳', name: 'ธรรมชาติ', color: '#0f766e', tint: '#e2f6f2', size: 3 },
}

export const ITEM_META: Record<PItem | BItem, { emoji: string; name: string; side: Side; desc: string }> = {
  edu: { emoji: '🏫', name: 'ศูนย์เรียนรู้', side: 'P', desc: 'ถือการ์ดในมือได้ 5 ใบ แทน 4' },
  board: { emoji: '📊', name: 'กระดานผลงาน', side: 'P', desc: 'ด่าน 👀 ไม่มีผลกับมาตรการของเรา' },
  net: { emoji: '🤝', name: 'เครือข่ายอาสา', side: 'P', desc: 'ทุกครั้งที่มาตรการถูกปิดสำเร็จ จั่วการ์ด 1 ใบ' },
  ad: { emoji: '📺', name: 'โฆษณา: ซื้อใหม่ดีกว่า', side: 'B', desc: 'ทุกตา คะแนนของฝ่ายผลักดัน −1 (ถ้ามีมาตรการบนโต๊ะ)' },
  comfort: { emoji: '🛋️', name: 'ความสบายแบบเดิม', side: 'B', desc: 'ด่าน 🙄 ต้องใช้ ⭐ เท่านั้นถึงแก้ได้ (👥 ใช้ไม่ได้)' },
  red: { emoji: '🧾', name: 'ขั้นตอนเยอะ', side: 'B', desc: 'มาตรการที่มี 🌀 ที่เพิ่งวางในตานี้ ยังไม่ได้แต้มตาที่วาง' },
}

export const P_ITEM_IDS: PItem[] = ['edu', 'board', 'net']
export const B_ITEM_IDS: BItem[] = ['ad', 'comfort', 'red']

export interface MeasureCard {
  id: number
  kind: 'measure'
  emoji: string
  name: string
  cat: Cat
  pts: number
  icons: Icon[]
  why: string
}
export interface KeyCard {
  id: number
  kind: 'key'
  k: KeyKind
}
export interface BlockCard {
  id: number
  kind: 'block'
  icons: Icon[]
  name: string
  why: string
}
export interface RumorCard {
  id: number
  kind: 'rumor'
  v: number
  emoji: string
  name: string
}
export type Card =
  | MeasureCard
  | KeyCard
  | BlockCard
  | RumorCard
  | { id: number; kind: 'media' }
  | { id: number; kind: 'search' }
  | { id: number; kind: 'pitem'; item: PItem }
  | { id: number; kind: 'bitem'; item: BItem }
  | { id: number; kind: 'wipe' }
  | { id: number; kind: 'freeze' }
  | { id: number; kind: 'scatter' }

type MeasureDef = Omit<MeasureCard, 'id' | 'kind'>

export const MEASURES: MeasureDef[] = [
  { emoji: '🔌', name: 'ปิดไฟ ถอดปลั๊ก', cat: 'energy', pts: 1, icons: ['P'], why: 'ทีวี คอมพิวเตอร์ และที่ชาร์จหลายชนิดยังกินไฟเล็กน้อยแม้ปิดเครื่อง ถ้ายังเสียบปลั๊กค้างไว้' },
  { emoji: '❄️', name: 'แอร์ 26 องศา + พัดลม', cat: 'energy', pts: 1, icons: ['P', 'E'], why: 'ตั้งแอร์สูงขึ้น 1 องศาประหยัดไฟได้ราว 5–10% พัดลมช่วยให้รู้สึกเย็นโดยใช้ไฟน้อยกว่าแอร์มาก' },
  { emoji: '💡', name: 'เปลี่ยนหลอด LED', cat: 'energy', pts: 2, icons: ['M', 'K'], why: 'หลอด LED ใช้ไฟน้อยกว่าหลอดไส้อย่างน้อย 75% และใช้งานได้นานกว่าราว 25 เท่า' },
  { emoji: '☀️', name: 'โซลาร์รูฟท็อป', cat: 'energy', pts: 3, icons: ['M', 'K', 'E'], why: 'แผงโซลาร์ผลิตไฟมากช่วงกลางวัน คุ้มที่สุดในที่ที่ใช้ไฟตอนกลางวันมาก เช่น สำนักงาน โรงเรียน' },
  { emoji: '🗑️', name: 'จุดแยกขยะ', cat: 'waste', pts: 1, icons: ['K', 'E'], why: 'ถ้าจุดทิ้งมีถังแยกครบและป้ายชัด คนจะแยกถูกมากขึ้นโดยไม่ต้องคิด' },
  { emoji: '🪱', name: 'หมักขยะอาหาร', cat: 'waste', pts: 2, icons: ['K', 'E', 'P'], why: 'ขยะอาหารที่เน่าโดยไม่มีอากาศเกิดก๊าซมีเทน กักความร้อนแรงกว่า CO₂ ราว 30 เท่าใน 100 ปี' },
  { emoji: '🏦', name: 'ธนาคารขยะ', cat: 'waste', pts: 2, icons: ['P', 'S'], why: 'ขยะรีไซเคิลที่สะอาดและแยกแล้วมีมูลค่า เปลี่ยนขยะเป็นเงินออมและดึงคนมาร่วมกัน' },
  { emoji: '🔧', name: 'ซ่อมก่อนซื้อใหม่', cat: 'waste', pts: 2, icons: ['K', 'P'], why: 'การผลิตของใหม่ใช้พลังงานและวัตถุดิบ ยืดอายุของใช้คือการลดคาร์บอนที่ประหยัดที่สุดวิธีหนึ่ง' },
  { emoji: '🚶', name: 'เดิน / ปั่นระยะใกล้', cat: 'travel', pts: 1, icons: ['E'], why: 'ระยะไม่กี่กิโลเมตร การเดินหรือปั่นไม่ปล่อยไอเสีย และได้ออกกำลังกาย' },
  { emoji: '🚌', name: 'ขนส่งสาธารณะ', cat: 'travel', pts: 2, icons: ['E', 'P'], why: 'รถโดยสารหนึ่งคันพาคนได้หลายสิบคน คาร์บอนต่อคนต่ำกว่ารถส่วนตัวมาก' },
  { emoji: '🔋', name: 'รถยนต์ไฟฟ้า', cat: 'travel', pts: 3, icons: ['M', 'E', 'S'], why: 'ไม่มีไอเสียจากท่อ และยิ่งไฟฟ้ามาจากพลังงานหมุนเวียนมาก คาร์บอนรวมยิ่งต่ำ' },
  { emoji: '🌾', name: 'ทำนาเปียกสลับแห้ง', cat: 'nature', pts: 3, icons: ['K', 'S', 'E'], why: 'นาที่ขังน้ำตลอดฤดูเกิดก๊าซมีเทน ปล่อยให้แห้งเป็นช่วงๆ ลดมีเทนได้มากและประหยัดน้ำ' },
  { emoji: '🏞️', name: 'ดูแลป่าชุมชน', cat: 'nature', pts: 3, icons: ['P', 'S', 'K'], why: 'ป่าที่สมบูรณ์เก็บคาร์บอนไว้ทั้งในต้นไม้และดิน การดูแลป่าเดิมสำคัญพอๆ กับการปลูกใหม่' },
  { emoji: '🦀', name: 'ปลูกป่าชายเลน', cat: 'nature', pts: 3, icons: ['P', 'S', 'M'], why: 'ป่าชายเลนเก็บคาร์บอนต่อพื้นที่ได้มากกว่าป่าบกหลายเท่า โดยเฉพาะในดิน และช่วยกันคลื่นกัดเซาะ' },
]

type BlockDef = { icons: Icon[]; name: string; why: string }

export const BLOCKS: BlockDef[] = [
  { icons: ['M'], name: 'ลงทุนสูง คืนทุนช้า', why: 'ของที่แพงตอนซื้อ อาจถูกที่สุดเมื่อคิดตลอดอายุการใช้งาน' },
  { icons: ['M'], name: 'ไม่ได้ตั้งงบไว้', why: 'โครงการที่ไม่มีงบตั้งแต่ต้นมักหยุดกลางทาง' },
  { icons: ['M'], name: 'ซื้อของถูกแต่ใช้ได้ไม่นาน', why: 'ของถูกที่พังเร็ว ทำให้ต้องซื้อใหม่ซ้ำและเกิดขยะ' },
  { icons: ['K'], name: 'ไม่รู้ว่าเริ่มตรงไหน', why: 'แค่ทำจริง 1 อย่างเล็กๆ ก่อน มักดีกว่าวางแผนใหญ่แต่ไม่เริ่ม' },
  { icons: ['K'], name: 'ไม่มีใครสอน', why: 'คนที่เคยทำมาแล้วมักช่วยลดเวลาลองผิดลองถูกได้มาก' },
  { icons: ['K'], name: 'ข้อมูลที่เจอขัดแย้งกัน', why: 'ข้อมูลที่ดูดีเกินจริงควรถามที่มา และเทียบอย่างน้อย 2 แหล่ง' },
  { icons: ['P'], name: 'ทำแบบเดิมก็ได้', why: 'นิสัยเปลี่ยนง่ายขึ้นเมื่อมีทางเลือกใหม่ให้เห็นและให้ลอง' },
  { icons: ['P'], name: 'ไม่มีใครทำ ทำไมฉันต้องทำ', why: 'คนมักทำตามคนรอบข้าง ถ้าเห็นเพื่อนทำก่อน ก็ตามง่ายขึ้น' },
  { icons: ['P'], name: 'ทำคนเดียวก็ไม่ช่วยอะไร', why: 'การกระทำเล็กๆ ของคนจำนวนมากรวมกันเป็นผลใหญ่' },
  { icons: ['E'], name: 'ขั้นตอนเยอะ', why: 'ทุกขั้นตอนที่ตัดออกได้หนึ่งขั้น ทำให้คนยอมทำต่อมากขึ้น' },
  { icons: ['E'], name: 'ไม่สะดวก ไม่มีที่วาง', why: 'ถ้าถังหรืออุปกรณ์อยู่ในที่ที่ใช้งานจริง คนจะใช้มากกว่า' },
  { icons: ['E'], name: 'ต้องเปลี่ยนระบบเดิมทั้งหมด', why: 'เปลี่ยนทีละส่วนมักได้ผลกว่าเปลี่ยนพร้อมกันทั้งระบบ' },
  { icons: ['S'], name: 'ไม่เห็นผลทันที', why: 'ผลลดคาร์บอนมักสะสมช้า การบันทึกช่วยให้เห็นการเปลี่ยนแปลง' },
  { icons: ['S'], name: 'ไม่มีตัวเลขยืนยัน', why: 'สิ่งที่วัดได้มักถูกทำต่อ สิ่งที่วัดไม่ได้มักถูกลืม' },
  { icons: ['M', 'E'], name: 'ต้องลงทุนและปรับระบบด้วย', why: 'โครงการใหญ่เจออุปสรรคหลายด้านพร้อมกัน แก้ทีละด่านได้' },
  { icons: ['P', 'K'], name: 'ไม่เข้าใจเลยไม่อยากเปลี่ยน', why: 'ความเข้าใจและความอยากเปลี่ยนมักมาพร้อมกัน' },
]

export const RUMORS: { v: number; emoji: string; name: string }[] = [
  { v: 12, emoji: '🎭', name: 'ฟอกเขียว' },
  { v: 8, emoji: '📱', name: 'ข่าวลือ' },
  { v: 4, emoji: '🤷', name: 'ไม่เชื่อว่าได้ผล' },
]

/** กุญแจในกองฝ่ายผลักดัน (ไม่รวม 📏 ที่เป็นการ์ดสองหน้าที่ แยกนับ 3 ใบ) */
export const KEY_COUNTS: Record<Exclude<KeyKind, 'S'>, number> = { M: 2, K: 2, P: 2, E: 1, W: 1 }

export const CONTRACTS = [
  { id: 'starter', emoji: '🌱', name: 'ชุมชนเริ่มต้น', target: 100, note: 'ฝ่ายผลักดันชนะราว 3 ใน 4 ของเกม' },
  { id: 'low', emoji: '🌿', name: 'ชุมชนคาร์บอนต่ำ', target: 150, note: 'สูสี ราวครึ่งต่อครึ่ง' },
  { id: 'model', emoji: '🌳', name: 'ชุมชนต้นแบบ', target: 200, note: 'ท้าทาย ฝ่ายผลักดันชนะราว 1 ใน 4' },
] as const
