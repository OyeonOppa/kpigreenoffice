import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Home, KeyRound, QrCode, Shuffle, Sprout, Trees, Trophy, Users } from 'lucide-react'
import { FOREST, FOREST_BADGES } from '../content'
import { lookFromSeed, randomLook } from '../game/avatar'
import SignInDialog from '../components/SignInDialog'
import { sfx } from '../game/sfx'
import type { AvatarLook } from '../game'
import PlayerAvatar from '../components/live/PlayerAvatar'
import ForestLeaderboard from '../components/ForestLeaderboard'
import TreeSvg from '../components/tree/TreeSvg'
import ForestSvg from '../components/tree/ForestSvg'
import { TREE_STAGES } from '../components/tree/stages'
import { buildTreeArt } from '../components/tree/treeArt'
import { TreeDefs, TreeGroup } from '../components/tree/TreeSvg'
import {
  DAILY_CAP,
  FOREST_REHEARSAL,
  FULL_POINTS,
  forestBackend,
  stageOf,
  treeSeed,
  type ActivityId,
  type ForestMember,
  type ForestSnapshot,
  type ForestUser,
  type LogEntry,
} from '../forest'
import { useForest, useForestAuth, useLeaderboard } from '../forest/hooks'

const BADGE_BY_ID = new Map(FOREST_BADGES.map((b) => [b.id, b]))

/**
 * หน้าป่า 3R — ต้นไม้ของฉัน + สวนของสำนัก
 *
 * ต้นไม้เป็น SVG ทั้งหมด ไม่ใช่ three.js แล้ว ข้อจำกัดชุดเดิม (Canvas เดียวต่อหน้า,
 * ห้าม unmount Canvas, LOD, เพดาน 60 ต้น, แคชรูปทรงข้ามการวาด) จึงหมดไปพร้อมกัน
 * สลับมุมมองด้วย conditional ธรรมดาได้เลย
 */

export default function ForestPage() {
  const { user, signOut, changePassword } = useForestAuth()
  const forest = useForest(user?.uid ?? null)
  const [signInOpen, setSignInOpen] = useState(false)

  // ยังไม่ล็อกอิน — ต้องเข้าด้วยชื่อผู้ใช้ + รหัสพนักงานก่อน ต้นไม้ผูกกับคน ไม่ใช่กับเครื่อง
  if (!user) {
    return (
      <Shell>
        <SignInPrompt onSignIn={() => setSignInOpen(true)} />
        <SignInDialog open={signInOpen} onClose={() => setSignInOpen(false)} />
      </Shell>
    )
  }

  // เข้าครั้งแรก ยังใช้รหัสพนักงานเป็นรหัสผ่าน — บังคับตั้งรหัสใหม่ก่อน ปิดหน้านี้ไม่ได้จนกว่าจะตั้งเสร็จ
  if (user.mustChangePassword) {
    return (
      <Shell onSignOut={signOut}>
        <ChangePasswordCard onSubmit={changePassword} />
      </Shell>
    )
  }

  if (!forest) {
    return (
      <Shell>
        <p className="text-ink/60 text-center pt-16">กำลังโหลด…</p>
      </Shell>
    )
  }

  // ล็อกอินแล้วแต่ยังไม่ได้เลือกตัวละคร — ชื่อกับสำนักมาจากรายชื่อองค์กรแล้ว เหลือแค่เลือกตัวละคร
  if (!forest.me) {
    return (
      <Shell onSignOut={signOut}>
        <PlantCard user={user} />
      </Shell>
    )
  }

  return (
    <Shell onSignOut={signOut}>
      <ForestView uid={user.uid} forest={forest} me={forest.me} />
    </Shell>
  )
}

// ---------- กรอบหน้า ----------

