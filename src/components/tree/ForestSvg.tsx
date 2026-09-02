import { useEffect, useMemo, useState } from 'react'
import { buildTreeArt } from './treeArt'
import { TreeDefs, TreeGroup } from './TreeSvg'

export interface ForestTree {
  /** รหัสสำหรับสุ่มรูปทรง ไม่ใช่ชื่อคน — ป่าหน้าแรกคนนอกเห็น จึงไม่มีอะไรชี้ตัวได้ */
  seed: string
  growth: number
}

/**
 * ป่าทั้งผืนใน <svg> เดียว
 *
 * ทำได้เพราะเปลี่ยนมาเป็น 2D — ตอนเป็น three.js ต้องตัดที่ 60 ต้น
 * เพราะ 250 ต้นคือสามเหลี่ยมล้านกว่าชิ้น มือถือเฟรมตกทันที
 *
 * แถวหลังเล็กกว่าและจางกว่าแถวหน้าเล็กน้อย เป็นการบอกระยะลึกแบบถูกๆ
 * แต่จงใจให้ต่างกันน้อย (0.82–1.0) ไม่งั้นความต่างของ "ต้นใครโตกว่ากัน"
 * จะถูกกลบด้วยเปอร์สเปกทีฟ ซึ่งเป็นสิ่งเดียวที่หน้านี้ต้องสื่อ
 */

const COL_GAP = 54
const ROW_GAP = 30
const TREE_SCALE = 0.62
const BACK_SCALE = 0.82
const BACK_OPACITY = 0.72

/** จำนวนต้นที่วาดจริง เกินจากนี้สรุปเป็นตัวเลขแทน */
export const FOREST_DRAW_MAX = 300

/**
 * สัดส่วนกว้าง:สูงของป่า — จอคอมกว้าง 3 เท่า มือถือแค่ 1.3 เท่า
 *
 * ป่าย่อตามความกว้างคอนเทนเนอร์เสมอ ถ้าใช้ 3:1 บนมือถือ ป่าจะสูงแค่ ~120 พิกเซล
 * ต้นเล็กจนดูไม่ออกว่าใครโตแค่ไหน ซึ่งเป็นสิ่งเดียวที่ป่านี้ต้องสื่อ
 * จอแคบจึงจัดให้แถวสั้นลงและซ้อนลึกขึ้นแทน
 */
function useForestAspect() {
  const query = '(min-width: 640px)'
  const [wide, setWide] = useState(
    () => typeof window === 'undefined' || window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setWide(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return wide ? 3 : 1.3
}

interface ForestSvgProps {
  trees: ForestTree[]
  /** seed ของต้นตัวเอง — ใส่วงสีทองกำกับให้หาเจอในป่า */
  mineSeed?: string | null
  className?: string
}

export default function ForestSvg({ trees, mineSeed, className }: ForestSvgProps) {
  const aspect = useForestAspect()

  const layout = useMemo(() => {
    // เรียงตาม seed ไม่ใช่ตามแต้ม — ถ้าเรียงตามแต้ม พอมีคนได้แต้มทีนึง
    // ต้นทั้งป่าจะสลับตำแหน่งกันหมด คนดูจะงงว่าต้นตัวเองหายไปไหน
    const drawn = [...trees]
      .sort((a, b) => a.seed.localeCompare(b.seed))
      .slice(0, FOREST_DRAW_MAX)

    const n = drawn.length
    if (n === 0) return null

    const cols = Math.max(2, Math.ceil(Math.sqrt(n * aspect)))
    const rows = Math.max(1, Math.ceil(n / cols))

    // ป่าย่อ/ขยายตามความกว้างคอนเทนเนอร์เสมอ ถ้าปล่อยให้ viewBox แคบตามจำนวนต้นจริง
    // ป่าที่มีไม่กี่ต้นจะถูกยืดเต็มจอ ต้นเดียวใหญ่ผิดสัดส่วนและกองอยู่ซ้ายมือ
    // จึงตรึงความกว้างขั้นต่ำไว้ แล้วจัดต้นที่มีให้อยู่กลางกรอบแทน
    const minCols = aspect > 2 ? 12 : 6
    const contentWidth = cols * COL_GAP + COL_GAP * 1.2
    const width = Math.max(contentWidth, minCols * COL_GAP + COL_GAP * 1.2)
    const offsetX = (width - contentWidth) / 2

    const items = drawn.map((tree, i) => {
      const row = Math.floor(i / cols)
      const col = i % cols
      // เยื้องแบบคงที่ตาม index ไม่ใช่สุ่มใหม่ทุกรอบ — ต้นจะได้ไม่ขยับตอนวาดใหม่
      const jitterX = (((i * 37) % 100) / 100 - 0.5) * COL_GAP * 0.5
      const jitterY = (((i * 61) % 100) / 100 - 0.5) * ROW_GAP * 0.35
      // แถวหลังเยื้องครึ่งช่อง ไม่ให้ต้นเรียงเป็นตารางเหมือนสวนยางพารา
      const stagger = row % 2 === 0 ? 0 : COL_GAP * 0.5
      const depth = rows > 1 ? row / (rows - 1) : 1

      return {
        tree,
        art: buildTreeArt(tree.seed, tree.growth, 'simple'),
        x: offsetX + col * COL_GAP + stagger + jitterX + COL_GAP * 0.6,
        y: row * ROW_GAP + jitterY,
        scale: TREE_SCALE * (BACK_SCALE + (1 - BACK_SCALE) * depth),
        opacity: BACK_OPACITY + (1 - BACK_OPACITY) * depth,
        mine: !!mineSeed && tree.seed === mineSeed,
      }
    })

    const tallest = Math.max(...items.map((it) => it.art.height * it.scale))
    const top = -(tallest + 16)
    const bottom = (rows - 1) * ROW_GAP + 22

    return { items, width, top, height: bottom - top, rows }
  }, [trees, mineSeed, aspect])

  if (!layout) return null

  return (
    <svg
      viewBox={`0 ${layout.top} ${layout.width} ${layout.height}`}
      className={className ?? 'w-full h-auto'}
      role="img"
      aria-label={`ป่าขององค์กร ${trees.length} ต้น`}
    >
      <defs>
        <TreeDefs />
      </defs>

      {/* พื้นหญ้าเป็นแถบตามจำนวนแถว ให้ต้นแต่ละแถวมีพื้นยืนของตัวเอง */}
      {Array.from({ length: layout.rows }, (_, r) => (
        <ellipse
          key={r}
          cx={layout.width / 2}
          cy={r * ROW_GAP + 6}
          rx={layout.width * 0.62}
          ry={ROW_GAP * 0.85}
          fill="#c7e0c4"
          opacity={0.2 + (r / Math.max(1, layout.rows - 1)) * 0.25}
        />
      ))}

      {layout.items.map((it, i) => (
        <g key={i} transform={`translate(${it.x} ${it.y}) scale(${it.scale})`} opacity={it.opacity}>
          <TreeGroup art={it.art} />
          {it.mine && (
            <g>
              <circle
                cx={0}
                cy={-it.art.height - 14}
                r={7}
                fill="none"
                stroke="#c99a00"
                strokeWidth={3}
              />
              <path
                d={`M-6 ${-it.art.height - 4} L6 ${-it.art.height - 4} L0 ${-it.art.height + 5} Z`}
                fill="#c99a00"
              />
            </g>
          )}
        </g>
      ))}
    </svg>
  )
}
