/**
 * Who a person is on jot. Nobody has to sign in: a browser has keys of its own (PeerPigeon's, kept
 * between visits), and its workspaces are kept here. Signing in to an account (PigeonIdP: the same
 * accounts as PigeonChess, PigeonFeed and the console) brings a person's workspaces to every device.
 *
 * Accounts are signed records (pigeonidp/records): name, public keys, and the private keys sealed with
 * the password. The relay this page is on keeps them (a local freertc relay is a PigeonIdP server) and so
 * does the mesh; a relay keeps a name for the key that registered it first. Accounts are post-quantum
 * (version 2 records, unsea 3); an older one is moved over at its next login.
 */
import { computed, ref, shallowRef } from 'vue'
import * as unsea from 'unsea'
import { aliasKey, createAccountRecord, isPostQuantumRecord, openAccountRecord, upgradeAccountRecord, validAlias, verifyAccountRecord, type AccountRecord } from 'pigeonidp/records'
import { browserKeys, publicGet, publicPut, relayRequest, signAs, type Keys } from './useMesh'

/** PigeonChess's namespace: an account made there signs in here, and a name is one person on both. */
const NAMESPACE = 'pigeon-chess'
const meshKey = (alias: string) => `account:${aliasKey(alias)}:${NAMESPACE}`

// Staying signed in on this device until logging out: the account's keys, encrypted with an AES key kept
// in IndexedDB beside them. On a secure page (https, localhost) that key is the browser's own and will not
// be handed out (non-extractable). On a plain-http page there is no WebCrypto, so the key is kept as bytes
// and used with unsea's stand-in: weaker, but such a page can be changed in transit anyway.
const SESSION_DB = 'jot-session'
const openDb = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const req = indexedDB.open(SESSION_DB, 1)
  req.onupgradeneeded = () => req.result.createObjectStore('kv')
  req.onsuccess = () => resolve(req.result)
  req.onerror = () => reject(req.error)
})
const idb = async <T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<T> => {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = run(db.transaction('kv', mode).objectStore('kv'))
      req.onsuccess = () => resolve(req.result as T)
      req.onerror = () => reject(req.error)
    })
  } finally { db.close() }
}
const deviceKey = async (): Promise<CryptoKey> => {
  const subtle = unsea.getSubtle()
  if (unsea.hasNativeSubtle()) {
    const kept = await idb<CryptoKey | undefined>('readonly', (s) => s.get('device-key'))
    if (kept) return kept
    const key = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']) as CryptoKey
    await idb('readwrite', (s) => s.put(key, 'device-key'))
    return key
  }
  let raw = await idb<Uint8Array | undefined>('readonly', (s) => s.get('device-key-bytes'))
  if (!raw) {
    raw = crypto.getRandomValues(new Uint8Array(32))
    await idb('readwrite', (s) => s.put(raw, 'device-key-bytes'))
  }
  return subtle.importKey('raw', raw as BufferSource, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}
async function keepSession(session: { alias: string; keys: Keys }): Promise<void> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await unsea.getSubtle().encrypt({ name: 'AES-GCM', iv }, await deviceKey(), new TextEncoder().encode(JSON.stringify(session)))
  await idb('readwrite', (s) => s.put({ iv, data }, 'session'))
}
async function keptSession(): Promise<{ alias: string; keys: Keys } | null> {
  const kept = await idb<{ iv: Uint8Array; data: ArrayBuffer } | undefined>('readonly', (s) => s.get('session'))
  if (!kept) return null
  const plain = await unsea.getSubtle().decrypt({ name: 'AES-GCM', iv: kept.iv as BufferSource }, await deviceKey(), kept.data)
  return JSON.parse(new TextDecoder().decode(plain))
}

/** The account signed in here, if any. */
const account = shallowRef<{ alias: string; keys: Keys } | null>(null)
/** This browser's own keys (once the mesh is up). */
const browser = shallowRef<Keys | null>(null)
/** The keys this page writes and reads with now. */
const keys = computed<Keys | null>(() => account.value?.keys ?? browser.value)
const signer = computed<string | null>(() => keys.value?.pub ?? null)
const ready = ref(false)

const askRelay = async (body: Record<string, unknown>) => {
  try {
    const answer = await relayRequest(body)
    return answer?.error === 'unsupported' ? null : answer
  } catch { return null } // not on a relay, or one too old to answer
}

