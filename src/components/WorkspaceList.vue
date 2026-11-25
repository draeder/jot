<template>
  <aside class="side" :class="{ open }" aria-label="Workspaces">
    <div class="side-head">
      <h2>Workspaces</h2>
      <button class="tb" title="New workspace" aria-label="New workspace" @click="startNew"><Icon name="plus" /></button>
    </div>

    <form v-if="adding" class="new" @submit.prevent="saveNew">
      <input ref="newInput" v-model="newName" :maxlength="MAX_NAME" placeholder="Workspace name" aria-label="New workspace name" @keydown.esc="adding = false" />
      <button class="btn btn-go" :disabled="!newName.trim()">Add</button>
    </form>

    <ol class="list">
      <li
        v-for="w in workspaces" :key="w.id" class="item"
        :class="{ on: w.id === currentId, dragging: dragId === w.id, over: overId === w.id && dragId !== w.id }"
        :draggable="renaming !== w.id" @dragstart="onDragStart(w.id, $event)" @dragover.prevent="overId = w.id" @dragleave="overId === w.id && (overId = null)" @drop.prevent="onDrop(w.id)" @dragend="dragId = overId = null"
      >
        <input
          v-if="renaming === w.id" ref="renameInput" v-model="draft" class="rename" :maxlength="MAX_NAME" :aria-label="`Rename ${w.name}`"
          @keydown.enter.prevent="saveRename(w.id)" @keydown.esc.prevent="renaming = null" @blur="saveRename(w.id)"
        />
        <button v-else class="pick" :aria-current="w.id === currentId ? 'true' : undefined" @click="pick(w.id)" @dblclick="startRename(w)">
          <span class="dot" :class="syncState[w.id] ?? 'local'" :title="stateText(syncState[w.id])" />
          <span class="name">{{ w.name }}</span>
          <span v-if="w.role === 'viewer'" class="tag" title="You can read this workspace">read only</span>
          <span v-else-if="w.role === 'editor'" class="tag" title="Shared with you">shared</span>
          <span v-else-if="w.view" class="tag" title="Published read-only">published</span>
        </button>
        <span class="item-tools">
          <button v-if="w.role !== 'viewer'" class="mini" title="Rename" :aria-label="`Rename ${w.name}`" @click="startRename(w)"><Icon name="pencil" /></button>
          <button class="mini" :title="w.role === 'owner' ? 'Delete' : 'Remove from my list'" :aria-label="w.role === 'owner' ? `Delete ${w.name}` : `Remove ${w.name} from my list`" @click="confirming = w"><Icon :name="w.role === 'owner' ? 'trash' : 'close'" /></button>
        </span>
      </li>
    </ol>

    <footer class="side-foot">
      <slot />
    </footer>

    <div v-if="confirming" class="modal-overlay" @click.self="confirming = null">
      <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <template v-if="confirming.role === 'owner'">
          <h3 id="confirm-title">Delete “{{ confirming.name }}”?</h3>
          <p>Its cards are deleted here, on your other devices, and for everyone it is shared with. This can’t be undone (an export first keeps a copy).</p>
        </template>
        <template v-else>
          <h3 id="confirm-title">Remove “{{ confirming.name }}” from your list?</h3>
          <p>It stays as it is for the others. You can open it again from its link.</p>
        </template>
        <div class="modal-buttons">
          <button class="btn" @click="confirming = null">Cancel</button>
          <button class="btn btn-stop" @click="remove">{{ confirming.role === 'owner' ? 'Delete' : 'Remove' }}</button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import Icon from './Icon.vue'
import { createWorkspace, removeWorkspace, renameWorkspace, reorderWorkspaces, select, useJot, type SyncState } from '@/composables/useJot'
import { MAX_NAME, type Workspace } from '@/lib/model'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ picked: [] }>()
const { workspaces, currentId, syncState } = useJot()

const adding = ref(false)
const newName = ref('')
const newInput = ref<HTMLInputElement | null>(null)
const renaming = ref<string | null>(null)
const draft = ref('')
const renameInput = ref<HTMLInputElement[] | HTMLInputElement | null>(null)
const confirming = ref<Workspace | null>(null)
const dragId = ref<string | null>(null)
const overId = ref<string | null>(null)

const stateText = (s: SyncState | undefined) => ({ synced: 'Kept on the storage servers', syncing: 'Syncing', offline: 'Only in this browser for now: not reached the storage servers', local: 'In this browser' }[s ?? 'local'])

