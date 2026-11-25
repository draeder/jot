import { createApp } from 'vue'
import App from './App.vue'
import '@fontsource-variable/archivo/wdth.css'
import './style.css'

createApp(App).mount('#app')

// A page left open keeps running the build it loaded with. It asks for
// version.json, never from a cache, when it starts, when it comes back into
// view and every minute, and reloads itself when a newer build is out, unless
// something is being written (the canvas marks the page while a note is open).
declare const __BUILD__: string
let newerBuild: string | null = null
const reloadWhenIdle = () => {
  if (!newerBuild || document.documentElement.dataset.writing === '1') return
  const version = newerBuild.split(' ')[0]
  const url = new URL(location.href)
  if (url.searchParams.get('v') === version) return
  url.searchParams.set('v', version)
  location.replace(url.toString())
}
const checkBuild = async () => {
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!response.ok) return
    const { build } = await response.json()
    if (build && build !== __BUILD__) newerBuild = build
  } catch { /* offline: next check */ }
  if (newerBuild) reloadWhenIdle()
}
if (import.meta.env.PROD) {
  void checkBuild()
  setInterval(checkBuild, 60_000)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void checkBuild() })
  setInterval(() => { if (newerBuild) reloadWhenIdle() }, 5_000)
}
