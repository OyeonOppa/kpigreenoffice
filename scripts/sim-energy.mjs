// ตรวจเกม "ตรวจออฟฟิศก่อนกลับบ้าน": ทำถูกทุกอย่างต้องได้ 100%, ไม่ทำอะไรได้เท่าไร, ปิดทุกอย่างได้เท่าไร
//   node scripts/sim-energy.mjs   (Node 22.18+)
import { newGame, perfect, judge, score, setDevice, devDef } from '../src/energy/engine.ts'
let bad = 0, noop = [], allOff = [], wasteSpots = [], rooms = new Set()
for (let i = 0; i < 5000; i++) {
  const g = newGame(5)
  const occ = g.rooms.filter((r) => r.occupied).length
  if (occ < 1 || g.rooms.length - occ < 2) bad++
  g.rooms.forEach((r) => rooms.add(r.id))
  if (score(judge(perfect(g))).pct !== 100) bad++
  noop.push(score(judge(g)).pct)
  let a = g
  for (const r of g.rooms) for (const d of r.devices) a = setDevice(a, r.id, d.id, { on: false })
  allOff.push(score(judge(a)).pct)
  wasteSpots.push(judge(g).filter((v) => !v.ok).length)
}
const avg = (x) => (x.reduce((a, b) => a + b) / x.length).toFixed(0)
console.log('invalid games:', bad, '| rooms seen:', rooms.size, '/ 8')
console.log('ไม่ทำอะไร เฉลี่ย', avg(noop) + '%', '| ปิดทุกอย่าง เฉลี่ย', avg(allOff) + '%', '| จุดที่ต้องแก้ต่อเกม เฉลี่ย', (wasteSpots.reduce((a, b) => a + b) / 5000).toFixed(1))
