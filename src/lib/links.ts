/**
 * Rooms and links. A workspace's room on the storage servers is named with its secret, and the servers
 * keep only a hash of that name and ciphertext sealed with a key made from it (PeerPigeon storage): only
 * someone who has the secret finds the room or reads it.
 *
 *   jot:w:<workspace id>:<secret>       the workspace: whoever has the secret reads and writes it
 *   jot:v:<workspace id>:<view secret>  its read-only copy, which only its publisher's key writes
 *   jot:me:<hash of an account's key>   an account's list of its workspaces, only that account writes it
 *
 * Links carry the secrets after the #, which a browser never sends to a server:
 *
 *   https://jot.ooo/#/join/<workspace id>/<secret>                  edit
 *   https://jot.ooo/#/view/<workspace id>/<view secret>/<publisher>   read only
 */
import { getSubtle } from 'unsea'
import { validId, validSecret } from './model'

const b64url = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

/** A new secret: 32 random bytes, base64url (43 characters). */
export const newSecret = (): string => b64url(crypto.getRandomValues(new Uint8Array(32)))

export const workspaceRoom = (id: string, secret: string) => `jot:w:${id}:${secret}`
export const viewRoom = (id: string, secret: string) => `jot:v:${id}:${secret}`

/** An account's own room: named from its private key, so nobody else can find it (or read it). */
export async function indexRoom(priv: string): Promise<string> {
  const digest = new Uint8Array(await getSubtle().digest('SHA-256', new TextEncoder().encode(`jot-index-v1:${priv}`)))
  return `jot:me:${b64url(digest)}`
}

const PUB = /^[\w-]{20,200}\.[\w-]{20,200}$/
export const validPub = (v: unknown): v is string => typeof v === 'string' && PUB.test(v)

export const joinLink = (origin: string, id: string, secret: string) => `${origin}/#/join/${id}/${secret}`
export const viewLink = (origin: string, id: string, secret: string, pub: string) => `${origin}/#/view/${id}/${secret}/${pub}`

export type Invite =
  | { kind: 'join'; id: string; secret: string }
  | { kind: 'view'; id: string; secret: string; pub: string }

/** What a page's # says to open, if it is a link to a workspace. */
export function parseInvite(hash: string): Invite | null {
  const parts = hash.replace(/^#\/?/, '').split('/')
  if (parts[0] === 'join' && parts.length === 3 && validId(parts[1]) && validSecret(parts[2])) return { kind: 'join', id: parts[1], secret: parts[2] }
  if (parts[0] === 'view' && parts.length === 4 && validId(parts[1]) && validSecret(parts[2]) && validPub(parts[3])) return { kind: 'view', id: parts[1], secret: parts[2], pub: parts[3] }
  return null
}
