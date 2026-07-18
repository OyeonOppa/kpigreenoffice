import { useMemo, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { WASTE, WASTE_GAME_ITEMS } from '../content'

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
          <div className="text-center mb-8">
            <p className="text-ink/65 text-xs mb-4">
              ข้อ {round + 1} / {ROUNDS} — ขยะชิ้นนี้ควรทิ้งถังไหน?
            </p>
            <div className="text-6xl mb-3">{current.emoji}</div>
            <p className="text-ink text-lg">{current.name}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {WASTE.bins.map((bin) => (
              <button
                key={bin.id}
                type="button"
                onClick={() => pick(bin.id)}
                disabled={!!feedback}
                className="liquid-glass rounded-2xl p-4 text-center hover:bg-ink/5 transition-colors disabled:opacity-60"
              >
                <span
                  className="block w-8 h-8 rounded-full mx-auto mb-2 border border-ink/15"
                  style={{ backgroundColor: bin.color }}
                />
                <span className="block text-ink text-sm font-medium">{bin.name}</span>
                <span className="block text-ink/65 text-xs mt-1">{bin.type}</span>
              </button>
            ))}
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
    <section id="waste" ref={ref} className="bg-canvas py-28 md:py-40 px-6 overflow-hidden">
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

        {/* ประเภทถังขยะ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-14">
          {WASTE.bins.map((bin, i) => (
            <motion.div
              key={bin.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 + i * 0.1 }}
              className="liquid-glass rounded-3xl p-6"
            >
              <span
                className="block w-10 h-10 rounded-full mb-4 border border-ink/15"
                style={{ backgroundColor: bin.color }}
              />
              <p className="text-ink font-medium mb-1">{bin.name}</p>
              <p className="text-ink/70 text-sm mb-2">{bin.type}</p>
              <p className="text-ink/65 text-xs leading-relaxed">{bin.examples}</p>
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
