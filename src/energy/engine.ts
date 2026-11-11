// ตัวเกม "ตรวจออฟฟิศก่อนกลับบ้าน" — ตรรกะล้วน ไม่ผูกกับ React
//
// ผู้เล่นตรวจห้องที่สุ่มมา แต่ละห้องมี "มีคนทำงานอยู่" หรือ "ว่าง" และมีอุปกรณ์ที่เปิดอยู่
//   people  ใช้เมื่อมีคนอยู่ → ห้องว่างควรปิด · ห้องมีคนต้องเปิดไว้ (แอร์ปรับเป็น 26°C ขึ้นไปได้)
//   always  ต้องเปิดตลอด (เซิร์ฟเวอร์ ตู้เย็น ป้ายทางออก กล้องวงจรปิด) ห้ามปิด
// เกมนี้ไม่ใช้ตัวเลขวัตต์หรือค่าไฟ ตัดสินจากหลักการเท่านั้น

export type Kind = 'people' | 'always'
export type Rng = () => number

export interface DeviceDef {
  id: string
  name: string
  emoji?: string
  svg?: 'rack' | 'fridge'
  kind: Kind
  ac?: boolean
  /** เหตุผลที่ต้องเปิดไว้ (ใช้กับ kind always) */
  keep?: string
}

export interface RoomDef {
  id: string
  name: string
  emoji: string
  devices: DeviceDef[]
}

export const ACC_TEMP = 26 // อุณหภูมิที่ถือว่าปรับแล้ว (26°C ขึ้นไป)

export const ROOMS: RoomDef[] = [
  {
    id: 'meeting', name: 'ห้องประชุมใหญ่', emoji: '🪑',
    devices: [
      { id: 'light', name: 'ไฟห้อง', emoji: '💡', kind: 'people' },
      { id: 'ac', name: 'แอร์', emoji: '❄️', kind: 'people', ac: true },
      { id: 'proj', name: 'โปรเจกเตอร์', emoji: '📽️', kind: 'people' },
    ],
  },
  {
    id: 'office-a', name: 'ออฟฟิศโซน A', emoji: '🧑‍💻',
    devices: [
      { id: 'light', name: 'ไฟห้อง', emoji: '💡', kind: 'people' },
      { id: 'ac', name: 'แอร์', emoji: '❄️', kind: 'people', ac: true },
      { id: 'pc', name: 'คอมพิวเตอร์', emoji: '🖥️', kind: 'people' },
      { id: 'printer', name: 'เครื่องพิมพ์', emoji: '🖨️', kind: 'people' },
    ],
  },
  {
    id: 'server', name: 'ห้องเซิร์ฟเวอร์', emoji: '🔌',
    devices: [
      { id: 'light', name: 'ไฟห้อง', emoji: '💡', kind: 'people' },
      { id: 'rack', name: 'ตู้เซิร์ฟเวอร์', svg: 'rack', kind: 'always', keep: 'เก็บงานและข้อมูลของทุกคน ถ้าปิด ระบบทั้งออฟฟิศหยุดทำงาน' },
    ],
  },
  {
    id: 'pantry', name: 'ห้องครัว / แพนทรี', emoji: '🍽️',
    devices: [
      { id: 'light', name: 'ไฟห้อง', emoji: '💡', kind: 'people' },
      { id: 'fridge', name: 'ตู้เย็น', svg: 'fridge', kind: 'always', keep: 'ต้องแช่อาหารและยาตลอด ถ้าปิดของจะเสีย' },
      { id: 'coffee', name: 'เครื่องชงกาแฟ', emoji: '☕', kind: 'people' },
    ],
  },
  {
    id: 'hall', name: 'ทางเดิน / ทางหนีไฟ', emoji: '🚪',
    devices: [
      { id: 'light', name: 'ไฟทางเดิน', emoji: '💡', kind: 'people' },
      { id: 'exit', name: 'ป้ายทางออก (EXIT)', emoji: '🚪', kind: 'always', keep: 'เป็นเรื่องความปลอดภัย ต้องติดตลอดเวลา แม้ไม่มีใครอยู่' },
    ],
  },
  {
    id: 'boss', name: 'ห้องผู้บริหาร', emoji: '💼',
    devices: [
      { id: 'light', name: 'ไฟห้อง', emoji: '💡', kind: 'people' },
      { id: 'ac', name: 'แอร์', emoji: '❄️', kind: 'people', ac: true },
      { id: 'pc', name: 'คอมพิวเตอร์', emoji: '🖥️', kind: 'people' },
    ],
  },
  {
    id: 'lobby', name: 'ล็อบบี้ต้อนรับ', emoji: '🛎️',
    devices: [
      { id: 'light', name: 'ไฟห้อง', emoji: '💡', kind: 'people' },
      { id: 'tv', name: 'ทีวีประชาสัมพันธ์', emoji: '📺', kind: 'people' },
      { id: 'cctv', name: 'กล้องวงจรปิด', emoji: '📹', kind: 'always', keep: 'เฝ้าระวังความปลอดภัยของอาคารตลอด 24 ชั่วโมง' },
    ],
  },
  {
    id: 'training', name: 'ห้องอบรม', emoji: '🎓',
    devices: [
      { id: 'light', name: 'ไฟห้อง', emoji: '💡', kind: 'people' },
      { id: 'ac', name: 'แอร์', emoji: '❄️', kind: 'people', ac: true },
      { id: 'tv', name: 'จอทีวีอบรม', emoji: '📺', kind: 'people' },
    ],
  },
]

