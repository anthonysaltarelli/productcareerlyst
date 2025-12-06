# Amplitude Experiment SDK Research

## Overview

The Amplitude Experiment SDK is a separate SDK from the Analytics SDK that enables A/B testing, feature flags, and experimentation within your application. It integrates seamlessly with your existing Amplitude Analytics setup to provide unified user identity management and automatic exposure tracking.

## Key Differences: Analytics SDK vs Experiment SDK

### Analytics SDK (Currently Installed)
- **Purpose**: Track user events and behavior
- **Package**: `@amplitude/analytics-browser` (client) and `@amplitude/analytics-node` (server)
- **What it does**: 
  - Sends events to Amplitude
  - Tracks user properties
  - Enables Session Replay
  - Provides analytics data

### Experiment SDK (To Be Installed)
- **Purpose**: Run experiments, assign users to variants, manage feature flags
- **Package**: `@amplitude/experiment-js-client` (client-side)
- **What it does**:
  - Assigns users to experiment variants
  - Fetches experiment configurations
  - Automatically tracks exposure events
  - Manages feature flags
  - Integrates with Analytics SDK for unified user identity

## Why You Need It for Onboarding Experiments

1. **Variant Assignment**: Automatically assigns users to different onboarding flows (e.g., "Control", "Variant A", "Variant B")
2. **Exposure Tracking**: Automatically tracks when users are exposed to a variant (separate from actual interaction)
3. **Feature Flags**: Can enable/disable features for specific user segments
4. **Unified Identity**: Uses the same user ID as Analytics SDK, ensuring consistent tracking
5. **Real-time Updates**: Can update experiment configurations without code deployments

## Installation

### Step 1: Install the Package

```bash
npm install @amplitude/experiment-js-client
```

### Step 2: Get Your Experiment API Key

The Experiment SDK uses a **different API key** than the Analytics SDK:

1. Go to Amplitude Dashboard
2. Navigate to **Settings** > **Projects** > **[Your Project]**
3. Find **Experiment API Key** (separate from Analytics API Key)
4. Add to environment variables:

```bash
# Add to .env.local
NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_API_KEY=your_experiment_api_key_here
```

**Important**: This is different from `NEXT_PUBLIC_AMPLITUDE_API_KEY` (used for Analytics)

## Integration with Existing Analytics Setup

The Experiment SDK integrates with your existing Analytics SDK to:
- Share the same user ID (email address)
- Share the same device ID
- Automatically send exposure events to Analytics
- Maintain consistent user identity across both SDKs

### Recommended Architecture

```
┌─────────────────────────────────────────┐
│         AmplitudeProvider.tsx           │
│  (Initialize both SDKs together)       │
├─────────────────────────────────────────┤
│  1. Initialize Analytics SDK           │
│  2. Initialize Experiment SDK          │
│  3. Link user identity between both    │
└─────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Setup Experiment SDK Client

Create `lib/amplitude/experiment.ts`:

```typescript
'use client';

import { Experiment } from '@amplitude/experiment-js-client';
import * as amplitude from '@amplitude/analytics-browser';

let experimentClient: Experiment | null = null;
let isInitialized = false;

/**
 * Initialize Amplitude Experiment SDK
 * Should be called after Analytics SDK is initialized
 * 
 * @param userId - Optional user ID (email address for authenticated users)
 * @param userProperties - Optional user properties for targeting
 */
export const initializeExperiment = async (
  userId?: string,
  userProperties?: Record<string, any>
) => {
  if (isInitialized) {
    return experimentClient;
  }

  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_EXPERIMENT_API_KEY;
  
  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Experiment API key not found. Experiments will be disabled.');
    }
    return null;
  }

  try {
    // Initialize Experiment SDK
    experimentClient = Experiment.initialize(apiKey, {
      // Link with Analytics SDK for unified user identity
      userProvider: {
        userId: userId || undefined,
        // Use Analytics SDK's device ID
        deviceId: amplitude.getDeviceId() || undefined,
      },
      // Automatically track exposure events to Analytics
      automaticExposureTracking: true,
      // Fetch experiment configs on initialization
      fetchOnInit: true,
      // Poll for updates every 30 seconds
      fetchTimeoutMillis: 30000,
    });

    // Set user properties for targeting
    if (userProperties && experimentClient) {
      experimentClient.setUserProperties(userProperties);
    }

    isInitialized = true;

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Amplitude Experiment SDK initialized successfully');
      console.log('👤 User ID:', userId || 'anonymous');
    }

    return experimentClient;
  } catch (error) {
    console.error('❌ Error initializing Experiment SDK:', error);
    return null;
  }
};

