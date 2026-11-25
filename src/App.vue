<template>
  <div class="app">
    <header class="topbar">
      <button v-if="page === 'app'" class="menu-toggle" :aria-expanded="showList" :aria-label="showList ? 'Close workspaces' : 'Workspaces'" @click="showList = !showList">
        <Icon :name="showList ? 'close' : 'sidebar'" />
      </button>
      <a href="/" class="brand" aria-label="Jot" @click.prevent="goApp">
        <img src="/jot-mark.svg" alt="" class="brand-mark" />
        <span class="wordmark">Jot</span>
      </a>

      <p class="net" :class="statusClass" role="status">
        <span class="net-dot" aria-hidden="true" :title="statusText"></span>
        <span class="net-text">{{ statusText }}</span>
      </p>

      <SearchBox v-if="page === 'app'" class="topsearch" @pick="openCard" />

      <nav v-if="page === 'app'" class="nav" aria-label="Jot">
        <button class="nav-link" :disabled="!current" @click="sheet = 'share'"><Icon name="share" /><span>Share</span></button>
        <button class="nav-link" title="Export and import" aria-label="Export and import" @click="sheet = 'data'"><Icon name="data" /><span class="wide-only">Export</span></button>
        <button class="nav-link" title="How jot works" aria-label="How jot works" @click="sheet = 'help'"><Icon name="help" /></button>
        <button class="nav-link nav-login" @click="sheet = 'account'">{{ account ? account.alias : 'Log in' }}</button>
      </nav>
      <button
        type="button" class="theme-switch"
        :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" :title="theme === 'dark' ? 'Light mode' : 'Dark mode'"
        @click="setTheme(theme === 'dark' ? 'light' : 'dark')"
      >
        <svg v-if="theme === 'dark'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" /></svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
      </button>
    </header>

    <main v-if="page === 'app'" class="main">
      <WorkspaceList :open="showList" @picked="showList = false">
        <p class="build" :title="buildTitle">Jot {{ shortBuild }}</p>
        <p class="phone-only"><a href="#" @click.prevent="sheet = 'data'; showList = false">Export and import</a> · <a href="#" @click.prevent="sheet = 'help'; showList = false">How jot works</a></p>
        <p><a href="/privacy" @click.prevent="go('privacy')">Privacy</a> · <a href="/terms" @click.prevent="go('terms')">Terms</a></p>
      </WorkspaceList>
      <div v-if="showList" class="scrim" @click="showList = false" />
      <Canvas v-if="current" ref="canvas" :key="current.id" />
      <p v-else-if="loaded" class="hint center">Pick a workspace, or make a new one.</p>
      <p v-if="notice" class="notice" role="status">{{ notice }} <button class="btn btn-quiet" @click="notice = null">OK</button></p>
    </main>
    <main v-else class="main legal-main">
      <LegalPage :page="page" @back="goApp" />
    </main>

    <ShareSheet v-if="sheet === 'share' && current" :ws="current" @close="sheet = null" />
    <AccountSheet v-if="sheet === 'account'" @close="sheet = null" />
    <DataSheet v-if="sheet === 'data'" @close="sheet = null" />
    <HelpSheet v-if="sheet === 'help'" @close="sheet = null" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import AccountSheet from './components/AccountSheet.vue'
import Canvas from './components/Canvas.vue'
import DataSheet from './components/DataSheet.vue'
import HelpSheet from './components/HelpSheet.vue'
import Icon from './components/Icon.vue'
import LegalPage from './components/LegalPage.vue'
import SearchBox from './components/SearchBox.vue'
import ShareSheet from './components/ShareSheet.vue'
import WorkspaceList from './components/WorkspaceList.vue'
import { hasServers, startMesh, useMesh } from './composables/useMesh'
import { initIdentity, useIdentity } from './composables/useIdentity'
import { loadJot, openInvite, select, startSync, useJot } from './composables/useJot'
import { parseInvite } from './lib/links'
import { sendWaitingImages } from './lib/images'

declare const __BUILD__: string
const build = __BUILD__
// The footer shows the commit and when it was built; the rest (the packages' commits) on hover.
const shortBuild = build.replace(/\s*\([^)]*\)/, '')
const buildTitle = computed(() => `Jot ${build}\nPeer to peer on PeerPigeon${relay.value ? ` · ${/relay/.test(relay.value) ? relay.value : `relay ${relay.value}`}` : ''}`)

const { connected, starting, error: meshError, relay } = useMesh()
const { account } = useIdentity()
const { current, loaded, notice } = useJot()

type Page = 'app' | 'privacy' | 'terms'
const pageOf = (path: string): Page => (path === '/privacy' ? 'privacy' : path === '/terms' ? 'terms' : 'app')
const page = ref<Page>(pageOf(location.pathname))
const go = (p: Page) => { history.pushState(null, '', p === 'app' ? '/' : `/${p}`); page.value = p; window.scrollTo(0, 0) }
const goApp = () => go('app')
window.addEventListener('popstate', () => { page.value = pageOf(location.pathname) })

const sheet = ref<'share' | 'account' | 'data' | 'help' | null>(null)
const showList = ref(false)
const canvas = ref<InstanceType<typeof Canvas> | null>(null)

