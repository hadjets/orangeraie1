import type { NextConfig } from "next";
import path from "path";

// En développement local, le projet vit dans un sous-dossier /app d'un monorepo,
// on remonte à la racine du monorepo pour que le file-tracing trouve tous les
// node_modules. Sur Vercel, __dirname est déjà la racine du projet — on ne remonte pas.
const isVercel = Boolean(process.env.VERCEL)

const nextConfig: NextConfig = {
  outputFileTracingRoot: isVercel
    ? __dirname
    : path.join(__dirname, "../../"),
};

export default nextConfig;
