import { useEffect, useState } from 'react'
import { AIR_WIDGET } from '../content'

export interface LiveEnvironment {
  pm25: number
  pm10: number
  temperature: number
  apparentTemp: number
  humidity: number
  uvIndex: number
  updatedAt: string
}

// เกณฑ์ PM2.5 ของไทย (กรมควบคุมมลพิษ ปรับปรุง 2566) หน่วย µg/m³ เฉลี่ย 24 ชม.
// สีปรับให้เข้มพอผ่าน WCAG AA (4.5:1) บนพื้นผิวการ์ดสีขาว — ไม่ใช้เฉด Tailwind ตรงๆ
// เพราะหลายเฉดจางเกินไปเมื่อใช้เป็นตัวหนังสือ (ทดสอบแล้วได้ ~5.2-5.3:1 ทุกเฉด)
export function pm25Level(pm25: number): { label: string; color: string } {
  if (pm25 <= 15) return { label: 'ดีมาก', color: '#006fab' }
  if (pm25 <= 25) return { label: 'ดี', color: '#017c1f' }
  if (pm25 <= 37.5) return { label: 'ปานกลาง', color: '#956000' }
  if (pm25 <= 75) return { label: 'เริ่มมีผลต่อสุขภาพ', color: '#b64700' }
  return { label: 'มีผลต่อสุขภาพ', color: '#c53637' }
}

// ดึงข้อมูลจริงจาก Open-Meteo (ฟรี ไม่ต้องใช้ API key, CORS เปิด)
// ถ้าดึงไม่สำเร็จ คืน null — UI ต้องซ่อน widget แทนการโชว์ตัวเลขปลอม
export function useLiveEnvironment() {
  const [data, setData] = useState<LiveEnvironment | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const { latitude, longitude } = AIR_WIDGET
    const base = `latitude=${latitude}&longitude=${longitude}&timezone=Asia%2FBangkok`
    const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${base}&current=pm2_5,pm10`
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?${base}&current=temperature_2m,apparent_temperature,relative_humidity_2m,uv_index`

    let cancelled = false
    Promise.all([fetch(airUrl), fetch(weatherUrl)])
      .then(async ([airRes, weatherRes]) => {
        if (!airRes.ok || !weatherRes.ok) throw new Error('fetch failed')
        const air = await airRes.json()
        const weather = await weatherRes.json()
        if (cancelled) return
        setData({
          pm25: air.current.pm2_5,
          pm10: air.current.pm10,
          temperature: weather.current.temperature_2m,
          apparentTemp: weather.current.apparent_temperature,
          humidity: weather.current.relative_humidity_2m,
          uvIndex: weather.current.uv_index,
          updatedAt: weather.current.time,
        })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { data, failed }
}