function Shell({ children, onSignOut }: { children: ReactNode; onSignOut?: () => void }) {
  return (
    <div className="game-bg min-h-dvh flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 shrink-0">
        <a
          href="#"
          className="inline-flex items-center gap-1.5 text-ink/60 hover:text-ink text-sm transition-colors"
        >
          <Home size={16} /> หน้าแรก
        </a>
        <div className="flex items-center gap-3">
          {FOREST_REHEARSAL && (
            <span className="rounded-full bg-amber-100 text-amber-900 text-[11px] px-2.5 py-1 border border-amber-300">
              โหมดจำลอง — ข้อมูลอยู่ในเครื่องนี้เท่านั้น
            </span>
          )}
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="text-ink/55 hover:text-ink text-sm transition-colors"
            >
              ออกจากระบบ
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 px-4 sm:px-6 pb-10">{children}</div>
    </div>
  )
}

// ---------- ยังไม่ล็อกอิน ----------

function SignInPrompt({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="max-w-md mx-auto pt-6">
      <div className="pop-card p-6 text-center">
        <Sprout size={36} className="text-accent mx-auto mb-2" />
        <h1 className="font-display text-xl text-ink mb-1">{FOREST.heading}</h1>
        <p className="text-ink/60 text-sm mb-6">{FOREST.intro}</p>
        <button
          type="button"
          onClick={onSignIn}
          className="pop-btn w-full bg-accent-deep text-white py-3 font-medium"
        >
          {FOREST.auth.title}
        </button>
        <p className="text-ink/45 text-xs mt-4">
          เข้าด้วยชื่อผู้ใช้ + รหัสพนักงานที่หน่วยงานแจกให้ ต้นไม้ผูกกับบัญชี เข้าเครื่องไหนก็เจอต้นเดิม
        </p>
      </div>
    </div>
  )
}

// ---------- เริ่มต้น: ตัวตน + ปลูกต้นแรก ----------

function PlantCard({ user }: { user: ForestUser }) {
  const [look, setLook] = useState<AvatarLook>(() => lookFromSeed(user.uid))
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    try {
      await forestBackend.saveProfile(user.uid, { look })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md mx-auto pt-6">
      <div className="pop-card p-6">
        <Sprout size={36} className="text-accent mx-auto mb-2" />
        <h1 className="font-display text-xl text-ink text-center mb-1">{FOREST.heading}</h1>
        <p className="text-ink/60 text-sm text-center mb-1">เลือกตัวละครประจำตัว แล้วปลูกต้นแรกได้เลย</p>
        <p className="text-ink/45 text-xs text-center mb-6">
          {user.nickname || user.name} · {user.team}
        </p>

        <div className="flex flex-col items-center gap-3 mb-6">
          <PlayerAvatar look={look} size={80} />
          <button
            type="button"
            onClick={() => setLook(randomLook())}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 text-ink/70 px-3 py-2 text-sm"
          >
            <Shuffle size={14} /> สุ่มตัวละคร
          </button>
        </div>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving}
          className="pop-btn w-full bg-accent-deep text-white py-3 font-medium disabled:opacity-50"
        >
          {saving ? 'กำลังปลูก…' : 'ปลูกต้นไม้ของฉัน'}
        </button>
        <p className="text-ink/40 text-xs text-center mt-3">เปลี่ยนตัวละครทีหลังได้จากหน้าต้นของฉัน</p>
      </div>
    </div>
  )
}


// ---------- เข้าครั้งแรก: บังคับตั้งรหัสผ่านใหม่ ----------

