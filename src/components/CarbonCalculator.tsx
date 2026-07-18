import { useMemo, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { CALCULATOR, EMISSION_FACTORS as EF } from '../content'

type TransportId = (typeof CALCULATOR.transportOptions)[number]['id']

interface NumberFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  unit?: string
}

function NumberField({ label, value, onChange, unit }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-ink/65 text-sm">{label}</span>
      <div className="liquid-glass rounded-2xl flex items-center pr-4">
        <input
          type="number"
          min="0"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="เติมตัวเลข"
          className="w-full bg-transparent text-ink placeholder:text-ink/30 px-4 py-3 outline-none text-sm"
        />
        {unit && <span className="text-ink/65 text-xs whitespace-nowrap">{unit}</span>}
      </div>
    </label>
  )
}

const num = (v: string) => Math.max(0, parseFloat(v) || 0)

export default function CarbonCalculator() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const [transport, setTransport] = useState<TransportId>('car')
  const [distance, setDistance] = useState('')
  const [flightDom, setFlightDom] = useState('')
  const [flightIntl, setFlightIntl] = useState('')
  const [beef, setBeef] = useState('')
  const [chicken, setChicken] = useState('')
  const [pork, setPork] = useState('')
  const [household, setHousehold] = useState('')
  const [electricBill, setElectricBill] = useState('')

  const result = useMemo(() => {
    const commutePerKm =
      transport === 'car' ? EF.carPerKm : transport === 'public' ? EF.publicPerKm : 0
    const commute = num(distance) * commutePerKm * EF.workDaysPerYear
    const flights = num(flightDom) * EF.flightDomestic + num(flightIntl) * EF.flightInternational
    const meat =
      (num(beef) * EF.beefPerMeal + num(chicken) * EF.chickenPerMeal + num(pork) * EF.porkPerMeal) *
      52
    const people = Math.max(1, num(household))
    const electricity = ((num(electricBill) / EF.thbPerKwh) * EF.gridKgPerKwh * 12) / people
    const totalKg = commute + flights + meat + electricity
    return {
      totalTons: totalKg / 1000,
      trees: Math.ceil(totalKg / EF.kgPerTreePerYear),
      breakdown: [
        { label: 'การเดินทางประจำวัน', kg: commute },
        { label: 'เที่ยวบิน', kg: flights },
        { label: 'อาหาร', kg: meat },
        { label: 'ไฟฟ้าในบ้าน', kg: electricity },
      ],
    }
  }, [transport, distance, flightDom, flightIntl, beef, chicken, pork, household, electricBill])

  const hasInput =
    [distance, flightDom, flightIntl, beef, chicken, pork, electricBill].some((v) => num(v) > 0)

  return (
    <motion.div
      id="calculator"
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      className="liquid-glass rounded-3xl p-6 md:p-10 scroll-mt-24"
    >
      <p className="text-ink/65 text-xs tracking-widest uppercase mb-3">{CALCULATOR.label}</p>
      <h3 className="font-display text-3xl md:text-4xl text-ink tracking-tight mb-10">
        {CALCULATOR.heading}
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ฟอร์มคำถาม */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-ink/65 text-sm">1. วันนี้คุณเดินทางมาทำงานอย่างไร</span>
            <div className="flex flex-wrap gap-2">
              {CALCULATOR.transportOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTransport(opt.id)}
                  className={`rounded-full px-5 py-2 text-sm transition-colors ${
                    transport === opt.id
                      ? 'bg-accent text-white font-medium'
                      : 'liquid-glass text-ink/70 hover:text-ink'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <NumberField
            label="2. ระยะทางไป-กลับกี่กิโลเมตร"
            value={distance}
            onChange={setDistance}
            unit="กม./วัน"
          />

          <div className="flex flex-col gap-2">
            <span className="text-ink/65 text-sm">
              3. ในช่วง 1 ปีที่ผ่านมา คุณเดินทางด้วยเครื่องบินบ่อยแค่ไหน
            </span>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="ในประเทศ"
                value={flightDom}
                onChange={setFlightDom}
                unit="ครั้ง/ปี"
              />
              <NumberField
                label="ต่างประเทศ"
                value={flightIntl}
                onChange={setFlightIntl}
                unit="ครั้ง/ปี"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-ink/65 text-sm">
              4. ในแต่ละสัปดาห์ คุณทานเนื้อสัตว์บ่อยแค่ไหน
            </span>
            <div className="grid grid-cols-3 gap-3">
              <NumberField label="เนื้อวัว" value={beef} onChange={setBeef} unit="มื้อ" />
              <NumberField label="เนื้อไก่" value={chicken} onChange={setChicken} unit="มื้อ" />
              <NumberField label="เนื้อหมู" value={pork} onChange={setPork} unit="มื้อ" />
            </div>
          </div>

          <NumberField
            label="5. มีผู้พักอาศัยในบ้านของคุณกี่คน"
            value={household}
            onChange={setHousehold}
            unit="คน"
          />

          <NumberField
            label="6. มียอดค่าไฟฟ้ารายเดือนประมาณเท่าไหร่"
            value={electricBill}
            onChange={setElectricBill}
            unit="บาท/เดือน"
          />
        </div>

        {/* ผลลัพธ์ */}
        <div className="flex flex-col justify-center">
          <div className="liquid-glass rounded-3xl p-8 md:p-10 text-center">
            <p className="text-ink/65 text-xs tracking-widest uppercase mb-4">
              คาร์บอนฟุตพรินต์ของคุณ
            </p>
            <p className="font-display text-6xl md:text-7xl text-accent-deep mb-2">
              {hasInput ? result.totalTons.toFixed(2) : '—'}
            </p>
            <p className="text-ink/65 text-sm mb-8">ตัน CO₂e ต่อปี</p>

            {hasInput && (
              <>
                <div className="flex flex-col gap-2 text-left mb-8">
                  {result.breakdown.map((b) => (
                    <div key={b.label} className="flex justify-between text-sm">
                      <span className="text-ink/65">{b.label}</span>
                      <span className="text-ink/80">{(b.kg / 1000).toFixed(2)} ตัน</span>
                    </div>
                  ))}
                </div>
                <p className="text-ink/65 text-sm">
                  ต้องปลูกต้นไม้ประมาณ{' '}
                  <span className="text-ink font-medium">
                    {result.trees.toLocaleString('th-TH')}
                  </span>{' '}
                  ต้น เพื่อดูดซับคาร์บอนเท่านี้ใน 1 ปี
                </p>
              </>
            )}
          </div>
          <p className="text-ink/65 text-xs leading-relaxed mt-4 text-center">
            {CALCULATOR.disclaimer}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
