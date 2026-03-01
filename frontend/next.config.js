/** @type {import('next').NextConfig} */
const nextConfig = {
  // Отключаем статический экспорт — нужен для динамических роутов типа /wish/[slug]
  output: undefined,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};
module.exports = nextConfig;
