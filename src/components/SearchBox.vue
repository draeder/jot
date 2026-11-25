<template>
  <div class="search" :class="{ open: showing }">
    <label class="box">
      <Icon name="search" />
      <input
        ref="input" v-model="query" type="search" placeholder="Search all workspaces" aria-label="Search all workspaces"
        role="combobox" :aria-expanded="showing" aria-controls="search-results" :aria-activedescendant="showing && hits[active] ? `hit-${active}` : undefined"
        @focus="refresh" @input="refresh" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter.prevent="choose(hits[active])" @keydown.esc="close"
      />
    </label>
    <ul v-if="showing" id="search-results" class="results" role="listbox">
      <li v-if="!hits.length" class="none">No card has “{{ query.trim() }}”.</li>
      <li v-for="(h, i) in hits" :id="`hit-${i}`" :key="h.card.id" role="option" :aria-selected="i === active" class="hit" :class="{ on: i === active }" @pointerdown.prevent="choose(h)" @mousemove="active = i">
        <span class="hit-title">{{ h.card.title || 'Untitled' }}</span>
        <span class="hit-ws">{{ nameOf(h.card.ws) }}</span>
        <span v-if="h.snippet" class="hit-snippet">{{ h.snippet }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from './Icon.vue'
import { useJot } from '@/composables/useJot'
import { local } from '@/lib/local'
import { search, type Card, type Hit } from '@/lib/model'

const emit = defineEmits<{ pick: [ws: string, card: string] }>()
const { workspaces } = useJot()
const query = ref('')
const all = ref<Card[]>([])
const active = ref(0)
const input = ref<HTMLInputElement | null>(null)
const focused = ref(false)

const hits = computed<Hit[]>(() => search(all.value, query.value, 20))
const showing = computed(() => focused.value && query.value.trim().length > 0)
const nameOf = (id: string) => workspaces.value.find((w) => w.id === id)?.name ?? ''

async function refresh(): Promise<void> {
  focused.value = true
  active.value = 0
  const ids = new Set(workspaces.value.map((w) => w.id))
  all.value = (await local.cards()).filter((c) => ids.has(c.ws))
}
const move = (d: number) => { if (hits.value.length) active.value = (active.value + d + hits.value.length) % hits.value.length }
function choose(h: Hit | undefined): void {
  if (!h) return
  emit('pick', h.card.ws, h.card.id)
  close()
}
function close(): void { focused.value = false; query.value = ''; input.value?.blur() }
</script>

<style scoped>
.search { position: relative; flex: 1; max-width: 420px; min-width: 0; }
.box { display: flex; align-items: center; gap: 0.45rem; padding: 0 0.7rem; height: 36px; border: 1px solid var(--line-strong); border-radius: var(--radius); background: var(--surface); color: var(--ink-2); }
.box:focus-within { border-color: var(--sheen); box-shadow: 0 0 0 2px var(--sheen-wash); }
.box input { border: 0; background: none; padding: 0; height: 100%; box-shadow: none; min-width: 0; }
.box input:focus { box-shadow: none; }
.results { position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 50; list-style: none; max-height: min(60vh, 460px); overflow: auto; background: var(--surface); border: 1px solid var(--line-strong); border-radius: 10px; box-shadow: 0 12px 32px rgba(28, 33, 38, 0.18); padding: 4px; }
.hit { display: grid; grid-template-columns: 1fr auto; gap: 0.1rem 0.6rem; padding: 0.5rem 0.65rem; border-radius: var(--radius); cursor: pointer; }
.hit.on { background: var(--wing); }
.hit-title { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hit-ws { font-size: 0.75rem; color: var(--ink-2); white-space: nowrap; }
.hit-snippet { grid-column: 1 / -1; font-size: 0.82rem; color: var(--ink-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.none { padding: 0.6rem 0.7rem; color: var(--ink-2); font-size: 0.875rem; }
</style>
