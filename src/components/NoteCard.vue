<template>
  <div
    class="note-card" :data-card-id="card.id"
    :class="{ selected, editing, linking, ink: ink === 'light', colored: !!card.color }"
    :style="{ left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`, background: card.color || undefined }"
    @pointerdown="$emit('press', $event)"
  >
    <header class="card-head" @pointerdown="startMove">
      <!-- The box is as wide as what is in it: a hidden copy of the text sizes it. -->
      <span v-if="naming" class="title-fit" :data-text="title">
        <input
          ref="titleInput" v-model="title" class="title-input" size="1" :maxlength="MAX_TITLE" aria-label="Card title"
          @keydown.enter.prevent="saveTitle" @keydown.esc.prevent="naming = false" @blur="saveTitle" @pointerdown.stop
        />
      </span>
      <h3 v-else class="title" :class="{ renamable: canEdit }" :title="canEdit ? 'Click to rename' : undefined" @pointerdown="titlePress = [$event.clientX, $event.clientY]" @click="onTitleClick" @dblclick.stop>{{ card.title || 'Untitled' }}</h3>
      <div v-if="canEdit" class="head-tools" @pointerdown.stop>
        <button class="tool" title="Card colour" aria-label="Card colour" :aria-expanded="picking" @click="picking = !picking"><Icon name="palette" /></button>
        <button class="tool" title="Delete card" aria-label="Delete card" @click="$emit('delete')"><Icon name="trash" /></button>
      </div>
      <div v-if="picking" class="swatches" role="dialog" aria-label="Card colour" @pointerdown.stop>
        <button class="swatch none" :class="{ on: !card.color }" title="No colour" aria-label="No colour" @click="setColor(undefined)" />
        <button v-for="c in COLORS" :key="c" class="swatch" :class="{ on: card.color === c }" :style="{ background: c }" :title="c" :aria-label="c" @click="setColor(c)" />
        <label class="swatch custom" title="Any colour" aria-label="Any colour">
          <input type="color" :value="card.color || '#ffffff'" @change="setColor(($event.target as HTMLInputElement).value)" />
        </label>
      </div>
    </header>

    <div v-if="editing && editor" class="format" role="toolbar" aria-label="Formatting" @pointerdown.stop @mousedown.prevent>
      <button v-for="b in buttons" :key="b.label" class="fmt" :class="{ on: b.on?.() }" :title="b.label" :aria-label="b.label" :aria-pressed="b.on ? !!b.on() : undefined" @click="b.run()" v-html="b.face" />
      <span v-if="uploading" class="fmt-note">Adding picture…</span>
    </div>

    <div class="card-body note" @pointerdown.stop="onBodyPress" @dblclick.stop>
      <EditorContent :editor="editor" />
    </div>
    <p v-if="error" class="card-error" role="alert">{{ error }}</p>

    <span v-if="canEdit" class="resize" title="Drag to resize" aria-hidden="true" @pointerdown.stop="startResize" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { Placeholder } from '@tiptap/extensions'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { Selection, TextSelection } from '@tiptap/pm/state'
import Icon from './Icon.vue'
import { JotImage } from '@/lib/jot-image'
import { addImage } from '@/lib/images'
import { MAX_CONTENT, MAX_TITLE, inkOn, type Card } from '@/lib/model'

const props = defineProps<{
  card: Card
  /** Where it is drawn now (moved or resized while dragging). */
  x: number; y: number; w: number; h: number
  selected: boolean
  linking: boolean
  canEdit: boolean
  zoom: number
}>()
const emit = defineEmits<{
  press: [PointerEvent]
  move: [PointerEvent]
  resize: [PointerEvent]
  delete: []
  change: [Partial<Card>]
  editing: [boolean]
}>()

const COLORS = ['#fff4b8', '#ffd9b3', '#ffc9c9', '#f3d1f0', '#d6d8ff', '#c9e6ff', '#c8f0e1', '#dff3c4', '#2a3747', '#5a7187']
const lowlight = createLowlight(common)

const ink = computed(() => (props.card.color ? inkOn(props.card.color) : 'dark'))
const editing = ref(false)
const naming = ref(false)
const picking = ref(false)
const title = ref(props.card.title)
const titleInput = ref<HTMLInputElement | null>(null)
const error = ref('')
const uploading = ref(false)

const startMove = (e: PointerEvent) => { if (!naming.value) emit('move', e) }
const startResize = (e: PointerEvent) => emit('resize', e)

