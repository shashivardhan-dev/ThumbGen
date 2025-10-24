"use client"
//app/providers.tsx
import { SessionProvider } from "next-auth/react"
import { ToggleProvider } from "../contexts/toggle"
import { ReactNode } from "react"

interface ProvidersProps {
  children: ReactNode
  session: any // or proper session type from next-auth
}
export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider
      session={session} 
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
    >
        <ToggleProvider>
      {children}
      </ToggleProvider>
    </SessionProvider>
  )
}