// เทียบ "ถัง = ขยะชนิดเดียว" กับ "ถัง = สีเดียวกัน (ต่างชนิดปนได้)" แบบไม่มีการต่อรอง
const T=[['g',24],['g',18],['y',16],['y',12],['y',10],['b',8],['b',8],['r',4]];
const LADDER={ // ตารางต่อสี (ตั้งต้นเพื่อทดลอง): จำนวนใบที่ได้ 1/2/3/4 แต้ม
  g:[5,9,13,17], y:[5,8,11,14], b:[3,5,7,9], r:[2,3,4,null] };
const coinsType=(t,k)=>{const L=[[4,7,10,12],[3,6,8,10],[3,5,7,9],[3,4,6,7],[2,4,5,6],[2,3,4,5],[2,3,4,5],[2,3,4,99]][t];let c=0;L.forEach((n,i)=>{if(k>=n)c=i+1});return c};
const coinsCol=(col,k)=>{let c=0;LADDER[col].forEach((n,i)=>{if(n&&k>=n)c=i+1});return c};
function run(P,mode,rng){
  let deck=[];T.forEach(([c,n],t)=>{for(let k=0;k<n;k++)deck.push(t)});
  const sh=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}};
  sh(deck);let disc=[],pass=1;
  const draw=()=>{if(!deck.length){if(pass>=3||!disc.length)return null;pass++;deck=disc;disc=[];sh(deck)}return deck.pop()};
  const key=t=>mode==='type'?t:T[t][0];
  const pl=Array.from({length:P},()=>({hand:[],f:[{t:null,k:0,cards:[]},{t:null,k:0,cards:[]}],pts:0,forced:0,harv:0}));
  pl.forEach(p=>{for(let i=0;i<5;i++)p.hand.push(draw())});
  const val=(k,n)=>mode==='type'?coinsType(k,n):coinsCol(k,n);
  const harvest=(p,fi,forced)=>{const f=p.f[fi];if(f.t===null)return;p.pts+=val(f.t,f.k);p.harv++;if(forced)p.forced++;disc.push(...f.cards);f.t=null;f.k=0;f.cards=[]};
  const plant=(p,c)=>{const k=key(c);let fi=p.f.findIndex(f=>f.t===k);if(fi<0)fi=p.f.findIndex(f=>f.t===null);
    if(fi<0){fi=p.f[0].k<=p.f[1].k?0:1;harvest(p,fi,true)}p.f[fi].t=k;p.f[fi].k++;p.f[fi].cards.push(c)};
  let over=false,t=0,turns=0;
  while(!over&&turns<3000){const p=pl[t%P];turns++;
    if(p.hand.length)plant(p,p.hand.shift());
    for(let i=0;i<2;i++){const c=draw();if(c===null){over=true;break}plant(p,c)}
    if(over)break;
    p.f.forEach((f,i)=>{if(f.t!==null&&val(f.t,f.k)>=3)harvest(p,i,false)});
    for(let i=0;i<3;i++){const c=draw();if(c===null){over=true;break}p.hand.push(c)}
    t++}
  pl.forEach(p=>p.f.forEach((f,i)=>harvest(p,i,false)));
  return {turns:turns/P,pl};
}
let seed=7;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
for(const mode of ['type','color']){
  const N=3000,P=4;let sc=0,forced=0,harv=0,turns=0;
  for(let g=0;g<N;g++){const r=run(P,mode,rng);turns+=r.turns;r.pl.forEach(p=>{sc+=p.pts;forced+=p.forced;harv+=p.harv})}
  console.log(mode==='type'?'ถัง=ชนิดเดียว':'ถัง=สีเดียวกัน',`| ตา/คน ${(turns/N).toFixed(1)} | แต้ม/คน ${(sc/N/P).toFixed(1)} | ถูกบังคับส่งถัง/คน ${(forced/N/P).toFixed(1)} จากส่งทั้งหมด ${(harv/N/P).toFixed(1)}`);
}