export interface DevState {
  id: string
  on: boolean
  /** เฉพาะแอร์ */
  temp?: number
}
export interface RoomState {
  id: string
  occupied: boolean
  devices: DevState[]
}
export interface Game {
  rooms: RoomState[]
  done: boolean
}

export const roomDef = (id: string) => ROOMS.find((r) => r.id === id)!
export const devDef = (rid: string, did: string) => roomDef(rid).devices.find((d) => d.id === did)!

function shuffle<T>(a: T[], rng: Rng): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

/** สุ่ม n ห้อง ให้มีคนอยู่อย่างน้อย 1 ห้อง และว่างอย่างน้อย 2 ห้อง */
export function newGame(n = 5, rng: Rng = Math.random): Game {
  const picks = shuffle(ROOMS, rng).slice(0, n)
  const occ = picks.map(() => rng() < 0.4)
  const count = () => occ.filter(Boolean).length
  if (count() === 0) occ[0] = true
  while (picks.length - count() < 2) occ[occ.findIndex(Boolean)] = false
  if (count() === 0) occ[picks.length - 1] = true
  return {
    done: false,
    rooms: picks.map((r, i) => ({
      id: r.id,
      occupied: occ[i],
      devices: r.devices.map((d) => ({
        id: d.id,
        on: true,
        ...(d.ac ? { temp: [22, 23, 24, 25, 26, 26][Math.floor(rng() * 6)] } : {}),
      })),
    })),
  }
}

export function setDevice(g: Game, rid: string, did: string, patch: Partial<DevState>): Game {
  if (g.done) return g
  const n = structuredClone(g)
  const d = n.rooms.find((r) => r.id === rid)!.devices.find((x) => x.id === did)!
  Object.assign(d, patch)
  return n
}

export interface Verdict {
  roomId: string
  devId: string
  ok: boolean
  /** สิ่งที่ควรทำ */
  ideal: string
  /** สิ่งที่ผู้เล่นทำ */
  got: string
  why: string
}

const stateText = (d: DevState, ac?: boolean) => (!d.on ? 'ปิด' : ac && d.temp ? `เปิด ${d.temp}°C` : 'เปิด')

export function judge(g: Game): Verdict[] {
  const out: Verdict[] = []
  for (const r of g.rooms) {
    for (const d of r.devices) {
      const def = devDef(r.id, d.id)
      let ok: boolean
      let ideal: string
      let why: string
      if (def.kind === 'always') {
        ok = d.on
        ideal = 'เปิดไว้'
        why = def.keep ?? 'ต้องเปิดตลอด'
      } else if (!r.occupied) {
        ok = !d.on
        ideal = 'ปิด'
        why = 'ห้องว่าง ไม่มีใครใช้ ปิดได้เลย'
      } else if (def.ac) {
        ok = d.on && (d.temp ?? 0) >= ACC_TEMP
        ideal = `เปิด ${ACC_TEMP}°C ขึ้นไป`
        why = d.on
          ? `มีคนทำงานอยู่ จึงยังต้องเปิด แต่ยิ่งตั้งอุณหภูมิต่ำ แอร์ยิ่งกินไฟ ปรับเป็น ${ACC_TEMP}°C ขึ้นไปก็ยังสบายพอ`
          : 'มีคนทำงานอยู่ ปิดแอร์จะทำให้ร้อนจนทำงานไม่ได้ ควรปรับอุณหภูมิแทน'
      } else {
        ok = d.on
        ideal = 'เปิดไว้'
        why = 'มีคนทำงานอยู่และกำลังใช้งาน ไม่ควรปิด'
      }
      out.push({ roomId: r.id, devId: d.id, ok, ideal, got: stateText(d, def.ac), why })
    }
  }
  return out
}

export const finish = (g: Game): Game => ({ ...g, done: true })

export function score(vs: Verdict[]) {
  const ok = vs.filter((v) => v.ok).length
  return { ok, total: vs.length, pct: Math.round((ok / vs.length) * 100) }
}

/** ผู้เล่นที่ทำถูกทุกอย่าง (ใช้ทดสอบ) */
export function perfect(g: Game): Game {
  let n = g
  for (const r of g.rooms) {
    for (const d of r.devices) {
      const def = devDef(r.id, d.id)
      if (def.kind === 'always') continue
      if (!r.occupied) n = setDevice(n, r.id, d.id, { on: false })
      else if (def.ac && (d.temp ?? 0) < ACC_TEMP) n = setDevice(n, r.id, d.id, { temp: ACC_TEMP })
    }
  }
  return n
}
