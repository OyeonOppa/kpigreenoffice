import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { Home, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { BINS, BIN_IDS, BUFF_BY_KEY, DEF_BY_KEY, PRANK_BY_KEY, type Card } from '../throwTrash/cards'
import {
  WIN_TARGET,
  botStep,
  catchEligible,
  discardExtra,
  endTurn,
  needsBot,
  netLeaves,
  newGame,
  playBuff,
  playPrank,
  resolveCatch,
  resolveDefend,
  sortWaste,
  throwWaste,
  type Player,
  type State,
} from '../throwTrash/engine'
import { sfx } from '../game/sfx'

/* โยนขยะ! — เกมการ์ดปาร์ตี้แยกขยะ 4 สี เล่นกับบอท 1–5 ตัว (#/throw-trash) */

type SetGame = (f: (g: State | null) => State | null) => void

function wasteLabel(c: Card): string {
  return c.kind === 'waste' ? `${c.emoji} ${c.name}` : ''
}

interface Face {
  emoji: string
  name: string
  tag: string
  big?: string
  desc?: string
  color: string
  tint: string
}

function faceOf(card: Card): Face {
  if (card.kind === 'waste') {
    const b = BINS[card.bin]
    return { emoji: card.emoji, name: card.name, tag: 'ขยะ', big: `${b.shape} ${b.name}`, desc: `ทิ้งถัง: ${b.hint}`, color: '#6b7a70', tint: '#ffffff' }
  }
  if (card.kind === 'bin') {
    const b = BINS[card.bin]
    return { emoji: b.shape, name: b.name, tag: 'ถัง', big: b.hint, color: b.c, tint: b.t }
  }
  if (card.kind === 'buff') {
    const b = BUFF_BY_KEY[card.key]
    return { emoji: b.emoji, name: b.name, tag: 'บัฟ', big: `+${b.leaves} 🍃`, desc: b.desc, color: '#16a34a', tint: '#eafbee' }
  }
  if (card.kind === 'prank') {
    const p = PRANK_BY_KEY[card.key]
    return { emoji: p.emoji, name: p.name, tag: 'แกล้ง', big: p.big, desc: p.desc, color: '#e4573d', tint: '#ffede9' }
  }
  const d = DEF_BY_KEY[card.key]
  return { emoji: d.emoji, name: d.name, tag: 'ป้องกัน', big: d.big, desc: d.desc, color: '#0284c7', tint: '#e6f6fe' }
}

/** ขนาดตัวอักษรตามปริมาณข้อความ — สูตรเดียวกับการ์ดเกมอื่นในเว็บนี้ */
function sizeClass(desc = ''): string {
  return desc.length > 90 ? 'pc-tight' : desc.length > 55 ? 'pc-mid' : 'pc-roomy'
}

const SIZE_W: Record<'sm' | 'md' | 'lg', string> = { sm: 'w-36', md: 'w-32 sm:w-40', lg: 'w-40 sm:w-48' }

/** การ์ดแบบสั้น (ไม่ใช้สัดส่วนโปสการ์ด) — ไว้โชว์บ้าน/โซนบัฟของคนอื่นแบบไม่กินพื้นที่สูง */
function MiniCard({ card }: { card: Card }) {
  const f = faceOf(card)
  return (
    <div className="flex items-center gap-1.5 rounded-lg border-2 pl-1.5 pr-2.5 py-1 shadow-sm shrink-0 whitespace-nowrap" style={{ borderColor: f.color, background: f.tint }}>
      <span className="text-lg leading-none">{f.emoji}</span>
      <span className="text-xs font-medium text-ink leading-tight">{f.name}</span>
    </div>
  )
}

/** แถวการ์ดสั้นที่วางซ้อนกันเมื่อมีหลายใบ (เห็นขอบทุกใบ แต่ไม่กินที่เป็นเส้นตรงยาว) */
function MiniStack({ cards }: { cards: Card[] }) {
  if (!cards.length) return <span className="text-xs text-ink/40">— ว่าง —</span>
  return (
    <div className="flex flex-wrap gap-y-1.5">
      {cards.map((c, i) => (
        <div key={c.id} style={{ marginLeft: i === 0 ? 0 : -16, zIndex: i }} className="relative hover:z-50 hover:!ml-0 transition-[margin]">
          <MiniCard card={c} />
        </div>
      ))}
    </div>
  )
}

function PrintCard({ card, selected, onClick, size = 'md' }: { card: Card; selected?: boolean; onClick?: () => void; size?: 'sm' | 'md' | 'lg' }) {
  const f = faceOf(card)
  const style = { ['--c' as string]: f.color, ['--t' as string]: f.tint }
  const body = (
    <div className="pc" style={style}>
      <div className={`pc-in ${sizeClass(f.desc)}`}>
        <span className="pc-tag">{f.tag}</span>
        <div className="pc-emoji">{f.emoji}</div>
        <div className="pc-name">{f.name}</div>
        {f.big && <div className="pc-big">{f.big}</div>}
        {f.desc && <div className="pc-desc">{f.desc}</div>}
      </div>
    </div>
  )
  const cls = `${SIZE_W[size]} shrink-0 transition-transform ${selected ? '-translate-y-1 drop-shadow-lg' : ''}`
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} hover:-translate-y-1`}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  )
}

export default function ThrowTrashPage() {
  const [bots, setBots] = useState(3)
  const [game, setGame] = useState<State | null>(null)
  const [muted, setMuted] = useState(sfx.muted)

  // บอทเดินเอง + ให้มีดีเลย์ให้รู้สึกเหมือนคนคิด
  useEffect(() => {
    if (!game || !needsBot(game)) return
    const t = setTimeout(() => setGame((g) => (g ? botStep(g) : g)), 700 + Math.random() * 700)
    return () => clearTimeout(t)
  }, [game])

  const start = () => setGame(newGame(bots))

  return (
    <div className={`game-bg min-h-dvh flex flex-col ${game ? 'xl:h-dvh xl:overflow-hidden' : ''}`}>
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2 sm:py-3 shrink-0">
        <a href="#" className="inline-flex items-center gap-1.5 text-ink/60 hover:text-ink text-sm transition-colors">
          <Home size={16} /> หน้าแรก
        </a>
        <div className="flex items-center gap-2">
          {game && (
            <button type="button" onClick={() => setGame(null)} className="inline-flex items-center gap-1.5 text-ink/60 hover:text-ink text-sm rounded-full px-3 py-1.5 hover:bg-ink/5">
              <RotateCcw size={14} /> เริ่มใหม่
            </button>
          )}
          <button type="button" onClick={() => setMuted(sfx.toggleMute())} aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'} className="rounded-full p-2 text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors">
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>
      <div className={`flex-1 px-3 sm:px-6 pb-8 ${game ? 'xl:min-h-0 xl:pb-3' : ''}`}>
        {game ? <Board game={game} setGame={setGame} onAgain={start} /> : <Setup bots={bots} setBots={setBots} onStart={start} />}
      </div>
    </div>
  )
}

function Setup({ bots, setBots, onStart }: { bots: number; setBots: (n: number) => void; onStart: () => void }) {
  return (
    <div className="max-w-2xl mx-auto pop-card p-6 sm:p-9">
      <div className="text-center">
        <div className="text-6xl mb-2" aria-hidden>
          🗑️
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink tracking-tight">โยนขยะ!</h1>
        <p className="text-ink/65 mt-2">เกมการ์ดปาร์ตี้แยกขยะ 4 สี — เล่นกับบอท</p>
      </div>

      <ol className="mt-6 space-y-3 text-ink/85 leading-relaxed">
        {[
          <>
            แต่ละคนมี <b>บ้าน</b> (ขยะที่ค้างอยู่) กับ <b>โซนบัฟ</b> (การ์ดบัฟที่ลงแล้ว) — <b>ใบไม้สุทธิ = ใบไม้จากบัฟ − ขยะที่ค้างบ้าน</b>
          </>,
          <>
            ใครมีใบไม้สุทธิ ≥ <b>{WIN_TARGET}</b> ตอนจบตาตัวเองก่อน ชนะ
          </>,
          <>
            ทุกตาจั่ว 1 ใบ แล้วทำได้ <b>2 การกระทำ</b>: ลงบัฟ / แยกขยะ / โยนขยะใส่คนอื่น / เล่นการ์ดแกล้ง
          </>,
          <>
            แยกขยะ<b>ผิดถัง</b>เปิดช่วง <b>"✋ จับผิด!"</b> — ใครกดทันได้การ์ดถังไปวางโซนบัฟ (+1 🍃)
          </>,
        ].map((t, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-accent text-white text-sm flex items-center justify-center">{i + 1}</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {BIN_IDS.map((b) => (
          <div key={b} className="rounded-xl p-2 text-center text-white" style={{ background: BINS[b].c }}>
            <div className="text-xl">{BINS[b].shape}</div>
            <div className="font-medium text-sm">{BINS[b].name}</div>
            <div className="text-[11px] opacity-90">{BINS[b].hint}</div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="text-sm text-ink/70 mb-2 text-center">จำนวนบอท (รวมคุณ {bots + 1} คน)</div>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setBots(n)} className={`w-10 h-10 rounded-full border-2 font-medium ${bots === n ? 'border-accent bg-accent text-white' : 'border-line bg-surface text-ink'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <button type="button" onClick={onStart} className="pop-btn mt-7 w-full bg-accent text-white py-4 text-lg font-medium">
        เริ่มเล่น
      </button>
      <p className="mt-4 text-xs text-ink/50 text-center leading-relaxed">
        ต้นแบบสำหรับทดลองเล่น · เนื้อหาเป็นหลักการทั่วไป ควรให้ผู้เชี่ยวชาญตรวจอีกครั้งก่อนเผยแพร่จริง
      </p>
    </div>
  )
}

