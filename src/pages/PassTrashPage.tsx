import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Home, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { BIN_IDS, BINS, type BinId } from '../passTrash/cards'
import {
  actor,
  binName,
  botAct,
  canPeek,
  defaultLimit,
  newGame,
  next,
  offerCard,
  pileCount,
  repass,
  respond,
  targetsFor,
  unseenCounts,
  type Card,
  type State,
} from '../passTrash/engine'
import { sfx } from '../game/sfx'

/* ส่งต่อขยะ — เกมโกหก/จับโกหก เล่นกับบอท 3–6 คน (#/pass-trash) */

interface Config {
  bots: number
  hints: boolean
}

export default function PassTrashPage() {
  const [cfg, setCfg] = useState<Config>({ bots: 2, hints: true })
  const [game, setGame] = useState<State | null>(null)
  const [muted, setMuted] = useState(sfx.muted)

  // บอทเล่นเอง (มีหน่วงเวลาให้ตามทัน) และเฉลยที่ไม่เกี่ยวกับเรา เดินต่ออัตโนมัติ
  useEffect(() => {
    if (!game || game.phase === 'over') return
    if (game.phase === 'reveal') {
      const r = game.result!
      const mine = [r.from, r.to, r.taker].some((i) => game.players[i].human)
      if (mine) return
      const t = setTimeout(() => setGame((g) => (g ? next(g) : g)), 1900)
      return () => clearTimeout(t)
    }
    const a = actor(game)
    if (a >= 0 && !game.players[a].human) {
      const t = setTimeout(() => setGame((g) => (g ? botAct(g) : g)), 900 + Math.random() * 600)
      return () => clearTimeout(t)
    }
  }, [game])

  // เสียงประกอบตอนเฉลย / จบเกม
  const phase = game?.phase
  useEffect(() => {
    if (!game) return
    if (game.phase === 'reveal' && game.result) {
      const r = game.result
      if (game.players[r.to].human) (r.correct ? sfx.correct : sfx.wrong)()
      else sfx.drop()
    }
    if (game.phase === 'over') (game.players[game.loser ?? 0].human ? sfx.wrong : sfx.fanfare)()
    // เฉพาะตอนเปลี่ยนเฟสเท่านั้น
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const start = () => setGame(newGame(cfg.bots))

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
        {game ? (
          <Board game={game} setGame={setGame} hints={cfg.hints} onAgain={start} />
        ) : (
          <Setup cfg={cfg} setCfg={setCfg} onStart={start} />
        )}
      </div>
    </div>
  )
}

/* ------------------------------------ หน้าตั้งค่า ------------------------------------ */

function Setup({ cfg, setCfg, onStart }: { cfg: Config; setCfg: (c: Config) => void; onStart: () => void }) {
  const players = cfg.bots + 1
  return (
    <div className="max-w-2xl mx-auto pop-card p-6 sm:p-9">
      <div className="text-center">
        <div className="text-6xl mb-2" aria-hidden>
          ↪️🗑️
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink tracking-tight">ส่งต่อขยะ</h1>
        <p className="text-ink/65 mt-2">เกมโกหก-จับโกหก แยกขยะให้ถูกถัง เล่นกับบอท</p>
      </div>

      <ol className="mt-6 space-y-3 text-ink/85 leading-relaxed">
        <li className="flex gap-3">
          <span className="shrink-0 w-7 h-7 rounded-full bg-accent text-white text-sm flex items-center justify-center">1</span>
          <span>ถึงตาคุณ <b>เลือกไพ่ขยะ 1 ใบ คว่ำส่งให้เพื่อน</b> พร้อมบอกว่า “ไพ่นี้ทิ้งถังไหน” จะพูดจริงหรือโกหกก็ได้</span>
        </li>
        <li className="flex gap-3">
          <span className="shrink-0 w-7 h-7 rounded-full bg-accent text-white text-sm flex items-center justify-center">2</span>
          <span>คนรับเลือก <b>เชื่อ / ไม่เชื่อ</b> หรือ <b>แอบดูแล้วส่งต่อ</b> ให้คนที่ยังไม่เคยดูไพ่ใบนั้น</span>
        </li>
        <li className="flex gap-3">
          <span className="shrink-0 w-7 h-7 rounded-full bg-accent text-white text-sm flex items-center justify-center">3</span>
          <span>
            <b>ทายถูก → คนส่งเก็บไพ่ · ทายผิด → คนรับเก็บไพ่</b> ใครมีขยะถังเดียวกันครบ {defaultLimit(players)} ใบ <b>แพ้</b>
          </span>
        </li>
      </ol>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {BIN_IDS.map((b) => (
          <div key={b} className="rounded-2xl p-3 text-center border-2" style={{ background: BINS[b].tint, borderColor: `${BINS[b].color}55` }}>
            <div className="text-2xl font-bold" style={{ color: BINS[b].color }} aria-hidden>
              {BINS[b].shape}
            </div>
            <div className="text-sm font-medium text-ink">{BINS[b].name}</div>
            <div className="text-xs text-ink/65">{BINS[b].type}</div>
          </div>
        ))}
      </div>

      <div className="mt-7">
        <div className="text-sm text-ink/70 mb-2">จำนวนผู้เล่น (คุณ + บอท)</div>
        <div className="flex gap-2 flex-wrap">
          {[2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCfg({ ...cfg, bots: n })}
              aria-pressed={cfg.bots === n}
              className={`pop-btn px-5 py-2.5 text-sm font-medium border-2 ${
                cfg.bots === n ? 'bg-accent text-white border-accent' : 'bg-surface text-ink border-line'
              }`}
              style={{ ['--pop-shadow' as string]: cfg.bots === n ? 'oklch(38% 0.12 152)' : 'oklch(85% 0.02 152)' }}
            >
              {n + 1} คน
            </button>
          ))}
        </div>
        <label className="mt-4 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={cfg.hints}
            onChange={(e) => setCfg({ ...cfg, hints: e.target.checked })}
            className="mt-1 w-5 h-5 accent-[oklch(53%_0.15_152)]"
          />
          <span className="text-ink/85 text-sm leading-relaxed">
            <b>โหมดช่วยจำ</b> แสดงถังที่ถูกต้องบนไพ่ในมือ และตัวช่วยนับไพ่ที่ยังไม่โผล่ (ปิดไว้ถ้าอยากเล่นแบบท้าทาย)
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="pop-btn mt-8 w-full bg-accent text-white py-4 text-lg font-medium"
      >
        เริ่มเล่น
      </button>
      <p className="mt-4 text-xs text-ink/50 text-center leading-relaxed">
        ต้นแบบสำหรับทดลองเล่น · แนวกลไกคล้ายเกมไพ่ Cockroach Poker · ข้อมูลการแยกขยะเป็นหลักการทั่วไป ควรตรวจกับกฎของพื้นที่ท่านอีกครั้ง
      </p>
    </div>
  )
}

