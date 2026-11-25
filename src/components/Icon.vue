<template>
  <svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path :d="paths[name]" /></svg>
</template>

<script setup lang="ts">
// Line icons, drawn on a 24 grid with a 1.8 stroke (as the theme switch is).
defineProps<{ name: keyof typeof paths }>()
</script>

<script lang="ts">
const paths = {
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  connect: 'M5 7a2 2 0 1 0 0-.01M19 17a2 2 0 1 0 0-.01M6.5 8.5l11 7',
  trash: 'M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5',
  undo: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  redo: 'M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
  grid: 'M4 4h16v16H4zM4 9.33h16M4 14.67h16M9.33 4v16M14.67 4v16',
  dots: 'M6 6h.01M12 6h.01M18 6h.01M6 12h.01M12 12h.01M18 12h.01M6 18h.01M12 18h.01M18 18h.01',
  magnet: 'M6 4v8a6 6 0 0 0 12 0V4M6 4h4v8a2 2 0 0 0 4 0V4h4M6 8h4M14 8h4',
  fit: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
  share: 'M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5L20 20',
  close: 'M6 6l12 12M18 6L6 18',
  palette: 'M12 3a9 9 0 0 0 0 18c1.4 0 2-1 2-2 0-1.5-1-1.8-1-3s1-2 2.5-2H18a3 3 0 0 0 3-3c0-4.4-4-8-9-8zM7.5 11h.01M10 7h.01M14.5 7h.01',
  drag: 'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15 9h.01',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  link: 'M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1',
  menu: 'M4 7h16M4 12h16M4 17h16',
  sidebar: 'M4 4h16v16H4zM9 4v16',
  arrow: 'M4 12h15M14 7l5 5-5 5',
  line: 'M4 12h16',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01',
  data: 'M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14',
  check: 'M5 12.5l4.5 4.5L19 7',
} as const
</script>

<style scoped>
.icon { width: 18px; height: 18px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
</style>
