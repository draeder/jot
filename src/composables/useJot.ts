/**
 * Jot's notes as the page shows them, and how they stay in step with their rooms.
 *
 * This browser keeps every workspace it has (lib/local.ts), so jot opens at once and works offline. Each
 * workspace has a room on the storage servers (lib/links.ts) where its cards and lines are kept, sealed
 * with the room's secret; a change here goes there, and a change made elsewhere (another device, someone
 * it is shared with) comes here. The newest change to a card or line wins.
 *
 * Signed in, an account's list of its workspaces (and their secrets) is kept in a room of the account's
 * own, so every device it signs in on has them. A published workspace is copied, by its publisher, to a
 * read-only room only their key writes.
 */
import { computed, ref, shallowRef, triggerRef, watch } from 'vue'
import type { PeerPigeonStorage } from 'peerpigeon'
import { local, legacyNotes } from '@/lib/local'
import { indexRoom, newSecret, viewRoom, workspaceRoom, type Invite } from '@/lib/links'
import {
  CARD_H, CARD_W, META_KEY, cardKey, cardRecord, cleanName, indexKey, indexRecord, linkKey, linkRecord, newId,
  parseCard, parseImport, parseIndex, parseLink, parseMeta, placeCard,
  type Card, type Link, type LinkKind, type Workspace,
} from '@/lib/model'
import { openRoom } from './useMesh'
import { useIdentity } from './useIdentity'

type Room = PeerPigeonStorage
interface Change { origin: 'local' | 'remote'; op: 'upsert' | 'delete'; record: { key: string; value: unknown } | null; space: string; key: string }
export type SyncState = 'local' | 'syncing' | 'synced' | 'offline'

const workspaces = ref<Workspace[]>([])
const currentId = ref<string | null>(null)
/** The open workspace's cards and lines. */
const cards = shallowRef<Card[]>([])
const links = shallowRef<Link[]>([])
const loaded = ref(false)
/** How each workspace stands with its room. */
const syncState = ref<Record<string, SyncState>>({})
/** Something to tell the person (an import done, a link that didn't open). */
const notice = ref<string | null>(null)

const current = computed(() => workspaces.value.find((w) => w.id === currentId.value) ?? null)
const sorted = () => { workspaces.value = [...workspaces.value].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)) }
const byId = <T extends { id: string }>(list: T[], id: string) => list.find((x) => x.id === id)

const { account, keys } = useIdentity()
/** Who signs what this page writes: the account's keys, else this browser's (undefined: the rooms' default). */
const signing = () => (account.value ? { pub: account.value.keys.pub, priv: account.value.keys.priv } : undefined)

// ------------------------------------------------------------------ this browser's copy

async function saveWorkspace(ws: Workspace, toIndex = true): Promise<void> {
  const i = workspaces.value.findIndex((w) => w.id === ws.id)
  if (i < 0) workspaces.value.push(ws); else workspaces.value[i] = ws
  sorted()
  await local.putWorkspace(ws)
  if (toIndex) void index?.put(ws)
}

// Cards and lines changed here or from a room: shown at once (if theirs is the open workspace), so a
// change made right after sees this one, then kept in this browser.
function show<T extends { id: string; ws: string }>(target: typeof cards | typeof links, list: T[]): void {
  const open = list.filter((x) => x.ws === currentId.value)
  if (!open.length) return
  const next = [...target.value] as unknown as T[]
  for (const x of open) { const i = next.findIndex((y) => y.id === x.id); if (i < 0) next.push(x); else next[i] = x }
  target.value = next as never
}
async function keepCards(list: Card[]): Promise<void> {
  if (!list.length) return
  show(cards, list)
  await local.putCards(list)
}
async function dropCards(ws: string, ids: string[]): Promise<void> {
  if (!ids.length) return
  if (ws === currentId.value) cards.value = cards.value.filter((c) => !ids.includes(c.id))
  await local.deleteCards(ids)
}
async function keepLinks(list: Link[]): Promise<void> {
  if (!list.length) return
  show(links, list)
  await local.putLinks(list)
}
async function dropLinks(ws: string, ids: string[]): Promise<void> {
  if (!ids.length) return
  if (ws === currentId.value) links.value = links.value.filter((l) => !ids.includes(l.id))
  await local.deleteLinks(ids)
}

/**
 * A card or line is in its room now: marked so, if it is still here as it was sent (not deleted or
 * changed again meanwhile: marking it then would bring it back, or undo the change).
 */
