const fs = require("fs");
const path = require("path");
const ROOT = __dirname;
const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, "tokens.json"), "utf-8"));

function makeColorInit() {
  return [
    "const colors = {};",
    "Object.entries(tokens.color).forEach(([group, value]) => {",
    "  if (group === \"palettes\") {",
    "    Object.entries(value).forEach(([groupName, palettes]) => {",
    "      palettes.forEach((palette) => {",
    "        palette.colors.forEach((hex, i) => {",
    "          colors[groupName + \"-\" + i] = hex;",
    "        });",
    "      });",
    "    });",
    "    return;",
    "  }",
    "  if (typeof value === \"object\" && !Array.isArray(value)) {",
    "    Object.entries(value).forEach(([key, hex]) => {",
    "      colors[group + \"-\" + key] = hex;",
    "    });",
    "  }",
    "});",
  ].join("\n");
}

function genTailwind() {
  const spacing = {};
  tokens.spacing.forEach((val, i) => { spacing[i] = val + "px"; });
  const fontFamily = {};
  Object.entries(tokens.type.family).forEach(([key, name]) => {
    fontFamily[key] = ["\"" + name + "\"", key === "mono" ? "monospace" : "sans-serif"];
  });
  return [
    "const tokens = require(\"./tokens.json\");",
    "",
    makeColorInit(),
    "",
    "const spacing = " + JSON.stringify(spacing) + ";",
    "",
    "const fontFamily = " + JSON.stringify(fontFamily) + ";",
    "",
    "const fontSize = " + JSON.stringify(tokens.type.size) + ";",
    "",
    "const borderRadius = " + JSON.stringify(tokens.radius) + ";",
    "",
    "const boxShadow = " + JSON.stringify(tokens.shadow) + ";",
    "",
    "const transitionDuration = " + JSON.stringify(Object.fromEntries(Object.entries(tokens.motion.duration).map(([k, v]) => [k, v + "ms"]))) + ";",
    "",
    "const transitionTimingFunction = " + JSON.stringify(Object.fromEntries(Object.entries(tokens.motion.easing).map(([k, v]) => [k, "cubic-bezier(" + v.join(",") + ")"]))) + ";",
    "",
    "/** @type {import(\"tailwindcss\").Config} */",
    "module.exports = {",
    "  theme: {",
    "    extend: {",
    "      colors, spacing, fontFamily, fontSize, borderRadius, boxShadow,",
    "      transitionDuration, transitionTimingFunction,",
    "      fontWeight: " + JSON.stringify(tokens.type.weight) + ",",
    "      lineHeight: " + JSON.stringify(tokens.type.leading) + ",",
    "    },",
    "  },",
    "  plugins: [],",
    "};",
  ].join("\n");
}

function genNativewind() {
  const spacing = {};
  tokens.spacing.forEach((val, i) => { spacing[i] = val; });
  const borderRadius = {};
  Object.entries(tokens.radius).forEach(([key, val]) => {
    borderRadius[key] = parseInt(val, 10);
  });
  return [
    "const tokens = require(\"./tokens.json\");",
    "",
    makeColorInit(),
    "",
    "const spacing = " + JSON.stringify(spacing) + ";",
    "",
    "const borderRadius = " + JSON.stringify(borderRadius) + ";",
    "",
    "const fontSize = " + JSON.stringify(tokens.type.size) + ";",
    "",
    "const fontFamily = " + JSON.stringify(tokens.type.family) + ";",
    "",
    "/** @type {import(\"tailwindcss\").Config} */",
    "module.exports = {",
    "  theme: {",
    "    extend: {",
    "      colors, spacing, borderRadius, fontSize, fontFamily,",
    "    },",
    "  },",
    "};",
  ].join("\n");
}

function genIndex() {
  return [
    "import raw from \"./tokens.json\";",
    "",
    "export type DesignTokens = typeof raw;",
    "",
    "export const tokens: DesignTokens = raw;",
    "",
    "export function getColor(path: string): string {",
    "  const parts = path.split(\".\");",
    "  let current: unknown = tokens.color;",
    "  for (const part of parts) {",
    "    if (current == null || typeof current !== \"object\") return \"\";",
    "    current = (current as Record<string, unknown>)[part];",
    "  }",
    "  return typeof current === \"string\" ? current : \"\";",
    "}",
    "",
    "export function getSpacing(index: number): number {",
    "  return tokens.spacing[index] ?? 0;",
    "}",
    "",
    "export type { DesignTokens as default };",
  ].join("\n");
}

fs.writeFileSync(path.join(ROOT, "tailwind.preset.js"), genTailwind());
console.log("+ tailwind.preset.js");
fs.writeFileSync(path.join(ROOT, "nativewind.preset.js"), genNativewind());
console.log("+ nativewind.preset.js");
fs.writeFileSync(path.join(ROOT, "index.ts"), genIndex());
console.log("+ index.ts");
console.log("Build complete.");