function ChangePasswordCard({
  onSubmit,
}: {
  onSubmit: (newPassword: string) => Promise<{ ok: boolean; reason?: string }>
}) {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const tooShort = pw.length > 0 && pw.length < 6
  const mismatch = confirm.length > 0 && pw !== confirm
  const canSubmit = pw.length >= 6 && pw === confirm && !busy

  const submit = async () => {
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    try {
      const result = await onSubmit(pw)
      if (!result.ok) setError(result.reason ?? 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ')
      // สำเร็จ — auth listener อัปเดต user เอง หน้านี้จะเด้งไปหน้าถัดไป
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-md mx-auto pt-6">
      <div className="pop-card p-6">
        <KeyRound size={34} className="text-accent mx-auto mb-2" />
        <h1 className="font-display text-xl text-ink text-center mb-1">ตั้งรหัสผ่านใหม่</h1>
        <p className="text-ink/60 text-sm text-center mb-6">
          เข้าครั้งแรกยังใช้รหัสพนักงานเป็นรหัสผ่านอยู่ — ตั้งรหัสใหม่ที่รู้คนเดียวก่อนใช้งานต่อ
        </p>

        <label className="block text-ink/70 text-sm mb-1" htmlFor="new-pw">
          รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)
        </label>
        <input
          id="new-pw"
          type="password"
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void submit()}
          className="w-full rounded-2xl border-2 border-line bg-surface px-4 py-2.5 outline-none focus:border-accent"
        />

        <label className="block text-ink/70 text-sm mb-1 mt-3" htmlFor="confirm-pw">
          พิมพ์รหัสใหม่อีกครั้ง
        </label>
        <input
          id="confirm-pw"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void submit()}
          className="w-full rounded-2xl border-2 border-line bg-surface px-4 py-2.5 outline-none focus:border-accent"
        />

        {(tooShort || mismatch || error) && (
          <p className="text-red-600 text-xs mt-2">
            {error ?? (tooShort ? 'รหัสผ่านสั้นเกินไป' : 'รหัสผ่านสองช่องไม่ตรงกัน')}
          </p>
        )}

        <button
          type="button"
          onClick={() => void submit()}
          disabled={!canSubmit}
          className="pop-btn w-full bg-accent-deep text-white py-3 font-medium mt-4 disabled:opacity-50"
        >
          {busy ? 'กำลังบันทึก…' : 'บันทึกรหัสผ่านใหม่'}
        </button>
      </div>
    </div>
  )
}

// ---------- หน้าหลัก ----------

