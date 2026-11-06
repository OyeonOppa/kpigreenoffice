import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, RotateCcw, Volume2, VolumeX } from 'lucide-react'
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
import { sfx } from '../game/sfx'

/* ฝ่าด่านลดคาร์บอน — เกมไพ่สองฝ่าย ผลักดัน vs ต่อต้าน เล่นกับบอท (#/barrier) */

interface Config {
  side: Side
  target: number
  pItem: PItem
  bItem: BItem
  hints: boolean
}

type SetGame = (f: (g: State | null) => State | null) => void

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]

export default function BarrierPage() {
  const [cfg, setCfg] = useState<Config>({ side: 'P', target: 100, pItem: 'edu', bItem: 'ad', hints: true })
  const [game, setGame] = useState<State | null>(null)
  const [muted, setMuted] = useState(sfx.muted)

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
    <div className="game-bg min-h-dvh flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2 sm:py-3 shrink-0">
        <a href="#" className="inline-flex items-center gap-1.5 text-ink/60 hover:text-ink text-sm transition-colors">
          <Home size={16} /> หน้าแรก
        </a>
        <div className="flex items-center gap-2">
          {game && (
            <button
              type="button"
              onClick={() => setGame(null)}
              className="inline-flex items-center gap-1.5 text-ink/60 hover:text-ink text-sm rounded-full px-3 py-1.5 hover:bg-ink/5"
            >
              <RotateCcw size={14} /> เริ่มใหม่
            </button>
          )}
          <button
            type="button"
            onClick={() => setMuted(sfx.toggleMute())}
            aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
            className="rounded-full p-2 text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors"
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      <div className="flex-1 px-3 sm:px-6 pb-6">
        {game ? <Board game={game} setGame={setGame} hints={cfg.hints} onAgain={start} /> : <Setup cfg={cfg} setCfg={setCfg} onStart={start} />}
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
      return { emoji: c.emoji, name: c.name, tag: 'หักแต้ม', ...RED_TONE, desc: `หักคะแนนรวม ${c.v} แต้มทันที (ฝ่ายผลักดันทิ้ง 📏 ยกเลิกได้)` }
    case 'wipe':
      return { emoji: '📉', name: 'เปลี่ยนคนทำ ไม่มีใครสานต่อ', tag: 'ล้างกระดาน', ...RED_TONE, desc: 'ทิ้งทุกมาตรการที่ไม่มี 📏 ประกบ และไม่อยู่ในหมวดที่ครบ 3 ใบ ยกเลิกไม่ได้' }
    case 'freeze':
      return { emoji: '✂️', name: 'ตัดงบกลางปี', tag: 'พิเศษ', ...RED_TONE, desc: 'ตาหน้าฝ่ายผลักดันวางการ์ดไม่ได้ และต้องทิ้งการ์ดรวม 2 ใบ' }
    case 'scatter':
      return { emoji: '🗂️', name: 'ข้อมูลกระจัดกระจาย', tag: 'พิเศษ', ...RED_TONE, desc: 'ทิ้งตัวเสริม 1 ใบบนโต๊ะ (เลือกมาตรการเอง)' }
  }
}

