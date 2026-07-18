/** @type {import('next').NextConfig} */
const nextConfig = {
  // Traces only the dependencies apps/web actually needs (across the monorepo's hoisted
  // node_modules) into .next/standalone, so the production Docker image doesn't have to
  // ship the whole workspace. See infrastructure/docker/web.Dockerfile.
  output: 'standalone',
};

module.exports = nextConfig;
