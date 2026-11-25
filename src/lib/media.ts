/**
 * Pictures in notes, kept on the mesh's storage servers (PigeonFS), as PigeonFeed keeps its media. A file
 * is cut into pieces of CHUNK bytes; each piece is a blob there, named by its SHA-256 (the servers check
 * it, and so does every reader), and sealed with a key made from that hash: a server holding a piece
 * cannot read it without being told the hash, and the hashes are only in the notes, which only the
 * people a workspace is shared with can read. A note names its pieces in order; a file of many pieces
 * names one more piece that lists them.
 */
import { getSubtle } from 'unsea'

/** A picture kept on the storage servers in pieces: each piece by its SHA-256, or (many pieces) a piece that lists them. */
export interface MediaRef {
  kind: 'image'
  type: string
  size: number
  name?: string
  w?: number
  h?: number
  /** The pieces, in order. */
  chunks?: string[]
  /** Or: the piece that lists them, one hash a line. */
  list?: string
}

/** Bytes in a piece: under a blob's most (160 kB, PeerPigeon's MAX_BLOB_BYTES). */
export const CHUNK = 128 * 1024
/** Pieces named in the note itself; more go in a list piece. */
export const INLINE_CHUNKS = 16
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
/** A picture's longest side after it is made smaller. */
export const IMAGE_SIDE = 1600

/** Where pieces are kept: the storage servers, through this page's link to them. */
export interface BlobStore {
  /** Keeps the bytes; resolves with how many servers took them. */
  put(bytes: Uint8Array): Promise<number>
  /** The bytes with this SHA-256, or null when no server has them. */
  get(hash: string): Promise<Uint8Array | null>
}

/**
 * A piece could not be had from the storage servers just now: they may not be reached yet (a page just
 * opened), be restarting, or not hold it. Worth another try; nothing here says the file is gone.
 */
export class NotYet extends Error {
  constructor() { super('The storage servers did not answer with this file.') }
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  // unsea's SubtleCrypto: WebCrypto's, or its stand-in on a page without one (plain http).
  const digest = new Uint8Array(await getSubtle().digest('SHA-256', bytes as BufferSource))
  return Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function cut(bytes: Uint8Array, size = CHUNK): Uint8Array[] {
  const out: Uint8Array[] = []
  for (let at = 0; at < bytes.length; at += size) out.push(bytes.subarray(at, Math.min(bytes.length, at + size)))
  return out
}

/** Run `work` over `items`, `lanes` at a time, in order of starting; the first failure stops the rest. */
async function inLanes<T, R>(items: T[], lanes: number, work: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length)
  let next = 0, failed = false
  const lane = async () => {
    while (!failed && next < items.length) {
      const i = next++
      try { out[i] = await work(items[i], i) } catch (error) { failed = true; throw error }
    }
  }
  await Promise.all(Array.from({ length: Math.min(lanes, items.length) }, lane))
  return out
}

