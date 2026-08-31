import type { AvatarLook } from '../../game'
import { ringStyle, safeLook } from '../../game/avatar'

interface PlayerAvatarProps {
  look: AvatarLook | undefined | null
  /** ขนาดเป็น px — ทุกชิ้นสเกลตามค่านี้ */
  size?: number
  className?: string
}

// ตัวละครประจำตัวผู้เล่น: หน้าสัตว์ + พื้นหลังสี + กรอบวงแหวน + เหรียญมุมล่าง
// ไม่แปะอะไรทับหน้า (emoji หันคนละทาง ตำแหน่งตาไม่ตรง) — กรอบกับเหรียญอยู่ "รอบตัว" จึงไม่มีทางเบี้ยว
// ตำแหน่งเป็นเปอร์เซ็นต์ทั้งหมด ย่อขยายได้ตั้งแต่ในตารางคะแนนจนถึงจอโปรเจกเตอร์
export default function PlayerAvatar({ look, size = 32, className = '' }: PlayerAvatarProps) {
  const { base, color, ring, badge } = safeLook(look)

  return (
    <span
      className={`relative inline-block shrink-0 rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: color, ...ringStyle(ring) }}
      aria-hidden
    >
      <span
        className="absolute inset-0 flex items-center justify-center leading-none"
        style={{ fontSize: size * 0.66 }}
      >
        {base}
      </span>

      {badge && (
        <span
          className="absolute flex items-center justify-center rounded-full bg-white leading-none"
          style={{
            right: '-6%',
            bottom: '-6%',
            width: '46%',
            height: '46%',
            fontSize: size * 0.26,
            boxShadow: '0 1px 3px rgba(0,0,0,0.28)',
          }}
        >
          {badge}
        </span>
      )}
    </span>
  )
}
