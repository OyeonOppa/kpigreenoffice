import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { DASHBOARD } from '../content'

function CountUp({ target, decimals, start }: { target: number; decimals: number; start: boolean }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) return
    let rafId = 0
    const t0 = performance.now()
    const duration = 1500
    const tick = (now: number) => {
      const t = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(target * eased)
      if (t < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [start, target])

  return (
    <>
      {value.toLocaleString('th-TH', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </>
  )
}

export default function DashboardSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      id="dashboard"
      ref={ref}
      className="relative bg-black py-28 md:py-40 px-6 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_60%)]" />
      <div className="relative max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-white/40 text-sm tracking-widest uppercase mb-4 text-center"
        >
          {DASHBOARD.label}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-4xl md:text-6xl text-white tracking-tight text-center mb-14 md:mb-20"
        >
          {DASHBOARD.heading}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-10">
          {DASHBOARD.stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.15 }}
              className="liquid-glass rounded-3xl p-8 md:p-10 text-center"
            >
              <div className="text-4xl mb-4">{stat.emoji}</div>
              <p className="font-display text-5xl md:text-6xl text-white mb-1">
                <CountUp target={stat.value} decimals={stat.decimals} start={isInView} />
              </p>
              <p className="text-white/60 text-sm mb-4">{stat.unit}</p>
              <p className="text-white/40 text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-white/30 text-sm text-center"
        >
          {DASHBOARD.note}
        </motion.p>
      </div>
    </section>
  )
}