/* ----------------------------------------------------------------- กระดาน */

type Sel =
  | null
  | { kind: 'buff'; card: Extract<Card, { kind: 'buff' }> }
  | { kind: 'bin'; card: Extract<Card, { kind: 'bin' }> }
  | { kind: 'waste'; card: Extract<Card, { kind: 'waste' }> }
  | { kind: 'prank'; card: Extract<Card, { kind: 'prank' }> }

function Board({ game, setGame, onAgain }: { game: State; setGame: SetGame; onAgain: () => void }) {
  const myTurn = game.turn === 0 && !game.pending && !game.mustDiscard
  const [sel, setSel] = useState<Sel>(null)
  const [windSrc, setWindSrc] = useState<{ owner: number; cardId: number } | null>(null)

  useEffect(() => setSel(null), [game.turn, game.actionsLeft])

  // เหตุการณ์ล่าสุดเลื่อนอยู่ในกรอบของมันเอง และเลื่อนลงล่างสุดอัตโนมัติ
  const logRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [game.log.length])

  if (game.phase === 'over') return <Over game={game} onAgain={onAgain} />

  return (
    <div className="max-w-[110rem] mx-auto xl:h-full xl:grid xl:grid-cols-[minmax(0,1fr)_37rem] xl:gap-5">
      <div className="space-y-4 min-w-0 xl:min-h-0 xl:flex xl:flex-col xl:gap-3 xl:space-y-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 xl:flex-1 xl:min-h-0 xl:overflow-y-auto xl:content-start">
          {game.players.map((p, i) => (
            <PlayerPanel key={p.name + i} p={p} isTurn={i === game.turn} isMe={i === 0} />
          ))}
        </div>

        <div className="pop-card p-4 sm:p-5 xl:py-3 flex items-center justify-between flex-wrap gap-2 text-base xl:shrink-0">
          <span className="text-ink/70">
            กองจั่วเหลือ {game.deck.length} ใบ · กองทิ้ง {game.discard.length} ใบ
          </span>
          {game.turn === 0 && !game.pending && !game.mustDiscard && (
            <span className="flex items-center gap-1.5">
              สิทธิ์เหลือ
              {[0, 1].map((i) => (
                <span key={i} className={`w-4 h-4 rounded-full ${i < game.actionsLeft ? 'bg-accent' : 'bg-ink/15'}`} />
              ))}
            </span>
          )}
        </div>

        {game.pending?.kind === 'catch' && <CatchBanner game={game} setGame={setGame} />}
        {game.pending?.kind === 'defend' && game.pending.victim === 0 && <DefendPrompt game={game} setGame={setGame} />}
        {game.mustDiscard > 0 && <DiscardExtraPanel game={game} setGame={setGame} />}

        {!myTurn && !game.pending && !game.mustDiscard && (
          <div className="pop-card p-8 xl:p-4 text-center text-ink/65 text-lg xl:shrink-0">
            {game.players[game.turn].avatar} {game.players[game.turn].name} กำลังเล่น…
          </div>
        )}

        <div ref={logRef} className="rounded-2xl bg-surface/80 border border-line px-5 py-4 text-base text-ink/70 leading-relaxed space-y-0.5 xl:shrink-0 xl:max-h-44 xl:overflow-y-auto xl:py-3" aria-live="polite">
          <div className="text-sm font-medium text-ink/50 mb-1.5">เหตุการณ์ล่าสุด</div>
          {game.log.slice(-12).map((l, i, arr) => (
            <div key={game.log.length - arr.length + i} className={i === arr.length - 1 ? 'text-ink font-medium' : ''}>
              {l}
            </div>
          ))}
        </div>
      </div>

      <aside className="hidden xl:block xl:min-h-0 xl:h-full overflow-y-auto rounded-[2rem]">
        {myTurn && !game.pending && !game.mustDiscard ? (
          <MyPanel game={game} setGame={setGame} sel={sel} setSel={setSel} windSrc={windSrc} setWindSrc={setWindSrc} />
        ) : (
          <div className="pop-card p-8 text-center text-ink/55 text-base">รอจนกว่าจะถึงตาคุณ…</div>
        )}
      </aside>

      {myTurn && !game.pending && !game.mustDiscard && (
        <div className="xl:hidden mt-4">
          <MyPanel game={game} setGame={setGame} sel={sel} setSel={setSel} windSrc={windSrc} setWindSrc={setWindSrc} />
        </div>
      )}
    </div>
  )
}

