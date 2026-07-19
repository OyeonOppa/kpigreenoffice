import { motion } from 'framer-motion'
import { Droplets, MapPin, Thermometer, Wind } from 'lucide-react'
import { useLiveEnvironment, pm25Level } from '../hooks/useLiveEnvironment'
import { AIR_WIDGET } from '../content'

// widget ค่าฝุ่น/อากาศแบบเรียลไทม์ใน hero — ดึงไม่สำเร็จจะไม่แสดง (ไม่โชว์ตัวเลขปลอม)
// ออกแบบให้เป็นจุดเด่นของ hero (ไม่ใช่ pill เล็กๆ) เพราะเป็นข้อมูลสดที่หาที่อื่นในเว็บไม่ได้
export default function LiveEnvWidget() {
  const { data, failed } = useLiveEnvironment()

  if (failed) return null

  const level = data ? pm25Level(data.pm25) : null

  return (
    <div className="liquid-glass liquid-glass-nav rounded-3xl px-5 sm:px-8 py-5 sm:py-6 w-full">
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2 text-ink/65 text-xs">
          <MapPin size={13} />
          {AIR_WIDGET.locationLabel}
        </div>
        {data && (
          <div className="flex items-center gap-1.5 text-ink/65 text-xs">
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-accent"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden
            />
            อัปเดตสด
          </div>
        )}
      </div>

      {!data ? (
        <p className="text-ink/65 text-sm text-center py-4">กำลังโหลดข้อมูลอากาศ…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* PM2.5 — ตัวเด่นสุด สีตามระดับคุณภาพอากาศ */}
          <div
            className="rounded-2xl px-4 py-4 flex items-center gap-3"
            style={{ backgroundColor: `${level!.color}17` }}
          >
            <span
              className="rounded-full p-2.5 shrink-0"
              style={{ backgroundColor: `${level!.color}26`, color: level!.color }}
            >
              <Wind size={20} />
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-3xl sm:text-4xl text-ink leading-none">
                  {data.pm25.toFixed(0)}
                </span>
                <span className="text-ink/65 text-xs">µg/m³</span>
              </div>
              <span className="text-sm font-medium" style={{ color: level!.color }}>
                PM2.5 {level!.label}
              </span>
            </div>
          </div>

          {/* อุณหภูมิ */}
          <div className="rounded-2xl px-4 py-4 flex items-center gap-3 bg-ink/[0.03]">
            <span className="rounded-full p-2.5 shrink-0 bg-accent/10 text-accent-deep">
              <Thermometer size={20} />
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-3xl sm:text-4xl text-ink leading-none">
                  {data.temperature.toFixed(0)}°
                </span>
                <span className="text-ink/65 text-xs">รู้สึกเหมือน {data.apparentTemp.toFixed(0)}°</span>
              </div>
              <span className="text-ink/65 text-sm">อุณหภูมิ</span>
            </div>
          </div>

          {/* ความชื้น */}
          <div className="rounded-2xl px-4 py-4 flex items-center gap-3 bg-ink/[0.03]">
            <span className="rounded-full p-2.5 shrink-0 bg-accent/10 text-accent-deep">
              <Droplets size={20} />
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-3xl sm:text-4xl text-ink leading-none">
                  {data.humidity.toFixed(0)}%
                </span>
              </div>
              <span className="text-ink/65 text-sm">ความชื้นสัมพัทธ์</span>
            </div>
          </div>
        </div>
      )}

      {data && (
        <p className="text-ink/65 text-[11px] text-right mt-3">{AIR_WIDGET.sourceLabel}</p>
      )}
    </div>
  )
}
