// คลังคำถามเกมแยกขยะแข่งสด — **อยู่ฝั่งเซิร์ฟเวอร์เท่านั้น**
//
// ไฟล์นี้มีคำเฉลย จึงต้องไม่ถูก bundle ไปกับเว็บ
// เครื่องผู้เล่นจะได้รับแค่ชื่อ/รูปของขยะตอนข้อเริ่ม และได้คำเฉลย+คำอธิบายตอนหมดเวลาแล้ว
// เปิด DevTools ยังไงก็ไม่เห็นคำตอบล่วงหน้า
//
// TODO: ให้หน่วยงานตรวจทานคำเฉลยและคำอธิบายก่อนใช้งานจริง
// คำเฉลยอิงระบบถังขยะ 4 สีมาตรฐาน (อินทรีย์ / รีไซเคิล / ทั่วไป / อันตราย)
// ข้อที่ทำเครื่องหมาย checkLocal ไว้ คำตอบขึ้นกับว่าหน่วยงานมี "จุดรับเฉพาะ" หรือไม่
//
// image: ถ้ายังไม่มีไฟล์ เว็บจะ fallback ไปแสดง emoji อัตโนมัติ
// วางไฟล์เพิ่มที่ public/images/<ชื่อไฟล์> แล้วรูปจะขึ้นแทน emoji เอง

import type { BinId } from './protocol'

export interface Question {
  id: string
  emoji: string
  image: string
  name: string
  bin: BinId
  explanation: string
  checkLocal?: boolean
}