function MyPanel({
  game,
  setGame,
  sel,
  setSel,
  windSrc,
  setWindSrc,
}: {
  game: State
  setGame: SetGame
  sel: Sel
  setSel: Dispatch<SetStateAction<Sel>>
  windSrc: { owner: number; cardId: number } | null
  setWindSrc: (v: { owner: number; cardId: number } | null) => void
}) {
  const me = game.players[0]
  // เลือกการ์ดแล้ว แผงการกระทำอยู่ล่างสุด — เลื่อนให้เห็นเองจะได้ไม่ต้องหาปุ่ม
  const actionRef = useRef<HTMLDivElement>(null)
  const selId = sel?.card.id
  useEffect(() => {
    if (selId !== undefined) actionRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selId])
  return (
    <div className="pop-card p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-base text-ink/70">
          🏠 บ้านคุณ ({me.home.length} ใบ) · 🍃 โซนบัฟ ({me.buffs.length} ใบ) · ใบไม้สุทธิ <b className="text-ink">{netLeaves(me)}</b>
        </div>
        {game.actionsLeft === 0 ? (
          <button type="button" onClick={() => setGame((g) => g && endTurn(g))} className="pop-btn bg-accent text-white px-5 py-2 text-base font-medium animate-pulse">
            จบตา →
          </button>
        ) : (
          <button type="button" onClick={() => setGame((g) => g && endTurn(g))} className="text-sm text-ink/50 hover:text-ink underline">
            จบตาก่อนเวลา
          </button>
        )}
      </div>

      {me.home.length > 0 && (
        <div>
          <div className="text-sm text-ink/55 mb-1.5">🏠 ขยะในบ้านคุณ ({me.home.length} ใบ) — แตะเพื่อใช้ตอนแยกขยะ/ซ่อมแทนซื้อใหม่</div>
          <div className="grid grid-cols-3 gap-2.5">
            {me.home.map((c) => (
              <HomeWasteButton key={c.id} card={c as Extract<Card, { kind: 'waste' }>} sel={sel} setSel={setSel} setGame={setGame} />
            ))}
          </div>
        </div>
      )}

      {me.buffs.length > 0 && (
        <div>
          <div className="text-sm text-ink/55 mb-1.5">🍃 โซนบัฟของคุณ ({me.buffs.length} ใบ)</div>
          <MiniStack cards={me.buffs} />
        </div>
      )}

      <div>
        <div className="text-sm text-ink/55 mb-1.5">การ์ดในมือคุณ ({me.hand.length}/7) — แตะเพื่อเลือก</div>
        <div className="grid grid-cols-3 gap-2.5">
          {me.hand.map((c) => (
            <PrintCard
              key={c.id}
              card={c}
              size="sm"
              selected={sel !== null && sel.card.id === c.id}
              onClick={() => {
                if (c.kind === 'def') return
                if (game.actionsLeft < 1 && !windSrc) return
                setSel((s) => (s && s.card.id === c.id ? null : (c.kind === 'buff' || c.kind === 'bin' || c.kind === 'waste' || c.kind === 'prank' ? { kind: c.kind, card: c as never } : null)))
              }}
            />
          ))}
        </div>
      </div>

      {sel && (
        <div ref={actionRef}>
          <ActionPanel game={game} setGame={setGame} sel={sel} setSel={setSel} windSrc={windSrc} setWindSrc={setWindSrc} />
        </div>
      )}
    </div>
  )
}

