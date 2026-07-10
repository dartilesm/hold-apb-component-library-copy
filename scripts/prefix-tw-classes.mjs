/**
 * Prefixes Tailwind classes in shadcn-generated components with the library's
 * `ui:` prefix, and renames design-token var() references to their sealed
 * `--ui-*` equivalents.
 *
 * Run after every `npx shadcn add <component>`:
 *   npm run prefix-classes            # transforms src/components/ui/*.tsx in place
 *   npm run prefix-classes:check      # exits 1 if any file still has unprefixed classes (CI guard)
 *   node scripts/prefix-tw-classes.mjs path/to/file.tsx   # specific files
 *
 * What it transforms (AST-based, string literals only):
 *   - className="..." JSX attributes
 *   - string literals inside cn()/cva()/cx()/clsx() calls, including cva's
 *     `variants` object and `class`/`className` keys in compoundVariants
 *   - skips cva's `defaultVariants` (those are variant names, not classes)
 *   - rewrites var(--primary), var(--radius-md), ... to var(--ui-primary), var(--ui-radius-md), ...
 *     inside the processed class strings (arbitrary values like rounded-[min(var(--radius-md),10px)])
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import ts from "typescript";

const PREFIX = "ui";
const CLASS_CALLEES = new Set(["cn", "cva", "cx", "clsx", "twMerge"]);

// Design tokens whose raw var() references in class strings must point at the
// sealed --ui-* runtime variables (kept in sync with src/styles/globals.css).
const TOKENS = [
  "background", "foreground",
  "card", "card-foreground",
  "popover", "popover-foreground",
  "primary", "primary-foreground",
  "secondary", "secondary-foreground",
  "muted", "muted-foreground",
  "accent", "accent-foreground",
  "destructive", "destructive-foreground",
  "border", "input", "ring",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
  "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
  "radius", "radius-sm", "radius-md", "radius-lg", "radius-xl",
  "radius-2xl", "radius-3xl", "radius-4xl",
  "font-sans", "font-heading", "spacing",
];
const TOKEN_VAR_RE = new RegExp(`var\\(--(${TOKENS.join("|")})([,)])`, "g");

function transformClassList(value) {
  const withVars = value.replace(TOKEN_VAR_RE, `var(--${PREFIX}-$1$2`);
  return withVars
    .split(/(\s+)/)
    .map((token) =>
      token === "" || /^\s+$/.test(token) || token.startsWith(`${PREFIX}:`)
        ? token
        : `${PREFIX}:${token}`
    )
    .join("");
}

/** Collects {start, end, text} replacements for one source file. */
function collectEdits(sourceFile) {
  const edits = [];

  function addEdit(node) {
    // node is a StringLiteral or NoSubstitutionTemplateLiteral
    const raw = node.getText(sourceFile);
    const quote = raw[0];
    const transformed = transformClassList(node.text);
    if (transformed !== node.text) {
      edits.push({
        start: node.getStart(sourceFile),
        end: node.getEnd(),
        text: `${quote}${transformed}${quote}`,
      });
    }
  }

  function isStringy(node) {
    return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
  }

  // Walk an expression in a class-list context and transform its strings.
  // Contexts:
  //   "any"          cn()/clsx() argument — bare strings are classes; object
  //                  literals are clsx conditionals ({ "classes": cond }) where
  //                  KEYS are classes and values are conditions.
  //   "class-values" cva variants subtree — object property VALUES (at any
  //                  depth) are class lists; keys are variant names.
  //   "cva-config"   cva's second argument — route variants/compoundVariants/
  //                  class keys appropriately; defaultVariants holds variant
  //                  names, never classes.
  function walkClassExpression(node, context) {
    if (isStringy(node)) {
      if (context === "any" || context === "class-values") addEdit(node);
      return;
    }
    if (ts.isObjectLiteralExpression(node)) {
      for (const prop of node.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const name = prop.name.getText(sourceFile).replace(/["']/g, "");
        if (context === "cva-config") {
          if (name === "defaultVariants") continue;
          if (name === "variants") {
            walkClassExpression(prop.initializer, "class-values");
          } else if (name === "compoundVariants") {
            walkClassExpression(prop.initializer, "cva-config");
          } else if (name === "class" || name === "className") {
            walkClassExpression(prop.initializer, "class-values");
          }
          // other keys inside compoundVariants objects are variant matchers — skip
        } else if (context === "class-values") {
          walkClassExpression(prop.initializer, "class-values");
        } else {
          // clsx-style object: { "classes": condition } — keys are classes
          if (isStringy(prop.name)) addEdit(prop.name);
          // values are conditions, not classes — skip
        }
      }
      return;
    }
    if (ts.isArrayLiteralExpression(node)) {
      for (const el of node.elements) walkClassExpression(el, context);
      return;
    }
    // conditional / binary expressions: cond ? "a" : "b", cond && "a"
    if (ts.isConditionalExpression(node)) {
      walkClassExpression(node.whenTrue, context);
      walkClassExpression(node.whenFalse, context);
      return;
    }
    if (ts.isBinaryExpression(node)) {
      walkClassExpression(node.left, context);
      walkClassExpression(node.right, context);
      return;
    }
    if (ts.isParenthesizedExpression(node)) {
      walkClassExpression(node.expression, context);
    }
    // identifiers / calls: leave alone (handled when their own definition is visited)
  }

  function visit(node) {
    // className="..." / className={"..."} / className={cn(...)}
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText(sourceFile) === "className" &&
      node.initializer
    ) {
      if (isStringy(node.initializer)) {
        addEdit(node.initializer);
      } else if (
        ts.isJsxExpression(node.initializer) &&
        node.initializer.expression &&
        isStringy(node.initializer.expression)
      ) {
        addEdit(node.initializer.expression);
      }
      // cn(...) inside is covered by the CallExpression branch below
    }

    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const callee = node.expression.text;
      if (callee === "cva") {
        const [base, config] = node.arguments;
        if (base) walkClassExpression(base, "any");
        if (config) walkClassExpression(config, "cva-config");
      } else if (CLASS_CALLEES.has(callee)) {
        for (const arg of node.arguments) walkClassExpression(arg, "any");
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return edits;
}

function processFile(filePath, { check }) {
  const source = readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TSX
  );

  const edits = collectEdits(sourceFile).sort((a, b) => b.start - a.start);
  if (edits.length === 0) return false;

  if (!check) {
    let output = source;
    for (const { start, end, text } of edits) {
      output = output.slice(0, start) + text + output.slice(end);
    }
    writeFileSync(filePath, output);
  }
  return true;
}

const args = process.argv.slice(2);
const check = args.includes("--check");
const fileArgs = args.filter((a) => a !== "--check");

const files =
  fileArgs.length > 0
    ? fileArgs.map((f) => resolve(f))
    : readdirSync(resolve("src/components/ui"))
        .filter((f) => f.endsWith(".tsx"))
        .map((f) => join(resolve("src/components/ui"), f));

let changed = 0;
for (const file of files) {
  if (processFile(file, { check })) {
    changed++;
    console.log(`${check ? "needs prefixing" : "prefixed"}: ${file}`);
  }
}

if (check && changed > 0) {
  console.error(
    `\n${changed} file(s) contain unprefixed Tailwind classes. Run: npm run prefix-classes`
  );
  process.exit(1);
}
console.log(changed === 0 ? "All class lists already prefixed." : `Done (${changed} file(s)).`);
