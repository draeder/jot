<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="account-title">
      <!-- Signed in -->
      <template v-if="account">
        <h3 id="account-title">{{ account.alias }}</h3>
        <p>You are signed in. Your workspaces are on every device you log in on, kept on the storage servers sealed with keys only you (and those you share them with) have.</p>
        <p v-if="leaving && waiting" class="alert" role="alert">
          {{ waiting }} {{ waiting === 1 ? 'change hasn’t' : 'changes haven’t' }} reached the storage servers yet. Logging out now removes {{ waiting === 1 ? 'it' : 'them' }} from this browser for good.
        </p>
        <p v-else-if="leaving">Logging out removes your workspaces from this browser. They stay in your account.</p>
        <div class="modal-buttons">
          <button class="btn" @click="$emit('close')">Close</button>
          <button v-if="!leaving" class="btn btn-stop" @click="askOut">Log out</button>
          <button v-else class="btn btn-stop" :disabled="busy" @click="out">{{ waiting ? 'Log out anyway' : 'Log out' }}</button>
        </div>
      </template>

      <template v-else-if="mode === 'about'">
        <h3 id="account-title">Your notes</h3>
        <p>No account is needed: your workspaces are kept in this browser, and on the storage servers sealed with keys only this browser has (and those you share them with).</p>
        <p>Log in to have them on all your devices. Your PigeonChess, PigeonFeed or PeerPigeon console account works here.</p>
        <div class="modal-buttons">
          <button class="btn" @click="$emit('close')">Close</button>
          <button class="btn" @click="mode = 'register'">Create an account</button>
          <button class="btn btn-go" @click="mode = 'login'">Log in</button>
        </div>
      </template>

      <template v-else>
        <h3 id="account-title">{{ mode === 'login' ? 'Log in' : 'Create an account' }}</h3>
        <p>{{ mode === 'login'
          ? 'The same account as on PigeonChess, PigeonFeed and the PeerPigeon console. The workspaces in this browser join it.'
          : 'Pick a name, and a password to protect it. The workspaces in this browser join your account.' }}</p>
        <label class="field"><span>Username</span><input v-model="username" type="text" autocomplete="username" @keyup.enter="submit" /></label>
        <label class="field"><span>Password</span><input v-model="password" type="password" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" @keyup.enter="submit" /></label>
        <template v-if="mode === 'register'">
          <ul class="rules">
            <li :class="{ met: password.length >= 12 }">12 or more characters</li>
            <li :class="{ met: /[A-Z]/.test(password) && /[a-z]/.test(password) }">Upper and lower case letters</li>
            <li :class="{ met: /\d/.test(password) }">A number</li>
          </ul>
          <p class="hint">Save this password somewhere safe, such as a password manager. You need it, with this username, to log in again, and it cannot be reset.</p>
        </template>
        <p v-if="!connected" class="hint">Connecting to the mesh…</p>
        <p v-if="error" class="alert" role="alert">{{ error }}</p>
        <div class="modal-buttons">
          <button class="btn" @click="mode = 'about'; error = ''">Back</button>
          <button class="btn btn-go" :disabled="busy || !connected || !username.trim() || !password || (mode === 'register' && !strong)" @click="submit">
            {{ busy ? 'Checking' : (mode === 'login' ? 'Log in' : 'Create account') }}
          </button>
        </div>
        <p class="foot">
          {{ mode === 'login' ? 'New here?' : 'Already have an account?' }}
          <a href="#" @click.prevent="mode = mode === 'login' ? 'register' : 'login'; error = ''">{{ mode === 'login' ? 'Create an account' : 'Log in' }}</a>
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { createAccount, logIn, logOut, useIdentity } from '@/composables/useIdentity'
import { forgetAll, unsent } from '@/composables/useJot'
import { useMesh } from '@/composables/useMesh'

const props = defineProps<{ start?: 'about' | 'login' | 'register' }>()
const emit = defineEmits<{ close: [] }>()
const { account } = useIdentity()
const { connected } = useMesh()

const mode = ref<'about' | 'login' | 'register'>(props.start ?? 'about')
const username = ref((() => { try { return localStorage.getItem('jot:username') ?? '' } catch { return '' } })())
const password = ref('')
const busy = ref(false)
const error = ref('')
const leaving = ref(false)
const waiting = ref(0)
const strong = computed(() => password.value.length >= 12 && /[A-Z]/.test(password.value) && /[a-z]/.test(password.value) && /\d/.test(password.value))

const submit = async () => {
  if (busy.value || !username.value.trim() || !password.value) return
  busy.value = true
  error.value = ''
  try {
    if (mode.value === 'login') await logIn(username.value.trim(), password.value)
    else await createAccount(username.value.trim(), password.value)
    password.value = ''
    emit('close')
  } catch (e) {
    const code = (e as { code?: string }).code
    error.value = code ? (e as Error).message : mode.value === 'login' ? 'Wrong username or password' : `Could not create the account: ${(e as Error).message}`
  } finally { busy.value = false }
}

const askOut = async () => { waiting.value = await unsent(); leaving.value = true }
const out = async () => {
  busy.value = true
  try {
    await forgetAll()
    await logOut()
    emit('close')
  } finally { busy.value = false }
}
</script>

<style scoped>
.foot { margin: 1rem 0 0; font-size: 0.875rem; }
.rules { list-style: none; font-size: 0.85rem; color: var(--ink-2); margin: 0.25rem 0 0.75rem; }
.rules li::before { content: '○ '; }
.rules li.met { color: var(--sheen); }
.rules li.met::before { content: '● '; }
</style>
