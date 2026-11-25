// Jot's notes as records, and what is worked out from them (src/lib/model.ts, src/lib/links.ts).
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  bounds, cardRecord, edgePoints, exportFile, indexRecord, inkOn, parseCard, parseImport, parseIndex, parseLink, parseMeta,
  placeCard, plainText, search, snap, type Card, type Workspace,
} from '../src/lib/model'
import { joinLink, newSecret, parseInvite, viewLink } from '../src/lib/links'

const card = (over: Partial<Card> = {}): Card => ({ id: 'c1', ws: 'w1', title: 'T', content: '<p>hi</p>', x: 0, y: 0, w: 450, h: 350, at: 1000, ...over })

test('a card goes to its room and comes back the same', () => {
  const c = card({ color: '#ffd9b3' })
  assert.deepEqual(parseCard('w1', 'jot/c/c1', cardRecord(c), 2000), c)
})

test('a card from a room is checked', () => {
  assert.equal(parseCard('w1', 'jot/c/c1', { title: 'x' }), null, 'no note')
  assert.equal(parseCard('w1', 'jot/k/c1', cardRecord(card())), null, 'not a card key')
  assert.equal(parseCard('w1', 'jot/c/bad id', cardRecord(card())), null, 'not an id')
  const odd = parseCard('w1', 'jot/c/c1', { content: '', w: 5, h: 1e9, x: 'no', color: 'red', at: Date.now() + 3_600_000 }, 1000)!
  assert.equal(odd.w, 220, 'too narrow: the narrowest')
  assert.equal(odd.h, 4000, 'too tall: the tallest')
  assert.equal(odd.x, 0)
  assert.equal(odd.color, undefined, 'only #rrggbb')
  assert.ok(odd.at <= 1000 + 5 * 60_000, 'a wrong clock ahead is not believed')
})

test('a line between two cards', () => {
  assert.deepEqual(parseLink('w1', 'jot/k/l1', { from: 'a', to: 'b', kind: 'line', at: 5 }), { id: 'l1', ws: 'w1', from: 'a', to: 'b', kind: 'line', at: 5 })
  assert.equal(parseLink('w1', 'jot/k/l1', { from: 'a', to: 'a' }), null, 'not to itself')
  assert.equal(parseLink('w1', 'jot/k/l1', { from: 'a', to: 'b', kind: 'weird' })?.kind, 'arrow')
})

test('a name', () => {
  assert.deepEqual(parseMeta({ name: '  Two   words ', at: 3 }), { name: 'Two words', at: 3 })
  assert.equal(parseMeta({ name: '   ', at: 3 })?.name, 'Untitled')
  assert.equal(parseMeta({}), null)
})

test('an account\'s entry for a workspace', () => {
  const secret = newSecret()
  const w: Workspace = { id: 'w1', name: 'Mine', order: 2, role: 'owner', secret, at: 9 }
  assert.deepEqual(parseIndex('jot/i/w1', indexRecord(w)), w)
  assert.equal(parseIndex('jot/i/w1', { ...indexRecord(w), secret: undefined }), null, 'an editor needs the secret')
  const viewer: Workspace = { id: 'w2', name: 'Theirs', order: 0, role: 'viewer', view: { secret, pub: 'p'.repeat(43) + '.' + 'q'.repeat(43) }, at: 1 }
  assert.deepEqual(parseIndex('jot/i/w2', indexRecord(viewer)), viewer)
})

test('a new card goes where nothing is', () => {
  assert.deepEqual(placeCard(0, 0, []), { x: 0, y: 0 })
  const at = placeCard(0, 0, [{ x: 0, y: 0, w: 450, h: 350 }])
  assert.ok(at.x >= 450 || at.y >= 350, `clear of the card there (${at.x}, ${at.y})`)
})

test('the canvas: bounds, edges, snapping, ink', () => {
  assert.deepEqual(bounds([{ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: -5, w: 10, h: 10 }]), { x: 0, y: -5, w: 30, h: 15 })
  assert.equal(bounds([]), null)
  const e = edgePoints({ x: 0, y: 0, w: 100, h: 100 }, { x: 300, y: 0, w: 100, h: 100 })
  assert.deepEqual(e, { x1: 100, y1: 50, x2: 300, y2: 50 }, 'from the facing edges')
  assert.equal(snap(29, true), 20)
  assert.equal(snap(31, true), 40)
  assert.equal(snap(29.4, false), 29)
  assert.equal(inkOn('#2a3747'), 'light')
  assert.equal(inkOn('#fff4b8'), 'dark')
})

