import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const dist = join(root, "dist");
const excluded = new Set([
  "dist", "node_modules", "src", "tests", "scripts", ".aivic", ".github", ".git", "test-results", "test-results-jest",
  "package.json", "package-lock.json", "tsconfig.json", "jest.config.js", "playwright.config.ts", "amplify.yml", "README.md",
]);

const copyTree = (from, to) => {
  if (statSync(from).isDirectory()) {
    mkdirSync(to, { recursive: true });
    for (const entry of readdirSync(from)) copyTree(join(from, entry), join(to, entry));
    return;
  }
  mkdirSync(join(to, ".."), { recursive: true });
  copyFileSync(from, to);
};

const listTypeScript = (dir) => {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listTypeScript(full));
      continue;
    }
    if (/\.ts$/.test(entry) && !/\.d\.ts$/.test(entry) && !/\.test\.ts$/.test(entry)) files.push(full);
  }
  return files.sort();
};

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const entry of readdirSync(root)) {
  if (excluded.has(entry)) continue;
  copyTree(join(root, entry), join(dist, entry));
}

const logicDir = join(root, "src", "logic");
const modules = existsSync(logicDir) ? listTypeScript(logicDir) : [];
if (modules.length === 0) {
  console.log("[aivic-build] business logic modules: 0 (static files only)");
  process.exit(0);
}

const require = createRequire(import.meta.url);
const loadEsbuild = () => {
  try {
    return require("esbuild");
  } catch {
    if (process.env.AIVIC_ESBUILD_DIR) return require(process.env.AIVIC_ESBUILD_DIR);
    execSync("npm install --no-save --no-audit --no-fund esbuild@0.24.2", { cwd: root, stdio: "inherit" });
    return require(join(root, "node_modules", "esbuild"));
  }
};
const esbuild = loadEsbuild();

const posix = (value) => value.replace(/\\/g, "/");
const slugOf = (file) => posix(relative(logicDir, file)).replace(/\.ts$/, "");
const importLines = modules.map((file, index) =>
  `import * as m${index} from ${JSON.stringify("./" + posix(relative(root, file)).replace(/\.ts$/, ""))};`);
const entry = [
  ...importLines,
  `export const modules = { ${modules.map((file, index) => `${JSON.stringify(slugOf(file))}: m${index}`).join(", ")} };`,
  `export const fns = Object.assign({}, ${modules.map((_, index) => `m${index}`).join(", ")});`,
].join("\n");

await esbuild.build({
  stdin: { contents: entry, resolveDir: root, loader: "ts", sourcefile: "aivic-logic-entry.ts" },
  bundle: true,
  format: "iife",
  globalName: "aivicLogic",
  platform: "browser",
  target: ["es2020"],
  absWorkingDir: root,
  outfile: join(dist, "logic/aivic-logic.js"),
  alias: { crypto: "./scripts/aivic-browser-crypto.mjs" },
  logLevel: "info",
});
console.log(`[aivic-build] business logic modules: ${modules.length} -> dist/logic/aivic-logic.js`);
