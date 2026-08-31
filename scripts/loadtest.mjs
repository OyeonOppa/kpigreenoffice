// ทดสอบโหลด — เปิด WebSocket ปลอมหลายๆ เส้นเข้าห้องเดียวกัน จำลองผู้เล่นจริง
//
// ใช้ตอนอยากรู้ว่าเซิร์ฟเวอร์รับคนพร้อมกันหลักร้อยไหวไหม ก่อนงานจริง
//
//   1) สร้างห้องจากจอ Host ให้ได้ PIN มาก่อน (อย่าเพิ่งกดเริ่มเกม)
//   2) node scripts/loadtest.mjs <API_BASE> <PIN> [จำนวนคน]
//        local : node scripts/loadtest.mjs http://127.0.0.1:8787 123456 250
//        จริง  : node scripts/loadtest.mjs https://kpigreenoffice-live.xxx.workers.dev 123456 250
//   3) กลับไปกด"เริ่มเกม"ที่จอ Host แล้วดูว่าจอเดินลื่นไหม ตัวเลขคนตอบขึ้นครบไหม
//   4) Ctrl+C เพื่อปิดผู้เล่นปลอมทั้งหมด
//
// ต้องใช้ Node 22+ (มี global WebSocket และ crypto.randomUUID)

const [apiBase, pin, countArg] = process.argv.slice(2)
if (!apiBase || !pin) {
  console.error('ใช้: node scripts/loadtest.mjs <API_BASE> <PIN> [จำนวนคน=250]')
  process.exit(1)
}
const COUNT = Number(countArg) || 250
const wsBase = apiBase.replace(/^http/, 'ws').replace(/\/$/, '')
const BINS = ['organic', 'recycle', 'general', 'hazard']
const rnd = (n) => Math.floor(Math.random() * n)

let connected = 0
let joined = 0
let errors = 0
const clients = []

function spawn(i) {
  const uid = `g-load${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`
  const name = `โหลด ${i + 1}`
  const answered = new Set()
  let ws

  const open = () => {
    ws = new WebSocket(`${wsBase}/api/ws?pin=${pin}`)
    clients[i] = ws
    ws.addEventListener('open', () => {
      connected++
      ws.send(JSON.stringify({ t: 'auth', uid, name }))
      // เผื่อ auth ถึงก่อน แล้วค่อย join
      setTimeout(() => {
        ws.send(
          JSON.stringify({
            t: 'join',
            name,
            team: '',
            look: { base: '🐰', color: '#caffbf', hat: '', gear: '' },
          }),
        )
      }, 200 + rnd(300))
    })
    ws.addEventListener('message', (ev) => {
      let msg
      try {
        msg = JSON.parse(ev.data)
      } catch {
        return
      }
      if (msg.t === 'joined' && msg.ok) joined++
      if (msg.t === 'room' && msg.room?.phase === 'answering') {
        const round = msg.room.roundIndex
        if (!answered.has(round)) {
          answered.add(round)
          // ตอบกระจายทั่วช่วง 10 วิ เหมือนคนจริง
          setTimeout(
            () => {
              try {
                ws.send(JSON.stringify({ t: 'answer', round, bin: BINS[rnd(4)] }))
              } catch {
                /* ปิดไปแล้ว */
              }
            },
            500 + rnd(8000),
          )
        }
      }
    })
    ws.addEventListener('close', () => {
      connected--
      if (!stopping) setTimeout(open, 500 + rnd(1500)) // จำลองเน็ตหลุดแล้วต่อใหม่
    })
    ws.addEventListener('error', () => {
      errors++
    })
  }
  open()
}

// ทยอยเปิด ไม่เปิดพรวดเดียว — เหมือนคนไล่ๆ กันสแกน QR
let i = 0
const timer = setInterval(() => {
  if (i >= COUNT) {
    clearInterval(timer)
    return
  }
  spawn(i++)
}, 30)

let stopping = false
process.on('SIGINT', () => {
  stopping = true
  console.log('\nกำลังปิดผู้เล่นปลอม…')
  for (const ws of clients) {
    try {
      ws.close()
    } catch {
      /* noop */
    }
  }
  setTimeout(() => process.exit(0), 500)
})

setInterval(() => {
  console.log(
    `เปิดแล้ว ${i}/${COUNT} · ต่ออยู่ ${connected} · เข้าห้องสำเร็จ ${joined} · error ${errors}`,
  )
}, 2000)