/* ------------------------------------ ชิ้นส่วนไพ่ ------------------------------------ */

function ItemArt({ card, className }: { card: Card; className: string }) {
  const [failed, setFailed] = useState(false)
  const { image, emoji } = card.item
  if (!image || failed) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <span style={{ fontSize: '3rem', lineHeight: 1 }}>{emoji}</span>
      </div>
    )
  }
  return <img src={image} alt="" onError={() => setFailed(true)} className={`${className} object-contain`} />
}

function WasteCard({
  card,
  hint,
  selected,
  onClick,
  small,
  grid,
}: {
  card: Card
  hint: boolean
  selected?: boolean
  onClick?: () => void
  small?: boolean
  /** เต็มความกว้างของช่องตาราง (ใช้ในแผงไพ่ในมือ) */
  grid?: boolean
}) {
  const bin = BINS[card.item.bin]
  const body = (
    <>
      <ItemArt card={card} className={grid ? 'w-11 h-11 sm:w-12 sm:h-12' : small ? 'w-14 h-14' : 'w-16 h-16 sm:w-20 sm:h-20'} />
      <span className={`font-medium text-ink text-center leading-tight ${grid ? 'text-xs' : small ? 'text-sm' : 'text-[13px] sm:text-sm'}`}>
        {card.item.name}
      </span>
      {hint && (
        <span
          className={`mt-auto rounded-full px-2 py-0.5 font-medium ${grid ? 'text-[10px]' : 'text-[11px]'}`}
          style={{ background: bin.tint, color: bin.color, border: `1px solid ${bin.color}55` }}
        >
          {bin.shape} {bin.name}
        </span>
      )}
    </>
  )
  const cls = `shrink-0 flex flex-col items-center gap-1 rounded-2xl border-2 bg-surface ${grid ? 'p-1.5' : 'p-2'} ${
    grid ? 'w-full h-[7.4rem]' : small ? 'w-28 h-32' : 'w-[6.4rem] sm:w-28 h-36 sm:h-40'
  } transition-all ${selected ? '-translate-y-1 border-accent shadow-lg ring-4 ring-accent/25' : 'border-line shadow-sm'}`
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} hover:-translate-y-1`} aria-pressed={selected}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  )
}

function CardBack({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border-2 flex items-center justify-center text-4xl shadow-md ${className}`}
      style={{ background: 'linear-gradient(160deg,#38bdf8,#0369a1)', borderColor: '#075985' }}
      aria-label="ไพ่คว่ำ"
    >
      <span className="drop-shadow">↪️</span>
    </div>
  )
}

