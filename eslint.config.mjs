import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/app/api/**", "src/lib/data.ts", "src/lib/mock-db.ts", "src/lib/db.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "backend/**",
    "frontend/**",
    "worker/**",
    "db/**",
    "infra/**",
    "realtime-worker/**",
    ".open-next/**",
    ".wrangler/**",
    "legacy-wrangler.toml.bak",
  ]),
]);

export default eslintConfig;
