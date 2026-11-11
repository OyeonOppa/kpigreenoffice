const fs = require('fs');
// ใช้ CSS เดิมของการ์ด "ย่อยนานแค่ไหน?" เพื่อให้หน้าตาเป็นชุดเดียวกัน
const base = fs.readFileSync(__dirname + '/decompose-cards.html', 'utf8');
const css = base.match(/<style>([\s\S]*?)<\/style>/)[1];

const TIERS = [
  { n: 1, c: '#16a34a', name: 'ต่ำกว่า 0.7' },
  { n: 2, c: '#65a30d', name: '0.7 – ต่ำกว่า 2' },
  { n: 3, c: '#ca8a04', name: '2 – ต่ำกว่า 6' },
  { n: 4, c: '#ea580c', name: '6 – ต่ำกว่า 20' },
  { n: 5, c: '#dc2626', name: '20 – ต่ำกว่า 60' },
  { n: 6, c: '#57534e', name: '60 ขึ้นไป' },
];
const tierOf = (v) => [0.7, 2, 6, 20, 60].filter((b) => v >= b).length + 1;

const TOFU = `<svg class="ico" viewBox="0 0 100 100"><g stroke="#a8a29e" stroke-width="3" stroke-linejoin="round"><path d="M14 40 50 24 86 40 50 56z" fill="#fffbeb"/><path d="M14 40 50 56v28L14 68z" fill="#fef3c7"/><path d="M50 56 86 40v28L50 84z" fill="#fde68a"/></g></svg>`;

// e = อีโมจิ/ไอคอน, v = kgCO2e ต่อ 1 กก. (Poore & Nemecek 2018 ผ่าน Our World in Data), ds = ชื่อในชุดข้อมูล, note = เกร็ดเสริม
const ITEMS = [
  { e: '🍊', name: 'ส้ม', v: 0.39, ds: 'Citrus Fruit' },
  { e: '🍎', name: 'แอปเปิล', v: 0.43, ds: 'Apples' },
  { e: '🥔', name: 'มันฝรั่ง', v: 0.46, ds: 'Potatoes' },
  { e: '🧅', name: 'หอมใหญ่', v: 0.5, ds: 'Onions & Leeks' },
  { e: '🥦', name: 'บรอกโคลี / กะหล่ำ', fname: 'บรอกโคลี<br>/ กะหล่ำ', v: 0.51, ds: 'Brassicas' },
  { e: '🍌', name: 'กล้วย', v: 0.86, ds: 'Bananas' },
  { e: '🫛', name: 'ถั่วลันเตา', v: 0.98, ds: 'Peas' },
  { e: '🌽', name: 'ข้าวโพด', v: 1.7, ds: 'Maize' },
  { e: '🥛', name: 'นมวัว', v: 3.15, ds: 'Milk' },
  { e: TOFU, name: 'เต้าหู้', v: 3.16, ds: 'Tofu' },
  { e: '🥜', name: 'ถั่วลิสง', v: 3.23, ds: 'Groundnuts' },
  { e: '🍚', name: 'ข้าว', v: 4.45, ds: 'Rice', note: 'ค่าต่อข้าวสาร 1 กก.' },
  { e: '🥚', name: 'ไข่', v: 4.67, ds: 'Eggs' },
  { e: '🍗', name: 'เนื้อไก่', v: 9.87, ds: 'Poultry Meat' },
  { e: '🐖', name: 'เนื้อหมู', v: 12.31, ds: 'Pig Meat' },
  { e: '🐟', name: 'ปลาเลี้ยง', v: 13.63, ds: 'Fish (farmed)' },
  { e: '🧀', name: 'ชีส', v: 23.88, ds: 'Cheese' },
  { e: '🦐', name: 'กุ้งเลี้ยง', v: 26.87, ds: 'Prawns (farmed)' },
  { e: '☕', name: 'กาแฟ', v: 28.53, ds: 'Coffee', note: 'ต่อ 1 กก. แต่ชงแก้วหนึ่งใช้ไม่กี่กรัม' },
  { e: '🐑', name: 'เนื้อแกะ', v: 39.72, ds: 'Lamb & Mutton' },
  { e: '🍫', name: 'ช็อกโกแลตเข้ม', fname: 'ช็อกโกแลต<br>เข้ม', v: 46.65, ds: 'Dark Chocolate', note: 'ต่อ 1 กก. แต่กินครั้งละไม่กี่กรัม' },
  { e: '🐄', name: 'เนื้อวัว', v: 99.48, ds: 'Beef (beef herd)', note: 'วัวเลี้ยงเพื่อเอาเนื้อ' },
].map((it) => ({ ...it, tier: tierOf(it.v) }));
const apple = ITEMS.find((i) => i.name === 'แอปเปิล').v;
const fmt = (v) => (v >= 10 ? v.toFixed(1) : v.toFixed(2));
const times = (v) => { const x = v / apple; return x < 1.5 ? 'ใกล้เคียงแอปเปิล' : `ประมาณ ${x < 10 ? x.toFixed(1) : Math.round(x)} เท่าของแอปเปิล`; };

