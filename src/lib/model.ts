/**
 * Jot's notes: workspaces, the cards on them and the lines between cards. Pure: nothing here touches
 * storage or the mesh (lib/local.ts keeps them in this browser, composables/useJot.ts syncs them).
 *
 * A workspace lives in a room of its own on the PeerPigeon storage servers, named with a secret only
 * the people it is shared with know (lib/links.ts). Its records there:
 *
 *   jot/meta          { name, at }
 *   jot/c/<card id>   a card
 *   jot/k/<link id>   a line between two cards
 *
 * Each is the newest wins, by `at` (milliseconds).
 */

export type Role = 'owner' | 'editor' | 'viewer'

export interface Workspace {
  id: string
  name: string
  /** Where it sits in the list (smaller first). */
  order: number
  role: Role
  /** The room's secret: read and write. A viewer has none. */
  secret?: string
  /** A read-only copy: published by `pub` (an owner's), or the one a viewer reads. */
  view?: { secret: string; pub: string }
  /** When this entry last changed (its name, place in the list, links). */
  at: number
  /** When its name last changed (the room's name is the newest). */
  nameAt?: number
  /** In the signed-in account's list: once it has been, missing from that list means removed there. */
  indexed?: boolean
}

export interface Card {
  id: string
  ws: string
  title: string
  /** The note, as HTML (the editor's). */
  content: string
  x: number
  y: number
  w: number
  h: number
  /** A background colour (#rrggbb), or none: the paper's. */
  color?: string
  at: number
  /** Taken from the room, or sent to it: once it has been, missing from the room means deleted there. */
  synced?: boolean
}

export type LinkKind = 'arrow' | 'line'

export interface Link {
  id: string
  ws: string
  from: string
  to: string
  kind: LinkKind
  at: number
  synced?: boolean
}

export const PREFIX = 'jot/'
export const META_KEY = 'jot/meta'
export const cardKey = (id: string) => `jot/c/${id}`
export const linkKey = (id: string) => `jot/k/${id}`
/** An account's list of its workspaces (lib/links.ts: indexRoom). */
export const indexKey = (id: string) => `jot/i/${id}`

export const CARD_W = 450
export const CARD_H = 350
export const MIN_W = 220
export const MIN_H = 140
export const MAX_TITLE = 200
/** A card's note at most (characters of HTML): a record goes to the servers in one message. */
export const MAX_CONTENT = 60_000
export const MAX_NAME = 80
export const GRID = 20
/** A date further ahead than this is a wrong clock: taken as now. */
const AHEAD_MS = 5 * 60_000

export const newId = (): string => crypto.randomUUID()

const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null)
const num = (v: unknown, fallback: number, min = -1e7, max = 1e7): number => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}
const time = (v: unknown, now: number): number => {
  const n = typeof v === 'string' ? Date.parse(v) : Number(v)
  return Number.isFinite(n) && n > 0 ? Math.min(n, now + AHEAD_MS) : 0
}
const ID = /^[\w-]{1,64}$/
export const validId = (v: unknown): v is string => typeof v === 'string' && ID.test(v)
export const validColor = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)

/** A card as a room keeps it (no `ws`, no `synced`: the room is the workspace). */
export function cardRecord(card: Card): Record<string, unknown> {
  return { title: card.title, content: card.content, x: card.x, y: card.y, w: card.w, h: card.h, ...(card.color ? { color: card.color } : {}), at: card.at }
}

export function linkRecord(link: Link): Record<string, unknown> {
  return { from: link.from, to: link.to, kind: link.kind, at: link.at }
}

/** A card from a room's record, checked; null when it isn't one. */
export function parseCard(ws: string, key: string, value: unknown, now = Date.now()): Card | null {
  const v = obj(value)
  if (!v || !key.startsWith('jot/c/')) return null
  const id = key.slice(6)
  if (!validId(id) || typeof v.content !== 'string') return null
  return {
    id, ws,
    title: (typeof v.title === 'string' ? v.title : '').slice(0, MAX_TITLE),
    content: v.content.slice(0, MAX_CONTENT),
    x: num(v.x, 0), y: num(v.y, 0),
    w: num(v.w, CARD_W, MIN_W, 4000), h: num(v.h, CARD_H, MIN_H, 4000),
    ...(validColor(v.color) ? { color: v.color.toLowerCase() } : {}),
    at: time(v.at, now),
  }
}

