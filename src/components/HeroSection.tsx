import { useRef, useState } from 'react'
import { Globe, LogIn, Mail, Phone, Sprout } from 'lucide-react'
import { useVideoCrossfade } from '../hooks/useVideoCrossfade'
import { FOREST, ORG_TREE, VIDEO_URLS, IMAGE_URLS, USE_STATIC_IMAGES } from '../content'
import { DAILY_CAP, stageOf, treeSeed, type ForestMember, type OrgSnapshot } from '../forest'
import { useForest, useForestAuth, useOrgForest } from '../forest/hooks'
import ForestSvg from './tree/ForestSvg'
import MediaBackground from './MediaBackground'
import LiveEnvWidget from './LiveEnvWidget'
import HeroStats from './HeroStats'
import SignInDialog from './SignInDialog'

const nf = new Intl.NumberFormat('th-TH')

/**
 * Hero คือป่าของทั้งองค์กร — ต้นไม้ของทุกคนอยู่ในนั้นครบ
 *
 * ไม่ใช่ต้นเดียวที่เป็นตัวแทนยอดรวม เพราะต้นเดียวบอกได้แค่ "รวมกันแล้วไปถึงไหน"
 * แต่ป่าบอกได้ด้วยว่ามีกี่คนร่วม และแต่ละคนไปถึงระยะไหนกันบ้าง ซึ่งเป็นภาพที่ชวนให้อยากมีต้นของตัวเอง
 *
 * ล็อกอินแล้วต้นของตัวเองจะมีวงสีทองกำกับให้หาเจอในป่า และแถบตัวเลขด้านล่างเปลี่ยนเป็นของตัวเอง
 */
export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  useVideoCrossfade(videoRef)

  const [signInOpen, setSignInOpen] = useState(false)
  const { user } = useForestAuth()
  const forest = useForest(user?.uid ?? null)
  const org = useOrgForest()

  const me = forest?.me ?? null
  const mineSeed = user ? treeSeed(user.uid) : null
  const trees = org?.trees ?? []

  return (
    <section className="min-h-screen overflow-hidden relative flex flex-col bg-canvas">
      <MediaBackground
        ref={videoRef}
        videoSrc={VIDEO_URLS.hero}
        imageSrc={IMAGE_URLS.hero}
        className="absolute inset-0 w-full h-full object-cover object-bottom"
        style={USE_STATIC_IMAGES ? undefined : { opacity: 0 }}
      />
      {/* สกรีนบางๆ ให้ตัวหนังสือเข้มอ่านง่าย ไม่ว่าภาพพื้นหลังจะสว่างหรือมืด */}
      <div className="absolute inset-0 bg-gradient-to-b from-canvas/75 via-canvas/45 to-canvas/85" />

      {/* เผื่อพื้นที่ด้านบนให้ navbar แบบ fixed ที่ลอยอยู่เสมอ (ดู Navbar.tsx) */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-4 sm:px-6 pt-28 sm:pt-32 pb-10">
        <div className="w-full max-w-6xl mx-auto">
          <p className="text-accent-deep text-xs sm:text-sm font-medium tracking-widest uppercase text-center mb-2">
            {ORG_TREE.label}
          </p>

          {trees.length > 0 ? (
            <ForestSvg
              trees={trees}
              mineSeed={mineSeed}
              className="w-full h-auto max-h-[42vh] sm:max-h-[46vh]"
            />
          ) : (
            <EmptyForest signedIn={!!user} />
          )}

          {me ? (
            <MyStrip me={me} todayPoints={forest?.todayPoints ?? 0} />
          ) : (
            <OrgStrip
              org={org}
              signedIn={!!user}
              onSignIn={() => setSignInOpen(true)}
            />
          )}
        </div>

        <div className="w-full max-w-6xl mx-auto mt-10 md:mt-12">
          <HeroStats />
        </div>

        <div className="w-full max-w-3xl mx-auto mt-10 md:mt-12">
          <LiveEnvWidget />
        </div>
      </div>

      {/* Social icons */}
      <div className="relative z-10 flex justify-center gap-4 pb-12">
        {[Phone, Mail, Globe].map((Icon, i) => (
          <a
            key={i}
            href="#contact"
            className="liquid-glass rounded-full p-4 text-ink/70 hover:text-ink hover:bg-ink/5 transition-all"
          >
            <Icon size={20} />
          </a>
        ))}
      </div>

      <SignInDialog open={signInOpen} onClose={() => setSignInOpen(false)} />
    </section>
  )
}