const pic = (it) => `<span class="pic">${it.e}</span>`;
const front = (it, i) => `<div class="card front"><div class="inner"><span class="tag">ปล่อยคาร์บอนต่ออาหาร 1 กก.</span><div class="emoji">${pic(it)}</div><div class="name"${it.fname ? ' style="font-size:22pt"' : ''}>${it.fname || it.name}</div><div class="ask">วางไว้ตรงไหนในแถว?</div></div></div>`;
const back = (it) => {
  const band = TIERS.map((t) => `<div class="${t.n === it.tier ? 'on' : ''}" style="--tc:${t.c}">${t.n}</div>`).join('');
  const t = TIERS[it.tier - 1];
  return `<div class="card ans"><div class="inner"><span class="tag">เฉลย</span><div class="emoji">${pic(it)}</div><div class="name">${it.name}</div><div class="band">${band}</div><div class="lvl" style="color:${t.c}">ระดับ ${it.tier} · ${t.name} กก.</div><div class="time">${fmt(it.v)} kgCO₂e</div><div class="note">ต่ออาหาร 1 กก.${it.note ? ' · ' + it.note : ''}</div><div class="why">${times(it.v)}</div><div class="src">ที่มา: Poore &amp; Nemecek 2018 (“${it.ds}”)</div></div></div>`;
};
const LOGO = `<div class="card back"><div class="inner"><div class="logo">🌍</div><div class="bname">เรียงลำดับคาร์บอน</div><div class="bsub">อาหาร 1 กก. ปล่อยเท่าไร? · KPI Green Office</div></div></div>`;
const ruler = `<div class="card ruler"><div class="inner"><span class="tag">ไม้บรรทัดคาร์บอน</span><h3>ระดับ (kgCO₂e ต่อ 1 กก.)</h3>${TIERS.map((t) => `<div class="trow" style="--tc:${t.c}"><b>${t.n}</b><span>${t.name}</span></div>`).join('')}<div style="font-size:9.5pt;color:#5b6b5d;margin-top:2mm">ซ้าย = ปล่อยน้อย · ขวา = ปล่อยมาก</div></div></div>`;
const rulerBack = `<div class="card ruler"><div class="inner"><span class="tag">วิธีตรวจว่าวางถูกไหม</span><ul class="chk"><li>พลิกการ์ดที่เพิ่งวางดูด้านเฉลย</li><li>ระดับของใบใหม่ต้อง <b>ไม่ต่ำกว่า</b> ใบซ้ายที่ติดกัน และ <b>ไม่สูงกว่า</b> ใบขวาที่ติดกัน</li><li>ระดับ <b>เท่ากัน</b> = วางก่อนหรือหลังกันก็ได้</li><li>ผิด → เอาใบนั้นออก แล้วรับบทลงโทษตามโหมด</li></ul><div style="font-size:9.5pt;color:#5b6b5d;margin-top:auto">ตัดสินด้วย “ระดับ” ไม่ใช้ตัวเลขทศนิยม</div></div></div>`;
const quick = `<div class="card ruler"><div class="inner"><span class="tag">เริ่มเล่นอย่างไร</span><h3>สรุป 3 บรรทัด</h3><ul class="chk"><li>วางใบเริ่มต้นกลางโต๊ะ หงาย <b>ด้านเฉลย</b></li><li>วางการ์ดใหม่ลงแถว หงาย <b>ด้านโจทย์</b> แล้วพลิกตรวจ</li><li>ถูก = อยู่ในแถวต่อ · ผิด = ออก + บทลงโทษ</li></ul><p style="font-size:10.5pt;color:#355e3b;margin-top:auto;font-weight:700">ซ้าย = ปล่อยน้อย → ขวา = ปล่อยมาก</p></div></div>`;
const srcCard = `<div class="card ruler"><div class="inner"><span class="tag">ข้อมูลมาจากไหน?</span><h3>ที่มาของตัวเลข</h3><ul class="chk" style="font-size:10.5pt"><li>งานวิจัย <b>Poore &amp; Nemecek (2018)</b> วารสาร Science</li><li>รวบรวมโดย <b>Our World in Data</b></li><li>เป็น <b>ค่าเฉลี่ยทั่วโลก</b> ต่ออาหาร 1 กก. ตลอดห่วงโซ่ ตั้งแต่ฟาร์มถึงร้านค้า</li></ul><div style="font-size:9.5pt;color:#5b6b5d;margin-top:auto">ไม่ใช่ค่าเฉพาะของไทย · รายละเอียดอยู่ท้ายคู่มือ</div></div></div>`;

