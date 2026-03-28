/**
 * Builds an unpacked folder and a Chrome Web Store ZIP from the extension directory.
 * Cross-platform replacement for scripts/build.sh (Windows cannot run ./build.sh via npm).
 */

const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const projectDir = path.join(__dirname, "..");
const extDir = path.join(projectDir, "extension");
const outDir = path.join(projectDir, "dist");

/**
 * Returns true if a relative path should be excluded (matches build.sh zip -x rules).
 * @param {string} relPosix Path relative to extension root, forward slashes
 * @returns {boolean}
 */
function isIgnoredPath(relPosix) {
  const parts = relPosix.split("/").filter(Boolean);
  for (const p of parts) {
    if (p.startsWith(".")) return true;
    if (p === ".DS_Store") return true;
  }
  if (relPosix.includes("__MACOSX")) return true;
  return false;
}

/**
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * Recursively adds files under dir to the archive.
 * @param {import('archiver').Archiver} archive
 * @param {string} currentDir Absolute path
 * @param {string} relPrefix Relative path prefix (posix) or empty
 */
function walkAndAdd(archive, currentDir, relPrefix) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const ent of entries) {
    const name = ent.name;
    const rel = relPrefix ? `${relPrefix}/${name}` : name;
    const relPosix = rel.replace(/\\/g, "/");
    if (isIgnoredPath(relPosix)) continue;
    const full = path.join(currentDir, name);
    if (ent.isDirectory()) {
      walkAndAdd(archive, full, rel);
    } else {
      archive.file(full, { name: relPosix });
    }
  }
}

/**
 * Copies the extension tree to destRoot with the same exclusions as the ZIP.
 * @param {string} destRoot Absolute path to dist/tab-manager-v{version}
 */
function copyExtensionUnpacked(destRoot) {
  fs.cpSync(extDir, destRoot, {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(extDir, src);
      if (!rel) return true;
      const relPosix = rel.replace(/\\/g, "/");
      return !isIgnoredPath(relPosix);
    },
  });
}

const manifestPath = path.join(extDir, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const version = manifest.version;
const unpackDir = path.join(outDir, `tab-manager-v${version}`);
const outputFile = path.join(outDir, `tab-manager-v${version}.zip`);

console.log(`Building Tab Manager v${version}...`);

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(unpackDir)) {
  fs.rmSync(unpackDir, { recursive: true, force: true });
}
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

copyExtensionUnpacked(unpackDir);

const output = fs.createWriteStream(outputFile);
const archive = archiver("zip", { zlib: { level: 9 } });

archive.on("error", (err) => {
  console.error(err);
  process.exit(1);
});

output.on("close", () => {
  const sizeBytes = archive.pointer();
  console.log("");
  console.log(`Folder: ${unpackDir}`);
  console.log(`ZIP:    ${outputFile}`);
  console.log(`Size:   ${formatBytes(sizeBytes)}`);
  console.log("");
  console.log("Next steps:");
  console.log("  1. Go to https://chrome.google.com/webstore/devconsole");
  console.log(`  2. Click 'New Item' and upload ${outputFile}`);
  console.log("  3. Fill in the store listing (see store/listing-en.md)");
  console.log("  4. Set visibility to 'Unlisted'");
  console.log("  5. Submit for review");
});

archive.pipe(output);
walkAndAdd(archive, extDir, "");
archive.finalize();
