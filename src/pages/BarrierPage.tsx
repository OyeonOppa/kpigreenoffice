import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import feltUrl from '../barrier/art/felt.svg'
import backUrl from '../barrier/art/card-back.svg'
import skylineUrl from '../barrier/art/skyline.svg'
import avatarPusherUrl from '../barrier/art/avatar-pusher.svg'
import avatarBlockerUrl from '../barrier/art/avatar-blocker.svg'
import {
  B_ITEM_IDS,
  CATS,
  CONTRACTS,
  ICON_IDS,
  ICONS,
  ITEM_META,
  KEYS,
  P_ITEM_IDS,
  type BItem,
  type Card,
  type Icon,
  type PItem,
  type Side,
} from '../barrier/cards'
import {
  actor,
  attach,
  bRespond,
  botStep,
  catCounts,
  comboCats,
  counter,
  counterKeys,
  entryOf,
  frozenDiscard,
  handMax,
  legalBlocks,
  matchedIcons,
  negate,
  newGame,
  pDiscard,
  playMeasure,
  playPItem,
  playSearch,
  scatterTargets,
  turnScore,
  type Entry,
  type State,
} from '../barrier/engine'
import { cardFace, type Face } from '../barrier/cardFace'
import { sfx } from '../game/sfx'

/* ฝ่าด่านลดคาร์บอน — เกมการ์ดสองฝ่าย ผลักดัน vs ต่อต้าน เล่นกับบอท (#/barrier) */

interface Config {
  side: Side
  target: number
  pItem: PItem
  bItem: BItem
  hints: boolean
}

type SetGame = (f: (g: State | null) => State | null) => void

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]

/** วัดขนาดกล่องที่ใส่ ref — ใช้คำนวณขนาดการ์ดในมือให้เต็มพื้นที่ที่เหลือ */
function useBox(active: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ w: number; h: number } | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !active) return
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [active])
  return [ref, box] as const
}

function useMedia(q: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(q)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia(q).matches,
    () => false,
  )
}

/** สิ่งที่ฝ่ายบอททำล่าสุด — ไว้โชว์ให้เห็นว่าบอท "เล่น" อะไร (ด่านคว่ำจะเห็นแค่หลังการ์ด) */
interface BotMove {
  id: number
  side: Side
  turn: number
  lines: string[]
  cards: { card: Card; hidden: boolean }[]
}

/** บรรทัด log ที่เพิ่มขึ้นมาใหม่ (log เก็บแค่ 60 บรรทัดสุดท้าย จึงต้องหาจุดที่ซ้อนกัน) */
function newLines(a: string[], b: string[]): string[] {
  for (let s = 0; s <= Math.min(10, a.length); s++) {
    const kept = a.slice(s)
    if (kept.every((l, i) => b[i] === l)) return b.slice(kept.length)
  }
  return b.slice(-3)
}

function describeMove(prev: State, next: State, bot: Side): Omit<BotMove, 'id'> | null {
  const hk = bot === 'P' ? 'pHand' : 'bHand'
  const gone = prev[hk].filter((c) => !next[hk].some((x) => x.id === c.id))
  const trapId = bot === 'B' && next.trap && next.trap.id !== prev.trap?.id ? next.trap.id : null
  const revealed = bot === 'B' && prev.trap && !next.trap && !gone.some((c) => c.id === prev.trap!.id) ? prev.trap : null
  if (!gone.length && !revealed && actor(prev) !== bot) return null
  const cards = gone.map((c) => ({ card: c as Card, hidden: c.id === trapId }))
  if (revealed) cards.push({ card: revealed, hidden: false })
  return { side: bot, turn: prev.turn, lines: newLines(prev.log, next.log), cards }
}

