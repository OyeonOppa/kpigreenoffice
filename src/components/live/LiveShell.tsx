import { useState, type ReactNode } from 'react'
import { Home, Volume2, VolumeX } from 'lucide-react'
import { IS_REHEARSAL, backend } from '../../game'
import { sfx } from '../../game/sfx'

interface LiveShellProps {
  children: ReactNode
  /** จอกลางใช้เต็มจอไม่ให้เลื่อน ส่วนมือถือให้เลื่อนได้ */
  fill?: boolean
  topRight?: ReactNode
}

// กรอบหน้าเกม — พื้นหลังพาสเทล ปุ่มปิดเสียง และทางกลับหน้าแรก
export default function LiveShell({ children, fill = false, topRight }: LiveShellProps) {
  const [muted, setMuted] = useState(sfx.muted)

  return (
    <div className={`game-bg ${fill ? 'h-dvh overflow-hidden' : 'min-h-dvh'} flex flex-col`}>
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2 sm:py-3 shrink-0">
        <a
          href="#"
          className="inline-flex items-center gap-1.5 text-ink/60 hover:text-ink text-sm transition-colors"
        >
          <Home size={16} /> หน้าแรก
        </a>
        <div className="flex items-center gap-2">
          {topRight}
          {IS_REHEARSAL && (
            <span className="rounded-full bg-amber-100 text-amber-900 text-[11px] px-2.5 py-1 border border-amber-300">
              {backend.isMock ? 'โหมดจำลอง' : 'โหมดซ้อม'}
            </span>
          )}
          <button
            type="button"
            onClick={() => setMuted(sfx.toggleMute())}
            aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
            className="rounded-full p-2 text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors"
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      <div className={`flex-1 ${fill ? 'min-h-0' : ''} px-3 sm:px-6 pb-3 sm:pb-6`}>{children}</div>
    </div>
  )
}
