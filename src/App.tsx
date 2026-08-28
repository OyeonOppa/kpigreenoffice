import { useEffect } from 'react'
import { useHashRoute } from './game/hooks'
import HomePage from './pages/HomePage'
import LiveHostPage from './pages/LiveHostPage'
import LivePlayerPage from './pages/LivePlayerPage'

// เส้นทางแบบ hash — โฮสต์แบบ static ไฟล์เดียวใช้ได้เลย ไม่ต้องตั้ง rewrite ที่เซิร์ฟเวอร์
// `#/live` = หน้าเกม ส่วน `#waste` `#calculator` เดิมยังเป็น anchor ในหน้าแรกเหมือนเดิม
export default function App() {
  const route = useHashRoute()

  useEffect(() => {
    // เข้าหน้าเกมแล้วให้เริ่มที่บนสุดเสมอ ไม่ค้างตำแหน่งเดิมจากหน้าแรก
    if (route !== '/') window.scrollTo(0, 0)
  }, [route])

  if (route === '/live') return <LivePlayerPage />
  if (route === '/live/host') return <LiveHostPage />
  return <HomePage />
}
