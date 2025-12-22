import { initBotId } from 'botid/client/core'

// Initialize Vercel BotID for Deep Analysis bot protection
// This runs on the client before the app loads
initBotId({
  protect: [
    // Protect TipTap AI token endpoint
    { path: '/api/tiptap/ai', method: 'POST' },
    // Add other sensitive endpoints here as needed
  ],
})
