import { checkBotId } from 'botid/server';

/**
 * Verifies BotID for incoming requests
 * Note: checkBotId() reads from the request context automatically
 * @returns Object with verified boolean and optional error message
 */
export const verifyBotIDRequest = async (): Promise<{ verified: boolean; error?: string }> => {
  try {
    // Check if request is from a bot
    // checkBotId() automatically reads from the request context
    const { isBot } = await checkBotId();

    if (isBot) {
      // Log verification failure for monitoring
      console.warn('BotID verification failed - bot detected');

      return {
        verified: false,
        error: 'Request verification failed. Please try again.',
      };
    }

    return { verified: true };
  } catch (error) {
    // Handle errors gracefully - log but don't block in case of BotID service issues
    console.error('BotID verification error:', error);

    // In production, we might want to be more strict, but for now
    // we'll allow the request through if BotID service is unavailable
    // This prevents BotID service issues from breaking the app
    return {
      verified: true, // Allow through on error to prevent service issues from breaking app
    };
  }
};

