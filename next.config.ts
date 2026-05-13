import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Utiliser Webpack au lieu de Turbopack (évite la fuite mémoire sur Windows)
  // Définir la racine explicitement pour éviter le warning lockfiles multiples
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
