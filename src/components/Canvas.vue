<template>
  <section class="canvas-wrap" :aria-label="current ? `Workspace ${current.name}` : 'Workspace'">
    <div class="toolbar" role="toolbar" aria-label="Workspace tools">
      <template v-if="editable">
        <button class="tb" title="New card (double-click the canvas)" @click="addAtView"><Icon name="plus" /><span class="tb-label">Card</span></button>
        <button class="tb" :class="{ on: linking }" :aria-pressed="linking" :title="linking ? 'Pick two cards to connect (Esc to stop)' : 'Connect two cards'" @click="toggleLinking"><Icon name="connect" /><span class="tb-label">Connect</span></button>
        <span class="tb-sep" />
        <button class="tb" :disabled="!history.undo.length" title="Undo (⌘Z)" aria-label="Undo" @click="undo"><Icon name="undo" /></button>
        <button class="tb" :disabled="!history.redo.length" title="Redo (⇧⌘Z)" aria-label="Redo" @click="redo"><Icon name="redo" /></button>
        <span class="tb-sep" />
      </template>
      <span v-else class="tb-readonly"><Icon name="eye" /> Read only</span>
      <button class="tb" title="Zoom out" aria-label="Zoom out" @click="zoomBy(1 / 1.2)"><Icon name="minus" /></button>
      <button class="tb tb-zoom" title="Back to 100%" @click="zoomTo(1)">{{ Math.round(view.zoom * 100) }}%</button>
      <button class="tb" title="Zoom in" aria-label="Zoom in" @click="zoomBy(1.2)"><Icon name="plus" /></button>
      <button class="tb" title="Show every card" aria-label="Show every card" @click="fit"><Icon name="fit" /></button>
      <span class="tb-sep" />
      <button class="tb" :title="`Grid: ${grid} (click to change)`" :aria-label="`Grid: ${grid}`" @click="cycleGrid"><Icon :name="grid === 'lines' ? 'grid' : 'dots'" :style="{ opacity: grid === 'off' ? 0.4 : 1 }" /></button>
      <button v-if="editable" class="tb" :class="{ on: snapOn }" :aria-pressed="snapOn" title="Snap to the grid" aria-label="Snap to the grid" @click="snapOn = !snapOn"><Icon name="magnet" /></button>
    </div>

    <p v-if="linking" class="mode-note" role="status">{{ linkFrom ? 'Now pick the card to connect it to.' : 'Pick the first card.' }} <button class="btn btn-quiet" @click="toggleLinking">Stop</button></p>

    <div
      ref="pane" class="pane" :class="[`grid-${grid}`, { panning: panDrag }]" :style="gridStyle"
      @pointerdown="onPanePress" @dblclick="onPaneDouble" @wheel="onWheel"
    >
      <div class="world" :style="{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }">
        <svg class="links" aria-hidden="false">
          <defs>
            <marker id="jot-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
              <path d="M0 0L10 5L0 10z" class="arrow-head" />
            </marker>
            <marker id="jot-arrow-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
              <path d="M0 0L10 5L0 10z" class="arrow-head on" />
            </marker>
          </defs>
          <g v-for="l in drawnLinks" :key="l.id" class="link" :class="{ on: l.id === selectedLink }">
            <line :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2" class="link-hit" @pointerdown.stop="pickLink(l.id)" />
            <line :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2" class="link-line" :marker-end="l.kind === 'arrow' ? `url(#${l.id === selectedLink ? 'jot-arrow-on' : 'jot-arrow'})` : undefined" />
          </g>
        </svg>

        <NoteCard
          v-for="c in cards" :key="c.id" :ref="(el) => keepCardRef(c.id, el)"
          :card="c" :x="shown(c).x" :y="shown(c).y" :w="shown(c).w" :h="shown(c).h" :zoom="view.zoom"
          :selected="c.id === selectedCard || group.includes(c.id)" :linking="linking" :can-edit="editable"
          :class="{ 'link-from': c.id === linkFrom }"
          @press="onCardPress(c.id, $event)" @move="startMove(c, $event)" @resize="startResize(c, $event)"
          @delete="removeCard(c.id)" @change="(patch) => updateCard(c.id, patch)" @editing="(on) => onEditing(c.id, on)"
        />
      </div>

      <div v-if="linkMenu" class="link-menu" :style="{ left: `${linkMenu.x}px`, top: `${linkMenu.y}px` }" @pointerdown.stop>
        <button class="tb" :class="{ on: linkMenu.kind === 'arrow' }" title="Arrow" aria-label="Arrow" @click="updateLink(linkMenu.id, { kind: 'arrow' })"><Icon name="arrow" /></button>
        <button class="tb" :class="{ on: linkMenu.kind === 'line' }" title="Line" aria-label="Line" @click="updateLink(linkMenu.id, { kind: 'line' })"><Icon name="line" /></button>
        <button class="tb" title="Turn around" aria-label="Turn around" @click="updateLink(linkMenu.id, { from: linkMenu.to, to: linkMenu.from })">⇄</button>
        <button class="tb tb-stop" title="Delete line" aria-label="Delete line" @click="removeLink(linkMenu.id)"><Icon name="trash" /></button>
      </div>

      <div v-if="!cards.length && loaded" class="empty">
        <p v-if="editable">An empty workspace. <button class="btn btn-go" @click="addAtView">Add a card</button><br /><span class="hint">or double-click anywhere</span></p>
        <p v-else class="hint">{{ state === 'syncing' ? 'Loading this workspace…' : 'Nothing here yet.' }}</p>
      </div>

      <button v-for="d in offscreen" :key="d" class="edge" :class="`edge-${d}`" :title="`Cards ${d === 'up' ? 'above' : d === 'down' ? 'below' : `to the ${d}`}`" :aria-label="`Go to the cards ${d === 'up' ? 'above' : d === 'down' ? 'below' : `to the ${d}`}`" @pointerdown.stop @click="goTo(d)">
        <Icon :name="d" />
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type ComponentPublicInstance } from 'vue'
import Icon from './Icon.vue'
import NoteCard from './NoteCard.vue'
import { addCard, addLink, deleteCard, deleteCards, deleteLink, moveCards, redo, undo, updateCard, updateLink, useJot } from '@/composables/useJot'
import { GRID, MIN_H, MIN_W, bounds, edgePoints, snap, type Card } from '@/lib/model'

