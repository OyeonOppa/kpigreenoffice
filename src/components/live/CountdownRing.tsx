import type { ReactNode } from 'react'
import { useNow } from '../../game/hooks'

interface CountdownRingProps {
  /** เวลาที่ข้อนี้หมด (epoch ms) */
  endsAt: number
  /** ความยาวเต็มของช่วงตอบ ใช้คิดสัดส่วนวงแหวน */
  totalMs: number
  className?: string
  children?: ReactNode
}

const SIZE = 200
const STROKE = 10
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// วงแหวนนับถอยหลังรอบไอเท็ม — เหลือ 3 วินาทีสุดท้ายเปลี่ยนเป็นสีส้มแดงและเต้น
//
// นาฬิกา 60fps อยู่ในคอมโพเนนต์นี้เท่านั้น ไม่ได้อยู่ที่หน้าเกม
// ไม่งั้นทั้งหน้า (รวมถังการ์ตูน 4 ตัว) จะ re-render ทุกเฟรมตลอด 10 วินาทีที่กำลังตอบ
// ซึ่งเป็นช่วงที่มือถือรุ่นเก่าต้องลื่นที่สุด
export default function CountdownRing({
  endsAt,
  totalMs,
  className = '',
  children,
}: CountdownRingProps) {
  const now = useNow()
  const remaining = Math.max(0, Math.min(totalMs, endsAt - now))
  const seconds = Math.ceil(remaining / 1000)
  const fraction = totalMs > 0 ? remaining / totalMs : 0
  const danger = seconds <= 3

  return (
    <div className={`relative ${className}`}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full -rotate-90" aria-hidden>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="oklch(90% 0.02 152)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={danger ? 'oklch(62% 0.21 28)' : 'var(--color-accent)'}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center p-[12%]">{children}</div>

      <p
        aria-live="off"
        className={`absolute -top-3 left-1/2 -translate-x-1/2 tabular rounded-full px-4 py-1 text-white text-lg font-semibold shadow-md ${
          danger ? 'animate-pulse' : ''
        }`}
        style={{ backgroundColor: danger ? 'oklch(58% 0.21 28)' : 'var(--color-accent)' }}
      >
        {seconds}
      </p>
    </div>
  )
}
