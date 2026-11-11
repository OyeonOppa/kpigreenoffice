// จำลองเกม "แลกให้ลงถัง" แบบ "ไม่มีการต่อรอง" (ฐานต่ำสุด) เพื่อดูความยาวเกม ช่วงคะแนน และคุณค่าต่อใบของแต่ละชนิด
const TYPES=[
 {n:'กล้วย',bin:'g',cnt:24,L:[4,7,10,12]},
 {n:'แอปเปิล',bin:'g',cnt:18,L:[3,6,8,10]},
 {n:'หนังสือพิมพ์',bin:'y',cnt:16,L:[3,5,7,9]},
 {n:'กระป๋อง',bin:'y',cnt:12,L:[3,4,6,7]},
 {n:'ขวดแก้ว',bin:'y',cnt:10,L:[2,4,5,6]},
 {n:'โฟม',bin:'b',cnt:8,L:[2,3,4,5]},
 {n:'ถุง',bin:'b',cnt:8,L:[2,3,4,5]},
 {n:"ถ่าน",bin:"r",cnt:4,L:[2,3,4,99]},
];
const coins=(t,k)=>{let c=0;TYPES[t].L.forEach((n,i)=>{if(k>=n)c=i+1});return c};
function run(P,passes,rng){
  let deck=[];TYPES.forEach((t,i)=>{for(let k=0;k<t.cnt;k++)deck.push(i)});
  const sh=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}};
  sh(deck);let disc=[],pass=1;
  const draw=()=>{if(!deck.length){if(pass>=passes)return null;pass++;deck=disc;disc=[];sh(deck)}return deck.pop()};
  const pl=Array.from({length:P},()=>({hand:[],f:[{t:-1,k:0},{t:-1,k:0}],pts:0,cols:new Set(),sold:Array(TYPES.length).fill(0),soldCoins:Array(TYPES.length).fill(0)}));
  pl.forEach(p=>{for(let i=0;i<5;i++)p.hand.push(draw())});
  const harvest=(p,fi)=>{const f=p.f[fi];if(f.t<0)return;const c=coins(f.t,f.k);p.pts+=c;p.sold[f.t]+=f.k;p.soldCoins[f.t]+=c;if(c>0)p.cols.add(TYPES[f.t].bin);disc.push(...Array(f.k).fill(f.t));f.t=-1;f.k=0};
  const plant=(p,c)=>{ // ลงแปลง: ชนิดเดียวกัน > แปลงว่าง > เก็บเกี่ยวแปลงที่ให้คะแนนต่ำสุดสุดต่อใบ
    let fi=p.f.findIndex(f=>f.t===c); if(fi<0)fi=p.f.findIndex(f=>f.t<0);
    if(fi<0){ if(p.f.length<3&&p.pts>=3&&rng()<0.5){p.pts-=3;p.f.push({t:-1,k:0});fi=2} else {fi=p.f[0].k<=p.f[1].k?0:1; harvest(p,fi)} }
    p.f[fi].t=c;p.f[fi].k++;
  };
  let turns=0,over=false,t=0;
  while(!over&&turns<2000){
    const p=pl[t%P];turns++;
    if(p.hand.length)plant(p,p.hand.shift());
    // บอทไม่ต่อรอง: หงายสองใบแล้วลงเอง
    for(let i=0;i<2;i++){const c=draw();if(c===null){over=true;break}plant(p,c)}
    if(over)break;
    // เก็บเกี่ยวเมื่อคุ้ม: ถึงระดับสูงสุดแล้ว
    p.f.forEach((f,i)=>{if(f.t>=0&&coins(f.t,f.k)>=3)harvest(p,i)});
    for(let i=0;i<3;i++){const c=draw();if(c===null){over=true;break}p.hand.push(c)}
    t++;
  }
  pl.forEach(p=>{p.f.forEach((f,i)=>harvest(p,i));if(p.cols.size===4)p.pts+=3});
  return {turns,pl};
}
let seed=1;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
for(const P of [3,4,5]){
  const passes=3;let tot=0,mn=99,mx=0,sc=[],bon=0,N=4000;
  const tv=Array(TYPES.length).fill(0),tc=Array(TYPES.length).fill(0);
  for(let g=0;g<N;g++){const r=run(P,passes,rng);tot+=r.turns/P;r.pl.forEach(p=>{sc.push(p.pts);if(p.cols.size===4)bon++;p.sold.forEach((v,i)=>{tc[i]+=v});p.soldCoins.forEach((v,i)=>{tv[i]+=v})})}
  sc.sort((a,b)=>a-b);
  console.log(`${P} คน: เฉลี่ย ${(tot/N).toFixed(1)} ตา/คน · คะแนน เฉลี่ย ${(sc.reduce((a,b)=>a+b)/sc.length).toFixed(1)} (p10 ${sc[Math.floor(sc.length*.1)]}, p90 ${sc[Math.floor(sc.length*.9)]}) · ได้โบนัสครบ 4 สี ${(bon/sc.length*100).toFixed(0)}%`);
  if(P===4)console.log('  แต้มต่อใบที่ขาย:',TYPES.map((t,i)=>`${t.n} ${(tv[i]/tc[i]).toFixed(2)}`).join(' | '));
}
