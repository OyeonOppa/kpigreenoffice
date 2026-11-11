// หน้าการ์ดของเกม "ฝ่าด่านลดคาร์บอน" ให้เหมือนการ์ดพิมพ์
//
// ข้อความ สี และโครงการ์ดทุกอย่างคัดมาจาก docs/game-prototypes/cards/carbon-duel-cards.html
// ถ้าแก้ข้อความบนการ์ดพิมพ์ ให้แก้ที่นี่ด้วย เพื่อให้การ์ดบนเว็บกับการ์ดที่พิมพ์ตรงกัน

import { CATS, ICONS, ITEM_META, KEYS, type Card, type Icon } from './cards'

export interface Face {
  /** measure/block/key มีรูปแบบเฉพาะ · simple = อีโมจิ ชื่อ ตัวใหญ่ คำอธิบาย */
  variant: 'measure' | 'block' | 'key' | 'simple'
  c: string
  t: string
  tag: string
  emoji: string
  name: string
  big?: string
  desc?: string
  foot?: string
  icons?: Icon[]
  /** วิธีใช้ (กุญแจ/ด่าน) */
  how?: string
  /** ตัวอย่าง (กุญแจ) / รู้ไหม (ด่าน) */
  ex?: string
  /** กุญแจ: ด่านที่แก้ได้ (ว่าง = ทุกด่าน) */
  from?: Icon
}

const B_TONE = { c: '#5b6670', t: '#f1f3f5' }
const KEY_TONE = { c: '#7c3aed', t: '#f5f0ff' }
const RED = { c: '#b91c1c', t: '#fdecec' }
const ITEM_P = { c: '#d97706', t: '#fff7e6' }
const ITEM_B = { c: '#b45309', t: '#fff3e0' }
const FOOT_P = 'วางแล้วอยู่ทั้งเกม ปิดหรือล้างไม่ได้ · เลือกเริ่มเกมได้ 1 จาก 3'
const FOOT_B = 'วางแล้วอยู่ทั้งเกม · เลือกเริ่มเกมได้ 1 จาก 3'

const KEY_EX = {
  M: 'เช่น คิดค่าใช้จ่ายตลอดอายุ',
  K: 'เช่น อบรมสั้นๆ',
  P: 'เช่น ชวนเพื่อนบ้าน',
  E: 'เช่น วางไว้ใกล้มือ',
  S: 'เช่น จดค่าไฟทุกเดือน · ชั่งขยะ · ติดกราฟ',
  W: 'เช่น ผู้นำทำก่อน',
} as const

const ITEM_TEXT = {
  edu: { big: 'ถือการ์ดได้ 5 ใบ', desc: 'เมื่อคนได้เห็นตัวอย่างจริงและเรียนรู้ร่วมกัน การเปลี่ยนแปลงขยายได้เร็วกว่าทำคนเดียว' },
  board: { big: 'ด่าน 👀 ไม่มีผลกับเรา', desc: 'เมื่อทุกคนเห็นตัวเลขผลงานจริง คนจะเชื่อและทำต่อมากขึ้น' },
  net: { big: 'มาตรการถูกปิด → จั่ว 1', desc: 'ทุกครั้งที่มาตรการถูกปิดสำเร็จ (เราตอบโต้ไม่ได้) จั่วการ์ด 1 ใบ เพราะคนที่เคยลองมักมีอะไรให้แบ่งปัน' },
  ad: { big: 'ทุกตา −1 แต้ม', desc: 'คะแนนของฝ่ายผลักดัน −1 ทุกตาที่มีมาตรการบนโต๊ะ' },
  comfort: { big: 'ด่าน 🙄 ต้องใช้ ⭐', desc: 'ด่าน 🙄 ต้องใช้ ⭐ เท่านั้นถึงตอบโต้ได้ (👥 ใช้ไม่ได้)' },
  red: { big: 'มี 🌀 = ไม่ได้แต้มตาแรก', desc: 'มาตรการที่มี 🌀 ที่เพิ่งวางในตานี้ ยังไม่ได้แต้มในตาที่วาง' },
} as const

