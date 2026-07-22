/*
 * Copy @dartilesm/core's compiled stylesheet into this package's dist so consumers get
 * the DEPT styles from a single import: `import "@dartilesm/react/styles.css"`.
 * Runs after the vite lib build; core is built first via turbo's `^build`.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../node_modules/@dartilesm/core/dist/styles.css");
const dest = resolve(here, "../dist/styles.css");

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log(`[copy-core-styles] ${src} -> ${dest}`);
