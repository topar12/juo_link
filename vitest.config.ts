import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // tsconfig 의 "@/*": ["./src/*"] 와 동일하게 맞춘다.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
