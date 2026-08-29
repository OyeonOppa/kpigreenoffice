import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * สร้างรูปทรงต้นไม้แบบ procedural — แตกกิ่งซ้ำแบบมีกฎ ไม่ใช่โมเดลสำเร็จรูป
 *
 * ทำไมไม่ใช้ไฟล์โมเดล 3D สำเร็จรูป:
 * - ต้นไม้ทุกคนจะเหมือนกันหมด (250 คนได้ต้นเดียวกัน = ไม่มีความเป็นเจ้าของ)
 * - โมเดลที่สมจริงไฟล์ใหญ่มาก โหลดบนมือถือช้า
 * - ปรับ "ระยะการเติบโต" ไม่ได้ ต้องมีโมเดลแยกทุกระยะ
 *
 * แบบนี้แทน: seed จาก uid → ต้นของแต่ละคนหน้าตาไม่ซ้ำกันแต่คงที่ทุกครั้งที่เปิด
 * และ growth 0→1 ทำให้ต้นค่อยๆ สูงขึ้น แตกกิ่งมากขึ้น ใบหนาขึ้นอย่างต่อเนื่อง
 */

export interface TreeShape {
  /** กิ่งทั้งหมดรวมเป็นชิ้นเดียว — 1 draw call ต่อต้น */
  branches: THREE.BufferGeometry
  /** ตำแหน่ง/การหมุน/ขนาดของพุ่มใบแต่ละก้อน ใช้กับ InstancedMesh */
  leaves: THREE.Matrix4[]
  /** เฉดเขียวของใบแต่ละก้อน ให้พุ่มไม่เป็นสีเดียวแบนๆ */
  leafTints: THREE.Color[]
  /** ความสูงจริงของต้น ใช้ตั้งกล้องให้พอดีกับต้น */
  height: number
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seedFromText(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const UP = new THREE.Vector3(0, 1, 0)

// เฉดเขียวหลายโทน — ใบไม้จริงไม่เคยเป็นสีเดียวทั้งต้น
const LEAF_COLORS = ['#4a7c2f', '#5d9440', '#3f6b28', '#6ba548', '#568c38']

/** ระดับรายละเอียด — สวนที่มีต้นไม้หลายสิบต้นต้องใช้ 'low' ไม่งั้นมือถือไม่ไหว */
export type TreeLod = 'high' | 'low'

/**
 * @param seedText ข้อความสำหรับสุ่ม (ใช้ uid ผู้เล่น) — ต้นเดิมทุกครั้ง
 * @param growth 0 = เมล็ด, 1 = ต้นโตเต็มที่
 * @param lod 'high' สำหรับหน้าต้นไม้ของฉัน (ต้นเดียว), 'low' สำหรับสวน/ป่า
 */
export function buildTree(seedText: string, growth: number, lod: TreeLod = 'high'): TreeShape {
  const low = lod === 'low'
  const rand = mulberry32(seedFromText(seedText))
  const g = Math.max(0, Math.min(1, growth))

  // ช่วงแรกโตเร็ว ช่วงหลังโตช้า — คนเพิ่งเริ่มเล่นจะเห็นต้นขยับทันตาในวันแรก
  const eased = Math.pow(g, 0.65)

  const trunkLength = 0.35 + eased * 1.6
  // ลำต้นหนาเป็นสัดส่วนกับความสูง ไม่งั้นต้นโตจะดูเป็นไม้เสียบลูกชิ้น
  const trunkRadius = 0.035 + eased * 0.17
  // จำนวนชั้นของการแตกกิ่ง — ต้นเล็กมีแค่ลำต้น ต้นโตแตกกิ่งซ้อนหลายชั้น
  const maxDepth = Math.round(1 + eased * 4)
  const leafSize = 0.16 + eased * 0.2

  const parts: THREE.BufferGeometry[] = []
  const leaves: THREE.Matrix4[] = []
  const leafTints: THREE.Color[] = []
  let highest = 0

  const addLeafCluster = (at: THREE.Vector3, scale: number) => {
    // ใบออกเป็นก้อนพุ่มหลายก้อนซ้อนกัน ดูเป็นมวลใบมากกว่าลูกบอลลูกเดียว
    // โหมด low ลดจำนวนก้อนลงครึ่งหนึ่ง — จากระยะสวนมองไม่ออกว่าต่างกัน แต่ประหยัดมาก
    const clumps = low ? 2 + Math.floor(rand() * 2) : 3 + Math.floor(rand() * 3)
    for (let i = 0; i < clumps; i++) {
      const offset = new THREE.Vector3(
        (rand() - 0.5) * scale * 1.6,
        (rand() - 0.5) * scale * 1.2,
        (rand() - 0.5) * scale * 1.6,
      )
      const pos = at.clone().add(offset)
      const s = scale * (0.65 + rand() * 0.7)
      const m = new THREE.Matrix4()
      m.compose(
        pos,
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI),
        ),
        // แบนลงเล็กน้อยตามแนวตั้ง พุ่มใบจริงไม่กลมดิก
        new THREE.Vector3(s, s * 0.78, s),
      )
      leaves.push(m)
      leafTints.push(new THREE.Color(LEAF_COLORS[Math.floor(rand() * LEAF_COLORS.length)]))
      highest = Math.max(highest, pos.y + s)
    }
  }