export const QUESTIONS: Question[] = [
  // ---- ถังเขียว: ขยะอินทรีย์ ----
  {
    id: 'banana-peel',
    emoji: '🍌',
    image: '/images/item-banana-peel.webp',
    name: 'เปลือกกล้วย',
    bin: 'organic',
    explanation:
      'เปลือกผลไม้ย่อยสลายเองได้ภายในไม่กี่สัปดาห์ และนำไปหมักเป็นปุ๋ยต่อได้ ถ้าทิ้งปนไปกับขยะทั่วไปจะถูกส่งไปฝังกลบ แล้วย่อยสลายแบบไร้ออกซิเจนจนเกิดก๊าซมีเทน ซึ่งทำให้โลกร้อนแรงกว่าคาร์บอนไดออกไซด์หลายเท่า',
  },
  {
    id: 'food-scraps',
    emoji: '🍚',
    image: '/images/item-food-scraps.webp',
    name: 'เศษอาหาร',
    bin: 'organic',
    explanation:
      'เศษอาหารเป็นขยะอินทรีย์ที่หมักเป็นปุ๋ยหรือนำไปเลี้ยงสัตว์ต่อได้ เคล็ดลับคือเทน้ำแกงหรือน้ำซุปออกก่อนทิ้ง จะช่วยลดกลิ่น ลดน้ำหนักขยะ และทำให้ถังไม่แฉะจนดึงดูดแมลง',
  },
  {
    id: 'dry-leaves',
    emoji: '🍃',
    image: '/images/item-dry-leaves.webp',
    name: 'ใบไม้แห้ง',
    bin: 'organic',
    explanation:
      'ใบไม้แห้งเป็นวัสดุหมักปุ๋ยชั้นดี ทำหน้าที่เป็นส่วนสีน้ำตาลที่ช่วยให้กองปุ๋ยไม่แฉะและไม่ส่งกลิ่น ควรทิ้งลงถังเขียวหรือกองหมักในพื้นที่ ไม่ควรเผา เพราะการเผาใบไม้ปล่อยทั้งฝุ่น PM2.5 และคาร์บอน',
  },
  {
    id: 'egg-shell',
    emoji: '🥚',
    image: '/images/item-egg-shell.webp',
    name: 'เปลือกไข่',
    bin: 'organic',
    explanation:
      'เปลือกไข่ย่อยสลายได้และมีแคลเซียมสูง บดละเอียดแล้วผสมลงดินช่วยบำรุงต้นไม้ได้เลย จึงถือเป็นขยะอินทรีย์ ไม่ใช่ขยะทั่วไปอย่างที่หลายคนเข้าใจ',
  },
  {
    id: 'coffee-grounds',
    emoji: '☕',
    image: '/images/item-coffee-grounds.webp',
    name: 'กากกาแฟ',
    bin: 'organic',
    explanation:
      'กากกาแฟย่อยสลายได้และเป็นวัสดุหมักปุ๋ยที่ให้ไนโตรเจนสูง จะใช้ดับกลิ่นในตู้เย็นหรือโรยรอบต้นไม้ก็ได้ ส่วนแก้วหรือแคปซูลพลาสติกที่ติดมาด้วยต้องแยกออกก่อน',
  },
  {
    id: 'fish-bone',
    emoji: '🐟',
    image: '/images/item-fish-bone.webp',
    name: 'ก้างปลาและเศษเนื้อ',
    bin: 'organic',
    explanation:
      'ก้างปลาและเศษเนื้อเป็นขยะอินทรีย์เช่นเดียวกับเศษอาหาร แต่เน่าเร็วและกลิ่นแรงกว่า ควรใส่ถุงมัดปากให้แน่นก่อนทิ้งลงถังเขียว เพื่อกันกลิ่นและกันสัตว์มาคุ้ยถัง',
  },

  // ---- ถังเหลือง: ขยะรีไซเคิล ----
  {
    id: 'plastic-bottle',
    emoji: '🥤',
    image: '/images/item-plastic-bottle.webp',
    name: 'ขวดน้ำพลาสติกใส',
    bin: 'recycle',
    explanation:
      'ขวดใสชนิด PET เป็นพลาสติกที่รีไซเคิลได้ราคาดีที่สุด ก่อนทิ้งควรเทน้ำออก ลอกฉลาก แยกฝา แล้วบีบให้แบน จะได้ทั้งลดพื้นที่ในถังและเพิ่มมูลค่าให้คนที่รับไปขายต่อ',
  },
  {
    id: 'newspaper',
    emoji: '📰',
    image: '/images/item-newspaper.webp',
    name: 'กระดาษหนังสือพิมพ์',
    bin: 'recycle',
    explanation:
      'กระดาษรีไซเคิลได้หลายรอบก่อนที่เส้นใยจะสั้นเกินใช้งาน เงื่อนไขสำคัญคือต้องแห้งและไม่เปื้อนอาหารหรือน้ำมัน เพราะคราบมันทำให้กระดาษทั้งมัดเข้ากระบวนการผลิตเยื่อไม่ได้',
  },
  {
    id: 'aluminum-can',
    emoji: '🥫',
    image: '/images/item-aluminum-can.webp',
    name: 'กระป๋องอะลูมิเนียม',
    bin: 'recycle',
    explanation:
      'อะลูมิเนียมรีไซเคิลได้โดยคุณภาพไม่ลดลง และการหลอมกระป๋องเก่าใช้พลังงานน้อยกว่าการถลุงแร่ใหม่อย่างมาก จึงเป็นขยะที่มีมูลค่าสูงที่สุดชนิดหนึ่งในถังเหลือง',
  },
  {
    id: 'glass-bottle',
    emoji: '🍾',
    image: '/images/item-glass-bottle.webp',
    name: 'ขวดแก้ว',
    bin: 'recycle',
    explanation:
      'แก้วหลอมกลับมาใช้ใหม่ได้โดยไม่เสียคุณภาพ ควรแยกฝาโลหะหรือฝาพลาสติกออกก่อน ส่วนขวดที่แตกแล้วให้ห่อกระดาษหนาแล้วเขียนกำกับว่าแก้วแตก เพื่อไม่ให้คนเก็บขยะบาดมือ',
  },
  {
    id: 'carton-box',
    emoji: '📦',
    image: '/images/item-carton-box.webp',
    name: 'กล่องกระดาษลัง',
    bin: 'recycle',
    explanation:
      'กล่องลังเป็นกระดาษคราฟท์ที่โรงงานเยื่อรับซื้อ ควรลอกเทปกาวออกและพับให้แบนก่อนทิ้ง เพราะกล่องที่ยังเป็นทรงกินพื้นที่ในถังและในรถขนส่งเกินความจำเป็น',
  },
  {
    id: 'office-paper',
    emoji: '📄',
    image: '/images/item-office-paper.webp',
    name: 'กระดาษ A4 ใช้แล้ว',
    bin: 'recycle',
    explanation:
      'กระดาษสำนักงานรีไซเคิลได้ และเป็นขยะที่ออฟฟิศสร้างมากที่สุด ลำดับที่ดีที่สุดคือใช้ให้ครบสองหน้าก่อนแล้วค่อยรวมเข้าถังเหลือง ส่วนเอกสารที่มีข้อมูลส่วนบุคคลต้องทำลายด้วยเครื่องย่อยก่อนเสมอ',
  },
  {
    id: 'uht-carton',
    emoji: '🥛',
    image: '/images/item-uht-carton.webp',
    name: 'กล่องนม UHT',
    bin: 'recycle',
    checkLocal: true,
    explanation:
      'กล่องนม UHT ประกอบด้วยกระดาษ พลาสติก และฟอยล์อัดซ้อนกัน แยกชั้นได้ในโรงงานเฉพาะทางและแปรรูปเป็นแผ่นหลังคาหรือแผ่นไม้อัดได้ ก่อนทิ้งต้องล้าง ผ่าแบน และตากให้แห้ง แต่ต้องมีจุดรับที่ส่งต่อโรงงานได้จริง ถ้าที่ทำงานยังไม่มีจุดรับ กล่องนมจะกลายเป็นขยะทั่วไปทันที',
  },

  // ---- ถังน้ำเงิน: ขยะทั่วไป ----
  {
    id: 'snack-wrapper',
    emoji: '🍬',
    image: '/images/item-snack-wrapper.webp',
    name: 'ซองขนม',
    bin: 'general',
    explanation:
      'ซองขนมดูเหมือนพลาสติก แต่จริงๆ เป็นวัสดุหลายชั้นที่มีทั้งพลาสติกและฟอยล์อัดติดกัน แยกชั้นออกจากกันไม่ได้ในเชิงพาณิชย์ จึงรีไซเคิลไม่ได้และต้องเข้าถังขยะทั่วไป',
  },
  {
    id: 'used-tissue',
    emoji: '🧻',
    image: '/images/item-used-tissue.webp',
    name: 'ทิชชูใช้แล้ว',
    bin: 'general',
    explanation:
      'ทิชชูทำจากเส้นใยกระดาษที่สั้นมากอยู่แล้ว รีไซเคิลต่อไม่ได้ และเมื่อใช้แล้วยังปนเปื้อนสิ่งสกปรก จึงต้องทิ้งถังทั่วไป ไม่ใช่ถังกระดาษรีไซเคิล',
  },
  {
    id: 'foam-box',
    emoji: '🍱',
    image: '/images/item-foam-box.webp',
    name: 'กล่องโฟมใส่อาหาร',
    bin: 'general',
    explanation:
      'โฟมที่เปื้อนน้ำมันและเศษอาหารแทบไม่มีโรงงานรับรีไซเคิล เพราะล้างยากและน้ำหนักเบาจนขนส่งไม่คุ้ม ทางออกที่ดีกว่าคือเลี่ยงตั้งแต่ต้นทางด้วยการพกกล่องข้าวของตัวเอง',
  },
  {
    id: 'plastic-straw',
    emoji: '🥢',
    image: '/images/item-plastic-straw.webp',
    name: 'หลอดพลาสติก',
    bin: 'general',
    explanation:
      'หลอดเป็นพลาสติกก็จริง แต่ชิ้นเล็กเกินกว่าที่เครื่องคัดแยกในโรงงานจะจับได้ มักร่วงหลุดจากสายพานและปนเปื้อนน้ำหวานอยู่แล้ว จึงถือเป็นขยะทั่วไป',
  },
  {
    id: 'paper-cup',
    emoji: '🧋',
    image: '/images/item-paper-cup.webp',
    name: 'แก้วกาแฟกระดาษ',
    bin: 'general',
    explanation:
      'แก้วกาแฟกระดาษเคลือบฟิล์มพลาสติกบางๆ ด้านในเพื่อกันน้ำซึม ทำให้แยกเยื่อกระดาษออกมาไม่ได้ด้วยกระบวนการปกติ ถ้าอยากลดขยะจุดนี้จริงๆ แก้วส่วนตัวคือคำตอบที่ได้ผลที่สุด',
  },
  {
    id: 'dirty-plastic-bag',
    emoji: '🛍️',
    image: '/images/item-dirty-plastic-bag.webp',
    name: 'ถุงพลาสติกเปื้อนอาหาร',
    bin: 'general',
    explanation:
      'ถุงพลาสติกที่สะอาดและแห้งรีไซเคิลได้ แต่พอเปื้อนน้ำแกงหรือเศษอาหารแล้วจะทำให้พลาสติกทั้งล็อตเสีย จึงต้องเข้าถังทั่วไป ถ้าล้างและตากแห้งได้ก็ย้ายกลับไปถังเหลืองได้',
  },
  {
    id: 'broken-ceramic',
    emoji: '🍽️',
    image: '/images/item-broken-ceramic.webp',
    name: 'จานเซรามิกแตก',
    bin: 'general',
    explanation:
      'เซรามิกไม่ใช่แก้ว จุดหลอมเหลวต่างกันมาก ถ้าปนเข้าไปในเตาหลอมแก้วจะทำให้แก้วทั้งเตาเสีย จึงต้องทิ้งถังทั่วไป และควรห่อให้มิดชิดพร้อมเขียนกำกับกันคนเก็บขยะบาดมือ',
  },
  {
    id: 'bubble-foam',
    emoji: '📮',
    image: '/images/item-bubble-foam.webp',
    name: 'โฟมกันกระแทก',
    bin: 'general',
    explanation:
      'โฟมกันกระแทกเป็นอากาศเกือบทั้งชิ้น น้ำหนักเบาจนค่าขนส่งแพงกว่ามูลค่าวัสดุ แทบไม่มีจุดรับรีไซเคิล ทางที่ดีกว่าคือเก็บไว้ใช้ซ้ำตอนส่งพัสดุครั้งถัดไป',
  },

  // ---- ถังแดง: ขยะอันตราย ----
  {
    id: 'battery',
    emoji: '🔋',
    image: '/images/item-battery.webp',
    name: 'ถ่านไฟฉาย',
    bin: 'hazard',
    explanation:
      'ถ่านมีโลหะหนักอยู่ข้างใน ถ้าทิ้งรวมแล้วไปฝังกลบ เปลือกจะผุตามเวลาและสารเหล่านี้จะรั่วลงดินและน้ำใต้ดิน ต้องแยกเข้าถังแดงเสมอ ห้ามทิ้งรวมกับขยะทั่วไป',
  },
  {
    id: 'broken-bulb',
    emoji: '💡',
    image: '/images/item-broken-bulb.webp',
    name: 'หลอดไฟเสีย',
    bin: 'hazard',
    explanation:
      'หลอดฟลูออเรสเซนต์และหลอดตะเกียบมีไอปรอทอยู่ข้างใน ถ้าแตกในที่ปิดจะฟุ้งเป็นอันตรายต่อระบบประสาท ต้องใส่กล่องเดิมหรือห่อกระดาษหนาก่อนทิ้งถังแดง และห้ามทุบให้แตกเด็ดขาด',
  },
  {
    id: 'spray-can',
    emoji: '🧴',
    image: '/images/item-spray-can.webp',
    name: 'กระป๋องสเปรย์',
    bin: 'hazard',
    explanation:
      'กระป๋องสเปรย์แม้ใช้จนหมดก็ยังมีแรงดันและสารไวไฟค้างอยู่ ถ้าถูกบีบอัดในรถขยะหรือโดนความร้อนอาจระเบิดได้ จึงต้องแยกเข้าถังแดง ไม่ใช่ถังโลหะรีไซเคิลอย่างที่หลายคนคิด',
  },
  {
    id: 'old-phone',
    emoji: '📱',
    image: '/images/item-old-phone.webp',
    name: 'มือถือเก่า',
    bin: 'hazard',
    checkLocal: true,
    explanation:
      'มือถือเป็นขยะอิเล็กทรอนิกส์ที่มีทั้งของมีค่าอย่างทองแดง และของอันตรายอย่างตะกั่วกับลิเทียมในแบตเตอรี่ ต้องส่งเข้าจุดรับ e-waste เพื่อถอดแยกอย่างถูกวิธี และควรล้างข้อมูลในเครื่องก่อนส่งต่อทุกครั้ง',
  },
  {
    id: 'expired-medicine',
    emoji: '💊',
    image: '/images/item-expired-medicine.webp',
    name: 'ยาหมดอายุ',
    bin: 'hazard',
    explanation:
      'ยาหมดอายุห้ามทิ้งรวมกับขยะทั่วไปและห้ามเทลงชักโครกเด็ดขาด เพราะตัวยาจะปนเปื้อนแหล่งน้ำและเร่งให้เชื้อดื้อยา ควรเข้าถังแดงหรือคืนร้านยาที่มีจุดรับ',
  },
  {
    id: 'correction-fluid',
    emoji: '🖊️',
    image: '/images/item-correction-fluid.webp',
    name: 'น้ำยาลบคำผิด',
    bin: 'hazard',
    explanation:
      'น้ำยาลบคำผิดมีตัวทำละลายอินทรีย์ที่ระเหยเป็นไอและเป็นพิษเมื่อสูดดมสะสม ขวดที่ใช้หมดแล้วยังมีสารตกค้าง จึงจัดเป็นขยะอันตรายของสำนักงาน ไม่ใช่ขยะทั่วไป',
  },
  {
    id: 'toner-cartridge',
    emoji: '🖨️',
    image: '/images/item-toner-cartridge.webp',
    name: 'ตลับหมึกพิมพ์',
    bin: 'hazard',
    checkLocal: true,
    explanation:
      'ผงหมึกเป็นผงเคมีละเอียดที่ฟุ้งเข้าปอดได้ และตลับยังมีชิ้นส่วนอิเล็กทรอนิกส์อยู่ข้างใน หลายยี่ห้อมีโครงการรับตลับเปล่าคืนไปเติมใหม่ ซึ่งดีกว่าทิ้งทั้งชิ้น',
  },
  {
    id: 'old-adapter',
    emoji: '🔌',
    image: '/images/item-old-adapter.webp',
    name: 'สายชาร์จและอะแดปเตอร์เก่า',
    bin: 'hazard',
    checkLocal: true,
    explanation:
      'สายไฟและอะแดปเตอร์เป็นขยะอิเล็กทรอนิกส์ ข้างในมีทองแดงที่รีไซเคิลได้ และมีสารหน่วงไฟกับตะกั่วบัดกรีที่เป็นอันตราย ต้องเข้าจุดรับ e-waste ไม่ใช่ถังโลหะรวม',
  },
  {
    id: 'insecticide-can',
    emoji: '🦟',
    image: '/images/item-insecticide-can.webp',
    name: 'กระป๋องยาฆ่าแมลง',
    bin: 'hazard',
    explanation:
      'ยาฆ่าแมลงมีสารกำจัดศัตรูพืชที่เป็นพิษต่อทั้งคนและสัตว์น้ำ แม้กระป๋องจะดูว่างเปล่าแต่ยังมีสารตกค้างและแรงดันเหลืออยู่ ต้องแยกเข้าถังแดงทุกครั้ง',
  },
]

