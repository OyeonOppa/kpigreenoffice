import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Check, ExternalLink, Shuffle, X } from 'lucide-react'
import { AVATAR_PARTS, WASTE } from '../content'
import { LIVE_CONFIG, backend, type AvatarLook, type BinId, type RoomSnapshot } from '../game'
import { lookFromSeed, randomLook, ringStyle } from '../game/avatar'
import { useAuth, useHashQueryParam, useNow, useRoom } from '../game/hooks'
import { sfx } from '../game/sfx'
import AnswerBars from '../components/live/AnswerBars'
import Confetti from '../components/live/Confetti'
import DragArena from '../components/live/DragArena'
import Leaderboard from '../components/live/Leaderboard'
import LiveShell from '../components/live/LiveShell'
import PlayerAvatar from '../components/live/PlayerAvatar'
import MascotBin from '../components/live/MascotBin'

const PIN_KEY = 'kpi-live:my-pin'

const binById = (id: BinId) => WASTE.bins.find((b) => b.id === id)!

export default function LivePlayerPage() {
  const { user, signIn } = useAuth()

  // ไม่มีหน้าล็อกอินแล้ว — ใครสแกน QR หรือกรอก PIN ก็เข้าเล่นได้เลย
  // สร้างตัวตนแบบไม่ระบุชื่อให้อัตโนมัติ (ชื่อจริงมากรอกตอนเข้าห้อง)
  useEffect(() => {
    if (!user) void signIn()
  }, [user, signIn])

  const [pin, setPin] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(PIN_KEY)
    } catch {
      return null
    }
  })
  const room = useRoom(pin)
  const me = room?.me ?? null

  const enterRoom = (value: string | null) => {
    setPin(value)
    try {
      if (value) sessionStorage.setItem(PIN_KEY, value)
      else sessionStorage.removeItem(PIN_KEY)
    } catch {
      // ไม่เป็นไร
    }
  }

  if (!user || !pin || !room || !me) {
    return (
      <LiveShell>
        <JoinCard
          key={user?.uid ?? 'anon'}
          seed={user?.uid ?? ''}
          pending={!!pin && !!user && !me}
          onJoined={enterRoom}
          onCancel={() => enterRoom(null)}
        />
      </LiveShell>
    )
  }

  return (
    <LiveShell
      topRight={
        <span className="tabular text-ink/60 text-xs">
          PIN {room.pin} · {room.playerCount} คน
        </span>
      }
    >
      <PlayerGame
        room={room}
        uid={user.uid}
        pin={pin}
        onLeave={() => {
          backend.leaveRoom(pin)
          enterRoom(null)
        }}
      />
    </LiveShell>
  )
}

// ---------- เข้าห้อง ----------

