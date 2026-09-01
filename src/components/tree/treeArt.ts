import { stageGrowth } from './stages'

/**
 * สร้างโครงต้นไม้แบบการ์ตูนออกมาเป็นข้อมูลล้วนๆ ให้ SVG เอาไปวาด
 *
 * เป็น 2D ทั้งหมดโดยตั้งใจ — ของเดิมเป็น three.js ซึ่งกินแรงจนต้องตั้งกฎเยอะ
 * (Canvas เดียวต่อหน้า, ห้ามเกิน 60 ต้น, ห้ามไล่ค่า growth ทีละเฟรม) และยังดูไม่สมจริงอยู่ดี
 * แบบการ์ตูนวาดกี่ต้นก็ได้ ไม่ต้องโหลดไลบรารีเพิ่ม และบอกระยะการเติบโตได้ชัดกว่า
 * เพราะดอกกับผลเป็นรูปทรงแบนๆ ที่อ่านออกทันทีแม้ต้นจะเล็กแค่ 40 พิกเซล
 *
 * ระบบพิกัด: พื้นอยู่ที่ y = 0 และ "ขึ้นบน" คือ y ติดลบ (ตามแกนของ SVG)
 * หน่วยเป็นหน่วยสมมุติ ตัวที่เอาไปวาดเป็นคนตั้ง viewBox จาก height/halfWidth ที่คืนมา
 */

export type TreePhase = 'seed' | 'sprout' | 'tree'

/** ระดับรายละเอียด — ป่าทั้งผืนใช้ 'simple' เพื่อไม่ให้ DOM บวมเป็นหมื่นชิ้น */
export type TreeDetail = 'full' | 'simple'

export interface TreeBranch {
  d: string
  w: number
}

export interface LeafBlob {
  x: number
  y: number
  r: number
  /** 0 = ใบอ่อนสีอ่อน, 1 = ใบแก่สีเข้ม */
  tint: number
}

export interface TreeDot {
  x: number
  y: number
  r: number
}

export interface TreeArt {
  phase: TreePhase
  /** ลำต้น วาดเป็นรูปทึบที่เรียวขึ้นไป — กิ่งเป็นเส้นความหนาคงที่เอาไม่อยู่ตรงนี้ */
  trunk: string | null
  branches: TreeBranch[]
  leaves: LeafBlob[]
  flowers: TreeDot[]
  fruits: TreeDot[]
  /** ครึ่งความกว้างที่ต้นกินจริง สำหรับตั้ง viewBox ให้พอดี */
  halfWidth: number
  /** ความสูงจากพื้นถึงยอด */
  height: number
}

