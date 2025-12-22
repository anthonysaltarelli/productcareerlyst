"use client"

import { fetchAiToken, getUrlParam } from "@/lib/tiptap-collab-utils"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type AiContextValue = {
  aiToken: string | null
  hasAi: boolean
}

export const AiContext = createContext<AiContextValue>({
  hasAi: false,
  aiToken: null,
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

  useEffect(() => {
    const noAiParam = getUrlParam("noAi")
    const aiEnabled = parseInt(noAiParam || "0") !== 1
    console.log("[TipTap AiContext] Checking AI availability", {
      noAiParam,
      aiEnabled,
    })
    setHasAi(aiEnabled)
  }, [])

  useEffect(() => {
    if (!hasAi) {
      console.log("[TipTap AiContext] AI disabled via URL param, skipping token fetch")
      return
    }

    const getToken = async () => {
      console.log("[TipTap AiContext] Starting AI token fetch...")
      const startTime = Date.now()
      const token = await fetchAiToken()
      const duration = Date.now() - startTime
      console.log("[TipTap AiContext] AI token fetch complete", {
        success: !!token,
        tokenLength: token?.length || 0,
        durationMs: duration,
      })
      setAiToken(token)
    }

    getToken()
  }, [hasAi])

  return { aiToken, hasAi }
}

export function AiProvider({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { hasAi, aiToken } = useAiToken()

  const value = useMemo<AiContextValue>(
    () => ({
      hasAi,
      aiToken,
    }),
    [hasAi, aiToken]
  )

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>
}