async function markSent(item: Card | Link): Promise<void> {
  const isCard = 'content' in item
  const here = (isCard ? await local.cards(item.ws) : await local.links(item.ws)).find((x) => x.id === item.id)
  if (!here || here.at !== item.at || here.synced) return
  const shown = (isCard ? cards.value : links.value) as (Card | Link)[]
  if (item.ws === currentId.value && !shown.some((x) => x.id === item.id && x.at === item.at)) return
  if (isCard) await keepCards([{ ...(here as Card), synced: true }]); else await keepLinks([{ ...(here as Link), synced: true }])
}

// Deletes made before a workspace's room was open: done there once it is (else the room would bring them back).
const tombsKey = (ws: string) => `tombs:${ws}`
async function tombs(ws: string): Promise<Record<string, number>> { return (await local.get<Record<string, number>>(tombsKey(ws))) ?? {} }
async function addTombs(ws: string, keys: string[]): Promise<void> {
  const t = await tombs(ws)
  for (const k of keys) t[k] = Date.now()
  await local.set(tombsKey(ws), t)
}
async function clearTombs(ws: string, keys: string[]): Promise<void> {
  const t = await tombs(ws)
  for (const k of keys) delete t[k]
  await local.set(tombsKey(ws), t)
}

// ------------------------------------------------------------------ a workspace and its room

class Session {
  room: Room | null = null
  /** The read-only copy this page publishes (its publisher's key is this page's). */
  mirror: Room | null = null
  private closed = false
  private watch: ReturnType<typeof setInterval> | null = null
  private listener = (e: Change) => { if (e.origin === 'remote' && e.space === 'public') void this.remote(e) }

  constructor(readonly id: string) {}

  private markState(): void {
    syncState.value = { ...syncState.value, [this.id]: this.room && this.room.serverCount() > 0 ? 'synced' : 'offline' }
  }

  get ws(): Workspace | undefined { return byId(workspaces.value, this.id) }
  private get reader(): boolean { return this.ws?.role === 'viewer' }

  async start(): Promise<void> {
    const ws = this.ws
    if (!ws) return
    syncState.value = { ...syncState.value, [this.id]: 'syncing' }
    try {
      if (ws.role === 'viewer' && ws.view) {
        this.room = await openRoom(viewRoom(ws.id, ws.view.secret), { owner: ws.view.pub })
      } else if (ws.secret) {
        this.room = await openRoom(workspaceRoom(ws.id, ws.secret), { signingKeys: signing() })
        await this.openMirror()
      }
      if (this.closed) { await this.close(); return }
      this.room?.on('change', this.listener)
      await this.reconcile()
      this.markState()
      // Not reached the storage servers yet (just opened, or offline): once they are, again.
      this.watch = setInterval(() => {
        if (!this.room || this.closed) return
        const up = this.room.serverCount() > 0
        if (up && syncState.value[this.id] === 'offline') void this.reconcile().then(() => this.markState(), () => {})
        else if (!up && syncState.value[this.id] === 'synced') this.markState()
      }, 3000)
    } catch (error) {
      if (this.closed) return // closed while starting (signed in or out, or the workspace removed)
      console.warn(`jot: workspace ${this.id} not synced:`, error)
      syncState.value = { ...syncState.value, [this.id]: 'offline' }
    }
  }

  /** The published copy's room, when this page is its publisher. */
  async openMirror(): Promise<void> {
    const ws = this.ws
    const mine = keys.value?.pub
    if (!ws?.view || ws.role === 'viewer' || !mine || ws.view.pub !== mine || this.mirror) return
    this.mirror = await openRoom(viewRoom(ws.id, ws.view.secret), { owner: mine, signingKeys: signing() })
  }

  async close(): Promise<void> {
    this.closed = true
    if (this.watch) clearInterval(this.watch)
    this.room?.off('change', this.listener)
    await Promise.all([this.room?.close(), this.mirror?.close()].map((p) => p?.catch(() => {})))
    this.room = this.mirror = null
  }

