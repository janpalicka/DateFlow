import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(rootDir, "docs"),
  publicDir: path.resolve(rootDir, "assets"),
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  build: {
    outDir: path.resolve(rootDir, "dist-docs"),
    emptyOutDir: true,
    sourcemap: true,
  },
  pack: {
    entry: ["src/calendar/index.ts", "src/calendar/locales/index.ts"],
    dts: true,
    sourcemap: true,
    deps: {
      neverBundle: ["date-fns", "@floating-ui/dom"],
    },
  },
  preview: {
    port: 5173,
    host: "0.0.0.0",
  },
  // Oxlint (ESLint-compatible `import/*` rules). Import *order* is enforced by Oxfmt `sortImports` below.
  lint: {
    ignorePatterns: ["dist/**", "node_modules/**", ".vscode/**", "docs/**"],
    plugins: ["import"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      "import/extensions": [
        "error",
        {
          ignorePackages: true,
          checkTypeImports: true,
          ts: "never",
          tsx: "never",
          css: "always",
        },
      ],
      "import/order": [
        "error",
        {
          alphabetize: {
            caseInsensitive: true,
            order: "asc",
          },
        },
      ],
      "sort-exports": "error",
    },
  },
  fmt: {
    ignorePatterns: ["dist/**", "node_modules/**", ".vscode/**", "docs/**"],
    sortPackageJson: true,
    sortImports: {
      tsconfig: { rootDir: "." },
      internalPattern: ["@/"],
      newlinesBetween: false,
      sortSideEffects: true,
      customGroups: [
        {
          groupName: "relative-side-effect-style",
          elementNamePattern: ["./**/*.css", "../**/*.css"],
        },
        {
          groupName: "package-side-effect-style",
          elementNamePattern: ["**/*.css"],
        },
      ],
      groups: [
        ["value-builtin", "value-external"],
        ["type-builtin", "type-external"],
        ["value-internal", "type-internal"],
        ["value-parent", "value-sibling", "value-index"],
        ["type-parent", "type-sibling", "type-index"],
        "package-side-effect-style",
        "relative-side-effect-style",
        "unknown",
      ],
    },
  },
});
