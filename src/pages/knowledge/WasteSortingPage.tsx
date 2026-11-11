import ContentShell, { CtaLink, Section } from '../../components/seo/ContentShell'
import WasteSection from '../../components/WasteSection'
import { WASTE, WASTE_GAME_ITEMS } from '../../content'
import { pageByPath } from '../../seo/pages'

const page = pageByPath('/knowledge/waste-sorting/')!

export default function WasteSortingPage() {
  return (
    <ContentShell page={page} heading="ถังขยะ 4 สี ทิ้งอะไรถังไหน?">
      <p className="mt-5 text-lg text-ink/90 leading-relaxed">
        <b>ถังเขียว</b>สำหรับขยะอินทรีย์ <b>ถังเหลือง</b>สำหรับขยะรีไซเคิล <b>ถังน้ำเงิน</b>สำหรับขยะทั่วไป และ<b>ถังแดง</b>สำหรับขยะอันตราย การแยกขยะให้ถูกถังตั้งแต่ต้นทาง
        ทำให้ของที่นำกลับมาใช้ได้เข้าสู่ระบบรีไซเคิลจริง และลดปริมาณขยะที่ต้องนำไปกำจัด
      </p>

      <Section title="สรุปถังขยะแต่ละสี">
        <div className="rounded-2xl border border-line overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">ประเภทขยะและตัวอย่างของถังขยะแต่ละสี</caption>
            <thead className="bg-accent/10 text-left text-ink">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">ถัง</th>
                <th scope="col" className="px-3 py-2 font-medium">ประเภท</th>
                <th scope="col" className="px-3 py-2 font-medium">ตัวอย่าง</th>
              </tr>
            </thead>
            <tbody>
              {WASTE.bins.map((b) => (
                <tr key={b.id} className="border-t border-line align-top">
                  <th scope="row" className="px-3 py-2 text-left font-medium text-ink">
                    <span aria-hidden className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle" style={{ background: b.color }} />
                    {b.name}
                  </th>
                  <td className="px-3 py-2">{b.type}</td>
                  <td className="px-3 py-2">{b.examples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-ink/60">
          สีเหล่านี้เป็นแนวทางที่ใช้กันทั่วไปในไทย แต่ละพื้นที่หรืออาคารอาจกำหนดต่างออกไป ควรดูป้ายกำกับของถังและประกาศของท้องถิ่นก่อนเสมอ
        </p>
      </Section>

      <Section title="ขยะที่พบบ่อยในสำนักงานและบ้าน">
        <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {WASTE_GAME_ITEMS.map((it) => {
            const bin = WASTE.bins.find((b) => b.id === it.bin)!
            return (
              <li key={it.name} className="flex justify-between gap-3 border-b border-line py-1.5">
                <span>{it.name}</span>
                <span className="text-ink/65 whitespace-nowrap">{bin.name}</span>
              </li>
            )
          })}
        </ul>
      </Section>

      <Section title="เคล็ดลับให้แยกขยะได้จริง">
        <ul className="list-disc pl-5 space-y-2">
          <li>เทน้ำออกจากขวดและล้างกล่องอาหารก่อนทิ้ง เพราะของเปื้อนมักรีไซเคิลไม่ได้</li>
          <li>บีบขวดและกระป๋องให้แบนเพื่อประหยัดพื้นที่ในถัง</li>
          <li>แยกถ่านไฟฉาย หลอดไฟ และกระป๋องสเปรย์ไว้ต่างหาก อย่าทิ้งรวมกับขยะทั่วไป</li>
          <li>ถ้าไม่แน่ใจว่ารีไซเคิลได้ไหม ให้ดูป้ายกำกับของจุดรับ เพราะแต่ละที่รับวัสดุไม่เหมือนกัน</li>
        </ul>
        <div className="pt-1">
          <CtaLink href="/games/pass-trash/">ฝึกแยกขยะด้วยเกมส่งต่อขยะ</CtaLink>
        </div>
      </Section>

      {/* เกมลากขยะลงถัง ส่วนเดียวกับหน้าแรก จัดขอบให้พอดีกับคอลัมน์บทความ */}
      <div className="-mx-5 sm:-mx-6 mt-8 [&>section]:py-10 [&>section]:md:py-12">
        <WasteSection />
      </div>
    </ContentShell>
  )
}
