// middleware.ts
import { withAuth } from "next-auth/middleware"

// Protect specific routes
export default withAuth({
  pages: {
    signIn: "/", // Redirect here if not signed in
  },
})

// Apply middleware only to these paths
export const config = {
  matcher: ["/api/protected/:path*", "/dashboard/:path*"],
}
