"use client"

import { fetchAiToken, getUrlParam } from "@/lib/tiptap-collab-utils"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type AiContextValue = {
  aiToken: string | null
  hasAi: boolean
  isLoadingToken: boolean
}

export const AiContext = createContext<AiContextValue>({
  hasAi: false,
  aiToken: null,
  isLoadingToken: true,
})

export const AiConsumer = AiContext.Consumer
export const useAi = (): AiContextValue => {
  const context = useContext(AiContext)
  if (!context) {
    throw new Error("useAi must be used within an AiProvider")
  }
  return context
}

export const useAiToken = () => {
  const [aiToken, setAiToken] = useState<string | null>(null)
  const [hasAi, setHasAi] = useState<boolean>(true)
  const [isLoadingToken, setIsLoadingToken] = useState<boolean>(true)

  // Check if AI is disabled via URL param (?noAi=1)
  useEffect(() => {
    const noAiParam = getUrlParam("noAi")
    const aiEnabled = parseInt(noAiParam || "0") !== 1
    setHasAi(aiEnabled)
    if (!aiEnabled) {
      setIsLoadingToken(false)
    }
  }, [])

  // Fetch AI token when AI is enabled
  useEffect(() => {
    if (!hasAi) {
      return
    }

    const getToken = async () => {
      setIsLoadingToken(true)
      const token = await fetchAiToken()
      setAiToken(token)
      setIsLoadingToken(false)
    }

    getToken()
  }, [hasAi])

  return { aiToken, hasAi, isLoadingToken }
}

export function AiProvider({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { hasAi, aiToken, isLoadingToken } = useAiToken()

  const value = useMemo<AiContextValue>(
    () => ({
      hasAi,
      aiToken,
      isLoadingToken,
    }),
    [hasAi, aiToken, isLoadingToken]
  )

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>
}
