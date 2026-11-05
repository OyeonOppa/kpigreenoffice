// การ์ดขยะของเกม "ส่งต่อขยะ" — 40 ใบ
//
// id ถังตรงกับ WASTE.bins ใน content.ts (organic / recycle / general / hazard)
// แต่ประกาศซ้ำไว้ตรงนี้ เพื่อให้ตัวเกม (engine) ทดสอบด้วย node ได้โดยไม่ต้องดึง content ทั้งก้อนมา
//
// image = รูปไอเท็มของเว็บที่มีอยู่แล้ว (public/images) ถ้าไม่มีรูปหรือโหลดไม่ได้ ใช้ emoji แทน

export type BinId = 'organic' | 'recycle' | 'general' | 'hazard'

export const BIN_IDS: BinId[] = ['organic', 'recycle', 'general', 'hazard']

export interface BinMeta {
  id: BinId
  name: string
  type: string
  /** รูปทรงกำกับสี — คนตาบอดสีแยกถังได้จากรูปทรง */
  shape: string
  color: string
  tint: string
  image: string
}

export const BINS: Record<BinId, BinMeta> = {
  organic: { id: 'organic', name: 'ถังเขียว', type: 'เศษอาหาร', shape: '●', color: '#16a34a', tint: '#eafbee', image: '/images/bin-organic.webp' },
  recycle: { id: 'recycle', name: 'ถังเหลือง', type: 'รีไซเคิล', shape: '▲', color: '#ca8a04', tint: '#fff8e1', image: '/images/bin-recycle.webp' },
  general: { id: 'general', name: 'ถังน้ำเงิน', type: 'ขยะทั่วไป', shape: '■', color: '#2563eb', tint: '#e8f0ff', image: '/images/bin-general.webp' },
  hazard: { id: 'hazard', name: 'ถังแดง', type: 'ขยะอันตราย', shape: '◆', color: '#dc2626', tint: '#ffeded', image: '/images/bin-hazard.webp' },
}

export interface ItemDef {
  key: string
  emoji: string
  image?: string
  name: string
  bin: BinId
  /** เหตุผลสั้นๆ ที่ขึ้นตอนเฉลย — เขียนเป็นหลักการทั่วไป ไม่ผูกกับกฎของพื้นที่ใดพื้นที่หนึ่ง */
  why: string
}

const O = 'organic' as const
const R = 'recycle' as const
const G = 'general' as const
const H = 'hazard' as const