/**
 * Get experiment variant for a specific flag/key
 * Returns the variant assignment for the current user
 * 
 * @param flagKey - The experiment flag key (e.g., 'onboarding-flow')
 * @returns Variant object with key, value, and payload
 */
export const getVariant = async (flagKey: string) => {
  if (!experimentClient || !isInitialized) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Experiment SDK not initialized. Returning control variant.');
    }
    return { key: 'control', value: 'control' };
  }

  try {
    const variant = await experimentClient.variant(flagKey);
    return variant || { key: 'control', value: 'control' };
  } catch (error) {
    console.error('❌ Error fetching variant:', error);
    return { key: 'control', value: 'control' };
  }
};

/**
 * Get all variants for the current user
 * Useful for fetching multiple experiment assignments at once
 */
export const getAllVariants = async () => {
  if (!experimentClient || !isInitialized) {
    return {};
  }

  try {
    return await experimentClient.fetch();
  } catch (error) {
    console.error('❌ Error fetching variants:', error);
    return {};
  }
};

/**
 * Update user properties for experiment targeting
 * Call this when user properties change (e.g., after onboarding)
 */
export const setExperimentUserProperties = (userProperties: Record<string, any>) => {
  if (!experimentClient || !isInitialized) {
    return;
  }

  try {
    experimentClient.setUserProperties(userProperties);
  } catch (error) {
    console.error('❌ Error setting experiment user properties:', error);
  }
};

/**
 * Identify user in Experiment SDK
 * Call this when user logs in or their identity changes
 */
export const identifyExperimentUser = (userId: string, userProperties?: Record<string, any>) => {
  if (!experimentClient || !isInitialized) {
    return;
  }

  try {
    experimentClient.setUserId(userId);
    if (userProperties) {
      experimentClient.setUserProperties(userProperties);
    }
    // Fetch new variants after user identification
    experimentClient.fetch();
  } catch (error) {
    console.error('❌ Error identifying experiment user:', error);
  }
};

/**
 * Check if Experiment SDK is initialized
 */
export const isExperimentInitialized = () => {
  return isInitialized && experimentClient !== null;
};
```

### Phase 2: Update AmplitudeProvider

Update `app/components/AmplitudeProvider.tsx` to initialize both SDKs:

```typescript
// Add to imports
import { initializeExperiment } from '@/lib/amplitude/experiment';
import { initializeAmplitudeBrowser } from '@/lib/amplitude/browser';

// In the useEffect, after Analytics SDK initialization:
useEffect(() => {
  const initBothSDKs = async () => {
    // 1. Initialize Analytics SDK first
    await initializeAmplitudeBrowser(userId, userProperties);
    
    // 2. Then initialize Experiment SDK (links with Analytics SDK)
    await initializeExperiment(userId, userProperties);
  };

  initBothSDKs();
}, [userId, userProperties]);
```

### Phase 3: Create Onboarding Experiment Hook

Create `lib/hooks/useOnboardingExperiment.ts`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getVariant } from '@/lib/amplitude/experiment';

export type OnboardingVariant = 'control' | 'variant_a' | 'variant_b';

interface OnboardingExperiment {
  variant: OnboardingVariant;
  isLoading: boolean;
}

/**
 * Hook to get user's onboarding experiment variant
 * Automatically fetches variant assignment from Amplitude Experiment SDK
 */
export const useOnboardingExperiment = (): OnboardingExperiment => {
  const [variant, setVariant] = useState<OnboardingVariant>('control');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVariant = async () => {
      try {
        const result = await getVariant('onboarding-flow');
        // Map variant key to TypeScript type
        const variantKey = result.key || 'control';
        setVariant(variantKey as OnboardingVariant);
      } catch (error) {
        console.error('Error fetching onboarding variant:', error);
        setVariant('control'); // Default to control on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchVariant();
  }, []);

  return { variant, isLoading };
};
```

### Phase 4: Use in Onboarding Page

Update `app/onboarding/page.tsx`:

