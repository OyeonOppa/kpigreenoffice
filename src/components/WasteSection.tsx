import { useMemo, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { WASTE, WASTE_GAME_ITEMS } from '../content'
import BinImage from './BinImage'
import GameItemImage from './GameItemImage'

type BinId = (typeof WASTE.bins)[number]['id']

const ROUNDS = 8

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function WasteGame() {
  const [seed, setSeed] = useState(0)
  const items = useMemo(() => shuffle(WASTE_GAME_ITEMS).slice(0, ROUNDS), [seed])
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<{ correct: boolean; binType: string } | null>(null)

  const current = items[round]
  const finished = round >= ROUNDS

  const pick = (binId: BinId) => {
    if (feedback || finished) return
    const correct = binId === current.bin
    const correctBin = WASTE.bins.find((b) => b.id === current.bin)!
    if (correct) setScore((s) => s + 1)
    setFeedback({ correct, binType: correctBin.type })
    window.setTimeout(() => {
      setFeedback(null)
      setRound((r) => r + 1)
    }, 1200)
  }

  const restart = () => {
    setSeed((s) => s + 1)
    setRound(0)
    setScore(0)
    setFeedback(null)
  }

  return (
    <div id="waste-game" className="liquid-glass rounded-3xl p-6 md:p-10 scroll-mt-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-ink/65 text-xs tracking-widest uppercase mb-2">เกมแยกขยะ</p>
          <h3 className="font-display text-2xl md:text-3xl text-ink tracking-tight">
            ทิ้งให้ถูกถัง
          </h3>
        </div>
        <p className="text-ink/65 text-sm">
          คะแนน <span className="text-accent-deep text-lg font-medium">{score}</span> / {ROUNDS}
        </p>
      </div>

      {finished ? (
        <div className="text-center py-10">
          <p className="font-display text-5xl md:text-6xl text-ink mb-3">
            {score} / {ROUNDS}
          </p>
          <p className="text-ink/65 text-sm mb-8">
            {score === ROUNDS
              ? 'แยกถูกทุกชิ้น เยี่ยมมาก'
              : score >= ROUNDS / 2
                ? 'ทำได้ดี ลองอีกรอบให้ครบทุกชิ้น'
                : 'ลองใหม่อีกครั้ง ดูตารางถังขยะด้านบนช่วยได้'}
          </p>
          <button
            type="button"
            onClick={restart}
            className="liquid-glass rounded-full px-8 py-3 text-ink text-sm font-medium hover:bg-ink/5 transition-colors inline-flex items-center gap-2"
          >
            <RotateCcw size={16} /> เล่นอีกครั้ง
          </button>
        </div>
      ) : (
        <>
          {/* จอกว้าง: 2 คอลัมน์ — ซ้าย 50% โจทย์ภาพใหญ่, ขวาแบ่ง 2x2 เป็นถังคำตอบ
              จอเล็ก: สลับเป็นเรียงต่อกันแนวตั้ง แต่ภาพโจทย์ยังคงใหญ่เด่นเหมือนเดิม */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center">
            <div className="text-center">
              <p className="text-ink/65 text-xs mb-4">
                ข้อ {round + 1} / {ROUNDS} — ขยะชิ้นนี้ควรทิ้งถังไหน?
              </p>
              <GameItemImage
                src={current.image}
                emoji={current.emoji}
                className="w-48 sm:w-56 md:w-64 lg:w-72"
              />
              <p className="text-ink text-lg mt-2">{current.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-6">
              {WASTE.bins.map((bin) => (
                <button
                  key={bin.id}
                  type="button"
                  onClick={() => pick(bin.id)}
                  disabled={!!feedback}
                  className="bg-canvas flex flex-col items-center gap-2 py-2 rounded-2xl transition-transform duration-300 hover:-translate-y-1.5 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                >
                  <BinImage
                    src={bin.image}
                    color={bin.color}
                    className="w-20 sm:w-24 md:w-28 lg:w-32"
                  />
                  <span className="block text-ink text-sm font-medium">{bin.name}</span>
                  <span className="block text-ink/65 text-xs">{bin.type}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-10 mt-6 text-center">
            {feedback && (
              <p className={`text-sm ${feedback.correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                {feedback.correct ? 'ถูกต้อง!' : `ยังไม่ใช่ — ชิ้นนี้คือ${feedback.binType}`}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function WasteSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="waste" ref={ref} className="bg-canvas py-28 md:py-40 px-6 overflow-hidden scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-ink/65 text-sm tracking-widest uppercase mb-6"
        >
          {WASTE.label}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-4xl md:text-6xl text-ink leading-[1.2] tracking-tight mb-6"
        >
          {WASTE.heading}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-ink/65 text-base md:text-lg leading-relaxed max-w-2xl mb-14"
        >
          {WASTE.intro}
        </motion.p>

        {/* ประเภทถังขยะ — ถังลอยตัวเปล่าๆ ไม่มีกรอบ/การ์ด แค่ภาพใหญ่ + ตัวหนังสือใต้ภาพ
            คงเป็น 2 คอลัมน์เสมอ (ไม่ขึ้น 4 คอลัมน์ตอนจอกว้าง) เพื่อให้มีที่ว่างพอสำหรับภาพขนาดใหญ่ */}
        <div className="grid grid-cols-2 gap-x-6 md:gap-x-10 gap-y-14 md:gap-y-16 mb-14 max-w-4xl mx-auto">
          {WASTE.bins.map((bin, i) => (
            <motion.div
              key={bin.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.1 }}
              className="bg-canvas flex flex-col items-center text-center group transition-transform duration-300 hover:-translate-y-1.5"
            >
              <BinImage
                src={bin.image}
                color={bin.color}
                className="w-28 sm:w-36 md:w-48 lg:w-64 xl:w-80"
              />
              <p className="text-ink font-medium mt-3 mb-1">{bin.name}</p>
              <p className="text-ink/70 text-sm mb-1">{bin.type}</p>
              <p className="text-ink/65 text-xs leading-relaxed max-w-[16ch]">{bin.examples}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <WasteGame />
        </motion.div>
      </div>
    </section>
  )
}
