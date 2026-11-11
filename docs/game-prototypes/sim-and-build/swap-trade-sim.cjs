// จำลอง "แลกให้ลงถัง" แบบมีการต่อรอง เทียบกติกา 3 แบบ
//  V1 ถังชนิดเดียว · V2 ถังสีเดียวกัน (ปนชนิดได้) · V3 = V2 + โบนัสความหลากหลายชนิด
// บอททุกตัวใช้ฮิวริสติกเดียวกัน (ลงถังที่เข้า > ถังว่าง > ส่งถังบังคับ, แลก/ยกให้เมื่อคนรับอยากได้)
const TYPES = [ // [สี, จำนวน, ตารางต่อชนิด(V1)]
  ['g', 24, [4, 7, 10, 12]], ['g', 18, [3, 6, 8, 10]], ['y', 16, [3, 5, 7, 9]], ['y', 12, [3, 4, 6, 7]],
  ['y', 10, [2, 4, 5, 6]], ['b', 8, [2, 3, 4, 5]], ['b', 8, [2, 3, 4, 5]], ['r', 4, [2, 3, 4, null]],
];
const COLORS = ['g', 'y', 'b', 'r'];
if (process.env.TYPES) { TYPES.length = 0; JSON.parse(process.env.TYPES).forEach((x) => TYPES.push(x)); }

function make(variant, colorLadder) {
  const keyOf = (c) => (variant === 'V1' ? 't' + c.t : c.c);
  const coins = (key, n, cards) => {
    const L = variant === 'V1' ? TYPES[+key.slice(1)][2] : colorLadder[key];
    let c = 0; L.forEach((x, i) => { if (x && n >= x) c = i + 1; });
    if (variant === 'V3' && c > 0) { const d = new Set(cards.map((x) => x.t)).size; c += Math.max(0, d - 1); }
    return c;
  };
  return { keyOf, coins };
}