function ForestView({
  uid,
  forest,
  me,
}: {
  uid: string
  forest: ForestSnapshot
  me: ForestMember
}) {
  const [view, setView] = useState<'mine' | 'garden' | 'rank'>('mine')
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null)
  const [editingLook, setEditingLook] = useState(false)
  const [draftLook, setDraftLook] = useState<AvatarLook>(me.look)
  const leaderboard = useLeaderboard(view === 'rank')

  const gardenTrees = useMemo(
    () => forest.garden.map((m) => ({ seed: treeSeed(m.uid), growth: m.growth })),
    [forest.garden],
  )
  const mineSeed = treeSeed(uid)

  const stage = stageOf(me.points)
  const stageStart = Math.round(stage.stage.growth * FULL_POINTS)
  const stageEnd = stage.next ? Math.round(stage.next.growth * FULL_POINTS) : FULL_POINTS
  const stagePercent =
    stageEnd > stageStart
      ? Math.min(100, ((me.points - stageStart) / (stageEnd - stageStart)) * 100)
      : 100

  const capLeft = Math.max(0, DAILY_CAP - forest.todayPoints)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const log = async (activityId: ActivityId) => {
    const result = await forestBackend.logActivity(uid, activityId)
    if (result.ok) {
      sfx.correct()
      // ปลดล็อกเหรียญพอดีตอนนี้ — ขึ้นข้อความฉลองแยก ให้เด่นกว่าแค่ +แต้มปกติ
      const badge = result.earnedBadges?.[0] ? BADGE_BY_ID.get(result.earnedBadges[0]) : null
      setToast(
        badge
          ? { text: `${badge.emoji} ปลดล็อก: ${badge.label}!`, ok: true }
          : { text: `+${result.gained} แต้ม`, ok: true },
      )
    } else {
      sfx.wrong()
      setToast({ text: result.reason ?? 'บันทึกไม่สำเร็จ', ok: false })
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* สรุปต้นของฉัน */}
      <div className="pop-card p-4 sm:p-5 mb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setDraftLook(me.look)
              setEditingLook((v) => !v)
            }}
            className="rounded-full ring-2 ring-transparent hover:ring-accent/40 transition-shadow"
            aria-label="เปลี่ยนตัวละคร"
          >
            <PlayerAvatar look={me.look} size={44} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-ink font-medium truncate">{me.name}</p>
            <p className="text-ink/50 text-xs truncate">{me.team}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="tabular font-display text-2xl text-accent-deep leading-none">
              {me.points}
            </p>
            <p className="text-ink/50 text-xs">แต้มสะสม</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <p className="text-ink text-sm font-medium">{stage.stage.label}</p>
            <p className="text-ink/50 text-xs">
              {stage.next ? `อีก ${stage.pointsToNext} แต้ม → ${stage.next.label}` : 'โตเต็มที่แล้ว'}
            </p>
          </div>
          <div className="h-2 rounded-full bg-ink/8 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={false}
              animate={{ width: `${stagePercent}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>

        {editingLook && (
          <div className="mt-4 pt-4 border-t border-line flex items-center gap-3">
            <PlayerAvatar look={draftLook} size={48} />
            <button
              type="button"
              onClick={() => setDraftLook(randomLook())}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 text-ink/70 px-3 py-2 text-sm"
            >
              <Shuffle size={14} /> สุ่ม
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setEditingLook(false)}
              className="text-ink/50 text-sm px-2 py-2"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={async () => {
                await forestBackend.saveProfile(uid, { look: draftLook })
                setEditingLook(false)
              }}
              className="rounded-2xl bg-accent-deep text-white px-4 py-2 text-sm"
            >
              บันทึก
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        <ViewTab active={view === 'mine'} onClick={() => setView('mine')} icon={<Sprout size={16} />}>
          ต้นของฉัน
        </ViewTab>
        <ViewTab
          active={view === 'garden'}
          onClick={() => setView('garden')}
          icon={<Trees size={16} />}
        >
          สวนของสำนัก
        </ViewTab>
        <ViewTab active={view === 'rank'} onClick={() => setView('rank')} icon={<Trophy size={16} />}>
          อันดับ
        </ViewTab>
      </div>

      {view === 'rank' && <ForestLeaderboard lb={leaderboard} meUid={uid} />}

      {view !== 'rank' && (
      <>
      <div className="pop-card overflow-hidden relative mb-3 px-3 py-4 sm:px-5 sm:py-6">
        {view === 'mine' ? (
          <TreeSvg
            seed={mineSeed}
            growth={me.growth}
            className="w-full max-w-sm mx-auto"
            label={`ต้นของ ${me.name} ระยะ ${stage.stage.label}`}
          />
        ) : (
          <ForestSvg trees={gardenTrees} mineSeed={mineSeed} className="w-full h-auto" />
        )}

        <div className="absolute left-4 top-4 rounded-2xl bg-surface/85 backdrop-blur px-3 py-2">
          {view === 'mine' ? (
            <>
              <p className="text-ink text-sm font-medium leading-tight">{stage.stage.label}</p>
              <p className="text-ink/55 text-xs">
                ระยะที่ {stage.index + 1} จาก {TREE_STAGES.length}
              </p>
            </>
          ) : (
            <>
              <p className="text-ink text-sm font-medium leading-tight">{me.team}</p>
              <p className="text-ink/55 text-xs">
                {forest.teamCount} ต้น
                {forest.teamCount > gardenTrees.length &&
                  ` · แสดง ${gardenTrees.length} ต้นแรก`}
              </p>
            </>
          )}
        </div>

        {view === 'garden' && (
          <p className="absolute right-4 bottom-4 rounded-full bg-surface/85 backdrop-blur px-3 py-1.5 text-ink/70 text-xs">
            <span className="text-[#c99a00]">◎</span> วงสีทองคือต้นของคุณ
          </p>
        )}
      </div>

      <StageRail current={stage.index} />

      {/* บันทึกกิจกรรม */}
      <div className="pop-card p-4 sm:p-5 mb-3">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-display text-lg text-ink">บันทึกวันนี้</h2>
          <p className="tabular text-ink/50 text-xs">
            {forest.todayPoints}/{DAILY_CAP} แต้ม
          </p>
        </div>
        <p className="text-ink/55 text-xs mb-1">
          {capLeft > 0
            ? `ข้อละครั้งต่อวัน วันนี้เหลืออีก ${capLeft} แต้ม`
            : 'วันนี้ครบเพดานแล้ว พรุ่งนี้บันทึกได้อีก'}
        </p>
        {FOREST_REHEARSAL && (
          <p className="text-ink/45 text-xs mb-4 inline-flex items-center gap-1">
            <QrCode size={12} />
            ข้อที่ติดป้ายนี้ ของจริงต้องสแกน QR ที่จุดนั้นถึงได้แต้ม — ตอนซ้อมกดได้ทุกข้อ
          </p>
        )}
        {!FOREST_REHEARSAL && <div className="mb-4" />}

        <div className="space-y-4">
          {FOREST.kinds.map((kind) => (
            <div key={kind.id}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white"
                  style={{ backgroundColor: kind.color }}
                >
                  {kind.emoji} {kind.label}
                </span>
                <span className="text-ink/45 text-xs">{kind.hint}</span>
              </div>

              <div className="grid gap-1.5 sm:grid-cols-2">
                {FOREST.activities
                  .filter((a) => a.kind === kind.id)
                  .map((a) => {
                    const done = forest.todayDone.includes(a.id)
                    return (
                      <button
                        key={a.id}
                        type="button"
                        disabled={done || capLeft === 0}
                        onClick={() => void log(a.id)}
                        className={`flex items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5 text-left transition-colors ${
                          done
                            ? 'border-accent/30 bg-accent/8 text-ink/50'
                            : 'border-line bg-surface text-ink hover:border-accent/50 disabled:opacity-45'
                        }`}
                      >
                        <span className="text-lg leading-none shrink-0">{a.emoji}</span>
                        <span className="flex-1 text-sm leading-snug">
                          {a.label}
                          {a.verify === 'qr' && (
                            <span className="inline-flex items-center gap-1 align-middle ml-1.5 rounded-full bg-ink/6 text-ink/50 text-[10px] px-1.5 py-0.5">
                              <QrCode size={10} />
                              สแกนที่จุด
                            </span>
                          )}
                        </span>
                        {done ? (
                          <Check size={16} className="text-accent shrink-0" />
                        ) : (
                          <span className="tabular text-accent-deep text-sm font-medium shrink-0">
                            +{a.points}
                          </span>
                        )}
                      </button>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <RecentLog entries={forest.log} />
      </>
      )}

      <div className="flex items-center justify-center gap-1.5 text-ink/45 text-xs mt-4">
        <Users size={13} />
        ทั้งหน่วยงาน {forest.officeCount} ต้น · รวม {forest.officePoints.toLocaleString('th-TH')} แต้ม
      </div>

      {FOREST_REHEARSAL && (
        <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-center">
          <p className="text-amber-900 text-xs mb-2">
            เครื่องมือซ้อม — สร้างเพื่อนร่วมสวนจำลองไว้ดูหน้าตาสวนตอนยังไม่มีคนใช้จริง
          </p>
          <button
            type="button"
            onClick={() => void forestBackend.seedDemoMembers(12, me.team)}
            className="rounded-full bg-amber-200 text-amber-950 px-4 py-1.5 text-xs"
          >
            เพิ่ม 12 ต้นจำลองในสำนักนี้
          </button>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed inset-x-0 bottom-6 flex justify-center pointer-events-none z-20"
          >
            <span
              className={`rounded-full px-5 py-2.5 text-sm font-medium shadow-lg ${
                toast.ok ? 'bg-accent-deep text-white' : 'bg-ink text-white'
              }`}
            >
              {toast.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * แถบระยะการเติบโตทั้ง 10 ขั้น พร้อมรูปต้นย่อของแต่ละระยะ
 *
 * มีไว้เพื่อให้เห็นว่า "ทำต่อแล้วต้นจะเปลี่ยนไปเป็นแบบไหน" — ตัวเลข "อีก 51 แต้ม"
 * บอกระยะทางได้ แต่บอกไม่ได้ว่าปลายทางหน้าตายังไง คนถึงไม่รู้ว่าคุ้มที่จะทำต่อไหม
 *
 * ใช้ <svg> เดียววาดทุกระยะ ไม่ใช่ <svg> ต่อระยะ — defs จะได้ประกาศครั้งเดียว
 */
function StageRail({ current }: { current: number }) {
  const cell = 46
  // 'full' ไม่ใช่ 'simple' — มีแค่ 10 ต้น ไม่ใช่ป่า 250 ต้น จึงเก็บดอก/ผล/ใบปลายกิ่งไว้ได้
  // ('simple' ตัดสิ่งพวกนี้ทิ้ง ทำให้ระยะ ออกดอก/ติดผล/ไม้ใหญ่ ดูเหมือนกันหมด)
  const arts = useMemo(
    () => TREE_STAGES.map((s, i) => buildTreeArt(`stage-${i}`, s.growth, 'full')),
    [],
  )
  const tallest = Math.max(...arts.map((a) => a.height))
  const widest = Math.max(...arts.map((a) => a.halfWidth))
  // สเกลร่วมก้อนเดียวสำหรับทุกระยะ — ระยะหลังจึงตัวใหญ่ขึ้นจริงเมื่อเทียบกัน
  // ไม่ใช่ย่อแต่ละต้นให้เต็มช่องเท่ากันจนดูขนาดเดียว
  const base = Math.min((cell * 0.82) / tallest, (cell * 0.46) / widest)
  // เมล็ด/หน่ออ่อน เล็กจนเป็นจุด — ดันขึ้นให้พอเห็นรูปร่าง ระยะอื่นใช้สเกลร่วมตามสัดส่วนจริง
  const scaleOf = (a: { height: number; halfWidth: number }) =>
    a.height * base < cell * 0.24 ? (cell * 0.24) / a.height : base

  return (
    <div className="pop-card p-3 sm:p-4 mb-3 overflow-x-auto">
      <div className="min-w-[34rem]">
        <svg
          viewBox={`0 0 ${cell * TREE_STAGES.length} ${cell + 4}`}
          className="w-full h-auto"
          role="img"
          aria-label={`ระยะการเติบโตทั้ง ${TREE_STAGES.length} ขั้น ตอนนี้อยู่ระยะที่ ${current + 1}`}
        >
          <defs>
            <TreeDefs />
          </defs>
          {arts.map((art, i) => (
            <g key={i} opacity={i <= current ? 1 : 0.32}>
              {i === current && (
                <rect
                  x={i * cell + 2}
                  y={2}
                  width={cell - 4}
                  height={cell}
                  rx={10}
                  fill="#3f7256"
                  opacity="0.1"
                />
              )}
              <g transform={`translate(${i * cell + cell / 2} ${cell}) scale(${scaleOf(art)})`}>
                <TreeGroup art={art} shadow={false} />
              </g>
            </g>
          ))}
        </svg>

        <div
          className="grid mt-1"
          style={{ gridTemplateColumns: `repeat(${TREE_STAGES.length}, minmax(0, 1fr))` }}
        >
          {TREE_STAGES.map((s, i) => (
            <p
              key={s.id}
              className={`text-center text-[10px] leading-tight px-0.5 ${
                i === current ? 'text-accent-deep font-medium' : 'text-ink/40'
              }`}
            >
              {s.label}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

function ViewTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition-colors ${
        active ? 'bg-accent-deep text-white' : 'bg-ink/5 text-ink/70 hover:bg-ink/10'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

function RecentLog({ entries }: { entries: LogEntry[] }) {
  if (entries.length === 0) return null
  const labelOf = (entry: LogEntry) =>
    entry.activityId
      ? (FOREST.activities.find((a) => a.id === entry.activityId)?.label ?? 'กิจกรรม 3R')
      : (entry.note ?? 'แต้มจากสตาฟ')

  return (
    <div className="pop-card p-4 sm:p-5">
      <h2 className="font-display text-lg text-ink mb-3">ประวัติล่าสุด</h2>
      <ul className="space-y-2">
        {entries.slice(0, 6).map((entry) => (
          <li key={entry.id} className="flex items-center gap-3 text-sm">
            <span className="tabular text-ink/40 text-xs shrink-0">
              {new Date(entry.at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
            </span>
            <span className="flex-1 text-ink/80 truncate">{labelOf(entry)}</span>
            {entry.source === 'staff' && (
              <span className="rounded-full bg-ink/5 text-ink/50 text-[11px] px-2 py-0.5 shrink-0">
                สตาฟให้
              </span>
            )}
            <span className="tabular text-accent-deep shrink-0">+{entry.points}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
