import type { NextAuthConfig } from 'next-auth';
 
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isSeedRoute = nextUrl.pathname === '/seed';
      const isQueryRoute = nextUrl.pathname === '/query';
      const isLoginRoute = nextUrl.pathname === '/login';
      const isDebugRoute = nextUrl.pathname === '/debug-env';
      
      // Allow seed and query routes for everyone (useful for database operations)
      if (isSeedRoute || isQueryRoute || isDebugRoute) {
        return true;
      }
      
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      } else if (isLoggedIn) {
        // Don't redirect if on login page
        if (isLoginRoute) return true;
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;