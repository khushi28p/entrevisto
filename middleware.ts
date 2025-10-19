import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define all routes that must be accessible without authentication
const isPublicRoute = createRouteMatcher([
  '/', // 1. The Home Page
  '/sign-in(.*)', // 2. Clerk's built-in sign-in page (and sub-paths)
  '/sign-up(.*)', // 3. Clerk's built-in sign-up page (and sub-paths)
  '/api/webhooks/clerk', // 4. Your webhook endpoint
  '/select-role', // 5. CRITICAL: The first page after sign-in MUST be public so the redirect can land there.
]);

export default clerkMiddleware((auth, req) => {
  // If the user is unauthenticated and trying to access a non-public route, protect it.
  if (!isPublicRoute(req)) {
    auth.protect();
  }
});

export const config = {
  // Apply middleware to all paths except Next.js internals and static files
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
