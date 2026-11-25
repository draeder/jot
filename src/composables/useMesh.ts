/**
 * Jot on PeerPigeon (PeerPigeonNode) with freertc signaling, as PigeonFeed runs it: one node for the
 * page, in the room 'jot' / 'global'. Notes are not kept in that room: each workspace has a room of its
 * own on the storage servers (openRoom, lib/links.ts), and pictures are blobs there.
 */
import { ref } from 'vue'
import { PeerPigeonNode, type PeerPigeonKeyPair, type PeerPigeonStorage } from 'peerpigeon'
import { PREFIX } from '@/lib/model'
import type { BlobStore } from '@/lib/media'

export const DEFAULT_SIGNALING_URLS = ['wss://peer.ooo/ws']

/**
 * The relays to start from: ?signal=<ws url>[,<ws url>…] in the page's address (a local relay, say), else
 * the default. A local relay is ws://<its host>:8788/ws.
 */
export function signalingUrls(): string[] {
  try {
    const asked = new URLSearchParams(location.search).get('signal')
    const urls = (asked ?? '').split(',').map((u) => u.trim()).filter((u) => /^wss?:\/\//.test(u))
    if (urls.length) return urls
  } catch { /* no address: the default */ }
  return DEFAULT_SIGNALING_URLS
}

export type Keys = PeerPigeonKeyPair

const connected = ref(false)
const starting = ref(false)
const error = ref<string | null>(null)
/** Everyone else in the room right now. */
const online = ref(0)
/** The relay this page signals through, as a person reads it. */
const relay = ref('')

let node: PeerPigeonNode | null = null
let started: Promise<void> | null = null
let accountKeys: { pub: string; priv: string } | null = null
let timer: ReturnType<typeof setInterval> | null = null

const refresh = () => {
  if (!node) { online.value = 0; return }
  const self = String(node.getClientId() ?? '')
  const ids = new Set([...node.getGlobalPeers(), ...node.getConnectedPeers()].map(String))
  ids.delete(self)
  // Not people: peers a relay lists with a role (storage servers, bots).
  for (const id of [...ids]) if (node.getPeerRole(id)) ids.delete(id)
  online.value = ids.size
  relay.value = node.currentRelayName?.() ?? ''
}

/** Start the node (once) on the given relays; the first is the bootstrap, freertc then picks the room's. */
export function startMesh(network = 'global', urls: string[] = signalingUrls()): Promise<void> {
  if (started) return started
  starting.value = true
  error.value = null
  const n = new PeerPigeonNode({
    networkId: 'jot',
    sessionId: network || 'global',
    signalingServer: urls[0],
    signalingServers: urls.slice(1),
    automaticSignalingServer: true,
    minPeers: 2,
    maxPeers: 10,
    crypto: {},
    // Rooms opened with openRoom take this too: changes under jot/ that arrive from the servers are kept.
    storage: { replicate: [PREFIX] },
  })
  node = n
  // For looking at a running page from the console; read-only by intent.
  ;(globalThis as Record<string, unknown>).__jot = { node: n }
  n.on('ready', () => { connected.value = true; refresh() })
  n.on('peerConnected', () => { connected.value = true; refresh() })
  n.on('peerDisconnected', () => refresh())
  n.on('error', (err: Error) => console.warn('PeerPigeon:', err?.message ?? err))
  n.on('message', (m: { kind?: string; local?: boolean; data?: unknown }) => {
    if (m.kind !== 'broadcast' || m.local) return
    for (const h of listeners) { try { h(m.data) } catch { /* that listener's */ } }
  })
  started = n.start().then(() => {
    // Signed in before the mesh was up: sign as the account from the start.
    if (accountKeys) n.storage?.signAs(accountKeys)
    signalUp = true
    signalDownSince = 0
    connected.value = true
    refresh()
  }).catch((err: unknown) => {
    error.value = err instanceof Error ? err.message : String(err)
    node = null
    started = null
    throw err
  }).finally(() => { starting.value = false })
  timer ??= setInterval(refresh, 2000)
  watching ??= setInterval(watch, WATCH_MS)
  // A tab closing tells its neighbours, so their count drops it now and not when its lease runs out.
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return
    try { (node?.mesh as unknown as { announceLeave?: () => void })?.announceLeave?.() } catch { /* best effort */ }
  })
  return started
}

// ---------- staying connected: after the computer sleeps, the network drops, or the node could not start
//
// PeerPigeon reconnects by itself after most of these. When it hasn't, a while after (the relay not reached,
// or no storage server), the node is made again, and the rooms opened again on it (onRestart). After a
// sleep that it did come back from, the rooms are read again for what changed meanwhile (onWake).

const WATCH_MS = 5000
/** Asleep at least this long (the watch did not run): a wake. */
const SLEPT_MS = 20_000
/** How long after a wake (or the relay lost) the node may take to come back by itself. */
const GRACE_MS = 15_000
let signalUp = false
let signalDownSince = 0
let watching: ReturnType<typeof setInterval> | null = null
let lastWatch = Date.now()
let checkAt = 0
let restarting: Promise<void> | null = null
const restartListeners = new Set<() => void>()
const wakeListeners = new Set<() => void>()

/** The node was made again: rooms opened on the old one are gone. */
export function onRestart(f: () => void): () => void { restartListeners.add(f); return () => { restartListeners.delete(f) } }
/** Back from a sleep (or the network back), still connected: worth reading the rooms again. */
export function onWake(f: () => void): () => void { wakeListeners.add(f); return () => { wakeListeners.delete(f) } }