/** ตัวนับขยะที่เก็บไว้ แยกตามถัง — ใกล้แพ้จะเป็นสีแดงและกะพริบ */
function PileBadges({ game, who }: { game: State; who: number }) {
  const p = game.players[who]
  return (
    <div className="flex gap-1 flex-wrap" aria-label={`ขยะที่ ${p.name} เก็บไว้`}>
      {BIN_IDS.map((b) => {
        const n = pileCount(p, b)
        const risky = n >= game.limit - 1 && n > 0
        return (
          <span
            key={b}
            title={`${BINS[b].name}: ${n}/${game.limit}`}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular border ${
              risky ? 'animate-pulse' : ''
            }`}
            style={{
              background: n ? BINS[b].tint : 'transparent',
              color: n ? BINS[b].color : 'rgb(0 0 0 / 0.35)',
              borderColor: risky ? '#dc2626' : n ? `${BINS[b].color}66` : 'rgb(0 0 0 / 0.12)',
              boxShadow: risky ? '0 0 0 2px #dc262655' : undefined,
            }}
          >
            <span aria-hidden>{BINS[b].shape}</span>
            {n}
          </span>
        )
      })}
    </div>
  )
}

function PlayerChip({ game, who, active, onPick, picked }: { game: State; who: number; active: boolean; onPick?: () => void; picked?: boolean }) {
  const p = game.players[who]
  const inner = (
    <>
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>
          {p.avatar}
        </span>
        <div className="min-w-0 text-left">
          <div className="text-sm font-medium text-ink truncate">{p.name}</div>
          <div className="text-xs text-ink/60">ไพ่ในมือ {p.hand.length}</div>
        </div>
      </div>
      <div className="mt-1.5">
        <PileBadges game={game} who={who} />
      </div>
    </>
  )
  const cls = `rounded-2xl border-2 p-2.5 bg-surface text-left transition-all ${
    active ? 'border-accent shadow-md ring-2 ring-accent/20' : picked ? 'border-accent' : 'border-line'
  }`
  return onPick ? (
    <button type="button" onClick={onPick} className={`${cls} hover:border-accent`}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

/* ---------------------------------- กระดานเกม ---------------------------------- */

function Board({
  game,
  setGame,
  hints,
  onAgain,
}: {
  game: State
  setGame: (f: (g: State | null) => State | null) => void
  hints: boolean
  onAgain: () => void
}) {
  const me = game.players.findIndex((p) => p.human)
  const a = actor(game)
  const picking = game.phase === 'pick' && a === me

  // ไพ่ที่เลือกไว้ส่ง — ผูกกับ round จึงล้างเองเมื่อขึ้นตาใหม่ ไม่ต้องใช้ effect
  const [sel, setSel] = useState<{ round: number; id: number } | null>(null)
  const selectedId = sel && sel.round === game.round ? sel.id : null
  const onSelect = (id: number) => setSel({ round: game.round, id })

  return (
    <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-4 lg:items-start">
      <div className="space-y-3 min-w-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {game.players.map((p, i) =>
            i === me ? null : <PlayerChip key={p.name} game={game} who={i} active={a === i && game.phase !== 'over'} />,
          )}
        </div>

        <div className="pop-card p-4 sm:p-6 min-h-[17rem]">
          <Stage game={game} me={me} hints={hints} selectedId={selectedId} onSelect={onSelect} setGame={setGame} onAgain={onAgain} />
        </div>

        <div className="rounded-2xl bg-surface/80 border border-line px-4 py-2.5 text-sm text-ink/70 leading-relaxed" aria-live="polite">
          {game.log.slice(-3).map((l, i, arr) => (
            <div key={game.log.length - arr.length + i} className={i === arr.length - 1 ? 'text-ink font-medium' : ''}>
              {l}
            </div>
          ))}
        </div>

        {/* จอแคบ: มือของเราอยู่ใต้เวที (ตอนเลือกไพ่ จะอยู่ในขั้นที่ 1 ของเวทีแล้ว จึงไม่แสดงซ้ำ) */}
        {!picking && (
          <div className="lg:hidden">
            <HandPanel game={game} me={me} hints={hints} />
          </div>
        )}
      </div>

      {/* จอกว้าง: มือของเราเป็นแผงด้านข้าง เห็นครบทุกใบโดยไม่ต้องเลื่อน */}
      <aside className="hidden lg:block sticky top-3 max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[2rem]">
        <HandPanel game={game} me={me} hints={hints} selectedId={selectedId} onSelect={picking ? onSelect : undefined} highlight={picking} />
      </aside>
    </div>
  )
}

/** แผงไพ่ในมือ: หัวข้อ + ตัวนับขยะที่เก็บ + ไพ่ทั้งหมดแบบตาราง (ห่อบรรทัด ไม่ต้องเลื่อน) */
function HandPanel({
  game,
  me,
  hints,
  selectedId,
  onSelect,
  highlight,
}: {
  game: State
  me: number
  hints: boolean
  selectedId?: number | null
  onSelect?: (id: number) => void
  highlight?: boolean
}) {
  return (
    <div className={`pop-card p-3 sm:p-4 ${highlight ? 'ring-4 ring-accent/30' : ''}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>
            {game.players[me].avatar}
          </span>
          <span className="font-medium text-ink">ไพ่ในมือคุณ ({game.players[me].hand.length})</span>
        </div>
        <PileBadges game={game} who={me} />
      </div>
      {highlight && <p className="text-sm text-accent-deep font-medium mb-1">👇 แตะไพ่ 1 ใบที่จะส่ง</p>}
      <HandGrid game={game} me={me} hints={hints} selectedId={selectedId ?? null} onSelect={onSelect} />
    </div>
  )
}

/** ไพ่ในมือเป็นตาราง — โหมดช่วยจำจัดเรียงตามถัง เพื่อเห็นภาพรวมว่ามีของถังไหนกี่ใบ */
function HandGrid({
  game,
  me,
  hints,
  selectedId,
  onSelect,
}: {
  game: State
  me: number
  hints: boolean
  selectedId: number | null
  onSelect?: (id: number) => void
}) {
  const hand = game.players[me].hand
  const cards = hints ? [...hand].sort((x, y) => BIN_IDS.indexOf(x.item.bin) - BIN_IDS.indexOf(y.item.bin)) : hand
  if (cards.length === 0) return <div className="text-ink/50 text-sm py-6 text-center">ไม่มีไพ่ในมือแล้ว</div>
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2 pt-2">
      {cards.map((c) => (
        <WasteCard
          key={c.id}
          card={c}
          hint={hints}
          grid
          selected={selectedId === c.id}
          onClick={onSelect ? () => onSelect(c.id) : undefined}
        />
      ))}
    </div>
  )
}

/* ----------------------------------- เวทีกลาง ----------------------------------- */

function Stage({
  game,
  me,
  hints,
  selectedId,
  onSelect,
  setGame,
  onAgain,
}: {
  game: State
  me: number
  hints: boolean
  selectedId: number | null
  onSelect: (id: number) => void
  setGame: (f: (g: State | null) => State | null) => void
  onAgain: () => void
}) {
  const a = actor(game)
  const name = (i: number) => game.players[i].name

  if (game.phase === 'over') return <Over game={game} me={me} onAgain={onAgain} />

  if (game.phase === 'reveal' && game.result) {
    return <Reveal game={game} me={me} setGame={setGame} />
  }

  // ตาของเราเลือกไพ่ที่จะส่ง
  if (game.phase === 'pick' && a === me) {
    return <Compose key={`pick-${game.round}`} game={game} me={me} hints={hints} mode="pick" selectedId={selectedId} onSelect={onSelect} setGame={setGame} />
  }

  // เรากำลังตัดสินใจ
  if (game.phase === 'respond' && a === me) {
    return <Decide game={game} me={me} hints={hints} setGame={setGame} />
  }

  // เราแอบดูไพ่แล้ว กำลังจะส่งต่อ
  if (game.phase === 'repick' && a === me) {
    return <Compose key={`repick-${game.round}-${game.offer!.seen.length}`} game={game} me={me} hints={hints} mode="repick" selectedId={null} onSelect={onSelect} setGame={setGame} />
  }

  // คนอื่นกำลังเล่น
  const o = game.offer
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 min-h-[14rem]">
      {o ? (
        <>
          <motion.div initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <CardBack className="w-20 h-28" />
          </motion.div>
          <p className="text-ink text-lg">
            <b>{name(o.from)}</b> ส่งไพ่คว่ำให้ <b>{name(o.to)}</b>
          </p>
          <ClaimBubble claim={o.claim} />
          <p className="text-ink/55 text-sm">{name(o.to)} กำลังคิด…</p>
        </>
      ) : (
        <>
          <div className="text-5xl animate-pulse" aria-hidden>
            🤔
          </div>
          <p className="text-ink text-lg">
            ตาของ <b>{name(game.starter)}</b> กำลังเลือกไพ่…
          </p>
        </>
      )}
    </div>
  )
}

function ClaimBubble({ claim }: { claim: BinId }) {
  const b = BINS[claim]
  return (
    <div
      className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-lg border-2"
      style={{ background: b.tint, color: b.color, borderColor: `${b.color}66` }}
    >
      <span aria-hidden>💬</span> “นี่คือขยะ {b.shape} {b.name}”
    </div>
  )
}

/** เราเป็นผู้รับ: เชื่อ / ไม่เชื่อ / แอบดูแล้วส่งต่อ */
function Decide({ game, me, hints, setGame }: { game: State; me: number; hints: boolean; setGame: (f: (g: State | null) => State | null) => void }) {
  const o = game.offer!
  const peekOk = canPeek(game)
  const unseen = unseenCounts(game, me)
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div className="text-ink/60 text-sm">
        {o.seen.length > 1 ? 'ไพ่ถูกส่งต่อมาถึงคุณ' : 'ถึงตาคุณตัดสินใจ'}
      </div>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <CardBack className="w-20 h-28" />
      </motion.div>
      <p className="text-ink text-lg">
        <b>{game.players[o.from].name}</b> ส่งไพ่คว่ำมาให้คุณ
      </p>
      <ClaimBubble claim={o.claim} />
      <p className="text-ink font-medium">คุณคิดว่า…</p>
      <div className="grid sm:grid-cols-3 gap-2 w-full max-w-xl">
        <button
          type="button"
          onClick={() => setGame((g) => g && respond(g, 'true'))}
          className="pop-btn bg-accent text-white py-3 px-4 font-medium"
        >
          ✅ จริง
          <span className="block text-xs font-normal opacity-90">เชื่อว่าไพ่นี้ใช่ {BINS[o.claim].name}</span>
        </button>
        <button
          type="button"
          onClick={() => setGame((g) => g && respond(g, 'false'))}
          className="pop-btn py-3 px-4 font-medium text-white"
          style={{ background: '#dc2626', ['--pop-shadow' as string]: '#991b1b' }}
        >
          ❌ โกหก
          <span className="block text-xs font-normal opacity-90">ไม่ใช่ {BINS[o.claim].name} แน่</span>
        </button>
        <button
          type="button"
          disabled={!peekOk}
          onClick={() => setGame((g) => g && respond(g, 'peek'))}
          className="pop-btn py-3 px-4 font-medium bg-surface text-ink border-2 border-line disabled:opacity-40"
          style={{ ['--pop-shadow' as string]: 'oklch(85% 0.02 152)' }}
        >
          <Eye className="inline -mt-0.5" size={16} /> ดูแล้วส่งต่อ
          <span className="block text-xs font-normal text-ink/60">{peekOk ? 'แล้วต้องส่งให้คนอื่นทายแทน' : 'ไม่มีใครเหลือให้ส่งต่อแล้ว'}</span>
        </button>
      </div>
      {hints && <UnseenPanel unseen={unseen} />}
    </div>
  )
}

/** ตัวช่วยนับไพ่: แต่ละถังยังมีไพ่ที่ยังไม่โผล่อีกกี่ใบ (ไพ่ที่เก็บแล้วและไพ่ในมือเราไม่นับ) */
function UnseenPanel({ unseen }: { unseen: Record<BinId, number> }) {
  return (
    <div className="mt-1 text-xs text-ink/65">
      <div className="mb-1">ช่วยนับไพ่ — ที่ยังไม่โผล่ (รวมไพ่ในมือคนอื่นและใบนี้):</div>
      <div className="flex gap-1.5 justify-center flex-wrap">
        {BIN_IDS.map((b) => (
          <span key={b} className="rounded-full px-2 py-0.5 border" style={{ background: BINS[b].tint, color: BINS[b].color, borderColor: `${BINS[b].color}55` }}>
            {BINS[b].shape} {BINS[b].name} {unseen[b]}
          </span>
        ))}
      </div>
    </div>
  )
}

/** ตาเราส่งไพ่ (pick) หรือส่งต่อไพ่ที่แอบดู (repick): เลือกไพ่ → คนรับ → ถังที่จะบอก */
function Compose({
  game,
  me,
  hints,
  mode,
  selectedId,
  onSelect,
  setGame,
}: {
  game: State
  me: number
  hints: boolean
  mode: 'pick' | 'repick'
  selectedId: number | null
  onSelect: (id: number) => void
  setGame: (f: (g: State | null) => State | null) => void
}) {
  const cardId = mode === 'repick' ? game.offer!.card.id : selectedId
  const [to, setTo] = useState<number | null>(null)
  const [claim, setClaim] = useState<BinId | null>(null)
  const targets = targetsFor(game)
  const card = mode === 'repick' ? game.offer!.card : game.players[me].hand.find((c) => c.id === cardId) ?? null
  const ready = cardId !== null && to !== null && claim !== null

  const send = () => {
    if (!ready) return
    if (mode === 'pick') setGame((g) => g && offerCard(g, cardId!, to!, claim!))
    else setGame((g) => g && repass(g, to!, claim!))
    sfx.drop()
  }

  return (
    <div className="space-y-4">
      {mode === 'repick' && game.offer && (
        <div className="rounded-2xl p-3 border-2 flex items-center gap-3" style={{ background: BINS[game.offer.card.item.bin].tint, borderColor: `${BINS[game.offer.card.item.bin].color}66` }}>
          <WasteCard card={game.offer.card} hint small />
          <div className="text-sm text-ink leading-relaxed">
            <div className="font-medium text-base">คุณแอบดูแล้ว: {game.offer.card.item.name}</div>
            ไพ่ใบนี้คือ <b>{binName(game.offer.card.item.bin)}</b>
            <br />
            เลือกคนที่จะส่งต่อ แล้วจะบอกความจริงหรือโกหกก็ได้ <span className="text-ink/60">(ถ้าเขาทายถูก คุณต้องเก็บไพ่ใบนี้)</span>
          </div>
        </div>
      )}

      {mode === 'pick' && (
        <div>
          <Step n={1} done={cardId !== null}>
            เลือกไพ่ในมือที่จะส่ง
          </Step>
          {/* จอกว้าง: เลือกจากแผงไพ่ด้านขวา · จอแคบ: เลือกจากตารางตรงนี้ */}
          <p className="hidden lg:block text-sm text-ink/60 mt-1">
            {card ? (
              <>
                เลือกแล้ว: <b className="text-ink">{card.item.emoji} {card.item.name}</b> (เปลี่ยนได้ที่แผงไพ่ด้านขวา)
              </>
            ) : (
              'แตะไพ่ในแผง “ไพ่ในมือคุณ” ทางขวา →'
            )}
          </p>
          <div className="lg:hidden">
            <HandGrid game={game} me={me} hints={hints} selectedId={cardId} onSelect={onSelect} />
          </div>
        </div>
      )}

      <div>
        <Step n={mode === 'pick' ? 2 : 1} done={to !== null}>
          ส่งให้ใคร
        </Step>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {targets.map((i) => (
            <PlayerChip key={i} game={game} who={i} active={false} picked={to === i} onPick={() => setTo(i)} />
          ))}
        </div>
      </div>

      <div>
        <Step n={mode === 'pick' ? 3 : 2} done={claim !== null}>
          บอกเขาว่า “ไพ่นี้ทิ้งถังไหน” <span className="text-ink/55 font-normal">(จริงหรือโกหกก็ได้)</span>
        </Step>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {BIN_IDS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setClaim(b)}
              aria-pressed={claim === b}
              className={`rounded-2xl border-2 p-2.5 text-center transition-all ${claim === b ? 'ring-4 -translate-y-0.5' : 'hover:-translate-y-0.5'}`}
              style={{
                background: BINS[b].tint,
                borderColor: claim === b ? BINS[b].color : `${BINS[b].color}44`,
                ['--tw-ring-color' as string]: `${BINS[b].color}44`,
              }}
            >
              <div className="text-2xl font-bold" style={{ color: BINS[b].color }} aria-hidden>
                {BINS[b].shape}
              </div>
              <div className="text-sm font-medium text-ink">{BINS[b].name}</div>
              <div className="text-xs text-ink/65">{BINS[b].type}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          disabled={!ready}
          onClick={send}
          className="pop-btn bg-accent text-white px-8 py-3 font-medium disabled:opacity-40"
        >
          {mode === 'pick' ? 'ส่งไพ่' : 'ส่งต่อ'}
        </button>
        {ready && card && (
          <span className="text-sm text-ink/70">
            {card.item.name} → {game.players[to!].name} · บอกว่า {binName(claim!)}
            {card.item.bin === claim ? ' (พูดจริง)' : ' (โกหก)'}
          </span>
        )}
      </div>
    </div>
  )
}

function Step({ n, done, children }: { n: number; done: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 font-medium text-ink">
      <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${done ? 'bg-accent text-white' : 'bg-ink/10 text-ink/60'}`}>
        {done ? '✓' : n}
      </span>
      <span>{children}</span>
    </div>
  )
}

/** เฉลยไพ่ + ผล */
function Reveal({ game, me, setGame }: { game: State; me: number; setGame: (f: (g: State | null) => State | null) => void }) {
  const r = game.result!
  const actual = BINS[r.card.item.bin]
  const claimBin = BINS[r.claim]
  const nm = (i: number) => (i === me ? 'คุณ' : game.players[i].name)
  const takerLoses = game.loser !== null && game.loser === r.taker

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center gap-3">
      <motion.div initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ duration: 0.4 }}>
        <WasteCard card={r.card} hint />
      </motion.div>
      <p className="text-ink">
        {nm(r.from)} บอกว่า <b style={{ color: claimBin.color }}>{binName(r.claim)}</b> →{' '}
        {r.claimTrue ? (
          <b className="text-accent-deep">พูดจริง ✅</b>
        ) : (
          <b className="text-red-600">โกหก ❌ ไพ่นี้คือ {binName(r.card.item.bin)}</b>
        )}
      </p>
      <p className="text-ink">
        {nm(r.to)} ทายว่า<b>{r.guess === 'true' ? 'จริง' : 'โกหก'}</b> → {r.correct ? 'ถูก 🎉' : 'ผิด 😅'}
      </p>
      <div
        className="rounded-2xl px-4 py-2 border-2 font-medium"
        style={{ background: actual.tint, color: actual.color, borderColor: `${actual.color}66` }}
      >
        {nm(r.taker)}เก็บไพ่ใบนี้ ({binName(r.card.item.bin)})
        {takerLoses && ` — ครบ ${game.limit} ใบ แพ้!`}
      </div>
      <p className="text-sm text-ink/70 max-w-md leading-relaxed">
        <b>รู้ไหม:</b> {r.card.item.why}
      </p>
      {[r.from, r.to, r.taker].some((i) => i === me) ? (
        <button
          type="button"
          onClick={() => setGame((g) => g && next(g))}
          className="pop-btn bg-accent text-white px-8 py-3 font-medium"
        >
          {game.loser !== null ? 'ดูผล' : 'ต่อไป'}
        </button>
      ) : (
        <p className="text-xs text-ink/50">กำลังไปตาถัดไป…</p>
      )}
    </motion.div>
  )
}

function Over({ game, me, onAgain }: { game: State; me: number; onAgain: () => void }) {
  const loser = game.loser ?? 0
  const iLost = loser === me
  return (
    <div className="flex flex-col items-center text-center gap-4">
      <div className="text-6xl" aria-hidden>
        {iLost ? '🗑️' : '🏆'}
      </div>
      <h2 className="font-display text-2xl sm:text-3xl text-ink">
        {iLost ? 'คุณแพ้ — เก็บขยะไว้เยอะเกินไป' : `${game.players[loser].name} เก็บขยะเยอะเกินไป คุณชนะ!`}
      </h2>
      <p className="text-ink/65 text-sm">
        {game.overReason === 'limit'
          ? `มีขยะถังเดียวกันครบ ${game.limit} ใบ`
          : 'ไพ่ในมือหมด จึงดูผู้ที่มีขยะถังเดียวกันมากที่สุด'}
      </p>
      <div className="w-full max-w-md space-y-2">
        {game.players.map((p, i) => (
          <div
            key={p.name}
            className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2 ${i === loser ? 'border-red-400 bg-red-50' : 'border-line bg-surface'}`}
          >
            <span className="text-2xl" aria-hidden>
              {p.avatar}
            </span>
            <span className="font-medium text-ink flex-1 text-left truncate">
              {i === me ? 'คุณ' : p.name}
              {i === loser && <span className="ml-2 text-xs text-red-600">แพ้</span>}
            </span>
            <PileBadges game={game} who={i} />
          </div>
        ))}
      </div>
      <button type="button" onClick={onAgain} className="pop-btn bg-accent text-white px-8 py-3 font-medium">
        เล่นอีกครั้ง
      </button>
    </div>
  )
}

