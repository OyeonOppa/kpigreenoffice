import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  BookOpenText,
  Calculator,
  ChartLine,
  FileCheck2,
  Gamepad2,
  Handshake,
  ListChecks,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { QUICK_ACTIONS } from '../content'

const ICONS: Record<(typeof QUICK_ACTIONS)[number]['id'], LucideIcon> = {
  policy: FileCheck2,
  calculator: Calculator,
  game: Gamepad2,
  bins: Trash2,
  actions: ListChecks,
  media: BookOpenText,
  partners: Handshake,
  dashboard: ChartLine,
}

// การ์ดทางลัดแบบ greener.bangkok — ไอคอน + ป้ายชื่อ กดแล้ว scroll ไป section
export default function QuickActionsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <section ref={ref} className="bg-canvas pt-16 md:pt-20 pb-4 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {QUICK_ACTIONS.map((action, i) => {
            const Icon = ICONS[action.id]
            return (
              <motion.a
                key={action.id}
                href={action.href}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="liquid-glass rounded-2xl px-4 py-5 flex flex-col items-center gap-3 text-center hover:bg-ink/5 transition-colors"
              >
                <span className="bg-accent/10 text-accent-deep rounded-full p-3">
                  <Icon size={22} />
                </span>
                <span className="text-ink text-sm font-medium leading-tight">{action.label}</span>
              </motion.a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
