/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for the Docker build (packages/web/Dockerfile) - traces and
  // copies only the node_modules this app actually uses into a minimal
  // standalone server, instead of needing the whole monorepo's
  // node_modules in the final image.
  output: 'standalone',
  images: {
    remotePatterns: [
      // Loosened during development - tighten to your actual S3/CDN domain
      // before deploying (see DEPLOYMENT.md).
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;