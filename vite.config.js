import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,          // écoute sur toutes les interfaces en dev
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,          // nécessaire pour Firebase App Hosting
    port: Number(process.env.PORT) || 8080,
    // autorise ton domaine et les domaines Cloud Run générés
    allowedHosts: ["ranko-manga.com", ".a.run.app"],
  },
})
