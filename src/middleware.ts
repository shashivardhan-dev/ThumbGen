import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/create(.*)",
  "/edit(.*)",
  "/api/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth(); // ✅ Await here

  if (!userId && isProtectedRoute(req)) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl); // ✅ Use NextResponse
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/(api|trpc)(.*)",
  ],
};
