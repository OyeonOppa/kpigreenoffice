import { useMemo, useState } from 'react'
import TreeSvg from '../components/tree/TreeSvg'
import ForestSvg from '../components/tree/ForestSvg'
import { TREE_STAGES } from '../components/tree/stages'
import { buildTreeArt } from '../components/tree/treeArt'
import { TreeDefs, TreeGroup } from '../components/tree/TreeSvg'

// หน้าทดลองสำหรับปรับหน้าตาต้นไม้ — ไม่ได้ลิงก์จากที่ไหน เข้าที่ #/tree-lab
//
// ใช้ดูสามอย่าง: ระยะทั้ง 10 เรียงกัน, ต้นเดี่ยวขนาดใหญ่ที่เลื่อน growth ได้อิสระ,
// และป่าจำลองไว้เช็กว่าจำนวนต้นเยอะๆ แล้วยังอ่านออกไหม
//
// เลื่อน growth แบบต่อเนื่องได้ เพราะตัววาดรับค่า 0–1 ตรงๆ ระยะทั้ง 10 เป็นแค่ป้ายทับบนค่านั้น
// ถ้าเห็นต้นกระโดดเปลี่ยนทรงตอนข้ามระยะ แปลว่าค่าใน treeArt กับ stages ไม่ต่อเนื่องกัน

const FOREST_SIZES = [12, 48, 120, 250]

export default function TreeLabPage() {
  const [seed, setSeed] = useState('demo-1')
  const [growth, setGrowth] = useState(0.5)
  const [forestSize, setForestSize] = useState(48)

  const cell = 150

  const stageArts = useMemo(
    () => TREE_STAGES.map((s) => ({ ...s, art: buildTreeArt(seed, s.growth, 'full') })),
    [seed],
  )
  const tallest = Math.max(...stageArts.map((s) => s.art.height))
  const widest = Math.max(...stageArts.map((s) => s.art.halfWidth))
  // สเกลร่วมเหมือนแถบระยะในหน้าป่า — ระยะหลังตัวใหญ่ขึ้นจริง ระยะแรกๆ ดันขึ้นให้พอเห็นรูปร่าง
  const base = Math.min((cell * 0.86) / tallest, (cell * 0.5) / widest)
  const scaleOf = (a: { height: number; halfWidth: number }) =>
    a.height * base < cell * 0.24 ? (cell * 0.24) / a.height : base

  const forestTrees = useMemo(
    () =>
      Array.from({ length: forestSize }, (_, i) => ({
        seed: `member-${i}`,
        growth: ((i * 29) % 100) / 100,
      })),
    [forestSize],
  )

  return (
    <div className="min-h-dvh bg-canvas p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl text-ink mb-1">ห้องทดลองต้นไม้</h1>
          <p className="text-ink/60 text-sm">
            SVG ล้วน ไม่มี three.js — seed เดียวกันได้ต้นหน้าตาเดิมเสมอ
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['demo-1', 'demo-2', 'demo-3', 'demo-4'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeed(s)}
              className={`rounded-full px-4 py-2 text-sm ${
                seed === s ? 'bg-accent-deep text-white' : 'bg-ink/5 text-ink/70'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* ระยะทั้งหมดเรียงกัน */}
        <div className="pop-card p-4 overflow-x-auto">
          <p className="text-ink font-medium text-sm mb-3">
            ระยะการเติบโต {TREE_STAGES.length} ขั้น
          </p>
          <div className="min-w-[60rem]">
            <svg
              viewBox={`0 0 ${cell * TREE_STAGES.length} ${cell + 10}`}
              className="w-full h-auto"
            >
              <defs>
                <TreeDefs />
              </defs>
              {stageArts.map((s, i) => (
                <g
                  key={s.id}
                  transform={`translate(${i * cell + cell / 2} ${cell}) scale(${scaleOf(s.art)})`}
                >
                  <TreeGroup art={s.art} />
                </g>
              ))}
            </svg>
            <div
              className="grid mt-2"
              style={{ gridTemplateColumns: `repeat(${TREE_STAGES.length}, minmax(0, 1fr))` }}
            >
              {stageArts.map((s) => (
                <p key={s.id} className="text-center text-ink text-xs px-1">
                  {s.label}
                  <span className="block text-ink/40">{Math.round(s.growth * 100)}%</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* ต้นเดี่ยวเลื่อนค่าได้อิสระ — ไว้ดูว่าช่วงรอยต่อระหว่างระยะต่อเนื่องไหม */}
        <div className="pop-card p-4">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-ink font-medium text-sm">ต้นเดี่ยว</p>
            <p className="tabular text-ink/50 text-xs">
              growth {growth.toFixed(3)} · {TREE_STAGES.filter((s) => growth >= s.growth).at(-1)?.label}
            </p>
          </div>
          <TreeSvg seed={seed} growth={growth} className="w-full max-w-md mx-auto" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={growth}
            onChange={(e) => setGrowth(Number(e.target.value))}
            className="w-full mt-4 accent-[#3f7256]"
          />
        </div>

        {/* ป่า — เช็กว่าต้นเยอะแล้วยังอ่านออกไหม และ DOM บวมแค่ไหน */}
        <div className="pop-card p-4">
          <div className="flex gap-2 flex-wrap mb-3 items-center">
            <p className="text-ink font-medium text-sm mr-2">ป่าจำลอง</p>
            {FOREST_SIZES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForestSize(n)}
                className={`rounded-full px-3 py-1.5 text-xs ${
                  forestSize === n ? 'bg-accent text-white' : 'bg-ink/5 text-ink/70'
                }`}
              >
                {n} ต้น
              </button>
            ))}
          </div>
          <ForestSvg trees={forestTrees} mineSeed="member-3" className="w-full h-auto" />
        </div>
      </div>
    </div>
  )
}
