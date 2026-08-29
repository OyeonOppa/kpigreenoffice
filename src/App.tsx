import { lazy, Suspense, useEffect } from 'react'
import { useHashRoute } from './game/hooks'
import HomePage from './pages/HomePage'
import LiveHostPage from './pages/LiveHostPage'
import LivePlayerPage from './pages/LivePlayerPage'

// 3D โหลดแยกก้อน — three.js หนัก ห้ามให้ไปถ่วงหน้าแรกกับหน้าเกมแยกขยะ
const ForestPage = lazy(() => import('./pages/ForestPage'))
const TreeLabPage = lazy(() => import('./pages/TreeLabPage'))
// หน้าสตาฟไม่มี 3D แต่โหลดแยกเหมือนกัน — คนใช้มีไม่กี่คน ไม่ต้องให้ทุกคนโหลดติดไปด้วย
const ForestStaffPage = lazy(() => import('./pages/ForestStaffPage'))

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
  if (route === '/forest' || route === '/forest/staff' || route === '/tree-lab') {
    return (
      <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
        {route === '/forest' && <ForestPage />}
        {route === '/forest/staff' && <ForestStaffPage />}
        {route === '/tree-lab' && <TreeLabPage />}
      </Suspense>
    )
  }
  return <HomePage />
}