async function keep(store: BlobStore, piece: Uint8Array): Promise<string> {
  const hash = await sha256Hex(piece)
  // Twice, a moment apart: right after the page opens its link to the servers may still be forming.
  for (let attempt = 0; attempt < 2; attempt++) {
    if ((await store.put(piece.slice())) > 0) return hash
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new Error('No storage server took the file. Try again in a moment.')
}

/** Put a file's bytes on the servers; resolves with how a note names them. `progress`: 0 to 1. */
export async function upload(store: BlobStore, bytes: Uint8Array, about: Pick<MediaRef, 'kind' | 'type' | 'name' | 'w' | 'h'>, progress?: (done: number) => void): Promise<MediaRef> {
  const pieces = cut(bytes)
  let done = 0
  const chunks = await inLanes(pieces, 4, async (piece) => {
    const hash = await keep(store, piece)
    progress?.(++done / pieces.length)
    return hash
  })
  const ref: MediaRef = { ...about, size: bytes.length }
  if (chunks.length <= INLINE_CHUNKS) return { ...ref, chunks }
  const list = new TextEncoder().encode(chunks.join('\n'))
  if (list.length > CHUNK) throw new Error('That picture is too large.')
  return { ...ref, list: await keep(store, list) }
}

/** A picture's pieces, in order. */
export async function chunksOf(store: BlobStore, ref: MediaRef): Promise<string[]> {
  if (ref.chunks) return ref.chunks
  const list = ref.list ? await store.get(ref.list) : null
  if (!list) throw new NotYet()
  const chunks = new TextDecoder().decode(list).split('\n').filter((h) => /^[0-9a-f]{64}$/.test(h))
  // What it lists must be about the size it says: a list can't make a reader fetch without end.
  if (!chunks.length || chunks.length > Math.ceil(ref.size / CHUNK) + 1) throw new Error('This picture is not as its note describes it.')
  return chunks
}

/** A picture's bytes, from the servers. `progress`: 0 to 1. */
export async function download(store: BlobStore, ref: MediaRef, progress?: (done: number) => void): Promise<Uint8Array> {
  const chunks = await chunksOf(store, ref)
  let done = 0
  const pieces = await inLanes(chunks, 6, async (hash) => {
    const piece = await store.get(hash)
    if (!piece) throw new NotYet()
    progress?.(++done / chunks.length)
    return piece
  })
  const size = pieces.reduce((n, p) => n + p.length, 0)
  if (size !== ref.size) throw new Error('This picture is not as its note describes it.')
  const out = new Uint8Array(size)
  let at = 0
  for (const p of pieces) { out.set(p, at); at += p.length }
  return out
}

/** The new size of a w x h picture whose longest side is at most `side` (never larger than it was). */
export function fit(w: number, h: number, side = IMAGE_SIDE): { w: number; h: number } {
  const scale = Math.min(1, side / Math.max(w, h))
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) }
}

/**
 * A picture as it will be kept: made smaller (JPEG, IMAGE_SIDE on its longest side; a PNG with
 * transparency stays PNG, a GIF as it is, to stay animated). Throws, in words for the person, when it
 * can't be used.
 */
export async function prepare(file: File): Promise<{ bytes: Uint8Array; about: Pick<MediaRef, 'kind' | 'type' | 'name' | 'w' | 'h'> }> {
  const name = file.name.slice(0, 120)
  if (!file.type.startsWith('image/')) throw new Error('Only pictures can be put in a note.')
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) throw new Error('That picture could not be read.')
  try {
    if (file.type === 'image/gif' && file.size <= MAX_IMAGE_BYTES) {
      return { bytes: new Uint8Array(await file.arrayBuffer()), about: { kind: 'image', type: file.type, name, w: bitmap.width, h: bitmap.height } }
    }
    const { w, h } = fit(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85))
    if (!blob) throw new Error('That picture could not be made ready.')
    if (blob.size > MAX_IMAGE_BYTES) throw new Error('That picture is too large.')
    return { bytes: new Uint8Array(await blob.arrayBuffer()), about: { kind: 'image', type, name, w, h } }
  } finally { bitmap.close() }
}

/** A picture reference from a note's markup, checked; null when it isn't one. */
export function parseRef(text: string | null | undefined): MediaRef | null {
  let m: Record<string, unknown>
  try { m = JSON.parse(text ?? '') } catch { return null }
  if (!m || m.kind !== 'image' || typeof m.type !== 'string' || !m.type.startsWith('image/')) return null
  const size = Number(m.size)
  if (!Number.isFinite(size) || size <= 0 || size > MAX_IMAGE_BYTES) return null
  const HASH = /^[0-9a-f]{64}$/
  const chunks = Array.isArray(m.chunks) && m.chunks.length > 0 && m.chunks.length <= 64 && m.chunks.every((h) => typeof h === 'string' && HASH.test(h)) ? m.chunks as string[] : null
  const list = typeof m.list === 'string' && HASH.test(m.list) ? m.list : null
  if (!chunks && !list) return null
  const side = (x: unknown) => (Number.isFinite(Number(x)) && Number(x) > 0 && Number(x) < 20000 ? Math.round(Number(x)) : undefined)
  return {
    kind: 'image', type: m.type.slice(0, 60), size,
    ...(typeof m.name === 'string' ? { name: m.name.slice(0, 120) } : {}),
    ...(side(m.w) && side(m.h) ? { w: side(m.w), h: side(m.h) } : {}),
    ...(chunks ? { chunks } : { list: list! }),
  }
}
