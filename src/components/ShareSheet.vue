<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <h3 id="share-title">Share “{{ ws.name }}”</h3>

      <template v-if="ws.role === 'viewer'">
        <p>This workspace was shared with you to read. Its owner can give you the link to edit it.</p>
        <div class="modal-buttons"><button class="btn" @click="$emit('close')">Close</button></div>
      </template>

      <template v-else>
        <section>
          <h4>Edit together</h4>
          <p>Anyone with this link can see and change this workspace, and you see their changes as they make them. Send it only to people you want editing.</p>
          <div class="copy-field">
            <input :value="edit ?? ''" readonly aria-label="Edit link" @focus="($event.target as HTMLInputElement).select()" />
            <button class="btn" :disabled="!edit" @click="copy(edit!, 'edit')">{{ copied === 'edit' ? 'Copied' : 'Copy' }}</button>
          </div>
          <p v-if="ws.role === 'owner'" class="hint more">
            Gave it to someone by mistake?
            <button class="link-btn" @click="resetting = true">Make a new edit link</button>: the old one stops working, and what the people who had it see of this workspace is cleared.
          </p>
          <div v-if="resetting" class="confirm">
            <p>Everyone who has the current link loses this workspace, and gets it back only from the new link. You keep it as it is.</p>
            <div class="row">
              <button class="btn" @click="resetting = false">Cancel</button>
              <button class="btn btn-stop" :disabled="busy" @click="reset">Make a new link</button>
            </div>
          </div>
        </section>

        <section>
          <h4>Read only</h4>
          <template v-if="view">
            <p>Anyone with this link can read this workspace, as it is now and as you change it, but can’t change it. It stays up to date while jot is open {{ account ? 'on a device signed in to your account' : 'in this browser' }}.</p>
            <div class="copy-field">
              <input :value="view" readonly aria-label="Read-only link" @focus="($event.target as HTMLInputElement).select()" />
              <button class="btn" @click="copy(view, 'view')">{{ copied === 'view' ? 'Copied' : 'Copy' }}</button>
            </div>
            <div class="row end"><button class="btn btn-stop" :disabled="busy || !mine" :title="mine ? undefined : 'Published from another account or browser'" @click="stop">Stop publishing</button></div>
          </template>
          <template v-else>
            <p>Publish a read-only copy: a link anyone can open to read it, without being able to change it.</p>
            <div class="row end"><button class="btn btn-go" :disabled="busy || !connected" @click="go">{{ busy ? 'Publishing…' : 'Publish' }}</button></div>
            <p v-if="!connected" class="hint">Connect to the mesh to publish.</p>
          </template>
        </section>

        <p class="hint">The links hold the workspace’s key after the “#”, which your browser never sends to a server. The storage servers keep only sealed copies they can’t read.</p>
        <div class="modal-buttons"><button class="btn" @click="$emit('close')">Done</button></div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { editLink, publish, publishedLink, resetEditLink, unpublish } from '@/composables/useJot'
import { useIdentity } from '@/composables/useIdentity'
import { useMesh } from '@/composables/useMesh'
import type { Workspace } from '@/lib/model'

const props = defineProps<{ ws: Workspace }>()
defineEmits<{ close: [] }>()
const { account, keys } = useIdentity()
const { connected } = useMesh()

const edit = computed(() => editLink(props.ws.id))
const view = computed(() => publishedLink(props.ws.id))
const mine = computed(() => !!props.ws.view && props.ws.view.pub === keys.value?.pub)
const busy = ref(false)
const copied = ref<string | null>(null)
const resetting = ref(false)

async function copy(text: string, which: string): Promise<void> {
  try { await navigator.clipboard.writeText(text); copied.value = which; setTimeout(() => { if (copied.value === which) copied.value = null }, 1500) } catch { /* select it instead */ }
}
async function go(): Promise<void> { busy.value = true; try { await publish(props.ws.id) } finally { busy.value = false } }
async function stop(): Promise<void> { busy.value = true; try { await unpublish(props.ws.id) } finally { busy.value = false } }
async function reset(): Promise<void> { busy.value = true; try { await resetEditLink(props.ws.id); resetting.value = false } finally { busy.value = false } }
</script>

<style scoped>
section { border-top: 1px solid var(--line); padding-top: 0.9rem; margin-top: 0.9rem; }
h4 { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.35rem; }
.modal section p { margin-bottom: 0.6rem; }
.row.end { justify-content: flex-end; margin-top: 0.6rem; }
.more { margin-top: 0.6rem; }
.link-btn { color: var(--sheen); text-decoration: underline; font-weight: 600; }
.confirm { background: var(--stop-wash); border-radius: var(--radius); padding: 0.75rem; margin-top: 0.5rem; }
.confirm p { color: var(--ink); }
.hint { margin-top: 1rem; }
</style>
