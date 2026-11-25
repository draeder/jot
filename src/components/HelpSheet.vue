<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal wide" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <h3 id="help-title">How jot works</h3>

      <h4>Cards</h4>
      <ul>
        <li><b>New card:</b> the <b>Card</b> button, or double-click anywhere on the canvas.</li>
        <li><b>Write:</b> click a card’s note. The bar above it formats; paste or drop a picture to add it.</li>
        <li><b>Rename:</b> double-click a card’s title. <b>Move:</b> drag its title bar. <b>Resize:</b> drag its corner.</li>
        <li><b>Colour</b> and <b>delete:</b> the buttons on its title bar.</li>
        <li><b>Connect:</b> <b>Connect</b>, then pick two cards. Click a line to make it an arrow or a plain line, turn it around, or delete it.</li>
      </ul>

      <h4>The canvas</h4>
      <ul>
        <li><b>Move around:</b> drag the canvas, or scroll. <b>Zoom:</b> pinch, <kbd>Ctrl</kbd>/<kbd>⌘</kbd> and scroll, or the buttons.</li>
        <li>The arrows at the edges go to cards out of view; <b>Show every card</b> fits them all.</li>
        <li>The grid can be dots, lines or none, and cards can snap to it.</li>
      </ul>

      <h4>Keys</h4>
      <ul class="keys">
        <li><kbd>⌘</kbd>/<kbd>Ctrl</kbd> <kbd>Z</kbd> undo, with <kbd>Shift</kbd> redo</li>
        <li><kbd>Delete</kbd> deletes the card or line picked</li>
        <li><kbd>Esc</kbd> stops writing, connecting or picking</li>
      </ul>

      <h4>Where your notes are</h4>
      <p>In this browser, and on the PeerPigeon mesh’s storage servers, sealed: each workspace has a key of its own, and the servers keep only what they can’t read. Log in, with the same account as PigeonChess and PigeonFeed, to have your workspaces on all your devices.</p>
      <p><b>Share</b> gives a link to edit a workspace together (live), or publishes a read-only copy. The key is in the link, after the “#”.</p>

      <div class="modal-buttons"><button class="btn" @click="$emit('close')">Close</button></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ close: [] }>()
</script>

<style scoped>
.wide { width: min(100%, 640px); }
h4 { font-size: 0.95rem; font-weight: 700; margin: 1rem 0 0.4rem; }
ul { padding-left: 1.2rem; color: var(--ink-2); display: grid; gap: 0.3rem; font-size: 0.92rem; }
ul b { color: var(--ink); }
.keys { list-style: none; padding-left: 0; }
</style>
