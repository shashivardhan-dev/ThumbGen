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
      session={session} // Initial session (optional)
      
      // Refetch session every 5 minutes (default: 0 = disabled)
      refetchInterval={5 * 60}
      
      // Refetch session when window regains focus (default: true)
      refetchOnWindowFocus={true}
      
      // // Custom base path if NextAuth is not at default location
      // basePath="/custom-auth"
    >
        <ToggleProvider>
      {children}
      </ToggleProvider>
    </SessionProvider>
  )
}