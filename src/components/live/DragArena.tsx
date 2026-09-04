import { useRef, useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import { Check } from 'lucide-react'
import { WASTE } from '../../content'
import type { BinId } from '../../game'
import { sfx } from '../../game/sfx'
import GameItemImage from '../GameItemImage'
import CountdownRing from './CountdownRing'
import MascotBin, { type BinMood } from './MascotBin'

interface DragArenaProps {
  itemName: string
  itemImage: string
  itemEmoji: string
  /** ตอบไปแล้วเป็นถังไหน (null = ยังไม่ตอบ) */
  answered: BinId | null
  disabled: boolean
  onAnswer: (bin: BinId) => void
  /** ถังที่ถูกต้อง — ใส่ตอนเฉลยเท่านั้น */
  correctBin?: BinId | null
  /** วงแหวนนับถอยหลังรอบตัวขยะ — ตัววงแหวนเดินนาฬิกาเอง */
  countdown?: { endsAt: number; totalMs: number }
  /** คลาสเสริมของกล่องนอกสุด — หน้าผู้เล่นใช้สั่งให้ยืดเต็มความสูงจอ */
  className?: string
}

// สนามลากขยะลงถัง
// รองรับสองวิธีเท่ากัน: ลากลงถัง หรือ "แตะถัง" ตรงๆ
// เพราะเกมนี้คิดคะแนนจากความไว ถ้าบังคับให้ลากอย่างเดียว คนที่จอเล็กหรือมือไม่คล่องจะเสียเปรียบ
export default function DragArena({
  itemName,
  itemImage,
  itemEmoji,
  answered,
  disabled,
  onAnswer,
  correctBin,
  countdown,
  className = '',
}: DragArenaProps) {
  const binRefs = useRef(new Map<BinId, HTMLButtonElement>())
  const rects = useRef<{ id: BinId; rect: DOMRect }[]>([])
  const [hovered, setHovered] = useState<BinId | null>(null)
  const [dragging, setDragging] = useState(false)

  const revealing = !!correctBin
  const locked = disabled || !!answered || revealing

  const captureRects = () => {
    rects.current = []
    for (const [id, el] of binRefs.current) {
      rects.current.push({ id, rect: el.getBoundingClientRect() })
    }
  }

  const binAt = (info: PanInfo): BinId | null => {
    const x = info.point.x - window.scrollX
    const y = info.point.y - window.scrollY
    for (const { id, rect } of rects.current) {
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return id
    }
    return null
  }

  const commit = (bin: BinId) => {
    if (locked) return
    sfx.drop()
    onAnswer(bin)
  }

  const moodFor = (bin: BinId): BinMood => {
    if (revealing) {
      if (bin === correctBin) return 'correct'
      if (bin === answered) return 'wrong'
      return 'dim'
    }
    if (hovered === bin && dragging) return 'open'
    if (answered === bin) return 'correct'
    return 'idle'
  }

  const item =
    answered || revealing ? (
      // ข้อความสั้นที่สุดเท่าที่จะสื่อได้ — ช่องว่างในวงแหวนแคบ ถ้ายาวกว่านี้จะตัดคำจนอ่านยาก
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-1 text-center"
      >
        {!revealing && (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white">
            <Check size={22} strokeWidth={3} />
          </span>
        )}
        <span className="text-ink/70 text-xs sm:text-sm leading-tight">
          {revealing ? 'มาดูเฉลยกัน' : 'ส่งคำตอบแล้ว'}
        </span>
      </motion.div>
    ) : (
      <motion.div
        drag
        dragSnapToOrigin
        dragElastic={0.18}
        whileDrag={{ scale: 1.15, zIndex: 40 }}
        onDragStart={() => {
          captureRects()
          setDragging(true)
        }}
        onDrag={(_, info) => setHovered(binAt(info))}
        onDragEnd={(_, info) => {
          const bin = binAt(info)
          setDragging(false)
          setHovered(null)
          if (bin) commit(bin)
        }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GameItemImage src={itemImage} emoji={itemEmoji} className="w-20 sm:w-24" />
      </motion.div>
    )

  return (
    // ทุกขนาดวัดจากความสูงจอ (dvh) ไม่ใช่ค่าคงที่ — ช่วงตอบมีแค่ 10 วินาที
    // ถ้าถังแถวล่างตกใต้ขอบจอ ผู้เล่นบนมือถือจอเล็กต้องเลื่อนหาก่อนถึงจะกดได้ = เสียเปรียบ
    // clamp ไว้ด้วย min() เพื่อไม่ให้จอสูงๆ ขยายเกินขนาดที่ออกแบบไว้
    <div className={`flex flex-col items-center gap-2.5 sm:gap-5 w-full ${className}`}>
      {/* ขยะ + ชื่อไอเท็ม อยู่กลางพื้นที่ว่าง ส่วนถังปักไว้ล่างสุดเสมอ (นิ้วโป้งถึงง่ายที่สุด) */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 sm:gap-4">
        <div className="relative z-30">
          {countdown ? (
            <CountdownRing
              endsAt={countdown.endsAt}
              totalMs={countdown.totalMs}
              className="w-[min(13.5rem,21.5dvh)] h-[min(13.5rem,21.5dvh)] sm:w-[min(13rem,26dvh)] sm:h-[min(13rem,26dvh)]"
            >
              {item}
            </CountdownRing>
          ) : (
            <div className="h-[min(9rem,20dvh)] flex items-center justify-center">{item}</div>
          )}
        </div>

        <div className="text-center">
          <p className="text-ink text-base sm:text-2xl font-medium leading-tight">{itemName}</p>
          {!locked && (
            <p className="text-ink/55 text-[11px] sm:text-sm mt-0.5">
              ลากลงถัง หรือแตะถังที่คิดว่าถูก
            </p>
          )}
        </div>
      </div>

      {/* ถังคำตอบ */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full max-w-lg">
        {WASTE.bins.map((bin) => {
          const chosen = answered === bin.id
          return (
            <button
              key={bin.id}
              type="button"
              ref={(el) => {
                if (el) binRefs.current.set(bin.id, el)
                else binRefs.current.delete(bin.id)
              }}
              onClick={() => commit(bin.id)}
              disabled={locked}
              aria-label={`ทิ้งลง${bin.name} ${bin.type}`}
              className={`pop-card flex flex-col items-center gap-0.5 px-2 pt-2 pb-1.5 sm:gap-1 sm:pt-3 sm:pb-2 transition-transform ${
                locked ? '' : 'hover:-translate-y-1 active:translate-y-0.5'
              } ${chosen ? 'ring-4 ring-accent' : ''} ${
                revealing && bin.id === correctBin ? 'ring-4 ring-emerald-500' : ''
              } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent`}
              style={{ borderColor: hovered === bin.id && dragging ? bin.color : undefined }}
            >
              <MascotBin
                color={bin.color}
                mood={moodFor(bin.id)}
                className="w-[min(5rem,8.8dvh)] sm:w-20"
              />
              <span className="text-ink text-[13px] sm:text-base font-medium leading-tight">
                {bin.type}
              </span>
              <span className="text-ink/50 text-[10px] sm:text-xs leading-tight">{bin.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
