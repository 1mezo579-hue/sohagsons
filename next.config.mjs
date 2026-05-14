/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable source maps in production (hides source code)
  productionBrowserSourceMaps: false,

  // Disable powered-by header
  poweredByHeader: false,

  // Compress output
  compress: true,

  // Disable telemetry
  telemetry: false,

  // Standalone output for easier deployment
  // output: 'standalone',
};

export default nextConfig;
