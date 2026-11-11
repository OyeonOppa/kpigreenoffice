import { useMemo, useState } from 'react'
import { Home, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import {
  ACC_TEMP,
  devDef,
  finish,
  judge,
  newGame,
  roomDef,
  score,
  setDevice,
  type DeviceDef,
  type DevState,
  type Game,
} from '../energy/engine'
import { sfx } from '../game/sfx'
import GameGuide from '../components/seo/GameGuide'

/* ตรวจออฟฟิศก่อนกลับบ้าน — เกมสังเกตและตัดสินใจเรื่องการใช้ไฟในสำนักงาน (#/office-energy) */

const SVGS = {
  rack: '<svg viewBox="0 0 100 100"><g stroke="#475569" stroke-width="3" stroke-linejoin="round"><rect x="22" y="6" width="56" height="88" rx="5" fill="#e2e8f0"/><rect x="29" y="14" width="42" height="14" rx="2" fill="#fff"/><rect x="29" y="33" width="42" height="14" rx="2" fill="#fff"/><rect x="29" y="52" width="42" height="14" rx="2" fill="#fff"/><rect x="29" y="71" width="42" height="14" rx="2" fill="#fff"/></g><g fill="#22c55e"><circle cx="63" cy="21" r="2.6"/><circle cx="63" cy="40" r="2.6"/><circle cx="63" cy="59" r="2.6"/><circle cx="63" cy="78" r="2.6"/></g></svg>',
  fridge:
    '<svg viewBox="0 0 100 100"><g stroke="#64748b" stroke-width="3" stroke-linejoin="round"><rect x="26" y="5" width="48" height="90" rx="6" fill="#f1f5f9"/><path d="M26 38h48" fill="none"/></g><g stroke="#64748b" stroke-width="4" stroke-linecap="round"><path d="M35 20v10M35 48v16"/></g></svg>',
}

function Pic({ def, size = '34px' }: { def: DeviceDef; size?: string }) {
  return (
    <span className="inline-block leading-none shrink-0" style={{ fontSize: size }} aria-hidden>
      {def.svg ? (
        <span className="block [&_svg]:block [&_svg]:w-[1em] [&_svg]:h-[1em]" dangerouslySetInnerHTML={{ __html: SVGS[def.svg] }} />
      ) : (
        def.emoji
      )}
    </span>
  )
}

export default function OfficeEnergyPage() {
  const [game, setGame] = useState<Game | null>(null)
  const [muted, setMuted] = useState(sfx.muted)

  return (
    <div className="game-bg min-h-dvh flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2 sm:py-3 shrink-0">
        <a href="/" className="inline-flex items-center gap-1.5 text-ink/60 hover:text-ink text-sm transition-colors">
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
        {game ? <Board game={game} setGame={setGame} onAgain={() => setGame(newGame())} /> : (
          <>
            <Intro onStart={() => setGame(newGame())} />
            <GameGuide path="/games/office-energy/" />
          </>
        )}
      </div>
    </div>
  )
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-2xl mx-auto pop-card p-6 sm:p-9">
      <div className="text-center">
        <div className="text-6xl mb-2" aria-hidden>🏢🔦</div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink tracking-tight">ตรวจออฟฟิศก่อนกลับบ้าน</h1>
        <p className="text-ink/65 mt-2">เลิกงานแล้ว คุณเป็นคนเดินตรวจ ปิดของที่เปิดทิ้งไว้ให้ถูกตัว</p>
      </div>
      <ol className="mt-6 space-y-3 text-ink/85 leading-relaxed">
        {[
          <>ดูแต่ละห้อง ว่า <b>ยังมีคนทำงานอยู่</b> 👥 หรือ <b>ห้องว่าง</b> 🌙</>,
          <>ห้องว่าง → ปิดอุปกรณ์ที่ไม่มีใครใช้ · ห้องที่มีคน → <b>อย่าปิด</b> แต่แอร์ปรับให้ประหยัดได้ ({ACC_TEMP}°C ขึ้นไป)</>,
          <>ระวัง! บางอย่าง <b>ต้องเปิดตลอด</b> เช่น ตู้เซิร์ฟเวอร์ ตู้เย็น ป้ายทางออก กล้องวงจรปิด ห้ามปิด</>,
          <>กด “ตรวจเสร็จแล้ว” เพื่อดูคะแนนและเหตุผลของทุกจุด</>,
        ].map((t, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-accent text-white text-sm flex items-center justify-center">{i + 1}</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
      <button type="button" onClick={onStart} className="pop-btn mt-6 w-full bg-accent text-white py-3 text-lg font-medium">
        เริ่มตรวจ
      </button>
      <p className="mt-4 text-xs text-ink/50 leading-relaxed text-center">
        เกมนี้ตัดสินจากหลักการใช้ไฟอย่างเหมาะสม ไม่ได้ใช้ตัวเลขวัตต์หรือค่าไฟของอุปกรณ์จริง ห้องและอุปกรณ์สุ่มใหม่ทุกครั้ง
      </p>
    </div>
  )
}

function Board({ game, setGame, onAgain }: { game: Game; setGame: (f: (g: Game | null) => Game | null) => void; onAgain: () => void }) {
  const verdicts = useMemo(() => (game.done ? judge(game) : []), [game])
  const result = game.done ? score(verdicts) : null
  const set = (rid: string, did: string, patch: Partial<DevState>) => {
    sfx.drop()
    setGame((g) => (g ? setDevice(g, rid, did, patch) : g))
  }
  const submit = () => {
    const s = score(judge(game))
    ;(s.pct >= 70 ? sfx.fanfare : sfx.wrong)()
    setGame((g) => (g ? finish(g) : g))
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {result && <Result result={result} onAgain={onAgain} />}
      <div className="grid gap-3 sm:grid-cols-2">
        {game.rooms.map((r) => {
          const def = roomDef(r.id)
          return (
            <section key={r.id} className="pop-card p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="font-display text-lg text-ink">
                  <span aria-hidden>{def.emoji}</span> {def.name}
                </h2>
                <span className={`text-xs rounded-full px-2.5 py-1 border-2 shrink-0 ${r.occupied ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-300 bg-slate-50 text-slate-600'}`}>
                  {r.occupied ? '👥 มีคนทำงานอยู่' : '🌙 ห้องว่าง'}
                </span>
              </div>
              <ul className="space-y-2">
                {r.devices.map((d) => {
                  const dd = devDef(r.id, d.id)
                  const v = verdicts.find((x) => x.roomId === r.id && x.devId === d.id)
                  return (
                    <li key={d.id} className={`rounded-2xl border-2 px-3 py-2 ${v ? (v.ok ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') : d.on ? 'border-line bg-surface' : 'border-line bg-ink/5'}`}>
                      <div className="flex items-center gap-3">
                        <div className={d.on ? '' : 'grayscale opacity-50'}>
                          <Pic def={dd} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-ink leading-tight">{dd.name}</div>
                          <div className={`text-sm ${d.on ? 'text-green-700' : 'text-ink/50'}`}>
                            {d.on ? (dd.ac ? `เปิดอยู่ · ${d.temp}°C` : 'เปิดอยู่') : 'ปิดแล้ว'}
                          </div>
                        </div>
                        {!game.done && (
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {dd.ac && d.on && (d.temp ?? 0) < ACC_TEMP && (
                              <button type="button" onClick={() => set(r.id, d.id, { temp: ACC_TEMP })} className="rounded-full border-2 border-accent text-accent-deep px-3 py-1 text-sm font-medium hover:bg-accent/10">
                                ปรับ {ACC_TEMP}°C
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => set(r.id, d.id, { on: !d.on })}
                              className={`rounded-full px-3 py-1 text-sm font-medium border-2 ${d.on ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-accent text-accent-deep hover:bg-accent/10'}`}
                            >
                              {d.on ? 'ปิด' : 'เปิดกลับ'}
                            </button>
                          </div>
                        )}
                      </div>
                      {v && (
                        <div className="mt-1.5 text-sm leading-snug">
                          <b className={v.ok ? 'text-green-700' : 'text-red-600'}>{v.ok ? '✓ ถูกต้อง' : `✗ ควร${v.ideal} (คุณทำ: ${v.got})`}</b>
                          <div className="text-ink/75">{v.why}</div>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
      {!game.done && (
        <button type="button" onClick={submit} className="pop-btn w-full bg-accent text-white py-3 text-lg font-medium">
          ตรวจเสร็จแล้ว
        </button>
      )}
    </div>
  )
}

function Result({ result, onAgain }: { result: { ok: number; total: number; pct: number }; onAgain: () => void }) {
  const stars = result.pct >= 90 ? 3 : result.pct >= 70 ? 2 : result.pct >= 50 ? 1 : 0
  return (
    <div className="pop-card p-5 text-center space-y-2">
      <div className="text-4xl" aria-hidden>{'⭐'.repeat(stars) || '🌙'}</div>
      <h2 className="font-display text-2xl text-ink">
        ถูก {result.ok} จาก {result.total} จุด ({result.pct}%)
      </h2>
      <p className="text-ink/70 text-sm">
        {stars === 3 ? 'ยอดเยี่ยม ปิดถูกตัว ไม่ปิดของสำคัญ' : stars >= 1 ? 'ดีแล้ว ดูจุดที่ผิดด้านล่าง' : 'ลองใหม่ ดูเหตุผลของแต่ละจุดด้านล่าง'}
      </p>
      <p className="text-xs text-ink/55">ปิดทุกอย่างหรือไม่ทำอะไรเลย จะได้ราวครึ่งเดียว ต้องแยกให้ถูกว่าอะไรควรปิด</p>
      <button type="button" onClick={onAgain} className="pop-btn bg-accent text-white px-8 py-2.5 font-medium">
        ตรวจชุดใหม่
      </button>
    </div>
  )
}