const statusClass = computed(() => (connected.value ? 'status-connected' : starting.value ? 'status-connecting' : 'status-off'))
const statusText = computed(() => (connected.value ? 'Connected' : starting.value ? 'Connecting' : meshError.value ? 'Offline' : 'Starting'))

async function openCard(ws: string, card: string): Promise<void> {
  await select(ws)
  await nextTick()
  requestAnimationFrame(() => canvas.value?.focusCard(card))
}

/** A link to a workspace (#/join/… or #/view/…): opened, then taken out of the address. */
async function takeInvite(): Promise<void> {
  const invite = parseInvite(location.hash)
  if (!invite) {
    if (/^#\/(join|view)\//.test(location.hash)) notice.value = 'That link to a workspace isn’t complete: ask for it again.'
    return
  }
  history.replaceState(null, '', location.pathname + location.search)
  if (page.value !== 'app') page.value = 'app'
  await openInvite(invite)
}
window.addEventListener('hashchange', () => { void takeInvite() })

onMounted(async () => {
  await loadJot()
  await takeInvite()
  try {
    await startMesh()
    await initIdentity()
    await startSync()
    if (await hasServers()) void sendWaitingImages()
  } catch (error) {
    console.warn('jot: not connected:', error)
  }
})

// The theme switch (the page starts in the kept theme, or the system's: index.html).
const THEME_KEY = 'jot:theme'
const theme = ref<'light' | 'dark'>(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
const setTheme = (next: 'light' | 'dark') => {
  theme.value = next
  document.documentElement.dataset.theme = next
  document.documentElement.style.colorScheme = next
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#1b2430' : '#e8f6f9')
  try { localStorage.setItem(THEME_KEY, next) } catch { /* private mode: not remembered */ }
}
</script>

<style scoped>
.app { height: 100dvh; display: flex; flex-direction: column; }

/* ---------- top bar (as PigeonFeed and PigeonChess) ---------- */
.topbar { height: var(--topbar); flex: none; display: flex; align-items: center; gap: 1.25rem; padding: 0 16px 0 20px; border-bottom: 1px solid var(--line); background: var(--paper); position: relative; z-index: 40; }
.brand { display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.35rem; margin-left: -0.35rem; border-radius: var(--radius); color: var(--ink); text-decoration: none; }
.brand:hover .wordmark { color: var(--sheen); }
.brand-mark { width: 26px; height: 26px; }
.wordmark { font-stretch: 125%; font-weight: 800; font-size: 1.2rem; letter-spacing: -0.02em; }
.net { display: flex; align-items: center; gap: 0.5rem; color: var(--ink-2); font-size: 0.875rem; white-space: nowrap; }
.net-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--line-strong); }
.status-connected .net-dot { background: var(--sheen); }
.status-connecting .net-dot { background: var(--slate); animation: blink 1.4s ease-in-out infinite; }
@keyframes blink { 50% { opacity: 0.3; } }
.topsearch { margin-left: auto; }
.nav { display: flex; align-items: center; gap: 0.15rem; margin-left: auto; }
.topsearch + .nav { margin-left: 0; }
.nav-link { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.65rem; border-radius: var(--radius); font-weight: 500; color: var(--ink); }
.nav-link:hover:not(:disabled) { background: var(--wing); }
.nav-link:disabled { opacity: 0.4; }
.nav-login { border: 1px solid var(--line-strong); margin-left: 0.4rem; max-width: 12rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
.theme-switch { display: grid; place-items: center; width: 36px; height: 36px; flex: none; border-radius: var(--radius); color: var(--ink-2); }
.theme-switch:hover { color: var(--ink); }
.theme-switch svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.menu-toggle { display: none; width: 40px; height: 40px; flex: none; place-items: center; border-radius: var(--radius); color: var(--ink); }

/* ---------- the page ---------- */
.main { flex: 1; min-height: 0; display: flex; position: relative; }
.legal-main { overflow: auto; display: block; }
.side-foot p, :deep(.side-foot p) { line-height: 1.6; }
:deep(.side-foot a) { color: inherit; }
.center { margin: auto; }
.scrim { display: none; }
.phone-only { display: none; }
.build { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: default; }
.notice { position: absolute; left: 50%; bottom: 20px; transform: translateX(-50%); z-index: 20; background: var(--ink); color: var(--paper); padding: 0.45rem 0.5rem 0.45rem 0.9rem; border-radius: var(--radius); display: flex; align-items: center; gap: 0.6rem; box-shadow: 0 8px 24px rgba(28, 33, 38, 0.25); }
.notice .btn-quiet { color: var(--paper); }

@media (max-width: 1100px) {
  .wide-only { display: none; }
}
@media (max-width: 860px) {
  .topbar { padding: 0 8px; gap: 0.5rem; }
  .net-text { display: none; }
  .menu-toggle { display: grid; }
  .nav-link span { display: none; }
  .nav-login { max-width: 7rem; }
  .scrim { display: block; position: absolute; inset: 0; z-index: 25; background: rgba(28, 33, 38, 0.3); }
}
@media (max-width: 560px) {
  .wordmark { display: none; }
  .nav-link:not(.nav-login):nth-child(2), .nav-link:not(.nav-login):nth-child(3) { display: none; }
  :deep(.phone-only) { display: block; }
}
</style>