  /** Brings this browser and the room to the same notes: the newest of each, both ways. */
  async reconcile(): Promise<void> {
    const room = this.room
    const ws = this.ws
    if (!room || !ws) return
    const records = await room.list('public')
    const remote = new Map(records.map((r) => [r.key, r]))
    const now = Date.now()

    // The name.
    const meta = parseMeta(remote.get(META_KEY)?.value, now)
    if (meta && meta.at > (ws.nameAt ?? 0)) await saveWorkspace({ ...ws, name: meta.name, nameAt: meta.at, at: Math.max(ws.at, meta.at) })
    else if (!this.reader && (!meta || (ws.nameAt ?? 0) > meta.at)) await this.put(META_KEY, { name: ws.name, at: ws.nameAt ?? ws.at })

    const mine = await local.cards(this.id)
    const myLinks = await local.links(this.id)
    const gone = await tombs(this.id)

    if (this.reader) {
      // A read-only copy is as its publisher has it: exactly.
      const theirs = records.map((r) => parseCard(this.id, r.key, r.value, now)).filter((c): c is Card => !!c).map((c) => ({ ...c, synced: true }))
      const theirLinks = records.map((r) => parseLink(this.id, r.key, r.value, now)).filter((l): l is Link => !!l).map((l) => ({ ...l, synced: true }))
      const ids = new Set(theirs.map((c) => c.id)), linkIds = new Set(theirLinks.map((l) => l.id))
      if (records.length || this.room!.serverCount() > 0) {
        await dropCards(this.id, mine.filter((c) => !ids.has(c.id)).map((c) => c.id))
        await dropLinks(this.id, myLinks.filter((l) => !linkIds.has(l.id)).map((l) => l.id))
      }
      await keepCards(theirs)
      await keepLinks(theirLinks)
      return
    }

    // Deletes made here while the room was not open.
    const doneTombs: string[] = []
    for (const [key, at] of Object.entries(gone)) {
      const r = remote.get(key)
      if (r && r.updatedAt > at) continue // changed there since: theirs stands
      if (r) await room.delete('public', key).catch(() => {})
      void this.mirror?.delete('public', key).catch(() => {})
      remote.delete(key)
      doneTombs.push(key)
    }
    await clearTombs(this.id, doneTombs)

    const keepC: Card[] = [], dropC: string[] = [], keepL: Link[] = [], dropL: string[] = []
    const seen = new Set<string>()
    for (const r of remote.values()) {
      const card = parseCard(this.id, r.key, r.value, now)
      const link = card ? null : parseLink(this.id, r.key, r.value, now)
      const item = card ?? link
      if (!item) continue
      seen.add(r.key)
      const here = card ? byId(mine, card.id) : byId(myLinks, link!.id)
      if (!here || item.at > here.at) {
        if (card) keepC.push({ ...card, synced: true }); else keepL.push({ ...link!, synced: true })
      } else if (here.at > item.at) {
        await this.push(here as Card | Link)
      } else if (!here.synced) {
        if (card) keepC.push({ ...(here as Card), synced: true }); else keepL.push({ ...(here as Link), synced: true })
      }
    }
    // Here and not there: new here (sent), or deleted there (once it had been there). A room that
    // answered with nothing at all is taken as not reached, never as everything deleted.
    const reached = records.length > 0
    for (const c of mine) {
      if (seen.has(cardKey(c.id))) continue
      if (c.synced && reached) dropC.push(c.id); else await this.push(c)
    }
    for (const l of myLinks) {
      if (seen.has(linkKey(l.id))) continue
      if (l.synced && reached) dropL.push(l.id); else await this.push(l)
    }
    await keepCards(keepC); await keepLinks(keepL)
    await dropCards(this.id, dropC); await dropLinks(this.id, dropL)
    if (this.mirror) await this.republish()
  }

  /** A change made elsewhere. */
  private async remote(e: Change): Promise<void> {
    const now = Date.now()
    const ws = this.ws
    if (!ws) return
    if (e.key === META_KEY && e.op === 'upsert') {
      const meta = parseMeta(e.record?.value, now)
      if (meta && meta.at > (ws.nameAt ?? 0)) await saveWorkspace({ ...ws, name: meta.name, nameAt: meta.at, at: Math.max(ws.at, meta.at) }, !this.reader)
      if (meta) void this.mirror?.put('public', META_KEY, { name: meta.name, at: meta.at }).catch(() => {})
      return
    }
    const isCard = e.key.startsWith('jot/c/'), isLink = e.key.startsWith('jot/k/')
    if (!isCard && !isLink) return
    if (e.op === 'delete') {
      const id = e.key.slice(6)
      if (isCard) await dropCards(this.id, [id]); else await dropLinks(this.id, [id])
      void this.mirror?.delete('public', e.key).catch(() => {})
      return
    }
    if (isCard) {
      const card = parseCard(this.id, e.key, e.record?.value, now)
      const here = card && (await local.cards(this.id)).find((c) => c.id === card.id)
      if (card && (!here || card.at >= here.at)) {
        await keepCards([{ ...card, synced: true }])
        void this.mirror?.put('public', e.key, cardRecord(card)).catch(() => {})
      }
    } else {
      const link = parseLink(this.id, e.key, e.record?.value, now)
      const here = link && (await local.links(this.id)).find((l) => l.id === link.id)
      if (link && (!here || link.at >= here.at)) {
        await keepLinks([{ ...link, synced: true }])
        void this.mirror?.put('public', e.key, linkRecord(link)).catch(() => {})
      }
    }
  }

