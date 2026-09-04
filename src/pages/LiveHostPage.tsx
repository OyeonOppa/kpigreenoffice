import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Forward, Pause, Play, Plus } from 'lucide-react'
import { LIVE_GAME, WASTE } from '../content'
import { IS_REHEARSAL, LIVE_CONFIG, backend, type BinId, type RoomSnapshot } from '../game'
import { useAuth, useNow, useRoom } from '../game/hooks'
import { sfx } from '../game/sfx'
import AnswerBars from '../components/live/AnswerBars'
import Confetti from '../components/live/Confetti'
import GameItemImage from '../components/GameItemImage'
import Leaderboard from '../components/live/Leaderboard'
import JoinQr from '../components/live/JoinQr'
import LiveShell from '../components/live/LiveShell'
import MascotBin from '../components/live/MascotBin'
import PlayerAvatar from '../components/live/PlayerAvatar'

const HOST_PIN_KEY = 'kpi-live:host-pin'

// ห้องใหญ่ๆ ไม่วาดครบทุกคน — โชว์คนที่เพิ่งเข้าล่าสุด คนที่พึ่งสแกนจะได้เห็นตัวเองขึ้นจอ
const LOBBY_WALL_LIMIT = 60

const binById = (id: BinId) => WASTE.bins.find((b) => b.id === id)!

const joinUrl = () =>
  `${window.location.origin}${window.location.pathname}${LIVE_GAME.joinPath}`

// URL ที่ใส่ไว้ใน QR — พ่วง PIN ไปด้วยเพื่อสแกนแล้วกรอก PIN ให้อัตโนมัติ
// (ยังพิมพ์เองได้ตามปกติ อันนี้แค่ลัดขั้นตอนให้คนที่สแกน)
const joinUrlWithPin = (pin: string) => `${joinUrl()}?pin=${pin}`

export default function LiveHostPage() {
  const { user, signIn } = useAuth()

  // ไม่มีหน้าล็อกอินแล้ว — เครื่องที่เปิด #/live/host ขึ้นมาคือสตาฟ
  // สร้างตัวตนให้อัตโนมัติเพื่อใช้เป็นเจ้าของห้อง (คนแรกที่สร้างห้อง = คุมเกมได้)
  useEffect(() => {
    if (!user) void signIn('เจ้าหน้าที่ผู้ดูแลเกม')
  }, [user, signIn])

  const [pin, setPin] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(HOST_PIN_KEY)
    } catch {
      return null
    }
  })
  const room = useRoom(pin)

  // ตัวจับเวลาของเกมรันอยู่บนเครื่องสตาฟเครื่องนี้เครื่องเดียว
  useEffect(() => {
    if (!pin) return
    return backend.runHostLoop(pin)
  }, [pin])

  const setHostPin = (value: string | null) => {
    setPin(value)
    try {
      if (value) sessionStorage.setItem(HOST_PIN_KEY, value)
      else sessionStorage.removeItem(HOST_PIN_KEY)
    } catch {
      // ไม่เป็นไร
    }
  }

  if (!user || !pin || !room) {
    return (
      <LiveShell>
        <div className="max-w-md mx-auto pt-10 pop-card p-7 text-center">
          <h1 className="font-display text-2xl text-ink mb-2">สร้างห้องแข่ง</h1>
          <p className="text-ink/60 text-sm mb-6">
            ระบบจะสุ่มคำถาม {LIVE_CONFIG.totalRounds} ข้อ แล้วออก PIN ให้ผู้เล่นเข้าห้อง
          </p>
          <button
            type="button"
            onClick={async () => setHostPin(await backend.createRoom())}
            className="pop-btn bg-accent text-white w-full py-3 font-medium"
          >
            สร้างห้องใหม่
          </button>
          {pin && (
            <button
              type="button"
              onClick={() => setHostPin(null)}
              className="text-ink/50 text-sm underline mt-4"
            >
              ล้างห้องเดิม
            </button>
          )}
        </div>
      </LiveShell>
    )
  }

  return (
    <LiveShell fill topRight={<HostControls room={room} pin={pin} onReset={() => setHostPin(null)} />}>
      {!room.isHost && (
        <p className="text-center text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 text-xs max-w-fit mx-auto mb-3">
          คุณไม่ใช่สตาฟของห้องนี้ — ดูได้อย่างเดียว ปุ่มควบคุมกดไม่ได้
        </p>
      )}
      <HostStage room={room} pin={pin} />
    </LiveShell>
  )
}