function PlayerPanel({ p, isTurn, isMe }: { p: Player; isTurn: boolean; isMe: boolean }) {
  return (
    <div className={`rounded-2xl border-2 p-4 ${isTurn ? 'border-accent bg-accent/10' : 'border-line bg-surface'}`}>
      <div className="flex items-center gap-3">
        <span className="text-4xl">{p.avatar}</span>
        <div className="min-w-0">
          <div className="text-lg font-medium text-ink truncate">
            {p.name}
            {isMe && ' (คุณ)'}
          </div>
          <div className="text-sm text-ink/60">
            🍃{netLeaves(p)} · 🂠{p.hand.length} ใบ
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-2.5">
        <div>
          <div className="text-xs font-medium text-ink/50 mb-1">🏠 บ้าน ({p.home.length} ใบ)</div>
          <MiniStack cards={p.home} />
        </div>
        <div>
          <div className="text-xs font-medium text-ink/50 mb-1">🍃 โซนบัฟ ({p.buffs.length} ใบ)</div>
          <MiniStack cards={p.buffs} />
        </div>
      </div>
    </div>
  )
}

function HomeWasteButton({ card, sel, setSel, setGame }: { card: Extract<Card, { kind: 'waste' }>; sel: Sel; setSel: (s: Sel) => void; setGame: SetGame }) {
  // ถ้าเลือกการ์ดถังในมือไว้แล้ว แตะขยะในบ้านเพื่อยืนยันแยกขยะได้เลย
  if (sel?.kind === 'bin') {
    return (
      <button
        type="button"
        onClick={() => {
          const ok = card.bin === sel.card.bin
          sfx.drop()
          setTimeout(() => (ok ? sfx.correct() : sfx.wrong()), 80)
          setGame((g) => g && sortWaste(g, sel.card.id, card.id))
          setSel(null)
        }}
        className="hover:-translate-y-0.5 transition-transform"
      >
        <PrintCard card={card} />
      </button>
    )
  }
  return <PrintCard card={card} />
}