/** ยังไม่มีใครปลูก — สถานะวันเปิดตัว ไม่แสร้งว่ามีป่าแล้ว */
function EmptyForest({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="py-10 sm:py-14 text-center">
      <Sprout size={44} className="text-accent/60 mx-auto mb-3" />
      <p className="font-display text-2xl text-ink">{ORG_TREE.emptyTitle}</p>
      <p className="text-ink/60 text-sm mt-2">
        {signedIn ? 'ปลูกต้นของคุณแล้วเริ่มเก็บแต้มได้เลย' : ORG_TREE.emptyHint}
      </p>
    </div>
  )
}

/** แถบตัวเลขของทั้งองค์กร — คนนอกและคนที่ยังไม่ได้ปลูกเห็นอันนี้ */
function OrgStrip({
  org,
  signedIn,
  onSignIn,
}: {
  org: OrgSnapshot | null
  signedIn: boolean
  onSignIn: () => void
}) {
  return (
    <div className="mt-4 flex flex-col items-center text-center">
      {org && org.memberCount > 0 && (
        <>
          <div className="flex flex-wrap items-baseline justify-center gap-x-6 gap-y-1">
            <Figure value={nf.format(org.memberCount)} unit="ต้น" caption="ในป่าของเรา" />
            <Figure value={nf.format(org.totalPoints)} unit="แต้ม" caption="ที่ช่วยกันสะสม" />
          </div>

          <div className="mt-4 w-full max-w-sm h-2.5 rounded-full bg-ink/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-out"
              style={{ width: `${org.growth * 100}%` }}
            />
          </div>
          <p className="text-ink/55 text-xs mt-2">
            {Math.round(org.growth * 100)}% ของเป้าปีนี้ ({nf.format(ORG_TREE.goalPoints)} แต้ม)
          </p>
        </>
      )}

      {signedIn ? (
        <a
          href={FOREST.path}
          className="liquid-glass rounded-full px-6 py-2.5 mt-5 text-ink text-sm font-medium hover:bg-ink/5 transition-colors inline-flex items-center gap-2"
        >
          <Sprout size={16} className="text-accent" />
          ปลูกต้นของฉัน
        </a>
      ) : (
        <button
          type="button"
          onClick={onSignIn}
          className="liquid-glass rounded-full px-6 py-2.5 mt-5 text-ink text-sm font-medium hover:bg-ink/5 transition-colors inline-flex items-center gap-2"
        >
          <LogIn size={16} />
          เข้าสู่ระบบเพื่อปลูกต้นของฉัน
        </button>
      )}
    </div>
  )
}

/** แถบตัวเลขของตัวเองหลังปลูกแล้ว — ต้นตัวเองมีวงสีทองอยู่ในป่าด้านบน */
function MyStrip({ me, todayPoints }: { me: ForestMember; todayPoints: number }) {
  const stage = stageOf(me.points)
  const capLeft = Math.max(0, DAILY_CAP - todayPoints)

  return (
    <div className="mt-4 flex flex-col items-center text-center">
      <p className="text-ink/55 text-xs mb-2">
        <span className="text-[#c99a00]">◎</span> วงสีทองคือต้นของคุณ
      </p>

      <div className="flex flex-wrap items-baseline justify-center gap-x-6 gap-y-1">
        <Figure value={nf.format(me.points)} unit="แต้ม" caption={`ต้นของ ${me.name}`} />
        <Figure value={stage.stage.label} caption={`ระยะที่ ${stage.index + 1} จาก 10`} />
      </div>

      <p className="text-ink/55 text-xs mt-3">
        {stage.next ? `อีก ${stage.pointsToNext} แต้ม → ${stage.next.label}` : 'โตเต็มที่แล้ว'}
      </p>
      <p className="text-accent-deep text-xs mt-1.5">
        {capLeft > 0
          ? `วันนี้บันทึกได้อีก ${capLeft} แต้ม`
          : 'วันนี้ครบเพดานแล้ว พรุ่งนี้บันทึกได้อีก'}
      </p>

      <a
        href={FOREST.path}
        className="liquid-glass rounded-full px-6 py-2.5 mt-5 text-ink text-sm font-medium hover:bg-ink/5 transition-colors inline-flex items-center gap-2"
      >
        <Sprout size={16} className="text-accent" />
        บันทึกกิจกรรมวันนี้
      </a>
    </div>
  )
}

function Figure({ value, unit, caption }: { value: string; unit?: string; caption: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-center gap-1.5">
        <span className="font-display text-3xl sm:text-4xl text-ink leading-none tabular">
          {value}
        </span>
        {unit && <span className="text-ink/60 text-sm">{unit}</span>}
      </div>
      <p className="text-ink/60 text-xs mt-1">{caption}</p>
    </div>
  )
}