function runGame(P, variant, ladder, trade, rng, tr, focus) {
  focus = focus || [];
  tr = tr || Array(P).fill(trade);
  const { keyOf, coins } = make(variant, ladder);
  let deck = []; TYPES.forEach(([c, n], t) => { for (let k = 0; k < n; k++) deck.push({ t, c }); });
  const sh = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } };
  sh(deck); let disc = [], pass = 1;
  const draw = () => { if (!deck.length) { if (pass >= 3 || !disc.length) return null; pass++; deck = disc; disc = []; sh(deck); } return deck.pop(); };
  const pl = Array.from({ length: P }, () => ({ hand: [], f: Array.from({ length: process.env.START3 === '1' ? 3 : 2 }, () => ({ key: null, cards: [] })), i: 0, pts: 0, forced: 0, harv: 0, cols: new Set(), got: 0 }));
  pl.forEach((p, i) => { p.i = i; for (let i2 = 0; i2 < 5; i2++) p.hand.push(draw()); });
  let trades = 0;
  const harvest = (p, fi, forced) => {
    const f = p.f[fi]; if (f.key === null) return;
    const c = coins(f.key, f.cards.length, f.cards); p.pts += c; p.harv++; if (forced) p.forced++;
    if (c > 0) f.cards.forEach((x) => p.cols.add(x.c));
    disc.push(...f.cards); f.key = null; f.cards = [];
  };
  const want = (p, card) => {
    if (focus[p.i] && (card.c === 'b' || card.c === 'r')) return -2; // FOCUSBOT: ไม่เล่นถังน้ำเงิน/แดง
    const k = keyOf(card);
    if (p.f.some((f) => f.key === k)) return 3;
    if (p.f.some((f) => f.key === null)) return 1;
    return -2;
  };
  const plant = (p, card) => {
    const k = keyOf(card);
    let fi = p.f.findIndex((f) => f.key === k); if (fi < 0) fi = p.f.findIndex((f) => f.key === null);
    if (fi < 0) {
      if (p.f.length < 3 && p.pts >= 3 && rng() < 0.5) { p.pts -= 3; p.f.push({ key: null, cards: [] }); fi = 2; }
      else { fi = p.f[0].cards.length <= p.f[1].cards.length ? 0 : 1; harvest(p, fi, true); }
    }
    p.f[fi].key = k; p.f[fi].cards.push(card);
  };
  let over = false, turn = 0, turns = 0;
  const FINISH = process.env.FINISH === '1';
  while (turns < 4000) {
    if (over && (!FINISH || turn % P === 0)) break;
    const A = pl[turn % P]; turns++;
    if (A.hand.length) plant(A, A.hand.shift());
    if (A.hand.length && want(A, A.hand[0]) >= 3) plant(A, A.hand.shift());
    const face = [];
    for (let i = 0; i < 2; i++) { const c = over ? null : draw(); if (c === null) { over = true; break; } face.push(c); }
    if (over && !FINISH) break;
    for (const x of face) {
      let done = false;
      if (want(A, x) < 3 && tr[A.i]) {
        const others = pl.filter((q) => q !== A);
        // แลก: ให้ x แล้วรับ y ที่ A อยากได้ และคนรับไม่อยากเก็บไว้เอง
        for (const q of others.sort(() => rng() - 0.5)) {
          if (want(q, x) < 1) continue;
          const y = q.hand.find((h) => want(q, h) <= 0 && want(A, h) >= 1);
          if (y) { q.hand.splice(q.hand.indexOf(y), 1); plant(q, x); plant(A, y); q.got++; A.got++; trades++; done = true; break; }
        }
        // ยกให้ฟรีถ้ามีคนอยากได้
        if (!done) {
          const q = others.filter((q) => want(q, x) >= 3)[0];
          if (q) { plant(q, x); q.got++; trades++; done = true; }
        }
      }
      if (!done) plant(A, x);
    }
    if (tr[A.i]) { // แลกไพ่ในมือ A กับของคนอื่น (เฉพาะกรณีที่ทั้งสองฝ่ายได้ถังที่เข้า)
      for (const h of [...A.hand]) {
        if (want(A, h) >= 3) continue;
        const q = pl.find((q) => q !== A && want(q, h) >= 3 && q.hand.some((y) => want(A, y) >= 3));
        if (q) { const y = q.hand.find((y) => want(A, y) >= 3); q.hand.splice(q.hand.indexOf(y), 1); A.hand.splice(A.hand.indexOf(h), 1); plant(q, h); plant(A, y); trades++; q.got++; A.got++; }
      }
    }
    A.f.forEach((f, i) => { if (f.key !== null && coins(f.key, f.cards.length, f.cards) >= 3) harvest(A, i, false); });
    for (let i = 0; i < 3; i++) { const c = over ? null : draw(); if (c === null) { over = true; break; } A.hand.push(c); }
    turn++;
  }
  pl.forEach((p) => p.f.forEach((_, i) => harvest(p, i, false)));
  pl.forEach((p) => { if (p.cols.size === 4) p.pts += 3; });
  return { pl, trades, tpp: turns / P };
}

function stats(P, variant, ladder, trade, N, rng) {
  let sc = [], forced = 0, harv = 0, trades = 0, tpp = 0, bonus = 0, seatWin = Array(P).fill(0), margin = 0, ties = 0;
  for (let g = 0; g < N; g++) {
    const r = runGame(P, variant, ladder, trade, rng);
    trades += r.trades; tpp += r.tpp;
    const pts = r.pl.map((p) => p.pts); pts.forEach((x) => sc.push(x));
    r.pl.forEach((p) => { forced += p.forced; harv += p.harv; if (p.cols.size === 4) bonus++; });
    const mx = Math.max(...pts); const w = pts.filter((x) => x === mx); if (w.length > 1) ties++; else seatWin[pts.indexOf(mx)]++;
    margin += mx - [...pts].sort((a, b) => b - a)[1];
  }
  const m = sc.reduce((a, b) => a + b) / sc.length; const sd = Math.sqrt(sc.reduce((a, b) => a + (b - m) ** 2, 0) / sc.length);
  return { pts: m, sd, forced: forced / N / P, harv: harv / N / P, trades: trades / N, tpp: tpp / N, bonus: bonus / N / P, seat: seatWin.map((x) => x / (N - ties) ), ties: ties / N, margin: margin / N };
}