/** แผงเลือกรายละเอียดต่อ หลังแตะการ์ดในมือ 1 ใบ */
function ActionPanel({
  game,
  setGame,
  sel,
  setSel,
  windSrc,
  setWindSrc,
}: {
  game: State
  setGame: SetGame
  sel: Exclude<Sel, null>
  setSel: (s: Sel) => void
  windSrc: { owner: number; cardId: number } | null
  setWindSrc: (v: { owner: number; cardId: number } | null) => void
}) {
  const me = game.players[0]
  const others = game.players.map((_, i) => i).filter((i) => i !== 0)
  const commit = (fn: (g: State) => State) => {
    setGame((g) => (g ? fn(g) : g))
    setSel(null)
    setWindSrc(null)
  }

  if (sel.kind === 'bin') {
    return (
      <div className="rounded-xl border border-line bg-surface p-4 text-base text-ink/70 text-center">
        แตะขยะในบ้านคุณด้านบน เพื่อเลือกว่าจะแยกลงถัง "{BINS[sel.card.bin].name}" ใบไหน
      </div>
    )
  }

  if (sel.kind === 'waste') {
    return (
      <div className="rounded-xl border border-line bg-surface p-3">
        <div className="text-base text-ink/70 mb-2">
          โยน {wasteLabel(sel.card)} ใส่บ้านใคร? (ได้ 1 ครั้ง/ตา{me.thrown ? ' — ใช้ไปแล้วตานี้' : ''})
        </div>
        <div className="flex flex-wrap gap-2">
          {others.map((i) => (
            <button key={i} type="button" disabled={me.thrown} onClick={() => commit((g) => throwWaste(g, sel.card.id, i))} className="rounded-full border-2 border-line bg-white px-4 py-2 text-base hover:border-accent disabled:opacity-40">
              {game.players[i].avatar} {game.players[i].name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (sel.kind === 'buff') {
    const key = sel.card.key
    if (key === 'tree' || key === 'bag' || key === 'light' || key === 'compost') {
      return (
        <div className="rounded-xl border border-line bg-surface p-4 flex items-center justify-between gap-2">
          <span className="text-base text-ink/75">{BUFF_BY_KEY[key].desc}</span>
          <button type="button" onClick={() => commit((g) => playBuff(g, sel.card.id))} className="pop-btn bg-accent text-white px-5 py-2 text-base font-medium shrink-0">
            เล่นเลย
          </button>
        </div>
      )
    }
    if (key === 'solar' || key === 'bank') {
      const need = key === 'solar' ? 2 : 3
      const pool = key === 'solar' ? me.hand.filter((c) => c.id !== sel.card.id) : me.hand.filter((c) => c.kind === 'waste' && c.bin === 'yellow')
      return <DiscardPicker label={key === 'solar' ? 'เลือกการ์ด 2 ใบจากมือเพื่อทิ้ง' : 'เลือกขยะสีเหลือง 3 ใบจากมือเพื่อทิ้ง'} need={need} pool={pool} onConfirm={(ids) => commit((g) => playBuff(g, sel.card.id, { discardIds: ids }))} />
    }
    if (key === 'repair') {
      if (!me.home.length) return <div className="rounded-xl border border-line bg-surface p-4 text-base text-ink/60 text-center">บ้านคุณว่าง ไม่มีขยะให้หยิบกลับ</div>
      return (
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="text-base text-ink/70 mb-2">เลือกขยะ 1 ใบในบ้านคุณ เพื่อหยิบกลับขึ้นมือ</div>
          <div className="flex flex-wrap gap-2">
            {me.home.map((c) => (
              <button key={c.id} type="button" onClick={() => commit((g) => playBuff(g, sel.card.id, { wasteId: c.id }))} className="hover:-translate-y-0.5 transition-transform">
                <PrintCard card={c} />
              </button>
            ))}
          </div>
        </div>
      )
    }
    if (key === 'friend') {
      return (
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="text-base text-ink/70 mb-2">ชวนใครแยกขยะด้วยกัน (จั่วคนละ 1 ใบ)</div>
          <div className="flex flex-wrap gap-2">
            {others.map((i) => (
              <button key={i} type="button" onClick={() => commit((g) => playBuff(g, sel.card.id, { targetIdx: i }))} className="rounded-full border-2 border-line bg-white px-4 py-2 text-base hover:border-accent">
                {game.players[i].avatar} {game.players[i].name}
              </button>
            ))}
          </div>
        </div>
      )
    }
  }

  if (sel.kind === 'prank') {
    const key = sel.card.key
    if (key === 'burn' || key === 'bags' || key === 'smoke') {
      const disabled = key === 'burn' && me.home.length === 0
      return (
        <div className="rounded-xl border border-line bg-surface p-4 flex items-center justify-between gap-2">
          <span className="text-base text-ink/75">{PRANK_BY_KEY[key].desc}</span>
          <button type="button" disabled={disabled} onClick={() => commit((g) => playPrank(g, key))} className="pop-btn bg-[#e4573d] text-white px-5 py-2 text-base font-medium shrink-0 disabled:opacity-40">
            เล่นเลย
          </button>
        </div>
      )
    }
    if (key === 'lights' || key === 'gift') {
      const canGift = key !== 'gift' || me.hand.some((c) => c.kind === 'waste')
      return (
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="text-base text-ink/70 mb-2">{PRANK_BY_KEY[key].desc}</div>
          {!canGift ? (
            <p className="text-base text-ink/55">มือคุณไม่มีขยะให้ยัดเยียดตอนนี้</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {others.map((i) => (
                <button key={i} type="button" onClick={() => commit((g) => playPrank(g, key, { targetIdx: i }))} className="rounded-full border-2 border-line bg-white px-4 py-2 text-base hover:border-accent">
                  {game.players[i].avatar} {game.players[i].name}
                </button>
              ))}
            </div>
          )}
        </div>
      )
    }
    if (key === 'wind') {
      const allWaste = game.players.flatMap((p, pi) => p.home.filter((c) => c.kind === 'waste').map((c) => ({ pi, c: c as Extract<Card, { kind: 'waste' }> })))
      if (!windSrc) {
        if (!allWaste.length) return <div className="rounded-xl border border-line bg-surface p-4 text-base text-ink/60 text-center">ไม่มีขยะในบ้านใครเลยตอนนี้</div>
        return (
          <div className="rounded-xl border border-line bg-surface p-3">
            <div className="text-base text-ink/70 mb-2">เลือกขยะที่จะให้ลมพัด (จากบ้านใครก็ได้)</div>
            <div className="flex flex-wrap gap-2">
              {allWaste.map(({ pi, c }) => (
                <button key={c.id} type="button" onClick={() => setWindSrc({ owner: pi, cardId: c.id })} className="flex flex-col items-center gap-0.5">
                  <PrintCard card={c} />
                  <span className="text-[10px] text-ink/50">{game.players[pi].name}</span>
                </button>
              ))}
            </div>
          </div>
        )
      }
      const dstOptions = game.players.map((_, i) => i).filter((i) => i !== windSrc.owner)
      return (
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="text-base text-ink/70 mb-2">พัดไปลงบ้านใคร?</div>
          <div className="flex flex-wrap gap-2">
            {dstOptions.map((i) => (
              <button key={i} type="button" onClick={() => commit((g) => playPrank(g, 'wind', { fromIdx: windSrc.owner, wasteId: windSrc.cardId, toIdx: i }))} className="rounded-full border-2 border-line bg-white px-4 py-2 text-base hover:border-accent">
                {game.players[i].avatar} {game.players[i].name}
              </button>
            ))}
          </div>
        </div>
      )
    }
  }
  return null
}

function DiscardPicker({ label, need, pool, onConfirm }: { label: string; need: number; pool: Card[]; onConfirm: (ids: number[]) => void }) {
  const [picked, setPicked] = useState<number[]>([])
  const toggle = (id: number) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < need ? [...cur, id] : cur))
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="text-base text-ink/70 mb-2">
        {label} ({picked.length}/{need})
      </div>
      {pool.length < need ? (
        <p className="text-base text-ink/55">มีไม่พอ ยังเล่นการ์ดนี้ไม่ได้</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {pool.map((c) => (
              <button key={c.id} type="button" onClick={() => toggle(c.id)} className={picked.includes(c.id) ? 'opacity-50' : ''}>
                <PrintCard card={c} />
              </button>
            ))}
          </div>
          <button type="button" disabled={picked.length !== need} onClick={() => onConfirm(picked)} className="pop-btn mt-3 bg-accent text-white px-5 py-2 text-base font-medium disabled:opacity-40">
            ยืนยัน
          </button>
        </>
      )}
    </div>
  )
}

function DiscardExtraPanel({ game, setGame }: { game: State; setGame: SetGame }) {
  const me = game.players[0]
  return (
    <div className="pop-card p-4 border-2 border-amber-300 bg-amber-50/60">
      <div className="text-center font-medium text-amber-900 mb-2">มือคุณเกิน 7 ใบ — เลือกทิ้งให้เหลือ 7 ใบก่อนจบตา</div>
      <DiscardPicker label="เลือกการ์ดที่จะทิ้ง" need={game.mustDiscard} pool={me.hand} onConfirm={(ids) => setGame((g) => g && discardExtra(g, ids))} />
    </div>
  )
}

function DefendPrompt({ game, setGame }: { game: State; setGame: SetGame }) {
  const pend = game.pending!
  const def = DEF_BY_KEY[pend.defKey!]
  return (
    <div className="pop-card p-4 border-2 border-sky-300 bg-sky-50/60 text-center space-y-2">
      <div className="font-medium text-ink">
        มีคนเล่นใส่คุณ! ใช้การ์ด "{def.emoji} {def.name}" ไหม?
      </div>
      <p className="text-base text-ink/65">{def.desc}</p>
      <div className="flex justify-center gap-2">
        <button type="button" onClick={() => setGame((g) => g && resolveDefend(g, true))} className="pop-btn bg-sky-600 text-white px-5 py-2 text-base font-medium">
          ใช้เลย
        </button>
        <button type="button" onClick={() => setGame((g) => g && resolveDefend(g, false))} className="pop-btn bg-surface border-2 border-line text-ink px-5 py-2 text-base font-medium">
          ไม่ใช้
        </button>
      </div>
    </div>
  )
}

function CatchBanner({ game, setGame }: { game: State; setGame: SetGame }) {
  const pend = game.pending!
  const eligible = catchEligible(game)
  const iCanCatch = eligible.includes(0)
  const [left, setLeft] = useState(3.5)
  useEffect(() => {
    const iv = setInterval(() => setLeft(Math.max(0, (pend.deadline! - Date.now()) / 1000)), 100)
    return () => clearInterval(iv)
  }, [pend.deadline])

  // บอทที่จับผิดได้ แต่ละตัวลองจับด้วยดีเลย์+โอกาสสุ่มของตัวเอง
  useEffect(() => {
    const id = pend.resolveId
    const timers = eligible
      .filter((i) => !game.players[i].human)
      .map((i) => {
        const delay = 900 + Math.random() * 2200
        const success = Math.random() < 0.45 + Math.random() * 0.15
        return setTimeout(() => {
          setGame((g) => (g && g.pending?.kind === 'catch' && g.pending.resolveId === id && success ? resolveCatch(g, i) : g))
        }, delay)
      })
    const timeout = setTimeout(() => {
      setGame((g) => (g && g.pending?.kind === 'catch' && g.pending.resolveId === id ? resolveCatch(g, null) : g))
    }, 3500)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pend.resolveId])

  return (
    <div className="pop-card p-4 border-2 border-amber-300 bg-amber-50/70 text-center space-y-2">
      <div className="font-medium text-amber-900">⏱ แยกผิดถัง! ใครจะจับผิดทัน (เหลือ {left.toFixed(1)}s)</div>
      {iCanCatch ? (
        <button
          type="button"
          onClick={() => {
            sfx.correct()
            setGame((g) => g && resolveCatch(g, 0))
          }}
          className="pop-btn bg-amber-500 text-white px-6 py-3 text-lg font-bold animate-pulse"
        >
          ✋ จับผิด!
        </button>
      ) : (
        <p className="text-base text-amber-800/80">คุณเป็นคนแยกผิดเอง — รอดูว่าใครจับทัน</p>
      )}
    </div>
  )
}

function Over({ game, onAgain }: { game: State; onAgain: () => void }) {
  const ranking = [...game.players].sort((a, b) => netLeaves(b) - netLeaves(a))
  return (
    <div className="max-w-xl mx-auto pop-card p-6 sm:p-8 text-center space-y-4">
      <div className="text-6xl" aria-hidden>
        🏆
      </div>
      <h2 className="font-display text-2xl sm:text-3xl text-ink">{game.players[game.winner!].name} ชนะ!</h2>
      <p className="text-ink/65 text-sm">ใบไม้สุทธิครบ {WIN_TARGET} ก่อนใคร</p>
      <div className="space-y-1.5 max-w-sm mx-auto text-left">
        {ranking.map((p, i) => (
          <div key={p.name + i} className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-1.5">
            <span>
              #{i + 1} {p.avatar} {p.name}
              {p.human && ' (คุณ)'}
            </span>
            <span className="font-medium text-ink">🍃 {netLeaves(p)}</span>
          </div>
        ))}
      </div>
      <button type="button" onClick={onAgain} className="pop-btn bg-accent text-white px-8 py-3 font-medium">
        เล่นอีกครั้ง
      </button>
    </div>
  )
}