const { cards, links, current, currentId, history, editable, loaded, syncState } = useJot()
const state = computed(() => (currentId.value ? syncState.value[currentId.value] : undefined))

const pane = ref<HTMLElement | null>(null)
const selectedCard = ref<string | null>(null)
const selectedLink = ref<string | null>(null)
/** Every card picked at once (⌘A or Ctrl+A on the canvas): moved or deleted together. */
const group = ref<string[]>([])
const editingCard = ref<string | null>(null)
const linking = ref(false)
const linkFrom = ref<string | null>(null)

// ---------- the view: where the canvas is looked at, and how close (kept per workspace)

const view = ref({ x: 40, y: 40, zoom: 1 })
const MIN_ZOOM = 0.1, MAX_ZOOM = 3
const viewKey = (id: string) => `jot:view:${id}`
const keepView = () => { try { if (currentId.value) localStorage.setItem(viewKey(currentId.value), JSON.stringify(view.value)) } catch { /* not kept */ } }
let keepTimer: ReturnType<typeof setTimeout> | null = null
watch(view, () => { if (keepTimer) clearTimeout(keepTimer); keepTimer = setTimeout(keepView, 300) }, { deep: true })

watch(currentId, (id) => {
  selectedCard.value = selectedLink.value = linkFrom.value = null
  group.value = []
  linking.value = false
  let kept: { x: number; y: number; zoom: number } | null = null
  try { kept = id ? JSON.parse(localStorage.getItem(viewKey(id)) ?? 'null') : null } catch { kept = null }
  if (kept && Number.isFinite(kept.x) && Number.isFinite(kept.y) && Number.isFinite(kept.zoom)) view.value = kept
  else { view.value = { x: 40, y: 40, zoom: 1 }; requestAnimationFrame(fit) }
}, { immediate: true })

