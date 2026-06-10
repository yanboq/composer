import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const hasClerkConfig = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);
const isProtectedRoute = createRouteMatcher(["/builder(.*)", "/api/(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (!hasClerkConfig) return;

  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