function JoinCard({
  seed,
  pending,
  onJoined,
  onCancel,
}: {
  /** ใช้สุ่มลุคเริ่มต้นให้ต่างกันตั้งแต่แรก คนที่ไม่แต่งตัวต่อจะได้ไม่ซ้ำกันทั้งห้อง */
  seed: string
  pending: boolean
  onJoined: (pin: string) => void
  onCancel: () => void
}) {
  // สแกน QR มาแล้วมี ?pin=123456 ต่อท้าย hash — กรอก PIN ให้อัตโนมัติ ยังแก้เองได้ตามปกติ
  const pinFromQr = useHashQueryParam('pin')
  const [pin, setPin] = useState(() => (pinFromQr ?? '').replace(/\D/g, '').slice(0, 6))
  const [name, setName] = useState('')
  // ถ้า uid ยังมาไม่ถึง (เซิร์ฟเวอร์ตอบ authed ช้ากว่าการวาดหน้าจอ) ให้สุ่มไปเลย
  // ไม่งั้นทุกคนจะได้ลุคจาก seed ว่างเปล่าเหมือนกันหมดทั้งห้อง
  const [look, setLook] = useState<AvatarLook>(() => (seed ? lookFromSeed(seed) : randomLook()))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError(null)
    setBusy(true)
    const result = await backend.joinRoom(pin.trim(), {
      name: name.trim(),
      look,
      team: '',
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.reason ?? 'เข้าห้องไม่สำเร็จ')
      return
    }
    sfx.join()
    onJoined(pin.trim())
  }

  if (pending) {
    return (
      <div className="max-w-md mx-auto pt-16 text-center">
        <p className="text-ink/70">กำลังเข้าห้อง…</p>
        <button type="button" onClick={onCancel} className="text-accent-deep text-sm mt-4 underline">
          ยกเลิก
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto pt-4">
      <div className="pop-card p-6">
        <h1 className="font-display text-xl text-ink mb-4">เข้าห้องแข่ง</h1>

        <label className="block text-ink/70 text-sm mb-1.5">PIN 6 หลัก (ดูจากจอหน้าห้อง)</label>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          placeholder="123456"
          className="tabular w-full rounded-2xl border-2 border-line bg-white px-4 py-3 text-2xl text-center tracking-[0.3em] text-ink focus:outline-none focus:ring-2 focus:ring-accent mb-4"
        />

        <label className="block text-ink/70 text-sm mb-1.5">ชื่อที่จะขึ้นบนกระดาน</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 24))}
          placeholder="ชื่อเล่นก็ได้"
          className="w-full rounded-2xl border-2 border-line bg-white px-4 py-2.5 text-ink focus:outline-none focus:ring-2 focus:ring-accent mb-4"
        />

        <AvatarStudio look={look} onChange={setLook} />

        {error && (
          <p className="flex items-center gap-1.5 text-rose-700 text-sm mb-3">
            <AlertCircle size={15} /> {error}
          </p>
        )}

        <button
          type="button"
          disabled={pin.length !== 6 || !name.trim() || busy}
          onClick={submit}
          className="pop-btn bg-accent text-white w-full py-3 font-medium disabled:opacity-50"
        >
          เข้าห้อง
        </button>
      </div>
    </div>
  )
}

// ---------- แต่งตัวละคร ----------

const RING_LABEL: Record<string, string> = {
  '': 'ไม่มีกรอบ',
  solid: 'เส้นทึบ',
  double: 'เส้นคู่',
  dashed: 'เส้นประ',
  dotted: 'จุด',
  glow: 'เรืองแสง',
}