// A click on the title renames the card; a drag on it (the title bar) moves the card instead.
const titlePress = ref<[number, number] | null>(null)
const onTitleClick = (e: MouseEvent) => {
  const p = titlePress.value
  titlePress.value = null
  if (p && Math.hypot(e.clientX - p[0], e.clientY - p[1]) < 4 && !props.linking) void startNaming()
}

const startNaming = async () => {
  if (!props.canEdit) return
  title.value = props.card.title
  naming.value = true
  await nextTick()
  titleInput.value?.select()
}
const saveTitle = () => {
  if (!naming.value) return
  naming.value = false
  const t = title.value.trim().slice(0, MAX_TITLE)
  if (t !== props.card.title) emit('change', { title: t })
}
const setColor = (c: string | undefined) => { picking.value = false; emit('change', { color: c?.toLowerCase() }) }

// ---------- the note

let saveTimer: ReturnType<typeof setTimeout> | null = null
let written: string | null = null
const saveNow = () => {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
  // The note as last written (the editor may be gone by now: a card closing as it is deleted).
  const html = written ?? props.card.content
  const content = html === '<p></p>' ? '' : html
  if (content === props.card.content) return
  if (content.length > MAX_CONTENT) { error.value = 'This note is too long to keep: make it shorter, or split it into another card.'; return }
  error.value = ''
  emit('change', { content })
}
// Written as it is typed (a moment after each pause), so the people it is shared with see it.
const saveSoon = () => { if (saveTimer) clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 700) }

const insertFiles = (files: File[]): boolean => {
  const pictures = files.filter((f) => f.type.startsWith('image/'))
  if (!pictures.length || !props.canEdit) return false
  void (async () => {
    uploading.value = true
    error.value = ''
    try {
      for (const f of pictures) {
        const ref = await addImage(f)
        editor.value?.chain().focus().insertJotImage(JSON.stringify(ref)).run()
      }
    } catch (e) { error.value = (e as Error).message } finally { uploading.value = false }
  })()
  return true
}