// ---------- สุ่มแบบคงที่ ----------

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFromText(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const round = (v: number) => Math.round(v * 100) / 100

// จุดสลับรูปร่าง อ่านจาก TREE_STAGES ที่เดียว — ป้ายชื่อกับรูปจะได้ตรงกันเสมอ
const SPROUT_AT = stageGrowth('sprout')
const SEEDLING_AT = stageGrowth('seedling')
const FLOWER_AT = stageGrowth('flowering')
const FRUIT_AT = stageGrowth('fruiting')

// ---------- ตัวสร้าง ----------

export function buildTreeArt(
  seedText: string,
  growth: number,
  detail: TreeDetail = 'full',
): TreeArt {
  const g = clamp01(growth)
  const rand = mulberry32(seedFromText(seedText))

  if (g < SPROUT_AT) return buildSeed(rand, g)
  if (g < SEEDLING_AT) return buildSprout(rand, g)
  return buildTree(rand, g, detail)
}

/** เมล็ดในดิน — ปลายระยะจะมีรอยแตกโผล่ยอดเขียวนิดเดียว */
function buildSeed(rand: () => number, g: number): TreeArt {
  const t = clamp01(g / SPROUT_AT)
  const rx = 5.5 + t * 1.5
  const ry = 7.5 + t * 2
  const tilt = (rand() - 0.5) * 16

  const branches: TreeBranch[] = []
  // ยอดเขียวจิ๋วโผล่ตอนใกล้จะงอก ให้เห็นว่าเมล็ดกำลังจะเปลี่ยนระยะ ไม่ใช่นิ่งสนิท
  if (t > 0.45) {
    const h = (t - 0.45) * 14
    branches.push({ d: `M0 ${round(-ry * 1.1)} L0 ${round(-ry * 1.1 - h)}`, w: 1.6 })
  }

  return {
    phase: 'seed',
    trunk: `M0 0 m${-rx} 0 a${rx} ${ry} ${round(tilt)} 1 0 ${rx * 2} 0 a${rx} ${ry} ${round(tilt)} 1 0 ${-rx * 2} 0 Z`,
    branches,
    leaves: [],
    flowers: [],
    fruits: [],
    halfWidth: rx + 2,
    height: ry * 2.4,
  }
}

/** หน่ออ่อน — ก้านบางกับใบเลี้ยงสองใบ ยังไม่มีลำต้นไม้เนื้อแข็ง */
function buildSprout(rand: () => number, g: number): TreeArt {
  const t = clamp01((g - SPROUT_AT) / (SEEDLING_AT - SPROUT_AT))
  const h = 15 + t * 20
  const lean = (rand() - 0.5) * 5
  const leafR = 5 + t * 3.5

  const leaves: LeafBlob[] = [
    { x: -leafR * 0.95, y: round(-h + leafR * 0.15), r: round(leafR), tint: 0.05 },
    { x: round(leafR * 0.95 + lean * 0.3), y: round(-h - leafR * 0.1), r: round(leafR * 0.92), tint: 0.1 },
  ]
  // ใบที่สามโผล่ท้ายระยะ เป็นสัญญาณว่ากำลังจะกลายเป็นต้นกล้า
  if (t > 0.55) {
    leaves.push({ x: round(lean * 0.4), y: round(-h - leafR * 0.9), r: round(leafR * 0.6), tint: 0 })
  }

  return {
    phase: 'sprout',
    trunk: null,
    branches: [{ d: `M0 0 Q${round(lean * 0.5)} ${round(-h * 0.55)} ${round(lean)} ${round(-h)}`, w: round(1.8 + t * 1.4) }],
    leaves,
    flowers: [],
    fruits: [],
    halfWidth: leafR * 2.2,
    height: h + leafR * 1.6,
  }
}

/** ต้นไม้เต็มรูปแบบ — ลำต้น + กิ่งซ้อนชั้น + พุ่มใบ แล้วค่อยเติมดอก/ผลตามระยะ */
function buildTree(rand: () => number, g: number, detail: TreeDetail): TreeArt {
  // t = ความคืบหน้าภายในช่วง "เป็นต้นไม้แล้ว" ไม่ใช่ทั้งแคมเปญ
  // ไม่งั้นต้นกล้าที่เพิ่งพ้นระยะหน่อจะกระโดดขึ้นมาใหญ่ทันที
  const t = clamp01((g - SEEDLING_AT) / (1 - SEEDLING_AT))
  // ช่วงแรกโตเร็ว ช่วงหลังโตช้า — คนเพิ่งเริ่มเล่นจะเห็นต้นขยับทันตาในวันแรก
  const eased = Math.pow(t, 0.7)
  const simple = detail === 'simple'

  // ลำต้นกินราว 40% ของความสูงทั้งต้น ที่เหลือเป็นทรงพุ่ม
  // เคยตั้งไว้ยาวกว่านี้แล้วได้ต้นที่พุ่มไปกองอยู่ยอดเดียวเหมือนต้นยาง ไม่ใช่ไม้ให้ร่มเงา
  const trunkH = 20 + eased * 70
  const trunkW = 3.6 + eased * 13.5
  // ต้นเล็กมีแค่แกนเดียว ต้นโตแตกกิ่งซ้อนหลายชั้น
  //
  // 'simple' ตัดที่ 1–2 ชั้น เพราะจำนวนชิ้นโตแบบทวีคูณตามความลึก
  // (ชั้นที่ 4 = ~65 ชิ้นต่อต้น ป่า 250 ต้นก็เป็นหมื่นหกพันชิ้นใน DOM)
  // ที่ระยะป่าต้นสูงราว 40 พิกเซล ความต่างระหว่างกิ่ง 2 ชั้นกับ 4 ชั้นมองไม่เห็นอยู่แล้ว
  const maxDepth = Math.max(1, Math.round(1 + eased * (simple ? 0.8 : 4)))
  // พุ่มใบเล็กกว่าที่คิดโดยตั้งใจ — ถ้าใหญ่กว่านี้ก้อนใบจะทับกันจนกลายเป็นเมฆก้อนเดียว
  // แล้วโครงกิ่งที่อุตส่าห์แตกไว้จะมองไม่เห็นเลย ซึ่งเป็นสิ่งที่ระยะ "แตกกิ่ง" ต้องสื่อ
  const leafR = 5.5 + eased * 7.5
  // ความแก่ของใบ — ต้นอ่อนใบสีอ่อน ต้นโตใบเข้มขึ้นเรื่อยๆ
  const maturity = clamp01((g - SEEDLING_AT) / 0.5)

  const branches: TreeBranch[] = []
  const leaves: LeafBlob[] = []
  let minX = 0
  let maxX = 0
  let topY = 0

  const addLeafCluster = (x: number, y: number, scale: number) => {
    const clumps = simple ? 2 : 2 + Math.floor(rand() * 2)
    for (let i = 0; i < clumps; i++) {
      const bx = x + (rand() - 0.5) * scale * 1.15
      const by = y + (rand() - 0.5) * scale * 0.95
      const r = scale * (0.58 + rand() * 0.5)
      leaves.push({
        x: round(bx),
        y: round(by),
        r: round(r),
        tint: clamp01(maturity + (rand() - 0.5) * 0.45),
      })
      minX = Math.min(minX, bx - r)
      maxX = Math.max(maxX, bx + r)
      topY = Math.min(topY, by - r)
    }
  }

  /**
   * แตกกิ่งลูกจากจุดหนึ่ง โดยไม่วาดกิ่งแม่
   *
   * แยกออกมาเพราะยอดลำต้นต้องแตกกิ่งทันที ถ้าปล่อยให้วาดกิ่งแม่ยาวๆ ตั้งตรงก่อนแล้วค่อยแตก
   * กิ่งแม่ท่อนนั้นจะดูเป็นลำต้นต่อ ผลคือต้นออกมามีลำต้นเปล่ายาวมากแล้วมีพุ่มกระจุกอยู่ยอดเดียว
   */
  const spawnChildren = (
    x: number,
    y: number,
    angle: number,
    len: number,
    w: number,
    depth: number,
  ) => {
    const children = rand() < 0.3 ? 3 : 2
    for (let i = 0; i < children; i++) {
      // กางออกสองข้างแล้วดึงกลับเข้าแนวตั้งเล็กน้อย — กิ่งจริงชี้ขึ้นหาแสง
      const side = (i - (children - 1) / 2) / Math.max(1, (children - 1) / 2 || 1)
      // มุมกางแคบตอนอยู่ใกล้ลำต้น แล้วกว้างขึ้นเรื่อยๆ เมื่อเข้าใกล้ปลายกิ่ง
      //
      // ถ้ากางเท่ากันทุกชั้น จะได้สองแบบที่ผิดทั้งคู่: กางแคบทั้งต้น = กิ่งชี้ขึ้นขนานกันเหมือนไม้กวาด
      // กางกว้างทั้งต้น = แผ่ออกด้านข้างตั้งแต่โคนจนพุ่มแบนเหมือนร่ม
      const nearTrunk = maxDepth > 0 ? Math.min(1, depth / maxDepth) : 0
      const spread = 0.3 + (1 - nearTrunk) * 0.42 + rand() * 0.24
      const childAngle = angle + side * spread + (rand() - 0.5) * 0.14
      addBranch(x, y, childAngle * 0.94, len * (0.74 + rand() * 0.12), w * 0.66, depth - 1)
    }
  }

  const addBranch = (x: number, y: number, angle: number, len: number, w: number, depth: number) => {
    const x2 = x + Math.sin(angle) * len
    const y2 = y - Math.cos(angle) * len
    // โค้งกิ่งด้วยจุดควบคุมที่เยื้องออกด้านข้าง กิ่งตรงเป๊ะดูเป็นไม้จิ้มฟัน
    const bow = (rand() - 0.5) * len * 0.24
    const mx = (x + x2) / 2 + Math.cos(angle) * bow
    const my = (y + y2) / 2 + Math.sin(angle) * bow

    branches.push({
      d: `M${round(x)} ${round(y)} Q${round(mx)} ${round(my)} ${round(x2)} ${round(y2)}`,
      w: round(Math.max(0.8, w)),
    })
    minX = Math.min(minX, x2)
    maxX = Math.max(maxX, x2)
    topY = Math.min(topY, y2)

    if (depth <= 0) {
      addLeafCluster(x2, y2, leafR)
      return
    }

    spawnChildren(x2, y2, angle, len, w, depth)

    // ใบเกาะกิ่งชั้นในบ้าง ไม่ใช่แค่ปลายสุด ไม่งั้นตรงกลางพุ่มจะโหว่เห็นแต่กิ่งเปล่า
    // แต่ให้น้อย ไม่งั้นกลับไปทึบจนบังโครงกิ่งเหมือนเดิม
    // โหมด simple ข้ามทั้งหมด — จากระยะป่ามองไม่ออกว่าพุ่มทึบหรือโปร่ง
    if (!simple && depth <= 2 && rand() < 0.5) addLeafCluster(x2, y2, leafR * 0.82)
  }

  // ลำต้นเรียวขึ้นไปและเอียงนิดหน่อย ต้นไม้จริงไม่ตั้งฉากเป๊ะ
  const lean = (rand() - 0.5) * trunkH * 0.07
  const topW = trunkW * 0.52
  const trunk =
    `M${round(-trunkW / 2)} 0` +
    ` Q${round(-trunkW / 2 + lean * 0.3)} ${round(-trunkH * 0.55)} ${round(lean - topW / 2)} ${round(-trunkH)}` +
    ` L${round(lean + topW / 2)} ${round(-trunkH)}` +
    ` Q${round(trunkW / 2 + lean * 0.3)} ${round(-trunkH * 0.55)} ${round(trunkW / 2)} 0 Z`

  minX = -trunkW / 2
  maxX = trunkW / 2
  topY = -trunkH

  // แตกกิ่งจากยอดลำต้นทันที ไม่มีท่อนตั้งตรงคั่นกลาง
  spawnChildren(lean, -trunkH, (rand() - 0.5) * 0.1, trunkH * 0.95, topW, maxDepth + 1)

  // ---- ดอกกับผล ----
  //
  // เกาะไปบนพุ่มใบที่มีอยู่แล้ว ไม่สุ่มตำแหน่งใหม่ — ดอกที่ลอยอยู่นอกพุ่มดูเหมือนความผิดพลาด
  const flowers: TreeDot[] = []
  const fruits: TreeDot[] = []

  if (g >= FLOWER_AT) {
    // ดอกเยอะสุดตอนเพิ่งออกดอก แล้วค่อยลดลงตอนติดผล เหมือนของจริงที่ดอกร่วงกลายเป็นผล
    const peak = clamp01((g - FLOWER_AT) / (FRUIT_AT - FLOWER_AT))
    const density = g >= FRUIT_AT ? 0.16 : 0.2 + peak * 0.3
    for (const blob of leaves) {
      if (rand() > density) continue
      flowers.push({
        x: round(blob.x + (rand() - 0.5) * blob.r),
        y: round(blob.y + (rand() - 0.5) * blob.r),
        r: round(Math.max(1.2, blob.r * 0.2)),
      })
    }
  }

  if (g >= FRUIT_AT) {
    const density = 0.14 + clamp01((g - FRUIT_AT) / (1 - FRUIT_AT)) * 0.16
    for (const blob of leaves) {
      if (rand() > density) continue
      fruits.push({
        // ผลห้อยใต้พุ่มเสมอ ถ้าโผล่ด้านบนจะดูเหมือนลอยอยู่เหนือใบ
        x: round(blob.x + (rand() - 0.5) * blob.r * 0.8),
        y: round(blob.y + blob.r * 0.42),
        r: round(Math.max(1.6, blob.r * 0.26)),
      })
    }
  }

  return {
    phase: 'tree',
    trunk,
    branches,
    leaves,
    flowers,
    fruits,
    halfWidth: Math.max(Math.abs(minX), Math.abs(maxX)) + 2,
    height: Math.abs(topY) + 4,
  }
}
