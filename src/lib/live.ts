/**
 * Changes as they are made, straight to the other pages that have the workspace open: broadcast on the
 * mesh (everyone in jot's room hears it), sealed with a key made from the workspace's room name, so only
 * pages that have its secret can read it. The storage servers get every change too, and a page that
 * missed this one gets it from them; this is only so the others see it at once rather than when the
 * servers pass it on.
 *
 *   { jot: 'live1', t: <topic: a hash of the room name>, iv, c: <sealed { key, value | null, at }> }
 */
import { getSubtle } from 'unsea'

export interface LiveChange {
  key: string
  /** The record, or null: deleted. */
  value: Record<string, unknown> | null
  at: number
}

const enc = new TextEncoder()
const dec = new TextDecoder()
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('')
const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b))
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

const topics = new Map<string, Promise<string>>()
const keys = new Map<string, Promise<CryptoKey>>()

/** Which room a broadcast is about, without saying which: a hash of its name. */
export function topicOf(room: string): Promise<string> {
  let t = topics.get(room)
  if (!t) { t = getSubtle().digest('SHA-256', enc.encode(`jot-live-topic-v1:${room}`)).then((d) => hex(d).slice(0, 32)); topics.set(room, t) }
  return t
}

function keyOf(room: string): Promise<CryptoKey> {
  let k = keys.get(room)
  if (!k) {
    const subtle = getSubtle()
    k = subtle.digest('SHA-256', enc.encode(`jot-live-key-v1:${room}`)).then((raw) => subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']) as Promise<CryptoKey>)
    keys.set(room, k)
  }
  return k
}

export async function seal(room: string, change: LiveChange): Promise<{ jot: 'live1'; t: string; iv: string; c: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const c = await getSubtle().encrypt({ name: 'AES-GCM', iv }, await keyOf(room), enc.encode(JSON.stringify(change)))
  return { jot: 'live1', t: await topicOf(room), iv: b64(iv), c: b64(new Uint8Array(c)) }
}

/** A broadcast's topic, if it is one of jot's. */
export function topicIn(data: unknown): string | null {
  const d = data as Record<string, unknown> | null
  return d && d.jot === 'live1' && typeof d.t === 'string' && typeof d.iv === 'string' && typeof d.c === 'string' && d.c.length < 200_000 ? d.t : null
}

/** The change a broadcast for `room` carries, or null (not readable with its key, or not a change). */
export async function open(room: string, data: unknown): Promise<LiveChange | null> {
  const d = data as { iv: string; c: string }
  try {
    const plain = await getSubtle().decrypt({ name: 'AES-GCM', iv: unb64(d.iv) }, await keyOf(room), unb64(d.c))
    const change = JSON.parse(dec.decode(plain)) as LiveChange
    if (typeof change?.key !== 'string' || !change.key.startsWith('jot/') || !Number.isFinite(change.at)) return null
    if (change.value !== null && (typeof change.value !== 'object' || Array.isArray(change.value))) return null
    return change
  } catch { return null }
}