const editor = useEditor({
  content: props.card.content,
  editable: false,
  extensions: [
    StarterKit.configure({ codeBlock: false, link: { openOnClick: false, autolink: true, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow' } } }),
    CodeBlockLowlight.configure({ lowlight }),
    TaskList,
    // A box can be ticked without opening the note (and in a workspace that can't be edited, not at all).
    TaskItem.configure({ nested: true, onReadOnlyChecked: () => props.canEdit }),
    // Shown on an empty note whether or not it is open: added only on opening, it redraws the line the
    // caret has just gone to, and the caret is lost.
    Placeholder.configure({ placeholder: 'Write your note…', showOnlyWhenEditable: false, showOnlyCurrent: false }),
    JotImage,
  ],
  editorProps: {
    handlePaste: (_view, event) => insertFiles([...(event.clipboardData?.files ?? [])]),
    handleDrop: (_view, event) => insertFiles([...((event as DragEvent).dataTransfer?.files ?? [])]),
  },
  onUpdate: ({ editor: e }) => { written = e.getHTML(); if (editing.value) saveSoon(); else saveNow() },
})

// A change made elsewhere (another device, someone it is shared with): shown, unless it is being written here.
watch(() => props.card.content, (content) => {
  const e = editor.value
  if (!e || editing.value) return
  if (e.getHTML() !== content && !(content === '' && e.isEmpty)) { e.commands.setContent(content, { emitUpdate: false }); written = null }
})
watch(() => props.card.title, (t) => { if (!naming.value) title.value = t })

const onBodyPress = (e: PointerEvent) => {
  emit('press', e)
  // A link or a box in a note does its own thing.
  if ((e.target as HTMLElement).closest('a, input[type="checkbox"]')) return
  if (props.canEdit && !props.linking && !editing.value) startEditing(e)
}

/**
 * Writing in the note: it can be edited from the press on (so the click that follows puts the caret
 * where it lands, and nothing typed right after is lost).
 */
function startEditing(press?: PointerEvent): void {
  const e = editor.value
  if (!e) return
  // Where the press was, in the note (before the formatting bar opens and moves it down): the caret goes
  // there, or at the end when it was below the words.
  const at = press ? e.view.posAtCoords({ left: press.clientX, top: press.clientY }) : null
  const inWords = !!at && !!(press!.target as HTMLElement).closest('.ProseMirror p, .ProseMirror li, .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror pre, .ProseMirror blockquote')
  // At once (the editor's own focus command waits a frame, and what is typed in that frame is lost).
  const place = () => {
    const { state } = e.view
    e.view.dispatch(state.tr.setSelection(inWords ? TextSelection.near(state.doc.resolve(Math.min(at!.pos, state.doc.content.size))) : Selection.atEnd(state.doc)))
    e.view.focus()
  }
  editing.value = true
  emit('editing', true)
  e.setEditable(true, false)
  place()
  // The browser's own handling of the press (its target may be redrawn as the note opens) can take the
  // focus away again: given back when the press ends.
  if (press) window.addEventListener('pointerup', () => { if (editing.value && !e.isFocused) place() }, { once: true })
}

/** Done writing (a click elsewhere, Escape): what was written is kept. */
function stopEditing(): void {
  if (!editing.value) return
  saveNow()
  editing.value = false
  editor.value?.setEditable(false, false)
  emit('editing', false)
  // What arrived from elsewhere while writing here is not shown: what was written here is newer, and stands.
}
watch(() => props.selected, (on) => { if (!on) { stopEditing(); picking.value = false } })
watch(() => props.canEdit, (can) => { if (!can) stopEditing() })
defineExpose({ stopEditing, startEditing })

// What was being written is kept (useEditor destroys the editor itself).
onBeforeUnmount(() => { if (editing.value) saveNow() })

// ---------- the formatting buttons

const pickImage = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  input.onchange = () => insertFiles([...(input.files ?? [])])
  input.click()
}

const chain = () => editor.value!.chain().focus()
const buttons = computed(() => {
  const e = editor.value
  if (!e) return []
  return [
    { label: 'Bold', face: '<b>B</b>', on: () => e.isActive('bold'), run: () => chain().toggleBold().run() },
    { label: 'Italic', face: '<i>I</i>', on: () => e.isActive('italic'), run: () => chain().toggleItalic().run() },
    { label: 'Strikethrough', face: '<s>S</s>', on: () => e.isActive('strike'), run: () => chain().toggleStrike().run() },
    { label: 'Heading', face: 'H', on: () => e.isActive('heading'), run: () => chain().toggleHeading({ level: 2 }).run() },
    { label: 'Inline code', face: '<code>&lt;/&gt;</code>', on: () => e.isActive('code'), run: () => chain().toggleCode().run() },
    { label: 'Code block', face: '<code>{ }</code>', on: () => e.isActive('codeBlock'), run: () => chain().toggleCodeBlock().run() },
    { label: 'Bullet list', face: '•&#8202;—', on: () => e.isActive('bulletList'), run: () => chain().toggleBulletList().run() },
    { label: 'Numbered list', face: '1.', on: () => e.isActive('orderedList'), run: () => chain().toggleOrderedList().run() },
    { label: 'Checklist', face: '☑', on: () => e.isActive('taskList'), run: () => chain().toggleTaskList().run() },
    { label: 'Quote', face: '❝', on: () => e.isActive('blockquote'), run: () => chain().toggleBlockquote().run() },
    { label: 'Picture', face: '<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15 9h.01"/></svg>', run: pickImage },
    { label: 'Undo', face: '↶', run: () => chain().undo().run() },
    { label: 'Redo', face: '↷', run: () => chain().redo().run() },
  ]
})
</script>

<style scoped>
.note-card {
  position: absolute; display: flex; flex-direction: column;
  background: var(--surface); color: var(--ink);
  border: 1px solid var(--line-strong); border-radius: 10px;
  box-shadow: 0 1px 2px rgba(28, 33, 38, 0.08), 0 4px 14px rgba(28, 33, 38, 0.06);
}
.note-card.colored { color: #1e2a37; border-color: rgba(0, 0, 0, 0.18); }
.note-card.colored.ink { color: #f5fbfc; }
.note-card.selected { border-color: var(--sheen); box-shadow: 0 0 0 2px var(--sheen), 0 6px 20px rgba(28, 33, 38, 0.14); z-index: 2; }
.note-card.editing { z-index: 3; }
.note-card.linking { cursor: crosshair; }
.note-card.linking:hover { box-shadow: 0 0 0 3px var(--sheen-wash), 0 0 0 4px var(--sheen); }

.card-head { position: relative; display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.5rem 0.45rem 0.85rem; border-bottom: 1px solid rgba(127, 127, 127, 0.22); cursor: grab; touch-action: none; }
.note-card.linking .card-head { cursor: crosshair; }
.title.renamable { cursor: text; }
.title { flex: 0 1 auto; min-width: 0; line-height: 1.4; padding: 1px 5px; border: 1px solid transparent; margin-left: -6px; font-size: 0.95rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.title-fit { flex: 0 1 auto; min-width: 0; max-width: calc(100% + 6px); display: inline-grid; margin-left: -6px; }
.title-fit::after { content: attr(data-text) ' '; visibility: hidden; white-space: pre; overflow: hidden; }
.title-fit::after, .title-input { grid-area: 1 / 1; font: inherit; font-size: 0.95rem; font-weight: 700; line-height: 1.4; padding: 1px 5px; border: 1px solid transparent; border-radius: 4px; min-width: 2ch; }
.title-input { width: 100%; border-color: var(--sheen); }
.head-tools { margin-left: auto; display: flex; gap: 0.1rem; opacity: 0; transition: opacity 0.12s; }
.note-card:hover .head-tools, .note-card.selected .head-tools, .head-tools:focus-within { opacity: 1; }
.tool { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--radius); color: inherit; opacity: 0.75; }
.tool:hover { opacity: 1; background: rgba(127, 127, 127, 0.16); }

.swatches { position: absolute; top: calc(100% + 4px); right: 0.4rem; z-index: 5; display: grid; grid-template-columns: repeat(6, 26px); gap: 6px; padding: 8px; background: var(--surface); border: 1px solid var(--line-strong); border-radius: 8px; box-shadow: 0 8px 24px rgba(28, 33, 38, 0.18); }
.swatch { width: 26px; height: 26px; border-radius: 50%; border: 1px solid rgba(0, 0, 0, 0.18); position: relative; overflow: hidden; }
.swatch.on { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--sheen); }
.swatch.none { background: linear-gradient(135deg, var(--surface) 45%, var(--stop) 46%, var(--stop) 54%, var(--surface) 55%); }
.swatch.custom { background: conic-gradient(#f29b91, #f2c879, #7fd8a6, #9cc3f5, #c9a4f0, #f29b91); cursor: pointer; }
.swatch.custom input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; padding: 0; border: 0; }

.format { display: flex; flex-wrap: wrap; gap: 2px; padding: 4px 6px; border-bottom: 1px solid rgba(127, 127, 127, 0.22); }
.fmt { min-width: 28px; height: 28px; padding: 0 6px; border-radius: 5px; font-size: 0.85rem; display: grid; place-items: center; color: inherit; }
.fmt:hover { background: rgba(127, 127, 127, 0.16); }
.fmt.on { background: rgba(127, 127, 127, 0.28); }
.fmt :deep(svg) { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.fmt :deep(code) { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.75rem; font-weight: 700; }
.fmt-note { font-size: 0.75rem; align-self: center; padding: 0 0.4rem; opacity: 0.8; }

.card-body { flex: 1; min-height: 0; overflow: auto; padding: 0.7rem 0.9rem 1rem; cursor: text; }
.note-card.linking .card-body { cursor: crosshair; }
.card-body :deep(.ProseMirror) { min-height: 100%; }
.card-body :deep(.ProseMirror[contenteditable='false']) { cursor: default; }
.card-error { font-size: 0.78rem; color: var(--stop); padding: 0.3rem 0.8rem; background: var(--stop-wash); }

.resize { position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; cursor: nwse-resize; touch-action: none; background: linear-gradient(135deg, transparent 55%, currentColor 56%, currentColor 62%, transparent 63%, transparent 72%, currentColor 73%, currentColor 79%, transparent 80%); opacity: 0.35; border-bottom-right-radius: 10px; }
.resize:hover { opacity: 0.7; }

.card-body :deep(.jot-image) { position: relative; display: inline-block; max-width: 100%; }
.card-body :deep(.jot-image img) { min-height: 24px; background: rgba(127, 127, 127, 0.12); }
.card-body :deep(.jot-image-note) { position: absolute; left: 0.5rem; top: 0.4rem; font-size: 0.75rem; opacity: 0.75; }
.card-body :deep(.jot-image-handle) { display: none; position: absolute; right: -4px; bottom: -4px; width: 12px; height: 12px; border-radius: 3px; background: var(--sheen); border: 2px solid var(--surface); cursor: nwse-resize; }
.note-card.editing .card-body :deep(.jot-image:hover .jot-image-handle), .note-card.editing .card-body :deep(.ProseMirror-selectednode .jot-image-handle) { display: block; }
.card-body :deep(.ProseMirror-selectednode img) { outline: 2px solid var(--sheen); }
</style>
