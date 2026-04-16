/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output para Docker/EasyPanel: copia só o mínimo pra rodar
  // em produção (server.js + node_modules trimmed).
  output: 'standalone',
  reactStrictMode: true,
};

module.exports = nextConfig;
