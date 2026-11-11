// สร้าง HTML สำเร็จรูปของทุกหน้าใน src/seo/pages.ts หลัง vite build
//
// เหตุผล: เว็บเป็น React ถ้าไม่ทำขั้นนี้ เซิร์ฟเวอร์จะส่ง <div id="root"></div> เปล่า ๆ
// บอทของ AI ส่วนใหญ่ไม่รันจาวาสคริปต์ จึงอ่านเนื้อหาไม่ได้เลย และทุกหน้าจะใช้ title เดียวกัน
//
// ลำดับ: vite build → vite build --ssr → สคริปต์นี้ (ดู "build" ใน package.json)

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const ssrDir = join(root, 'dist-ssr')

const { SEO_PAGES, render, headFor, notFoundHead, sitemapXml, llmsTxt } = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href)

const template = await readFile(join(dist, 'index.html'), 'utf8')
const HEAD = /<!--seo:start-->[\s\S]*?<!--seo:end-->/
if (!HEAD.test(template) || !template.includes('<div id="root"></div>')) {
  throw new Error('index.html ไม่มีจุดแทรก <!--seo:start--> หรือ <div id="root"></div>')
}

const build = (head, body) => template.replace(HEAD, head).replace('<div id="root"></div>', `<div id="root">${body}</div>`)

for (const page of SEO_PAGES) {
  const html = build(headFor(page), await render(page.path))
  const dir = join(dist, page.path)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'index.html'), html)
  console.log(`  ${page.path}  ${(html.length / 1024).toFixed(0)} KB`)
}

// มีไฟล์นี้แล้ว Cloudflare Pages จะตอบ 404 จริงแทนการส่งหน้าแรกกลับไปทุก URL
await writeFile(join(dist, '404.html'), build(notFoundHead(), await render('/__not-found__/')))
await writeFile(join(dist, 'sitemap.xml'), sitemapXml())
await writeFile(join(dist, 'llms.txt'), llmsTxt())
await rm(ssrDir, { recursive: true, force: true })
console.log(`prerender: ${SEO_PAGES.length} หน้า + 404, sitemap.xml, llms.txt`)
