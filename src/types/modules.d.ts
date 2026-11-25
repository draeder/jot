/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

// unsea and PigeonIdP ship as plain JavaScript.
declare module 'unsea' {
  export interface KeyPair { pub: string; priv: string; epub: string; epriv: string; qpub?: string; qpriv?: string; kpub?: string; kpriv?: string }
  export interface PublicKeys { pub: string; epub: string; qpub?: string; kpub?: string }
  export function generateRandomPair(options?: object): Promise<KeyPair>
  export function publicKeysOf(pair: KeyPair): PublicKeys
  export function hasPostQuantumKeys(pair: object): boolean
  export function upgradePair(pair: KeyPair): KeyPair
  export function signMessage(msg: string, privOrPair: string | KeyPair): Promise<string>
  export function verifyMessage(msg: string, sig: string, pubOrKeys: string | { pub: string; qpub?: string }): Promise<boolean>
  export function encryptMessageWithMeta(msg: string, recipient: { epub: string; kpub?: string }): Promise<Record<string, unknown>>
  export function decryptMessageWithMeta(payload: unknown, privOrPair: string | KeyPair): Promise<string>
  export function saveKeys(name: string, keys: KeyPair, password?: string | null, options?: object): Promise<unknown>
  export function loadKeys(name: string, password?: string | null, options?: object): Promise<KeyPair | undefined>
  /** WebCrypto's SubtleCrypto, or unsea's stand-in on a page without one (plain http). */
  export function getSubtle(): SubtleCrypto
  export function hasNativeSubtle(): boolean
}

declare module 'pigeonidp/records' {
  import type { KeyPair } from 'unsea'
  export interface AccountRecord { alias: string; namespace: string; pub: string; qpub?: string; [key: string]: unknown }
  export function aliasKey(alias: string): string
  export function validAlias(alias: string): boolean
  export function createAccountRecord(input: { alias: string; namespace: string; keys: KeyPair; password: string }): Promise<AccountRecord>
  export function openAccountRecord(record: AccountRecord, password: string): Promise<KeyPair>
  export function upgradeAccountRecord(record: AccountRecord, password: string): Promise<{ keys: KeyPair; record: AccountRecord }>
  export function verifyAccountRecord(record: unknown): Promise<boolean>
  export function isPostQuantumRecord(record: AccountRecord): boolean
}