  async put(key: string, value: Record<string, unknown>): Promise<void> {
    if (this.reader || !this.room) return
    await this.room.put('public', key, value)
    void this.mirror?.put('public', key, value).catch(() => {})
  }

  /** A card or line changed here: to the room, and marked as there. */
  async push(item: Card | Link): Promise<void> {
    if (this.reader || !this.room) return
    const isCard = 'content' in item
    try {
      await this.put(isCard ? cardKey(item.id) : linkKey(item.id), isCard ? cardRecord(item) : linkRecord(item as Link))
      if (!item.synced) await markSent(item)
    } catch (error) { console.warn('jot: not sent:', error) }
  }

  async remove(keys: string[]): Promise<void> {
    if (this.reader) return
    if (!this.room) { await addTombs(this.id, keys); return }
    await addTombs(this.id, keys)
    for (const key of keys) {
      await this.room.delete('public', key).catch(() => {})
      void this.mirror?.delete('public', key).catch(() => {})
    }
    await clearTombs(this.id, keys)
  }

  /** The published copy made the same as the workspace. */
  async republish(): Promise<void> {
    const mirror = this.mirror, ws = this.ws
    if (!mirror || !ws) return
    const there = new Set((await mirror.list('public').catch(() => [])).map((r) => r.key))
    const want = new Map<string, Record<string, unknown>>([[META_KEY, { name: ws.name, at: ws.nameAt ?? ws.at }]])
    for (const c of await local.cards(this.id)) want.set(cardKey(c.id), cardRecord(c))
    for (const l of await local.links(this.id)) want.set(linkKey(l.id), linkRecord(l))
    for (const [key, value] of want) await mirror.put('public', key, value).catch(() => {})
    for (const key of there) if (!want.has(key)) await mirror.delete('public', key).catch(() => {})
  }

  /** Everything in the published copy, deleted (unpublishing). */
  async unpublish(): Promise<void> {
    const mirror = this.mirror
    if (!mirror) return
    for (const r of await mirror.list('public').catch(() => [])) await mirror.delete('public', r.key).catch(() => {})
    await mirror.close().catch(() => {})
    this.mirror = null
  }

  /** Everything in the room, deleted (the owner deleting the workspace, for everyone). */
  async wipe(): Promise<void> {
    await this.unpublish()
    const room = this.room
    if (!room || this.reader) return
    for (const r of await room.list('public').catch(() => [])) await room.delete('public', r.key).catch(() => {})
  }
}

const sessions = new Map<string, Session>()
let mesh = false
// For looking at a running page from the console; read-only by intent.
;(globalThis as Record<string, unknown>).__jotSync = { sessions, syncState }

function startSession(id: string): void {
  if (!mesh || sessions.has(id)) return
  const s = new Session(id)
  sessions.set(id, s)
  void s.start()
}
async function stopSession(id: string): Promise<void> {
  const s = sessions.get(id)
  sessions.delete(id)
  await s?.close()
}
async function restartAll(): Promise<void> {
  const ids = [...sessions.keys()]
  await Promise.all(ids.map(stopSession))
  for (const w of workspaces.value) startSession(w.id)
}

// ------------------------------------------------------------------ an account's list of workspaces

class Index {
  room: Room | null = null
  private closed = false
  private listener = (e: Change) => { if (e.origin === 'remote' && e.space === 'public') void this.remote(e) }

