/*
 * Copy @dept/core's compiled stylesheet into this package's dist so consumers get
 * DEPT styles from `import "@dept/vue/styles.css"`. The shell has no components of
 * its own, so this is identical to @dept/core's sheet.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../node_modules/@dept/core/dist/styles.css");
const dest = resolve(here, "../dist/styles.css");

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log(`[copy-core-styles] ${src} -> ${dest}`);
