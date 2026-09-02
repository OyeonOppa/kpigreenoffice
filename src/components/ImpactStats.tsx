import { FileText, Recycle, Users, Zap, type LucideIcon } from 'lucide-react'
import { EMISSION_FACTORS, ORG_IMPACT } from '../content'

const ICONS: Record<string, LucideIcon> = {
  energy: Zap,
  paper: FileText,
  recycle: Recycle,
  people: Users,
}

const nf = new Intl.NumberFormat('th-TH')

/**
 * ตัวชี้วัดการลดคาร์บอนของทั้งองค์กร — แสดงในบล็อก "ผลลัพธ์ของทั้งองค์กร" ใน HeroSection (#dashboard)
 *
 * ตัวเลขทุกตัวอ่านจาก ORG_IMPACT แหล่งเดียว ไม่มีชุดตัวเลขซ้อนที่อื่นในหน้า
 *
 * ORG_IMPACT.reported = false → ไม่โชว์ตัวเลข โชว์ชื่อตัวชี้วัดกับป้าย "รอรายงานรอบแรก" แทน
 * ตั้งใจให้เป็นแบบนี้ ไม่ใช่หน้าจอที่ยังทำไม่เสร็จ — ดูเหตุผลที่ ORG_IMPACT ใน content.ts
 */
export default function ImpactStats() {
  const { reported, carbonSavedKg, carbonGoalKg, pendingLabel } = ORG_IMPACT
  const hasCarbon = reported && carbonSavedKg !== null
  const carbonPct = hasCarbon ? Math.min(1, carbonSavedKg / carbonGoalKg) : 0
  // เทียบเป็นจำนวนต้นไม้จากค่าดูดซับของ TGO ที่ใช้ในเครื่องคำนวณหน้าเดียวกัน
  // (เดิมเป็นข้อความตายตัว "220 ต้น" ซึ่งไม่ตรงกับค่าที่เว็บนี้ใช้คำนวณเอง)
  const trees = hasCarbon ? Math.round(carbonSavedKg / EMISSION_FACTORS.kgPerTreePerYear) : 0

  return (
    <div className="w-full">
      <p className="text-ink/65 text-sm sm:text-base leading-relaxed mb-4 max-w-2xl mx-auto text-center">
        {ORG_IMPACT.intro}
      </p>
      <p className="text-ink/55 text-xs sm:text-sm text-center mb-7 max-w-2xl mx-auto">
        {ORG_IMPACT.periodLabel}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* คาร์บอนรวม — ตัวเลขหลักของคณะทำงาน แยกจากแต้มกิจกรรมในป่า 3R
            เพราะคนละหน่วยคนละเรื่อง เอามารวมแถบเดียวกันเมื่อไรคนอ่านจะสับสนทันที */}
        <div className="col-span-2 liquid-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5">
          {hasCarbon ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl sm:text-4xl text-ink leading-none tabular">
                  {nf.format(carbonSavedKg)}
                </span>
                <span className="text-ink/55 text-xs">kg CO₂e</span>
              </div>
              <p className="text-ink text-sm font-medium mt-1">คาร์บอนที่ทั้งองค์กรลดได้แล้ว</p>

              <div className="mt-3 h-2 rounded-full bg-ink/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-out"
                  style={{ width: `${carbonPct * 100}%` }}
                />
              </div>
              <p className="text-ink/50 text-xs leading-snug mt-2">
                {Math.round(carbonPct * 100)}% ของเป้าปีนี้ ({nf.format(carbonGoalKg)} kg CO₂e) ·
                เทียบเท่าการปลูกต้นไม้ราว {nf.format(trees)} ต้น ให้ดูดซับคาร์บอนหนึ่งปี
              </p>
            </>
          ) : (
            <>
              <Pending label={pendingLabel} />
              <p className="text-ink text-sm font-medium mt-2">คาร์บอนที่ทั้งองค์กรลดได้</p>
              <p className="text-ink/50 text-xs leading-snug mt-1">
                รวมทุกมาตรการเป็นหน่วยเดียวกัน (kg CO₂e) เทียบกับเป้าหมายที่หน่วยงานประกาศ
              </p>
            </>
          )}
        </div>

        {ORG_IMPACT.stats.map((s) => {
          const Icon = ICONS[s.icon] ?? Zap
          return (
            <div key={s.id} className="liquid-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5">
              <span className="liquid-glass rounded-full p-2.5 text-accent-deep inline-flex mb-3">
                <Icon size={18} />
              </span>
              {reported && s.value !== null ? (
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-2xl sm:text-3xl text-ink leading-none tabular">
                    {nf.format(s.value)}
                  </span>
                  <span className="text-ink/55 text-xs">{s.unit}</span>
                </div>
              ) : (
                <Pending label={pendingLabel} />
              )}
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

/** ป้ายแทนตัวเลขตอนที่ยังไม่มีรายงาน — ให้ที่ว่างดูตั้งใจ ไม่ใช่ตัวเลขที่โหลดไม่ขึ้น */
function Pending({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/[0.06] text-ink/55 text-xs px-2.5 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-ink/25" aria-hidden />
      {label}
    </span>
  )
}
