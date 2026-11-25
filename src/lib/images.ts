/**
 * Pictures in notes: put on the storage servers (lib/media.ts) and kept in this browser too, so a
 * picture shows at once here and offline. One that no server took yet (offline) is sent again later.
 */
import { blobs } from '@/composables/useMesh'
import { local } from './local'
import { download, prepare, upload, type MediaRef } from './media'

const idOf = (ref: MediaRef) => `img:${ref.list ?? ref.chunks!.join(',')}`
const urls = new Map<string, Promise<string>>()

/** A picture's address for an <img> (an object URL), from this browser or the servers. */
export function imageUrl(ref: MediaRef): Promise<string> {
  const id = idOf(ref)
  let url = urls.get(id)
  if (!url) {
    url = (async () => {
      let bytes = await local.blob(id).catch(() => undefined)
      if (!bytes) {
        bytes = await download(blobs, ref)
        await local.keepBlob(id, bytes).catch(() => {})
      }
      return URL.createObjectURL(new Blob([bytes as BlobPart], { type: ref.type }))
    })()
    url.catch(() => urls.delete(id))
    urls.set(id, url)
  }
  return url
}

/** A file picked, pasted or dropped: made ready and kept; resolves with how a note names it. */
export async function addImage(file: File): Promise<MediaRef> {
  const { bytes, about } = await prepare(file)
  // The pieces' names come from their bytes alone, so they are known before any server has them.
  const offline: { put: (b: Uint8Array) => Promise<number>; get: () => Promise<null> } = { put: async () => 1, get: async () => null }
  const ref = await upload(offline, bytes, about)
  await local.keepBlob(idOf(ref), bytes)
  urls.set(idOf(ref), Promise.resolve(URL.createObjectURL(new Blob([bytes as BlobPart], { type: ref.type }))))
  try {
    await upload(blobs, bytes, about)
  } catch {
    // Not now (no server reached): kept to send again.
    const waiting = (await local.get<MediaRef[]>('unsent-images')) ?? []
    await local.set('unsent-images', [...waiting, ref])
  }
  return ref
}

/** Pictures added while offline, sent now. */
export async function sendWaitingImages(): Promise<void> {
  const waiting = (await local.get<MediaRef[]>('unsent-images')) ?? []
  const left: MediaRef[] = []
  for (const ref of waiting) {
    const bytes = await local.blob(idOf(ref)).catch(() => undefined)
    if (!bytes) continue
    try { await upload(blobs, bytes, ref) } catch { left.push(ref) }
  }
  await local.set('unsent-images', left)
}