const pairs = [{ f: ruler, b: rulerBack }, { f: quick, b: LOGO }, { f: srcCard, b: LOGO }, ...ITEMS.map((it, i) => ({ f: front(it, i), b: back(it) }))];

const pageOf = (inner, cls = '') => `<div class="page ${cls}">${inner}</div>`;
const byTier = (n) => ITEMS.filter((it) => it.tier === n).length;
const pages = [];
pages.push(pageOf(`
<h1>เรียงลำดับคาร์บอน 🌍</h1>
<p>เกมเรียงลำดับการ์ด · 2–8 คน · อายุ 8+ · 15 นาที · เล่นแข่งกันหรือร่วมมือกันก็ได้</p>
<div class="box" style="font-size:10.5pt">ได้แรงบันดาลใจจากเกมเรียงลำดับการ์ดแนว Timeline · ตัวเลขทุกใบมาจากงานวิจัย Poore &amp; Nemecek (2018) ผ่าน Our World in Data (ดูหน้าที่มาท้ายเล่ม) · ต้นแบบนี้ยังไม่ผ่านการเล่นทดสอบกับผู้เล่นจริง</div>
<h2>เป้าหมาย</h2>
<p>อาหารแต่ละอย่างน้ำหนัก <b>1 กิโลกรัม</b> ผลิตแล้วปล่อยก๊าซเรือนกระจกไม่เท่ากัน เรียงจาก <b>“ปล่อยน้อย”</b> (ซ้าย) ไป <b>“ปล่อยมาก”</b> (ขวา) ให้ถูกที่สุด โดยไม่รู้คำตอบล่วงหน้า</p>
<h2>ระดับ 6 ระดับ (kgCO₂e ต่ออาหาร 1 กก.)</h2>
<table>${TIERS.map((t) => `<tr><td style="width:14mm"><span class="chip" style="--tc:${t.c}">${t.n}</span></td><td>${t.name}</td><td style="width:26mm">${byTier(t.n)} ใบ</td></tr>`).join('')}</table>
<div class="key">kgCO₂e คือปริมาณก๊าซเรือนกระจกที่แปลงเป็นเทียบเท่า CO₂ ทั้งหมด · เกมตัดสินด้วย “ระดับ” ไม่ใช่ตัวเลขทศนิยม</div>
<h2>อุปกรณ์</h2>
<ul>
<li>การ์ดอาหาร ${ITEMS.length} ใบ · <b>หน้า = โจทย์</b> (รูปและชื่อ) · <b>หลัง = เฉลย</b> (ระดับ ค่าที่แท้จริง และที่มา)</li>
<li>การ์ดช่วยเล่น 3 ใบ: ไม้บรรทัดคาร์บอน (ด้านหลังคือวิธีตรวจ), สรุปวิธีเล่น, ข้อมูลมาจากไหน</li>
</ul>
`, 'rules'));
pages.push(pageOf(`
<h2>เตรียมเกม (ทั้งสองโหมด)</h2>
<ol>
<li>สับการ์ดอาหาร วางเป็นกอง <b>หงายด้านโจทย์ขึ้น</b> (ด้านเฉลยคว่ำ ห้ามแอบดู)</li>
<li>พลิกใบบนสุดมาวางกลางโต๊ะ <b>ด้านเฉลยขึ้น</b> เป็นใบเริ่มต้นของแถว</li>
<li>วางการ์ดไม้บรรทัดไว้ข้างแถว ให้ทุกคนเห็น</li>
</ol>
<h2>โหมด ก — แข่งกัน (2–8 คน)</h2>
<ol>
<li>แจกการ์ด: <b>2–4 คน คนละ 4 ใบ · 5–6 คน คนละ 3 ใบ · 7–8 คน คนละ 2 ใบ</b> (ถือด้านโจทย์ ห้ามดูเฉลย)</li>
<li>ถึงตาคุณ เลือก 1 ใบ <b>วางลงในแถวด้านโจทย์ขึ้น</b> พร้อมบอกเหตุผลสั้นๆ</li>
<li><b>พลิกดูเฉลย</b> แล้วตรวจกับใบซ้าย-ขวาที่ติดกัน</li>
<li>ถูก → การ์ดอยู่ในแถว · ผิด → เอาการ์ดออก และ <b>จั่วเพิ่ม 1 ใบ</b> (ถ้ากองหมด ไม่ต้องจั่ว)</li>
<li>ใครวางการ์ดในมือหมดก่อน <b>ชนะ</b></li>
</ol>
<h2>โหมด ข — ร่วมมือกัน (2–8 คน)</h2>
<ol>
<li>ผลัดกันจั่วใบบนสุดของกอง ทุกคนช่วยกันคิด ผู้จั่วเป็นคนตัดสินใจ</li>
<li>พลิกเฉลย ถูก → อยู่ในแถว · ผิด → เอาออก และเพิ่ม <b>🌡 ความร้อน 1 ขีด</b></li>
<li>แถวยาวถึง <b>10 ใบ</b> ก่อนความร้อนครบ <b>3 ขีด</b> = ทุกคนชนะ</li>
</ol>
`, 'rules'));
pages.push(pageOf(`
<h2>วิธีตรวจว่าวางถูกไหม</h2>
<p>ระดับของใบใหม่ต้อง <b>ไม่ต่ำกว่า</b> ใบซ้ายที่ติดกัน และ <b>ไม่สูงกว่า</b> ใบขวาที่ติดกัน ถ้าระดับเท่ากัน วางก่อนหรือหลังกันก็ได้</p>
<div class="box">ตัวอย่าง: แถวมี <b>แอปเปิล (1)</b> ติดกับ <b>เนื้อวัว (6)</b> · วาง <b>เนื้อไก่ (4)</b> ไว้ระหว่างกลาง → ถูก เพราะ 1 ≤ 4 ≤ 6</div>
<h2>อ่านเฉลยอย่างไร ให้ไม่เข้าใจผิด</h2>
<ul>
<li>ตัวเลขทุกใบคือ <b>ต่ออาหาร 1 กก.</b> ไม่ใช่ต่อมื้อ กาแฟและช็อกโกแลตสูงต่อ กก. แต่เรากินครั้งละไม่กี่กรัม</li>
<li>เป็น <b>ค่าเฉลี่ยทั่วโลก</b> ฟาร์มแต่ละแห่งและแต่ละประเทศต่างกันได้</li>
<li>นับตลอดห่วงโซ่ ตั้งแต่ฟาร์มจนถึงร้านค้า</li>
</ul>
<h2>เล่นกับเด็กเล็ก</h2>
<p>ให้ดูเฉลยได้ก่อนวาง 1 ครั้งต่อรอบ หรือเล่นโหมด ข โดยไม่นับความร้อน</p>
<h2>คุยต่อหลังเกม</h2>
<ul>
<li>ใบไหนทำให้ทุกคนเดาผิดมากที่สุด</li>
<li>อาหารที่เรากินบ่อยอยู่ระดับไหน มีอะไรที่เลือกแทนได้</li>
<li>เนื้อวัวต่อ 1 กก. ปล่อยมากกว่าเนื้อไก่ราว 10 เท่า (99.48 เทียบ 9.87) แต่ผลต่อแต่ละคนขึ้นกับว่ากินมากแค่ไหน</li>
</ul>
`, 'rules'));
pages.push(pageOf(`
<h2>ตัวอย่างการเล่นทีละตา (โหมด ข ร่วมมือ)</h2>
<table>
<tr><th style="width:12mm">ตา</th><th>เกิดอะไรขึ้น</th><th style="width:42mm">แถวตอนนี้</th></tr>
<tr><td>เริ่ม</td><td>ใบเริ่มต้นหงายเฉลย: <b>เนื้อไก่ (4)</b></td><td>[ไก่ 4]</td></tr>
<tr><td>1</td><td>จั่ว <b>แอปเปิล</b> ทีมเห็นว่าผลไม้ปล่อยน้อย วาง <b>ก่อน</b> ไก่ → ถูก (1 ≤ 4)</td><td>[แอปเปิล 1] [ไก่ 4]</td></tr>
<tr><td>2</td><td>จั่ว <b>เนื้อวัว</b> วาง <b>หลัง</b> ไก่ → ถูก (6 ≥ 4)</td><td>[แอปเปิล] [ไก่] [วัว 6]</td></tr>
<tr><td>3</td><td>จั่ว <b>ข้าว</b> ทีมคิดว่าข้าวเป็นพืช ต้องต่ำสุด จึงวาง <b>ก่อน</b> แอปเปิล เฉลยคือระดับ 3 แต่ใบขวาคือ 1 → <b>ผิด</b> เอาออก <b>🌡 +1</b></td><td>(เหมือนเดิม)</td></tr>
<tr><td>4</td><td>จั่ว <b>กุ้งเลี้ยง</b> วางระหว่างไก่กับวัว เฉลย: 4 ≤ 5 ≤ 6 → ถูก</td><td>[แอปเปิล] [ไก่ 4] [กุ้ง 5] [วัว 6]</td></tr>
</table>
<div class="key">ตัวอย่างเป็นการสมมติ เฉลยที่แท้จริงของแต่ละใบอยู่หลังการ์ด</div>
<h2>ปรับความยาก</h2>
<ul>
<li><b>ง่ายขึ้น:</b> ดูเฉลยใบที่จั่ว 1 ครั้งก่อนวาง · ไม่นับความร้อน</li>
<li><b>ยากขึ้น:</b> ความร้อนแค่ 2 ขีด · แถวยาว 12 ใบ (ใช้เมื่อเล่นสำรับครบ)</li>
<li><b>เพิ่มเนื้อหา:</b> ก่อนวาง ให้ทายด้วยว่า “ปล่อยมากกว่าแอปเปิลกี่เท่า” ใกล้เคียงถือว่าผ่าน</li>
</ul>
`, 'rules'));

