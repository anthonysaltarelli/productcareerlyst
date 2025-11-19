'use client'

import { LDProvider } from 'launchdarkly-react-client-sdk'
import { ReactNode } from 'react'

export const LaunchDarklyProvider = ({ children }: { children: ReactNode }) => {
  const clientSideID = process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID

  if (!clientSideID) {
    throw new Error('NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID environment variable is required')
  }

  return (
    <LDProvider clientSideID={clientSideID}>
      {children}
    </LDProvider>
  )
}

