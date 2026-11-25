# Jot

Visual notes on an infinite canvas: cards with rich text, pictures and colours, and the lines between them. On all your devices and shared live, peer to peer, on [PeerPigeon](https://peerpigeon.io). At [jot.ooo](https://jot.ooo).

- **No account needed.** Your workspaces are kept in your browser and work offline.
- **Kept, sealed.** Each workspace has a room of its own on the PeerPigeon mesh's storage servers, named and sealed with a secret only you (and those you share it with) have. The servers keep only what they can't read.
- **On every device.** Log in with a PigeonIdP account (the same as PigeonChess, PigeonFeed and the PeerPigeon console), and your list of workspaces, with their secrets, is kept in a room only your account can write and read.
- **Shared live.** A workspace's edit link lets someone change it with you; you see each other's changes as they are made. Its owner can make a new link, which stops the old one working.
- **Published read-only.** A read-only link opens a copy only its publisher's key writes, kept up to date while they have jot open.
- **Your data.** Export everything to one file, and import it (or an export of the first jot) again. The first jot's notes in a browser come over by themselves the first time the new one opens there.

## How it works

| | |
|---|---|
| `src/lib/model.ts` | workspaces, cards and lines as records, checked; search, placement, export and import |
| `src/lib/links.ts` | room names and links (the secret goes after the `#`, which browsers never send to a server) |
| `src/lib/local.ts` | what this browser keeps (IndexedDB), and reading the first jot's database |
| `src/composables/useJot.ts` | the notes as the page shows them, and keeping them in step with their rooms: the newest change to each card or line wins |
| `src/composables/useMesh.ts`, `useIdentity.ts` | the PeerPigeon node (network `jot`, room `global`) and PigeonIdP accounts, as PigeonFeed has them |
| `src/lib/media.ts`, `images.ts`, `jot-image.ts` | pictures, in pieces on the storage servers, each sealed with a key made from its hash |
| `src/components/` | the canvas, cards (TipTap), the workspace list and the sheets |

## Running it

```sh
npm install
npm run dev        # http://localhost:5173
npm run dev:lan    # https on every address (a phone on the LAN)
npm test
npm run deploy     # builds, then the Worker on jot.ooo (wrangler.jsonc)
```

`?signal=ws://<host>:8788/ws` in the address uses a local freertc relay instead of the public ones.
