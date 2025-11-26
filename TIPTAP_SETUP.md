# TipTap Notion-like Editor Setup

The portfolio editor now uses [TipTap's Notion-like Editor Template](https://tiptap.dev/docs/ui-components/templates/notion-like-editor) which provides:

- **Slash commands**: `/` menu for quick formatting
- **Floating toolbar**: Context-aware formatting on text selection
- **Drag and drop**: Block-level reordering
- **Real-time collaboration**: Live cursors and user presence
- **AI assistance**: Inline AI tools for writing and editing
- **Dark/light mode**: Fully themed out of the box
- **Emoji support**: GitHub-style emoji picker
- **Rich formatting**: Bold, italic, underline, strikethrough, highlight, color, and more
- **Block types**: Headings, lists, blockquotes, code blocks, dividers, math

## Environment Variables

### For Local Development

Add these to your `.env.local` file:

```env
# TipTap Collaboration (Document Server)
NEXT_PUBLIC_TIPTAP_COLLAB_DOC_PREFIX=productcareerlyst
NEXT_PUBLIC_TIPTAP_COLLAB_APP_ID=your-collab-app-id
NEXT_PUBLIC_TIPTAP_COLLAB_TOKEN=your-example-jwt-token  # Only for development!

# TipTap AI
NEXT_PUBLIC_TIPTAP_AI_APP_ID=your-ai-app-id
NEXT_PUBLIC_TIPTAP_AI_TOKEN=your-example-jwt-token  # Only for development!
```

### For Production

```env
# TipTap Collaboration (Document Server)
NEXT_PUBLIC_TIPTAP_COLLAB_DOC_PREFIX=productcareerlyst
NEXT_PUBLIC_TIPTAP_COLLAB_APP_ID=your-collab-app-id
TIPTAP_COLLAB_SECRET=your-collab-secret-key  # Server-side only!

# TipTap AI
NEXT_PUBLIC_TIPTAP_AI_APP_ID=your-ai-app-id
TIPTAP_AI_SECRET=your-ai-secret-key  # Server-side only!

# Enable server-side JWT generation
NEXT_PUBLIC_USE_JWT_TOKEN_API_ENDPOINT=true
```

## Getting Your Credentials

### Step 1: Go to [TipTap Cloud Dashboard](https://cloud.tiptap.dev)

### Step 2: Get Collaboration Credentials

1. Click **"Collaboration"** in the sidebar
2. Copy the **App ID** → `NEXT_PUBLIC_TIPTAP_COLLAB_APP_ID`
3. For **development**: Copy the **Example JWT** → `NEXT_PUBLIC_TIPTAP_COLLAB_TOKEN`
4. For **production**: Copy the **Secret** → `TIPTAP_COLLAB_SECRET`

### Step 3: Get AI Credentials

1. Click **"AI"** in the sidebar
2. Copy the **App ID** → `NEXT_PUBLIC_TIPTAP_AI_APP_ID`
3. For **development**: Copy the **Example JWT** → `NEXT_PUBLIC_TIPTAP_AI_TOKEN`
4. For **production**: Copy the **Secret** → `TIPTAP_AI_SECRET`

## How Production JWT Generation Works

We've created two API endpoints that generate short-lived JWTs:

- `POST /api/tiptap/collaboration` - Generates collaboration JWT
- `POST /api/tiptap/ai` - Generates AI JWT

These endpoints:
1. ✅ Verify the user is authenticated via Supabase
2. ✅ Generate a JWT signed with your secret key
3. ✅ Include user info for collaboration cursors
4. ✅ Set 1-hour expiration for security

When `NEXT_PUBLIC_USE_JWT_TOKEN_API_ENDPOINT=true`, the editor calls these endpoints instead of using the hardcoded example tokens.

See [TipTap JWT Authentication Guide](https://tiptap.dev/docs/collaboration/authentication) for more details.

## Image Uploads

The template expects an image upload endpoint. You can configure this in `/lib/tiptap-utils.ts`:

```typescript
// In handleImageUpload function, adjust the upload endpoint:
const response = await fetch('/api/portfolio/images/upload', {
  body: file,
  method: 'post',
  headers: {
    'content-type': file.type,
  }
})
```

## How Content is Stored

- **Content is stored in TipTap Cloud**, not in your Supabase database
- Each portfolio page has a unique `room` ID: `portfolio-page-{pageId}`
- Content syncs automatically across all connected users
- Changes are persisted immediately to TipTap Cloud

## Files Installed

The template installed ~399 files in:
- `components/tiptap-templates/notion-like/` - Main editor components
- `components/tiptap-ui/` - UI components (menus, buttons, popovers)
- `components/tiptap-node/` - Custom node implementations
- `components/tiptap-extension/` - Custom extensions
- `components/tiptap-primitives/` - Base UI primitives
- `hooks/` - Custom React hooks
- `contexts/` - React contexts for state management
- `lib/` - Utility functions

## Usage

```tsx
import { NotionEditor } from '@/components/tiptap-templates/notion-like/notion-like-editor'

export default function PageEditor() {
  return (
    <NotionEditor 
      room="portfolio-page-abc123"  // Unique ID for this document
      placeholder="Start writing your case study..."
    />
  )
}
```

## Styling

The editor styles are in:
- `components/tiptap-templates/notion-like/notion-like-editor.scss`
- Various `.scss` files in `components/tiptap-node/` subdirectories
- The editor supports dark/light mode automatically

## Troubleshooting

### "Set up your environment variables" alert
- Make sure all `NEXT_PUBLIC_TIPTAP_*` variables are set in `.env.local`
- Restart your dev server after adding env vars

### Editor shows "Connecting..."
- Check that your TipTap Cloud credentials are correct
- Ensure your subscription is active

### AI features not working
- Verify `NEXT_PUBLIC_TIPTAP_AI_APP_ID` and `NEXT_PUBLIC_TIPTAP_AI_TOKEN` are set
- AI requires a paid TipTap Cloud subscription

