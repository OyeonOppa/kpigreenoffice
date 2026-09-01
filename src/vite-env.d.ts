/// <reference types="vite/client" />

declare module 'virtual:live-backend' {
  import type { GameBackend } from './game/backend'
  export const backend: GameBackend
}

interface ImportMetaEnv {
  readonly VITE_LIVE_API?: string
  /** REST API ของแคมเปญป่า 3R — ปกติเป็น URL เดียวกับ VITE_LIVE_API (Worker ตัวเดียวกัน) */
  readonly VITE_FOREST_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
