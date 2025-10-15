import NextAuth, {SessionStrategy} from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "../../../../lib/prisma"
import { PrismaAdapter } from "@next-auth/prisma-adapter"

async function refreshAccessToken(account) {
  try {
    const url =
      "https://oauth2.googleapis.com/token?" +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: account.refresh_token || null,
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

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: { params: { scope: "openid email profile" } },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" as SessionStrategy},

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in → attach account info
      if (account && user) {
        const dbAccount = await prisma.account.findFirst({
          where: { provider: account.provider, providerAccountId: account.providerAccountId },
        })

        token.accessToken = dbAccount?.access_token
        token.refreshToken = dbAccount?.refresh_token
        token.accessTokenExpires = dbAccount?.expires_at
        token.accountId = dbAccount?.id
        token.user = user
        return token
      }

      // Check expiry
      if (Date.now() < (token.accessTokenExpires as number) * 1000) {
        return token
      }

      // Refresh using DB-stored refresh_token
      if (token.accountId) {
        const account = await prisma.account.findUnique({ where: { id: token.accountId } })
        if (account?.refresh_token) {
          const refreshed = await refreshAccessToken(account)
          if (refreshed) {
            token.accessToken = refreshed.access_token
            token.accessTokenExpires = Date.now() + refreshed.expires_in * 1000
            token.refreshToken = refreshed.refresh_token ?? token.refreshToken
          }
        }
      }

      return token
    },

    async session({ session, token }) {
      session.user = token.user as any
      session.accessToken = token.accessToken
      session.error = token.error
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
