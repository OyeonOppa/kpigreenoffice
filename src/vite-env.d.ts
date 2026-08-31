/// <reference types="vite/client" />

declare module 'virtual:live-backend' {
  import type { GameBackend } from './game/backend'
  export const backend: GameBackend
}

interface ImportMetaEnv {
  readonly VITE_LIVE_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
