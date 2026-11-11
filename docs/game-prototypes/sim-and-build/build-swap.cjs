const fs = require('fs');
// ดึง SVG ที่วาดไว้แล้วจากไฟล์การ์ดย่อยสลาย
const src = fs.readFileSync(__dirname + '/decompose-cards.html', 'utf8');
const sc = src.match(/<script>([\s\S]*)<\/script>/)[1];
global.document = { getElementById: () => ({ insertAdjacentHTML() {} }), title: '', querySelector: () => ({ textContent: '' }) };
new Function(sc + ';globalThis.__S=SVG;')();
const SVG = __S;

// กติกาแบบ "ถังสี": ถังรับขยะสีเดียวกัน ชนิดปนได้ · ตารางคะแนนต่อสี · โบนัสหลายชนิดในถังเดียว
// ตัวเลขนี้ได้จากการจำลองบอท (swap-trade-sim.cjs) ยังไม่ผ่านการเล่นกับคนจริง
const BINS = {
  g: { name: 'ถังเขียว', kind: 'เศษอาหาร', shape: '●', c: '#16a34a', t: '#f0fdf4', L: [4, 8, 12, 16] },
  y: { name: 'ถังเหลือง', kind: 'รีไซเคิล', shape: '▲', c: '#ca8a04', t: '#fefce8', L: [4, 8, 12, 16] },
  b: { name: 'ถังน้ำเงิน', kind: 'ขยะทั่วไป', shape: '■', c: '#2563eb', t: '#eff6ff', L: [3, 6, 9, 12] },
  r: { name: 'ถังแดง', kind: 'ขยะอันตราย', shape: '◆', c: '#dc2626', t: '#fef2f2', L: [2, 3, 4, null] },
};
const TYPES = [
  { n: 'เปลือกกล้วย', e: '🍌', bin: 'g', cnt: 24, L1: [4, 7, 10, 12] },
  { n: 'แกนแอปเปิล', e: '🍎', bin: 'g', cnt: 18, L1: [3, 6, 8, 10] },
  { n: 'หนังสือพิมพ์', e: '📰', bin: 'y', cnt: 16, L1: [3, 5, 7, 9] },
  { n: 'กระป๋องอาหาร', e: '🥫', bin: 'y', cnt: 12, L1: [3, 4, 6, 7] },
  { n: 'ขวดแก้ว', e: SVG.glassbottle, bin: 'y', cnt: 10, L1: [2, 4, 5, 6] },
  { n: 'แก้วน้ำโฟม', e: SVG.foamcup, bin: 'b', cnt: 8, L1: [2, 3, 4, 5] },
  { n: 'ถุงพลาสติก', e: SVG.bag, bin: 'b', cnt: 8, L1: [2, 3, 4, 5] },
  { n: 'ถ่านไฟฉาย', e: '🔋', bin: 'r', cnt: 4, L1: [2, 3, 4, null] },
];
const total = TYPES.reduce((a, t) => a + t.cnt, 0);
const colorCount = (b) => TYPES.filter((t) => t.bin === b).reduce((a, t) => a + t.cnt, 0);
const typeCount = (b) => TYPES.filter((t) => t.bin === b).length;