export const ITEMS: ItemDef[] = [
  // ---- เขียว: เศษอาหาร (10) ----
  { key: 'banana', emoji: '🍌', image: '/images/item-banana-peel.webp', name: 'เปลือกกล้วย', bin: O, why: 'เศษผลไม้ย่อยสลายได้เอง นำไปหมักทำปุ๋ยได้' },
  { key: 'rice', emoji: '🍚', image: '/images/item-food-scraps.webp', name: 'เศษข้าว', bin: O, why: 'เศษอาหารย่อยสลายได้ แยกไว้แล้วหมักเป็นปุ๋ย' },
  { key: 'orange', emoji: '🍊', name: 'เปลือกส้ม', bin: O, why: 'เปลือกผลไม้เป็นขยะอินทรีย์ ย่อยสลายได้' },
  { key: 'chicken', emoji: '🍗', name: 'กระดูกไก่', bin: O, why: 'เศษอาหารจากสัตว์ก็เป็นขยะอินทรีย์ แต่ไม่เหมาะกับกองปุ๋ยหมักบ้านทั่วไป เพราะล่อสัตว์' },
  { key: 'veg', emoji: '🥬', name: 'เศษผัก', bin: O, why: 'เศษผักจากครัวย่อยสลายได้ดี เหมาะกับการหมักปุ๋ย' },
  { key: 'fishbone', emoji: '🐟', image: '/images/item-fish-bone.webp', name: 'ก้างปลา', bin: O, why: 'เศษอาหารจากสัตว์ ย่อยสลายได้ แยกใส่ถังเศษอาหาร' },
  { key: 'leaf', emoji: '🍂', image: '/images/item-dry-leaves.webp', name: 'ใบไม้แห้ง', bin: O, why: 'ใบไม้เป็นของธรรมชาติ ย่อยสลายได้ ไม่ควรเผา' },
  { key: 'coffee', emoji: '☕', image: '/images/item-coffee-grounds.webp', name: 'กากกาแฟ', bin: O, why: 'กากกาแฟย่อยสลายได้ ใช้ผสมดินปลูกต้นไม้ได้' },
  { key: 'egg', emoji: '🥚', image: '/images/item-egg-shell.webp', name: 'เปลือกไข่', bin: O, why: 'เปลือกไข่ย่อยสลายได้ และให้แคลเซียมแก่ดิน' },
  { key: 'melon', emoji: '🍉', name: 'เปลือกแตงโม', bin: O, why: 'เปลือกผลไม้เป็นขยะอินทรีย์ ย่อยสลายได้' },

  // ---- เหลือง: รีไซเคิล (11) ----
  { key: 'bottle', emoji: '🍾', image: '/images/item-plastic-bottle.webp', name: 'ขวดน้ำพลาสติกใส', bin: R, why: 'ขวดพลาสติกใสรีไซเคิลได้ เทน้ำออกและบีบแบนก่อนทิ้ง' },
  { key: 'can', emoji: '🥫', image: '/images/item-aluminum-can.webp', name: 'กระป๋องน้ำอัดลม', bin: R, why: 'อะลูมิเนียมรีไซเคิลได้ไม่จำกัดครั้ง และมีมูลค่า' },
  { key: 'box', emoji: '📦', image: '/images/item-carton-box.webp', name: 'กล่องกระดาษ', bin: R, why: 'กระดาษลังรีไซเคิลได้ พับให้แบนจะประหยัดที่' },
  { key: 'news', emoji: '📰', image: '/images/item-newspaper.webp', name: 'หนังสือพิมพ์', bin: R, why: 'กระดาษสะอาดรีไซเคิลได้ ควรเก็บให้แห้ง' },
  { key: 'glass', emoji: '🫙', image: '/images/item-glass-bottle.webp', name: 'ขวดแก้ว', bin: R, why: 'แก้วรีไซเคิลได้ ล้างให้สะอาด ระวังเศษแก้วแตก' },
  { key: 'a4', emoji: '📄', image: '/images/item-office-paper.webp', name: 'กระดาษ A4', bin: R, why: 'กระดาษสำนักงานรีไซเคิลได้ เอาลวดเย็บออกถ้าทำได้' },
  { key: 'oil', emoji: '🛢️', name: 'ขวดน้ำมันพืช', bin: R, why: 'ล้างคราบน้ำมันให้สะอาดแล้ว พลาสติกชนิดนี้รีไซเคิลได้' },
  { key: 'milkcan', emoji: '🥛', name: 'กระป๋องนมเปล่า', bin: R, why: 'กระป๋องโลหะรีไซเคิลได้ ล้างให้สะอาดก่อน' },
  { key: 'books', emoji: '📚', name: 'หนังสือเก่า', bin: R, why: 'กระดาษรีไซเคิลได้ ถ้ายังอ่านได้ ยกให้คนอื่นต่อดีกว่า' },
  { key: 'pet', emoji: '🥤', name: 'ขวดน้ำอัดลม PET', bin: R, why: 'พลาสติก PET เป็นชนิดที่รีไซเคิลได้ดีที่สุดชนิดหนึ่ง' },
  { key: 'uht', emoji: '🧃', image: '/images/item-uht-carton.webp', name: 'กล่องนมล้างสะอาด', bin: R, why: 'กล่องเครื่องดื่มรีไซเคิลได้ถ้าล้างและตากแห้ง ถ้ายังเปื้อนจะกลายเป็นขยะทั่วไป' },

  // ---- น้ำเงิน: ขยะทั่วไป (10) ----
  { key: 'snack', emoji: '🍿', image: '/images/item-snack-wrapper.webp', name: 'ถุงขนมเปื้อน', bin: G, why: 'ถุงพลาสติกหลายชั้นเคลือบฟอยล์ รีไซเคิลได้ยากและเปื้อนอาหาร' },
  { key: 'cup', emoji: '🥡', image: '/images/item-paper-cup.webp', name: 'แก้วกาแฟเปื้อน', bin: G, why: 'แก้วกระดาษเคลือบพลาสติกและเปื้อนเครื่องดื่ม แยกรีไซเคิลยาก' },
  { key: 'tissue', emoji: '🧻', image: '/images/item-used-tissue.webp', name: 'ทิชชู่ใช้แล้ว', bin: G, why: 'กระดาษที่เปื้อนแล้วเยื่อสั้น รีไซเคิลไม่ได้' },
  { key: 'foam', emoji: '🍱', image: '/images/item-foam-box.webp', name: 'โฟมใส่อาหาร', bin: G, why: 'โฟมแตกเป็นเม็ดเล็ก เปื้อนอาหาร รีไซเคิลยากมาก' },
  { key: 'bag', emoji: '🛍️', image: '/images/item-dirty-plastic-bag.webp', name: 'ถุงพลาสติกเปื้อน', bin: G, why: 'ถุงที่เปื้อนอาหารล้างยาก รีไซเคิลไม่คุ้ม' },
  { key: 'straw', emoji: '🥢', image: '/images/item-plastic-straw.webp', name: 'หลอดดูด', bin: G, why: 'ชิ้นเล็กเกินกว่าจะคัดแยกรีไซเคิล' },
  { key: 'noodle', emoji: '🍜', name: 'ซองบะหมี่', bin: G, why: 'ซองหลายชั้นเปื้อนเครื่องปรุง รีไซเคิลยาก' },
  { key: 'brush', emoji: '🪥', name: 'แปรงสีฟันเก่า', bin: G, why: 'ทำจากวัสดุหลายชนิดผสมกัน แยกรีไซเคิลไม่ได้' },
  { key: 'yogurt', emoji: '🍦', name: 'ถ้วยโยเกิร์ตเปื้อน', bin: G, why: 'ถ้ายังมีคราบอาหาร รีไซเคิลไม่ได้ ล้างให้สะอาดจึงจะย้ายไปถังเหลืองได้' },
  { key: 'sponge', emoji: '🧽', name: 'ฟองน้ำล้างจาน', bin: G, why: 'วัสดุสังเคราะห์เปื้อนสบู่และคราบ รีไซเคิลไม่ได้' },

  // ---- แดง: ขยะอันตราย (9) ----
  { key: 'battery', emoji: '🔋', image: '/images/item-battery.webp', name: 'ถ่านไฟฉาย', bin: H, why: 'มีโลหะหนัก ห้ามทิ้งปนขยะทั่วไป ต้องนำไปจุดรับขยะอันตราย' },
  { key: 'bulb', emoji: '💡', image: '/images/item-broken-bulb.webp', name: 'หลอดไฟ', bin: H, why: 'หลอดบางชนิดมีสารปรอท ห่อให้มิดชิดก่อนทิ้ง' },
  { key: 'spray', emoji: '🧴', image: '/images/item-spray-can.webp', name: 'กระป๋องสเปรย์', bin: H, why: 'ภาชนะอัดแรงดันอาจระเบิดได้ และมีสารเคมีตกค้าง' },
  { key: 'pest', emoji: '☠️', image: '/images/item-insecticide-can.webp', name: 'ขวดยาฆ่าแมลง', bin: H, why: 'สารเคมีอันตรายต่อคนและสัตว์ ห้ามเทลงท่อหรือทิ้งทั่วไป' },
  { key: 'medicine', emoji: '💊', image: '/images/item-expired-medicine.webp', name: 'ยาหมดอายุ', bin: H, why: 'ยาเป็นสารเคมี ทิ้งผิดที่ปนเปื้อนดินและน้ำ' },
  { key: 'phonebat', emoji: '📱', name: 'แบตเตอรี่มือถือ', bin: H, why: 'แบตลิเธียมอาจลุกไหม้เมื่อถูกบีบอัดในรถขยะ ต้องแยกทิ้ง' },
  { key: 'mercury', emoji: '🌡️', name: 'เทอร์โมมิเตอร์ปรอท', bin: H, why: 'ปรอทเป็นพิษ ห้ามทิ้งปนขยะทั่วไป' },
  { key: 'toner', emoji: '🖨️', image: '/images/item-toner-cartridge.webp', name: 'ตลับหมึกพิมพ์', bin: H, why: 'ผงหมึกและสารเคมีตกค้าง ควรส่งคืนผู้ผลิตหรือจุดรับเฉพาะ' },
  { key: 'paint', emoji: '🎨', name: 'กระป๋องสีทาบ้าน', bin: H, why: 'สีมีตัวทำละลายและสารเคมี ห้ามเทลงท่อ' },
]

/** จำนวนการ์ดในแต่ละถังของกองเต็ม 40 ใบ — บอทใช้นับไพ่ */
export const BIN_TOTALS: Record<BinId, number> = ITEMS.reduce(
  (acc, it) => {
    acc[it.bin]++
    return acc
  },
  { organic: 0, recycle: 0, general: 0, hazard: 0 } as Record<BinId, number>,
)
