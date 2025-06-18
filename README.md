# Jot - Visual Note Taking App

A modern note-taking application with visual workspace capabilities, rich text editing, and multi-provider authentication.

## Features

- **Multi-Provider Authentication**: Sign in with Google, Microsoft, Apple, or GitHub
- **Visual Workspaces**: Create and manage multiple named workspaces
- **Rich Text Cards**: Create note cards with rich text editing capabilities
- **Drag & Drop**: Drag and drop cards in a flexible grid layout
- **Connections**: Create arrow and line connectors between cards
- **IndexedDB Storage**: Client-side data storage using IndexedDB
- **Responsive Design**: Modern, responsive UI with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: NextAuth.js with multiple providers
- **Database**: IndexedDB with Dexie.js
- **Rich Text**: Tiptap editor
- **Drag & Drop**: DND Kit
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy the `.env.local` file and fill in your OAuth credentials:

```bash
cp .env.local .env.local.example
```

Configure the following OAuth providers in your `.env.local`:

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://0.0.0.0:3000/api/auth/callback/google` to authorized redirect URIs

#### GitHub OAuth
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Authorization callback URL: `http://0.0.0.0:3000/api/auth/callback/github`

#### Microsoft OAuth
1. Go to [Azure App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps)
2. Create a new registration
3. Add redirect URI: `http://0.0.0.0:3000/api/auth/callback/microsoft`

#### Apple OAuth
1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Create a new App ID and Service ID
3. Configure Sign in with Apple
4. Add redirect URI: `http://0.0.0.0:3000/api/auth/callback/apple`

### 3. Run Development Server

```bash
npm run dev
```

Open [http://0.0.0.0:3000](http://0.0.0.0:3000) in your browser.

## Usage

1. **Sign In**: Choose your preferred authentication provider
2. **Create Workspace**: Click "New Workspace" in the sidebar
3. **Add Cards**: Use the "Add Card" button to create note cards
4. **Edit Cards**: Click the edit button on any card to modify content
5. **Drag Cards**: Use the grip handle to drag cards around
6. **Connect Cards**: Click "Connect" mode and click two cards to create connections
7. **Resize Cards**: Drag the resize handle in the bottom-right corner

## Project Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/     # NextAuth API routes
│   ├── auth/signin/                # Sign-in page
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Home page
├── components/
│   ├── card.tsx                    # Note card component
│   ├── dashboard.tsx               # Main dashboard
│   ├── providers.tsx               # Session provider wrapper
│   ├── rich-text-editor.tsx       # Rich text editor
│   ├── workspace-canvas.tsx       # Canvas with drag-drop
│   └── workspace-selector.tsx     # Workspace management
├── lib/
│   ├── auth.ts                     # NextAuth configuration
│   └── db.ts                       # IndexedDB/Dexie setup
└── types/
    └── next-auth.d.ts              # NextAuth type extensions
```

## Development

### Adding New Features

1. **Database Schema Changes**: Modify `src/lib/db.ts`
2. **New Components**: Add to `src/components/`
3. **Authentication**: Extend `src/lib/auth.ts`
4. **Styling**: Use Tailwind classes or modify `src/app/globals.css`

### Building for Production

```bash
npm run build
npm start
```

## Deployment

This app can be deployed to any platform that supports Next.js:

- **Vercel**: Built-in Next.js support
- **Netlify**: Use Next.js plugin
- **Railway**: Node.js deployment
- **Self-hosted**: Use Docker or PM2

Remember to update the `NEXTAUTH_URL` environment variable for production deployment.

## License

MIT License - see LICENSE file for details.
