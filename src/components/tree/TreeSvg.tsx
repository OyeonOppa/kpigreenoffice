import { useMemo } from 'react'
import { buildTreeArt, type TreeArt, type TreeDetail } from './treeArt'

/**
 * วาดต้นไม้การ์ตูนจากโครงที่ `treeArt` สร้างไว้
 *
 * แยกเป็นสองส่วน: `TreeDefs` (เกรเดียนต์ ประกาศครั้งเดียวต่อหนึ่ง <svg>)
 * กับ `TreeGroup` (ตัวต้นไม้ ไม่มี <svg> ของตัวเอง) — ป่าทั้งผืนจึงใช้ <svg> เดียว
 * แล้ววาง <g transform> ซ้ำๆ ข้างในได้ ไม่ต้องมี <svg> ต่อต้นให้เบราว์เซอร์แบก
 */

/** เฉดใบ 3 ระดับ — ใบอ่อนสีอ่อนอมเหลือง ไปจนใบแก่สีเข้ม */
const LEAF_GRADIENTS = ['leafYoung', 'leafMid', 'leafMature'] as const

function leafFill(tint: number): string {
  const i = tint < 0.34 ? 0 : tint < 0.67 ? 1 : 2
  return `url(#${LEAF_GRADIENTS[i]})`
}

/** ประกาศเกรเดียนต์ครั้งเดียวต่อหนึ่ง <svg> — id ซ้ำในหน้าเดียวกันไม่เป็นไร เพราะอ้างในไฟล์เดียวกัน */
export function TreeDefs() {
  return (
    <>
      <radialGradient id="leafYoung" cx="38%" cy="30%" r="78%">
        <stop offset="0%" stopColor="#c2e8a8" />
        <stop offset="60%" stopColor="#8ec97e" />
        <stop offset="100%" stopColor="#6aa863" />
      </radialGradient>
      <radialGradient id="leafMid" cx="38%" cy="30%" r="78%">
        <stop offset="0%" stopColor="#8fd39a" />
        <stop offset="60%" stopColor="#57916e" />
        <stop offset="100%" stopColor="#44795c" />
      </radialGradient>
      <radialGradient id="leafMature" cx="38%" cy="30%" r="78%">
        <stop offset="0%" stopColor="#6bb183" />
        <stop offset="60%" stopColor="#3f7256" />
        <stop offset="100%" stopColor="#2f5b44" />
      </radialGradient>
      <linearGradient id="treeTrunk" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#9a6a45" />
        <stop offset="55%" stopColor="#7c5236" />
        <stop offset="100%" stopColor="#5f3f2a" />
      </linearGradient>
      <radialGradient id="treeSeed" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#b98a5c" />
        <stop offset="70%" stopColor="#8a5f3a" />
        <stop offset="100%" stopColor="#63432a" />
      </radialGradient>
      <radialGradient id="treeFruit" cx="35%" cy="28%" r="80%">
        <stop offset="0%" stopColor="#ff9d76" />
        <stop offset="65%" stopColor="#e8563f" />
        <stop offset="100%" stopColor="#bd3a2c" />
      </radialGradient>
    </>
  )
}

export function TreeGroup({ art, shadow = true }: { art: TreeArt; shadow?: boolean }) {
  const stemColor = art.phase === 'sprout' ? '#6aa863' : '#6f4a30'

  return (
    <>
      {/* เงาทรงร่มของไม้ใหญ่ให้ร่มเงา — วาดเสมอแม้ปิด shadow เพราะเป็นตัวแยกระยะสุดท้าย */}
      {art.groundShade > 0 && (
        <ellipse
          cx={0}
          cy={2}
          rx={art.groundShade}
          ry={Math.max(3, art.groundShade * 0.16)}
          fill="#2f5b44"
          opacity="0.14"
        />
      )}
      {shadow && (
        <ellipse
          cx={0}
          cy={2}
          rx={Math.max(6, art.halfWidth * 0.72)}
          ry={Math.max(2.2, art.halfWidth * 0.2)}
          fill="#3f7256"
          opacity="0.16"
        />
      )}

      {art.trunk && (
        <path d={art.trunk} fill={art.phase === 'seed' ? 'url(#treeSeed)' : 'url(#treeTrunk)'} />
      )}

      {art.branches.map((b, i) => (
        <path
          key={i}
          d={b.d}
          stroke={stemColor}
          strokeWidth={b.w}
          strokeLinecap="round"
          fill="none"
        />
      ))}

      {art.leaves.map((l, i) => (
        <circle key={i} cx={l.x} cy={l.y} r={l.r} fill={leafFill(l.tint)} />
      ))}

      {art.flowers.map((f, i) => (
        <circle key={i} cx={f.x} cy={f.y} r={f.r} fill="#ffd9ec" stroke="#ff9ec4" strokeWidth={0.5} />
      ))}

      {art.fruits.map((f, i) => (
        <circle key={i} cx={f.x} cy={f.y} r={f.r} fill="url(#treeFruit)" />
      ))}
    </>
  )
}

interface TreeSvgProps {
  /** ข้อความสำหรับสุ่มรูปทรง — seed เดียวกันได้ต้นหน้าตาเดิมเสมอ */
  seed: string
  /** 0 = เมล็ด, 1 = ไม้ใหญ่ให้ร่มเงา */
  growth: number
  detail?: TreeDetail
  className?: string
  label?: string
  /** วาดเนินหญ้าใต้ต้น — ต้นเดี่ยวเปิด ป่าปิด (ป่ามีพื้นของตัวเอง) */
  ground?: boolean
}

/**
 * ต้นเดี่ยวพร้อม <svg> ของตัวเอง — ใช้ในหน้า "ต้นของฉัน"
 *
 * viewBox กระชับตามขนาดต้นจริง ต้นเล็กจะได้ไม่มีที่ว่างโล่งด้านบน
 * แต่ยึดความสูงขั้นต่ำไว้ ไม่งั้นเมล็ดจะถูกขยายจนเต็มจอเท่าไม้ใหญ่
 */
export default function TreeSvg({
  seed,
  growth,
  detail = 'full',
  className,
  label,
  ground = true,
}: TreeSvgProps) {
  const art = useMemo(() => buildTreeArt(seed, growth, detail), [seed, growth, detail])

  // ยึดกรอบขั้นต่ำไว้พอให้ "ต้นเล็ก" ดูเล็กจริงเมื่อเทียบกับกรอบ แต่ไม่สูงเกินจน
  // การ์ด "ต้นของฉัน" บนมือถือกลายเป็นช่องว่างครึ่งจอตอนยังเป็นเมล็ด (กรอบกว้างกว่าสูง ~1.7:1)
  const halfW = Math.max(96, art.halfWidth + 8)
  const top = -Math.max(110, art.height + 10)

  return (
    <div className={className ?? 'relative w-full max-w-xs sm:max-w-sm'}>
      <svg
        viewBox={`${-halfW} ${top} ${halfW * 2} ${-top + 14}`}
        className="w-full h-auto max-h-[70vh] overflow-visible"
        role="img"
        aria-label={label ?? `ต้นไม้ เติบโต ${Math.round(growth * 100)} เปอร์เซ็นต์`}
      >
        <defs>
          <TreeDefs />
        </defs>
        {ground && (
          <ellipse
            cx={0}
            cy={6}
            rx={Math.max(48, art.halfWidth * 1.15)}
            ry={Math.max(12, art.halfWidth * 0.26)}
            fill="#c7e0c4"
            opacity="0.55"
          />
        )}
        <TreeGroup art={art} />
      </svg>
    </div>
  )
}