function AvatarStudio({
  look,
  onChange,
}: {
  look: AvatarLook
  onChange: (look: AvatarLook) => void
}) {
  const rows = [
    { key: 'base' as const, label: 'สัตว์', options: AVATAR_PARTS.bases, cols: 'grid-cols-7' },
    { key: 'badge' as const, label: 'เหรียญ', options: AVATAR_PARTS.badges, cols: 'grid-cols-6' },
  ]

  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-3">
        <PlayerAvatar look={look} size={60} />
        <p className="flex-1 min-w-0 text-ink text-sm font-medium">แต่งตัวละคร</p>
        <button
          type="button"
          onClick={() => onChange(randomLook())}
          className="shrink-0 rounded-full bg-ink/5 hover:bg-ink/10 px-3 py-2 text-ink/70 text-xs inline-flex items-center gap-1.5"
        >
          <Shuffle size={14} /> สุ่มลุค
        </button>
      </div>

      <p className="text-ink/60 text-xs mb-1.5">สีพื้น</p>
      <div className="grid grid-cols-8 gap-1.5 mb-3">
        {AVATAR_PARTS.colors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange({ ...look, color: c })}
            aria-label={`เลือกสีพื้น ${c}`}
            className={`aspect-square rounded-full transition-transform hover:-translate-y-0.5 ${
              look.color === c ? 'ring-2 ring-offset-2 ring-accent ring-offset-surface' : ''
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <p className="text-ink/60 text-xs mb-1.5">กรอบ</p>
      <div className="grid grid-cols-6 gap-1.5 mb-3">
        {AVATAR_PARTS.rings.map((r) => (
          <button
            key={r || 'none'}
            type="button"
            onClick={() => onChange({ ...look, ring: r })}
            aria-label={`เลือกกรอบ ${RING_LABEL[r] ?? r}`}
            className={`flex aspect-square items-center justify-center rounded-xl transition-transform hover:-translate-y-0.5 ${
              look.ring === r ? 'bg-accent/20 ring-2 ring-accent' : 'bg-ink/5'
            }`}
          >
            <span
              className="block h-5 w-5 rounded-full bg-white"
              style={ringStyle(r)}
            />
          </button>
        ))}
      </div>

      {rows.map((row) => (
        <div key={row.key}>
          <p className="text-ink/60 text-xs mb-1.5">{row.label}</p>
          <div className={`grid ${row.cols} gap-1.5 mb-3`}>
            {row.options.map((option) => (
              <button
                key={option || 'none'}
                type="button"
                onClick={() => onChange({ ...look, [row.key]: option })}
                aria-label={option ? `เลือก ${option}` : `ไม่ใส่${row.label}`}
                className={`aspect-square rounded-xl text-lg flex items-center justify-center transition-transform hover:-translate-y-0.5 ${
                  look[row.key] === option ? 'bg-accent/20 ring-2 ring-accent' : 'bg-ink/5'
                }`}
              >
                {option || <span className="text-ink/35 text-xs">ไม่มี</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------- ตัวเกม ----------

function PlayerGame({
  room,
  uid,
  pin,
  onLeave,
}: {
  room: RoomSnapshot
  uid: string
  pin: string
  onLeave: () => void
}) {
  const me = room.me!
  const [optimistic, setOptimistic] = useState<{ round: number; bin: BinId } | null>(null)

  const storedAnswer = backend.getMyAnswer(pin, room.roundIndex)
  const myAnswer =
    storedAnswer ?? (optimistic?.round === room.roundIndex ? optimistic.bin : null)

  useEffect(() => {
    setOptimistic(null)
  }, [room.roundIndex])

  // แสดงผลทันทีที่แตะเพื่อให้รู้สึกไว แต่ถ้าระบบไม่รับคำตอบ (ส่งไม่ทันเวลา)
  // ต้องถอนออก ไม่งั้นหน้าจอจะบอกว่า "ส่งคำตอบแล้ว" ทั้งที่ไม่ได้คะแนน
  const answer = async (bin: BinId) => {
    const round = room.roundIndex
    setOptimistic({ round, bin })
    const accepted = await backend.submitAnswer(pin, round, bin)
    if (!accepted) {
      setOptimistic((current) => (current?.round === round ? null : current))
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <PhaseSounds room={room} lastCorrect={me.lastCorrect} />
      <PlayerHeader room={room} score={me.score} rank={me.rank} />

      <motion.div
        key={`${room.phase}-${room.roundIndex}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
          {room.phase === 'lobby' && <PlayerLobby room={room} onLeave={onLeave} />}
          {room.phase === 'countdown' && <PhaseCountdown room={room} />}
          {room.phase === 'answering' && room.round && (
            <AnsweringView room={room} myAnswer={myAnswer} onAnswer={(bin) => void answer(bin)} />
          )}
          {room.phase === 'reveal' && <RevealView room={room} myAnswer={myAnswer} lastGain={me.lastGain} />}
          {room.phase === 'explain' && <ExplainView room={room} />}
          {room.phase === 'board' && <BoardView room={room} uid={uid} rank={me.rank} />}
          {room.phase === 'finale' && <PlayerFinale room={room} uid={uid} />}
          {room.phase === 'ended' && <PlayerSummary room={room} uid={uid} />}
      </motion.div>
    </div>
  )
}