  const addBranch = (
    from: THREE.Vector3,
    dir: THREE.Vector3,
    length: number,
    radius: number,
    depth: number,
  ) => {
    const to = from.clone().addScaledVector(dir, length)
    highest = Math.max(highest, to.y)

    // กิ่งเรียวลงไปทางปลาย และงอเล็กน้อย (แบ่งเป็น 2 ท่อนเพื่อให้โค้งได้)
    const tip = radius * 0.62
    const segments = low ? 4 : depth > 2 ? 7 : 5
    const geo = new THREE.CylinderGeometry(tip, radius, length, segments, 1)
    geo.translate(0, length / 2, 0)
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()))
    geo.translate(from.x, from.y, from.z)
    parts.push(geo)

    if (depth <= 0) {
      addLeafCluster(to, leafSize)
      return
    }

    // กิ่งลูก 2-3 กิ่ง กระจายรอบแกน มุมกางไม่เท่ากันเพื่อไม่ให้ดูสมมาตรเป็นของเล่น
    const children = rand() < 0.28 ? 3 : 2
    const spinBase = rand() * Math.PI * 2
    for (let i = 0; i < children; i++) {
      const spin = spinBase + (i / children) * Math.PI * 2 + (rand() - 0.5) * 0.9
      const spread = 0.28 + rand() * 0.42

      // เอียงออกจากแกนแม่ แล้วดึงกลับขึ้นบนนิดหน่อย — กิ่งจริงชี้ขึ้นหาแสง
      const axis = new THREE.Vector3(Math.cos(spin), 0, Math.sin(spin)).normalize()
      const childDir = dir
        .clone()
        .applyAxisAngle(axis.clone().cross(dir).normalize(), spread)
        // ดึงกลับขึ้นบนค่อนข้างแรง — ถ้าน้อยกว่านี้ทรงพุ่มจะแบนกางออกด้านข้าง
        // ดูเหมือนต้นจามจุรี แทนที่จะเป็นทรงกลมตั้งแบบต้นไม้ทั่วไป
        .lerp(UP, 0.32)
        .normalize()

      addBranch(
        to,
        childDir,
        length * (0.66 + rand() * 0.14),
        radius * 0.66,
        depth - 1,
      )
    }

    // ใบเกาะตามกิ่งชั้นในด้วย ไม่ใช่แค่ปลายสุด — ทรงพุ่มจะได้ทึบเหมือนต้นไม้จริง
    // ไม่งั้นต้นโตจะเห็นแต่โครงกิ่งเปล่าๆ เพราะใบไปกระจุกอยู่ปลายสุดหมด
    if (depth <= 2 && rand() < (low ? 0.4 : 0.75)) addLeafCluster(to, leafSize * 0.85)
  }

  // ลำต้นเอียงจากแนวดิ่งเล็กน้อย ต้นไม้จริงไม่ตั้งฉากเป๊ะ
  const lean = new THREE.Vector3((rand() - 0.5) * 0.14, 1, (rand() - 0.5) * 0.14).normalize()
  addBranch(new THREE.Vector3(0, 0, 0), lean, trunkLength, trunkRadius, maxDepth)

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  merged.computeVertexNormals()

  return { branches: merged, leaves, leafTints, height: highest }
}
