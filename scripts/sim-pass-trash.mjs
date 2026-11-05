// จำลองเกม "ส่งต่อขยะ" ให้บอทเล่นกันเอง เพื่อตรวจว่าเกมจบได้จริง ไม่ค้าง และเกณฑ์แพ้พอเหมาะ
//
//   node scripts/sim-pass-trash.mjs            (ต้องใช้ Node 22.18+ ที่รันไฟล์ .ts ได้ตรงๆ)
//
// ผลที่ดูได้: จำนวนตาเฉลี่ย / แพ้เพราะอะไร / ใครแพ้บ่อย (ที่นั่งแรกได้เปรียบเสียเปรียบไหม) / อัตราโกหก

import { newGame, advanceBots, offerCard, respond, repass, next, actor, targetsFor, canPeek, botAct } from '../src/passTrash/engine.ts'

function run(players, limit, games = 4000) {
  let rounds = 0
  const reasons = { limit: 0, empty: 0 }
  const loserSeat = Array(players).fill(0)
  let stuck = 0
  for (let g = 0; g < games; g++) {
    let s = newGame(players - 1, { limit, allBots: true })
    s = advanceBots(s)
    if (s.phase !== 'over') {
      stuck++
      continue
    }
    rounds += s.round
    reasons[s.overReason]++
    loserSeat[s.loser]++
  }
  const done = games - stuck
  return {
    players,
    limit,
    avgRounds: +(rounds / done).toFixed(1),
    byLimit: ((100 * reasons.limit) / done).toFixed(0) + '%',
    byEmpty: ((100 * reasons.empty) / done).toFixed(0) + '%',
    loserBySeat: loserSeat.map((n) => ((100 * n) / done).toFixed(0) + '%').join(' '),
    stuck,
  }
}

for (const players of [3, 4, 5, 6]) {
  for (const limit of [4, 5]) console.log(JSON.stringify(run(players, limit)))
}

// ตรวจกติกาด้วยมือ: ส่งไพ่จริง/โกหก ทายถูก/ผิด ว่าคนเก็บไพ่ถูกคน
{
  let s = newGame(3, { allBots: true, limit: 5 }, () => 0.5)
  const me = actor(s)
  const card = s.players[me].hand[0]
  const actual = card.item.bin
  const to = targetsFor(s)[0]
  const other = actual === 'organic' ? 'recycle' : 'organic'
  const check = (label, claim, guess, takerIsSender) => {
    let t = offerCard(s, card.id, to, claim)
    t = respond(t, guess)
    const ok = t.result.taker === (takerIsSender ? me : to)
    console.log(ok ? 'ok  ' : 'FAIL', label)
  }
  check('พูดจริง + ทายจริง → ผู้ส่งเก็บ', actual, 'true', true)
  check('พูดจริง + ทายโกหก → ผู้รับเก็บ', actual, 'false', false)
  check('โกหก + ทายจริง → ผู้รับเก็บ', other, 'true', false)
  check('โกหก + ทายโกหก → ผู้ส่งเก็บ', other, 'false', true)

  // ส่งต่อ: ผู้ที่พูดล่าสุดคือคนที่ต้องเก็บไพ่ถ้าทายถูก
  let t = offerCard(s, card.id, to, actual)
  console.log(canPeek(t) ? 'ok  ' : 'FAIL', 'แอบดูได้เมื่อมีคนที่ยังไม่เคยดู')
  t = respond(t, 'peek')
  const third = targetsFor(t)[0]
  t = repass(t, third, other)
  t = respond(t, 'false')
  console.log(t.result.taker === to ? 'ok  ' : 'FAIL', 'ส่งต่อแล้วถูกทายถูก → คนที่ส่งต่อ (ผู้แอบดู) เก็บ')
  console.log(next(t).starter === t.result.taker ? 'ok  ' : 'FAIL', 'คนเก็บไพ่เริ่มตาต่อไป')
}
void botAct