type GridKind = 'dots' | 'lines' | 'off'
const grid = ref<GridKind>(((): GridKind => { try { const g = localStorage.getItem('jot:grid'); return g === 'lines' || g === 'off' ? g : 'dots' } catch { return 'dots' } })())
const snapOn = ref((() => { try { return localStorage.getItem('jot:snap') === '1' } catch { return false } })())
watch(grid, (g) => { try { localStorage.setItem('jot:grid', g) } catch { /* not kept */ } })
watch(snapOn, (s) => { try { localStorage.setItem('jot:snap', s ? '1' : '0') } catch { /* not kept */ } })
const cycleGrid = () => { grid.value = grid.value === 'dots' ? 'lines' : grid.value === 'lines' ? 'off' : 'dots' }
const gridStyle = computed(() => {
  const size = GRID * view.value.zoom
  return { '--grid': `${size}px`, '--gx': `${view.value.x}px`, '--gy': `${view.value.y}px` } as Record<string, string>
})

const paneSize = () => {
  const r = pane.value?.getBoundingClientRect()
  return { w: r?.width ?? 800, h: r?.height ?? 600, left: r?.left ?? 0, top: r?.top ?? 0 }
}
/** A point on the screen (in the pane), on the canvas. */
const toWorld = (sx: number, sy: number) => ({ x: (sx - view.value.x) / view.value.zoom, y: (sy - view.value.y) / view.value.zoom })

function zoomAround(next: number, sx: number, sy: number): void {
  const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next))
  const w = toWorld(sx, sy)
  view.value = { x: sx - w.x * z, y: sy - w.y * z, zoom: z }
}
const zoomBy = (f: number) => { const s = paneSize(); zoomAround(view.value.zoom * f, s.w / 2, s.h / 2) }
const zoomTo = (z: number) => { const s = paneSize(); zoomAround(z, s.w / 2, s.h / 2) }

/** Every card in view (never closer than 100%). */
function fit(): void {
  const b = bounds(cards.value)
  const s = paneSize()
  if (!b) { view.value = { x: 40, y: 40, zoom: 1 }; return }
  const pad = 48
  const z = Math.min(1, Math.max(MIN_ZOOM, Math.min((s.w - pad * 2) / b.w, (s.h - pad * 2) / b.h)))
  view.value = { zoom: z, x: (s.w - b.w * z) / 2 - b.x * z, y: Math.max(pad, (s.h - b.h * z) / 2) - b.y * z }
}

/** A card in the middle of the view, picked (from search). */
function focusCard(id: string): void {
  const c = cards.value.find((x) => x.id === id)
  if (!c) return
  const s = paneSize()
  const z = Math.max(view.value.zoom, 0.6)
  view.value = { zoom: z, x: s.w / 2 - (c.x + c.w / 2) * z, y: s.h / 2 - (c.y + c.h / 2) * z }
  selectedCard.value = id
}
defineExpose({ focusCard })