const woke = () => { checkAt = Date.now() + GRACE_MS }
window.addEventListener('online', woke)
window.addEventListener('pageshow', (e) => { if (e.persisted) woke() })
let hiddenAt = 0
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') hiddenAt = Date.now()
  else if (hiddenAt && Date.now() - hiddenAt > SLEPT_MS) woke()
})

async function healthy(): Promise<boolean> {
  if (!node || !signalUp) return false
  return !!(await node.storageServers?.hasServers().catch(() => false))
}

async function watch(): Promise<void> {
  const now = Date.now()
  if (now - lastWatch > SLEPT_MS) woke() // the page was frozen: the computer slept
  lastWatch = now
  if (restarting || starting.value) return
  const lostRelay = !!signalDownSince && now - signalDownSince > GRACE_MS * 2
  if (!node && !started) { await restart(); return } // never started (offline at first): try again
  if (!checkAt && !lostRelay) return
  if (checkAt && now < checkAt && !lostRelay) return
  checkAt = 0
  if (await healthy()) { for (const f of wakeListeners) f(); return }
  await restart()
}

/** The node made again, on the same relays, and the rooms told to open again. */
async function restart(): Promise<void> {
  restarting ??= (async () => {
    console.warn('jot: reconnecting to the mesh')
    const old = node
    node = null
    started = null
    signalUp = false
    signalDownSince = 0
    connected.value = false
    await old?.destroy().catch(() => {})
    try {
      await startMesh()
      for (const f of restartListeners) f()
    } catch (e) {
      console.warn('jot: not reconnected yet:', e)
    }
  })().finally(() => { restarting = null })
  return restarting
}

/** The room's storage, once the node is running (null if it could not start). */
export async function storage(): Promise<PeerPigeonStorage | null> {
  await started?.catch(() => {})
  return node?.storage ?? null
}

/** This browser's own keys: who a person is here before (or without) signing in. */
export async function browserKeys(): Promise<Keys | null> {
  await started?.catch(() => {})
  try { return node ? { ...node.getKeyPair() } : null } catch { return null }
}

/** Sign what this page writes as an account (after signing in); null: as this browser again. */
export function signAs(keys: { pub: string; priv: string } | null): void {
  accountKeys = keys?.pub && keys?.priv ? { pub: keys.pub, priv: keys.priv } : null
  node?.storage?.signAs(accountKeys)
}

/** Picture pieces on the storage servers (lib/media.ts). */
export const blobs: BlobStore = {
  async put(bytes) {
    await started?.catch(() => {})
    const link = node?.storageServers
    if (!link || !(await link.hasServers().catch(() => false))) return 0
    return link.putBlob(bytes)
  },
  async get(hash) {
    await started?.catch(() => {})
    return (await node?.storageServers?.getBlob(hash).catch(() => null)) ?? null
  },
}

/** A request to the relay this page is on (PigeonIdP accounts, kept by local relays). */
export async function relayRequest(body: Record<string, unknown>): Promise<any> {
  const mesh = node?.mesh as unknown as { relayRequest?: (b: Record<string, unknown>, o?: { timeoutMs?: number }) => Promise<unknown> } | undefined
  if (!mesh?.relayRequest) throw new Error('not on a relay')
  return mesh.relayRequest(body, { timeoutMs: 5000 })
}

/** A record everyone may read and write (account records, as copies of what the relays keep). */
export async function publicPut(key: string, value: unknown): Promise<void> {
  const s = await storage()
  if (!s) throw new Error('Storage not ready')
  await s.put('public', key, JSON.parse(JSON.stringify(value)))
}

/** waitMs: keep asking that long when nobody has answered yet (links still forming after the page opens). */
export async function publicGet(key: string, options: { waitMs?: number } = {}): Promise<any> {
  const s = await storage()
  if (!s) throw new Error('Storage not ready')
  const deadline = Date.now() + Math.max(0, Number(options.waitMs) || 0)
  for (;;) {
    const record = await s.retrieve('public', key, { timeoutMs: 3000 })
    if (record) return record.value
    if (Date.now() >= deadline) return null
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

/**
 * A room of its own on the storage servers (lib/links.ts names them). signingKeys: who signs what is
 * written there (an account's keys; by default this browser's). owner: only that key may write it.
 */
export async function openRoom(name: string, options: { signingKeys?: { pub: string; priv: string } | null; owner?: string } = {}): Promise<PeerPigeonStorage> {
  await started
  if (!node) throw new Error('Not connected')
  return node.openStorage(name, options)
}

const listeners = new Set<(data: unknown) => void>()

/** Something to everyone in jot's room on the mesh (false: not on the mesh now). */
export function broadcast(data: unknown): boolean {
  if (!node) return false
  try { node.broadcast(data); return true } catch { return false }
}

/** What others broadcast in jot's room. */
export function onBroadcast(handler: (data: unknown) => void): () => void {
  listeners.add(handler)
  return () => { listeners.delete(handler) }
}

/** Whether this page has reached any storage server. */
export async function hasServers(): Promise<boolean> {
  await started?.catch(() => {})
  return !!(await node?.storageServers?.hasServers().catch(() => false))
}

export function useMesh() {
  return { connected, starting, error, online, relay }
}