function PlayerHeader({ room, score, rank }: { room: RoomSnapshot; score: number; rank: number }) {
  const playing = room.status === 'running'
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <p className="text-ink/60 text-sm">
        {playing
          ? `ข้อ ${room.roundIndex + 1} / ${room.totalRounds}`
          : room.status === 'finished'
            ? 'จบเกมแล้ว'
            : 'ห้องรอเริ่มเกม'}
      </p>
      <p className="text-ink/60 text-sm">
        <span className="tabular text-accent-deep text-lg font-semibold">
          {score.toLocaleString('th-TH')}
        </span>{' '}
        คะแนน{(playing || room.status === 'finished') && rank > 0 && ` · อันดับ ${rank}`}
      </p>
    </div>
  )
}

function PlayerLobby({ room, onLeave }: { room: RoomSnapshot; onLeave: () => void }) {
  const me = room.me!
  return (
    <div className="pop-card p-6 text-center">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mb-3"
      >
        <PlayerAvatar look={me.look} size={88} />
      </motion.div>
      <p className="text-ink text-lg font-medium mb-6">{me.name}</p>

      <p className="text-ink/70 text-sm mb-2">เข้าห้องแล้ว รอสตาฟเริ่มเกม</p>
      <p className="text-ink/55 text-sm mb-6">
        ตอนนี้มี <span className="tabular text-accent-deep font-medium">{room.playerCount}</span> คนในห้อง
        — ดูรายชื่อทั้งหมดได้ที่จอหน้าห้อง
      </p>

      <button type="button" onClick={onLeave} className="text-ink/50 text-sm underline">
        ออกจากห้อง
      </button>
    </div>
  )
}

function PhaseCountdown({ room }: { room: RoomSnapshot }) {
  const now = useNow()
  const seconds = Math.max(1, Math.ceil((room.phaseEndsAt - now) / 1000))
  return (
    <div className="pop-card py-16 text-center">
      <p className="text-ink/60 mb-2">ข้อ {room.roundIndex + 1} พร้อมนะ</p>
      <motion.p
        key={seconds}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="font-display text-8xl text-accent-deep tabular"
      >
        {seconds}
      </motion.p>
    </div>
  )
}

function AnsweringView({
  room,
  myAnswer,
  onAnswer,
}: {
  room: RoomSnapshot
  myAnswer: BinId | null
  onAnswer: (bin: BinId) => void
}) {
  const endsAt = (room.round?.startedAt ?? 0) + LIVE_CONFIG.answerMs

  return (
    <div className="pop-card p-5 sm:p-6">
      <DragArena
        itemName={room.round!.itemName}
        itemImage={room.round!.itemImage}
        itemEmoji={room.round!.itemEmoji}
        answered={myAnswer}
        disabled={false}
        onAnswer={onAnswer}
        countdown={{ endsAt, totalMs: LIVE_CONFIG.answerMs }}
      />

      <p className="text-ink/45 text-xs text-center mt-4 tabular">
        ตอบแล้ว {room.answeredCount} / {room.playerCount} คน
      </p>
    </div>
  )
}