// Which ways there are cards out of view, and going to the nearest ones that way.
type Dir = 'left' | 'right' | 'up' | 'down'
const offscreen = computed<Dir[]>(() => {
  const s = paneSize()
  const a = toWorld(0, 0), b = toWorld(s.w, s.h)
  const out = new Set<Dir>()
  for (const c of cards.value) {
    if (c.x + c.w < a.x) out.add('left')
    if (c.x > b.x) out.add('right')
    if (c.y + c.h < a.y) out.add('up')
    if (c.y > b.y) out.add('down')
  }
  return (['left', 'right', 'up', 'down'] as Dir[]).filter((d) => out.has(d))
})
function goTo(d: Dir): void {
  const s = paneSize()
  const a = toWorld(0, 0), b = toWorld(s.w, s.h)
  const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2
  const away = cards.value.filter((c) => (d === 'left' ? c.x + c.w < a.x : d === 'right' ? c.x > b.x : d === 'up' ? c.y + c.h < a.y : c.y > b.y))
  const near = away.sort((p, q) => Math.hypot(p.x + p.w / 2 - cx, p.y + p.h / 2 - cy) - Math.hypot(q.x + q.w / 2 - cx, q.y + q.h / 2 - cy))[0]
  if (!near) return
  const z = view.value.zoom
  view.value = { zoom: z, x: s.w / 2 - (near.x + near.w / 2) * z, y: s.h / 2 - (near.y + near.h / 2) * z }
}

// ---------- moving, resizing, panning

const drag = ref<{ ids: string[]; dx: number; dy: number; dw: number; dh: number } | null>(null)
const panDrag = ref(false)

const shown = (c: Card) => {
  const d = drag.value?.ids.includes(c.id) ? drag.value : null
  return d ? { x: c.x + d.dx, y: c.y + d.dy, w: Math.max(MIN_W, c.w + d.dw), h: Math.max(MIN_H, c.h + d.dh) } : { x: c.x, y: c.y, w: c.w, h: c.h }
}

function follow(e: PointerEvent, onMove: (dx: number, dy: number) => void, onUp: (moved: boolean) => void): void {
  const sx = e.clientX, sy = e.clientY
  let moved = false
  const move = (ev: PointerEvent) => {
    const dx = ev.clientX - sx, dy = ev.clientY - sy
    if (!moved && Math.hypot(dx, dy) < 4) return
    moved = true
    onMove(dx, dy)
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    window.removeEventListener('pointercancel', up)
    onUp(moved)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)
}

function startMove(c: Card, e: PointerEvent): void {
  // Connecting: the press picks the card (onCardPress), it doesn't move it.
  if (e.button !== 0 || linking.value) return
  selectedLink.value = null
  // One of the picked cards: they all move (a click without moving picks just this one).
  if (group.value.length > 1 && group.value.includes(c.id)) {
    if (!editable.value) return
    e.preventDefault()
    const ids = [...group.value]
    const z = view.value.zoom
    follow(e, (dx, dy) => { drag.value = { ids, dx: dx / z, dy: dy / z, dw: 0, dh: 0 } }, (moved) => {
      const d = drag.value
      drag.value = null
      if (moved && d) {
        void moveCards(cards.value.filter((x) => ids.includes(x.id)).map((x) => ({ id: x.id, x: snap(x.x + d.dx, snapOn.value), y: snap(x.y + d.dy, snapOn.value) })))
      } else if (!moved) { group.value = []; selectedCard.value = c.id }
    })
    return
  }
  group.value = []
  selectedCard.value = c.id
  if (!editable.value) return
  e.preventDefault()
  const z = view.value.zoom
  follow(e, (dx, dy) => { drag.value = { ids: [c.id], dx: dx / z, dy: dy / z, dw: 0, dh: 0 } }, (moved) => {
    const d = drag.value
    drag.value = null
    if (moved && d) void updateCard(c.id, { x: snap(c.x + d.dx, snapOn.value), y: snap(c.y + d.dy, snapOn.value) })
  })
}

function startResize(c: Card, e: PointerEvent): void {
  if (e.button !== 0 || !editable.value) return
  e.preventDefault()
  group.value = []
  selectedCard.value = c.id
  const z = view.value.zoom
  follow(e, (dx, dy) => { drag.value = { ids: [c.id], dx: 0, dy: 0, dw: dx / z, dh: dy / z } }, (moved) => {
    const d = drag.value
    drag.value = null
    if (moved && d) void updateCard(c.id, { w: Math.max(MIN_W, snap(c.w + d.dw, snapOn.value)), h: Math.max(MIN_H, snap(c.h + d.dh, snapOn.value)) })
  })
}

