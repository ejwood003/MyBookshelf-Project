import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The production build is served by the ASP.NET app out of wwwroot/app, so built
// asset URLs need the /app/ prefix. In dev, Vite serves everything from the root.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/app/' : '/',
  build: {
    outDir: '../server/wwwroot/app',
    emptyOutDir: true,
    // The MVC app shell reads this manifest to find the hashed bundle filenames.
    manifest: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5229',
        changeOrigin: true,
      },
    },
  },
}))