export function parseLink(ws: string, key: string, value: unknown, now = Date.now()): Link | null {
  const v = obj(value)
  if (!v || !key.startsWith('jot/k/')) return null
  const id = key.slice(6)
  if (!validId(id) || !validId(v.from) || !validId(v.to) || v.from === v.to) return null
  return { id, ws, from: v.from, to: v.to, kind: v.kind === 'line' ? 'line' : 'arrow', at: time(v.at, now) }
}

export function parseMeta(value: unknown, now = Date.now()): { name: string; at: number } | null {
  const v = obj(value)
  if (!v || typeof v.name !== 'string') return null
  return { name: cleanName(v.name), at: time(v.at, now) }
}

/** An account's entry for one of its workspaces. */
export function indexRecord(ws: Workspace): Record<string, unknown> {
  return { name: ws.name, order: ws.order, role: ws.role, ...(ws.secret ? { secret: ws.secret } : {}), ...(ws.view ? { view: ws.view } : {}), at: ws.at }
}

export function parseIndex(key: string, value: unknown, now = Date.now()): Workspace | null {
  const v = obj(value)
  if (!v || !key.startsWith('jot/i/')) return null
  const id = key.slice(6)
  const role: Role | null = v.role === 'owner' || v.role === 'editor' || v.role === 'viewer' ? v.role : null
  if (!validId(id) || !role) return null
  const secret = validSecret(v.secret) ? v.secret : undefined
  const view = obj(v.view)
  const okView = view && validSecret(view.secret) && typeof view.pub === 'string' && view.pub.length < 300 ? { secret: view.secret as string, pub: view.pub } : undefined
  if (role === 'viewer' ? !okView : !secret) return null
  return { id, name: cleanName(typeof v.name === 'string' ? v.name : ''), order: num(v.order, 0), role, ...(secret ? { secret } : {}), ...(okView ? { view: okView } : {}), at: time(v.at, now) }
}

export const validSecret = (v: unknown): v is string => typeof v === 'string' && /^[\w-]{22,64}$/.test(v)

export const cleanName = (name: string): string => name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME) || 'Untitled'

// ------------------------------------------------------------------ the canvas

export interface Box { x: number; y: number; w: number; h: number }

export const overlaps = (a: Box, b: Box): boolean => !(a.x + a.w <= b.x || a.x >= b.x + b.w || a.y + a.h <= b.y || a.y >= b.y + b.h)

export const snap = (n: number, on: boolean, grid = GRID): number => (on ? Math.round(n / grid) * grid : Math.round(n))

/**
 * Where a new card goes: at (x, y) if nothing is there, else the nearest free place stepping down and
 * to the right (as jot always did).
 */
export function placeCard(x: number, y: number, cards: Box[], w = CARD_W, h = CARD_H, step = GRID * 2): { x: number; y: number } {
  const free = (px: number, py: number) => !cards.some((c) => overlaps({ x: px, y: py, w, h }, c))
  if (free(x, y)) return { x, y }
  for (let ring = 1; ring <= 12; ring++) {
    for (let i = 0; i <= ring; i++) {
      for (const [dx, dy] of [[ring, i], [i, ring]]) {
        const px = x + dx * step, py = y + dy * step
        if (free(px, py)) return { x: px, y: py }
      }
    }
  }
  return { x: x + step, y: y + step }
}

/** The smallest box holding all the cards; null for none. */
export function bounds(cards: Box[]): Box | null {
  if (!cards.length) return null
  const x = Math.min(...cards.map((c) => c.x)), y = Math.min(...cards.map((c) => c.y))
  const r = Math.max(...cards.map((c) => c.x + c.w)), b = Math.max(...cards.map((c) => c.y + c.h))
  return { x, y, w: r - x, h: b - y }
}

/**
 * Where a line between two cards meets their edges: from the edge of `a` facing `b` to the edge of `b`
 * facing `a`, along the line between their centres.
 */
export function edgePoints(a: Box, b: Box): { x1: number; y1: number; x2: number; y2: number } {
  const ca = { x: a.x + a.w / 2, y: a.y + a.h / 2 }, cb = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
  const exit = (c: { x: number; y: number }, box: Box, dx: number, dy: number) => {
    if (!dx && !dy) return c
    const sx = dx ? (box.w / 2) / Math.abs(dx) : Infinity, sy = dy ? (box.h / 2) / Math.abs(dy) : Infinity
    const s = Math.min(sx, sy)
    return { x: c.x + dx * s, y: c.y + dy * s }
  }
  const p = exit(ca, a, cb.x - ca.x, cb.y - ca.y)
  const q = exit(cb, b, ca.x - cb.x, ca.y - cb.y)
  return { x1: p.x, y1: p.y, x2: q.x, y2: q.y }
}