// ---------- แถบควบคุมของสตาฟ ----------

// คนแรกที่เข้าห้อง #/live/host = สตาฟตัวจริง คนอื่นที่เปิดลิงก์เดียวกันมา (แชร์ลิงก์ผิด,
// เปิดซ้ำอีกแท็บ) จะเห็นจอเหมือนกันแต่กดปุ่มควบคุมไม่ได้จริง — ซ่อนปุ่มไปเลยดีกว่าโชว์ปุ่ม
// ที่กดแล้วเซิร์ฟเวอร์เงียบๆ ไม่ทำตาม ซึ่งทำให้ดูเหมือนเว็บค้าง
function HostControls({
  room,
  pin,
  onReset,
}: {
  room: RoomSnapshot
  pin: string
  onReset: () => void
}) {
  if (!room.isHost) return null

  const downloadCsv = () => {
    const csv = backend.exportCsv(pin)
    // นำหน้าด้วย BOM ไม่งั้น Excel บนวินโดวส์เปิดแล้วภาษาไทยเป็นตัวต่างดาว
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `คะแนนเกมแยกขยะ-${pin}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex items-center gap-2">
      {room.status === 'running' && (
        <>
          <button
            type="button"
            onClick={() => void backend.togglePause(pin)}
            className="rounded-full bg-ink/5 hover:bg-ink/10 px-3 py-1.5 text-ink/70 text-xs inline-flex items-center gap-1.5"
          >
            {room.paused ? <Play size={14} /> : <Pause size={14} />}
            {room.paused ? 'เล่นต่อ' : 'พัก'}
          </button>
          <button
            type="button"
            onClick={() => void backend.skipPhase(pin)}
            className="rounded-full bg-ink/5 hover:bg-ink/10 px-3 py-1.5 text-ink/70 text-xs inline-flex items-center gap-1.5"
          >
            <Forward size={14} /> ข้าม
          </button>
        </>
      )}
      {room.phase === 'finale' && (
        <button
          type="button"
          onClick={() => void backend.nextFinale(pin)}
          className="rounded-full bg-accent text-white px-3 py-1.5 text-xs"
        >
          เฉลยคนต่อไป
        </button>
      )}
      {room.status === 'finished' && (
        <>
          <button
            type="button"
            onClick={downloadCsv}
            className="rounded-full bg-ink/5 hover:bg-ink/10 px-3 py-1.5 text-ink/70 text-xs inline-flex items-center gap-1.5"
          >
            <Download size={14} /> โหลดคะแนน CSV
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-full bg-ink/5 hover:bg-ink/10 px-3 py-1.5 text-ink/70 text-xs"
          >
            ห้องใหม่
          </button>
        </>
      )}
    </div>
  )
}

// ---------- เวทีหลัก ----------

function HostStage({ room, pin }: { room: RoomSnapshot; pin: string }) {
  return (
    <div className="h-full max-w-6xl 2xl:max-w-[92rem] mx-auto flex flex-col">
      <HostSounds room={room} />
      {room.status === 'running' && (
        <div className="flex items-center justify-between text-ink/55 text-sm 2xl:text-lg mb-3 shrink-0">
          <span className="tabular">
            ข้อ {room.roundIndex + 1} / {room.totalRounds}
          </span>
          <span className="tabular">PIN {room.pin}</span>
          <span className="tabular">{room.playerCount} คน</span>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <motion.div
          key={`${room.phase}-${room.roundIndex}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="h-full"
        >
          {room.phase === 'lobby' && <HostLobby room={room} pin={pin} />}
          {room.phase === 'countdown' && <HostCountdown room={room} />}
          {room.phase === 'answering' && <HostAnswering room={room} />}
          {room.phase === 'reveal' && <HostReveal room={room} />}
          {room.phase === 'explain' && <HostExplain room={room} />}
          {room.phase === 'board' && <HostBoard room={room} />}
          {(room.phase === 'finale' || room.phase === 'ended') && <HostFinale room={room} />}
        </motion.div>
      </div>
    </div>
  )
}