const ladder = (B) => B.L.map((n, i) => (n ? `<div class="step"><b>${n}</b><span>ใบ</span><i>= ${i + 1} แต้ม</i></div>` : `<div class="step off">—</div>`)).join('');
const front = (t) => {
  const B = BINS[t.bin];
  const bonus = typeCount(t.bin) > 1 ? `ปนกันหลายชนิดในถัง +1 ต่อชนิดที่เพิ่ม` : `ถังนี้มีชนิดเดียว ไม่มีโบนัสปน`;
  return `<div class="card item" style="--c:${B.c};--t:${B.t}"><div class="inner"><div class="topband"><span class="shape">${B.shape}</span> ${B.name} · ${B.kind}</div><div class="emoji"><span class="pic">${t.e}</span></div><div class="name">${t.n}</div><div class="lbl">ใส่ถังสีนี้ได้ ปนชนิดอื่นในสีเดียวกันได้</div><div class="ladder">${ladder(B)}</div><div class="cnt">${bonus}</div></div></div>`;
};
const BACK = `<div class="card back"><div class="inner"><div class="logo">♻️</div><div class="bname">แลกให้ลงถัง</div><div class="bsub">เกมแลกขยะลงถัง · KPI Green Office</div></div></div>`;
const bin3 = `<div class="card bin3"><div class="inner"><div class="topband" style="background:#475569">ถังใบที่ 3</div><div class="emoji" style="font-size:64pt;margin:4mm 0 1mm">🗑️</div><div class="name">ถังใบที่ 3</div><div class="b3t">จ่าย <b>3 แต้ม</b> เพื่อวางไว้หน้าตัวเอง<br>แล้วลงขยะได้อีก 1 สี<br><small>ซื้อได้ครั้งเดียวต่อคน · ซื้อเมื่อไรก็ได้</small></div></div></div>`;
const scoreCard = `<div class="card score"><div class="inner"><div class="topband" style="background:#355e3b">ตารางคะแนน</div><table>${Object.values(BINS).map((B) => `<tr><td style="color:${B.c}">${B.shape}</td><td class="tn">${B.name}</td><td>${B.L.map((n) => n ?? '–').join(' · ')}</td></tr>`).join('')}</table><div class="sc2">ตัวเลข = จำนวนใบในถังที่ได้ 1 · 2 · 3 · 4 แต้ม<br><b>โบนัสหลายชนิด:</b> ถังที่ได้แต้ม ถ้ามีขยะ 2 ชนิดขึ้นไป +1 ต่อชนิดที่เพิ่ม<br><b>ครบ 4 สีถัง = +3 แต้ม</b></div></div></div>`;

const expertCard = `<div class="card score"><div class="inner"><div class="topband" style="background:#7c2d12">โหมดชำนาญ · ตารางต่อชนิด</div><table>${TYPES.map((t) => `<tr><td style="color:${BINS[t.bin].c}">${BINS[t.bin].shape}</td><td class="tn" style="width:30mm">${t.n}</td><td>${t.L1.map((n) => n ?? '–').join(' · ')}</td></tr>`).join('')}</table><div class="sc2">ถังรับ <b>ชนิดเดียว</b> · ตัวเลข = ใบที่ได้ 1 · 2 · 3 · 4 แต้ม<br>ไม่มีโบนัสหลายชนิด · <b>ครบ 4 สีถัง +3 แต้ม</b></div></div></div>`;

const pairs = [];
TYPES.forEach((t) => { for (let k = 0; k < t.cnt; k++) pairs.push({ f: front(t), b: BACK }); });
for (let i = 0; i < 5; i++) pairs.push({ f: bin3, b: BACK });
for (let i = 0; i < 5; i++) pairs.push({ f: scoreCard, b: BACK });
for (let i = 0; i < 5; i++) pairs.push({ f: expertCard, b: BACK });

