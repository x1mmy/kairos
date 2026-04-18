/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next 14.2+ Router Cache: keep stale times at 0 so client navigations do not reuse old RSC payloads.
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
}

export default nextConfig
