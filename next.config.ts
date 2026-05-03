import { type NextConfig } from 'next';

// React 19 requires eval() in dev mode for callstack debugging — never used in production builds
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  reactStrictMode: true, // Recommended for identifying potential problems in an application
  output: 'standalone', // Critical for Cloud Run efficiency and deployment

  async headers() {
    return [
      {
        source: '/(.*)', // Apply these headers to all routes
        headers: [
          // Content Security Policy (CSP)
          // This policy allows scripts and styles from 'self' (your domain),
          // Google Fonts, and specific Google APIs. Adjust 'connect-src' as needed.
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''};
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com;
              img-src 'self' data:;
              font-src 'self' https://fonts.gstatic.com https://cdn.fontshare.com;
              connect-src 'self' https://generativelanguage.googleapis.com https://translation.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com;
              frame-ancestors 'none'; // Prevents clickjacking by disallowing embedding in iframes
              form-action 'self';
              base-uri 'self';
              block-all-mixed-content; // Automatically blocks HTTP content on HTTPS pages
              upgrade-insecure-requests; // Rewrites HTTP URLs to HTTPS
            `.replace(/\s{2,}/g, ' ').trim(), // Clean up extra whitespace for a compact header
          },
          // X-Frame-Options to prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // X-Content-Type-Options to prevent MIME-sniffing attacks
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer-Policy for privacy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions-Policy to control browser features
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()', // Disable unnecessary browser features
          },
        ],
      },
    ];
  },
  // Other Next.js configurations can go here
};

export default nextConfig;