<template>
  <div class="landing">
    <section class="hero">
      <div class="hero-text">
        <h1>Your ideas, laid out.</h1>
        <p class="lede">Notes on an infinite canvas: cards, pictures and the lines between them. On all your devices, shared live with whoever you give the link, sealed so only you and they can read them.</p>
        <div class="ctas">
          <button class="btn btn-go big" @click="$emit('start')">Start writing</button>
          <button class="btn big" @click="$emit('login')">Log in</button>
        </div>
        <p class="small">Free. No account needed to start.</p>
      </div>

      <!-- A workspace, drawn: what jot looks like. -->
      <div class="demo" aria-hidden="true">
        <svg class="demo-lines">
          <defs><marker id="lp-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" /></marker></defs>
          <line x1="42%" y1="22%" x2="58%" y2="22%" marker-end="url(#lp-arrow)" />
          <line x1="26%" y1="38%" x2="35.2%" y2="58%" marker-end="url(#lp-arrow)" />
        </svg>
        <div class="card" style="left: 4%; top: 6%; width: 38%; height: 32%">
          <header>Launch plan</header>
          <ul class="tasks">
            <li class="done"><i />Sketch the cards</li>
            <li class="done"><i />Share with the team</li>
            <li><i />Ship it</li>
          </ul>
        </div>
        <div class="card colored" style="left: 58%; top: 4%; width: 38%; height: 32%; background: #fff4b8">
          <header>Questions</header>
          <p>Which colour for the icon?</p>
          <p class="muted">Ask Sam on Friday</p>
        </div>
        <div class="card colored" style="left: 30%; top: 58%; width: 44%; height: 30%; background: #c8f0e1">
          <header>Notes from Tuesday</header>
          <p><b>Decided:</b> one canvas per project, lines for what depends on what.</p>
        </div>
      </div>
    </section>

    <section class="features" aria-labelledby="features-h">
      <h2 id="features-h">Everything on one canvas</h2>
      <div class="grid">
        <div v-for="f in features" :key="f.title" class="feature">
          <span class="icon"><Icon :name="f.icon" /></span>
          <h3>{{ f.title }}</h3>
          <p>{{ f.text }}</p>
        </div>
      </div>
    </section>

    <section class="steps" aria-labelledby="steps-h">
      <h2 id="steps-h">Start in seconds</h2>
      <ol>
        <li><span class="n">1</span><h3>Double-click</h3><p>Anywhere on the canvas, for a card. Give it a title and write.</p></li>
        <li><span class="n">2</span><h3>Lay it out</h3><p>Drag cards where they belong, colour them, and connect the ones that go together.</p></li>
        <li><span class="n">3</span><h3>Take it with you</h3><p>Log in on another device, or send a link to work on it together.</p></li>
      </ol>
      <button class="btn btn-go big" @click="$emit('start')">Start writing</button>
    </section>

    <section class="built">
      <p>No company server holds your notes. Jot runs peer to peer on <a href="https://peerpigeon.io">PeerPigeon</a>: your devices talk to each other, and storage servers anyone can run keep sealed copies they can't read.</p>
    </section>

    <footer class="foot">
      <span>Jot</span>
      <a href="/privacy" @click.prevent="$emit('go', 'privacy')">Privacy</a>
      <a href="/terms" @click.prevent="$emit('go', 'terms')">Terms</a>
      <a href="https://peer.ooo">peer.ooo</a>
      <a href="https://github.com/draeder/jot">GitHub</a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import Icon from './Icon.vue'

defineEmits<{ start: []; login: []; go: ['privacy' | 'terms'] }>()

const features = [
  { icon: 'fit', title: 'An infinite canvas', text: 'Pan and zoom without edges. Every workspace keeps its own view.' },
  { icon: 'plus', title: 'Rich notes', text: 'Headings, lists, checklists, code with highlighting, and pictures dropped straight in.' },
  { icon: 'connect', title: 'Lines between cards', text: 'Arrows and lines for what leads to what: plans, maps, flows.' },
  { icon: 'sidebar', title: 'On all your devices', text: 'Log in and your workspaces are there, kept in step as you write.' },
  { icon: 'share', title: 'Shared live', text: 'Send an edit link to work on it together, or publish a read-only copy.' },
  { icon: 'eye', title: 'Sealed', text: 'Only you, and the people you share with, can read your notes. Not us, not the servers.' },
] as const
</script>

