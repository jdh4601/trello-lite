import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Node by default; tests opt into jsdom with `// @vitest-environment jsdom`
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    passWithNoTests: true,
  },
});
