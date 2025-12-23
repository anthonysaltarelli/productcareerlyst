import { initBotId } from 'botid/client/core'

// Initialize Vercel BotID for Deep Analysis bot protection
// This runs on the client before the app loads
initBotId({
  protect: [
    // TipTap AI token now uses Server Actions (not API routes), so no protection needed here
    // Add other sensitive endpoints here as needed
  ],
})
