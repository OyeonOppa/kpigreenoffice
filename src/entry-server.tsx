import { StrictMode } from 'react'
import { prerenderToNodeStream } from 'react-dom/static'
import App from './App'

export { SEO_PAGES } from './seo/pages'
export { headFor, llmsTxt, notFoundHead, sitemapXml } from './seo/head'

/** แปลงหน้าเป็น HTML ตอน build — ใช้ prerender เพราะต้องรอหน้าที่โหลดแบบ lazy ให้เสร็จก่อน */
export async function render(path: string): Promise<string> {
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <App initialPath={path} />
    </StrictMode>,
  )
  const chunks: Buffer[] = []
  for await (const chunk of prelude) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString('utf8')
}
