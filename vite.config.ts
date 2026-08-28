import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // เลือกหลังบ้านของเกมแข่งสดตั้งแต่ตอน build
  //
  // ทำเป็น alias แทนการเขียน if ในโค้ด เพราะต้องการ "รับประกัน" ว่าโหมดจริง
  // จะไม่มีโมดูลจำลองติดไปด้วย โมดูลจำลอง import คลังคำถามซึ่งมีคำเฉลยอยู่
  // ถ้าปล่อยให้ bundler ตัดเองมันตัดไม่ขาด (ลองแล้ว) — วิธีนี้โมดูลไม่เข้ากราฟตั้งแต่แรก
  const liveBackend = env.VITE_LIVE_API
    ? '/src/game/cloudflareBackend.ts'
    : '/src/game/mockBackend.ts'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        'virtual:live-backend': liveBackend,
      },
    },
    server: {
      watch: {
        // ห้ามเฝ้าโฟลเดอร์ worker — wrangler dev เขียนไฟล์ SQLite ของ Durable Object
        // ตลอดเวลาที่เกมเดิน ถ้าเฝ้าไว้ Vite จะสั่งรีโหลดหน้าเว็บทุกครั้งที่มีคนตอบ
        ignored: ['**/worker/**'],
      },
    },
  }
})
