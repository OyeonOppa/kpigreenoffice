import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface ConfettiProps {
  /** จำนวนชิ้น — ตอบถูกใช้น้อยๆ ตอนประกาศที่ 1 ค่อยจัดเต็ม */
  count?: number
  seed?: number | string
}

const COLORS = ['#22c55e', '#eab308', '#3b82f6', '#ef4444', '#f472b6', '#8b5cf6']

// กระดาษโปรยแบบเบาที่สุดเท่าที่จะทำได้ — ขยับแค่ transform/opacity
// เพื่อไม่ให้มือถือรุ่นเก่าของผู้เล่นกระตุกตอนเฉลย
export default function Confetti({ count = 36, seed = 0 }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: `${seed}-${i}`,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.8 + Math.random() * 1.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        drift: (Math.random() - 0.5) * 160,
        spin: (Math.random() - 0.5) * 720,
        round: Math.random() > 0.6,
      })),
    [count, seed],
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute block"
          style={{
            left: `${p.left}%`,
            top: -20,
            width: p.size,
            height: p.round ? p.size : p.size * 1.6,
            backgroundColor: p.color,
            borderRadius: p.round ? '999px' : '2px',
          }}
          initial={{ y: -30, opacity: 1, rotate: 0, x: 0 }}
          animate={{ y: '105vh', x: p.drift, rotate: p.spin, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}