<style scoped>
.landing { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
h1, h2, h3 { font-stretch: 112%; color: var(--ink); }

.hero { display: grid; grid-template-columns: 1fr 1.1fr; gap: 48px; align-items: center; padding: 72px 0 64px; }
h1 { font-size: clamp(2.4rem, 5vw, 3.6rem); font-weight: 800; letter-spacing: -0.02em; line-height: 1.05; margin: 0 0 18px; }
.lede { font-size: 1.15rem; line-height: 1.55; color: var(--ink-2); margin: 0 0 28px; max-width: 34rem; }
.ctas { display: flex; gap: 12px; flex-wrap: wrap; }
.big { padding: 0.7rem 1.4rem; font-size: 1rem; }
.small { margin-top: 14px; font-size: 0.9rem; color: var(--ink-2); }

.demo { container-type: inline-size; position: relative; aspect-ratio: 13 / 10; border: 1px solid var(--line); border-radius: 12px; background-color: var(--paper); background-image: radial-gradient(circle, var(--line-strong) 1px, transparent 1.2px); background-size: 24px 24px; box-shadow: 0 18px 40px rgba(28, 33, 38, 0.12); overflow: hidden; }
.demo-lines { position: absolute; inset: 0; width: 100%; height: 100%; }
.demo-lines line { stroke: var(--slate); stroke-width: 2; }
.demo-lines path { fill: var(--slate); }
.card { position: absolute; background: var(--surface); border: 1px solid var(--line-strong); border-radius: 0.8em; box-shadow: 0 4px 14px rgba(28, 33, 38, 0.1); font-size: 2.1cqw; color: var(--ink); overflow: hidden; }
/* Each card has a set size (not its text's), so the lines meet its edges at any width. */
.card.colored { color: #2a3747; }
/* The drawing scales as a whole (its text with it), so it reads the same on a phone. */
.card header { font-weight: 700; padding: 0.6em 0.9em; border-bottom: 1px solid rgba(42, 55, 71, 0.15); }
.card p { margin: 0.6em 0.9em; line-height: 1.4; }
.card .muted { color: #5a7187; }
.card header { border-bottom-color: var(--line); }
.card.colored header { border-bottom-color: rgba(42, 55, 71, 0.15); }
.tasks { list-style: none; margin: 0.6em 0.9em; padding: 0; display: grid; gap: 0.4em; }
.tasks li { display: flex; align-items: center; gap: 0.55em; }
.tasks i { width: 0.95em; height: 0.95em; border: 1.5px solid var(--slate); border-radius: 3px; flex: none; }
.tasks .done { text-decoration: line-through; opacity: 0.65; }
.tasks .done i { background: #237a50; border-color: #237a50; }

h2 { font-size: 1.9rem; font-weight: 700; margin: 0 0 28px; }
.features { padding: 40px 0 24px; }
.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.feature { padding: 22px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
.feature h3 { font-size: 1.1rem; margin: 12px 0 6px; }
.feature p { margin: 0; color: var(--ink-2); line-height: 1.5; }
.icon { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 8px; background: var(--sheen-wash); color: var(--sheen); }

.steps { padding: 48px 0; }
.steps ol { list-style: none; margin: 0 0 28px; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.steps li { padding: 4px 0; }
.n { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: var(--sheen); color: var(--on-sheen); font-weight: 700; }
.steps h3 { font-size: 1.1rem; margin: 12px 0 6px; }
.steps p { margin: 0; color: var(--ink-2); line-height: 1.5; }

.built { padding: 24px 28px; margin: 8px 0 40px; border-radius: 10px; background: var(--wing); }
.built p { margin: 0; line-height: 1.6; color: var(--ink); }
.built a { color: var(--sheen); font-weight: 600; }

.foot { display: flex; gap: 18px; flex-wrap: wrap; padding: 20px 0 32px; border-top: 1px solid var(--line); color: var(--ink-2); font-size: 0.9rem; }
.foot span { font-weight: 700; color: var(--ink); margin-right: auto; }
.foot a { color: inherit; }

@media (max-width: 860px) {
  .hero { grid-template-columns: 1fr; padding: 40px 0 32px; gap: 32px; }
  .grid, .steps ol { grid-template-columns: 1fr; }
}
</style>