const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]))

export function getQuestion(id: string): Question {
  const q = BY_ID.get(id)
  if (!q) throw new Error(`ไม่พบคำถาม id: ${id}`)
  return q
}

/** สุ่มแบบมี seed — ห้อง PIN เดียวกันได้ชุดคำถามเดียวกันเสมอ ต่อให้ DO ถูกสร้างใหม่ */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFrom(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * เลือกคำถามหนึ่งเกม — คละให้ทั้ง 4 ถังมีสัดส่วนใกล้เคียงกัน
 * สุ่มล้วนอาจได้ถังแดง 8 ข้อจาก 15 ซึ่งเดาง่ายเกินไป
 */
export function pickQuestions(seedText: string, count: number): string[] {
  const rand = mulberry32(seedFrom(seedText))
  const shuffle = <T,>(arr: T[]) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const byBin = new Map<BinId, Question[]>()
  for (const q of QUESTIONS) {
    const list = byBin.get(q.bin) ?? []
    list.push(q)
    byBin.set(q.bin, list)
  }

  const pools = [...byBin.values()].map((list) => shuffle(list))
  const picked: Question[] = []
  let i = 0
  while (picked.length < count && pools.some((p) => p.length > 0)) {
    const next = pools[i % pools.length].pop()
    if (next) picked.push(next)
    i++
  }

  return shuffle(picked)
    .slice(0, count)
    .map((q) => q.id)
}
