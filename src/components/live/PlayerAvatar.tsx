import type { AvatarLook } from '../../game'
import { safeLook } from '../../game/avatar'

interface PlayerAvatarProps {
  look: AvatarLook | undefined | null
  /** ขนาดเป็น px — ทุกชิ้นสเกลตามค่านี้ */
  size?: number
  className?: string
}

// ตัวละครประจำตัวผู้เล่น: หน้าสัตว์ + พื้นหลังสี + หมวก + ของประดับหน้า
// ซ้อนเป็นชั้นๆ ด้วยตำแหน่งเป็นเปอร์เซ็นต์ จึงย่อขยายได้ตั้งแต่ในตารางคะแนนจนถึงจอโปรเจกเตอร์
export default function PlayerAvatar({ look, size = 32, className = '' }: PlayerAvatarProps) {
  const { base, color, hat, gear } = safeLook(look)

  return (
    <span
      className={`relative inline-block shrink-0 rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: color }}
      aria-hidden
    >
      <span
        className="absolute inset-0 flex items-center justify-center leading-none"
        style={{ fontSize: size * 0.66 }}
      >
        {base}
      </span>

      {gear && (
        <span
          className="absolute left-1/2 leading-none"
          style={{
            top: '46%',
            fontSize: size * 0.36,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {gear}
        </span>
      )}

      {hat && (
        <span
          className="absolute left-1/2 leading-none"
          style={{
            top: '2%',
            fontSize: size * 0.4,
            transform: 'translate(-50%, -50%) rotate(-12deg)',
          }}
        >
          {hat}
        </span>
      )}
    </span>
  )
}