const css = `
@page{size:A4;margin:10mm}*{box-sizing:border-box}
body{margin:0;font-family:"Noto Sans Thai",sans-serif;color:#1f2a20;background:#eee}
.toolbar{position:sticky;top:0;background:#1f2a20;color:#fff;padding:10px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;z-index:9}
.toolbar button{background:#22c55e;color:#fff;border:0;border-radius:99px;padding:8px 18px;font:700 14px "Noto Sans Thai";cursor:pointer}
.page{width:190mm;min-height:277mm;margin:10px auto;background:#fff;page-break-after:always;break-after:page}
.grid{width:152.4mm;margin:0 auto;display:grid;grid-template-columns:repeat(2,76.2mm);grid-auto-rows:101.6mm}
.card{width:76.2mm;height:101.6mm;border:.3mm dashed #999;padding:3.2mm;display:flex;overflow:hidden}
.card.empty{border:0}
.inner{flex:1;border-radius:4mm;border:.9mm solid var(--c,#355e3b);background:var(--t,#f4faf2);display:flex;flex-direction:column;align-items:center;justify-content:flex-start;text-align:center;overflow:hidden}
.topband{align-self:stretch;background:var(--c);color:#fff;font-weight:800;font-size:11pt;padding:1.6mm 2mm}
.shape{font-size:13pt}
.item .emoji{font-size:66pt;line-height:1.05;margin:2.5mm 0 1mm}
.pic{display:inline-block;line-height:1}.pic svg{width:1em;height:1em;display:block}
.item .name{font-size:22pt;font-weight:800;line-height:1.1}
.lbl{font-size:9pt;color:#555;margin-top:1mm}
.ladder{display:grid;grid-template-columns:repeat(4,1fr);gap:1mm;width:100%;padding:0 2.2mm;margin-top:2.2mm}
.step{border-radius:2mm;background:#fff;border:.4mm solid var(--c);padding:.8mm 0;line-height:1.05}
.step b{display:block;font-size:17pt;color:var(--c)}.step span{display:block;font-size:8.5pt;color:#555}.step i{display:block;font-size:8.5pt;font-style:normal;font-weight:700;margin-top:.4mm}
.step.off{display:flex;align-items:center;justify-content:center;color:#bbb;font-size:15pt;border-style:dashed}
.cnt{font-size:9pt;color:#555;margin-top:auto;padding:0 2mm 2.2mm;line-height:1.25}
.back .inner{--c:#134e4a;background:radial-gradient(circle at 15% 12%,rgba(255,255,255,.22) 0 9mm,transparent 9.2mm),radial-gradient(circle at 88% 90%,rgba(255,255,255,.16) 0 13mm,transparent 13.2mm),linear-gradient(160deg,#0e7490,#166534);color:#fff;justify-content:center}
.logo{width:30mm;height:30mm;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:38pt;box-shadow:0 1mm 3mm rgba(0,0,0,.25)}
.bname{font-size:23pt;font-weight:800;margin-top:3mm}.bsub{font-size:11pt;opacity:.95;margin-top:1mm}
.bin3 .inner{--c:#475569;--t:#f8fafc}.b3t{font-size:12.5pt;line-height:1.4;padding:0 3mm;margin-top:2mm}.b3t b{font-size:15pt}.b3t small{font-size:9.5pt;color:#555}
.score .inner{--c:#355e3b;--t:#f4faf2}
.score table{border-collapse:collapse;width:100%;margin-top:2mm;font-size:11pt}.score td{padding:1mm 1.2mm;text-align:left;line-height:1.2;border-bottom:.2mm solid #d8e3d8}.score td.tn{font-weight:700;width:27mm}.score td:last-child{text-align:right;font-weight:700;white-space:nowrap}
.sc2{font-size:9.5pt;line-height:1.4;margin-top:auto;padding:0 2.5mm 2.5mm}
.rules{padding:11mm 14mm;font-size:12.5pt;line-height:1.45;height:275mm;overflow:hidden}
.rules h1{margin:0 0 1mm;font-size:26pt}.rules h2{margin:4mm 0 1.5mm;font-size:16pt;color:#355e3b}.rules p{margin:1.2mm 0}
.rules ul,.rules ol{margin:1.2mm 0;padding-left:6mm}.rules li{margin:1mm 0}
.rules table{border-collapse:collapse;width:100%;font-size:11.5pt;margin:1.5mm 0}.rules td,.rules th{border:.3mm solid #cfd8d1;padding:1mm 2.2mm;text-align:left;vertical-align:top}.rules th{background:#eef6ec}
.box{background:#fff8e1;border-radius:3mm;padding:2mm 3.5mm;margin:2mm 0}.key{background:#eafbee;border-radius:3mm;padding:2mm 3.5mm;margin:2mm 0;font-weight:700}
.sheet{padding:10mm 12mm;font-size:10pt;line-height:1.35;height:275mm;overflow:hidden}.sheet h1{font-size:17pt;margin:0 0 1mm}
.sheet table{border-collapse:collapse;width:100%;font-size:10pt;margin-top:2mm}.sheet td,.sheet th{border:.25mm solid #cfd8d1;padding:.8mm 1.8mm;text-align:left}.sheet th{background:#eef6ec}
.pad td{height:11mm}
@media print{body{background:#fff}.toolbar{display:none}.page{margin:0;width:auto;min-height:0}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;

const pageOf = (inner, cls = '') => `<div class="page ${cls}">${inner}</div>`;
const swatch = Object.values(BINS).map((B) => `<span style="color:${B.c};font-weight:800">${B.shape} ${B.name}</span> = ${B.kind}`).join(' &nbsp;·&nbsp; ');
const pages = [];
pages.push(pageOf(`
<h1>แลกให้ลงถัง ♻️</h1>
<p>เกมแลกการ์ดขยะ · 3–5 คน · อายุ 8+ · 25–30 นาที · เล่นแข่งกัน</p>
<div class="box" style="font-size:10.5pt">ได้แรงบันดาลใจจากเกมต่อรองแลกการ์ดปลูกถั่ว (Bohnanza ของ Uwe Rosenberg) · กติกา ชื่อ ภาพ และข้อความเขียนใหม่ทั้งหมด · <b>ต้นแบบนี้ยังไม่เคยเล่นทดสอบกับคนจริง</b> ตัวเลขคะแนนมาจากการจำลองด้วยบอท ต้องปรับหลังเล่นจริง</div>
<h2>เป้าหมาย</h2>
<p>เก็บขยะ <b>สีเดียวกัน</b> ให้ครบจำนวน แล้ว <b>“ส่งเข้ากระบวนการ”</b> (รีไซเคิล / ทำปุ๋ย / กำจัดอย่างปลอดภัย) เพื่อรับ <b>แต้ม</b> จบเกมใครแต้มมากสุดชนะ</p>
<p><b>ถังหนึ่งใบรับขยะสีเดียวกันได้หลายชนิด</b> (เช่น ถังเหลืองรับได้ทั้งหนังสือพิมพ์ กระป๋อง และขวดแก้ว) · และ <b>ห้ามจัดไพ่ในมือใหม่</b> ต้องลงใบหน้าสุดก่อนเสมอ จึงต้องคุยแลกกับเพื่อน</p>
<h2>อุปกรณ์ (${total + 15} ใบ)</h2>
<ul>
<li>การ์ดขยะ <b>${total} ใบ</b> 8 ชนิด ใน 4 สีถัง · ทุกใบบอกสีถังและตารางคะแนนของสีนั้น</li>
<li>การ์ด “ถังใบที่ 3” 5 ใบ · การ์ดตารางคะแนน 5 ใบ (คนละ 1 ใบ) · การ์ดตารางคะแนน <b>โหมดชำนาญ</b> 5 ใบ (ใช้เมื่อเล่นโหมดชำนาญ)</li>
<li>กระดาษจดแต้ม (หน้าท้ายเล่ม)</li>
</ul>
<h2>เตรียมเกม</h2>
<ol>
<li>แจกการ์ดถังใบที่ 3 และตารางคะแนนคนละ 1 ใบ ส่วนการ์ดขยะ <b>สับรวมเป็นกองกลาง</b></li>
<li>แจกการ์ดขยะคนละ <b>5 ใบ</b> ถือในมือ <b>ห้ามสลับลำดับ</b></li>
<li>วางหน้าตัวเอง <b>2 ช่อง</b> เรียกว่า “ถัง” (ช่องละ 1 สี)</li>
<li>สุ่มคนเริ่ม แล้วเวียนไปทางซ้าย</li>
</ol>
`, 'rules'));
pages.push(pageOf(`
<h2>ถึงตาใคร ทำ 4 ขั้นตามลำดับ</h2>
<table>
<tr><th style="width:12mm">ขั้น</th><th>ทำอะไร</th></tr>
<tr><td><b>1</b></td><td><b>ลง</b> — เอาการ์ด <b>ใบแรกในมือ</b> (ซ้ายสุด) ลงถังใบหนึ่ง ถังนั้นต้องว่าง หรือเป็น <b>สีเดียวกัน</b> กับใบที่ลง (ชนิดต่างกันได้) · อยากลงใบถัดไปด้วยก็ได้ (ไม่บังคับ)</td></tr>
<tr><td><b>2</b></td><td><b>หงาย 2 ใบ</b> — เปิดการ์ดบนสุดของกอง 2 ใบ วางหงายกลางโต๊ะ</td></tr>
<tr><td><b>3</b></td><td><b>แลก</b> — ทุกคนเสนอแลกหรือให้การ์ดกับ <b>คนที่กำลังเล่น</b> ได้ (กฎด้านล่าง) · จบขั้นนี้ ใบหงายทั้ง 2 ใบต้องลงถังของใครสักคนแล้ว</td></tr>
<tr><td><b>4</b></td><td><b>จั่ว 3 ใบ</b> — หยิบจากกองบนสุด ต่อท้ายมือ</td></tr>
</table>
<h2>กฎการแลก</h2>
<ul>
<li>ต้องมี <b>คนที่กำลังเล่น</b> ร่วมเสมอ คนอื่นแลกกันเองไม่ได้</li>
<li>แลก ให้ฟรี หรือขอ ได้ทั้ง <b>การ์ดในมือ</b> (เลือกใบไหนก็ได้ ไม่ต้องเรียงลำดับ) และ <b>ใบหงายกลางโต๊ะ</b></li>
<li>ใบที่ได้รับมา <b>ลงถังทันที</b> ห้ามเข้ามือ</li>
<li>ห้ามสัญญาเรื่องอนาคต เช่น “ตาหน้าจะให้” · ตกลงแล้วแลกเลย</li>
<li>ใบหงายที่ไม่มีใครรับ <b>คนที่กำลังเล่นต้องลงถังตัวเอง</b></li>
</ul>
<div class="key">ถ้าลงไม่ได้ (ถังทั้งสองเป็นสีอื่น) ต้อง <b>ส่งเข้ากระบวนการ</b> ถังใดถังหนึ่งก่อน แล้วค่อยลงใบใหม่</div>
<h2>เคล็ดลับ</h2>
<p>ใบซ้ายสุดของมือบังคับให้ลง จึงควรถามเพื่อนว่า “ใครมีถังเหลืองอยู่บ้าง” ก่อนจะถึงตาเรา</p>
`, 'rules'));
pages.push(pageOf(`
<h2>ส่งเข้ากระบวนการ (เก็บแต้ม)</h2>
<p>ทำได้ <b>ทุกเมื่อ</b> แม้ไม่ใช่ตาตัวเอง (ยกเว้นระหว่างที่กำลังตกลงแลกกันอยู่)</p>
<ol>
<li>นับการ์ดในถังหนึ่งใบ ดูตารางคะแนนของสีนั้น (บนการ์ดตารางคะแนน)</li>
<li>จดแต้ม · ใบที่เกินขั้นสูงสุดไม่ได้แต้มเพิ่ม</li>
<li><b>โบนัสหลายชนิด:</b> ถ้าถังที่ได้แต้ม มีขยะ <b>2 ชนิดขึ้นไป</b> ได้ <b>+1 แต้ม ต่อชนิดที่เพิ่ม</b> (ชนิดที่ 2 = +1, ชนิดที่ 3 = +2)</li>
<li>การ์ดทั้งหมดในถังไปกองทิ้ง ถังว่าง</li>
</ol>
<div class="box">ตัวอย่าง: ถังเหลือง มี <b>หนังสือพิมพ์ 5 ใบ + กระป๋อง 3 ใบ + ขวดแก้ว 1 ใบ</b> = 9 ใบ ถึงขั้นที่ 2 (8 ใบ) ได้ <b>2 แต้ม</b> · มี 3 ชนิด โบนัส <b>+2</b> รวมได้ <b>4 แต้ม</b></div>
<p><b>ถังที่มีการ์ดใบเดียว</b> ส่งเข้ากระบวนการไม่ได้ ถ้าอีกถังมีการ์ด 2 ใบขึ้นไป</p>
<h2>ถังใบที่ 3</h2>
<p>จ่าย <b>3 แต้ม</b> (หักจากแต้มที่มี) แล้ววางการ์ดถังใบที่ 3 ไว้หน้าตัวเอง ซื้อได้ครั้งเดียว</p>
<h2>จบเกม</h2>
<ul>
<li>กองหมดครั้งแรก → สับกองทิ้งเป็นกองใหม่ · กองหมดครั้งที่ <b>3</b> → เล่นให้ครบรอบ แล้วเกมจบ</li>
<li>ทุกคนส่งการ์ดทุกถังเข้ากระบวนการ แล้วนับแต้ม</li>
<li><b>โบนัสครบ 4 สีถัง +3 แต้ม:</b> ถ้าตลอดเกมคุณเคยได้แต้มจากขยะ <b>ถังเขียว เหลือง น้ำเงิน และแดง ครบทั้งสี่</b></li>
<li>แต้มมากสุดชนะ เสมอกัน ดูใครเหลือการ์ดในมือน้อยกว่า</li>
</ul>
<h2>ความรู้ที่ได้จากการเล่น</h2>
<p>${swatch}</p>
<div class="box" style="font-size:10.5pt">เล่นหนักขึ้น? ดู <b>โหมดชำนาญ</b> ในหน้ากติกาสุดท้าย</div>
`, 'rules'));
pages.push(pageOf(`
<h2>ตัวอย่างหนึ่งตา</h2>
<p>ถัง 1 = <b>ถังเขียว</b> (เปลือกกล้วย 4 ใบ) · ถัง 2 = <b>ถังเหลือง</b> (กระป๋องอาหาร 1 ใบ) · มือ: ถ่านไฟฉาย, หนังสือพิมพ์, แกนแอปเปิล, ถุงพลาสติก, ขวดแก้ว</p>
<table>
<tr><th style="width:12mm">ขั้น</th><th>เกิดอะไรขึ้น</th></tr>
<tr><td>1</td><td>ใบแรกในมือคือ <b>ถ่านไฟฉาย</b> (สีแดง) ถังทั้งสองไม่ว่างและไม่ใช่สีแดง ลงไม่ได้ → ต้องส่งถังหนึ่งเข้ากระบวนการ และเพราะถังเขียวมี 2 ใบขึ้นไป ต้องส่ง <b>ถังเขียว (4 ใบ)</b> ก่อน ได้ <b>1 แต้ม</b> (ต้องมี 4 ใบ) แล้วลงถ่านไฟฉายในถังที่ว่าง</td></tr>
<tr><td>2</td><td>หงาย 2 ใบ: <b>ขวดแก้ว</b> (เหลือง) และ <b>แกนแอปเปิล</b> (เขียว)</td></tr>
<tr><td>3</td><td>ถังเขียวว่างอยู่แล้ว แกนแอปเปิลจึงลงถังเขียวใหม่ได้ · เพื่อน A มีถังเหลืองอยู่ จึงขอรับขวดแก้ว แลกกับ <b>ถุงพลาสติก</b> ในมือตัวเอง ตกลง → A ได้ขวดแก้วลงถังเหลืองของ A</td></tr>
<tr><td>4</td><td>จั่ว 3 ใบ ต่อท้ายมือ จบตา</td></tr>
</table>
<div class="key">ที่สังเกตได้: การลงใบซ้ายสุดบังคับให้เลือกว่า “ส่งถังเข้ากระบวนการก่อนเวลา” หรือ “คุยแลกกับเพื่อน”</div>
<h2>ปรับความยาก</h2>
<ul>
<li><b>ง่ายขึ้น:</b> เริ่มเกมด้วยถัง 3 ใบ · กองหมด 2 ครั้งก็จบ</li>
<li><b>ยากขึ้น:</b> ไม่มีโบนัสหลายชนิด · ห้ามแลกกับคนที่มีถังสีเดียวกับเรา</li>
</ul>
<div class="box" style="font-size:10.5pt">หมายเหตุสำหรับผู้พัฒนา: จากการจำลอง ผู้เล่นคนแรกได้เปรียบเล็กน้อย (ชนะ ~34–36% เมื่อเล่น 4 คน ควรเป็น 25%) ยังไม่มีกฎชดเชย ถ้าเล่นจริงแล้วรู้สึกเช่นนั้น ให้ผู้เล่นคนหลังเริ่มด้วยการ์ดเพิ่ม 1 ใบ</div>
`, 'rules'));

pages.push(pageOf(`
<h2>โหมดชำนาญ — ถังรับขยะ “ชนิดเดียว”</h2>
<p>สำหรับผู้เล่นที่ชอบต่อรองดุเดือด กติกาเหมือนโหมดปกติทุกข้อ ยกเว้นต่อไปนี้</p>
<table>
<tr><th style="width:36mm">เรื่อง</th><th>โหมดปกติ (ถังสี)</th><th>โหมดชำนาญ</th></tr>
<tr><td>ถังรับอะไร</td><td>ขยะสีเดียวกัน ปนชนิดได้</td><td><b>ชนิดเดียว</b> เท่านั้น (เปลือกกล้วยกับแกนแอปเปิลลงถังเดียวกันไม่ได้ แม้เป็นถังเขียวเหมือนกัน)</td></tr>
<tr><td>ตารางคะแนน</td><td>ต่อสี (การ์ดตารางคะแนน)</td><td><b>ต่อชนิด</b> (การ์ดตารางคะแนนโหมดชำนาญ)</td></tr>
<tr><td>โบนัสหลายชนิด</td><td>มี</td><td><b>ไม่มี</b></td></tr>
<tr><td>โบนัสครบ 4 สีถัง</td><td>+3 แต้ม</td><td>+3 แต้ม (เหมือนเดิม) นับจากสีของขยะที่ส่งแล้วได้แต้ม</td></tr>
<tr><td>ถังใบที่ 3</td><td>3 แต้ม</td><td>3 แต้ม (เหมือนเดิม)</td></tr>
</table>
<h2>ต่างกันอย่างไรตอนเล่น</h2>
<ul>
<li>ถูกบังคับให้ส่งถังเข้ากระบวนการบ่อยกว่ามาก จึง <b>ต้องต่อรองตลอดเวลา</b></li>
<li>คนที่ต่อรองเก่งได้เปรียบชัดเจน คนที่ไม่ถนัดเสียเปรียบมาก ไม่เหมาะกับเด็กเล็กหรือผู้เล่นคละวัย</li>
<li>ถ้าอยากให้เบาลง: เริ่มด้วยถัง 3 ใบ</li>
</ul>
<div class="box" style="font-size:10.5pt">ข้อมูลจากการจำลองบอท (ไม่ใช่การเล่นจริง): โหมดชำนาญ ผู้ที่ต่อรองชนะผู้ที่ไม่ต่อรองราว 96–98% ส่วนโหมดปกติราว 77%</div>
`, 'rules'));
pages.push(pageOf(`
<h2>ตารางคะแนนโหมดชำนาญ (ต่อชนิด)</h2>
<table>
<tr><th>ชนิดขยะ</th><th>สีถัง</th><th>การ์ดในสำรับ</th><th>1 แต้ม</th><th>2 แต้ม</th><th>3 แต้ม</th><th>4 แต้ม</th></tr>
${TYPES.map((t) => `<tr><td>${t.n}</td><td style="color:${BINS[t.bin].c};font-weight:700">${BINS[t.bin].shape} ${BINS[t.bin].name}</td><td>${t.cnt}</td>${t.L1.map((n) => `<td>${n ?? '—'}</td>`).join('')}</tr>`).join('')}
</table>
<p>ตัวเลขในช่องแต้ม = จำนวนใบของชนิดนั้นในถังตอนส่งเข้ากระบวนการ · ชนิดที่มีน้อยใช้ใบน้อยกว่า</p>
<div class="box" style="font-size:10.5pt">ตัวอย่าง: ถังนี้มี <b>ขวดแก้ว 5 ใบ</b> (ชนิดเดียว) → ตาราง 2 · 4 · 5 · 6 ถึงขั้นที่ 3 ได้ <b>3 แต้ม</b> ไม่มีโบนัสหลายชนิด</div>
<p style="font-size:10.5pt">ตารางนี้ชุดเดียวกับที่ใช้ในการจำลองบอทตอนต้น ยังไม่ผ่านการเล่นทดสอบกับคนจริง</p>
`, 'rules'));

const EMPTY = '<div class="card empty"></div>';
for (let i = 0; i < pairs.length; i += 4) {
  const ch = pairs.slice(i, i + 4);
  const f = Array(4).fill(EMPTY); ch.forEach((p, k) => { f[k] = p.f; });
  pages.push(pageOf(`<div class="grid">${f.join('')}</div>`));
  const b = Array(4).fill(EMPTY); ch.forEach((p, k) => { b[Math.floor(k / 2) * 2 + (1 - (k % 2))] = p.b; });
  pages.push(pageOf(`<div class="grid">${b.join('')}</div>`));
}
pages.push(pageOf(`<h1>ตารางสรุปการ์ดและคะแนน</h1>
<table><tr><th>สีถัง</th><th>การ์ดรวม</th><th>1 แต้ม</th><th>2 แต้ม</th><th>3 แต้ม</th><th>4 แต้ม</th><th>โบนัสหลายชนิดสูงสุด</th></tr>${Object.entries(BINS).map(([k, B]) => `<tr><td style="color:${B.c};font-weight:700">${B.shape} ${B.name}</td><td>${colorCount(k)}</td>${B.L.map((n) => `<td>${n ?? '—'}</td>`).join('')}<td>+${Math.max(0, typeCount(k) - 1)}</td></tr>`).join('')}<tr><th>รวม</th><th>${total}</th><th colspan="5"></th></tr></table>
<table><tr><th>ชนิดขยะ</th><th>สีถัง</th><th>จำนวน</th></tr>${TYPES.map((t) => `<tr><td>${t.n}</td><td style="color:${BINS[t.bin].c};font-weight:700">${BINS[t.bin].shape} ${BINS[t.bin].name}</td><td>${t.cnt}</td></tr>`).join('')}</table>
<p>ตัวเลขในช่องแต้ม = จำนวนใบที่ต้องมีในถังตอนส่งเข้ากระบวนการ · ถังแดงมีชนิดเดียว จึงไม่มีโบนัสหลายชนิด</p>
<p><b>ที่มาของตัวเลข:</b> ตารางคะแนนได้จากการจำลองเกมด้วยบอท (4 คน) ให้คะแนนเฉลี่ยราว 22 แต้ม ผู้ที่ต่อรองชนะผู้ที่ไม่ต่อรองราว 77% ยังไม่ผ่านการเล่นทดสอบกับคนจริง ต้องปรับหลังเล่น</p>`, 'sheet'));
pages.push(pageOf(`<h1>กระดาษจดแต้ม</h1><table class="pad"><tr><th style="width:40mm">ชื่อ</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>รวม</th><th>โบนัส 4 สี</th></tr>${[1, 2, 3, 4, 5].map(() => '<tr><td></td>' + '<td></td>'.repeat(10) + '</tr>').join('')}</table><p>จดแต้มที่ได้ทุกครั้งที่ส่งเข้ากระบวนการ (รวมโบนัสหลายชนิดแล้ว) · ซื้อถังใบที่ 3 ให้จดเป็นแต้มลบ 3</p>`, 'sheet'));
const n = pages.length;
const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>แลกให้ลงถัง — ต้นแบบการ์ด (พิมพ์สองหน้า)</title><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;800&display=swap" rel="stylesheet"><style>${css}</style></head><body><div class="toolbar"><b>แลกให้ลงถัง (ถังสี) — ต้นแบบการ์ด · ${total + 15} ใบ · ${n} หน้า</b><button onclick="window.print()">พิมพ์ / บันทึกเป็น PDF</button><span style="font-size:12px;opacity:.85">A4 · พิมพ์สองหน้า แบบ <b>Flip on long edge / พลิกด้านยาว</b> · Scale 100% · เปิด Background graphics</span></div>${pages.join('')}</body></html>`;
fs.writeFileSync(__dirname + '/swap-cards.html', html);
console.log('cards', pairs.length, 'pages', n, 'even?', n % 2 === 0, 'colors', Object.entries(BINS).map(([k]) => k + colorCount(k)).join(' '));