  async start(k: { pub: string; priv: string }): Promise<void> {
    try {
      this.room = await openRoom(await indexRoom(k.priv), { owner: k.pub, signingKeys: k })
      if (this.closed) { await this.close(); return }
      this.room.on('change', this.listener)
      const records = await this.room.list('public')
      const now = Date.now()
      const theirs = new Map<string, Workspace>()
      for (const r of records) { const w = parseIndex(r.key, r.value, now); if (w) theirs.set(w.id, w) }
      for (const w of theirs.values()) await this.take(w)
      // Here and not in the account: brought in (a workspace made before signing in, or offline), or
      // removed on another device (once it had been in the account).
      for (const w of [...workspaces.value]) {
        if (theirs.has(w.id)) continue
        if (w.indexed && records.length > 0) await forget(w.id)
        // The empty workspace a new browser starts with isn't brought into an account that has some.
        else if (theirs.size > 0 && await untouched(w)) await forget(w.id)
        else await this.put(w)
      }
    } catch (error) { console.warn('jot: the account\'s workspaces not synced:', error) }
  }

  async close(): Promise<void> {
    this.closed = true
    this.room?.off('change', this.listener)
    await this.room?.close().catch(() => {})
    this.room = null
  }

  /** An entry from the account: added here, or newer than here. */
  private async take(w: Workspace): Promise<void> {
    const here = byId(workspaces.value, w.id)
    if (here && here.at >= w.at) { if (!here.indexed) await saveWorkspace({ ...here, indexed: true }, false); return }
    const next: Workspace = { ...here, ...w, nameAt: here?.nameAt ?? 0, indexed: true }
    const secretChanged = here && (here.secret !== next.secret || here.view?.secret !== next.view?.secret || here.view?.pub !== next.view?.pub)
    await saveWorkspace(next, false)
    if (!here) startSession(w.id)
    else if (secretChanged) { await stopSession(w.id); startSession(w.id) }
  }

  private async remote(e: Change): Promise<void> {
    if (!e.key.startsWith('jot/i/')) return
    if (e.op === 'delete') { await forget(e.key.slice(6)); return }
    const w = parseIndex(e.key, e.record?.value)
    if (w) await this.take(w)
  }

  async put(w: Workspace): Promise<void> {
    if (!this.room) return
    try {
      await this.room.put('public', indexKey(w.id), indexRecord(w))
      // Marked as in the account, if it is still here (not removed meanwhile).
      const here = byId(workspaces.value, w.id)
      if (here && !here.indexed) await saveWorkspace({ ...here, indexed: true }, false)
    } catch (error) { console.warn('jot: not kept in the account:', error) }
  }

  async remove(id: string): Promise<void> {
    await this.room?.delete('public', indexKey(id)).catch(() => {})
  }
}

let index: Index | null = null

const FIRST = 'My first workspace'
/** The workspace a browser starts with, as it started: never renamed, never shared, nothing on it. */
async function untouched(w: Workspace): Promise<boolean> {
  return w.role === 'owner' && w.name === FIRST && !w.view && !(await local.cards(w.id)).length
}

async function startIndex(): Promise<void> {
  await index?.close()
  index = null
  const k = account.value?.keys
  if (!mesh || !k) return
  index = new Index()
  await index.start(k)
}

// ------------------------------------------------------------------ starting

/** What this browser has, shown at once (before the mesh is up). */
export async function loadJot(): Promise<void> {
  workspaces.value = await local.workspaces()
  sorted()
  if (!(await local.get('legacy-checked'))) {
    await importLegacy().catch((error) => console.warn('jot: the first jot\'s notes not read:', error))
    await local.set('legacy-checked', true)
  }
  if (!workspaces.value.length) await createWorkspace(FIRST)
  let last: string | null = null
  try { last = localStorage.getItem('jot:current') } catch { /* none kept */ }
  await select(last && byId(workspaces.value, last) ? last : workspaces.value[0]?.id ?? null)
  loaded.value = true
}

/** The mesh is up: every workspace to its room, and the account's list (signed in). */
export async function startSync(): Promise<void> {
  mesh = true
  for (const w of workspaces.value) startSession(w.id)
  await startIndex()
}

// Signing in or out: what this page writes is signed by someone else now, so every room again.
watch(() => account.value?.keys.pub ?? null, (now, before) => {
  if (!mesh || now === before) return
  void restartAll().then(startIndex)
})

/** The first jot's notes in this browser, brought over once (nothing of theirs is changed). */
async function importLegacy(): Promise<void> {
  const old = await legacyNotes()
  if (!old || !old.workspaces.length) return
  const found = parseImport(JSON.stringify(old))
  await addImported(found, false)
}

