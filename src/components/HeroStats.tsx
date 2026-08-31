import { FileText, Recycle, Users, Zap, type LucideIcon } from 'lucide-react'
import { ORG_IMPACT } from '../content'

const ICONS: Record<string, LucideIcon> = {
  energy: Zap,
  paper: FileText,
  recycle: Recycle,
  people: Users,
}

const nf = new Intl.NumberFormat('th-TH')

// ฝั่งขวาของ hero — สถิติการลดคาร์บอนรายมิติของทั้งองค์กร
export default function HeroStats() {
  return (
    <div className="w-full">
      <p className="text-accent-deep text-xs sm:text-sm font-medium tracking-widest uppercase mb-3">
        {ORG_IMPACT.label}
      </p>
      <h2 className="font-display text-3xl sm:text-4xl md:text-[2.75rem] text-ink leading-[1.15] tracking-tight mb-4">
        {ORG_IMPACT.heading}
      </h2>
      <p className="text-ink/65 text-sm sm:text-base leading-relaxed mb-7 max-w-md">
        {ORG_IMPACT.intro}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {ORG_IMPACT.stats.map((s) => {
          const Icon = ICONS[s.icon] ?? Zap
          return (
            <div
              key={s.id}
              className="liquid-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5"
            >
              <span className="liquid-glass rounded-full p-2.5 text-accent-deep inline-flex mb-3">
                <Icon size={18} />
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-2xl sm:text-3xl text-ink leading-none tabular">
                  {nf.format(s.value)}
                </span>
                <span className="text-ink/55 text-xs">{s.unit}</span>
              </div>
              <p className="text-ink text-sm font-medium mt-1">{s.label}</p>
              <p className="text-ink/50 text-xs leading-snug mt-1">{s.caption}</p>
            </div>
          )
        })}
      </div>

      <p className="text-ink/50 text-[11px] mt-4">{ORG_IMPACT.note}</p>
    </div>
  )
}