// Two fingers on a touch screen: pinch to zoom.
const touches = new Map<number, { x: number; y: number }>()
let pinch: { d: number; zoom: number } | null = null

function onPanePress(e: PointerEvent): void {
  const target = e.target as HTMLElement
  if (target !== pane.value && !target.classList.contains('world') && !target.classList.contains('links')) return
  if (e.pointerType === 'touch') {
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const end = (ev: PointerEvent) => { touches.delete(ev.pointerId); if (touches.size < 2) pinch = null; window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end) }
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    if (touches.size === 2) {
      const [p, q] = [...touches.values()]
      pinch = { d: Math.hypot(p.x - q.x, p.y - q.y), zoom: view.value.zoom }
      const move = (ev: PointerEvent) => {
        if (!touches.has(ev.pointerId) || !pinch) { window.removeEventListener('pointermove', move); return }
        touches.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
        const [a, b] = [...touches.values()]
        const s = paneSize()
        zoomAround(pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, (a.x + b.x) / 2 - s.left, (a.y + b.y) / 2 - s.top)
      }
      window.addEventListener('pointermove', move)
      return
    }
  }
  if (e.button !== 0 && e.button !== 1) return
  const start = { ...view.value }
  follow(e, (dx, dy) => { if (pinch) return; panDrag.value = true; view.value = { ...start, x: start.x + dx, y: start.y + dy } }, (moved) => {
    panDrag.value = false
    if (!moved) clearSelection()
  })
}

function onPaneDouble(e: MouseEvent): void {
  const target = e.target as HTMLElement
  if (!editable.value || (target !== pane.value && !target.classList.contains('world') && !target.classList.contains('links'))) return
  const s = paneSize()
  const w = toWorld(e.clientX - s.left, e.clientY - s.top)
  void addCard(snap(w.x - 30, snapOn.value), snap(w.y - 20, snapOn.value), true).then((c) => { if (c) selectedCard.value = c.id })
}

/** A wheel or trackpad: pans; with Ctrl or ⌘ (and a trackpad's pinch), zooms. A note that scrolls scrolls. */
function onWheel(e: WheelEvent): void {
  const s = paneSize()
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    zoomAround(view.value.zoom * Math.exp(-e.deltaY * 0.01), e.clientX - s.left, e.clientY - s.top)
    return
  }
  const body = (e.target as HTMLElement).closest('.card-body') as HTMLElement | null
  if (body && (body.scrollHeight > body.clientHeight + 1 || body.scrollWidth > body.clientWidth + 1)) return
  e.preventDefault()
  view.value = { ...view.value, x: view.value.x - e.deltaX, y: view.value.y - e.deltaY }
}

function addAtView(): void {
  const s = paneSize()
  // Below the toolbar, which floats over the canvas's top left.
  const w = toWorld(40, 96)
  void addCard(snap(w.x, snapOn.value), snap(w.y, snapOn.value)).then((c) => {
    if (!c) return
    selectedCard.value = c.id
    // In view, if it went beyond the edge.
    if (c.x * view.value.zoom + view.value.x > s.w - 60 || c.y * view.value.zoom + view.value.y > s.h - 60) focusCard(c.id)
  })
}

// ---------- picking and connecting

function clearSelection(): void {
  if (linking.value) { linkFrom.value = null; return }
  group.value = []
  selectedCard.value = null
  selectedLink.value = null
}

function onCardPress(id: string, e?: PointerEvent): void {
  if (linking.value) { pickForLink(id); return }
  // A press on a picked card's title bar may move them all (startMove); anywhere else in it, just that card.
  if (group.value.includes(id) && (e?.target as HTMLElement | null)?.closest('.card-head')) return
  group.value = []
  if (selectedCard.value !== id) {
    // Writing in another card: that one is done.
    if (editingCard.value && editingCard.value !== id) cardRefs.get(editingCard.value)?.stopEditing()
    selectedCard.value = id
  }
  selectedLink.value = null
}

