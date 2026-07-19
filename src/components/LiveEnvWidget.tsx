import { MapPin } from 'lucide-react'
import { useLiveEnvironment, pm25Level } from '../hooks/useLiveEnvironment'
import { AIR_WIDGET } from '../content'

// widget ค่าฝุ่น/อากาศแบบเรียลไทม์ใน hero — ดึงไม่สำเร็จจะไม่แสดง (ไม่โชว์ตัวเลขปลอม)
export default function LiveEnvWidget() {
  const { data, failed } = useLiveEnvironment()

  if (failed) return null

  const level = data ? pm25Level(data.pm25) : null
  const Dot = () => <span className="hidden sm:inline text-ink/25" aria-hidden>·</span>

  return (
    <div className="liquid-glass rounded-2xl px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-x-5 gap-y-2.5 text-center">
      <div className="flex items-center gap-1.5 text-ink/65 text-xs">
        <MapPin size={13} />
        {AIR_WIDGET.locationLabel}
      </div>

      {data && level ? (
        <>
          <Dot />
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: level.color }}
              aria-hidden
            />
            <span className="text-ink text-sm font-medium">PM2.5 {data.pm25.toFixed(0)}</span>
            <span className="text-ink/65 text-xs">µg/m³ · {level.label}</span>
          </div>
          <Dot />
          <div className="text-sm">
            <span className="text-ink font-medium">{data.temperature.toFixed(0)}°C</span>{' '}
            <span className="text-ink/65 text-xs">
              รู้สึกเหมือน {data.apparentTemp.toFixed(0)}°C
            </span>
          </div>
          <Dot />
          <div className="text-ink/65 text-xs">ความชื้น {data.humidity.toFixed(0)}%</div>
          <div className="text-ink/65 text-[11px] w-full sm:w-auto sm:ml-1">
            {AIR_WIDGET.sourceLabel}
          </div>
        </>
      ) : (
        <span className="text-ink/65 text-xs">กำลังโหลดข้อมูลอากาศ…</span>
      )}
    </div>
  )
}