/** Black or white text, whichever reads on `color`. */
export function inkOn(color: string | undefined): 'dark' | 'light' {
  if (!validColor(color)) return 'dark'
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255)
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.36 ? 'dark' : 'light'
}

// ------------------------------------------------------------------ search

/** A note's words, without its markup. */
export function plainText(html: string): string {
  return html.replace(/<(br|\/p|\/li|\/h\d|\/div|\/pre|\/blockquote)[^>]*>/gi, ' ').replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim()
}

export interface Hit { card: Card; where: 'title' | 'note'; snippet: string }

/** Cards whose title or note has every word of `query`, titles first. */
export function search(cards: Card[], query: string, limit = 30): Hit[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return []
  const hits: (Hit & { rank: number })[] = []
  for (const card of cards) {
    const title = card.title.toLowerCase()
    const text = plainText(card.content)
    const all = `${title} ${text.toLowerCase()}`
    if (!words.every((w) => all.includes(w))) continue
    const inTitle = words.every((w) => title.includes(w))
    const at = text.toLowerCase().indexOf(words[0])
    const snippet = at < 0 ? text.slice(0, 100) : `${at > 40 ? '…' : ''}${text.slice(Math.max(0, at - 40), at + 60)}${at + 60 < text.length ? '…' : ''}`
    hits.push({ card, where: inTitle ? 'title' : 'note', snippet, rank: inTitle ? 0 : 1 })
  }
  return hits.sort((a, b) => a.rank - b.rank || b.card.at - a.card.at).slice(0, limit).map(({ rank: _r, ...h }) => h)
}

// ------------------------------------------------------------------ export and import

export interface ExportFile {
  app: 'jot'
  version: 2
  exported: string
  workspaces: { id: string; name: string; order: number }[]
  cards: Omit<Card, 'synced'>[]
  links: Omit<Link, 'synced'>[]
}

export function exportFile(workspaces: Workspace[], cards: Card[], links: Link[], now = new Date()): ExportFile {
  const strip = <T extends { synced?: boolean }>({ synced: _s, ...rest }: T) => rest
  return {
    app: 'jot', version: 2, exported: now.toISOString(),
    workspaces: workspaces.map((w) => ({ id: w.id, name: w.name, order: w.order })),
    cards: cards.map(strip), links: links.map(strip),
  }
}

export interface Imported { workspaces: { id: string; name: string; order: number }[]; cards: Card[]; links: Link[] }

/**
 * An export, this app's (version 2) or the first jot's (version 1.0.0: workspaces, cards and
 * connections, as its database kept them). Throws, in words for the person, when it is neither.
 */
export function parseImport(text: string, now = Date.now()): Imported {
  let data: unknown
  try { data = JSON.parse(text) } catch { throw new Error('That file is not a jot export (it is not JSON).') }
  const d = obj(data)
  if (!d || !Array.isArray(d.workspaces) || !Array.isArray(d.cards)) throw new Error('That file is not a jot export.')
  const workspaces = d.workspaces.map(obj).filter((w): w is Record<string, unknown> => !!w && validId(w.id))
    .map((w, i) => ({ id: w.id as string, name: cleanName(typeof w.name === 'string' ? w.name : ''), order: num(w.order, i) }))
  const ids = new Set(workspaces.map((w) => w.id))
  const cards: Card[] = []
  for (const raw of d.cards.map(obj)) {
    if (!raw) continue
    const ws = (raw.ws ?? raw.workspaceId) as string
    if (!ids.has(ws)) continue
    // The first jot's fields: width, height, backgroundColor, updatedAt.
    const card = parseCard(ws, `jot/c/${raw.id}`, {
      ...raw,
      w: raw.w ?? raw.width, h: raw.h ?? raw.height,
      color: raw.color ?? (raw.backgroundColor === '#ffffff' ? undefined : raw.backgroundColor),
      at: raw.at ?? raw.updatedAt,
    }, now)
    if (card) cards.push(card)
  }
  const cardIds = new Set(cards.map((c) => c.id))
  const links: Link[] = []
  for (const raw of (Array.isArray(d.links) ? d.links : Array.isArray(d.connections) ? d.connections : []).map(obj)) {
    if (!raw) continue
    const ws = (raw.ws ?? raw.workspaceId) as string
    const link = parseLink(ws, `jot/k/${raw.id}`, { from: raw.from ?? raw.fromCardId, to: raw.to ?? raw.toCardId, kind: raw.kind ?? raw.type, at: raw.at ?? raw.createdAt }, now)
    if (link && ids.has(ws) && cardIds.has(link.from) && cardIds.has(link.to)) links.push(link)
  }
  return { workspaces, cards, links }
}
