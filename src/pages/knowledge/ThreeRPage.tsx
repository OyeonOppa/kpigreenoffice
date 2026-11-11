import ContentShell, { CtaLink, Section } from '../../components/seo/ContentShell'
import { THREE_R } from '../../content'
import { pageByPath } from '../../seo/pages'

const page = pageByPath('/knowledge/3r/')!

export default function ThreeRPage() {
  return (
    <ContentShell page={page} heading="3R คืออะไร? ลดใช้ ใช้ซ้ำ แยกขยะ">
      <p className="mt-5 text-lg text-ink/90 leading-relaxed">
        3R คือหลักการจัดการขยะ 3 ขั้น ได้แก่ <b>Reduce</b> ลดใช้ <b>Reuse</b> ใช้ซ้ำ และ <b>Recycle</b> แยกเพื่อนำกลับไปผลิตใหม่ ลำดับนี้คือลำดับความสำคัญ เพราะขยะที่ดีที่สุดคือขยะที่ไม่เกิดขึ้นตั้งแต่แรก ลดใช้ก่อน ถ้าลดไม่ได้ให้ใช้ซ้ำ เหลือจริง ๆ ค่อยแยกไปรีไซเคิล
      </p>

      {THREE_R.items.map((item) => (
        <Section key={item.id} title={item.title}>
          <p>{item.body}</p>
          <p className="font-medium text-ink">ตัวอย่างที่ทำได้ทันที</p>
          <ul className="list-disc pl-5 space-y-1">
            {item.examples.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Section>
      ))}

      <Section title="ทำไมไม่ควรหยุดแค่รีไซเคิล">
        <p>
          งานวิจัยของ Wynes และ Nicholas (2017) ซึ่งรวบรวมข้อมูลจากประเทศพัฒนาแล้ว 148 สถานการณ์จาก 39 แหล่ง พบว่าการรีไซเคิลอย่างครบถ้วนลดก๊าซเรือนกระจกได้น้อยกว่าการกินอาหารจากพืชราว 4 เท่า
          การรีไซเคิลยังมีประโยชน์ แต่จะได้ผลมากขึ้นเมื่อทำควบคู่กับการลดใช้และการปรับพฤติกรรมด้านอื่น
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <CtaLink href="/knowledge/waste-sorting/">ดูวิธีแยกขยะ 4 ถัง</CtaLink>
          <CtaLink href="/carbon-calculator/">คำนวณคาร์บอนของคุณ</CtaLink>
        </div>
      </Section>
    </ContentShell>
  )
}
