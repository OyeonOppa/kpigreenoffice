import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// HTML ที่สร้างล่วงหน้าเป็นหน้าแรก ถ้าเปิดด้วย #/forest หรือ #/live เนื้อหาจะคนละหน้า จึงต้องวาดใหม่ทั้งหมด
if (container.firstElementChild && !window.location.hash.startsWith('#/')) hydrateRoot(container, app)
else createRoot(container).render(app)
