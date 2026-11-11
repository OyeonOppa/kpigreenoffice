import { useEffect, useState } from 'react'
import { Home, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { ITEMS, SVGS, TIERS, type Item } from '../decompose/cards'
import {
  HAND_SIZE,
  HEAT_MAX,
  ROW_GOAL,
  actor,
  botAct,
  itemOf,
  newGame,
  next,
  place,
  type Mode,
  type State,
} from '../decompose/engine'
import { sfx } from '../game/sfx'

/* ย่อยนานแค่ไหน? — เกมเรียงลำดับการ์ดตามเวลาย่อยสลายของขยะในทะเล (#/decompose) */

const tierOf = (n: number) => TIERS[n - 1]

function Pic({ item, size }: { item: Item; size: string }) {
  return (
    <span className="relative inline-block leading-none" style={{ fontSize: size }} aria-hidden>
      {item.svg ? (
        <span className="block [&_svg]:block [&_svg]:w-[1em] [&_svg]:h-[1em]" dangerouslySetInnerHTML={{ __html: SVGS[item.svg] }} />
      ) : (
        item.emoji
      )}
      {item.badge && <span className="absolute -right-[0.26em] -bottom-[0.04em] leading-none" style={{ fontSize: '0.46em' }}>{item.badge}</span>}
    </span>
  )
}

function TierChip({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-md text-white font-bold px-1.5 text-sm ${className}`} style={{ background: tierOf(n).color }}>
      {n}
    </span>
  )
}

/* ----------------------------------------------------------------- หน้าการ์ด (เหมือนการ์ดพิมพ์) — ใช้ระบบ .pc เดียวกับเกมฝ่าด่านลดคาร์บอน (ดู src/index.css) */

/** ขนาดตัวอักษรตามปริมาณข้อความ — สูตรเดียวกับตัวสร้างการ์ดพิมพ์ */
function sizeClass(descLen: number, footLen: number, nameLen: number): string {
  const L = descLen + footLen * 0.6 + nameLen * 0.8
  return L > 125 ? 'pc-tight' : L > 80 ? 'pc-mid' : 'pc-roomy'
}

/**
 * หน้าการ์ดตามแบบพิมพ์ของเกม "ย่อยนานแค่ไหน?"
 * reveal=false (ในมือ/การ์ดที่จั่วยังไม่วาง) — ซ่อนระดับ-เวลา-เฉลย เพราะนั่นคือคำตอบของเกม โชว์แค่รูป+ชื่อให้เดา
 * reveal=true (วางลงแถวแล้ว) — เฉลยเต็ม ใช้ตัดสินว่าวางถูกไหม
 */
function PrintCard({ item, ringOk, reveal = true }: { item: Item; ringOk?: boolean; reveal?: boolean }) {
  const t = tierOf(item.tier)
  const desc = item.note ? `${item.why} (${item.note})` : item.why
  const foot = `จัดการ: ${item.tip} · ที่มา: ${item.src}`
  const style = reveal
    ? { ['--c' as string]: t.color, ['--t' as string]: `${t.color}1a` }
    : { ['--c' as string]: '#94a3b8', ['--t' as string]: '#f8fafc' }
  return (
    <div className={`pc ${ringOk ? 'ring-4 ring-green-400 rounded-[5.73cqw]' : ''}`} style={style}>
      <div className={`pc-in ${reveal ? sizeClass(desc.length, foot.length, item.name.length) : 'pc-roomy'}`}>
        {reveal ? (
          <>
            <span className="pc-tag">
              ระดับ {item.tier} · {t.name}
            </span>
            <div className="pc-emoji">
              <Pic item={item} size="1em" />
            </div>
            <div className="pc-name">{item.name}</div>
            <div className="pc-big">{item.time}</div>
            <div className="pc-desc">
              <b>รู้ไหม:</b> {desc}
            </div>
            <div className="pc-foot">{foot}</div>
          </>
        ) : (
          <>
            <span className="pc-tag">? ระดับย่อยสลาย</span>
            <div className="pc-emoji">
              <Pic item={item} size="1em" />
            </div>
            <div className="pc-name">{item.name}</div>
            <div className="pc-foot">วางในแถวก่อนถึงจะเฉลยระดับ</div>
          </>
        )}
      </div>
    </div>
  )
}

export default function DecomposePage() {
  const [mode, setMode] = useState<Mode>('coop')
  const [bots, setBots] = useState(2)
  const [game, setGame] = useState<State | null>(null)
  const [muted, setMuted] = useState(sfx.muted)

  // บอทเล่นเอง และเฉลยของบอทเดินต่ออัตโนมัติ
  useEffect(() => {
    if (!game || game.phase === 'over') return
    if (game.phase === 'reveal') {
      if (game.players[game.reveal!.who].human) return
      const t = setTimeout(() => setGame((g) => (g ? next(g) : g)), 2600)
      return () => clearTimeout(t)
    }
    const a = actor(game)
    if (a >= 0 && !game.players[a].human) {
      const t = setTimeout(() => setGame((g) => (g ? botAct(g) : g)), 1000 + Math.random() * 600)
      return () => clearTimeout(t)
    }
  }, [game])

  const phase = game?.phase
  useEffect(() => {
    if (!game) return
    if (game.phase === 'reveal' && game.reveal) (game.reveal.ok ? sfx.correct : sfx.wrong)()
    if (game.phase === 'over') (game.won ? sfx.fanfare : sfx.wrong)()
    // เฉพาะตอนเปลี่ยนเฟสเท่านั้น
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, game?.reveal?.card])

  const start = () => setGame(newGame(mode, bots))

  return (
    <div className="game-bg min-h-dvh flex flex-col">
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
      <div className="flex-1 px-3 sm:px-6 pb-8">
        {game ? (
          <Board game={game} setGame={setGame} onAgain={start} />
        ) : (
          <Setup mode={mode} setMode={setMode} bots={bots} setBots={setBots} onStart={start} />
        )}
      </div>
    </div>
  )
}

/* ------------------------------------ หน้าตั้งค่า ------------------------------------ */

function Setup(p: { mode: Mode; setMode: (m: Mode) => void; bots: number; setBots: (n: number) => void; onStart: () => void }) {
  const modes: { id: Mode; title: string; desc: string }[] = [
    { id: 'coop', title: '🤝 ร่วมมือ (เล่นคนเดียวได้)', desc: `ผลัดกันจั่วการ์ด วางผิดครบ ${HEAT_MAX} ครั้ง 🌡 แพ้ · เรียงให้ได้ ${ROW_GOAL} ใบ ชนะ` },
    { id: 'versus', title: '⚔️ แข่งกับบอท', desc: `คนละ ${HAND_SIZE} ใบ วางถูกการ์ดหมดไป วางผิดต้องจั่วเพิ่ม ใครหมดมือก่อนชนะ` },
  ]
  return (
    <div className="max-w-2xl mx-auto pop-card p-6 sm:p-9">
      <div className="text-center">
        <div className="text-6xl mb-2" aria-hidden>🌊⏳</div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink tracking-tight">ย่อยนานแค่ไหน?</h1>
        <p className="text-ink/65 mt-2">ถ้าขยะหลุดลงทะเล อะไรย่อยเร็ว อะไรอยู่นานเป็นร้อยปี? เรียงให้ถูก</p>
      </div>

      <ol className="mt-6 space-y-3 text-ink/85 leading-relaxed">
        {[
          <>วางการ์ดลงใน <b>แถว</b> ซ้าย = <b>ย่อยเร็ว</b> → ขวา = <b>ย่อยช้า</b></>,
          <>พลิกเฉลยดูระดับ 1–6 ของการ์ด ถ้าระดับ <b>ไม่ต่ำกว่าใบซ้าย และไม่สูงกว่าใบขวา</b> = ถูก (ระดับเท่ากันวางสลับกันได้)</>,
          <>เฉลยทุกใบบอกเวลาโดยประมาณ เกร็ดความรู้ วิธีทิ้ง และที่มาของข้อมูล</>,
        ].map((t, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-accent text-white text-sm flex items-center justify-center">{i + 1}</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>

      <div className="mt-5 grid grid-cols-6 gap-1.5">
        {TIERS.map((t) => (
          <div key={t.n} className="rounded-xl p-1.5 text-center text-white" style={{ background: t.color }}>
            <div className="font-bold">{t.n}</div>
            <div className="text-[10px] sm:text-xs leading-tight">{t.name}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => p.setMode(m.id)}
            className={`w-full text-left rounded-2xl border-2 px-4 py-3 transition-colors ${p.mode === m.id ? 'border-accent bg-accent/10' : 'border-line bg-surface hover:border-accent/50'}`}
          >
            <div className="font-medium text-ink">{m.title}</div>
            <div className="text-sm text-ink/65">{m.desc}</div>
          </button>
        ))}
      </div>

      {p.mode === 'versus' && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-sm text-ink/65">จำนวนบอท</span>
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => p.setBots(n)}
              className={`w-10 h-10 rounded-full border-2 font-medium ${p.bots === n ? 'border-accent bg-accent text-white' : 'border-line bg-surface text-ink'}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      <button type="button" onClick={p.onStart} className="pop-btn mt-6 w-full bg-accent text-white py-3 text-lg font-medium">
        เริ่มเล่น
      </button>
      <p className="mt-4 text-xs text-ink/50 leading-relaxed text-center">
        ข้อมูลเวลาย่อยสลายเป็นค่าโดยประมาณของขยะในทะเล จาก US EPA, US NPS, NOAA/Mote Marine Lab และ MARLISCO (EU) ·
        แนวเกมเรียงลำดับการ์ดได้แรงบันดาลใจจากเกมแนว Timeline
      </p>
    </div>
  )
}

/* ------------------------------------ กระดาน ------------------------------------ */

function Board({ game, setGame, onAgain }: { game: State; setGame: (f: (g: State | null) => State | null) => void; onAgain: () => void }) {
  const [picked, setPicked] = useState<number | null>(null)
  const a = actor(game)
  const myTurn = a >= 0 && game.players[a].human
  const me = game.players[0]
  const holding = game.mode === 'coop' ? game.drawn : picked
  const canPlace = myTurn && holding !== null

  const doPlace = (index: number) => {
    if (!canPlace || holding === null) return
    sfx.drop()
    setPicked(null)
    setGame((g) => (g ? place(g, holding, index) : g))
  }

  if (game.phase === 'over') return <Over game={game} onAgain={onAgain} />

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        {game.mode === 'coop' ? (
          <>
            <span className="rounded-full bg-surface border-2 border-line px-3 py-1">
              🌡 {Array.from({ length: HEAT_MAX }, (_, i) => (i < game.heat ? '🔥' : '▫️')).join(' ')}
            </span>
            <span className="rounded-full bg-surface border-2 border-line px-3 py-1">
              แถว {game.row.length}/{ROW_GOAL} ใบ · เหลือในกอง {game.deck.length}
            </span>
          </>
        ) : (
          game.players.map((p, i) => (
            <span key={p.name} className={`rounded-full border-2 px-3 py-1 ${i === game.turn && game.phase === 'place' ? 'border-accent bg-accent/10' : 'border-line bg-surface'}`}>
              {p.avatar} {p.name} · {p.hand.length} ใบ
            </span>
          ))
        )}
      </div>

      <div className="pop-card p-3 sm:p-5">
        <div className="flex items-center justify-between text-xs text-ink/60 mb-2">
          <span>⬅ ย่อยเร็ว</span>
          <span>ย่อยช้า ➡</span>
        </div>
        <Row game={game} canPlace={canPlace && game.phase === 'place'} onSlot={doPlace} />
        {canPlace && game.phase === 'place' && <p className="text-center text-sm text-accent-deep mt-3">แตะช่อง ＋ ที่ต้องการวางการ์ด</p>}
      </div>

      {game.phase === 'reveal' && game.reveal ? (
        <RevealPanel game={game} onNext={() => setGame((g) => (g ? next(g) : g))} />
      ) : (
        <div className="pop-card p-4 sm:p-5">
          {game.mode === 'coop' ? (
            game.drawn !== null && <Hold item={itemOf(game.drawn)} title="การ์ดที่จั่วได้ — จะวางไว้ตรงไหน?" />
          ) : myTurn ? (
            <>
              <div className="text-center text-ink font-medium mb-3">ตาคุณ — เลือกการ์ดในมือ 1 ใบ แล้ววางลงแถว</div>
              <div className="flex flex-wrap justify-center gap-3">
                {me.hand.map((id) => {
                  const it = itemOf(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPicked(picked === id ? null : id)}
                      className={`w-40 sm:w-44 rounded-[5.73cqw] transition-all ${picked === id ? '-translate-y-1 ring-4 ring-accent/40' : 'hover:-translate-y-0.5'}`}
                    >
                      <PrintCard item={it} reveal={false} />
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="text-center text-ink/65 py-2">
              {game.players[game.turn].avatar} {game.players[game.turn].name} กำลังเลือกการ์ด…
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ game, canPlace, onSlot }: { game: State; canPlace: boolean; onSlot: (i: number) => void }) {
  const r = game.reveal
  const slot = (i: number) =>
    canPlace ? (
      <button
        key={`s${i}`}
        type="button"
        onClick={() => onSlot(i)}
        aria-label={`วางตำแหน่งที่ ${i + 1}`}
        className="self-stretch min-h-28 w-9 sm:w-11 shrink-0 rounded-xl border-2 border-dashed border-accent/60 text-accent text-xl font-bold hover:bg-accent/15 transition-colors"
      >
        ＋
      </button>
    ) : (
      <span key={`s${i}`} className="w-1.5 shrink-0" />
    )
  const out: React.ReactNode[] = [slot(0)]
  game.row.forEach((id, i) => {
    const it = itemOf(id)
    out.push(
      <div key={id} className="w-32 sm:w-40 shrink-0">
        <PrintCard item={it} ringOk={!!(r && r.ok && r.card === id)} />
      </div>,
    )
    out.push(slot(i + 1))
  })
  return <div className="flex flex-wrap items-stretch gap-y-2.5">{out}</div>
}

function Hold({ item, title }: { item: Item; title: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-sm text-ink/60">{title}</div>
      <div className="w-40 sm:w-48">
        <PrintCard item={item} reveal={false} />
      </div>
    </div>
  )
}

function RevealPanel({ game, onNext }: { game: State; onNext: () => void }) {
  const r = game.reveal!
  const it = itemOf(r.card)
  const t = tierOf(it.tier)
  const who = game.players[r.who]
  return (
    <div className="pop-card p-4 sm:p-6 border-2" style={{ borderColor: r.ok ? '#4ade80' : '#f87171' }}>
      <div className={`text-center font-display text-xl ${r.ok ? 'text-green-700' : 'text-red-600'}`}>
        {who.human ? 'คุณ' : who.name} วาง {it.name} {r.ok ? 'ถูกต้อง! 🎉' : game.mode === 'coop' ? 'ผิด — ความร้อน +1 🔥' : 'ผิด — ต้องจั่วเพิ่ม 1 ใบ'}
      </div>
      <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="shrink-0 text-center">
          <Pic item={it} size="96px" />
          <div className="mt-2 flex items-center justify-center gap-2">
            <TierChip n={it.tier} className="text-lg px-2.5" />
            <span className="text-sm text-ink/70">{t.name}</span>
          </div>
        </div>
        <div className="flex-1 space-y-2 text-ink/85 leading-relaxed">
          <div>
            <span className="font-display text-2xl text-ink">{it.name}</span>
            <span className="ml-2 font-bold" style={{ color: t.color }}>{it.time}</span>
          </div>
          {it.note && <div className="text-sm text-ink/60">{it.note}</div>}
          <p>{it.why}</p>
          <p className="rounded-xl bg-accent/10 px-3 py-2 text-sm"><b>จัดการ:</b> {it.tip}</p>
          <div className="text-xs text-ink/50">ที่มา: {it.src} · เป็นเวลาโดยประมาณของขยะที่อยู่ในทะเล</div>
        </div>
      </div>
      {who.human && (
        <button type="button" onClick={onNext} className="pop-btn mt-4 w-full bg-accent text-white py-2.5 font-medium">
          ต่อไป
        </button>
      )}
    </div>
  )
}

function Over({ game, onAgain }: { game: State; onAgain: () => void }) {
  const won = !!game.won
  const sorted = [...game.row].map(itemOf)
  return (
    <div className="max-w-3xl mx-auto pop-card p-6 sm:p-8 text-center space-y-4">
      <div className="text-6xl" aria-hidden>{won ? '🏆' : '🌡'}</div>
      <h2 className="font-display text-2xl sm:text-3xl text-ink">
        {game.mode === 'coop'
          ? won ? `เรียงครบ ${ROW_GOAL} ใบ ทีมชนะ!` : 'ความร้อนเต็มแล้ว — เกมจบ'
          : won ? 'คุณวางการ์ดหมดมือก่อน ชนะ!' : `${game.players[game.winner ?? 1].name} หมดมือก่อน`}
      </h2>
      <p className="text-ink/65 text-sm">แถวสุดท้ายของเรา (ซ้าย = ย่อยเร็ว → ขวา = ย่อยช้า)</p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {sorted.map((it) => (
          <div key={it.id} className="w-20 rounded-xl border-2 p-1.5 text-center bg-surface" style={{ borderColor: tierOf(it.tier).color }}>
            <TierChip n={it.tier} className="text-xs" />
            <div className="mt-0.5"><Pic item={it} size="30px" /></div>
            <div className="text-[11px] leading-tight text-ink">{it.name}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-ink/70">
        จากทั้งหมด {ITEMS.length} ใบ ของที่ย่อยช้าที่สุดคือ <b>แก้ว</b> ส่วนพลาสติกอยู่ได้หลายร้อยปี — ลดใช้ ใช้ซ้ำ และแยกทิ้งให้ถูกถัง
      </p>
      <button type="button" onClick={onAgain} className="pop-btn bg-accent text-white px-8 py-3 font-medium">
        เล่นอีกครั้ง
      </button>
    </div>
  )
}