/** Put a record wherever accounts are kept. 'taken': the relay has the name for another key. */
async function publishRecord(record: AccountRecord): Promise<'ok' | 'taken'> {
  const answer = await askRelay({ action: 'idp-put', record })
  if (answer?.ok === false && answer.error === 'taken') return 'taken'
  await publicPut(meshKey(record.alias), record).catch(() => {})
  return 'ok'
}

/** The verified record for a name: from the relay first, then the mesh. */
async function findRecord(alias: string, waitMs = 0): Promise<AccountRecord | null> {
  const answer = await askRelay({ action: 'idp-get', namespace: NAMESPACE, alias })
  if (answer?.record && await verifyAccountRecord(answer.record)) return answer.record
  const record = await publicGet(meshKey(alias), { waitMs }).catch(() => null)
  return record && await verifyAccountRecord(record) && aliasKey(record.alias) === aliasKey(alias) ? record : null
}

const coded = (message: string, code: string) => Object.assign(new Error(message), { code })

function signIn(alias: string, k: Keys): void {
  account.value = { alias, keys: k }
  signAs(k)
  try { localStorage.setItem('jot:username', alias) } catch { /* not kept */ }
  void keepSession({ alias, keys: k }).catch((e) => console.warn('Could not keep the session:', e))
}

/** Start: this browser's keys, and the account signed in here before (until logging out). */
export async function initIdentity(): Promise<void> {
  const session = await keptSession().catch(() => null)
  if (session?.alias && session.keys?.pub && session.keys.priv) {
    account.value = session
    signAs(session.keys)
  }
  browser.value = await browserKeys()
  ready.value = true
}

/** This browser's keys again (the node made again after it could not start). */
export async function refreshBrowserKeys(): Promise<void> {
  browser.value = (await browserKeys()) ?? browser.value
}

export async function createAccount(alias: string, password: string): Promise<void> {
  if (!validAlias(alias)) throw coded("That name can't be used", 'bad-name')
  if (await findRecord(alias, 1000)) throw coded('That name is already taken', 'name-taken')
  const k = await unsea.generateRandomPair() as Keys // with post-quantum keys
  const record = await createAccountRecord({ alias, namespace: NAMESPACE, keys: k, password })
  if (await publishRecord(record) === 'taken') throw coded('That name is already taken', 'name-taken')
  await unsea.saveKeys(alias, k, password).catch(() => {})
  signIn(alias, k)
}

export async function logIn(alias: string, password: string): Promise<void> {
  // This device first: keys saved here at registration or an earlier login.
  let k: Keys | null = null
  try { k = (await unsea.loadKeys(alias, password)) as Keys ?? null } catch { k = null }
  const had = k
  let record: AccountRecord | null = null
  if (!k) {
    // Another device's account: the signed record from the relay or the mesh. Right after the page opens
    // the links that hold it may still be forming.
    record = await findRecord(alias, 15000)
    if (!record) throw coded('Account not found', 'not-found')
    k = await openAccountRecord(record, password) as Keys // throws on a wrong password
  }
  // Bring the account up to date: post-quantum keys, and a version 2 record wherever accounts are kept.
  try {
    record ??= await findRecord(alias, 0)
    if (record && record.pub === k.pub) {
      if (isPostQuantumRecord(record)) {
        if (k.qpub !== record.qpub || !k.qpriv || !k.kpriv) k = await openAccountRecord(record, password) as Keys
      } else {
        const upgraded = await upgradeAccountRecord(record, password)
        k = upgraded.keys as Keys
        record = upgraded.record
        await publishRecord(record)
      }
    } else if (!record) {
      // An account kept only on this device: given to the relay and the mesh now, post-quantum.
      if (!unsea.hasPostQuantumKeys(k)) k = unsea.upgradePair(k) as Keys
      await publishRecord(await createAccountRecord({ alias, namespace: NAMESPACE, keys: k, password }))
    }
  } catch (error) {
    console.warn('Could not bring the account up to date:', error)
  }
  if (k !== had) await unsea.saveKeys(alias, k, password).catch(() => {})
  signIn(record?.alias || alias, k)
}

export async function logOut(): Promise<void> {
  account.value = null
  signAs(null)
  try { localStorage.removeItem('jot:username') } catch { /* nothing kept */ }
  await idb('readwrite', (s) => s.delete('session')).catch(() => {})
}

export function useIdentity() {
  return { account, browser, keys, signer, ready }
}