```typescript
import { useOnboardingExperiment } from '@/lib/hooks/useOnboardingExperiment';

export default function OnboardingPage() {
  const { variant, isLoading } = useOnboardingExperiment();
  
  // Show loading state while fetching variant
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Render different onboarding flows based on variant
  const renderOnboardingFlow = () => {
    switch (variant) {
      case 'variant_a':
        // New onboarding flow (e.g., shorter steps, different order)
        return <OnboardingFlowVariantA />;
      case 'variant_b':
        // Another variant (e.g., video-first approach)
        return <OnboardingFlowVariantB />;
      case 'control':
      default:
        // Current onboarding flow
        return <OnboardingFlowControl />;
    }
  };

  return (
    <div>
      {renderOnboardingFlow()}
    </div>
  );
}
```

## Setting Up Experiments in Amplitude Dashboard

1. **Create Experiment**:
   - Go to Amplitude Dashboard > **Experiments**
   - Click **Create Experiment**
   - Name: "Onboarding Flow Experiment"

2. **Define Variants**:
   - **Control**: Current onboarding flow
   - **Variant A**: New flow (e.g., shorter steps)
   - **Variant B**: Another variation

3. **Set Targeting**:
   - Target specific user segments (e.g., new users only)
   - Set traffic allocation (e.g., 33% control, 33% variant A, 33% variant B)

4. **Set Flag Key**:
   - Flag Key: `onboarding-flow`
   - This is what you'll use in `getVariant('onboarding-flow')`

5. **Set Metrics**:
   - Primary metric: "Onboarding Completion Rate"
   - Secondary metrics: "Time to Complete", "Trial Start Rate"

## Automatic Exposure Tracking

The Experiment SDK automatically tracks exposure events to Amplitude Analytics:
- Event: `[Experiment] Exposure`
- Properties:
  - `flag_key`: The experiment flag (e.g., "onboarding-flow")
  - `variant`: The assigned variant (e.g., "variant_a")
  - `experiment_key`: The experiment identifier

This ensures accurate experiment analysis by distinguishing:
- **Assignment**: When user is assigned to a variant
- **Exposure**: When user actually sees the variant (tracked automatically)

## Best Practices

1. **Initialize Experiment SDK After Analytics SDK**: Ensures user identity is shared
2. **Handle Loading States**: Variants are fetched asynchronously
3. **Fallback to Control**: Always have a default "control" variant for errors
4. **Track Custom Events**: Use Analytics SDK to track experiment-specific events
5. **Update User Properties**: Call `setExperimentUserProperties` when user data changes
6. **Test in Development**: Use Amplitude's test mode to verify variant assignments

## Example: Onboarding Experiment Use Case

**Goal**: Test if a shorter onboarding flow increases completion rates

**Variants**:
- **Control**: Current 6-step onboarding
- **Variant A**: 4-step onboarding (combines steps)
- **Variant B**: 3-step onboarding (minimal steps)

**Metrics to Track**:
- Onboarding completion rate
- Time to complete onboarding
- Trial start rate
- User engagement in first week

**Implementation**:
```typescript
const { variant } = useOnboardingExperiment();

// Render different step configurations
const steps = variant === 'variant_a' 
  ? SHORT_STEPS 
  : variant === 'variant_b' 
  ? MINIMAL_STEPS 
  : DEFAULT_STEPS;

// Track experiment-specific events
trackEvent('User Started Onboarding', {
  'Experiment Variant': variant,
  'Onboarding Flow Type': variant === 'control' ? 'full' : 'short',
});
```

## Resources

- [Amplitude Experiment SDK Documentation](https://docs.amplitude.com/experiment/)
- [JavaScript Client SDK](https://github.com/amplitude/experiment-js-client)
- [Experiment SDK Integration Guide](https://docs.amplitude.com/experiment/integration/)
- [Automatic Exposure Tracking](https://community.amplitude.com/kb/articles/61-automatic-experiment-sdk-exposure-tracking)

## Next Steps

1. ✅ Install `@amplitude/experiment-js-client` package
2. ✅ Get Experiment API Key from Amplitude Dashboard
3. ✅ Create `lib/amplitude/experiment.ts` with Experiment SDK client
4. ✅ Update `AmplitudeProvider.tsx` to initialize both SDKs
5. ✅ Create `useOnboardingExperiment` hook
6. ✅ Update onboarding page to use experiment variants
7. ✅ Create experiment in Amplitude Dashboard
8. ✅ Test variant assignments in development
9. ✅ Deploy and monitor experiment results


