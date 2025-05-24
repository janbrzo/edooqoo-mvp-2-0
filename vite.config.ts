
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/generateWorksheet': {
        target: 'https://dzgmdlpfwwriqkfyizcn.supabase.co/functions/v1/generateWorksheet',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/generateWorksheet/, ''),
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6Z21kbHBmd3dyaXFrZnlpemNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5ODA3ODMsImV4cCI6MjA1MDU1Njc4M30.Zq-mhGHcBjkNgQAevwt9CLPE7hhzpK6HYrY8LF1R2oc'
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
      componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
