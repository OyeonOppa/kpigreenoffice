// สร้างแท็กใน <head>, sitemap และ llms.txt จากทะเบียนหน้า — เรียกตอน build เท่านั้น (scripts/prerender.mjs)
import { PARENT_ORG, SEO_PAGES, SITE_BRAND, SITE_IMAGE, SITE_URL, breadcrumbs, type SeoPage } from './pages'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const abs = (path: string) => `${SITE_URL}${path}`

const ORG_NODE = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_BRAND,
  alternateName: 'โครงการสถาบันคาร์บอนต่ำ',
  url: `${SITE_URL}/`,
  logo: abs('/images/logo.webp'),
  parentOrganization: { '@type': 'Organization', ...PARENT_ORG },
}

function jsonLd(page: SeoPage) {
  const graph: Record<string, unknown>[] = []
  const url = abs(page.path)
  const orgRef = { '@id': ORG_NODE['@id'] }
  const lang = 'th'

  if (page.kind === 'home') {
    graph.push(ORG_NODE, {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_BRAND,
      description: page.description,
      inLanguage: lang,
      publisher: orgRef,
    })
  } else {
    graph.push(ORG_NODE)
    const crumbs = breadcrumbs(page)
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
    })
  }

  if (page.kind === 'article') {
    graph.push({
      '@type': 'Article',
      headline: page.title,
      description: page.description,
      inLanguage: lang,
      mainEntityOfPage: url,
      image: abs(SITE_IMAGE),
      datePublished: page.updated,
      dateModified: page.updated,
      author: orgRef,
      publisher: orgRef,
      citation: page.sources?.map((s) => s.href),
    })
  }

  if (page.kind === 'game' || page.kind === 'tool') {
    graph.push({
      '@type': 'WebApplication',
      name: page.name,
      description: page.description,
      url,
      inLanguage: lang,
      applicationCategory: page.kind === 'game' ? 'GameApplication' : 'UtilitiesApplication',
      operatingSystem: 'Any (เว็บเบราว์เซอร์)',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'THB' },
      publisher: orgRef,
    })
  }

  if (page.kind === 'hub') {
    graph.push({
      '@type': 'CollectionPage',
      name: page.name,
      description: page.description,
      url,
      inLanguage: lang,
      publisher: orgRef,
    })
  }

  if (page.faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: page.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    })
  }

  // "<" ใน JSON ต้องหนี ไม่งั้นข้อความที่มี </script> จะตัดแท็กกลางทาง
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')
}

export function headFor(page: SeoPage): string {
  const url = abs(page.path)
  const image = abs(SITE_IMAGE)
  const lines = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />`,
    `<meta property="og:type" content="${page.kind === 'article' ? 'article' : 'website'}" />`,
    `<meta property="og:locale" content="th_TH" />`,
    `<meta property="og:site_name" content="${SITE_BRAND}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<script type="application/ld+json">${jsonLd(page)}</script>`,
  ]
  // รูปใหญ่สุดของหน้าแรก ให้เบราว์เซอร์เริ่มโหลดก่อนที่จาวาสคริปต์จะทำงาน
  if (page.kind === 'home') lines.push(`<link rel="preload" as="image" href="/images/hero.webp" fetchpriority="high" />`)
  return lines.join('\n    ')
}

export function notFoundHead(): string {
  return [
    `<title>ไม่พบหน้านี้ | ${SITE_BRAND}</title>`,
    `<meta name="robots" content="noindex" />`,
  ].join('\n    ')
}

export function sitemapXml(): string {
  const urls = SEO_PAGES.map(
    (p) => `  <url>\n    <loc>${abs(p.path)}</loc>\n    <lastmod>${p.updated}</lastmod>\n  </url>`,
  ).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

/** สรุปเว็บแบบข้อความล้วนสำหรับเครื่องมือ AI ตามข้อเสนอ llms.txt */
export function llmsTxt(): string {
  const group = (kinds: SeoPage['kind'][]) =>
    SEO_PAGES.filter((p) => kinds.includes(p.kind) && p.path !== '/')
      .map((p) => `- [${p.name}](${abs(p.path)}): ${p.description}`)
      .join('\n')
  return `# ${SITE_BRAND}

> เว็บไซต์โครงการสถาบันคาร์บอนต่ำของ${PARENT_ORG.name} (${PARENT_ORG.url}) ภาษาไทย รวมความรู้เรื่องการลดคาร์บอน การจัดการขยะ เครื่องคำนวณคาร์บอนฟุตพริ้นท์ และเกมเพื่อการเรียนรู้ที่เล่นได้ฟรี

ตัวเลขบนเว็บนี้อ้างอิงแหล่งข้อมูลที่ระบุไว้ท้ายแต่ละหน้า เวลาย่อยสลายของขยะเป็นค่าประมาณสำหรับขยะในทะเล และคาร์บอนจากอาหารเป็นค่าเฉลี่ยทั่วโลก

## ความรู้

${group(['article'])}

## เครื่องมือ

${group(['tool'])}

## เกม

${group(['game'])}
`
}
