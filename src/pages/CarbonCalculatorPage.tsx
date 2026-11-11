import CarbonCalculator from '../components/CarbonCalculator'
import ContentShell, { Section } from '../components/seo/ContentShell'
import { pageByPath } from '../seo/pages'

const page = pageByPath('/carbon-calculator/')!

export default function CarbonCalculatorPage() {
  return (
    <ContentShell page={page} heading="คำนวณคาร์บอนฟุตพริ้นท์ของคุณ">
      <p className="mt-5 text-lg text-ink/90 leading-relaxed">
        คาร์บอนฟุตพริ้นท์ (carbon footprint หรือคาร์บอนฟุตพรินต์) คือปริมาณก๊าซเรือนกระจกทั้งหมดที่เกิดจากกิจกรรมของเรา เครื่องคำนวณนี้ถามเรื่องการเดินทาง เที่ยวบิน อาหาร และค่าไฟ
        แล้วประมาณให้ว่าปีหนึ่งคุณปล่อยกี่ตันคาร์บอนไดออกไซด์เทียบเท่า ใช้ฟรีและไม่ต้องสมัครสมาชิก
      </p>

      <div className="-mx-5 sm:-mx-6 mt-6 [&>section]:py-8 [&>section]:md:py-10">
        <CarbonCalculator />
      </div>

      <Section title="เครื่องคำนวณนี้นับอะไรบ้าง">
        <ul className="list-disc pl-5 space-y-2">
          <li><b>การเดินทางไปทำงาน</b> คิดจากระยะทางต่อวันและประเภทพาหนะ</li>
          <li><b>เที่ยวบิน</b> คิดจากจำนวนเที่ยวในประเทศและต่างประเทศต่อปี</li>
          <li><b>อาหาร</b> คิดจากจำนวนมื้อเนื้อวัว เนื้อไก่ และเนื้อหมูต่อสัปดาห์</li>
          <li><b>ไฟฟ้าที่บ้าน</b> คิดจากค่าไฟต่อเดือน หารด้วยจำนวนคนในบ้าน</li>
        </ul>
        <p>
          ค่าที่ใช้เป็นค่าประมาณจากข้อมูลที่เผยแพร่ เพื่อการเรียนรู้เท่านั้น ไม่นับสินค้าที่ซื้อ ขยะ หรือบริการอื่น ๆ และไม่ใช่การประเมินอย่างเป็นทางการ
        </p>
      </Section>

      <Section title="ผลลัพธ์ของฉันมากหรือน้อย">
        <p>
          ปี 2024 ประเทศไทยปล่อย CO₂ เฉลี่ยราว <b>3.74 ตันต่อคน</b> ส่วนค่าเฉลี่ยโลกราว <b>4.73 ตันต่อคน</b> ตัวเลขนี้นับเฉพาะ CO₂ จากเชื้อเพลิงฟอสซิลและอุตสาหกรรมทั้งประเทศ
          ซึ่งเป็นคนละขอบเขตกับเครื่องคำนวณนี้ จึงใช้เทียบได้แบบคร่าว ๆ
        </p>
      </Section>
    </ContentShell>
  )
}
