import { motion } from 'framer-motion'
import type { BoardEntry } from '../../game'
import PlayerAvatar from './PlayerAvatar'

interface LeaderboardProps {
  entries: BoardEntry[]
  /** ไฮไลต์แถวของตัวเอง */
  highlightUid?: string
  /** จอกลางใช้ตัวใหญ่ มือถือใช้ตัวเล็ก */
  size?: 'sm' | 'lg'
  limit?: number
  /**
   * แบ่งความสูงที่มีให้ทุกแถวเท่าๆ กันแทนการไล่เรียงลงไปเรื่อยๆ
   * ใช้บนจอโปรเจกเตอร์: 10 อันดับต้องเห็นครบในจอเดียว ห้ามมีแถวตกใต้ขอบให้ต้องเลื่อนหา
   */
  fill?: boolean
}

const MEDAL = ['🥇', '🥈', '🥉']

export default function Leaderboard({
  entries,
  highlightUid,
  size = 'sm',
  limit,
  fill = false,
}: LeaderboardProps) {
  const rows = limit ? entries.slice(0, limit) : entries
  const lg = size === 'lg'

  if (rows.length === 0) {
    return <p className="text-ink/60 text-center py-6">ยังไม่มีคะแนน</p>
  }

  return (
    <ol
      className={
        fill
          ? `grid h-full min-h-0 ${lg ? 'gap-2' : 'gap-1.5'}`
          : lg
            ? 'space-y-2.5'
            : 'space-y-2'
      }
      style={fill ? { gridTemplateRows: `repeat(${rows.length}, minmax(0, 1fr))` } : undefined}
    >
      {rows.map((entry) => {
        const me = entry.uid === highlightUid
        return (
          <motion.li
            key={entry.uid}
            layout
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={`flex items-center gap-3 overflow-hidden rounded-2xl ${
              fill ? (lg ? 'min-h-0 px-5' : 'min-h-0 px-3') : lg ? 'px-5 py-3' : 'px-3 py-2'
            } ${me ? 'bg-accent/15 ring-2 ring-accent' : 'bg-ink/[0.04]'}`}
          >
            <span
              className={`tabular shrink-0 text-center ${lg ? 'w-12 text-2xl' : 'w-8 text-base'} font-semibold text-ink/70`}
            >
              {entry.rank <= 3 ? MEDAL[entry.rank - 1] : entry.rank}
            </span>
            <PlayerAvatar look={entry.look} size={lg ? 42 : 28} />
            <span className="flex-1 min-w-0">
              <span className={`block truncate text-ink ${lg ? 'text-xl' : 'text-sm'} font-medium`}>
                {entry.name}
                {me && <span className="text-accent-deep text-xs ml-2">คุณ</span>}
              </span>
            </span>
            {entry.delta > 0 && (
              <span
                className={`tabular shrink-0 text-emerald-700 ${lg ? 'text-base' : 'text-xs'} font-medium`}
              >
                +{entry.delta}
              </span>
            )}
            <span
              className={`tabular shrink-0 text-ink font-semibold ${lg ? 'text-2xl w-24' : 'text-base w-14'} text-right`}
            >
              {entry.score.toLocaleString('th-TH')}
            </span>
          </motion.li>
        )
      })}
    </ol>
  )
}
