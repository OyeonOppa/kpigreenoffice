// จำลองเกม "ย่อยนานแค่ไหน?" ให้บอทเล่นกันเอง ตรวจว่าจบได้ไม่ค้าง และกติกาตรวจถูก
//   node scripts/sim-decompose.mjs   (Node 22.18+)
import { newGame, botAct, next, place, fits, legalSlots, itemOf } from '../src/decompose/engine.ts'
import { ITEMS } from '../src/decompose/cards.ts'

// 1) กติกาตรวจ: ทุกตำแหน่งที่ fits ต้องทำให้แถวยังเรียงไม่ลดลง
let bad = 0
for (const it of ITEMS) for (let t = 0; t < 40; t++) {
  const row = ITEMS.filter((_, i) => i % 3 === t % 3).sort((a, b) => a.tier - b.tier).map((i) => i.id).slice(0, 6)
  for (const i of legalSlots(row, it.tier)) {
    const r = [...row]; r.splice(i, 0, it.id)
    const tiers = r.map((x) => itemOf(x).tier)
    if (tiers.some((v, k) => k && v < tiers[k - 1])) bad++
  }
}
console.log('ordering violations:', bad)

// 2) versus: บอทล้วน (ให้บอทเล่นแทนมนุษย์ด้วย)
let stuck = 0, turns = 0
const wins = {}
for (let g = 0; g < 3000; g++) {
  let s = newGame('versus', 3)
  s.players[0].err = 0.25
  let n = 0
  while (s.phase !== 'over' && n++ < 500) s = s.phase === 'reveal' ? next(s) : botAct(s)
  if (s.phase !== 'over') { stuck++; continue }
  turns += n; wins[s.winner] = (wins[s.winner] || 0) + 1
}
console.log('versus stuck', stuck, 'avg steps', (turns / 3000).toFixed(1), 'wins', JSON.stringify(wins))

// 3) coop: คนเล่นแบบเดาผิดบ้าง
for (const err of [0.15, 0.3, 0.45]) {
  let win = 0, st = 0
  for (let g = 0; g < 3000; g++) {
    let s = newGame('coop', 0)
    s.players[0].hand = []
    let n = 0
    while (s.phase !== 'over' && n++ < 200) {
      if (s.phase === 'reveal') { s = next(s); continue }
      const real = itemOf(s.drawn).tier
      const guess = Math.random() < err ? Math.min(6, Math.max(1, real + (Math.random() < 0.5 ? -1 : 1))) : real
      const slots = []; for (let i = 0; i <= s.row.length; i++) if (fits(s.row, i, guess)) slots.push(i)
      s = place(s, s.drawn, slots[Math.floor(Math.random() * slots.length)] ?? 0)
    }
    if (s.phase !== 'over') st++; else if (s.won) win++
  }
  console.log(`coop err=${err}: win ${(win / 30).toFixed(0)}% stuck ${st}`)
}
