import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: env.VITE_BASE || "/Proyecto-final-MISO-202520-G2/",
  server: {
    allowedHosts: [
      "cliente-web-212820187078.us-central1.run.app",
      // puedes agregar otras URLs si fuera necesario
    ],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/tests/setupTests.ts",
    testTimeout: 15000,
    hookTimeout: 15000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      lines: 85,
      branches: 85,
      functions: 85,
      statements: 85,
      include: [
        "src/components/proveedor/CreateProveedorForm.tsx",
        "src/services/proveedores.service.ts",
        "src/services/planesVenta.service.ts",
      ],
    },
    include: [
      "src/**/*.unit.test.{ts,tsx}",
      "src/**/*.functional.test.{ts,tsx}",
      "src/**/*.integration.test.{ts,tsx}",
      "src/**/*.acceptance.test.{ts,tsx}",
    ],
  },
  }
})