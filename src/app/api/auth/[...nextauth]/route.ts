import NextAuth, { SessionStrategy } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "../../../../lib/prisma"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import type { AuthOptions, User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { Account } from "@prisma/client"

// Extend the JWT type to include custom properties
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    accountId?: string
    user?: User
  }
}

async function refreshAccessToken(account: Account) {
  try {
    const url =
      "https://oauth2.googleapis.com/token?" +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: account.refresh_token || "",
      })

    const response = await fetch(url, { method: "POST" })
    const refreshedTokens = await response.json()

    if (!response.ok) throw refreshedTokens

    // Update DB with new tokens
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: refreshedTokens.access_token,
        expires_at: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
        refresh_token: refreshedTokens.refresh_token ?? account.refresh_token,
      },
    })

    return refreshedTokens
  } catch (error) {
    console.error("Error refreshing access token:", error)
    return null
  }
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: { params: { scope: "openid email profile" } },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" as SessionStrategy },

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in → attach account info
      if (account && user) {
        const dbAccount = await prisma.account.findFirst({
          where: { provider: account.provider, providerAccountId: account.providerAccountId },
        })

        token.accessToken = dbAccount?.access_token || undefined
        token.refreshToken = dbAccount?.refresh_token || undefined
        token.accessTokenExpires = dbAccount?.expires_at || undefined
        token.accountId = dbAccount?.id
        token.user = user
        return token
      }

      // Check expiry
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires * 1000) {
        return token
      }

      // Refresh using DB-stored refresh_token
      if (token.accountId) {
        const account = await prisma.account.findUnique({ where: { id: token.accountId } })
        if (account?.refresh_token) {
          const refreshed = await refreshAccessToken(account)
          if (refreshed) {
            token.accessToken = refreshed.access_token
            token.accessTokenExpires = Math.floor(Date.now() / 1000 + refreshed.expires_in)
            token.refreshToken = refreshed.refresh_token ?? token.refreshToken
          }
        }
      }

      return token
    },

    async session({ session, token }) {
      if (token.user) {
        session.user = token.user
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }