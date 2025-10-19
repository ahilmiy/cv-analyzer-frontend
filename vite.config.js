// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // JD ANALYZE → n8n webhook
      "/api/jd/analyze": {
        target: "http://localhost:5678",   // ← ZORUNLU
        changeOrigin: true,
        secure: false,                     // https/self-signed ise işe yarar
        rewrite: (path) =>
          path.replace(
            /^\/api\/jd\/analyze$/,
            "/webhook-test/7ad3dbbe-a478-4710-b3fa-dafdccc5c4d5"
          ),
      },
      // CV SCORE → aynı webhook (mode=score)
      "/api/cv/score": {
        target: "http://localhost:5678",   // ← ZORUNLU
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          path.replace(
            /^\/api\/cv\/score$/,
            "/webhook-test/7ad3dbbe-a478-4710-b3fa-dafdccc5c4d5"
          ),
      },
    },
  },
});
