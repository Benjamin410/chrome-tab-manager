/**
 * Development-only hot reload for unpacked extensions.
 * Polls all files under the extension package (fixed DirectoryReader batching);
 * when timestamps change, reloads the extension.
 * No-ops when installType is not "development" (e.g. Web Store builds).
 */

/**
 * Reads every batch from a DirectoryReader (Chrome only returns a chunk per call).
 * @param {FileSystemDirectoryEntry} dirEntry
 * @returns {Promise<FileSystemEntry[]>}
 */
function readAllEntriesFromDirectory(dirEntry) {
  return new Promise((resolve, reject) => {
    const reader = dirEntry.createReader();
    const all = [];
    const read = () => {
      reader.readEntries(
        (batch) => {
          if (batch.length === 0) {
            resolve(all);
            return;
          }
          all.push(...batch);
          read();
        },
        reject
      );
    };
    read();
  });
}

/**
 * @param {FileSystemDirectoryEntry} dirEntry
 * @returns {Promise<File[]>}
 */
async function collectAllFiles(dirEntry) {
  const entries = await readAllEntriesFromDirectory(dirEntry);
  const files = [];
  for (const e of entries) {
    if (e.name[0] === '.') continue;
    if (e.isDirectory) {
      files.push(...(await collectAllFiles(e)));
    } else {
      const file = await new Promise((res, rej) => e.file(res, rej));
      files.push(file);
    }
  }
  return files;
}

const timestampForPackage = (dirEntry) =>
  collectAllFiles(dirEntry).then((files) =>
    files
      .map((f) => `${f.name}:${f.lastModified}:${f.size}`)
      .sort()
      .join('|')
  );

const watchChanges = (dirEntry, lastSig) => {
  timestampForPackage(dirEntry)
    .then((sig) => {
      if (lastSig === null || sig === lastSig) {
        setTimeout(() => watchChanges(dirEntry, sig), 800);
      } else {
        chrome.runtime.reload();
      }
    })
    .catch(() => {
      setTimeout(() => watchChanges(dirEntry, lastSig), 2000);
    });
};

chrome.management.getSelf().then((self) => {
  if (self.installType !== 'development') return;
  if (!chrome.runtime.getPackageDirectoryEntry) return;
  chrome.runtime.getPackageDirectoryEntry((dirEntry) => {
    if (!dirEntry) return;
    watchChanges(dirEntry, null);
  });
});
