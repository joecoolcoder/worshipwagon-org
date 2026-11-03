import { readdir, writeFile } from "node:fs/promises";
import { extname } from "node:path";

const tracksDirectory = new URL("../assets/audio/tracks/", import.meta.url);
const catalogFile = new URL("../assets/audio/catalog.json", import.meta.url);
const supportedExtensions = new Set([".mp3", ".m4a", ".aac", ".wav"]);

function titleFromFilename(filename) {
  return filename
    .slice(0, -extname(filename).length)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const entries = await readdir(tracksDirectory, { withFileTypes: true });
const tracks = entries
  .filter((entry) => entry.isFile() && supportedExtensions.has(extname(entry.name).toLowerCase()))
  .map((entry) => ({
    title: titleFromFilename(entry.name),
    file: `/assets/audio/tracks/${entry.name}`
  }))
  .sort((first, second) => first.title.localeCompare(second.title, undefined, { numeric: true }));

await writeFile(catalogFile, `${JSON.stringify({ tracks }, null, 2)}\n`);