// ------------------------------------------------------------------ workspaces

export async function select(id: string | null): Promise<void> {
  currentId.value = id
  history.value = { undo: [], redo: [] }
  try { if (id) localStorage.setItem('jot:current', id) } catch { /* not kept */ }
  cards.value = id ? await local.cards(id) : []
  links.value = id ? await local.links(id) : []
}

export async function createWorkspace(name: string): Promise<Workspace> {
  const now = Date.now()
  const order = Math.max(-1, ...workspaces.value.map((w) => w.order)) + 1
  const ws: Workspace = { id: newId(), name: cleanName(name), order, role: 'owner', secret: newSecret(), at: now, nameAt: now }
  await saveWorkspace(ws)
  startSession(ws.id)
  return ws
}

export async function renameWorkspace(id: string, name: string): Promise<void> {
  const ws = byId(workspaces.value, id)
  if (!ws || ws.role === 'viewer') return
  const now = Date.now()
  const next = { ...ws, name: cleanName(name), nameAt: now, at: now }
  await saveWorkspace(next)
  void sessions.get(id)?.put(META_KEY, { name: next.name, at: now }).catch(() => {})
}

/** The list in this order (ids, first to last). */
export async function reorderWorkspaces(ids: string[]): Promise<void> {
  const now = Date.now()
  for (const [i, id] of ids.entries()) {
    const ws = byId(workspaces.value, id)
    if (ws && ws.order !== i) await saveWorkspace({ ...ws, order: i, at: now })
  }
}

/** Gone from this browser (and the account): the room is left as it is. */
async function forget(id: string): Promise<void> {
  await stopSession(id)
  await local.forgetWorkspace(id)
  await local.set(tombsKey(id), {})
  workspaces.value = workspaces.value.filter((w) => w.id !== id)
  if (currentId.value === id) await select(workspaces.value[0]?.id ?? null)
}

/**
 * The owner: the workspace deleted, for everyone it is shared with too. Anyone else: it is taken off
 * their list, and stays for the others.
 */
export async function removeWorkspace(id: string): Promise<void> {
  const ws = byId(workspaces.value, id)
  if (!ws) return
  if (ws.role === 'owner') await sessions.get(id)?.wipe()
  await index?.remove(id)
  await forget(id)
  if (!workspaces.value.length) await select((await createWorkspace(FIRST)).id)
}

// ------------------------------------------------------------------ sharing

const origin = () => location.origin

/** The link that lets someone edit the workspace with you. */
export function editLink(id: string): string | null {
  const ws = byId(workspaces.value, id)
  return ws?.secret ? `${origin()}/#/join/${ws.id}/${ws.secret}` : null
}

/** The read-only link, if it is published. */
export function publishedLink(id: string): string | null {
  const ws = byId(workspaces.value, id)
  return ws?.view && ws.role !== 'viewer' ? `${origin()}/#/view/${ws.id}/${ws.view.secret}/${ws.view.pub}` : null
}

/** Publish a read-only copy, signed by this page's key (the account's, signed in). */
export async function publish(id: string): Promise<string | null> {
  const ws = byId(workspaces.value, id)
  const pub = keys.value?.pub
  if (!ws || ws.role === 'viewer' || !pub) return null
  if (!ws.view) await saveWorkspace({ ...ws, view: { secret: newSecret(), pub }, at: Date.now() })
  const s = sessions.get(id)
  if (s) { await s.openMirror(); await s.republish() }
  return publishedLink(id)
}

export async function unpublish(id: string): Promise<void> {
  const ws = byId(workspaces.value, id)
  if (!ws?.view || ws.role === 'viewer') return
  await sessions.get(id)?.unpublish()
  const { view: _v, ...rest } = ws
  await saveWorkspace({ ...rest, at: Date.now() })
}

/**
 * A new edit link: the workspace moves to a new room, and the old one is emptied, so the old link opens
 * nothing (and the copies of those who had it are emptied too). Only its owner can.
 */
export async function resetEditLink(id: string): Promise<void> {
  const ws = byId(workspaces.value, id)
  if (!ws || ws.role !== 'owner') return
  const old = sessions.get(id)
  if (old?.room) for (const r of await old.room.list('public').catch(() => [])) await old.room.delete('public', r.key).catch(() => {})
  await stopSession(id)
  const now = Date.now()
  await saveWorkspace({ ...ws, secret: newSecret(), at: now, nameAt: now })
  // Everything here goes to the new room as new.
  await local.putCards((await local.cards(id)).map((c) => ({ ...c, synced: false })))
  await local.putLinks((await local.links(id)).map((l) => ({ ...l, synced: false })))
  startSession(id)
}