let seed = 12345; const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const LAD = process.argv[2] ? JSON.parse(process.argv[2]) : { g: [4, 8, 12, 16], y: [4, 7, 10, 13], b: [3, 5, 7, 9], r: [2, 3, 4, null] };
const N = 2500, P = +(process.argv[3] || 4);
const f = (x, d = 1) => x.toFixed(d);
console.log('ตารางสี (V2/V3):', JSON.stringify(LAD), '| ผู้เล่น', P, '| ' + N + ' เกม/แบบ');
console.log('แบบ'.padEnd(18), 'แต้ม/คน', 'SD', 'ถูกบังคับส่ง', 'ส่งทั้งหมด', 'ต่อรอง/เกม', 'ตา/คน', 'ครบ4สี%', 'ชนะที่นั่ง1', 'เสมอ%', 'ห่างอันดับ1-2');
for (const [name, v, trade] of [['V1 ชนิดเดียว', 'V1', true], ['V2 สีเดียวกัน', 'V2', true], ['V3 สี+หลากหลาย', 'V3', true], ['V1 ไม่ต่อรอง', 'V1', false], ['V2 ไม่ต่อรอง', 'V2', false], ['V3 ไม่ต่อรอง', 'V3', false]]) {
  const s = stats(P, v, LAD, trade, N, rng);
  console.log(name.padEnd(18), f(s.pts).padStart(6), f(s.sd).padStart(4), f(s.forced).padStart(10), f(s.harv).padStart(9), f(s.trades).padStart(10), f(s.tpp).padStart(6), f(s.bonus * 100, 0).padStart(7), f(s.seat[0] * 100, 0).padStart(10), f(s.ties * 100, 0).padStart(6), f(s.margin).padStart(10));
}

if (process.env.SKILL === '1') {
  console.log('--- ทดสอบทักษะ: 1 คนต่อรอง vs ที่เหลือไม่ต่อรอง (หมุนที่นั่ง) ---');
  console.log('แบบ'.padEnd(18), 'ผู้ต่อรองชนะ%', '(ถ้าเท่ากัน=25%)', 'แต้มผู้ต่อรอง', 'แต้มคนอื่นเฉลี่ย');
  for (const [name, v] of [['V1 ชนิดเดียว', 'V1'], ['V2 สีเดียวกัน', 'V2'], ['V3 สี+หลากหลาย', 'V3']]) {
    let win = 0, n = 0, tp = 0, op = 0;
    for (let g = 0; g < 4000; g++) {
      const seat = g % P; const tr = Array(P).fill(false); tr[seat] = true;
      const r = runGame(P, v, LAD, true, rng, tr);
      const pts = r.pl.map((p) => p.pts); const mx = Math.max(...pts);
      if (pts.filter((x) => x === mx).length === 1) { n++; if (pts[seat] === mx) win++; }
      tp += pts[seat]; op += (pts.reduce((a, b) => a + b) - pts[seat]) / (P - 1);
    }
    console.log(name.padEnd(18), (win / n * 100).toFixed(0).padStart(10), ' '.repeat(10), (tp / 4000).toFixed(1).padStart(10), (op / 4000).toFixed(1).padStart(14));
  }
}

if (process.env.FOCUS === '1') {
  console.log('--- ทดสอบ "เล่นแค่เขียว+เหลือง": 1 คนโฟกัส vs ที่เหลือเล่นปกติ (หมุนที่นั่ง) ---');
  console.log('กติกา'.padEnd(18), 'โฟกัสชนะ%', '(ปกติ=25%)', 'แต้มโฟกัส', 'แต้มคนอื่น', 'โฟกัสได้ครบ4สี%');
  for (const [name, v] of [['V2 สีเดียวกัน', 'V2'], ['V3 สี+หลากหลาย', 'V3']]) {
    let win = 0, n = 0, fp = 0, op = 0, full = 0; const G = 4000;
    for (let g = 0; g < G; g++) {
      const seat = g % P; const focus = Array(P).fill(false); focus[seat] = true;
      const r = runGame(P, v, LAD, true, rng, null, focus);
      const pts = r.pl.map((p) => p.pts); const mx = Math.max(...pts);
      if (pts.filter((x) => x === mx).length === 1) { n++; if (pts[seat] === mx) win++; }
      fp += pts[seat]; op += (pts.reduce((a, b) => a + b) - pts[seat]) / (P - 1); if (r.pl[seat].cols.size === 4) full++;
    }
    console.log(name.padEnd(18), (win / n * 100).toFixed(0).padStart(8), ' '.repeat(8), (fp / G).toFixed(1).padStart(8), (op / G).toFixed(1).padStart(9), (full / G * 100).toFixed(0).padStart(12));
  }
}