export function cardFace(card: Card): Face {
  switch (card.kind) {
    case 'measure': {
      const cat = CATS[card.cat]
      return { variant: 'measure', c: cat.color, t: cat.tint, tag: `มาตรการ ${cat.emoji} ${cat.name}`, emoji: card.emoji, name: card.name, big: `${card.pts} แต้ม/ตา`, icons: card.icons, desc: card.why }
    }
    case 'key': {
      const k = KEYS[card.k]
      const how =
        card.k === 'S'
          ? 'ใช้ได้ 2 แบบ ① ทิ้งเพื่อยกเลิกด่าน 👀 หรือข่าวลือ ② ประกบมาตรการ +1 แต้ม/ตา และกัน “เปลี่ยนคนทำ”'
          : card.k === 'W'
            ? 'ทิ้งใบนี้เมื่อถูกปิดด้วยด่านแบบไหนก็ได้ แทนกุญแจชนิดใดก็ได้'
            : `ทิ้งใบนี้เมื่อถูกปิดด้วยด่าน ${ICONS[card.k as Icon].emoji} เพื่อยกเลิกการปิด`
      return {
        variant: 'key',
        ...KEY_TONE,
        tag: 'กุญแจ',
        emoji: k.emoji,
        name: card.k === 'S' ? 'วัดผลให้เห็น' : k.name,
        how,
        ex: KEY_EX[card.k],
        from: card.k === 'W' ? undefined : (card.k as Icon),
      }
    }
    case 'block':
      return { variant: 'block', ...B_TONE, tag: 'ด่าน', emoji: '', name: card.name, icons: card.icons, how: 'ปิดมาตรการที่มีไอคอนนี้ และเพิ่งวางในตานี้', ex: card.why }
    case 'media':
      return { variant: 'simple', c: '#0ea5e9', t: '#e6f6fe', tag: 'ตัวเสริม', emoji: '📰', name: 'ออกสื่อ', big: '+1 แต้ม/ตา', desc: 'ประกบมาตรการ 1 ใบ ยิ่งคนรู้ ยิ่งมีคนทำตาม', foot: 'ถูกทิ้งพร้อมมาตรการถ้ามาตรการถูกปิด' }
    case 'search':
      return { variant: 'simple', c: '#0f766e', t: '#e6f7f4', tag: 'พิเศษ', emoji: '🔍', name: 'สำรวจก่อนทำ', big: 'เล่นฟรี ไม่เสียตา', desc: 'เปิดดูด่านคว่ำของฝ่ายต่อต้าน แล้วทิ้งด่านนั้น' }
    case 'pitem': {
      const m = ITEM_META[card.item]
      return { variant: 'simple', ...ITEM_P, tag: 'ไอเท็มถาวร', emoji: m.emoji, name: m.name, ...ITEM_TEXT[card.item as 'edu'], foot: FOOT_P }
    }
    case 'bitem': {
      const m = ITEM_META[card.item]
      return { variant: 'simple', ...ITEM_B, tag: 'ไอเท็มถาวร', emoji: m.emoji, name: m.name, ...ITEM_TEXT[card.item as 'ad'], foot: FOOT_B }
    }
    case 'rumor':
      return { variant: 'simple', ...RED, tag: 'พิเศษ · หักแต้ม', emoji: card.emoji, name: card.name, big: `−${card.v} แต้ม`, desc: `${card.note} → หักคะแนนรวมทันที ฝ่ายผลักดันทิ้ง 📏 จากมือ 1 ใบเพื่อยกเลิกได้` }
    case 'wipe':
      return { variant: 'simple', ...RED, tag: 'พิเศษ · ล้างกระดาน', emoji: '📉', name: 'เปลี่ยนคนทำ ไม่มีใครสานต่อ', desc: 'ทิ้งทุกมาตรการบนโต๊ะที่ไม่มี 📏 ประกบ และไม่ได้อยู่ในหมวดที่ครบ 3 ใบ (ตัวเสริมทิ้งตามไป) ยกเลิกไม่ได้' }
    case 'freeze':
      return { variant: 'simple', ...RED, tag: 'พิเศษ', emoji: '✂️', name: 'ตัดงบกลางปี', desc: 'ตาถัดไปฝ่ายผลักดันวางการ์ดไม่ได้ และต้องทิ้งการ์ดในมือรวม 2 ใบ' }
    case 'scatter':
      return { variant: 'simple', ...RED, tag: 'พิเศษ', emoji: '🗂️', name: 'ข้อมูลกระจัดกระจาย', desc: 'ทิ้งตัวเสริม 1 ใบบนโต๊ะ (ฝ่ายต่อต้านเลือก)' }
  }
}