function GameCard({
  card,
  selected,
  onClick,
  disabled,
  big,
}: {
  card: Card
  selected?: boolean
  onClick?: () => void
  disabled?: boolean
  big?: boolean
}) {
  const d = describe(card)
  const body = (
    <>
      <span className={`font-medium rounded-full text-white leading-tight ${big ? 'text-xs px-2 py-0.5' : 'text-[10px] px-1.5 py-px'}`} style={{ background: d.color }}>
        {d.tag}
      </span>
      <span className={big ? 'text-6xl leading-none mt-1.5' : 'text-4xl leading-none mt-1'}>{d.emoji}</span>
      <span className={`font-medium text-ink text-center leading-tight ${big ? 'text-lg' : 'text-xs sm:text-sm'}`}>{d.name}</span>
      {(d.pts !== undefined || (d.icons && card.kind === 'measure')) && (
        <span className="mt-auto flex items-center gap-1 flex-wrap justify-center">
          {d.pts !== undefined && (
            <span className={`font-medium rounded-full ${big ? 'text-sm px-2' : 'text-[11px] px-1.5'}`} style={{ background: d.tint, color: d.color }}>
              {d.pts} แต้ม
            </span>
          )}
          {card.kind === 'measure' && card.icons.map((i) => <IconChip key={i} i={i} size={big ? 'md' : 'sm'} />)}
        </span>
      )}
    </>
  )
  const cls = `flex flex-col items-center gap-0.5 rounded-3xl border-[3px] p-1.5 ${big ? 'w-48 h-64 p-3 gap-2' : 'w-full h-36 sm:h-40'} ${
    selected ? 'shadow-lg ring-4' : 'shadow-sm'
  } ${disabled ? 'opacity-45' : ''}`
  const style = {
    background: d.tint,
    borderColor: selected ? d.color : `${d.color}55`,
    ['--tw-ring-color' as string]: `${d.color}33`,
  }
  const motionProps = {
    layout: true,
    initial: { opacity: 0, scale: 0.85, y: 10 },
    animate: { opacity: 1, scale: 1, y: selected ? -6 : 0 },
    exit: { opacity: 0, scale: 0.8, y: -8 },
    transition: { type: 'spring', stiffness: 420, damping: 30 } as const,
  }
  return onClick ? (
    <motion.button
      type="button"
      onClick={onClick}
      className={cls}
      style={style}
      aria-pressed={selected}
      whileHover={disabled ? undefined : { y: -6, scale: 1.04 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      {...motionProps}
    >
      {body}
    </motion.button>
  ) : (
    <motion.div className={cls} style={style} {...motionProps}>
      {body}
    </motion.div>
  )
}

function Chip({ children, tone = 'plain', title }: { children: ReactNode; tone?: 'plain' | 'green' | 'red' | 'amber'; title?: string }) {
  const t =
    tone === 'green'
      ? 'bg-green-50 border-green-300 text-green-800'
      : tone === 'red'
        ? 'bg-red-50 border-red-300 text-red-800'
        : tone === 'amber'
          ? 'bg-amber-50 border-amber-300 text-amber-900'
          : 'bg-surface border-line text-ink/80'
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs ${t}`}>
      {children}
    </span>
  )
}

/* ----------------------------------------------------------------- หน้าตั้งค่า */

function Setup({ cfg, setCfg, onStart }: { cfg: Config; setCfg: (c: Config) => void; onStart: () => void }) {
  const items = cfg.side === 'P' ? P_ITEM_IDS : B_ITEM_IDS
  const current = cfg.side === 'P' ? cfg.pItem : cfg.bItem
  const setItem = (id: PItem | BItem) => (cfg.side === 'P' ? setCfg({ ...cfg, pItem: id as PItem }) : setCfg({ ...cfg, bItem: id as BItem }))

  return (
    <div className="max-w-3xl mx-auto pop-card p-6 sm:p-9">
      <div className="text-center">
        <div className="text-6xl mb-2" aria-hidden>
          🔑⛔
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink tracking-tight">ฝ่าด่านลดคาร์บอน</h1>
        <p className="text-ink/65 mt-2">เกมไพ่สองฝ่าย ผลักดัน vs ต่อต้าน — เล่นกับบอท</p>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-3 text-ink/85 leading-relaxed">
        <div className="rounded-2xl border-2 border-green-200 bg-green-50/60 p-4">
          <b>🌱 ฝ่ายผลักดัน</b>
          <br />
          วางมาตรการลดคาร์บอนทีละใบ ถ้า <b>รอดจากด่าน</b> จะได้แต้มทุกตาไปจนจบเกม ถึงเป้าตามการ์ดสัญญาถือว่าชนะ
        </div>
        <div className="rounded-2xl border-2 border-red-200 bg-red-50/60 p-4">
          <b>⛔ ฝ่ายต่อต้าน</b>
          <br />
          เป็นตัวแทนอุปสรรคจริง วางการ์ด <b>ด่าน</b> ขวางมาตรการที่เพิ่งวาง ให้ไม่ถึงเป้า
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
        <div className="font-medium text-ink mb-2">หัวใจของเกม: ด่านแต่ละแบบ แก้ด้วยกุญแจที่ตรงกัน</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-ink/85">
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

      <div className="mt-6">
        <div className="text-sm text-ink/70 mb-2">คุณจะเล่นฝ่ายไหน</div>
        <div className="grid grid-cols-2 gap-2">
          {(['P', 'B'] as Side[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={cfg.side === s}
              onClick={() => setCfg({ ...cfg, side: s })}
              className={`pop-btn px-4 py-3 text-sm font-medium border-2 ${cfg.side === s ? 'bg-accent text-white border-accent' : 'bg-surface text-ink border-line'}`}
              style={{ ['--pop-shadow' as string]: cfg.side === s ? 'oklch(38% 0.12 152)' : 'oklch(85% 0.02 152)' }}
            >
              {s === 'P' ? '🌱 ผลักดัน (ลงมือทำ)' : '⛔ ต่อต้าน (ขวางทาง)'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-sm text-ink/70 mb-2">การ์ดสัญญา (เป้าคะแนนของฝ่ายผลักดัน)</div>
        <div className="grid sm:grid-cols-3 gap-2">
          {CONTRACTS.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={cfg.target === c.target}
              onClick={() => setCfg({ ...cfg, target: c.target })}
              className={`rounded-2xl border-2 p-3 text-left transition-all ${cfg.target === c.target ? 'border-accent bg-green-50 ring-4 ring-accent/20' : 'border-line bg-surface hover:border-accent/50'}`}
            >
              <div className="font-medium text-ink">
                {c.emoji} {c.name}
              </div>
              <div className="text-accent-deep font-medium">เป้า {c.target} แต้ม</div>
              <div className="text-xs text-ink/60">{c.note}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-sm text-ink/70 mb-2">เลือกไอเท็มถาวรเริ่มเกมของคุณ (วางแล้วอยู่ทั้งเกม ปิดไม่ได้)</div>
        <div className="grid sm:grid-cols-3 gap-2">
          {items.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={current === id}
              onClick={() => setItem(id)}
              className={`rounded-2xl border-2 p-3 text-left transition-all ${current === id ? 'border-accent bg-green-50 ring-4 ring-accent/20' : 'border-line bg-surface hover:border-accent/50'}`}
            >
              <div className="font-medium text-ink">
                {ITEM_META[id].emoji} {ITEM_META[id].name}
              </div>
              <div className="text-xs text-ink/65 leading-snug mt-0.5">{ITEM_META[id].desc}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-ink/50 mt-1.5">บอทจะสุ่มไอเท็มของตัวเอง อีก 2 ใบที่ไม่ได้เลือกจะสับเข้ากองและอาจจั่วได้ภายหลัง</p>
      </div>

      <label className="mt-5 flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={cfg.hints} onChange={(e) => setCfg({ ...cfg, hints: e.target.checked })} className="mt-1 w-5 h-5 accent-[oklch(53%_0.15_152)]" />
        <span className="text-ink/85 text-sm leading-relaxed">
          <b>โหมดช่วยจำ</b> เมื่อเลือกการ์ดจะบอกว่ากุญแจในมือแก้ด่านของใบนั้นได้ไหม (ปิดไว้ถ้าอยากเล่นแบบท้าทาย)
        </span>
      </label>

      <button type="button" onClick={onStart} className="pop-btn mt-7 w-full bg-accent text-white py-4 text-lg font-medium">
        เริ่มเล่น
      </button>
      <p className="mt-4 text-xs text-ink/50 text-center leading-relaxed">
        ต้นแบบสำหรับทดลองเล่น · ได้แรงบันดาลใจด้านโครงสร้างจากเกม Bangkok's Big Brother: เราจะทำตามสัญญา ของ iLaw ·
        ความรู้บนการ์ดเป็นหลักการทั่วไป ควรให้ผู้เชี่ยวชาญตรวจอีกครั้งก่อนเผยแพร่จริง
      </p>
    </div>
  )
}

/* ----------------------------------------------------------------- กระดานเกม */

function Board({ game, setGame, hints, onAgain }: { game: State; setGame: SetGame; hints: boolean; onAgain: () => void }) {
  const me = game.human as Side
  const a = actor(game)
  const mine = a === me && game.phase !== 'over'
  const choosing = mine && (game.phase === 'p-turn' || game.phase === 'b-respond') && !game.frozen

  // การ์ดที่เลือกไว้ — ผูกกับตา+เฟส จึงล้างเองเมื่อขึ้นตา/เฟสใหม่ ไม่ต้องใช้ effect
  const key = `${game.turn}-${game.phase}-${game.log.length}`
  const [sel, setSel] = useState<{ key: string; id: number } | null>(null)
  const selectedId = sel && sel.key === key ? sel.id : null
  const onSelect = (id: number) => setSel({ key, id })

  const hand = me === 'P' ? game.pHand : game.bHand

  const handPanel = (selectable: boolean) => (
    <HandPanel game={game} hand={hand} me={me} selectedId={selectable ? selectedId : null} onSelect={selectable ? onSelect : undefined} highlight={selectable} />
  )

  return (
    <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-4 lg:items-start">
      <div className="space-y-3 min-w-0">
        <StatusBar game={game} me={me} />
        <TableView game={game} />

        {/* จอแคบ: ถ้าถึงตาเลือกการ์ด ให้มือขึ้นมาอยู่เหนือแผงการกระทำ */}
        {choosing && <div className="lg:hidden">{handPanel(true)}</div>}

        <div className="pop-card p-4 sm:p-6 min-h-[12rem] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${game.phase}-${actor(game)}-${game.turn}-${game.pending?.kind ?? ''}-${game.frozen ? 1 : 0}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Stage game={game} me={me} hints={hints} selectedId={selectedId} setGame={setGame} onAgain={onAgain} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="rounded-2xl bg-surface/80 border border-line px-4 py-2.5 text-sm text-ink/70 leading-relaxed overflow-hidden" aria-live="polite">
          <AnimatePresence initial={false}>
            {game.log.slice(-4).map((l, i, arr) => (
              <motion.div
                key={game.log.length - arr.length + i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={i === arr.length - 1 ? 'text-ink font-medium' : ''}
              >
                {l}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!choosing && <div className="lg:hidden">{handPanel(false)}</div>}
      </div>

      <aside className="hidden lg:block sticky top-3 max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[2rem]">{handPanel(choosing)}</aside>
    </div>
  )
}

function StatusBar({ game, me }: { game: State; me: Side }) {
  const pct = Math.min(100, (game.score / game.target) * 100)
  const preview = turnScore(game, game.ctx)
  return (
    <div className="pop-card p-4">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs text-ink/60">คะแนนรวมของฝ่ายผลักดัน · เป้า {game.target}</div>
          <div className="font-display text-4xl text-ink tabular leading-none mt-1">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={game.score}
                initial={{ y: -14, opacity: 0, scale: 1.2 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 14, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 24 }}
                className="inline-block"
              >
                {game.score}
              </motion.span>
            </AnimatePresence>
            <span className="text-lg text-ink/45"> / {game.target}</span>
          </div>
        </div>
        <div className="text-right text-sm text-ink/70 leading-relaxed">
          <div>
            ตาที่ {game.turn} · กองฝ่ายผลักดันเหลือ {game.pDeck.length} ใบ
          </div>
          <div>ตานี้จะได้ +{preview} (ถ้านับตอนนี้)</div>
        </div>
      </div>
      <div className="mt-3 h-3 rounded-full bg-ink/10 overflow-hidden" role="progressbar" aria-valuenow={game.score} aria-valuemax={game.target}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct >= 100 ? '#16a34a' : 'oklch(53% 0.15 152)' }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 items-center text-xs">
        <span className="text-ink/55">ไอเท็ม:</span>
        {game.pItems.map((i, k) => (
          <Chip key={`p${k}`} tone="green" title={ITEM_META[i].desc}>
            🌱 {ITEM_META[i].emoji} {ITEM_META[i].name}
          </Chip>
        ))}
        {game.bItems.map((i, k) => (
          <Chip key={`b${k}`} tone="red" title={ITEM_META[i].desc}>
            ⛔ {ITEM_META[i].emoji} {ITEM_META[i].name}
          </Chip>
        ))}
        {game.trap && (
          <Chip tone="amber" title="ด่านคว่ำ จะเปิดเมื่อฝ่ายผลักดันวางมาตรการใบต่อไป">
            🂠 ด่านคว่ำ 1 ใบ
          </Chip>
        )}
        {game.frozen && <Chip tone="red">✂️ ตาหน้าถูกตัดงบ</Chip>}
        <span className="ml-auto text-ink/55">
          {me === 'P' ? `ฝ่ายต่อต้านถือ ${game.bHand.length} ใบ` : `ฝ่ายผลักดันถือ ${game.pHand.length} ใบ`}
        </span>
      </div>
    </div>
  )
}

/** โต๊ะของฝ่ายผลักดัน: มาตรการที่ยังรอด + ตัวเสริมที่ประกบ + ความคืบหน้าของระบบครบวงจร */
function TableView({ game }: { game: State }) {
  const counts = catCounts(game)
  const combos = comboCats(game)
  return (
    <div className="pop-card p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <div className="font-medium text-ink">🌱 โต๊ะของฝ่ายผลักดัน ({game.table.length} มาตรการที่รอด)</div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CATS) as (keyof typeof CATS)[]).map((k) => (
            <Chip key={k} tone={counts[k] >= 3 ? 'green' : 'plain'} title="มาตรการหมวดเดียวกันรอด ≥ 3 ใบ = ระบบครบวงจร +2 แต้ม/ตา">
              {CATS[k].emoji} {counts[k]}/3{counts[k] >= 3 && ' ✓ +2'}
            </Chip>
          ))}
        </div>
      </div>
      {game.table.length === 0 ? (
        <div className="text-ink/50 text-sm py-6 text-center">ยังไม่มีมาตรการบนโต๊ะ — มาตรการที่รอดจะได้แต้มทุกตา</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <AnimatePresence initial={false}>
            {game.table.map((e) => (
              <EntryTile key={e.id} e={e} isNew={e.id === game.ctx} inCombo={combos.includes(e.card.cat)} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function EntryTile({ e, isNew, inCombo }: { e: Entry; isNew: boolean; inCombo: boolean }) {
  const cat = CATS[e.card.cat]
  const shielded = e.att.some((a) => a.kind === 'meter')
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: -12 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="rounded-2xl border-2 p-2.5 text-center flex flex-col items-center gap-1"
      style={{ background: cat.tint, borderColor: isNew ? cat.color : `${cat.color}55`, boxShadow: isNew ? `0 0 0 3px ${cat.color}33` : undefined }}
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

function HandPanel({
  game,
  hand,
  me,
  selectedId,
  onSelect,
  highlight,
}: {
  game: State
  hand: Card[]
  me: Side
  selectedId: number | null
  onSelect?: (id: number) => void
  highlight: boolean
}) {
  const max = me === 'P' ? handMax(game) : 4
  return (
    <div className={`pop-card p-3 sm:p-4 ${highlight ? 'ring-4 ring-accent/30' : ''}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-medium text-ink">
          {me === 'P' ? '🌱' : '⛔'} ไพ่ในมือคุณ ({hand.length}/{max})
        </span>
      </div>
      {highlight && <p className="text-sm text-accent-deep font-medium mb-1">👇 แตะการ์ดเพื่อดูรายละเอียดและเลือกว่าจะทำอะไร</p>}
      {hand.length === 0 ? (
        <div className="text-ink/50 text-sm py-6 text-center">ไม่มีไพ่ในมือ</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-2.5 pt-2">
          <AnimatePresence initial={false}>
            {hand.map((c) => (
              <GameCard key={c.id} card={c} selected={selectedId === c.id} onClick={onSelect ? () => onSelect(c.id) : undefined} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
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
        <div className="text-ink/65 leading-relaxed">
          <p>
            แตะการ์ดในมือเพื่อเลือก: <b>มาตรการ</b> วางลงโต๊ะ · <b>ตัวเสริม (📰 📏)</b> ประกบมาตรการ · <b>ไอเท็ม</b> วางถาวร · หรือ <b>ทิ้ง 1 ใบ</b>
          </p>
          <p className="text-sm mt-2">กุญแจ (💰 📚 👥 🛠️ ⭐) วางเองไม่ได้ ถือไว้ในมือเพื่อแก้ด่านตอนถูกปิด</p>
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
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      <div className="shrink-0 mx-auto sm:mx-0">
        <GameCard card={card} big />
      </div>
      <div className="flex-1 min-w-0 w-full">
        <div className="text-lg font-medium text-ink">
          {d.emoji} {d.name}
        </div>
        <p className="text-ink/75 text-sm leading-relaxed mt-1">{d.desc}</p>
        {card.kind === 'measure' && hints && <CoverageHint game={game} card={card} />}

        <div className="mt-3 flex flex-wrap gap-2">
          {card.kind === 'measure' && <Btn onClick={() => setGame((g) => g && playMeasure(g, card.id))}>วางมาตรการนี้ลงโต๊ะ</Btn>}
          {card.kind === 'pitem' && <Btn onClick={() => setGame((g) => g && playPItem(g, card.id))}>วางไอเท็มถาวร</Btn>}
          {(card.kind === 'media' || (card.kind === 'key' && card.k === 'S')) && (
            <Btn disabled={!canAttach} onClick={() => setAttaching((v) => !v)}>
              ประกบมาตรการ (+1 แต้ม/ตา){!canAttach && ' — ต้องมีมาตรการบนโต๊ะก่อน'}
            </Btn>
          )}
          {card.kind === 'search' && <span className="text-sm text-ink/60">🔍 เล่นได้จากแถบสีเหลืองด้านบนเมื่อมีด่านคว่ำ (ฟรี ไม่เสียตา)</span>}
          {card.kind === 'key' && card.k !== 'S' && <span className="text-sm text-ink/60">กุญแจวางเองไม่ได้ ถือไว้แก้ด่าน (ทิ้งได้ถ้ามือเต็ม)</span>}
          <Btn tone="plain" onClick={() => setGame((g) => g && pDiscard(g, card.id))}>
            ทิ้งใบนี้ (นับเป็น 1 ตา)
          </Btn>
        </div>

        {attaching && canAttach && (
          <div className="mt-3">
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
        {card.kind === 'key' && card.k === 'S' && (
          <p className="text-xs text-ink/55 mt-2">📏 ใช้ได้ 2 แบบ: ถือไว้แก้ด่าน 👀 / ยกเลิกข่าวลือ หรือเอาไปประกบมาตรการ เลือกให้ดี</p>
        )}
      </div>
    </div>
  )
}

function BActions({ game, card, setGame }: { game: State; card: Card | null; setGame: SetGame }) {
  const entry = entryOf(game, game.ctx)
  const blocks = legalBlocks(game)
  const [targeting, setTargeting] = useState(false)
  const d = card ? describe(card) : null
  const targets = scatterTargets(game)

  return (
    <div>
      <Heading>ตาของคุณ (ฝ่ายต่อต้าน) — ตอบได้ 1 ใบ หรือผ่าน</Heading>
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

      {!card || !d ? (
        <p className="text-ink/65 leading-relaxed text-sm">แตะการ์ดในมือเพื่อดูรายละเอียดและเลือกเล่น หรือกด “ผ่าน” ถ้าไม่อยากเล่นการ์ดในตานี้</p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="shrink-0 mx-auto sm:mx-0">
            <GameCard card={card} big />
          </div>
          <div className="flex-1 min-w-0 w-full">
            <div className="text-lg font-medium text-ink">
              {d.emoji} {d.name}
            </div>
            <p className="text-ink/75 text-sm leading-relaxed mt-1">{d.desc}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {card.kind === 'block' && (
                <>
                  <Btn tone="red" disabled={!blocks.some((b) => b.id === card.id)} onClick={() => setGame((g) => g && bRespond(g, { t: 'block', cardId: card.id }))}>
                    ปิดมาตรการที่เพิ่งวาง
                  </Btn>
                  <Btn tone="plain" disabled={!!game.trap} onClick={() => setGame((g) => g && bRespond(g, { t: 'trap', cardId: card.id }))}>
                    ตั้งเป็นด่านคว่ำ{game.trap ? ' (มีแล้ว 1 ใบ)' : ''}
                  </Btn>
                  {entry && !blocks.some((b) => b.id === card.id) && (
                    <span className="text-xs text-ink/55 self-center">ไอคอนไม่ตรงกับมาตรการ{game.pItems.includes('board') ? ' (หรือ 📊 กันด่าน 👀)' : ''} จึงปิดไม่ได้</span>
                  )}
                </>
              )}
              {(card.kind === 'rumor' || card.kind === 'wipe' || card.kind === 'freeze') && (
                <Btn tone="red" onClick={() => setGame((g) => g && bRespond(g, { t: 'special', cardId: card.id }))}>
                  เล่นการ์ดนี้
                </Btn>
              )}
              {card.kind === 'scatter' && (
                <Btn tone="red" disabled={targets.length === 0} onClick={() => setTargeting((v) => !v)}>
                  เล่นการ์ดนี้{targets.length === 0 ? ' — ยังไม่มีตัวเสริมบนโต๊ะ' : ''}
                </Btn>
              )}
              {card.kind === 'bitem' && <Btn onClick={() => setGame((g) => g && bRespond(g, { t: 'item', cardId: card.id }))}>วางไอเท็มถาวร</Btn>}
            </div>
            {targeting && card.kind === 'scatter' && (
              <div className="mt-3 flex flex-wrap gap-2">
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
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-line">
        <Btn tone="plain" onClick={() => setGame((g) => g && bRespond(g, { t: 'pass' }))}>
          ผ่าน (ไม่เล่นการ์ดในตานี้)
        </Btn>
      </div>
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
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex gap-3 items-start mx-auto sm:mx-0">
          <div className="w-36">
            <GameCard card={p.block} />
          </div>
          <div className="text-3xl self-center">→</div>
          <div className="w-36">
            <GameCard card={entry.card} />
          </div>
        </div>
        <div className="flex-1 min-w-0 w-full">
          <p className="text-ink leading-relaxed">
            ด่าน <b>“{p.block.name}”</b> ตรงกับมาตรการ <b>{entry.card.name}</b> ที่ไอคอน{' '}
            <span className="inline-flex gap-1 align-middle">{matched.map((i) => <IconChip key={i} i={i} />)}</span>
          </p>
          <p className="text-sm text-ink/65 mt-1">
            ทิ้งกุญแจที่ตรงกันเพื่อให้การปิดไม่มีผล —{' '}
            {matched.map((i) => `${ICONS[i].emoji} ต้องใช้ ${KEYS[i].emoji}${i === 'P' && game.bItems.includes('comfort') ? ' (🛋️ ต้องใช้ ⭐ เท่านั้น)' : ''}`).join(' · ')} หรือ ⭐
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
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
        </div>
      </div>
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
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn onClick={() => setGame((g) => g && negate(g, true))}>📏 ทิ้งเพื่อยกเลิก</Btn>
        <Btn tone="plain" onClick={() => setGame((g) => g && negate(g, false))}>
          ยอมเสีย {r.v} แต้ม
        </Btn>
      </div>
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
      <div className="mt-3">
        <Btn disabled={ids.length !== need} onClick={() => setGame((g) => g && frozenDiscard(g, ids))}>
          ทิ้ง {ids.length}/{need} ใบ
        </Btn>
      </div>
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
