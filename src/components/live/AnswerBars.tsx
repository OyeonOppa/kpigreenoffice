import { motion } from 'framer-motion'
import { WASTE } from '../../content'
import type { BinId } from '../../game'

interface AnswerBarsProps {
  distribution: Record<BinId, number>
  correctBin: BinId
  /** คำตอบของตัวเอง — จะขึ้นจุดกำกับให้เห็นว่าเราอยู่กลุ่มไหน */
  myBin?: BinId | null
}

// กราฟว่าคนในห้องเลือกถังไหนกันบ้าง — จุดที่สอนได้ดีที่สุดของเกม
// เพราะเห็นเลยว่าความเข้าใจผิดกระจุกอยู่ตรงไหน
export default function AnswerBars({ distribution, correctBin, myBin }: AnswerBarsProps) {
  const total = Object.values(distribution).reduce((sum, n) => sum + n, 0)

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 items-end h-40">
      {WASTE.bins.map((bin) => {
        const count = distribution[bin.id] ?? 0
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        const isCorrect = bin.id === correctBin
        return (
          <div key={bin.id} className="flex flex-col items-center justify-end h-full gap-1.5">
            <span className={`tabular text-sm ${isCorrect ? 'text-ink font-semibold' : 'text-ink/60'}`}>
              {pct}%
            </span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(pct, 2)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="w-full rounded-t-xl min-h-1 relative"
              style={{
                backgroundColor: bin.color,
                opacity: isCorrect ? 1 : 0.4,
              }}
            >
              {myBin === bin.id && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-lg" aria-hidden>
                  👇
                </span>
              )}
            </motion.div>
            <span
              className={`text-[11px] sm:text-xs text-center leading-tight ${
                isCorrect ? 'text-ink font-medium' : 'text-ink/55'
              }`}
            >
              {bin.type}
              {isCorrect && <span className="block text-emerald-700">ถูกต้อง</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}