test('search: every word, titles first', () => {
  const cards = [card({ id: 'a', title: 'Groceries', content: '<p>milk and <b>eggs</b></p>' }), card({ id: 'b', title: 'Eggs', content: '<p>for later</p>' })]
  assert.deepEqual(search(cards, 'eggs').map((h) => h.card.id), ['b', 'a'])
  assert.deepEqual(search(cards, 'milk eggs').map((h) => h.card.id), ['a'])
  assert.equal(search(cards, 'nothing').length, 0)
  assert.equal(plainText('<p>a &amp; b</p><p>c</p>'), 'a & b c')
})

test('an export of the first jot comes in', () => {
  const old = {
    version: '1.0.0', exportDate: '2025-07-01T00:00:00.000Z', user: { id: 'u' },
    workspaces: [{ id: 'w1', name: 'Old', userId: 'u', order: 0, createdAt: '2025-06-01T00:00:00.000Z', updatedAt: '2025-06-01T00:00:00.000Z' }],
    cards: [
      { id: 'c1', workspaceId: 'w1', title: 'A', content: '<p>a</p>', x: 10, y: 20, width: 300, height: 200, backgroundColor: '#ffffff', createdAt: '2025-06-01T00:00:00.000Z', updatedAt: '2025-06-02T00:00:00.000Z' },
      { id: 'c2', workspaceId: 'w1', title: 'B', content: '<p>b</p>', x: 400, y: 20, width: 300, height: 200, backgroundColor: '#c8f0e1', createdAt: '2025-06-01T00:00:00.000Z', updatedAt: '2025-06-02T00:00:00.000Z' },
      { id: 'c3', workspaceId: 'elsewhere', title: 'C', content: '', x: 0, y: 0, width: 300, height: 200 },
    ],
    connections: [{ id: 'k1', workspaceId: 'w1', fromCardId: 'c1', toCardId: 'c2', type: 'line', createdAt: '2025-06-01T00:00:00.000Z' }],
  }
  const got = parseImport(JSON.stringify(old))
  assert.deepEqual(got.workspaces, [{ id: 'w1', name: 'Old', order: 0 }])
  assert.deepEqual(got.cards.map((c) => [c.id, c.w, c.h, c.color, c.at]), [['c1', 300, 200, undefined, Date.parse('2025-06-02T00:00:00.000Z')], ['c2', 300, 200, '#c8f0e1', Date.parse('2025-06-02T00:00:00.000Z')]])
  assert.deepEqual(got.links.map((l) => [l.id, l.from, l.to, l.kind]), [['k1', 'c1', 'c2', 'line']])
  assert.throws(() => parseImport('nope'), /not a jot export/)
  assert.throws(() => parseImport('{"a":1}'), /not a jot export/)
})

test('an export of this jot comes back the same', () => {
  const w: Workspace = { id: 'w1', name: 'W', order: 0, role: 'owner', secret: newSecret(), at: 1 }
  const c = card({ synced: true })
  const file = exportFile([w], [c], [{ id: 'k', ws: 'w1', from: 'c1', to: 'c1x', kind: 'arrow', at: 1, synced: true }])
  assert.equal(JSON.stringify(file).includes(w.secret!), false, 'no secrets in an export')
  const back = parseImport(JSON.stringify(file))
  assert.deepEqual(back.cards, [{ ...c, synced: undefined }].map(({ synced: _s, ...rest }) => rest))
  assert.equal(back.links.length, 0, 'a line to a card that is not there is left out')
})

test('links to workspaces', () => {
  const s = newSecret()
  assert.match(s, /^[\w-]{43}$/)
  const pub = 'A'.repeat(43) + '.' + 'B'.repeat(43)
  assert.deepEqual(parseInvite(new URL(joinLink('https://jot.ooo', 'w-1', s)).hash), { kind: 'join', id: 'w-1', secret: s })
  assert.deepEqual(parseInvite(new URL(viewLink('https://jot.ooo', 'w-1', s, pub)).hash), { kind: 'view', id: 'w-1', secret: s, pub })
  assert.equal(parseInvite('#/join/w-1/short'), null)
  assert.equal(parseInvite('#/elsewhere'), null)
})
