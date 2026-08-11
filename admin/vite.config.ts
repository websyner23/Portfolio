import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Bind every interface, not just loopback — without this the admin panel
    // is unreachable from outside the machine, which breaks any VM/EC2 host.
    host: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
    host: true,
  },
});