/** A link opened: the workspace added (or, already here, shown). */
export async function openInvite(invite: Invite): Promise<void> {
  const here = byId(workspaces.value, invite.id)
  if (here) {
    // A viewer given the edit link becomes an editor.
    if (invite.kind === 'join' && here.role === 'viewer') {
      await saveWorkspace({ ...here, role: 'editor', secret: invite.secret, view: undefined, at: Date.now() })
      await stopSession(here.id); startSession(here.id)
    }
    await select(here.id)
    return
  }
  const order = Math.max(-1, ...workspaces.value.map((w) => w.order)) + 1
  const ws: Workspace = invite.kind === 'join'
    ? { id: invite.id, name: 'Shared workspace', order, role: 'editor', secret: invite.secret, at: Date.now(), nameAt: 0 }
    : { id: invite.id, name: 'Shared workspace', order, role: 'viewer', view: { secret: invite.secret, pub: invite.pub }, at: Date.now(), nameAt: 0 }
  await saveWorkspace(ws)
  startSession(ws.id)
  await select(ws.id)
}

// ------------------------------------------------------------------ cards and lines, with undo

type Step = { card?: { id: string; before: Card | null; after: Card | null }; link?: { id: string; before: Link | null; after: Link | null } }
const history = ref<{ undo: Step[][]; redo: Step[][] }>({ undo: [], redo: [] })
const HISTORY = 100

const editable = computed(() => !!current.value && current.value.role !== 'viewer')

/** Changes cards and lines of the open workspace (null after: deleted), and keeps them for undo. */
async function apply(steps: Step[], record: 'do' | 'undo' | 'redo' = 'do'): Promise<void> {
  const ws = currentId.value
  if (!ws || !editable.value || !steps.length) return
  const now = Date.now()
  const session = sessions.get(ws)
  const putC: Card[] = [], putL: Link[] = [], delC: string[] = [], delL: string[] = []
  for (const s of steps) {
    const target = record === 'undo' ? (s.card?.before ?? s.link?.before ?? null) : (s.card?.after ?? s.link?.after ?? null)
    if (s.card) { if (target) putC.push({ ...(target as Card), at: now, synced: false }); else delC.push(s.card.id) }
    if (s.link) { if (target) putL.push({ ...(target as Link), at: now, synced: false }); else delL.push(s.link.id) }
  }
  await Promise.all([keepCards(putC), keepLinks(putL), dropCards(ws, delC), dropLinks(ws, delL)])
  if (session) {
    for (const c of putC) void session.push(c)
    for (const l of putL) void session.push(l)
    if (delC.length || delL.length) void session.remove([...delC.map(cardKey), ...delL.map(linkKey)])
  } else if (delC.length || delL.length) await addTombs(ws, [...delC.map(cardKey), ...delL.map(linkKey)])

  const h = history.value
  if (record === 'do') { h.undo = [...h.undo, steps].slice(-HISTORY); h.redo = [] }
  else if (record === 'undo') { h.redo = [...h.redo, steps] }
  else { h.undo = [...h.undo, steps] }
  triggerRef(cards)
}

export async function undo(): Promise<void> {
  const steps = history.value.undo.at(-1)
  if (!steps) return
  history.value.undo = history.value.undo.slice(0, -1)
  await apply(steps, 'undo')
}

export async function redo(): Promise<void> {
  const steps = history.value.redo.at(-1)
  if (!steps) return
  history.value.redo = history.value.redo.slice(0, -1)
  await apply(steps, 'redo')
}

export async function addCard(x: number, y: number, exact = false): Promise<Card | null> {
  const ws = currentId.value
  if (!ws || !editable.value) return null
  const at = exact ? { x, y } : placeCard(x, y, cards.value)
  const card: Card = { id: newId(), ws, title: 'New card', content: '', x: at.x, y: at.y, w: CARD_W, h: CARD_H, at: Date.now() }
  await apply([{ card: { id: card.id, before: null, after: card } }])
  return card
}