function HostLobby({ room, pin }: { room: RoomSnapshot; pin: string }) {
  return (
    <div className="h-full grid lg:grid-cols-[1fr_1.1fr] gap-6 items-center">
      <div className="pop-card p-8 text-center">
        <div className="flex justify-center mb-6">
          <JoinQr url={joinUrlWithPin(room.pin)} size={200} className="ring-4 ring-white shadow-lg" />
        </div>

        <p className="text-ink/55 text-sm mb-2">สแกนแล้วเข้าห้องได้เลย หรือพิมพ์เอง</p>
        <p className="text-ink text-base sm:text-lg font-medium break-all mb-6">{joinUrl()}</p>

        <p className="text-ink/55 text-sm mb-1">PIN ห้อง</p>
        <p className="tabular font-display text-6xl sm:text-8xl text-accent-deep tracking-[0.15em] mb-6">
          {room.pin}
        </p>

        <div className="flex justify-center gap-2 mb-6">
          {WASTE.bins.map((bin, i) => (
            <motion.div
              key={bin.id}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.2 }}
            >
              <MascotBin color={bin.color} className="w-14 sm:w-20" />
            </motion.div>
          ))}
        </div>

        {room.isHost ? (
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              disabled={room.playerCount === 0}
              onClick={() => void backend.startGame(pin)}
              className="pop-btn bg-accent text-white px-8 py-3 font-medium disabled:opacity-50"
            >
              เริ่มเกม
            </button>
            {IS_REHEARSAL && (
              <button
                type="button"
                onClick={() => void backend.addBots(pin, 8)}
                className="rounded-full bg-ink/5 hover:bg-ink/10 px-4 py-3 text-ink/70 text-sm inline-flex items-center gap-1.5"
              >
                <Plus size={15} /> เพิ่มผู้เล่นซ้อม 8 คน
              </button>
            )}
          </div>
        ) : (
          <p className="text-ink/50 text-sm">รอสตาฟตัวจริงกดเริ่มเกม</p>
        )}
      </div>

      <div className="pop-card p-6 h-full max-h-[70vh] overflow-y-auto">
        <p className="text-ink font-medium mb-4">
          เข้าห้องแล้ว <span className="tabular text-accent-deep">{room.playerCount}</span> คน
        </p>
        {room.playerCount === 0 ? (
          <p className="text-ink/50 text-sm">รอผู้เล่นสแกน PIN เข้ามา…</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {room.players.length > LOBBY_WALL_LIMIT && (
              <span className="inline-flex items-center rounded-full bg-ink/[0.05] px-4 py-1.5 text-ink/60 text-sm">
                และอีก {room.players.length - LOBBY_WALL_LIMIT} คน
              </span>
            )}
            <AnimatePresence>
              {room.players.slice(-LOBBY_WALL_LIMIT).map((p) => (
                <motion.span
                  key={p.uid}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="inline-flex items-center gap-2 rounded-full bg-ink/[0.05] pl-2 pr-4 py-1.5"
                >
                  <PlayerAvatar look={p.look} size={30} />
                  <span className="text-ink text-sm">{p.name}</span>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

function HostCountdown({ room }: { room: RoomSnapshot }) {
  const now = useNow()
  const seconds = Math.max(1, Math.ceil((room.phaseEndsAt - now) / 1000))
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <p className="text-ink/60 text-xl sm:text-2xl mb-4">ข้อ {room.roundIndex + 1} พร้อมนะ</p>
      <motion.p
        key={seconds}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className="font-display text-[9rem] sm:text-[14rem] leading-none text-accent-deep tabular"
      >
        {seconds}
      </motion.p>
    </div>
  )
}

// แถบเวลาบนจอกลาง — แยกเป็นคอมโพเนนต์ของตัวเองเพื่อกักนาฬิกา 60fps ไว้ตรงนี้
function PhaseProgressBar({ endsAt, totalMs }: { endsAt: number; totalMs: number }) {
  const now = useNow()
  const remaining = Math.max(0, Math.min(totalMs, endsAt - now))
  const seconds = Math.ceil(remaining / 1000)

  return (
    <div className="h-3 rounded-full bg-ink/10 overflow-hidden mb-6 shrink-0">
      <div
        className="h-full rounded-full transition-[width] duration-100"
        style={{
          width: `${(remaining / totalMs) * 100}%`,
          backgroundColor: seconds <= 3 ? 'oklch(58% 0.21 28)' : 'var(--color-accent)',
        }}
      />
    </div>
  )
}

function HostCountdownNumber({ endsAt }: { endsAt: number }) {
  const now = useNow()
  const seconds = Math.max(0, Math.ceil((endsAt - now) / 1000))
  const urgent = seconds <= 3

  return (
    <div className="flex items-baseline justify-center gap-2 mb-2 shrink-0">
      <motion.span
        key={seconds}
        initial={{ scale: urgent ? 1.35 : 1, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="font-display tabular leading-none text-6xl sm:text-8xl 2xl:text-9xl"
        style={{ color: urgent ? 'oklch(58% 0.21 28)' : 'var(--color-accent-deep)' }}
      >
        {seconds}
      </motion.span>
      <span className="text-ink/50 text-lg sm:text-2xl">วินาที</span>
    </div>
  )
}

function HostAnswering({ room }: { room: RoomSnapshot }) {
  const endsAt = (room.round?.startedAt ?? 0) + LIVE_CONFIG.answerMs

  return (
    <div className="h-full flex flex-col">
      <HostCountdownNumber endsAt={endsAt} />
      <PhaseProgressBar endsAt={endsAt} totalMs={LIVE_CONFIG.answerMs} />

      <div className="flex-1 min-h-0 grid lg:grid-cols-2 gap-6 items-center">
        <div className="text-center">
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 2.4, repeat: Infinity }}>
            <GameItemImage
              src={room.round?.itemImage ?? ''}
              emoji={room.round?.itemEmoji ?? '🗑️'}
              className="w-40 sm:w-56 lg:w-64"
            />
          </motion.div>
          <p className="font-display text-3xl sm:text-5xl 2xl:text-7xl text-ink">{room.round?.itemName}</p>
          <p className="text-ink/55 mt-2">ทิ้งถังไหนดี?</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          {WASTE.bins.map((bin) => (
            <div key={bin.id} className="pop-card flex flex-col items-center py-3">
              <MascotBin color={bin.color} className="w-20 sm:w-28" />
              <p className="text-ink text-base sm:text-xl 2xl:text-3xl font-medium mt-1">{bin.type}</p>
              <p className="text-ink/50 text-xs sm:text-sm">{bin.name}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-ink/60 tabular text-lg mt-4 shrink-0">
        ตอบแล้ว {room.answeredCount} / {room.playerCount} คน
      </p>
    </div>
  )
}

function HostReveal({ room }: { room: RoomSnapshot }) {
  const reveal = room.reveal
  if (!reveal) return null
  const bin = binById(reveal.correctBin)

  return (
    <div className="h-full grid lg:grid-cols-2 gap-6 items-center">
      <div className="pop-card p-8 text-center">
        <p className="text-ink/55 mb-3">{room.round?.itemName} ต้องทิ้ง</p>
        <MascotBin color={bin.color} mood="correct" className="w-32 sm:w-44 mx-auto" />
        <p className="font-display text-3xl sm:text-5xl text-ink mt-3">{bin.type}</p>
        <p className="text-ink/60 text-lg">{bin.name}</p>
      </div>
      <div className="pop-card p-6">
        <p className="text-ink font-medium mb-4">คนในห้องเลือกถังไหนกันบ้าง</p>
        <AnswerBars distribution={reveal.distribution} correctBin={reveal.correctBin} />
      </div>
    </div>
  )
}

function HostExplain({ room }: { room: RoomSnapshot }) {
  const reveal = room.reveal
  if (!reveal) return null
  const bin = binById(reveal.correctBin)

  return (
    <div className="h-full flex items-center">
      <div className="pop-card p-8 sm:p-12 w-full">
        <div className="flex items-center gap-4 mb-5">
          <MascotBin color={bin.color} mood="correct" className="w-20 shrink-0" />
          <div>
            <p className="text-ink/55 text-sm">ทำไมต้องทิ้งถังนี้</p>
            <p className="font-display text-2xl sm:text-3xl text-ink">
              {room.round?.itemName} → {bin.type}
            </p>
          </div>
        </div>
        <p className="text-ink/85 text-xl sm:text-3xl leading-relaxed">{reveal.explanation}</p>
        {reveal.source && (
          <p className="text-ink/45 text-base sm:text-lg mt-6">
            อ้างอิง: {reveal.source.label} — {reveal.source.url}
          </p>
        )}
      </div>
    </div>
  )
}

function HostBoard({ room }: { room: RoomSnapshot }) {
  return (
    <div className="h-full max-w-3xl w-full mx-auto">
      {/* จอกลางห้ามมีสกรอลล์ — 10 อันดับต้องเห็นครบพร้อมกันจากหลังห้อง */}
      <div className="pop-card p-4 sm:p-6 h-full flex flex-col overflow-hidden">
        <p className="font-display text-xl sm:text-2xl text-ink mb-3 shrink-0">อันดับตอนนี้</p>
        <div className="flex-1 min-h-0">
          <Leaderboard entries={room.board} size="lg" fill />
        </div>
      </div>
    </div>
  )
}

function HostFinale({ room }: { room: RoomSnapshot }) {
  const total = room.board.length
  const revealedFrom = total - room.finaleStep
  const done = room.phase === 'ended'
  const champion = room.board[0]

  return (
    <div className="h-full flex flex-col">
      {done && <Confetti count={90} seed="final" />}

      <p className="font-display text-2xl sm:text-4xl text-ink text-center mb-0.5 shrink-0">
        {done ? 'ผู้ชนะเกมแยกขยะ' : 'ประกาศผล 10 อันดับ'}
      </p>
      <p className="text-ink/55 text-center text-sm sm:text-base mb-3 shrink-0">
        {done
          ? `${champion?.name ?? '-'} · ${champion?.score.toLocaleString('th-TH') ?? 0} คะแนน`
          : 'เฉลยจากอันดับท้ายขึ้นไปหาที่หนึ่ง'}
      </p>

      {/* แบ่งความสูงที่เหลือให้ทุกอันดับเท่าๆ กัน — การเฉลยไล่จากอันดับท้ายขึ้นมา
          ถ้าปล่อยให้ล้นแล้วเลื่อนเอา แถวที่เฉลยก่อนคือแถวที่ตกใต้ขอบจอพอดี */}
      <div
        className="flex-1 min-h-0 max-w-3xl w-full mx-auto grid gap-1.5 sm:gap-2"
        style={{ gridTemplateRows: `repeat(${Math.max(room.board.length, 1)}, minmax(0, 1fr))` }}
      >
        {room.board.map((entry) => {
          const revealed = entry.rank > revealedFrom
          const isLatest = entry.rank === revealedFrom + 1 && !done
          return (
            <motion.div
              key={entry.rank}
              animate={
                isLatest ? { scale: [0.9, 1.04, 1], opacity: 1 } : { scale: 1, opacity: 1 }
              }
              transition={{ duration: 0.5 }}
              className={`flex items-center gap-3 sm:gap-4 min-h-0 overflow-hidden rounded-3xl px-4 sm:px-5 ${
                revealed
                  ? entry.rank === 1
                    ? 'bg-amber-100 ring-2 ring-amber-400'
                    : 'bg-ink/[0.05]'
                  : 'bg-ink/[0.02] border border-dashed border-line'
              }`}
            >
              <span className="tabular w-10 sm:w-12 shrink-0 text-center text-xl sm:text-2xl font-semibold text-ink/70">
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
              </span>
              {revealed ? (
                <>
                  <PlayerAvatar look={entry.look} size={38} />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-ink text-lg sm:text-xl font-medium">
                      {entry.name}
                    </span>
                  </span>
                  <span className="tabular text-ink text-xl sm:text-2xl font-semibold">
                    {entry.score.toLocaleString('th-TH')}
                  </span>
                </>
              ) : (
                <span className="flex-1 text-ink/30 text-lg sm:text-xl tracking-[0.4em]">? ? ?</span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ---------- เสียงบนจอกลาง ----------

// คอมโพเนนต์ที่ไม่วาดอะไร มีไว้กักนาฬิกา 60fps ของเสียงไว้ตรงนี้
function HostSounds({ room }: { room: RoomSnapshot }) {
  useHostSounds(room)
  return null
}

function useHostSounds(room: RoomSnapshot) {
  const now = useNow(room.phase === 'countdown' || room.phase === 'answering')
  const lastTick = useRef(-1)
  const lastFinale = useRef(-1)
  const seconds = Math.ceil(Math.max(0, room.phaseEndsAt - now) / 1000)

  useEffect(() => {
    if (room.phase !== 'answering' && room.phase !== 'countdown') return
    if (seconds === lastTick.current) return
    lastTick.current = seconds
    if (seconds <= 3 && seconds > 0) {
      if (room.phase === 'countdown') sfx.countdown(seconds - 1)
      else sfx.tick()
    }
  }, [seconds, room.phase])

  useEffect(() => {
    if (room.phase !== 'finale' && room.phase !== 'ended') return
    if (room.finaleStep === lastFinale.current) return
    lastFinale.current = room.finaleStep
    if (room.phase === 'ended') sfx.fanfare()
    else sfx.drumroll()
  }, [room.phase, room.finaleStep])
}
