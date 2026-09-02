import { GameRoom, type Env } from './room'
import { handleForest } from './forest/handler'

export { GameRoom }

// ห้องหนึ่ง = Durable Object หนึ่งตัว ตั้งชื่อด้วย PIN
// getByName ทำให้ PIN เดียวกันวิ่งไปที่ object เดิมเสมอ ไม่ว่าจะเรียกจากที่ไหน

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin') ?? ''
  const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  if (!allowed.includes(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  }
}

function isOriginAllowed(request: Request, env: Env): boolean {
  const origin = request.headers.get('Origin')
  // ไม่มี Origin = เรียกจาก curl/เครื่องมือทดสอบ ปล่อยผ่าน (ยังต้องผ่าน auth อยู่ดี)
  if (!origin) return true
  const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  return allowed.length === 0 || allowed.includes(origin)
}

function randomPin(): string {
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  return String(100000 + (bytes[0] % 900000))
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const cors = corsHeaders(request, env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    if (!isOriginAllowed(request, env)) {
      return new Response('ไม่อนุญาตให้เรียกจากเว็บนี้', { status: 403 })
    }

    // สร้างห้องใหม่ — คืน PIN ให้เครื่องสตาฟ
    if (url.pathname === '/api/room' && request.method === 'POST') {
      const pin = randomPin()
      const stub = env.GAME_ROOM.getByName(pin)
      await stub.fetch(new Request(`https://room/create?pin=${pin}`))
      return Response.json({ pin }, { headers: cors })
    }

    // ต่อ WebSocket เข้าห้อง
    if (url.pathname === '/api/ws') {
      const pin = url.searchParams.get('pin')
      if (!pin || !/^\d{6}$/.test(pin)) {
        return new Response('PIN ไม่ถูกต้อง', { status: 400, headers: cors })
      }
      const stub = env.GAME_ROOM.getByName(pin)
      return stub.fetch(request)
    }

    if (url.pathname === '/api/health') {
      return Response.json({ ok: true, now: Date.now() }, { headers: cors })
    }

    // แคมเปญป่า 3R — REST + D1 (คืน null ถ้าไม่ใช่เส้นทาง /api/forest/*)
    const forest = await handleForest(request, url, env, cors)
    if (forest) return forest

    return new Response('ไม่พบเส้นทางนี้', { status: 404, headers: cors })
  },
} satisfies ExportedHandler<Env>
