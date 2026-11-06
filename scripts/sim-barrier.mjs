// จำลองเกม "ฝ่าด่านลดคาร์บอน" ให้บอทเล่นกันเองทั้งสองฝั่ง เพื่อตรวจว่าเกมจบได้จริง ไม่ค้าง
// และคะแนนใกล้เคียงกับที่ออกแบบไว้ (คะแนนกลางราว 150, เป้า 100/150/200 → ฝ่ายผลักดันชนะราว 75/50/26%)
//
//   node scripts/sim-barrier.mjs        (ต้องใช้ Node 22.18+ ที่รันไฟล์ .ts ได้ตรงๆ)

import { newGame, advance, playMeasure, bRespond, counter, negate, attach, actor, legalBlocks, counterKeys, entryOf, botStep } from '../src/barrier/engine.ts'

const games = 6000
const scores = []
let turns = 0
let stuck = 0
for (let g = 0; g < games; g++) {
  let s = newGame({ human: null, target: 150, pStart: 'edu', bStart: 'ad' })
  s = advance(s)
  if (s.phase !== 'over') {
    stuck++
    continue
  }
  scores.push(s.score)
  turns += s.turn
}
scores.sort((a, b) => a - b)
const q = (p) => scores[Math.floor(p * (scores.length - 1))]
const win = (t) => ((100 * scores.filter((x) => x >= t).length) / scores.length).toFixed(0) + '%'
console.log(JSON.stringify({ games, stuck, avgTurns: +(turns / scores.length).toFixed(1), p25: q(0.25), median: q(0.5), p75: q(0.75) }))
console.log('ฝ่ายผลักดันชนะเมื่อเป้า:', [100, 150, 200].map((t) => `${t} → ${win(t)}`).join('   '))

// ทุกคู่ไอเท็มเริ่มต้น (คะแนนกลาง)
const P = ['edu', 'board', 'net']
const B = ['ad', 'comfort', 'red']
console.log('คะแนนกลางตามไอเท็มเริ่มต้น (แถว=ฝ่ายผลักดัน คอลัมน์=ฝ่ายต่อต้าน)')
for (const p of P) {
  const row = []
  for (const b of B) {
    const sc = []
    for (let g = 0; g < 1500; g++) sc.push(advance(newGame({ human: null, target: 150, pStart: p, bStart: b })).score)
    sc.sort((x, y) => x - y)
    row.push(String(sc[Math.floor(sc.length / 2)]).padStart(4))
  }
  console.log(p.padEnd(6), row.join(' '))
}

// ตรวจกติกาด้วยมือ
{
  const ok = (cond, label) => console.log(cond ? 'ok  ' : 'FAIL', label)
  // มนุษย์ฝ่ายผลักดัน: วางมาตรการ → ฝ่ายต่อต้านปิด → แก้ด้วยกุญแจ
  let found = 0
  for (let tries = 0; tries < 400 && found < 2; tries++) {
    let s = newGame({ human: 'P', target: 100, pStart: 'edu', bStart: 'ad' })
    const m = s.pHand.find((c) => c.kind === 'measure')
    if (!m) continue
    s = playMeasure(s, m.id)
    if (s.phase !== 'b-respond') continue
    const blocks = legalBlocks(s)
    if (!blocks.length) continue
    // ฝ่ายต่อต้านวางด่านที่ตรง
    const before = s.table.length
    s = bRespond(s, { t: 'block', cardId: blocks[0].id })
    if (s.phase === 'counter') {
      const keys = counterKeys(s, s.pending.block, entryOf(s, s.pending.entryId))
      const s2 = counter(s, null)
      ok(s2.table.length === before - 1 && s2.phase === 'p-turn', 'ไม่ตอบโต้ → มาตรการถูกปิดทิ้ง และขึ้นตาใหม่')
      if (keys.length) {
        const s3 = counter(s, keys[0].id)
        ok(s3.table.length === before && s3.phase === 'p-turn', 'ตอบโต้ด้วยกุญแจที่ตรง → มาตรการรอด')
        ok(!s3.pHand.some((c) => c.id === keys[0].id), 'กุญแจที่ใช้ถูกทิ้งจากมือ')
      }
      found++
    }
  }
  ok(found > 0, 'เจอสถานการณ์ปิด/ตอบโต้ในการทดลอง (ไม่งั้นการตรวจด้านบนไม่ทำงาน)')
  // ด่านที่ไอคอนไม่ตรง วางไม่ได้
  {
    let s = newGame({ human: 'P', target: 100, pStart: 'edu', bStart: 'ad' })
    const m = s.pHand.find((c) => c.kind === 'measure')
    s = playMeasure(s, m.id)
    const bad = s.bHand.find((c) => c.kind === 'block' && !m.icons.some((i) => c.icons.includes(i)))
    if (bad) ok(bRespond(s, { t: 'block', cardId: bad.id }) === s, 'ด่านที่ไอคอนไม่ตรง วางไม่ได้')
  }
  void attach, negate, actor, botStep
}