function RevealView({
  room,
  myAnswer,
  lastGain,
}: {
  room: RoomSnapshot
  myAnswer: BinId | null
  lastGain: number
}) {
  const reveal = room.reveal
  if (!reveal) return null
  const correct = myAnswer === reveal.correctBin
  const bin = binById(reveal.correctBin)

  return (
    <div className="pop-card p-6 text-center">
      {correct && <Confetti count={30} seed={room.roundIndex} />}

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white ${
          correct ? 'bg-emerald-500' : 'bg-rose-500'
        }`}
      >
        {correct ? <Check size={44} /> : <X size={44} />}
      </motion.div>

      <p className="font-display text-2xl text-ink mb-1">
        {correct ? 'ถูกต้อง!' : myAnswer ? 'ยังไม่ใช่' : 'ตอบไม่ทัน'}
      </p>
      <p className="text-ink/65 text-sm mb-4">
        {room.round?.itemName} ต้องทิ้ง{bin.type} ({bin.name})
      </p>

      {lastGain > 0 && (
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="tabular text-emerald-700 text-3xl font-semibold mb-5"
        >
          +{lastGain}
        </motion.p>
      )}

      <AnswerBars
        distribution={reveal.distribution}
        correctBin={reveal.correctBin}
        myBin={myAnswer}
      />
    </div>
  )
}

function ExplainView({ room }: { room: RoomSnapshot }) {
  const reveal = room.reveal
  if (!reveal) return null
  const bin = binById(reveal.correctBin)

  return (
    <div className="pop-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <MascotBin color={bin.color} mood="correct" className="w-16 shrink-0" />
        <div>
          <p className="text-ink/55 text-xs">คำตอบที่ถูกต้อง</p>
          <p className="text-ink text-lg font-medium">
            {bin.type} · {bin.name}
          </p>
        </div>
      </div>
      <p className="text-ink/80 text-[15px] leading-relaxed">{reveal.explanation}</p>
      {reveal.source && (
        <a
          href={reveal.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-start gap-1.5 text-accent-deep text-xs leading-snug underline decoration-accent-deep/40 underline-offset-2"
        >
          <ExternalLink size={13} className="shrink-0 mt-0.5" />
          <span>ที่มา: {reveal.source.label}</span>
        </a>
      )}
    </div>
  )
}

function BoardView({ room, uid, rank }: { room: RoomSnapshot; uid: string; rank: number }) {
  return (
    <div className="pop-card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-ink font-medium">อันดับตอนนี้</p>
        <p className="text-ink/60 text-sm">
          คุณอยู่อันดับ <span className="tabular text-accent-deep font-semibold">{rank}</span> จาก{' '}
          {room.playerCount}
        </p>
      </div>
      <Leaderboard entries={room.board} highlightUid={uid} limit={5} />
    </div>
  )
}

function PlayerFinale({ room, uid }: { room: RoomSnapshot; uid: string }) {
  const revealed = room.board.filter((e) => e.rank > room.board.length - room.finaleStep)
  const nextRank = room.board.length - room.finaleStep

  return (
    <div className="pop-card p-5 text-center">
      <p className="font-display text-xl text-ink mb-1">ประกาศผล</p>
      <p className="text-ink/55 text-sm mb-5">
        {nextRank > 0 ? `กำลังเฉลยอันดับ ${nextRank}…` : 'ครบทุกอันดับแล้ว'}
      </p>
      <Leaderboard entries={revealed} highlightUid={uid} />
    </div>
  )
}

function PlayerSummary({ room, uid }: { room: RoomSnapshot; uid: string }) {
  const me = room.me!
  const champion = room.board[0]

  // อ่านผลจาก me.results ที่ระบบบันทึกไว้ตอนคิดคะแนน
  // ถ้าไปเทียบคำตอบดิบเองตรงนี้ ข้อที่ตอบไม่ทันจะขึ้นว่าถูก ทั้งที่ไม่ได้คะแนน
  const wrong = room.history
    .map((h) => ({ ...h, result: me.results?.[h.round.index] }))
    .filter((r) => !r.result?.correct)

  return (
    <div className="space-y-4">
      {champion?.uid === uid && <Confetti count={70} seed="win" />}

      <div className="pop-card p-6 text-center">
        <p className="text-ink/55 text-sm mb-1">จบเกมแล้ว</p>
        <p className="font-display text-5xl text-accent-deep tabular mb-1">
          {me.score.toLocaleString('th-TH')}
        </p>
        <p className="text-ink/65 text-sm">
          อันดับ {me.rank} จาก {room.playerCount} · ตอบถูก {me.correct} / {room.totalRounds} ข้อ
        </p>
      </div>

      <div className="pop-card p-5">
        <p className="text-ink font-medium mb-3">10 อันดับแรก</p>
        <Leaderboard entries={room.board} highlightUid={uid} />
      </div>

      <div className="pop-card p-5">
        <p className="text-ink font-medium mb-1">ข้อที่ยังไม่ถูก ({wrong.length} ข้อ)</p>
        <p className="text-ink/55 text-xs mb-4">อ่านทวนตรงนี้ได้ ครั้งหน้าจะไม่พลาดอีก</p>
        {wrong.length === 0 ? (
          <p className="text-emerald-700 text-sm">ถูกหมดทุกข้อ เก่งมาก</p>
        ) : (
          <ul className="space-y-3">
            {wrong.map((r) => {
              const correctBin = binById(r.reveal.correctBin)
              const mineBin = r.result?.bin ? binById(r.result.bin) : null
              return (
                <li key={r.round.index} className="rounded-2xl bg-ink/[0.04] p-3">
                  <p className="text-ink text-sm font-medium mb-1">
                    {r.round.itemEmoji} {r.round.itemName}
                  </p>
                  <p className="text-ink/70 text-xs mb-2">
                    คุณตอบ {mineBin ? mineBin.type : 'ไม่ทัน'} · ที่ถูกคือ{' '}
                    <span className="text-emerald-700 font-medium">{correctBin.type}</span>
                  </p>
                  <p className="text-ink/75 text-xs leading-relaxed">{r.reveal.explanation}</p>
                  {r.reveal.source && (
                    <a
                      href={r.reveal.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-start gap-1 text-accent-deep text-[11px] leading-snug underline decoration-accent-deep/40 underline-offset-2"
                    >
                      <ExternalLink size={11} className="shrink-0 mt-0.5" />
                      <span>{r.reveal.source.label}</span>
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <a
        href="#"
        className="pop-btn bg-accent text-white block text-center py-3 font-medium"
      >
        กลับหน้าแรก
      </a>
    </div>
  )
}

// ---------- เสียงตามจังหวะเกม ----------

// คอมโพเนนต์ที่ไม่วาดอะไรเลย มีไว้กักนาฬิกา 60fps ของเสียงไว้ตรงนี้
// ถ้าเรียก hook นี้ตรงๆ ในหน้าเกม ทั้งหน้าจะ re-render ทุกเฟรมตอนนับถอยหลัง
function PhaseSounds({ room, lastCorrect }: { room: RoomSnapshot; lastCorrect: boolean | null }) {
  usePhaseSounds(room, lastCorrect)
  return null
}

function usePhaseSounds(room: RoomSnapshot, lastCorrect: boolean | null) {
  const now = useNow(room.phase === 'countdown' || room.phase === 'answering')
  const lastTick = useRef(-1)
  const lastPhase = useRef('')
  const lastFinale = useRef(-1)

  const seconds = Math.ceil(Math.max(0, room.phaseEndsAt - now) / 1000)

  useEffect(() => {
    const key = `${room.phase}-${room.roundIndex}`
    if (lastPhase.current === key) return
    lastPhase.current = key
    if (room.phase === 'reveal') {
      if (lastCorrect) sfx.correct()
      else sfx.wrong()
    }
  }, [room.phase, room.roundIndex, lastCorrect])

  useEffect(() => {
    if (room.phase !== 'answering' && room.phase !== 'countdown') return
    if (seconds === lastTick.current) return
    lastTick.current = seconds
    if (room.phase === 'countdown' && seconds <= 3 && seconds > 0) sfx.countdown(seconds - 1)
    if (room.phase === 'answering' && seconds <= 3 && seconds > 0) sfx.tick()
  }, [seconds, room.phase])

  useEffect(() => {
    if (room.phase !== 'finale') return
    if (room.finaleStep === lastFinale.current) return
    lastFinale.current = room.finaleStep
    if (room.finaleStep === 0) sfx.drumroll()
    else if (room.finaleStep >= room.board.length) sfx.fanfare()
    else sfx.drumroll()
  }, [room.phase, room.finaleStep, room.board.length])
}
