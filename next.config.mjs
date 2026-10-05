/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  env: {
    NEXT_TELEMETRY_DISABLED: "1",
    SWC_CACHE: "1",
    WEBPACK_CACHE: "memory",
  },
  // GitHub Pages: статический экспорт (SPA, клиентская маршрутизация)
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  rewrites() {
    return [{ source: '/public/:path*', destination: '/:path*' }];
  },
  headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *;",
          },
        ],
      },
    ];
  },
  // Build optimization
  experimental: {
    // Modern experimental features for Next.js 15
  },
  // Cache optimization
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
  turbopack: {
    // node_modules is symlinked from /app/base/node_modules into per-branch
    // worktrees. Turbopack validates symlink targets against its filesystem
    // root — set to "/" so both /app/base (symlink target) and the worktree
    // dir (/tmp/execute-workspaces/...) are within scope.
    root: "/",
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      encoding: false,
    };
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: /node_modules/,
    };
    return config;
  },
  images: {
    // Disable remote patterns
    remotePatterns: [],
  },
};

export default nextConfig;
