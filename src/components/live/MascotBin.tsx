import { motion } from 'framer-motion'

export type BinMood = 'idle' | 'open' | 'correct' | 'wrong' | 'dim'

interface MascotBinProps {
  color: string
  mood?: BinMood
  className?: string
}

// ถังขยะเวอร์ชันการ์ตูน — วาดเป็น SVG ล้วน จะได้ขยับฝา อ้าปาก กะพริบตาได้
// ใช้เฉพาะหน้าเกมแข่งสด ส่วนหน้าแรกยังใช้รูปถ่ายถังจริงเหมือนเดิม
export default function MascotBin({ color, mood = 'idle', className = 'w-24' }: MascotBinProps) {
  const open = mood === 'open'
  const happy = mood === 'correct'
  const sad = mood === 'wrong'

  return (
    <motion.svg
      viewBox="0 0 100 120"
      className={className}
      aria-hidden
      animate={
        happy
          ? { y: [0, -10, 0, -5, 0], rotate: [0, -3, 3, 0] }
          : sad
            ? { rotate: [0, -6, 6, -4, 0] }
            : { y: 0, rotate: 0 }
      }
      transition={{ duration: happy ? 0.7 : 0.5 }}
      style={{ opacity: mood === 'dim' ? 0.3 : 1, transition: 'opacity 0.3s ease' }}
    >
      {/* เงาใต้ถัง */}
      <ellipse cx="50" cy="115" rx="30" ry="5" fill="rgba(35,45,35,0.14)" />

      {/* ตัวถัง */}
      <path
        d="M20 36 H80 L75.5 104 Q75 112 67 112 H33 Q25 112 24.5 104 Z"
        fill={color}
        stroke="rgba(0,0,0,0.16)"
        strokeWidth="2"
      />
      {/* ร่องข้างถัง */}
      {[36, 50, 64].map((x) => (
        <line
          key={x}
          x1={x}
          y1="52"
          x2={x - (x - 50) * 0.06}
          y2="100"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ))}

      {/* ฝาถัง — เปิดตอนลากขยะเข้าใกล้ */}
      <motion.g
        style={{ originX: '16px', originY: '32px' }}
        animate={{ rotate: open ? -32 : happy ? -18 : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
      >
        <rect x="40" y="11" width="20" height="8" rx="4" fill={color} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />
        <rect x="13" y="18" width="74" height="14" rx="7" fill={color} stroke="rgba(0,0,0,0.16)" strokeWidth="2" />
        <rect x="13" y="18" width="74" height="6" rx="3" fill="rgba(255,255,255,0.28)" />
      </motion.g>

      {/* หน้าตา */}
      <g>
        {happy ? (
          <>
            <path d="M32 62 Q39 54 46 62" stroke="#1c2a20" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M54 62 Q61 54 68 62" stroke="#1c2a20" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <motion.g
              animate={{ scaleY: [1, 1, 0.1, 1] }}
              transition={{ duration: 3.4, repeat: Infinity, times: [0, 0.86, 0.92, 1] }}
              style={{ originY: '60px' }}
            >
              <circle cx="39" cy="60" r="7.5" fill="#fff" stroke="rgba(0,0,0,0.14)" strokeWidth="1.5" />
              <circle cx="61" cy="60" r="7.5" fill="#fff" stroke="rgba(0,0,0,0.14)" strokeWidth="1.5" />
              <circle cx={sad ? 37 : 40} cy={sad ? 62 : 61} r="3.6" fill="#1c2a20" />
              <circle cx={sad ? 59 : 62} cy={sad ? 62 : 61} r="3.6" fill="#1c2a20" />
            </motion.g>
          </>
        )}

        {open ? (
          <ellipse cx="50" cy="82" rx="10" ry="12" fill="#1c2a20" opacity="0.85" />
        ) : sad ? (
          <path d="M41 86 Q50 76 59 86" stroke="#1c2a20" strokeWidth="4" fill="none" strokeLinecap="round" />
        ) : (
          <path
            d={happy ? 'M38 76 Q50 92 62 76' : 'M42 78 Q50 86 58 78'}
            stroke="#1c2a20"
            strokeWidth="4"
            fill={happy ? '#1c2a20' : 'none'}
            strokeLinecap="round"
          />
        )}

        {/* แก้มแดงตอนดีใจ */}
        {happy && (
          <>
            <ellipse cx="29" cy="74" rx="6" ry="4" fill="#ff8fa3" opacity="0.65" />
            <ellipse cx="71" cy="74" rx="6" ry="4" fill="#ff8fa3" opacity="0.65" />
          </>
        )}
      </g>
    </motion.svg>
  )
}
