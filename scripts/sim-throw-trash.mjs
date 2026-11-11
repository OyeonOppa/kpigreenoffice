// จำลองเกม "โยนขยะ!" ให้บอทเล่นกันเอง เพื่อตรวจว่าเกมจบได้จริงในเวลาที่สมเหตุสมผล
//
//   node scripts/sim-throw-trash.mjs            (ต้องใช้ Node 22.18+ ที่รันไฟล์ .ts ได้ตรงๆ)
//
// ผลที่ดูได้: อัตราเกมที่จบได้ (ไม่ค้างจนกองจั่ววนครบลิมิต) / จำนวน "ตา" รวมทุกคนก่อนจบเกม

import { botStep, catchEligible, needsBot, newGame, resolveCatch } from '../src/throwTrash/engine.ts'

function simOne(players, maxSteps = 50000) {
  let g = newGame(players - 1)
  g.players.forEach((p) => (p.human = false))
  let steps = 0
  let rounds = 0
  let lastTurn = g.turn
  while (g.phase === 'turn' && steps < maxSteps) {
    if (needsBot(g)) {
      g = botStep(g)
    } else if (g.pending?.kind === 'catch') {
      // จำลองช่วงจับผิด: สุ่มเหมือนมีคนกดทันครึ่งหนึ่งของเวลา
      const eligible = catchEligible(g)
      const catcher = Math.random() < 0.5 && eligible.length ? eligible[Math.floor(Math.random() * eligible.length)] : null
      g = resolveCatch(g, catcher)
    } else {
      break
    }
    if (g.turn !== lastTurn) {
      rounds++
      lastTurn = g.turn
    }
    steps++
  }
  return g.phase === 'over' ? rounds : null
}

function run(players, games = 300) {
  const rounds = []
  let stuck = 0
  for (let i = 0; i < games; i++) {
    const r = simOne(players)
    if (r === null) stuck++
    else rounds.push(r)
  }
  rounds.sort((a, b) => a - b)
  const pct = (p) => rounds[Math.floor(rounds.length * p)] ?? 0
  const avg = rounds.length ? rounds.reduce((a, b) => a + b, 0) / rounds.length : 0
  console.log(`${players} คน: จบเกม ${rounds.length}/${games} (ติดค้าง ${stuck}) · ตาเฉลี่ย ${avg.toFixed(1)} · Q1/กลาง/Q3 = ${pct(0.25)}/${pct(0.5)}/${pct(0.75)}`)
}

for (const players of [2, 3, 4, 5, 6]) run(players)