function toggleLinking(): void {
  linking.value = !linking.value
  linkFrom.value = null
  if (linking.value) { selectedLink.value = null; if (editingCard.value) cardRefs.get(editingCard.value)?.stopEditing() }
}

function pickForLink(id: string): void {
  if (!linkFrom.value) { linkFrom.value = id; return }
  if (linkFrom.value !== id) void addLink(linkFrom.value, id)
  linkFrom.value = null
  linking.value = false
}

function pickLink(id: string): void {
  if (linking.value || !editable.value) return
  selectedLink.value = id
  selectedCard.value = null
}

const drawnLinks = computed(() => {
  const byId = new Map(cards.value.map((c) => [c.id, c]))
  return links.value.flatMap((l) => {
    const a = byId.get(l.from), b = byId.get(l.to)
    if (!a || !b) return []
    return [{ ...edgePoints(shown(a), shown(b)), id: l.id, kind: l.kind }]
  })
})

const linkMenu = computed(() => {
  const l = links.value.find((x) => x.id === selectedLink.value)
  const d = drawnLinks.value.find((x) => x.id === selectedLink.value)
  if (!l || !d) return null
  const mx = (d.x1 + d.x2) / 2, my = (d.y1 + d.y2) / 2
  return { id: l.id, kind: l.kind, from: l.from, to: l.to, x: mx * view.value.zoom + view.value.x, y: my * view.value.zoom + view.value.y }
})

const removeCard = (id: string) => { if (selectedCard.value === id) selectedCard.value = null; void deleteCard(id) }
const removeLink = (id: string) => { selectedLink.value = null; void deleteLink(id) }

type CardRef = { stopEditing: () => void; selectNote: () => void }
const cardRefs = new Map<string, CardRef>()
const keepCardRef = (id: string, el: Element | ComponentPublicInstance | null) => {
  if (el) cardRefs.set(id, el as unknown as CardRef); else cardRefs.delete(id)
}
const onEditing = (id: string, on: boolean) => {
  editingCard.value = on ? id : editingCard.value === id ? null : editingCard.value
  // A page left open reloads itself for a new build, but not while something is being written (main.ts).
  document.documentElement.dataset.writing = editingCard.value ? '1' : ''
}

// ---------- keys

function onKey(e: KeyboardEvent): void {
  const t = e.target as HTMLElement | null
  const typing = !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
  const mod = e.metaKey || e.ctrlKey
  if (e.key === 'Escape') {
    if (editingCard.value) { cardRefs.get(editingCard.value)?.stopEditing(); return }
    if (linking.value) { toggleLinking(); return }
    if (!typing) { selectedCard.value = null; selectedLink.value = null; group.value = [] }
    return
  }
  // ⌘A or Ctrl+A: in a note, all of it (NoteCard); a card picked, its note; on the canvas, every card, and
  // again, none. Not the whole page.
  if (mod && e.key.toLowerCase() === 'a' && !typing && !linking.value) {
    const onCanvas = !t || t === document.body || !!t.closest('.canvas-wrap')
    if (!onCanvas) return
    e.preventDefault()
    if (selectedCard.value && cardRefs.has(selectedCard.value)) { cardRefs.get(selectedCard.value)!.selectNote(); return }
    selectedLink.value = null
    const all = cards.value.map((c) => c.id)
    group.value = all.length && all.every((id) => group.value.includes(id)) ? [] : all
    return
  }
  if (typing || !editable.value) return
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); void (e.shiftKey ? redo() : undo()); return }
  if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); void redo(); return }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selectedLink.value) { e.preventDefault(); removeLink(selectedLink.value) } else if (group.value.length) { e.preventDefault(); const ids = group.value; group.value = []; void deleteCards(ids) } else if (selectedCard.value) { e.preventDefault(); removeCard(selectedCard.value) }
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.canvas-wrap { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; }

