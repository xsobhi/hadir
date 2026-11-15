import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5181, proxy: { "/api": { target: "http://127.0.0.1:8731", changeOrigin: false } } },
  preview: { port: 5182, proxy: { "/api": { target: "http://127.0.0.1:8731", changeOrigin: false } } },
  build: { target: "es2022", assetsInlineLimit: 0, chunkSizeWarningLimit: 1400, emptyOutDir: true },
  // The server bundle carries every dependency, so the Windows box needs only node and these files.
  ssr: { noExternal: true },
});
