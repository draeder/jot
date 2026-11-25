<template>
  <article class="legal">
    <a href="/" class="back" @click.prevent="$emit('back')">← Back to jot</a>

    <template v-if="page === 'privacy'">
      <h1>Privacy policy</h1>
      <p class="date">Effective November 2026</p>

      <h2>Your notes are yours</h2>
      <p>Jot is built so that nobody but you, and the people you share a workspace with, can read your notes: not us, and not the servers that keep them.</p>

      <h2>Where your notes are kept</h2>
      <ul>
        <li><b>In your browser</b> (IndexedDB): your workspaces, cards, lines and pictures, and your settings (zoom, grid and the like).</li>
        <li><b>On the PeerPigeon mesh’s storage servers:</b> each workspace is kept in a room of its own, sealed with a key made from that workspace’s secret. The servers keep only sealed records and hashes; they can’t read your notes, see their names, or tell whose they are. Pictures are kept the same way, in pieces each sealed with a key only your notes name.</li>
        <li><b>Signed in:</b> the list of your workspaces, with their secrets, is kept in a room of your account’s own, sealed with a key made from your account’s private key, and only your account can write to it.</li>
      </ul>

      <h2>Accounts</h2>
      <p>You don’t need one. An account (PigeonIdP, shared with PigeonChess, PigeonFeed and the PeerPigeon console) is a username, its public keys, and its private keys sealed with your password. That record is public, so the username can be looked up; the password never leaves your browser, and can’t be reset.</p>

      <h2>Sharing</h2>
      <p>A share link holds a workspace’s key after the “#”, which browsers don’t send to any server. Anyone who has the link can read the workspace (and, with an edit link, change it), so send it only to the people you mean it for. Its owner can make a new edit link, which stops the old one working.</p>

      <h2>What the network sees</h2>
      <p>To reach the mesh, your browser connects to PeerPigeon relays (freertc), to other browsers in the room, and to the storage servers. Like any connection, those see your IP address. None of them sees your notes.</p>

      <h2>What we don’t collect</h2>
      <ul>
        <li>No analytics, tracking, advertising or cookies.</li>
        <li>No email address or phone number.</li>
      </ul>
      <p>The site is served by Cloudflare, which may keep standard web server logs (such as IP addresses and request times) for security and operations.</p>

      <h2>Deleting</h2>
      <ul>
        <li>Deleting a workspace you own deletes its cards from the storage servers, your other devices, and the people it was shared with.</li>
        <li>Logging out removes your workspaces from that browser; they stay in your account.</li>
        <li>Clearing your browser’s data for jot.ooo removes everything jot keeps in it.</li>
        <li>An export gives you a copy of all your notes at any time.</li>
      </ul>

      <h2>Children</h2>
      <p>Jot does not knowingly collect personal information from children under 13; it collects none from anyone.</p>

      <h2>Changes</h2>
      <p>We may update this policy; changes are posted on this page with a new effective date.</p>
    </template>

    <template v-else>
      <h1>Terms of service</h1>
      <p class="date">Effective November 2026</p>

      <h2>1. Acceptance of terms</h2>
      <p>By using jot (“the Service”), you accept and agree to be bound by these terms.</p>

      <h2>2. Use license</h2>
      <p>You may use the Service to create, keep and share visual notes, for personal, educational or commercial purposes, with all of its features. This license ends if you break these terms.</p>

      <h2>3. Acceptable use</h2>
      <p>You agree not to use jot to:</p>
      <ul>
        <li>store or share illegal, harmful or offensive content;</li>
        <li>break any applicable local, state, national or international law;</li>
        <li>try to gain unauthorized access to the Service or related systems;</li>
        <li>interfere with or disrupt the Service, the mesh or the servers connected to it;</li>
        <li>harass, abuse or harm others.</li>
      </ul>

      <h2>4. Your content</h2>
      <p>You keep full ownership of everything you create in jot. As the privacy policy describes, your notes are kept in your browser and, sealed, on the PeerPigeon mesh’s storage servers; we can’t read them, and we can’t recover them for you if you lose your password or your links.</p>

      <h2>5. Availability</h2>
      <p>Jot is free. We try to keep it available, but don’t guarantee uninterrupted access, nor that the storage servers keep any record. Keep your own backups (an export) of anything you can’t lose.</p>

      <h2>6. Disclaimers</h2>
      <p>The Service is provided “as is”, without warranties of any kind, express or implied, about its accuracy, reliability, completeness or timeliness.</p>

      <h2>7. Limitation of liability</h2>
      <p>In no event shall jot or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use of, or inability to use, jot, even if told of the possibility of such damage.</p>

      <h2>8. Links</h2>
      <p>Jot may contain links to third-party sites or services. We are not responsible for their contents and do not endorse them.</p>

      <h2>9. Changes</h2>
      <p>We may revise these terms, and modify, suspend or discontinue any part of the Service, at any time. Using the Service means agreeing to the terms as they then are.</p>

      <h2>10. Governing law</h2>
      <p>These terms are governed by the laws of the jurisdiction where the Service is operated, and you submit to the exclusive jurisdiction of its courts.</p>
    </template>
  </article>
</template>

<script setup lang="ts">
defineProps<{ page: 'privacy' | 'terms' }>()
defineEmits<{ back: [] }>()
</script>

<style scoped>
.legal { max-width: 720px; margin: 0 auto; padding: 28px 24px 64px; overflow: auto; }
.back { display: inline-block; margin-bottom: 1.25rem; font-weight: 600; text-decoration: none; }
h1 { font-stretch: 112%; font-size: 1.8rem; font-weight: 800; letter-spacing: -0.02em; }
.date { color: var(--ink-2); margin: 0.25rem 0 1.5rem; }
h2 { font-size: 1.1rem; font-weight: 700; margin: 1.6rem 0 0.5rem; }
p, li { color: var(--ink-2); line-height: 1.6; }
p + p { margin-top: 0.6rem; }
ul { padding-left: 1.3rem; display: grid; gap: 0.4rem; margin: 0.4rem 0; }
b { color: var(--ink); }
</style>
