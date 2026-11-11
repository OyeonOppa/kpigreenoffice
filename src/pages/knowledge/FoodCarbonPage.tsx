import ContentShell, { CtaLink, Section } from '../../components/seo/ContentShell'
import { FOOD_CARBON } from '../../knowledge/foodCarbon'
import { pageByPath } from '../../seo/pages'

const page = pageByPath('/knowledge/food-carbon-footprint/')!
const max = FOOD_CARBON[0].kg

export default function FoodCarbonPage() {
  return (
    <ContentShell page={page} heading="อาหารอะไรปล่อยคาร์บอนมากที่สุด?">
      <p className="mt-5 text-lg text-ink/90 leading-relaxed">
        ต่ออาหาร 1 กิโลกรัม เนื้อวัวจากวัวที่เลี้ยงเพื่อเอาเนื้อปล่อยก๊าซเรือนกระจกสูงที่สุด ราว <b>99.48 kgCO₂e</b> มากกว่าเนื้อไก่ (<b>9.87</b>) ราว 10 เท่า
        และมากกว่าเต้าหู้ (<b>3.16</b>) ราว 31 เท่า ตัวเลขนี้เป็นค่าเฉลี่ยทั่วโลกจากงานวิจัย Poore &amp; Nemecek (2018) ในวารสาร <i>Science</i>
      </p>

      <Section title="ตารางก๊าซเรือนกระจกของอาหาร 38 ชนิด">
        <p>หน่วยเป็นกิโลกรัมคาร์บอนไดออกไซด์เทียบเท่า (kgCO₂e) ต่ออาหาร 1 กิโลกรัม นับตลอดห่วงโซ่อาหาร ตั้งแต่การใช้ที่ดิน ฟาร์ม อาหารสัตว์ การแปรรูป การขนส่ง จนถึงบรรจุภัณฑ์และค้าปลีก</p>
        <div className="rounded-2xl border border-line overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <caption className="sr-only">ก๊าซเรือนกระจกต่ออาหาร 1 กิโลกรัม เรียงจากมากไปน้อย</caption>
            <thead className="bg-accent/10 text-left text-ink">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">อาหาร</th>
                <th scope="col" className="px-3 py-2 font-medium text-right whitespace-nowrap">kgCO₂e/กก.</th>
              </tr>
            </thead>
            <tbody>
              {FOOD_CARBON.map((f) => (
                <tr key={f.en} className="border-t border-line">
                  <th scope="row" className="px-3 py-1.5 text-left font-normal text-ink">
                    {f.name}
                    <span aria-hidden className="block h-1 mt-1 rounded-full bg-accent/70" style={{ width: `${Math.max(1, (f.kg / max) * 100)}%` }} />
                  </th>
                  <td className="px-3 py-1.5 text-right tabular-nums">{f.kg.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="อ่านตารางนี้อย่างไรให้ไม่เข้าใจผิด">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <b>เป็นค่าต่อ 1 กิโลกรัม ไม่ใช่ต่อมื้อ</b> กาแฟและช็อกโกแลตสูงเมื่อคิดต่อกิโลกรัม แต่เราบริโภคครั้งละไม่กี่กรัม
          </li>
          <li>
            <b>เป็นค่าเฉลี่ยทั่วโลก</b> ไม่ใช่ค่าเฉพาะของไทย ฟาร์มแต่ละแห่งและแต่ละประเทศต่างกันได้มาก
          </li>
          <li>
            <b>kgCO₂e</b> คือการแปลงก๊าซเรือนกระจกทุกชนิดเป็นหน่วยเดียว โดยคิดจากผลต่อการทำให้โลกร้อนในช่วง 100 ปี
          </li>
        </ul>
      </Section>

      <Section title="ลองคิดเป็นมื้ออาหาร">
        <p>
          ถ้ากินเนื้อสัตว์มื้อละ 100 กรัม คำนวณจากตารางได้ว่าเนื้อวัวจากวัวเนื้อปล่อยราว 9.95 kgCO₂e เนื้อหมูราว 1.23 kgCO₂e เนื้อไก่ราว 0.99 kgCO₂e และเต้าหู้ราว 0.32 kgCO₂e
          การเปลี่ยนเนื้อวัวเป็นเนื้อไก่หรือเต้าหู้บางมื้อจึงเป็นวิธีลดคาร์บอนที่ทำได้ทันที
        </p>
        <div className="pt-1">
          <CtaLink href="/carbon-calculator/">คำนวณคาร์บอนของคุณ</CtaLink>
        </div>
      </Section>
    </ContentShell>
  )
}
