/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // Removed 'standalone' for Vercel compatibility - standalone is for Docker/self-hosted only
  poweredByHeader: false,
  compress: true,
  generateEtags: false,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://query1.finance.yahoo.com https://api.perplexity.ai",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ]
      }
    ];
  }
  ,
  async redirects() {
    return [
      {
        source: '/recon',
        destination: '/internal-ops/dashboard',
        permanent: true,
      },
      {
        source: '/audit',
        destination: '/internal-ops/dashboard',
        permanent: true,
      },
      {
        source: '/audit/:path*',
        destination: '/internal-ops/dashboard',
        permanent: true,
      },
      {
        source: '/public-risk/dashboard',
        destination: '/internal-ops/dashboard',
        permanent: true,
      },
      {
        source: '/public-risk/vendors',
        destination: '/internal-ops/vendors',
        permanent: true,
      },
      {
        source: '/public-risk/memo',
        destination: '/internal-ops/memo',
        permanent: true,
      },
      {
        source: '/public-risk',
        destination: '/internal-ops/dashboard',
        permanent: true,
      },
    ];
  }
}

module.exports = withBundleAnalyzer(nextConfig)