.toolbar { position: absolute; top: 12px; left: 12px; z-index: 10; display: flex; align-items: center; flex-wrap: wrap; gap: 2px; padding: 4px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; box-shadow: 0 4px 14px rgba(28, 33, 38, 0.08); max-width: calc(100% - 24px); }
.tb { display: inline-flex; align-items: center; gap: 0.35rem; height: 32px; min-width: 32px; justify-content: center; padding: 0 0.5rem; border-radius: var(--radius); color: var(--ink-2); font-size: 0.85rem; font-weight: 600; }
.tb:hover:not(:disabled) { background: var(--wing); color: var(--ink); }
.tb:disabled { opacity: 0.35; }
.tb.on { background: var(--sheen-wash); color: var(--sheen); }
.tb-zoom { min-width: 3.4rem; font-variant-numeric: tabular-nums; }
.tb-stop:hover:not(:disabled) { background: var(--stop-wash); color: var(--stop); }
.tb-sep { width: 1px; height: 20px; background: var(--line); margin: 0 4px; }
.tb-readonly { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0 0.6rem; font-size: 0.85rem; font-weight: 600; color: var(--ink-2); }

.mode-note { position: absolute; top: 64px; left: 12px; z-index: 10; font-size: 0.85rem; background: var(--sheen-wash); color: var(--ink); border: 1px solid var(--sheen); padding: 0.3rem 0.4rem 0.3rem 0.75rem; border-radius: var(--radius); display: flex; align-items: center; gap: 0.5rem; }

.pane { position: relative; flex: 1; overflow: hidden; touch-action: none; cursor: default; background-color: var(--paper); }
.pane.panning { cursor: grabbing; }
.pane.grid-dots { background-image: radial-gradient(circle, var(--line-strong) 1px, transparent 1.2px); background-size: var(--grid) var(--grid); background-position: var(--gx) var(--gy); }
.pane.grid-lines { background-image: linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px); background-size: var(--grid) var(--grid); background-position: var(--gx) var(--gy); }
.world { position: absolute; left: 0; top: 0; width: 0; height: 0; transform-origin: 0 0; }
.links { position: absolute; left: 0; top: 0; width: 1px; height: 1px; overflow: visible; }
.link-line { stroke: var(--slate); stroke-width: 2; }
.link-hit { stroke: transparent; stroke-width: 14; cursor: pointer; pointer-events: stroke; }
.link:hover .link-line { stroke: var(--ink-2); }
.link.on .link-line { stroke: var(--sheen); stroke-width: 2.5; }
.arrow-head { fill: var(--slate); }
.arrow-head.on { fill: var(--sheen); }
.link-menu { position: absolute; z-index: 12; transform: translate(-50%, -130%); display: flex; gap: 2px; padding: 4px; background: var(--surface); border: 1px solid var(--line-strong); border-radius: 8px; box-shadow: 0 6px 18px rgba(28, 33, 38, 0.16); }

:deep(.note-card.link-from) { box-shadow: 0 0 0 3px var(--sheen); }

.empty { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; text-align: center; }
.empty p { pointer-events: auto; line-height: 2.4; color: var(--ink-2); }

.edge { position: absolute; z-index: 9; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: var(--surface); border: 1px solid var(--line-strong); color: var(--ink-2); box-shadow: 0 2px 8px rgba(28, 33, 38, 0.12); }
.edge:hover { color: var(--sheen); border-color: var(--sheen); }
.edge-left { left: 10px; top: 50%; transform: translateY(-50%); }
.edge-right { right: 10px; top: 50%; transform: translateY(-50%); }
.edge-up { top: 64px; left: 50%; transform: translateX(-50%); }
.edge-down { bottom: 14px; left: 50%; transform: translateX(-50%); }

@media (max-width: 860px) {
  .tb-label { display: none; }
  .toolbar { top: 8px; left: 8px; max-width: calc(100% - 16px); }
}
</style>
