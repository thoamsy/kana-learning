/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@kana/content", "@kana/learning-core", "@kana/storage"],
  async rewrites() {
    return [
      {
        source: "/__test/reset",
        destination: "/test-reset",
      },
    ];
  },
};

export default nextConfig;
