import ContentShell, { CtaLink, Section } from '../../components/seo/ContentShell'
import { ITEMS, TIERS } from '../../decompose/cards'
import { pageByPath } from '../../seo/pages'

const page = pageByPath('/knowledge/waste-decomposition-time/')!

export default function WasteDecompositionPage() {
  return (
    <ContentShell page={page} heading="ขยะแต่ละชนิดย่อยสลายนานแค่ไหน?">
      <p className="mt-5 text-lg text-ink/90 leading-relaxed">
        ถ้าขยะหลุดลงทะเล เปลือกกล้วยใช้เวลาราว <b>2–5 สัปดาห์</b> ถุงพลาสติกราว <b>10–20 ปี</b> กระป๋องเหล็กราว <b>50 ปี</b> ขวดพลาสติกราว{' '}
        <b>450 ปี</b> เอ็นตกปลาราว <b>600 ปี</b> ส่วนขวดแก้วนานจนประเมินไม่ได้ ตัวเลขเหล่านี้เป็นค่าประมาณจากเอกสารของ US EPA, US National Park Service และ
        NOAA/Mote Marine Lab
      </p>

      <Section title="ตารางเวลาย่อยสลายของขยะ 25 ชนิด">
        <p>เรียงจากย่อยเร็วไปย่อยช้า แบ่งเป็น 6 ระดับตามช่วงเวลา</p>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">เวลาย่อยสลายโดยประมาณของขยะ 25 ชนิดเมื่ออยู่ในทะเล</caption>
            <thead className="bg-accent/10 text-left text-ink">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">ขยะ</th>
                <th scope="col" className="px-3 py-2 font-medium">เวลาโดยประมาณ</th>
                <th scope="col" className="px-3 py-2 font-medium">ที่มา</th>
              </tr>
            </thead>
            {TIERS.map((t) => (
              <tbody key={t.n}>
                <tr>
                  <th scope="rowgroup" colSpan={3} className="px-3 py-1.5 text-left text-white font-medium" style={{ background: t.color }}>
                    ระดับ {t.n}: {t.name}
                  </th>
                </tr>
                {ITEMS.filter((it) => it.tier === t.n).map((it) => (
                  <tr key={it.id} className="border-t border-line align-top">
                    <th scope="row" className="px-3 py-2 text-left font-normal text-ink">{it.name}</th>
                    <td className="px-3 py-2">
                      {it.time}
                      {it.note && <span className="block text-xs text-ink/55">{it.note}</span>}
                    </td>
                    <td className="px-3 py-2 text-xs text-ink/60">{it.src}</td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </Section>

      <Section title="อ่านตัวเลขเหล่านี้อย่างไรให้ถูก">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <b>เป็นเวลาสำหรับขยะในทะเล</b> ถ้าอยู่บนบกหรือในบ่อฝังกลบ เวลาจะต่างออกไป เพราะแสงแดด อุณหภูมิ ความชื้น และคลื่นมีผลโดยตรง
          </li>
          <li>
            <b>เป็นค่าประมาณ</b> พลาสติกเพิ่งใช้แพร่หลายมาหลายสิบปี ยังไม่มีใครเฝ้าดูขวดพลาสติกจนย่อยหมด GRID-Arendal อธิบายว่าตัวเลข “450 ปี”
            เป็นตัวเลขประกอบการอธิบาย ไม่ใช่ค่าที่ตรวจยืนยันได้
          </li>
          <li>
            <b>พลาสติกไม่ได้หายไป</b> เมื่อครบเวลาในตาราง พลาสติกจะแตกเป็นชิ้นเล็กลงเรื่อย ๆ จนมองไม่เห็น ไม่ใช่กลับคืนสู่ธรรมชาติแบบเศษอาหาร
          </li>
          <li>
            <b>แต่ละแหล่งให้ตัวเลขต่างกัน</b> เมื่อเอกสารไม่ตรงกัน ตารางนี้แสดงช่วงเวลาและระบุแหล่งไว้ในหมายเหตุ
          </li>
        </ul>
      </Section>

      <Section title="ลดขยะที่อยู่นานได้อย่างไร">
        <p>
          ของที่อยู่นานหลายร้อยปีมักเป็นของใช้ครั้งเดียว เช่น ขวดน้ำ ถุงพลาสติก และผ้าอ้อมสำเร็จรูป การลดใช้ตั้งแต่ต้นทางจึงได้ผลมากกว่าการหาวิธีกำจัดทีหลัง
          ส่วนที่เลี่ยงไม่ได้ให้แยกลงถังให้ถูกเพื่อให้เข้าสู่ระบบรีไซเคิลได้จริง
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <CtaLink href="/games/decompose/">ลองเล่นเกมเรียงขยะ</CtaLink>
          <CtaLink href="/knowledge/waste-sorting/">ดูวิธีแยกขยะ 4 ถัง</CtaLink>
        </div>
      </Section>
    </ContentShell>
  )
}
