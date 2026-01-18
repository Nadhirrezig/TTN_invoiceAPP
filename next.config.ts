import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // cacheComponents: true // Disabled for now - requires app-wide migration to Suspense boundaries
  // To enable: migrate data fetching to use Suspense and "use cache" directives
};