/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Allow build to succeed even if some pages can't be statically generated
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig
