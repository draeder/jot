/**
 * A picture in a note, as the editor keeps it: <img data-ref="…" width="…">. The ref names the
 * picture's pieces on the storage servers (lib/media.ts); the note never holds the picture itself.
 * Shown from this browser's copy or the servers (lib/images.ts); its width set by dragging its corner.
 */
import { Node, mergeAttributes } from '@tiptap/core'
import { imageUrl } from './images'
import { parseRef } from './media'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    jotImage: { insertJotImage: (ref: string, width?: number) => ReturnType }
  }
}

export const JotImage = Node.create({
  name: 'jotImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      ref: { default: null, parseHTML: (el) => el.getAttribute('data-ref'), renderHTML: (a) => (a.ref ? { 'data-ref': a.ref } : {}) },
      width: {
        default: null,
        parseHTML: (el) => { const w = Number(el.getAttribute('width')); return Number.isFinite(w) && w > 20 ? Math.min(4000, Math.round(w)) : null },
        renderHTML: (a) => (a.width ? { width: a.width } : {}),
      },
    }
  },

  // Only pictures this app keeps: an <img src> from elsewhere (pasted from a page) is not taken.
  parseHTML() { return [{ tag: 'img[data-ref]' }] },
  renderHTML({ HTMLAttributes }) { return ['img', mergeAttributes(HTMLAttributes, { alt: '' })] },

  addCommands() {
    return {
      insertJotImage: (ref, width) => ({ commands }) => commands.insertContent({ type: this.name, attrs: { ref, width: width ?? null } }),
    }
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const wrap = document.createElement('div')
      wrap.className = 'jot-image'
      const img = document.createElement('img')
      img.alt = ''
      img.draggable = false
      const note = document.createElement('span')
      note.className = 'jot-image-note'
      const handle = document.createElement('span')
      handle.className = 'jot-image-handle'
      handle.title = 'Drag to resize'
      wrap.append(img, note, handle)

      const show = (n: typeof node) => {
        img.style.width = n.attrs.width ? `${n.attrs.width}px` : ''
        const ref = parseRef(n.attrs.ref)
        if (!ref) { note.textContent = 'This picture can’t be shown.'; return }
        if (ref.w && ref.h) img.style.aspectRatio = `${ref.w} / ${ref.h}`
        note.textContent = 'Loading picture…'
        imageUrl(ref).then((url) => { img.src = url; note.textContent = '' }, () => { note.textContent = 'This picture isn’t on the storage servers yet.' })
      }
      show(node)

      handle.addEventListener('pointerdown', (e) => {
        if (!editor.isEditable) return
        e.preventDefault()
        e.stopPropagation()
        const startX = e.clientX
        const startW = img.getBoundingClientRect().width
        const scale = startW / (img.offsetWidth || startW) || 1 // the canvas may be zoomed
        const move = (ev: PointerEvent) => { img.style.width = `${Math.max(40, Math.round(startW / scale + (ev.clientX - startX) / scale))}px` }
        const up = () => {
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', up)
          const pos = typeof getPos === 'function' ? getPos() : null
          if (typeof pos === 'number') editor.chain().command(({ tr }) => { tr.setNodeMarkup(pos, undefined, { ...node.attrs, width: parseInt(img.style.width, 10) }); return true }).run()
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
      })

      return {
        dom: wrap,
        update: (n) => { if (n.type.name !== 'jotImage') return false; node = n; show(n); return true },
      }
    }
  },
})
