/**
 * What this browser keeps: the workspaces it has, their cards and lines, a few settings, and pictures
 * it has shown (by hash). Jot reads and writes here first; composables/useJot.ts syncs it with the rooms.
 */
import type { Card, Link, Workspace } from './model'

const DB = 'jot-v2'
const STORES = ['workspaces', 'cards', 'links', 'kv', 'blobs'] as const
type Store = typeof STORES[number]

let opening: Promise<IDBDatabase> | null = null
function open(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      db.createObjectStore('workspaces', { keyPath: 'id' })
      db.createObjectStore('cards', { keyPath: 'id' }).createIndex('ws', 'ws')
      db.createObjectStore('links', { keyPath: 'id' }).createIndex('ws', 'ws')
      db.createObjectStore('kv')
      db.createObjectStore('blobs')
    }
    req.onsuccess = () => {
      req.result.onversionchange = () => { req.result.close(); opening = null }
      resolve(req.result)
    }
    req.onerror = () => { opening = null; reject(req.error) }
  })
  return opening
}

const done = <T>(req: IDBRequest<T>): Promise<T> => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result)
  req.onerror = () => reject(req.error)
})

async function tx<T>(stores: Store | Store[], mode: IDBTransactionMode, run: (t: IDBTransaction) => Promise<T> | T): Promise<T> {
  const t = (await open()).transaction(stores, mode)
  const finished = new Promise<void>((resolve, reject) => {
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
    t.onabort = () => reject(t.error ?? new Error('aborted'))
  })
  const out = await run(t)
  await finished
  return out
}

export const local = {
  workspaces: (): Promise<Workspace[]> => tx('workspaces', 'readonly', (t) => done(t.objectStore('workspaces').getAll())),
  cards: (ws?: string): Promise<Card[]> => tx('cards', 'readonly', (t) => done(ws ? t.objectStore('cards').index('ws').getAll(ws) : t.objectStore('cards').getAll())),
  links: (ws?: string): Promise<Link[]> => tx('links', 'readonly', (t) => done(ws ? t.objectStore('links').index('ws').getAll(ws) : t.objectStore('links').getAll())),

  putWorkspace: (w: Workspace) => tx('workspaces', 'readwrite', (t) => { t.objectStore('workspaces').put(JSON.parse(JSON.stringify(w))) }),
  putCards: (cards: Card[]) => tx('cards', 'readwrite', (t) => { for (const c of cards) t.objectStore('cards').put(JSON.parse(JSON.stringify(c))) }),
  putLinks: (links: Link[]) => tx('links', 'readwrite', (t) => { for (const l of links) t.objectStore('links').put(JSON.parse(JSON.stringify(l))) }),
  deleteCards: (ids: string[]) => tx('cards', 'readwrite', (t) => { for (const id of ids) t.objectStore('cards').delete(id) }),
  deleteLinks: (ids: string[]) => tx('links', 'readwrite', (t) => { for (const id of ids) t.objectStore('links').delete(id) }),

  /** A workspace and everything on it, gone from this browser. */
  async forgetWorkspace(id: string): Promise<void> {
    const cards = await local.cards(id)
    const links = await local.links(id)
    await tx(['workspaces', 'cards', 'links'], 'readwrite', (t) => {
      t.objectStore('workspaces').delete(id)
      for (const c of cards) t.objectStore('cards').delete(c.id)
      for (const l of links) t.objectStore('links').delete(l.id)
    })
  },

  /** Everything this browser keeps for jot, gone (logging out). */
  clear: () => tx(['workspaces', 'cards', 'links', 'kv', 'blobs'], 'readwrite', (t) => { for (const s of STORES) t.objectStore(s).clear() }),

  get: <T>(key: string): Promise<T | undefined> => tx('kv', 'readonly', (t) => done(t.objectStore('kv').get(key))),
  set: (key: string, value: unknown) => tx('kv', 'readwrite', (t) => { t.objectStore('kv').put(value, key) }),

  blob: (hash: string): Promise<Uint8Array | undefined> => tx('blobs', 'readonly', (t) => done(t.objectStore('blobs').get(hash))),
  keepBlob: (hash: string, bytes: Uint8Array) => tx('blobs', 'readwrite', (t) => { t.objectStore('blobs').put(bytes, hash) }),
}

/**
 * The first jot's notes, if this browser has them: it kept them in IndexedDB as 'JotDatabase' (Dexie),
 * on this same site. Read only; nothing there is changed. null: there is none.
 */
export async function legacyNotes(): Promise<{ workspaces: unknown[]; cards: unknown[]; connections: unknown[] } | null> {
  if (typeof indexedDB.databases === 'function') {
    const names = (await indexedDB.databases().catch(() => [])).map((d) => d.name)
    if (!names.includes('JotDatabase')) return null
  }
  const db = await new Promise<IDBDatabase | null>((resolve) => {
    let made = false
    const req = indexedDB.open('JotDatabase')
    // Opening a database that isn't there makes an empty one: undo that.
    req.onupgradeneeded = () => { made = true }
    req.onsuccess = () => {
      if (made) { req.result.close(); indexedDB.deleteDatabase('JotDatabase'); resolve(null) } else resolve(req.result)
    }
    req.onerror = () => resolve(null)
  })
  if (!db) return null
  try {
    const all = async (name: string): Promise<unknown[]> => (db.objectStoreNames.contains(name) ? done(db.transaction(name, 'readonly').objectStore(name).getAll()) : [])
    return { workspaces: await all('workspaces'), cards: await all('cards'), connections: await all('connections') }
  } finally { db.close() }
}
