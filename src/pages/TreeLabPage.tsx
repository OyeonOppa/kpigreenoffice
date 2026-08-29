import { useMemo, useState } from 'react'
import ForestScene from '../components/forest/ForestScene'
import Tree3D from '../components/forest/Tree3D'
import { buildTree } from '../components/forest/treeGeometry'
import { STAGES } from '../forest/config'

// หน้าทดลองสำหรับปรับหน้าตาต้นไม้ — ไม่ได้ลิงก์จากที่ไหน เข้าที่ #/tree-lab
//
// กฎ 2 ข้อที่ได้จากการทดลองจริง แอปจริงต้องทำตามนี้ด้วย:
// 1. Canvas เดียวต่อหน้า วางต้นไม้หลายต้นในฉากเดียว — ไม่ใช่ Canvas ต่อต้น
//    (เบราว์เซอร์จำกัดจำนวน WebGL context ต่อหน้า พอเกินจะ "Context Lost" จอขาวหมด)
// 2. ห้าม unmount Canvas ตอนสลับมุมมอง ให้สลับเฉพาะเนื้อหาข้างใน
//    (unmount แล้ว mount ใหม่ทำให้ context เดิมหลุด จอขาวเหมือนกัน)

const SPACING = 3.2
const GARDEN_COUNT = 48

export default function TreeLabPage() {
  const [seed, setSeed] = useState('demo-1')
  const [mode, setMode] = useState<'stages' | 'garden'>('stages')

  const stageTrees = useMemo(
    () => STAGES.map((st) => ({ ...st, shape: buildTree(seed, st.growth, 'high') })),
    [seed],
  )

  const gardenTrees = useMemo(() => {
    const out: { shape: ReturnType<typeof buildTree>; pos: [number, number, number] }[] = []
    for (let i = 0; i < GARDEN_COUNT; i++) {
      const row = Math.floor(i / 8)
      const col = i % 8
      const jitterX = ((i * 37) % 100) / 100 - 0.5
      const jitterZ = ((i * 61) % 100) / 100 - 0.5
      out.push({
        shape: buildTree(`member-${i}`, 0.2 + ((i * 29) % 80) / 100, 'low'),
        pos: [(col - 3.5) * 4 + jitterX * 1.6, 0, row * -4.5 + jitterZ * 1.4],
      })
    }
    return out
  }, [])

  const stagesHeight = Math.max(...stageTrees.map((s) => s.shape.height))
  const gardenHeight = Math.max(...gardenTrees.map((t) => t.shape.height))

  return (
    <div className="min-h-dvh bg-canvas p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display text-2xl text-ink mb-1">ห้องทดลองต้นไม้ 3D</h1>
        <p className="text-ink/60 text-sm mb-4">
          {mode === 'stages'
            ? 'ระยะการเติบโต 7 ขั้น — seed เดียวกันได้ต้นหน้าตาเดิมเสมอ'
            : `สวนของสำนัก ${GARDEN_COUNT} ต้น (รายละเอียดระดับ low)`}
        </p>

        <div className="flex gap-2 mb-4 items-center flex-wrap">
          <button
            type="button"
            onClick={() => setMode(mode === 'stages' ? 'garden' : 'stages')}
            className="rounded-full bg-accent-deep text-white px-4 py-2 text-sm"
          >
            {mode === 'stages' ? `ดูสวน ${GARDEN_COUNT} ต้น` : 'ดูระยะการเติบโต'}
          </button>
          {mode === 'stages' &&
            ['demo-1', 'demo-2', 'demo-3', 'demo-4'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeed(s)}
                className={`rounded-full px-4 py-2 text-sm ${
                  seed === s ? 'bg-accent text-white' : 'bg-ink/5 text-ink/70'
                }`}
              >
                {s}
              </button>
            ))}
        </div>

        {/* Canvas เดียวตลอด สลับแค่เนื้อหาข้างใน */}
        <div className="pop-card overflow-hidden">
          <ForestScene
            className="h-[26rem] w-full"
            fitHeight={mode === 'stages' ? stagesHeight : gardenHeight}
            fitWidth={mode === 'stages' ? SPACING * (STAGES.length - 1) : 30}
          >
            {mode === 'stages'
              ? stageTrees.map((s, i) => (
                  <Tree3D
                    key={`stage-${s.label}`}
                    shape={s.shape}
                    position={[(i - (STAGES.length - 1) / 2) * SPACING, 0, 0]}
                  />
                ))
              : gardenTrees.map((t, i) => (
                  <Tree3D key={`garden-${i}`} shape={t.shape} position={t.pos} />
                ))}
          </ForestScene>
        </div>

        {mode === 'stages' && (
          <div className="grid grid-cols-7 gap-2 mt-3">
            {stageTrees.map((s) => (
              <p key={s.label} className="text-center text-ink text-xs">
                {s.label}
                <span className="block text-ink/40">
                  {Math.round(s.growth * 100)}% · {s.shape.height.toFixed(1)}m
                </span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
