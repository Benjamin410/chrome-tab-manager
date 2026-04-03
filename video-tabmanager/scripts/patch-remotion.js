#!/usr/bin/env node
/**
 * Patches a bug in @remotion/bundler where setup-sequence-stack-traces.js
 * crashes with "Cannot read properties of null (reading 'stack')" when
 * React.createElement receives null props.
 */
const fs = require("fs");
const path = require("path");

const filePath = path.join(
  __dirname,
  "..",
  "node_modules",
  "@remotion",
  "bundler",
  "dist",
  "setup-sequence-stack-traces.js"
);

if (!fs.existsSync(filePath)) {
  console.log("Remotion bundler not found, skipping patch.");
  process.exit(0);
}

let content = fs.readFileSync(filePath, "utf8");

const buggyPattern = `const newProps = props.stack`;
const fixedPattern = `if (props === null || props === undefined) {\n                    return Reflect.apply(target, thisArg, [first, { stack: new Error().stack }, ...rest]);\n                }\n                const newProps = props.stack`;

if (content.includes("props === null || props === undefined")) {
  console.log("Remotion stack-traces patch already applied.");
  process.exit(0);
}

if (!content.includes(buggyPattern)) {
  console.log("Remotion stack-traces code changed, patch not needed.");
  process.exit(0);
}

content = content.replace(buggyPattern, fixedPattern);
fs.writeFileSync(filePath, content);
console.log("Remotion stack-traces null-props patch applied.");