const pick = (id: string) => { void select(id); emit('picked') }

async function startNew(): Promise<void> {
  adding.value = true
  newName.value = ''
  await nextTick()
  newInput.value?.focus()
}
async function saveNew(): Promise<void> {
  if (!newName.value.trim()) return
  const ws = await createWorkspace(newName.value)
  adding.value = false
  pick(ws.id)
}

async function startRename(w: Workspace): Promise<void> {
  if (w.role === 'viewer') return
  renaming.value = w.id
  draft.value = w.name
  await nextTick()
  const el = Array.isArray(renameInput.value) ? renameInput.value[0] : renameInput.value
  el?.select()
}
function saveRename(id: string): void {
  if (renaming.value !== id) return
  renaming.value = null
  const w = workspaces.value.find((x) => x.id === id)
  if (w && draft.value.trim() && draft.value.trim() !== w.name) void renameWorkspace(id, draft.value)
}

async function remove(): Promise<void> {
  const w = confirming.value
  confirming.value = null
  if (w) await removeWorkspace(w.id)
}

function onDragStart(id: string, e: DragEvent): void {
  dragId.value = id
  e.dataTransfer?.setData('text/plain', id)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}
function onDrop(target: string): void {
  const from = dragId.value
  dragId.value = overId.value = null
  if (!from || from === target) return
  const ids = workspaces.value.map((w) => w.id).filter((id) => id !== from)
  ids.splice(ids.indexOf(target) + (workspaces.value.findIndex((w) => w.id === from) < workspaces.value.findIndex((w) => w.id === target) ? 1 : 0), 0, from)
  void reorderWorkspaces(ids)
}
</script>

<style scoped>
.side { width: 256px; flex: none; display: flex; flex-direction: column; border-right: 1px solid var(--line); background: var(--surface); min-height: 0; }
.side-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 10px 6px 16px; }
.side-head h2 { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-2); }
.tb { display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--radius); color: var(--ink-2); }
.tb:hover { background: var(--wing); color: var(--ink); }
.new { display: flex; gap: 0.4rem; padding: 4px 10px 8px; }
.new input { padding: 0.35rem 0.55rem; }
.new .btn { padding: 0.35rem 0.7rem; }
.list { list-style: none; overflow: auto; flex: 1; padding: 2px 6px 10px; }
.item { position: relative; display: flex; align-items: center; border-radius: var(--radius); }
.item:hover { background: var(--wing); }
.item.on { background: var(--paper); box-shadow: inset 3px 0 0 var(--sheen); }
.item.dragging { opacity: 0.4; }
.item.over { box-shadow: inset 0 2px 0 var(--sheen); }
.pick { flex: 1; min-width: 0; display: flex; align-items: center; gap: 0.55rem; padding: 0.55rem 0.6rem 0.55rem 0.7rem; text-align: left; }
.item.on .pick { font-weight: 700; }
.name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tag { font-size: 0.68rem; font-weight: 600; color: var(--ink-2); border: 1px solid var(--line-strong); border-radius: 999px; padding: 0 0.4rem; white-space: nowrap; }
.dot { width: 7px; height: 7px; border-radius: 50%; flex: none; background: var(--line-strong); }
.dot.synced { background: var(--sheen); }
.dot.syncing { background: var(--slate); animation: blink 1.4s ease-in-out infinite; }
.dot.offline { background: var(--mark); }
@keyframes blink { 50% { opacity: 0.3; } }
.item-tools { display: none; padding-right: 4px; }
.item:hover .item-tools, .item:focus-within .item-tools { display: flex; }
.item:hover .tag, .item:focus-within .tag { display: none; }
.mini { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 5px; color: var(--ink-2); }
.mini:hover { color: var(--ink); background: var(--line); }
.mini :deep(.icon) { width: 15px; height: 15px; }
.rename { margin: 3px 4px; padding: 0.35rem 0.5rem; }
.side-foot { border-top: 1px solid var(--line); padding: 10px 12px calc(10px + env(safe-area-inset-bottom)); font-size: 0.72rem; color: var(--ink-2); }

@media (max-width: 860px) {
  .side { position: absolute; z-index: 30; top: 0; bottom: 0; left: 0; transform: translateX(-100%); transition: transform 0.18s ease; box-shadow: 0 0 40px rgba(28, 33, 38, 0.2); }
  .side.open { transform: none; }
  .item-tools { display: flex; }
  .tag { display: none; }
}
</style>