export default function BarrierPage() {
  const [cfg, setCfg] = useState<Config>({ side: 'P', target: 125, pItem: 'edu', bItem: 'ad', hints: true })
  const [game, setGame] = useState<State | null>(null)
  const [muted, setMuted] = useState(sfx.muted)
  const [feed, setFeed] = useState<BotMove[]>([])
  const [prevGame, setPrevGame] = useState<State | null>(null)
  if (game !== prevGame) {
    setPrevGame(game)
    if (!game || !prevGame || prevGame.phase === 'over' || game.turn < prevGame.turn) {
      if (feed.length) setFeed([])
    } else if (game.human) {
      const m = describeMove(prevGame, game, game.human === 'P' ? 'B' : 'P')
      if (m) setFeed([...feed.slice(-5), { ...m, id: (feed[feed.length - 1]?.id ?? 0) + 1 }])
    }
  }

  // บอทเล่นเอง (หน่วงเวลาให้ตามทัน)
  useEffect(() => {
    if (!game || game.phase === 'over') return
    const a = actor(game)
    if (a && a !== game.human) {
      const t = setTimeout(() => setGame((g) => (g ? botStep(g) : g)), 1000 + Math.random() * 500)
      return () => clearTimeout(t)
    }
  }, [game])

  const phase = game?.phase
  useEffect(() => {
    if (!game || game.phase !== 'over') return
    const iWon = (game.human === 'P') === !!game.won
    ;(iWon ? sfx.fanfare : sfx.wrong)()
    // เล่นเสียงเฉพาะตอนเกมจบ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const start = () =>
    setGame(
      newGame({
        human: cfg.side,
        target: cfg.target,
        pStart: cfg.side === 'P' ? cfg.pItem : pick(P_ITEM_IDS),
        bStart: cfg.side === 'B' ? cfg.bItem : pick(B_ITEM_IDS),
      }),
    )

  return (
    <div className={`arena flex flex-col h-dvh ${game ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      {!game && (
        <div className="relative z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 shrink-0">
          <a href="#" className="hud-btn !px-4 !py-1.5 text-sm gap-1.5">
            <Home size={16} /> หน้าแรก
          </a>
          <button type="button" onClick={() => setMuted(sfx.toggleMute())} aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'} className="hud-btn">
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      )}

      <div className={`flex-1 flex flex-col ${game ? 'min-h-0' : ''}`}>
        {game ? (
          <Board game={game} setGame={setGame} hints={cfg.hints} onAgain={start} feed={feed} muted={muted} onMute={() => setMuted(sfx.toggleMute())} onQuit={() => setGame(null)} />
        ) : (
          <Setup cfg={cfg} setCfg={setCfg} onStart={start} />
        )}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- ชิ้นส่วนเล็กๆ */

function IconChip({ i, size = 'md' }: { i: Icon; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'text-2xl px-2' : size === 'sm' ? 'text-xs px-1' : 'text-base px-1.5'
  return (
    <span title={`${ICONS[i].name} → แก้ด้วย ${ICONS[i].fix}`} className={`inline-flex items-center rounded-lg border border-line bg-white leading-tight ${cls}`}>
      {ICONS[i].emoji}
      {size !== 'sm' && <span className="ml-1 text-[0.6em] font-semibold text-ink/70 whitespace-nowrap">{ICONS[i].name}</span>}
    </span>
  )
}

interface Described {
  emoji: string
  name: string
  tag: string
  color: string
  tint: string
  desc: string
  pts?: number
  icons?: Icon[]
}

const KEY_TONE = { color: '#7c3aed', tint: '#f3ecff' }
const RED_TONE = { color: '#b91c1c', tint: '#fdecec' }
const ITEM_TONE = { color: '#b45309', tint: '#fff3e0' }

function describe(c: Card): Described {
  switch (c.kind) {
    case 'measure': {
      const cat = CATS[c.cat]
      return { emoji: c.emoji, name: c.name, tag: `มาตรการ ${cat.emoji}`, color: cat.color, tint: cat.tint, desc: c.why, pts: c.pts, icons: c.icons }
    }
    case 'key':
      return { emoji: KEYS[c.k].emoji, name: KEYS[c.k].name, tag: 'กุญแจ', ...KEY_TONE, desc: KEYS[c.k].hint }
    case 'media':
      return { emoji: '📰', name: 'ออกสื่อ', tag: 'ตัวเสริม', color: '#0369a1', tint: '#e3f2fc', desc: 'ประกบมาตรการบนโต๊ะ ได้ +1 แต้มต่อตา' }
    case 'search':
      return { emoji: '🔍', name: 'สำรวจก่อนทำ', tag: 'พิเศษ', color: '#0f766e', tint: '#e2f6f2', desc: 'เล่นฟรี ไม่เสียตา: เปิดดูด่านคว่ำของฝ่ายต่อต้านแล้วทิ้ง' }
    case 'pitem':
    case 'bitem': {
      const m = ITEM_META[c.item]
      return { emoji: m.emoji, name: m.name, tag: 'ไอเท็มถาวร', ...ITEM_TONE, desc: m.desc }
    }
    case 'block':
      return { emoji: c.icons.map((i) => ICONS[i].emoji).join(''), name: c.name, tag: 'ด่าน', color: '#475569', tint: '#eef1f4', desc: c.why, icons: c.icons }
    case 'rumor':
      return { emoji: c.emoji, name: c.name, tag: 'หักแต้ม', ...RED_TONE, desc: `${c.note} → หักคะแนนรวม ${c.v} แต้มทันที (ฝ่ายผลักดันทิ้ง 📏 ยกเลิกได้)` }
    case 'wipe':
      return { emoji: '📉', name: 'เปลี่ยนคนทำ ไม่มีใครสานต่อ', tag: 'ล้างกระดาน', ...RED_TONE, desc: 'ทิ้งทุกมาตรการที่ไม่มี 📏 ประกบ และไม่อยู่ในหมวดที่ครบ 3 ใบ ยกเลิกไม่ได้' }
    case 'freeze':
      return { emoji: '✂️', name: 'ตัดงบกลางปี', tag: 'พิเศษ', ...RED_TONE, desc: 'ตาหน้าฝ่ายผลักดันวางการ์ดไม่ได้ และต้องทิ้งการ์ดรวม 2 ใบ' }
    case 'scatter':
      return { emoji: '🗂️', name: 'ข้อมูลกระจัดกระจาย', tag: 'พิเศษ', ...RED_TONE, desc: 'ทิ้งตัวเสริม 1 ใบบนโต๊ะ (เลือกมาตรการเอง)' }
  }
}

/* ----------------------------------------------------------------- หน้าการ์ด (เหมือนการ์ดพิมพ์) */

/** ขนาดตัวอักษรตามปริมาณข้อความ — สูตรเดียวกับตัวสร้างการ์ดพิมพ์ */
function sizeClass(f: Face): string {
  const L = (f.desc ?? '').length + (f.foot ?? '').length * 0.6 + f.name.length * 0.8
  return L > 125 ? 'pc-tight' : L > 80 ? 'pc-mid' : 'pc-roomy'
}

function FaceChips({ icons }: { icons: Icon[] }) {
  return (
    <>
      {icons.map((i) => (
        <span key={i} className="pc-chip">
          {ICONS[i].emoji}
          <small>{ICONS[i].name}</small>
        </span>
      ))}
    </>
  )
}

/** หน้าการ์ดตามแบบพิมพ์ — ใช้ทุกที่ที่โชว์การ์ด (ในมือ บนโต๊ะ หน้ารายละเอียด) */
function PrintFace({ card }: { card: Card }) {
  const f = cardFace(card)
  const style = { ['--c' as string]: f.c, ['--t' as string]: f.t }
  let body: ReactNode
  if (f.variant === 'measure') {
    body = (
      <>
        <span className="pc-tag">{f.tag}</span>
        <div className="pc-emoji">{f.emoji}</div>
        <div className="pc-name">{f.name}</div>
        <div className="pc-big">{f.big}</div>
        <div className="pc-small">ด่านที่ปิดได้</div>
        <div className="pc-chips">
          <FaceChips icons={f.icons ?? []} />
        </div>
        <div className="pc-desc">
          <b>รู้ไหม:</b> {f.desc}
        </div>
      </>
    )
  } else if (f.variant === 'key') {
    body = (
      <>
        <span className="pc-tag">{f.tag}</span>
        <div className="pc-pair">
          {f.from ? (
            <span className="pc-chip">
              {ICONS[f.from].emoji}
              <small>{ICONS[f.from].name}</small>
            </span>
          ) : (
            <span className="pc-chip pc-chip-all">ทุกด่าน</span>
          )}
          <span className="pc-arrow">→</span>
          <span className="pc-key">{f.emoji}</span>
        </div>
        <div className="pc-keyname">{f.name}</div>
        <div className="pc-how">
          <b>วิธีใช้:</b> {f.how}
        </div>
        <div className="pc-ex">{f.ex}</div>
      </>
    )
  } else if (f.variant === 'block') {
    body = (
      <>
        <span className="pc-tag">{f.tag}</span>
        <div className="pc-chips pc-chips-big">
          <FaceChips icons={f.icons ?? []} />
        </div>
        <div className="pc-blockname">{f.name}</div>
        <div className="pc-blockhow">
          <b>วิธีใช้:</b> {f.how}
        </div>
        <div className="pc-blockex">
          <b>รู้ไหม:</b> {f.ex}
        </div>
      </>
    )
  } else {
    body = (
      <>
        <span className="pc-tag">{f.tag}</span>
        <div className="pc-emoji">{f.emoji}</div>
        <div className="pc-name">{f.name}</div>
        {f.big && <div className="pc-big">{f.big}</div>}
        <div className="pc-desc">{f.desc}</div>
        {f.foot && <div className="pc-foot">{f.foot}</div>}
      </>
    )
  }
  return (
    <div className="pc" style={style}>
      <div className={`pc-in ${f.variant === 'simple' ? sizeClass(f) : ''}`}>{body}</div>
    </div>
  )
}

/** หลังการ์ดตามแบบพิมพ์ (ใช้กับการ์ดที่ไม่เห็นหน้า) */
function CardBack({ side, width = '5rem', label }: { side: Side; width?: string; label?: string }) {
  const p = side === 'P'
  const style = {
    ['--b1' as string]: p ? '#4ade80' : '#94a3b8',
    ['--b2' as string]: p ? '#15803d' : '#475569',
    ['--b3' as string]: p ? '#14532d' : '#1e293b',
    ['--back-pattern' as string]: `url(${backUrl})`,
    width,
  }
  return (
    <div className="pc pc-back shrink-0 shadow-sm rounded-[5.73cqw]" style={style} aria-hidden={!label}>
      <div className="pc-in">
        <div className="pc-logo">{p ? '🌱' : '⛔'}</div>
        <div className="pc-bname">{label ?? (p ? 'ฝ่ายผลักดัน' : 'ฝ่ายต่อต้าน')}</div>
        <div className="pc-bsub">{p ? 'ลงมือทำให้รอด' : 'อุปสรรคที่ต้องฝ่า'}</div>
        <div className="pc-borg">ฝ่าด่านลดคาร์บอน · KPI Green Office</div>
      </div>
    </div>
  )
}

/** เมาส์จริง (ไม่ใช่จอสัมผัส) — ใช้เปิดการลากการ์ด เพราะการลากบนจอสัมผัสจะบล็อกการเลื่อนหน้า */
function useFinePointer() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia('(pointer: fine)')
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia('(pointer: fine)').matches,
    () => false,
  )
}

function GameCard({
  card,
  selected,
  onClick,
  disabled,
  big,
  index = 0,
}: {
  card: Card
  selected?: boolean
  onClick?: () => void
  disabled?: boolean
  big?: boolean
  /** ลำดับในมือ — ใช้หน่วงแอนิเมชันแจกการ์ดให้ไล่ทีละใบ */
  index?: number
}) {
  const d = describe(card)
  const fine = useFinePointer()
  const tiltRef = useRef<HTMLDivElement>(null)
  const dragged = useRef(false)
  const cls = `block rounded-[5.73cqw] ${big ? 'w-72 max-w-full lg:w-56 [@media(max-height:800px)]:lg:w-44' : 'w-full'} ${disabled ? 'opacity-45' : ''}`
  const ringStyle = { ['--tw-ring-color' as string]: `${d.color}55` }
  const style = { transformPerspective: 900 }

  const onMove = (e: React.PointerEvent) => {
    const el = tiltRef.current
    if (!el || e.pointerType === 'touch' || disabled) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', `${((0.5 - y) * 12).toFixed(1)}deg`)
    el.style.setProperty('--ry', `${((x - 0.5) * 12).toFixed(1)}deg`)
    el.style.setProperty('--gx', `${(x * 100).toFixed(0)}%`)
    el.style.setProperty('--gy', `${(y * 100).toFixed(0)}%`)
  }
  const onLeave = () => {
    const el = tiltRef.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  const face = (
    <div ref={tiltRef} className={`card-tilt ${selected ? 'shadow-lg ring-4' : 'shadow-sm'}`} style={ringStyle} onPointerMove={onMove} onPointerLeave={onLeave}>
      <PrintFace card={card} />
      <div className="card-glare" aria-hidden />
    </div>
  )

  const motionProps = {
    layout: true,
    // แจกการ์ด: ลอยลงมาพร้อมพลิกหน้า ไล่ทีละใบ
    initial: { opacity: 0, scale: 0.8, y: -70, rotateY: 80, rotateZ: -6 },
    animate: { opacity: 1, scale: 1, y: selected ? -10 : 0, rotateY: 0, rotateZ: 0 },
    exit: { opacity: 0, scale: 0.8, y: -30, rotateZ: 8 },
    transition: { type: 'spring', stiffness: 320, damping: 26, delay: Math.min(index, 8) * 0.06 } as const,
  }
  if (!onClick) {
    return (
      <motion.div className={cls} style={style} {...motionProps}>
        {face}
      </motion.div>
    )
  }
  const canDrag = fine && !disabled
  return (
    <motion.button
      type="button"
      onClick={() => {
        if (!dragged.current) onClick()
      }}
      className={`${cls} text-left ${selected ? 'card-shadow-lift' : ''}`}
      style={style}
      aria-pressed={selected}
      aria-label={d.name}
      whileHover={disabled ? undefined : { y: -8, scale: 1.04 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      // ลากการ์ดขึ้น/ออกจากมือแล้วปล่อย = เลือกการ์ดใบนี้ (เหมือนหยิบขึ้นมาวาง) · ปล่อยแล้วการ์ดเด้งกลับที่เดิม
      drag={canDrag}
      dragSnapToOrigin
      dragElastic={0.3}
      dragMomentum={false}
      whileDrag={{ scale: 1.1, zIndex: 40, cursor: 'grabbing' }}
      onDragStart={() => {
        dragged.current = true
      }}
      onDragEnd={(_, info) => {
        if (Math.hypot(info.offset.x, info.offset.y) > 60) onClick()
        setTimeout(() => {
          dragged.current = false
        }, 0)
      }}
      {...motionProps}
    >
      {face}
    </motion.button>
  )
}

function Chip({ children, tone = 'plain', title, big }: { children: ReactNode; tone?: 'plain' | 'green' | 'red' | 'amber'; title?: string; big?: boolean }) {
  const t =
    tone === 'green'
      ? 'bg-green-50 border-green-300 text-green-800'
      : tone === 'red'
        ? 'bg-red-50 border-red-300 text-red-800'
        : tone === 'amber'
          ? 'bg-amber-50 border-amber-300 text-amber-900'
          : 'bg-surface border-line text-ink/80'
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-full border font-medium ${big ? 'px-3.5 py-1.5 text-base border-2' : 'px-2.5 py-0.5 text-xs'} ${t}`}>
      {children}
    </span>
  )
}

/* ----------------------------------------------------------------- หน้าตั้งค่า */

type Step = 'title' | 'side' | 'contract' | 'item'

function MenuBtn({ children, onClick, primary }: { children: ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pop-btn w-full px-6 py-3.5 text-lg font-medium ${primary ? 'bg-accent text-white' : 'bg-white/10 text-white border-2 border-white/25'}`}
      style={{ ['--pop-shadow' as string]: primary ? 'oklch(38% 0.12 152)' : 'rgba(0,0,0,0.45)' }}
    >
      {children}
    </button>
  )
}

/** ปุ่มเลือกแบบการ์ดกระจกบนฉากมืด */
function PickCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`text-left rounded-3xl border-2 p-4 sm:p-5 transition-colors ${selected ? 'border-amber-300 bg-white/20 ring-4 ring-amber-300/30' : 'border-white/20 bg-white/10 hover:bg-white/15'}`}
    >
      {children}
    </motion.button>
  )
}

/** เมนูเกม: หน้าชื่อเกม → เลือกฝ่าย → เลือกการ์ดสัญญา → เลือกไอเท็ม → เริ่ม */
function Setup({ cfg, setCfg, onStart }: { cfg: Config; setCfg: (c: Config) => void; onStart: () => void }) {
  const [step, setStep] = useState<Step>('title')
  const [howto, setHowto] = useState(false)
  const items = cfg.side === 'P' ? P_ITEM_IDS : B_ITEM_IDS
  const current = cfg.side === 'P' ? cfg.pItem : cfg.bItem
  const setItem = (id: PItem | BItem) => (cfg.side === 'P' ? setCfg({ ...cfg, pItem: id as PItem }) : setCfg({ ...cfg, bItem: id as BItem }))
  const back = () => setStep(step === 'item' ? 'contract' : step === 'contract' ? 'side' : 'title')
  const n = step === 'side' ? 1 : step === 'contract' ? 2 : 3

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setHowto(false)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const slide = { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 }, transition: { duration: 0.22 } }

  return (
    <div className="relative flex-1 flex flex-col" style={{ ['--clean' as string]: 0.3 }}>
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="arena-sky" style={{ backgroundImage: `url(${skylineUrl})` }} />
        <div className="arena-smog" />
        <div className="arena-clean" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 pb-8">
        {step !== 'title' && (
          <div className="w-full flex items-center justify-between mb-4">
            <button type="button" onClick={back} className="hud-btn !px-4 !py-1.5 text-sm gap-1">
              ← ย้อนกลับ
            </button>
            <div className="flex items-center gap-2" aria-label={`ขั้นที่ ${n} จาก 3`}>
              {[1, 2, 3].map((i) => (
                <span key={i} className={`h-2.5 rounded-full transition-all ${i === n ? 'w-8 bg-amber-300' : i < n ? 'w-2.5 bg-amber-300/70' : 'w-2.5 bg-white/25'}`} />
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {step === 'title' && (
            <motion.div key="title" {...slide} className="w-full text-center">
              <div className="relative h-44 sm:h-52 mb-2 flex justify-center items-end">
                <motion.div className="absolute" style={{ left: 'calc(50% - 8.5rem)', bottom: 0 }} initial={{ rotate: -20, y: 30, opacity: 0 }} animate={{ rotate: -12, y: [0, -8, 0], opacity: 1 }} transition={{ y: { repeat: Infinity, duration: 4, ease: 'easeInOut' } }}>
                  <CardBack side="P" width="7.5rem" />
                </motion.div>
                <motion.div className="absolute" style={{ left: 'calc(50% + 1rem)', bottom: 0 }} initial={{ rotate: 20, y: 30, opacity: 0 }} animate={{ rotate: 12, y: [0, -8, 0], opacity: 1 }} transition={{ y: { repeat: Infinity, duration: 4.6, ease: 'easeInOut' } }}>
                  <CardBack side="B" width="7.5rem" />
                </motion.div>
              </div>
              <h1 className="font-display text-4xl sm:text-6xl tracking-tight drop-shadow-lg">ฝ่าด่านลดคาร์บอน</h1>
              <p className="text-white/70 mt-2 sm:text-lg">เกมการ์ดสองฝ่าย ผลักดัน vs ต่อต้าน — เล่นกับบอท</p>
              <div className="mt-8 flex flex-col gap-3 max-w-xs mx-auto">
                <MenuBtn primary onClick={() => setStep('side')}>
                  เริ่มเกมใหม่
                </MenuBtn>
                <MenuBtn onClick={() => setHowto(true)}>วิธีเล่น</MenuBtn>
              </div>
              <p className="mt-10 text-xs text-white/45 max-w-xl mx-auto leading-relaxed">
                ต้นแบบสำหรับทดลองเล่น · ได้แรงบันดาลใจด้านโครงสร้างจากเกม Bangkok's Big Brother: เราจะทำตามสัญญา ของ iLaw · ความรู้บนการ์ดเป็นหลักการทั่วไป ควรให้ผู้เชี่ยวชาญตรวจอีกครั้งก่อนเผยแพร่จริง
              </p>
            </motion.div>
          )}

          {step === 'side' && (
            <motion.div key="side" {...slide} className="w-full">
              <h2 className="font-display text-3xl text-center mb-5">คุณจะเล่นฝ่ายไหน</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {(['P', 'B'] as Side[]).map((sd) => (
                  <PickCard
                    key={sd}
                    selected={cfg.side === sd}
                    onClick={() => {
                      setCfg({ ...cfg, side: sd })
                      setStep('contract')
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <img src={sd === 'P' ? avatarPusherUrl : avatarBlockerUrl} alt="" className="size-20 sm:size-24 rounded-full ring-2 ring-white/30 shrink-0" />
                      <div>
                        <div className="font-display text-2xl">{sd === 'P' ? '🌱 ฝ่ายผลักดัน' : '⛔ ฝ่ายต่อต้าน'}</div>
                        <div className="text-sm text-white/60">{sd === 'P' ? 'ลงมือทำ' : 'ขวางทาง'}</div>
                      </div>
                    </div>
                    <p className="mt-3 text-white/85 leading-relaxed text-sm sm:text-base">
                      {sd === 'P' ? (
                        <>
                          วางมาตรการลดคาร์บอนทีละใบ ถ้า <b>รอดจากด่าน</b> จะได้แต้มทุกตาไปจนจบเกม ถึงเป้าตามการ์ดสัญญาถือว่าชนะ
                        </>
                      ) : (
                        <>
                          เป็นตัวแทนอุปสรรคจริง วางการ์ด <b>ด่าน</b> ขวางมาตรการที่เพิ่งวาง ให้ไม่ถึงเป้า
                        </>
                      )}
                    </p>
                  </PickCard>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'contract' && (
            <motion.div key="contract" {...slide} className="w-full">
              <h2 className="font-display text-3xl text-center">เลือกการ์ดสัญญา</h2>
              <p className="text-center text-white/60 text-sm mt-1 mb-5">เป้าคะแนนที่ฝ่ายผลักดันต้องทำให้ถึง</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {CONTRACTS.map((c) => (
                  <PickCard
                    key={c.id}
                    selected={cfg.target === c.target}
                    onClick={() => {
                      setCfg({ ...cfg, target: c.target })
                      setStep('item')
                    }}
                  >
                    <div className="text-4xl" aria-hidden>
                      {c.emoji}
                    </div>
                    <div className="font-display text-xl mt-2">{c.name}</div>
                    <div className="text-amber-200 font-medium">เป้า {c.target} แต้ม</div>
                    <div className="text-sm text-white/65 mt-1">{c.note}</div>
                  </PickCard>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'item' && (
            <motion.div key="item" {...slide} className="w-full">
              <h2 className="font-display text-3xl text-center">เลือกไอเท็มเริ่มเกม</h2>
              <p className="text-center text-white/60 text-sm mt-1 mb-5">วางแล้วอยู่ทั้งเกม ปิดไม่ได้ · เล่นฝ่าย{cfg.side === 'P' ? 'ผลักดัน' : 'ต่อต้าน'} · เป้า {cfg.target} แต้ม</p>
              <div className="grid sm:grid-cols-3 gap-4">
                {items.map((id) => (
                  <PickCard key={id} selected={current === id} onClick={() => setItem(id)}>
                    <div className="text-3xl" aria-hidden>
                      {ITEM_META[id].emoji}
                    </div>
                    <div className="font-display text-lg mt-1">{ITEM_META[id].name}</div>
                    <div className="text-sm text-white/70 leading-snug mt-1">{ITEM_META[id].desc}</div>
                  </PickCard>
                ))}
              </div>
              <p className="text-xs text-white/50 mt-2 text-center">บอทจะสุ่มไอเท็มของตัวเอง อีก 2 ใบที่ไม่ได้เลือกจะสับเข้ากองและอาจจั่วได้ภายหลัง</p>

              <label className="mt-5 flex items-start gap-3 cursor-pointer max-w-xl mx-auto">
                <input type="checkbox" checked={cfg.hints} onChange={(e) => setCfg({ ...cfg, hints: e.target.checked })} className="mt-1 w-5 h-5 accent-[oklch(53%_0.15_152)]" />
                <span className="text-white/85 text-sm leading-relaxed">
                  <b>โหมดช่วยจำ</b> เมื่อเลือกการ์ดจะบอกว่ากุญแจในมือแก้ด่านของใบนั้นได้ไหม (ปิดไว้ถ้าอยากเล่นแบบท้าทาย)
                </span>
              </label>
              <div className="mt-6 max-w-xs mx-auto">
                <MenuBtn primary onClick={onStart}>
                  เริ่มเล่น
                </MenuBtn>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {howto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-[2px]" onClick={() => setHowto(false)}>
          <div className="sheet relative w-full max-w-2xl max-h-[92dvh] overflow-y-auto p-5 sm:p-7" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setHowto(false)} className="absolute right-3 top-3 rounded-full bg-ink/10 hover:bg-ink/20 px-2.5 py-0.5 text-sm" aria-label="ปิด (Esc)">
              ✕
            </button>
            <h2 className="font-display text-2xl mb-3">วิธีเล่น</h2>
            <div className="grid sm:grid-cols-2 gap-3 leading-relaxed text-sm">
              <div className="rounded-2xl border-2 border-green-200 bg-green-50/60 p-3">
                <b>🌱 ฝ่ายผลักดัน</b>
                <br />
                วางมาตรการลดคาร์บอนทีละใบ ถ้า <b>รอดจากด่าน</b> จะได้แต้มทุกตาไปจนจบเกม ถึงเป้าตามการ์ดสัญญาถือว่าชนะ
              </div>
              <div className="rounded-2xl border-2 border-red-200 bg-red-50/60 p-3">
                <b>⛔ ฝ่ายต่อต้าน</b>
                <br />
                เป็นตัวแทนอุปสรรคจริง วางการ์ด <b>ด่าน</b> ขวางมาตรการที่เพิ่งวาง ให้ไม่ถึงเป้า
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-line bg-white p-3">
              <div className="font-medium mb-2">หัวใจของเกม: ด่านแต่ละแบบ แก้ด้วยกุญแจที่ตรงกัน</div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                {ICON_IDS.map((i) => (
                  <div key={i}>
                    {ICONS[i].emoji} <b>{ICONS[i].name}</b> → {KEYS[i].emoji} {KEYS[i].name}
                  </div>
                ))}
                <div>
                  (ทุกด่าน) → {KEYS.W.emoji} {KEYS.W.name}
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-ink/70 leading-relaxed">
              ในเกม: <b>ลากการ์ดขึ้นไปวางที่โต๊ะ</b> เพื่อเล่น หรือแตะการ์ดเพื่อดูรายละเอียดก่อน (จอสัมผัสใช้แตะอย่างเดียว) กด Esc เพื่อปิดหน้าต่างรายละเอียด
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- กระดานเกม */

function Board({ game, setGame, hints, onAgain, feed, muted, onMute, onQuit }: { game: State; setGame: SetGame; hints: boolean; onAgain: () => void; feed: BotMove[]; muted: boolean; onMute: () => void; onQuit: () => void }) {
  const me = game.human as Side
  const a = actor(game)
  const mine = a === me && game.phase !== 'over'
  const choosing = mine && (game.phase === 'p-turn' || game.phase === 'b-respond') && !game.frozen
  const dock = useMedia('(min-width: 1024px)')

  // การ์ดที่เลือกไว้ — ผูกกับตา+เฟส จึงล้างเองเมื่อขึ้นตา/เฟสใหม่ ไม่ต้องใช้ effect
  const key = `${game.turn}-${game.phase}-${game.log.length}`
  const [sel, setSel] = useState<{ key: string; id: number } | null>(null)
  const selectedId = sel && sel.key === key ? sel.id : null
  const onSelect = (id: number) => setSel({ key, id })

  const tableRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<'off' | 'on' | 'over'>('off')

  // กด Esc = ปิดหน้าต่างรายละเอียดการ์ด
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setSel(null)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // การ์ดที่บอทเพิ่งเล่น — โชว์กลางจอ ~2 วินาที
  const last = feed[feed.length - 1]
  const [seen, setSeen] = useState<BotMove | null>(null)
  const reveal = last && last !== seen ? last : null
  useEffect(() => {
    if (!last) return
    if (last.cards.length) sfx.drop()
    const t = setTimeout(() => setSeen(last), 2100)
    return () => clearTimeout(t)
  }, [last])

  const hand = me === 'P' ? game.pHand : game.bHand
  const pct = Math.min(100, (game.score / game.target) * 100)

  // หน้าต่างบังคับตอบ (ถูกปิด · ข่าวลือ · ตัดงบ · จบเกม) ขึ้นกลางจอ
  const modal =
    game.phase === 'over' ||
    (game.phase === 'counter' && game.pending?.kind === 'counter') ||
    (game.phase === 'negate' && game.pending?.kind === 'negate') ||
    (a === me && me === 'P' && !!game.frozen)
  const sheetOn = a === me && !modal && game.phase !== 'over'
  const entry = entryOf(game, game.ctx)

  // ปล่อยการ์ดลงโต๊ะ = เล่นการ์ดนั้นเลยถ้าเจตนาชัด (มาตรการ · ด่านที่ปิดได้ · ไอเท็ม) ที่เหลือเปิดแผงให้เลือกวิธีเล่น
  const onDrop = (c: Card) => {
    if (!choosing) return
    sfx.drop()
    if (me === 'P') {
      if (c.kind === 'measure') return setGame((g) => g && playMeasure(g, c.id))
      if (c.kind === 'pitem') return setGame((g) => g && playPItem(g, c.id))
    } else {
      if (c.kind === 'block' && legalBlocks(game).some((b) => b.id === c.id)) return setGame((g) => g && bRespond(g, { t: 'block', cardId: c.id }))
      if (c.kind === 'bitem') return setGame((g) => g && bRespond(g, { t: 'item', cardId: c.id }))
      if (c.kind === 'rumor' || c.kind === 'wipe' || c.kind === 'freeze') return setGame((g) => g && bRespond(g, { t: 'special', cardId: c.id }))
    }
    onSelect(c.id)
  }

  const stage = (
    <motion.div
      key={`${game.phase}-${a}-${game.turn}-${game.pending?.kind ?? ''}-${game.frozen ? 1 : 0}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Stage game={game} me={me} hints={hints} selectedId={selectedId} setGame={setGame} onAgain={onAgain} />
    </motion.div>
  )

  return (
    <div className="relative h-full flex flex-col" style={{ ['--clean' as string]: pct / 100 }}>
      <div className="arena-sky" style={{ backgroundImage: `url(${skylineUrl})` }} aria-hidden />
      <div className="arena-smog" aria-hidden />
      <div className="arena-clean" aria-hidden />

      <Hud game={game} me={me} muted={muted} onMute={onMute} onQuit={onQuit} />
      <OpponentSeat game={game} me={me} feed={feed} />

      {/* โต๊ะ + แผงการกระทำ (จอกว้างจอดไว้ข้างโต๊ะ) */}
      <div className="relative z-10 flex-1 min-h-0 w-full max-w-[1400px] mx-auto flex gap-3 px-3 pb-2">
        <div ref={tableRef} className="flex-1 min-w-0 min-h-0">
          <TableView game={game} drag={drag} logLine={game.log[game.log.length - 1]} />
        </div>
        {dock && sheetOn && selectedId === null && (
          <aside className="sheet w-[25rem] shrink-0 min-h-0 overflow-y-auto p-4" aria-label="การกระทำของคุณ">
            {stage}
          </aside>
        )}
      </div>

      {/* จอแคบ: แถบบอกสถานะตาเรา · เลือกการ์ดแล้วแผงเด้งขึ้นเหนือมือ */}
      {!dock && sheetOn && selectedId === null && (
        <div className="relative z-20 mx-3 mb-1 rounded-2xl bg-black/40 border border-white/15 px-3 py-2 text-sm flex items-center gap-2">
          <span className="flex-1 min-w-0 leading-snug">
            {me === 'P' ? '👆 ตาของคุณ — ลากการ์ดขึ้นโต๊ะ หรือแตะการ์ดเพื่อดูรายละเอียด' : entry ? `ฝ่ายผลักดันวาง ${entry.card.emoji} ${entry.card.name} — ลากด่านขึ้นโต๊ะเพื่อปิด` : 'ตาของคุณ — ลากการ์ดขึ้นโต๊ะ หรือแตะเพื่อเลือก'}
          </span>
          {me === 'B' && (
            <button type="button" onClick={() => setGame((g) => g && bRespond(g, { t: 'pass' }))} className="shrink-0 rounded-full bg-white/15 border border-white/25 px-3 py-1 text-xs font-medium">
              ผ่าน
            </button>
          )}
        </div>
      )}
      {/* มือ — การ์ดเรียงเป็นพัดที่ขอบล่าง */}
      <div className="relative z-30 shrink-0 h-[34dvh] max-h-[22rem] min-h-[11rem]">
        <HandFan game={game} hand={hand} me={me} selectedId={selectedId} interactive={choosing} onSelect={onSelect} onDrop={onDrop} onDragState={setDrag} tableRef={tableRef} />
      </div>

      {/* บอทวางการ์ด: โชว์กลางจอครู่หนึ่งให้เห็นว่าเล่นอะไร */}
      <AnimatePresence>
        {reveal && (
          <motion.div
            key={reveal.id}
            initial={{ opacity: 0, y: -50, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="pointer-events-none absolute inset-x-0 top-[24%] z-40 flex flex-col items-center gap-3 px-4"
          >
            <div className="flex gap-3 justify-center">
              {reveal.cards.slice(0, 3).map(({ card, hidden }, i) => (
                <div key={card.id} className="w-32 sm:w-44 rounded-[5.73%/4.2%] overflow-hidden shadow-2xl" style={{ transform: `rotate(${(i - (Math.min(reveal.cards.length, 3) - 1) / 2) * 5}deg)` }}>
                  {hidden ? <CardBack side={reveal.side} width="100%" label="วางคว่ำ" /> : <PrintFace card={card} />}
                </div>
              ))}
              {reveal.cards.length === 0 && <div className="text-6xl" aria-hidden>🤚</div>}
            </div>
            <div className="max-w-md rounded-2xl bg-black/75 px-4 py-2 text-center text-sm sm:text-base leading-snug">{reveal.lines[0]}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {(modal || (sheetOn && selectedId !== null)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-[2px]" onClick={() => !modal && setSel(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="sheet relative w-full max-w-3xl max-h-[92dvh] overflow-y-auto p-4"
          >
            {!modal && (
              <button type="button" onClick={() => setSel(null)} className="absolute right-3 top-3 z-20 rounded-full bg-ink/10 hover:bg-ink/20 px-2.5 py-0.5 text-sm" aria-label="ปิด (Esc)">
                ✕
              </button>
            )}
            {stage}
          </motion.div>
        </div>
      )}
    </div>
  )
}

/** แถบบนสุด: ปุ่มเมนู · คะแนน + หลอดคาร์บอน · ตา · ไอเท็มของเรา */
function Hud({ game, me, muted, onMute, onQuit }: { game: State; me: Side; muted: boolean; onMute: () => void; onQuit: () => void }) {
  const pct = Math.min(100, (game.score / game.target) * 100)
  const preview = turnScore(game, game.ctx)
  return (
    <div className="relative z-10 px-3 pt-2 pb-1">
      <div className="mx-auto max-w-[1400px] flex items-center gap-2 sm:gap-4">
        <a href="#" aria-label="หน้าแรก" className="hud-btn">
          <Home size={18} />
        </a>
        <button type="button" onClick={onQuit} aria-label="เริ่มใหม่" className="hud-btn">
          <RotateCcw size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] sm:text-xs text-white/60 whitespace-nowrap">คะแนนลดคาร์บอน</span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={game.score}
                initial={{ y: -12, opacity: 0, scale: 1.3 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 12, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 24 }}
                className="font-display text-2xl sm:text-3xl tabular leading-none text-amber-200"
              >
                {game.score}
              </motion.span>
            </AnimatePresence>
            <span className="text-sm text-white/55 tabular">/ {game.target}</span>
          </div>
          <div className="relative mt-1 h-3.5 rounded-full bg-black/45 border border-white/20 overflow-hidden" role="progressbar" aria-valuenow={game.score} aria-valuemax={game.target}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#f59e0b,#84cc16 60%,#22c55e)' }} />
            {[25, 50, 75].map((t) => (
              <span key={t} className="absolute top-0 h-full w-px bg-white/25" style={{ left: `${t}%` }} />
            ))}
          </div>
        </div>
        <div className="text-right leading-tight shrink-0">
          <div className="text-xs sm:text-sm text-white/80">ตาที่ {game.turn}</div>
          <div className="text-xs sm:text-sm font-medium text-amber-200 whitespace-nowrap">ตานี้ +{preview}</div>
        </div>
        <button type="button" onClick={onMute} aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'} className="hud-btn">
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>
      <div className="mx-auto max-w-[1400px] mt-1.5 flex flex-wrap gap-1.5 items-center min-h-6">
        <span className="text-xs text-white/50">ไอเท็มของคุณ</span>
        {(me === 'P' ? game.pItems : game.bItems).map((i, k) => (
          <span key={k} className="hud-pill" title={ITEM_META[i].desc}>
            {ITEM_META[i].emoji} {ITEM_META[i].name}
          </span>
        ))}
        {me === 'B' && game.trap && (
          <span className="hud-pill" title="ด่านคว่ำของคุณ จะเปิดเมื่อฝ่ายผลักดันวางมาตรการใบต่อไป">
            🂠 ด่านคว่ำ: {game.trap.name}
          </span>
        )}
        {game.frozen && <span className="hud-pill border-red-300/60 bg-red-500/30">✂️ ตาหน้าถูกตัดงบ</span>}
      </div>
    </div>
  )
}

/** คู่ต่อสู้ (บอท) นั่งอยู่ฝั่งตรงข้าม: หน้าตัวละคร · การ์ดคว่ำในมือ · บับเบิลบอกสิ่งที่เพิ่งทำ */
function OpponentSeat({ game, me, feed }: { game: State; me: Side; feed: BotMove[] }) {
  const opp: Side = me === 'P' ? 'B' : 'P'
  const hand = opp === 'P' ? game.pHand : game.bHand
  const items = opp === 'P' ? game.pItems : game.bItems
  const thinking = actor(game) === opp && game.phase !== 'over'
  const last = feed[feed.length - 1]
  const roomy = useMedia('(min-width: 640px)')
  const shown = Math.min(hand.length, 7)
  const bw = roomy ? 4.2 : 2.5
  const name = opp === 'P' ? 'ฝ่ายผลักดัน (บอท)' : 'ฝ่ายต่อต้าน (บอท)'
  return (
    <div className="relative z-10 px-3 pb-2">
      <div className="mx-auto max-w-[1400px] flex items-center gap-3 sm:gap-5">
        <div className="shrink-0 flex items-center gap-3">
          <div className={`rounded-full p-1 bg-white/10 ${thinking ? 'ring-4 ring-amber-300/80 animate-pulse' : 'ring-2 ring-white/25'}`}>
            <img src={opp === 'P' ? avatarPusherUrl : avatarBlockerUrl} alt="" className="size-14 sm:size-20 rounded-full" />
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="font-display text-lg">{name}</div>
            <div className="text-xs text-white/60">{opp === 'P' ? 'ผู้ริเริ่มโครงการ' : 'ผู้คัดค้าน'}</div>
            <div className="text-xs mt-1 text-amber-200">
              {thinking ? 'กำลังคิด…' : 'รอคุณ'} · ถือ {hand.length} ใบ
            </div>
          </div>
        </div>

        {/* การ์ดคว่ำในมือบอท */}
        <div className="relative shrink-0" style={{ width: `${bw + (shown - 1) * bw * 0.45}rem`, height: `${bw * 1.364 + 0.4}rem` }} aria-label={`บอทถือการ์ด ${hand.length} ใบ`}>
          <AnimatePresence initial={false}>
            {hand.slice(0, shown).map((c, i) => (
              <motion.div
                key={c.id}
                className="absolute top-0"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: thinking ? -4 : 0, rotate: (i - (shown - 1) / 2) * 4 }}
                exit={{ opacity: 0, y: 30 }}
                style={{ left: `${i * bw * 0.45}rem`, zIndex: i }}
              >
                <CardBack side={opp} width={`${bw}rem`} label="" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* บับเบิล: สิ่งที่บอทเพิ่งทำ */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={last?.id ?? (thinking ? 'think' : 'idle')}
              initial={{ opacity: 0, scale: 0.9, x: -8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative rounded-2xl bg-white text-ink px-3 py-2 text-xs sm:text-sm leading-snug shadow-lg min-w-0"
            >
              <span className="absolute -left-1.5 top-4 size-3 rotate-45 bg-white" aria-hidden />
              {thinking ? (
                <span>
                  กำลังคิด<span className="animate-pulse">…</span>
                </span>
              ) : last ? (
                <>
                  <div className="text-[10px] text-ink/50">ตาที่ {last.turn}</div>
                  {last.lines.slice(0, 3).map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </>
              ) : (
                <span>พร้อมแล้ว เริ่มเลย</span>
              )}
            </motion.div>
          </AnimatePresence>
          {!thinking &&
            last?.cards.slice(0, 2).map(({ card, hidden }) => (
              <motion.div key={card.id} initial={{ opacity: 0, y: -16, rotate: -6 }} animate={{ opacity: 1, y: 0, rotate: 0 }} className="shrink-0 w-14 sm:w-20 rounded-[5.73%/4.2%] overflow-hidden shadow-lg">
                {hidden ? <CardBack side={last.side} width="100%" label="" /> : <PrintFace card={card} />}
              </motion.div>
            ))}
        </div>
      </div>
      {(items.length > 0 || (opp === 'B' && game.trap)) && (
        <div className="mx-auto max-w-[1400px] mt-1.5 hidden sm:flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-white/50">ของบอท</span>
          {items.map((i, k) => (
            <span key={k} className="hud-pill" title={ITEM_META[i].desc}>
              {ITEM_META[i].emoji} {ITEM_META[i].name}
            </span>
          ))}
          {opp === 'B' && game.trap && <span className="hud-pill border-dashed">🂠 ด่านคว่ำ 1 ใบ (เปิดเมื่อคุณวางมาตรการใบหน้า)</span>}
        </div>
      )}
    </div>
  )
}

/** มือของเรา: การ์ดเรียงเป็นพัดที่ขอบล่าง ชี้แล้วยกขึ้นขยายให้อ่าน · ลากขึ้นโต๊ะเพื่อเล่น */
function HandFan({
  game,
  hand,
  me,
  selectedId,
  interactive,
  onSelect,
  onDrop,
  onDragState,
  tableRef,
}: {
  game: State
  hand: Card[]
  me: Side
  selectedId: number | null
  interactive: boolean
  onSelect: (id: number) => void
  onDrop: (c: Card) => void
  onDragState: (s: 'off' | 'on' | 'over') => void
  tableRef: React.RefObject<HTMLDivElement | null>
}) {
  const [ref, box] = useBox(true)
  const n = hand.length
  const W = box?.w ?? 0
  const cw = box && box.w > 0 && box.h > 0 ? Math.floor(Math.min((box.h * 0.88) / (952 / 698), 210, box.w * 0.42)) : 120
  const step = n > 1 ? Math.min(cw * 0.92, (W - cw - 16) / (n - 1)) : 0
  const max = me === 'P' ? handMax(game) : 4
  return (
    <div ref={ref} className="relative h-full">
      <div className="absolute left-3 top-0 z-0 text-xs text-white/60 pointer-events-none">
        {me === 'P' ? '🌱' : '⛔'} การ์ดในมือ {n}/{max}
        {interactive && <span className="text-amber-200"> · ลากขึ้นโต๊ะเพื่อเล่น</span>}
      </div>
      <AnimatePresence initial>
        {hand.map((c, i) => (
          <FanCard key={c.id} card={c} i={i} n={n} cw={cw} step={step} selected={selectedId === c.id} interactive={interactive} onSelect={onSelect} onDrop={onDrop} onDragState={onDragState} tableRef={tableRef} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function FanCard({
  card,
  i,
  n,
  cw,
  step,
  selected,
  interactive,
  onSelect,
  onDrop,
  onDragState,
  tableRef,
}: {
  card: Card
  i: number
  n: number
  cw: number
  step: number
  selected: boolean
  interactive: boolean
  onSelect: (id: number) => void
  onDrop: (c: Card) => void
  onDragState: (s: 'off' | 'on' | 'over') => void
  tableRef: React.RefObject<HTMLDivElement | null>
}) {
  const fine = useFinePointer()
  const dragged = useRef(false)
  const off = i - (n - 1) / 2
  const H = cw * (952 / 698)
  const ang = Math.min(3.5, 20 / Math.max(n, 1))
  const inTable = (p: { x: number; y: number }) => {
    const r = tableRef.current?.getBoundingClientRect()
    return !!r && p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom
  }
  return (
    <motion.button
      type="button"
      aria-label={describe(card).name}
      aria-pressed={selected}
      className="absolute bottom-0 left-1/2 outline-none focus-visible:ring-4 ring-amber-300 rounded-[5.73%/4.2%]"
      style={{ width: cw, marginLeft: -cw / 2, transformOrigin: '50% 100%', zIndex: selected ? 30 : i, touchAction: 'manipulation' }}
      initial={{ opacity: 0, x: 0, y: H * 0.8, rotate: 0, scale: 0.8 }}
      animate={{
        opacity: interactive ? 1 : 0.82,
        x: off * step,
        y: selected ? -H * 0.12 : off * off * 2.5,
        rotate: selected ? 0 : off * ang,
        scale: selected ? 1.04 : 1,
      }}
      exit={{ opacity: 0, y: -H * 0.6, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: Math.min(i, 8) * 0.05 }}
      whileHover={interactive && fine ? { y: -H * 0.52, rotate: 0, scale: 1.38, zIndex: 60 } : undefined}
      drag={interactive && fine}
      dragSnapToOrigin
      dragMomentum={false}
      dragElastic={0.6}
      whileDrag={{ scale: 1.12, rotate: 0, zIndex: 90, cursor: 'grabbing' }}
      onDragStart={() => {
        dragged.current = true
        onDragState('on')
      }}
      onDrag={(_, info) => onDragState(inTable(info.point) ? 'over' : 'on')}
      onDragEnd={(_, info) => {
        const ok = inTable(info.point)
        onDragState('off')
        if (ok) onDrop(card)
        setTimeout(() => {
          dragged.current = false
        }, 0)
      }}
      onClick={() => {
        if (!dragged.current && interactive) onSelect(card.id)
      }}
    >
      <div className={`card-tilt shadow-[0_10px_24px_rgba(0,0,0,0.5)] ${selected ? 'ring-4 ring-amber-300' : ''}`}>
        <PrintFace card={card} />
        <div className="card-glare" aria-hidden />
      </div>
    </motion.button>
  )
}

/** โต๊ะของฝ่ายผลักดัน: มาตรการที่ยังรอด + ตัวเสริมที่ประกบ + ความคืบหน้าของระบบครบวงจร */
function TableView({ game, drag, logLine }: { game: State; drag: 'off' | 'on' | 'over'; logLine?: string }) {
  const counts = catCounts(game)
  const combos = comboCats(game)
  const deckLeft = game.pDeck.length
  const glow = drag === 'over' ? 'ring-4 ring-emerald-300 shadow-[0_0_44px_rgba(110,231,183,0.6)]' : drag === 'on' ? 'outline outline-2 outline-dashed outline-emerald-200/70 -outline-offset-8' : ''
  return (
    <div className={`felt h-full min-h-0 flex flex-col p-3 sm:p-4 transition-shadow ${glow}`} style={{ ['--felt-tile' as string]: `url(${feltUrl})` }}>
      <div className="flex items-start justify-between gap-3 mb-2 shrink-0">
        <div className="min-w-0">
          <div className="font-display text-base sm:text-lg leading-tight">
            🌱 โต๊ะของฝ่ายผลักดัน <span className="felt-muted text-sm font-sans">· {game.table.length} มาตรการที่รอด</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {(Object.keys(CATS) as (keyof typeof CATS)[]).map((k) => (
              <Chip key={k} tone={counts[k] >= 3 ? 'green' : 'plain'} title="มาตรการหมวดเดียวกันรอด ≥ 3 ใบ = ระบบครบวงจร +2 แต้ม/ตา">
                {CATS[k].emoji} {counts[k]}/3{counts[k] >= 3 && ' ✓ +2'}
              </Chip>
            ))}
          </div>
        </div>
        <div className="shrink-0 text-center" title={`กองจั่วเหลือ ${deckLeft} ใบ`}>
          <div className="relative" style={{ width: '2.6rem', height: `${2.6 * (952 / 698) + 0.3}rem` }}>
            {[2, 1, 0].map((n) => (
              <div key={n} className="absolute" style={{ left: n * 2, top: -n * 2, opacity: deckLeft > n * 4 ? 1 : 0 }}>
                <CardBack side="P" width="2.6rem" label="" />
              </div>
            ))}
          </div>
          <div className="felt-muted text-[11px] mt-0.5 tabular">กองจั่ว {deckLeft}</div>
        </div>
      </div>
      <div className="relative flex-1 min-h-0 overflow-y-auto">
        {game.table.length === 0 ? (
          <div className="felt-muted text-sm h-full min-h-[5rem] flex items-center justify-center text-center px-4">ยังไม่มีมาตรการบนโต๊ะ — ลากมาตรการจากมือมาวางที่นี่ มาตรการที่รอดจะได้แต้มทุกตา</div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pb-1">
            <AnimatePresence initial={false}>
              {game.table.map((e) => (
                <EntryTile key={e.id} e={e} isNew={e.id === game.ctx} inCombo={combos.includes(e.card.cat)} />
              ))}
            </AnimatePresence>
          </div>
        )}
        <AnimatePresence>
          {drag !== 'off' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className={`rounded-full px-5 py-2 font-display text-lg ${drag === 'over' ? 'bg-emerald-300 text-emerald-950' : 'bg-black/40 text-white/80'}`}>{drag === 'over' ? 'ปล่อยเพื่อเล่น' : 'ลากมาวางที่โต๊ะ'}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {logLine && (
        <div className="mt-2 shrink-0 rounded-xl bg-black/30 px-3 py-1.5 text-xs sm:text-sm leading-snug text-white/85 max-h-[3.2rem] overflow-y-auto" aria-live="polite">
          {logLine}
        </div>
      )}
    </div>
  )
}

function EntryTile({ e, isNew, inCombo }: { e: Entry; isNew: boolean; inCombo: boolean }) {
  const cat = CATS[e.card.cat]
  const shielded = e.att.some((a) => a.kind === 'meter')
  // วางแต่ละใบเอียงต่างกันนิดหน่อยตาม id เหมือนวางการ์ดจริงบนโต๊ะ
  const tilt = ((e.id * 37) % 7) - 3
  return (
    <motion.div
      layout
      initial={{ scale: 1.5, opacity: 0, y: -80, rotate: tilt * 4 }}
      animate={{ scale: 1, opacity: 1, y: 0, rotate: tilt * 0.7 }}
      exit={{ scale: 0.8, opacity: 0, y: 20, rotate: tilt * 5 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      className="rounded-2xl border-2 p-2.5 text-center flex flex-col items-center gap-1 text-ink"
      style={{ background: cat.tint, borderColor: isNew ? cat.color : `${cat.color}55`, boxShadow: isNew ? `0 0 0 3px ${cat.color}66, 0 8px 14px rgba(0,0,0,.35)` : '0 5px 9px rgba(0,0,0,.3)' }}
    >
      <div className="text-4xl leading-none">{e.card.emoji}</div>
      <div className="text-sm font-medium text-ink leading-tight">{e.card.name}</div>
      <div className="flex items-center gap-1 flex-wrap justify-center">
        <span className="text-[11px] font-medium rounded-full px-1.5" style={{ background: '#fff', color: cat.color }}>
          {e.card.pts}
          {e.att.length > 0 && `+${e.att.length}`} แต้ม/ตา
        </span>
        {e.att.map((a) => (
          <span key={a.id} className="text-sm" title={a.kind === 'media' ? 'ออกสื่อ +1' : 'วัดผลให้เห็น +1 และกัน “เปลี่ยนคนทำ”'}>
            {a.kind === 'media' ? '📰' : '📏'}
          </span>
        ))}
      </div>
      <div className="flex gap-0.5">
        {e.card.icons.map((i) => (
          <IconChip key={i} i={i} size="sm" />
        ))}
      </div>
      {(shielded || inCombo) && <div className="text-[10px] text-accent-deep">{shielded ? '🛡 กันเปลี่ยนคนทำ' : '🛡 อยู่ในระบบครบวงจร'}</div>}
    </motion.div>
  )
}

/* ----------------------------------------------------------------- เวทีกลาง */

function Stage({ game, me, hints, selectedId, setGame, onAgain }: { game: State; me: Side; hints: boolean; selectedId: number | null; setGame: SetGame; onAgain: () => void }) {
  const a = actor(game)
  if (game.phase === 'over') return <Over game={game} me={me} onAgain={onAgain} />

  if (game.phase === 'counter' && game.pending?.kind === 'counter') return <CounterPrompt game={game} setGame={setGame} />
  if (game.phase === 'negate' && game.pending?.kind === 'negate') return <NegatePrompt game={game} setGame={setGame} />

  if (a === me) {
    if (me === 'P' && game.frozen) return <FrozenPrompt key={game.turn} game={game} setGame={setGame} />
    const card = (me === 'P' ? game.pHand : game.bHand).find((c) => c.id === selectedId) ?? null
    return me === 'P' ? <PActions game={game} card={card} hints={hints} setGame={setGame} /> : <BActions game={game} card={card} setGame={setGame} />
  }

  // บอทกำลังคิด
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 min-h-[10rem]">
      <div className="text-5xl animate-pulse" aria-hidden>
        🤔
      </div>
      <p className="text-ink text-lg">{a === 'P' ? 'ฝ่ายผลักดัน (บอท) กำลังเลือกการ์ด…' : 'ฝ่ายต่อต้าน (บอท) กำลังคิดว่าจะตอบอย่างไร…'}</p>
      {game.ctx !== null && entryOf(game, game.ctx) && me === 'P' && (
        <p className="text-sm text-ink/60">มาตรการที่คุณเพิ่งวาง: {entryOf(game, game.ctx)!.card.emoji} {entryOf(game, game.ctx)!.card.name}</p>
      )}
    </div>
  )
}

function Heading({ children }: { children: ReactNode }) {
  return <div className="font-display text-xl text-ink mb-2">{children}</div>
}

function Btn({ children, onClick, tone = 'green', disabled }: { children: ReactNode; onClick: () => void; tone?: 'green' | 'red' | 'plain'; disabled?: boolean }) {
  const cls = tone === 'green' ? 'bg-accent text-white' : tone === 'red' ? 'text-white' : 'bg-surface text-ink border-2 border-line'
  const style =
    tone === 'red' ? { background: '#dc2626', ['--pop-shadow' as string]: '#991b1b' } : tone === 'plain' ? { ['--pop-shadow' as string]: 'oklch(85% 0.02 152)' } : undefined
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`pop-btn px-5 py-2.5 font-medium text-left disabled:opacity-40 ${cls}`} style={style}>
      {children}
    </button>
  )
}

/** กุญแจในมือที่แก้ด่านทั้งหมด ตามไอคอนของมาตรการ — ใช้ในโหมดช่วยจำ */
function CoverageHint({ game, card }: { game: State; card: Extract<Card, { kind: 'measure' }> }) {
  const keys = game.pHand.filter((c) => c.kind === 'key')
  const hasW = keys.some((k) => k.kind === 'key' && k.k === 'W')
  return (
    <div className="mt-2 rounded-xl bg-surface border border-line p-2.5 text-sm">
      <div className="text-ink/65 text-xs mb-1">ถ้าถูกปิด ด่านเหล่านี้ที่ปิดมาตรการนี้ได้ — กุญแจในมือคุณแก้ได้ไหม:</div>
      <div className="flex flex-wrap gap-1.5">
        {card.icons.map((i) => {
          const blocked = i === 'P' && game.bItems.includes('comfort')
          const ok = i === 'S' && game.pItems.includes('board') ? 'free' : keys.some((k) => k.kind === 'key' && k.k === i && !blocked) ? 'yes' : hasW ? 'wild' : 'no'
          return (
            <Chip key={i} tone={ok === 'no' ? 'red' : 'green'}>
              {ICONS[i].emoji} {ICONS[i].name}: {ok === 'free' ? '📊 ไม่มีผลกับเรา' : ok === 'yes' ? `มี ${KEYS[i].emoji}` : ok === 'wild' ? 'มี ⭐ ใช้แทนได้' : `ยังไม่มี ${KEYS[i].emoji}${blocked ? ' (🛋️ ต้องใช้ ⭐)' : ''}`}
            </Chip>
          )
        })}
      </div>
    </div>
  )
}

function PActions({ game, card, hints, setGame }: { game: State; card: Card | null; hints: boolean; setGame: SetGame }) {
  const searchCard = game.pHand.find((c) => c.kind === 'search')
  const free = game.trap && searchCard

  return (
    <div>
      <Heading>ตาของคุณ — เลือกทำ 1 อย่าง</Heading>
      {game.trap && (
        <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-sm text-amber-900 flex items-center justify-between gap-2 flex-wrap">
          <span>🂠 ฝ่ายต่อต้านวางด่านคว่ำไว้ 1 ใบ จะเปิดเมื่อคุณวางมาตรการใบต่อไป</span>
          {free ? (
            <button type="button" onClick={() => setGame((g) => g && playSearch(g))} className="rounded-full bg-teal-600 text-white px-3 py-1 text-xs font-medium hover:bg-teal-700">
              🔍 เล่นฟรี: เปิดดูแล้วทิ้ง
            </button>
          ) : (
            <span className="text-xs text-amber-800/80">(มี 🔍 ในมือจะเปิดดูได้ฟรี)</span>
          )}
        </div>
      )}

      {!card ? (
        <div className="text-ink/65 leading-relaxed text-sm">
          <p>
            ลากการ์ดขึ้นโต๊ะ หรือแตะเพื่อดูรายละเอียด: <b>มาตรการ</b> วางลงโต๊ะ · <b>ตัวเสริม (📰 📏)</b> ประกบมาตรการ · <b>ไอเท็ม</b> วางถาวร · หรือ <b>ทิ้ง 1 ใบ</b>
          </p>
          <p className="mt-1.5">กุญแจ (💰 📚 👥 🛠️ ⭐) วางเองไม่ได้ ถือไว้แก้ด่านตอนถูกปิด</p>
        </div>
      ) : (
        <PCardPanel game={game} card={card} hints={hints} setGame={setGame} />
      )}
    </div>
  )
}

function PCardPanel({ game, card, hints, setGame }: { game: State; card: Card; hints: boolean; setGame: SetGame }) {
  const d = describe(card)
  const [attaching, setAttaching] = useState(false)
  const canAttach = (card.kind === 'media' || (card.kind === 'key' && card.k === 'S')) && game.table.length > 0
  return (
    <div>
      <div className="flex gap-3 sm:gap-5 items-start">
        <div className="shrink-0 w-32 sm:w-56">
          <GameCard card={card} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-medium text-ink">
            {d.emoji} {d.name}
          </div>
          <p className="text-ink/75 text-sm leading-relaxed mt-1">{d.desc}</p>
          {card.kind === 'measure' && hints && <CoverageHint game={game} card={card} />}
          {card.kind === 'key' && card.k === 'S' && <p className="text-xs text-ink/55 mt-2">📏 ใช้ได้ 2 แบบ: ถือไว้แก้ด่าน 👀 / ยกเลิกข่าวลือ หรือเอาไปประกบมาตรการ เลือกให้ดี</p>}
        </div>
      </div>

      <ActionFooter>
        <div className="flex flex-wrap gap-2">
          {card.kind === 'measure' && <Btn onClick={() => setGame((g) => g && playMeasure(g, card.id))}>วางมาตรการนี้ลงโต๊ะ</Btn>}
          {card.kind === 'pitem' && <Btn onClick={() => setGame((g) => g && playPItem(g, card.id))}>วางไอเท็มถาวร</Btn>}
          {(card.kind === 'media' || (card.kind === 'key' && card.k === 'S')) && (
            <Btn disabled={!canAttach} onClick={() => setAttaching((v) => !v)}>
              ประกบมาตรการ (+1 แต้ม/ตา){!canAttach && ' — ต้องมีมาตรการบนโต๊ะก่อน'}
            </Btn>
          )}
          {card.kind === 'search' && <span className="text-sm text-ink/60">🔍 เล่นได้จากแถบสีเหลืองเมื่อมีด่านคว่ำ (ฟรี ไม่เสียตา)</span>}
          {card.kind === 'key' && card.k !== 'S' && <span className="text-sm text-ink/60">กุญแจวางเองไม่ได้ ถือไว้แก้ด่าน (ทิ้งได้ถ้ามือเต็ม)</span>}
          <Btn tone="plain" onClick={() => setGame((g) => g && pDiscard(g, card.id))}>
            ทิ้งใบนี้ (นับเป็น 1 ตา)
          </Btn>
        </div>
        {attaching && canAttach && (
          <div className="mt-2">
            <div className="text-sm text-ink/70 mb-1.5">ประกบกับมาตรการไหน</div>
            <div className="flex flex-wrap gap-2">
              {game.table.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setGame((g) => g && attach(g, card.id, e.id))}
                  className="rounded-xl border-2 border-line bg-surface px-3 py-1.5 text-sm hover:border-accent"
                >
                  {e.card.emoji} {e.card.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </ActionFooter>
    </div>
  )
}

/** แถบปุ่มที่ติดขอบล่างของหน้าต่างเสมอ — ไม่ต้องเลื่อนลงไปกด */
function ActionFooter({ children }: { children: ReactNode }) {
  return <div className="sticky -bottom-4 z-10 -mx-4 -mb-4 mt-3 px-4 pt-3 pb-4 bg-[#fbf7ee] border-t border-[#e5d9bd]">{children}</div>
}

function BActions({ game, card, setGame }: { game: State; card: Card | null; setGame: SetGame }) {
  const entry = entryOf(game, game.ctx)
  const blocks = legalBlocks(game)
  const [targeting, setTargeting] = useState(false)
  const d = card ? describe(card) : null
  const targets = scatterTargets(game)

  return (
    <div>
      <Heading>ตาของคุณ — ตอบ 1 ใบ หรือผ่าน</Heading>
      {entry ? (
        <div className="mb-3 rounded-xl border-2 border-green-200 bg-green-50/70 p-3 text-sm">
          ฝ่ายผลักดันเพิ่งวาง <b>{entry.card.emoji} {entry.card.name}</b> ({entry.card.pts} แต้ม) — ด่านที่ปิดได้:{' '}
          <span className="inline-flex gap-1 align-middle">{entry.card.icons.map((i) => <IconChip key={i} i={i} />)}</span>
          <div className="text-xs text-ink/60 mt-1">
            {blocks.length ? `คุณมีการ์ดด่านที่ปิดได้ ${blocks.length} ใบ` : 'คุณไม่มีการ์ดด่านที่ไอคอนตรงกับมาตรการนี้'} · ฝ่ายผลักดันแก้ได้ด้วยกุญแจที่ตรงกัน: {entry.card.icons.map((i) => KEYS[i].emoji).join(' ')} หรือ ⭐
          </div>
        </div>
      ) : (
        <div className="mb-3 rounded-xl border border-line bg-surface p-3 text-sm text-ink/70">ฝ่ายผลักดันไม่ได้วางมาตรการในตานี้ — ปิดอะไรไม่ได้ เล่นการ์ดพิเศษ ไอเท็ม หรือตั้งด่านคว่ำได้</div>
      )}

      {!card || !d ? null : (
        <div className="flex gap-3 sm:gap-5 items-start">
          <div className="shrink-0 w-32 sm:w-56">
            <GameCard card={card} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-medium text-ink">
              {d.emoji} {d.name}
            </div>
            <p className="text-ink/75 text-sm leading-relaxed mt-1">{d.desc}</p>
            {card.kind === 'block' && entry && !blocks.some((b) => b.id === card.id) && (
              <p className="text-xs text-red-700 mt-2">ไอคอนไม่ตรงกับมาตรการ{game.pItems.includes('board') ? ' (หรือ 📊 กันด่าน 👀)' : ''} จึงปิดไม่ได้</p>
            )}
            {card.kind === 'scatter' && targets.length === 0 && <p className="text-xs text-red-700 mt-2">ยังไม่มีตัวเสริมบนโต๊ะ จึงเล่นการ์ดนี้ไม่ได้</p>}
          </div>
        </div>
      )}

      <ActionFooter>
        {card && d && (
          <div className="flex flex-wrap gap-2 mb-2">
            {card.kind === 'block' && (
              <>
                <Btn tone="red" disabled={!blocks.some((b) => b.id === card.id)} onClick={() => setGame((g) => g && bRespond(g, { t: 'block', cardId: card.id }))}>
                  ปิดมาตรการที่เพิ่งวาง
                </Btn>
                <Btn tone="plain" disabled={!!game.trap} onClick={() => setGame((g) => g && bRespond(g, { t: 'trap', cardId: card.id }))}>
                  ตั้งเป็นด่านคว่ำ{game.trap ? ' (มีแล้ว 1 ใบ)' : ''}
                </Btn>
              </>
            )}
            {(card.kind === 'rumor' || card.kind === 'wipe' || card.kind === 'freeze') && (
              <Btn tone="red" onClick={() => setGame((g) => g && bRespond(g, { t: 'special', cardId: card.id }))}>
                เล่นการ์ดนี้
              </Btn>
            )}
            {card.kind === 'scatter' && (
              <Btn tone="red" disabled={targets.length === 0} onClick={() => setTargeting((v) => !v)}>
                เล่นการ์ดนี้
              </Btn>
            )}
            {card.kind === 'bitem' && <Btn onClick={() => setGame((g) => g && bRespond(g, { t: 'item', cardId: card.id }))}>วางไอเท็มถาวร</Btn>}
          </div>
        )}
        {targeting && card?.kind === 'scatter' && (
          <div className="mb-2 flex flex-wrap gap-2">
            {targets.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setGame((g) => g && bRespond(g, { t: 'special', cardId: card.id, targetEntryId: e.id }))}
                className="rounded-xl border-2 border-line bg-surface px-3 py-1.5 text-sm hover:border-red-400"
              >
                {e.card.emoji} {e.card.name} (ตัวเสริม {e.att.length})
              </button>
            ))}
          </div>
        )}
        <Btn tone="plain" onClick={() => setGame((g) => g && bRespond(g, { t: 'pass' }))}>
          ผ่าน (ไม่เล่นการ์ดในตานี้)
        </Btn>
      </ActionFooter>
    </div>
  )
}

/** ฝ่ายผลักดัน (คน) ถูกปิด: เลือกกุญแจแก้ หรือปล่อยให้ปิด */
function CounterPrompt({ game, setGame }: { game: State; setGame: SetGame }) {
  const p = game.pending as Extract<NonNullable<State['pending']>, { kind: 'counter' }>
  const entry = entryOf(game, p.entryId)
  if (!entry) return null
  const keys = counterKeys(game, p.block, entry)
  const matched = matchedIcons(game, p.block, entry)
  return (
    <div>
      <Heading>⛔ ฝ่ายต่อต้านวางด่านใส่มาตรการของคุณ</Heading>
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <div className="w-[36%] max-w-[13rem]">
          <GameCard card={p.block} />
        </div>
        <div className="text-2xl sm:text-3xl shrink-0">→</div>
        <div className="w-[36%] max-w-[13rem]">
          <GameCard card={entry.card} />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-ink leading-relaxed text-sm sm:text-base">
          ด่าน <b>“{p.block.name}”</b> ตรงกับมาตรการ <b>{entry.card.name}</b> ที่ไอคอน{' '}
          <span className="inline-flex gap-1 align-middle">{matched.map((i) => <IconChip key={i} i={i} />)}</span>
        </p>
        <p className="text-xs sm:text-sm text-ink/65 mt-1">
          ทิ้งกุญแจที่ตรงกันเพื่อให้การปิดไม่มีผล —{' '}
          {matched.map((i) => `${ICONS[i].emoji} ต้องใช้ ${KEYS[i].emoji}${i === 'P' && game.bItems.includes('comfort') ? ' (🛋️ ต้องใช้ ⭐ เท่านั้น)' : ''}`).join(' · ')} หรือ ⭐
        </p>
      </div>
      <ActionFooter>
        <div className="flex flex-wrap gap-2">
          {keys.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => {
                sfx.correct()
                setGame((g) => g && counter(g, k.id))
              }}
              className="rounded-2xl border-2 border-violet-300 bg-violet-50 px-4 py-2 text-left hover:border-violet-500 transition-colors"
            >
              <span className="text-2xl mr-1">{KEYS[k.k].emoji}</span>
              <span className="font-medium text-ink">ใช้ {KEYS[k.k].name}</span>
            </button>
          ))}
          <Btn
            tone="plain"
            onClick={() => {
              sfx.wrong()
              setGame((g) => g && counter(g, null))
            }}
          >
            ปล่อยให้ปิด (มาตรการหายไป)
          </Btn>
        </div>
      </ActionFooter>
    </div>
  )
}

function NegatePrompt({ game, setGame }: { game: State; setGame: SetGame }) {
  const r = (game.pending as Extract<NonNullable<State['pending']>, { kind: 'negate' }>).rumor
  return (
    <div>
      <Heading>
        {r.emoji} {r.name}: หักคะแนนของคุณ {r.v} แต้ม
      </Heading>
      <p className="text-ink/75 leading-relaxed">ทิ้ง 📏 วัดผลให้เห็น 1 ใบจากมือ เพื่อยกเลิกได้ — แต่จะประกบมาตรการ (+1 แต้ม/ตา) ด้วยใบนี้ไม่ได้อีก</p>
      <ActionFooter>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => setGame((g) => g && negate(g, true))}>📏 ทิ้งเพื่อยกเลิก</Btn>
          <Btn tone="plain" onClick={() => setGame((g) => g && negate(g, false))}>
            ยอมเสีย {r.v} แต้ม
          </Btn>
        </div>
      </ActionFooter>
    </div>
  )
}

function FrozenPrompt({ game, setGame }: { game: State; setGame: SetGame }) {
  const need = Math.min(2, game.pHand.length)
  const [ids, setIds] = useState<number[]>([])
  const toggle = (id: number) => setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < need ? [...cur, id] : cur))
  return (
    <div>
      <Heading>✂️ ถูกตัดงบกลางปี — ตานี้วางการ์ดไม่ได้</Heading>
      <p className="text-ink/75 leading-relaxed">ต้องทิ้งการ์ดในมือ {need} ใบ (เลือกใบที่ไม่ต้องการ) แล้วคะแนนจากโต๊ะยังได้ตามปกติ</p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3 max-w-xl">
        {game.pHand.map((c) => (
          <GameCard key={c.id} card={c} selected={ids.includes(c.id)} onClick={() => toggle(c.id)} />
        ))}
      </div>
      <ActionFooter>
        <Btn disabled={ids.length !== need} onClick={() => setGame((g) => g && frozenDiscard(g, ids))}>
          ทิ้ง {ids.length}/{need} ใบ
        </Btn>
      </ActionFooter>
    </div>
  )
}

function Over({ game, me, onAgain }: { game: State; me: Side; onAgain: () => void }) {
  const iWon = (me === 'P') === !!game.won
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div className="text-6xl" aria-hidden>
        {iWon ? '🏆' : '😅'}
      </div>
      <h2 className="font-display text-2xl sm:text-3xl text-ink">
        {game.won ? '🌱 ฝ่ายผลักดันชนะ — ทำได้ตามสัญญา' : '⛔ ฝ่ายต่อต้านชนะ — คะแนนไม่ถึงเป้า'}
      </h2>
      <p className="text-ink/70">
        คะแนนรวม <b className="text-ink">{game.score}</b> จากเป้า {game.target} · เล่นไป {game.turn} ตา · {iWon ? 'คุณชนะ' : 'คุณแพ้'} (คุณเล่นฝ่าย{me === 'P' ? 'ผลักดัน' : 'ต่อต้าน'})
      </p>
      <p className="text-sm text-ink/60 max-w-md leading-relaxed">
        สิ่งที่เกมอยากให้จำ: ปัญหาต่างกันต้องใช้ทางออกต่างกัน — แพง→คิดความคุ้ม · ไม่รู้วิธี→ความรู้ · เคยชิน→ชวนกัน · ยุ่งยาก→ทำให้ง่าย · มองไม่เห็นผล→วัดผลให้เห็น
      </p>
      <div className="flex gap-2 flex-wrap justify-center">
        <Btn onClick={onAgain}>เล่นอีกครั้ง</Btn>
      </div>
    </div>
  )
}
