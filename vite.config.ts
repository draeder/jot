import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { resolve } from 'path'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

// Which build a page is running, shown at the foot of the page, so a stale page is easy to spot.
const commit = (() => { try { return execSync('git rev-parse --short HEAD').toString().trim() } catch { return 'dev' } })()
// When it was built: the month and year only, in the site's own time zone.
const builtAt = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/Chicago' })
// The commits of the packages installed from GitHub, as the lockfile names them (shown with the build).
const pinned = (name: string): string | null => {
  try {
    const lock = JSON.parse(readFileSync(resolve(__dirname, 'package-lock.json'), 'utf8'))
    return /[#/]([0-9a-f]{7})[0-9a-f]*$/.exec(lock.packages?.[`node_modules/${name}`]?.resolved ?? '')?.[1] ?? null
  } catch { return null }
}
const build = `${commit} (PeerPigeon ${pinned('peerpigeon') ?? '?'}, freertc ${pinned('freertc') ?? '?'}), ${builtAt}`

const lan = !!process.env.JOT_LAN

export default defineConfig(({ command }) => ({
  // `npm run dev`: http://localhost:5173 (a secure page to the browser, as localhost is). `npm run dev:lan`: over
  // https (a certificate of its own, accepted once in the browser) on every address, for a phone on the LAN:
  // the crypto PeerPigeon, unsea and PigeonIdP use is only given to secure pages.
  plugins: [vue(), ...(command === 'serve' && lan ? [basicSsl()] : []), {
    // version.json names the build; open pages compare it with their own and
    // reload when a newer one is out (src/main.ts).
    name: 'build-version',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build }) })
    },
  }],
  define: { __BUILD__: JSON.stringify(build) },
  resolve: { alias: { '@': resolve(__dirname, './src') } },
  server: { port: 5173, host: lan },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: { output: { manualChunks: { 'vue-core': ['vue'], editor: ['@tiptap/vue-3', '@tiptap/starter-kit'] } } },
  },
}))
