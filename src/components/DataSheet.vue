<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="data-title">
      <h3 id="data-title">Export and import</h3>
      <section>
        <h4>Export</h4>
        <p>Every workspace you have (but those shared with you to read), with its cards and lines, in one file. Pictures stay on the storage servers: the file names them.</p>
        <div class="row end"><button class="btn btn-go" :disabled="busy" @click="doExport">Download the export</button></div>
      </section>
      <section>
        <h4>Import</h4>
        <p>A jot export, from this jot or the first one. A workspace you already have gets the cards it doesn’t have (and newer ones); any other is added as a new workspace. Nothing you have is deleted.</p>
        <div class="row end">
          <label class="btn" :class="{ disabled: busy }">
            Choose a file…
            <input type="file" accept="application/json,.json" hidden :disabled="busy" @change="doImport" />
          </label>
        </div>
        <p v-if="done" class="ok" role="status">{{ done }}</p>
        <p v-if="error" class="alert" role="alert">{{ error }}</p>
      </section>
      <div class="modal-buttons"><button class="btn" @click="$emit('close')">Done</button></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { exportAll, importFile } from '@/composables/useJot'
import { exportFile } from '@/lib/model'

defineEmits<{ close: [] }>()
const busy = ref(false)
const done = ref('')
const error = ref('')

async function doExport(): Promise<void> {
  busy.value = true
  try {
    const { workspaces, cards, links } = await exportAll()
    const ids = new Set(workspaces.map((w) => w.id))
    const file = exportFile(workspaces, cards.filter((c) => ids.has(c.ws)), links.filter((l) => ids.has(l.ws)))
    const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `jot-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } finally { busy.value = false }
}

async function doImport(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  busy.value = true
  done.value = error.value = ''
  try {
    const got = await importFile(await file.text())
    done.value = `Imported ${got.cards} ${got.cards === 1 ? 'card' : 'cards'}${got.workspaces ? `, in ${got.workspaces} new ${got.workspaces === 1 ? 'workspace' : 'workspaces'}` : ''}.`
  } catch (err) { error.value = (err as Error).message } finally { busy.value = false }
}
</script>

<style scoped>
section { border-top: 1px solid var(--line); padding-top: 0.9rem; margin-top: 0.9rem; }
h4 { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.35rem; }
.modal section p { margin-bottom: 0.6rem; }
.row.end { justify-content: flex-end; }
label.btn { cursor: pointer; }
label.btn.disabled { opacity: 0.45; pointer-events: none; }
.ok { color: var(--sheen); font-weight: 600; margin-top: 0.6rem; }
</style>