const EMPTY = '<div class="card empty"></div>';
for (let i = 0; i < pairs.length; i += 4) {
  const ch = pairs.slice(i, i + 4);
  const f = Array(4).fill(EMPTY); ch.forEach((p, k) => { f[k] = p.f; });
  pages.push(pageOf(`<div class="grid">${f.join('')}</div>`));
  const b = Array(4).fill(EMPTY); ch.forEach((p, k) => { b[Math.floor(k / 2) * 2 + (1 - (k % 2))] = p.b; });
  pages.push(pageOf(`<div class="grid">${b.join('')}</div>`));
}

pages.push(pageOf(`
<h1>ตารางเฉลยรวม (สำหรับครู / ผู้ตัดสิน)</h1>
<div>ค่า = kgCO₂e ต่ออาหาร 1 กก. · ค่าเฉลี่ยทั่วโลก</div>
<table>
<tr><th>#</th><th>อาหาร</th><th>ระดับ</th><th>kgCO₂e/กก.</th><th>ชื่อในชุดข้อมูล</th></tr>
${ITEMS.map((it, i) => `<tr><td>${i + 1}</td><td>${it.e.startsWith('<svg') ? '' : it.e + ' '}${it.name}</td><td><b>${it.tier}</b></td><td>${it.v}</td><td>${it.ds}</td></tr>`).join('')}
</table>
`, 'sheet'));
pages.push(pageOf(`
<h1>ที่มาของข้อมูล</h1>
<div class="ref"><b>Poore, J. &amp; Nemecek, T. (2018).</b> Reducing food's environmental impacts through producers and consumers. <i>Science</i> 360(6392), 987–992.</div>
<div class="ref">ชุดข้อมูลที่ใช้: Our World in Data — “Greenhouse gas emissions per kilogram of food product” <span class="url">ourworldindata.org/grapher/ghg-per-kg-poore</span></div>
<h2>ควรรู้ก่อนนำไปสอน</h2>
<ul>
<li>หน่วย kgCO₂e = กิโลกรัมก๊าซเรือนกระจกที่แปลงเป็น CO₂ เทียบเท่า (ช่วงเวลา 100 ปี)</li>
<li>นับตลอดห่วงโซ่: การใช้ที่ดิน ฟาร์ม อาหารสัตว์ แปรรูป ขนส่ง ค้าปลีก และบรรจุภัณฑ์</li>
<li>เป็นค่าเฉลี่ยทั่วโลก ไม่ใช่ค่าเฉพาะของไทย</li>
<li>ต่อ <b>1 กก.</b> ไม่ใช่ต่อมื้อหรือต่อแคลอรี การเปรียบเทียบต่อโปรตีนหรือต่อมื้อจะให้ภาพต่างกัน</li>
<li>การ์ด “ข้าว” ใช้ค่าต่อข้าวสาร 1 กก. ส่วนกาแฟและช็อกโกแลตควรอ่านร่วมกับปริมาณที่กินจริง</li>
</ul>
<div class="box">ข้อมูลที่ตั้งใจไม่ใส่: รายการที่ค่าใกล้ขอบระดับ (มะเขือเทศ ไวน์ น้ำตาล) และรายการที่หาอีโมจิตรงชื่อไม่ได้ (นมถั่วเหลือง มันสำปะหลัง แป้งสาลี ถั่วเปลือกแข็ง)</div>
`, 'sheet'));

const n = pages.length;
const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>เรียงลำดับคาร์บอน — ต้นแบบการ์ด (พิมพ์สองหน้า)</title><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;800&display=swap" rel="stylesheet"><style>${css}</style></head><body><div class="toolbar"><b>เรียงลำดับคาร์บอน — การ์ดอาหาร ${ITEMS.length} ใบ + ช่วยเล่น 3 ใบ · ${n} หน้า</b><button onclick="window.print()">พิมพ์ / บันทึกเป็น PDF</button><span style="font-size:12px;opacity:.85">A4 · พิมพ์สองหน้า แบบ <b>Flip on long edge / พลิกด้านยาว</b> · Scale 100% · เปิด Background graphics</span></div>${pages.join('')}</body></html>`;
fs.writeFileSync(__dirname + '/carbon-cards.html', html);
console.log('items', ITEMS.length, 'pages', n, 'even', n % 2 === 0, 'tiers', TIERS.map((t) => byTier(t.n)).join('/'));
console.log(ITEMS.map((i) => `${i.tier} ${i.name} ${i.v}`).join('\n'));