/** A card changed (its title, note, colour, place or size): one undo step. */
export async function updateCard(id: string, patch: Partial<Omit<Card, 'id' | 'ws'>>): Promise<void> {
  const before = byId(cards.value, id)
  if (!before) return
  const after = { ...before, ...patch }
  if (Object.keys(patch).every((k) => (before as unknown as Record<string, unknown>)[k] === (patch as Record<string, unknown>)[k])) return
  await apply([{ card: { id, before, after } }])
}

export async function deleteCard(id: string): Promise<void> {
  const before = byId(cards.value, id)
  if (!before) return
  const attached = links.value.filter((l) => l.from === id || l.to === id)
  await apply([{ card: { id, before, after: null } }, ...attached.map((l) => ({ link: { id: l.id, before: l, after: null } }))])
}

export async function addLink(from: string, to: string, kind: LinkKind = 'arrow'): Promise<void> {
  const ws = currentId.value
  if (!ws || from === to) return
  if (links.value.some((l) => (l.from === from && l.to === to) || (l.from === to && l.to === from))) return
  const link: Link = { id: newId(), ws, from, to, kind, at: Date.now() }
  await apply([{ link: { id: link.id, before: null, after: link } }])
}

export async function updateLink(id: string, patch: Partial<Pick<Link, 'kind' | 'from' | 'to'>>): Promise<void> {
  const before = byId(links.value, id)
  if (!before) return
  await apply([{ link: { id, before, after: { ...before, ...patch } } }])
}

export async function deleteLink(id: string): Promise<void> {
  const before = byId(links.value, id)
  if (before) await apply([{ link: { id, before, after: null } }])
}

// ------------------------------------------------------------------ export and import

export async function exportAll(): Promise<{ workspaces: Workspace[]; cards: Card[]; links: Link[] }> {
  return { workspaces: workspaces.value.filter((w) => w.role !== 'viewer'), cards: await local.cards(), links: await local.links() }
}

/**
 * Notes from an export: a workspace this browser has (the same one) gets the cards and lines it doesn't
 * have, and newer ones; any other comes in as a new workspace of yours.
 */
async function addImported(found: ReturnType<typeof parseImport>, sync = true): Promise<{ workspaces: number; cards: number }> {
  let added = 0
  const now = Date.now()
  for (const w of found.workspaces) {
    let ws = byId(workspaces.value, w.id)
    if (ws?.role === 'viewer') continue
    if (!ws) {
      ws = { id: w.id, name: w.name, order: Math.max(-1, ...workspaces.value.map((x) => x.order)) + 1, role: 'owner', secret: newSecret(), at: now, nameAt: now }
      await saveWorkspace(ws)
      added++
    }
    const mine = new Map((await local.cards(w.id)).map((c) => [c.id, c]))
    const myLinks = new Map((await local.links(w.id)).map((l) => [l.id, l]))
    await local.putCards(found.cards.filter((c) => c.ws === w.id && (!mine.has(c.id) || c.at > mine.get(c.id)!.at)).map((c) => ({ ...c, synced: false })))
    await local.putLinks(found.links.filter((l) => l.ws === w.id && (!myLinks.has(l.id) || l.at > myLinks.get(l.id)!.at)).map((l) => ({ ...l, synced: false })))
    if (sync) { await stopSession(w.id); startSession(w.id) }
  }
  if (currentId.value) await select(currentId.value)
  return { workspaces: added, cards: found.cards.length }
}

export async function importFile(text: string): Promise<{ workspaces: number; cards: number }> {
  return addImported(parseImport(text))
}

// ------------------------------------------------------------------ before logging out

/** Changes not yet in a room (they would be lost by logging out now). */
export async function unsent(): Promise<number> {
  let n = 0
  for (const w of workspaces.value) {
    if (w.role === 'viewer') continue
    n += (await local.cards(w.id)).filter((c) => !c.synced).length
    n += (await local.links(w.id)).filter((l) => !l.synced).length
    n += Object.keys(await tombs(w.id)).length
    if (account.value && !w.indexed) n++
  }
  return n
}

/** Everything of the account's gone from this browser (logging out). */
export async function forgetAll(): Promise<void> {
  await index?.close(); index = null
  await Promise.all([...sessions.keys()].map(stopSession))
  await local.clear()
  workspaces.value = []
  await local.set('legacy-checked', true)
  await select((await createWorkspace(FIRST)).id)
}

export function useJot() {
  return { workspaces, current, currentId, cards, links, loaded, syncState, notice, history, editable }
}
