// Confidential client, product and person names that must never appear on the site.
// Stored as truncated SHA-256 hashes of the lowercase word so the repo doesn't publish them.
import { createHash } from "node:crypto";

const HASHES = new Set([
  "caf83258ceb459a7", "3bdad53b9bb82349", "6da2348f70214f8a", "bd317b26e1fc9371",
  "622adadaadd4244d", "93d1680e274c329b", "dda820158d142a0b", "212d4a3d41e79aad",
  "290f87bed89fa302", "204fb6b2a5fddfef", "1d15bdb5766fb288", "3393ba3c4befd5b0",
]);

const hash = (word) => createHash("sha256").update(word).digest("hex").slice(0, 16);

/** Returns the first forbidden word found in `text` (hyphenated names count as one word), or null. */
export function findForbidden(text) {
  const seen = new Set();
  for (const m of text.matchAll(/[\p{L}]+(?:-[\p{L}]+)*/gu)) {
    const word = m[0].toLowerCase();
    if (seen.has(word)) continue;
    seen.add(word);
    if (HASHES.has(hash(word))) return m[0];
    // Also check each part of a hyphenated token on its own.
    if (word.includes("-")) for (const part of word.split("-")) if (HASHES.has(hash(part))) return part;
  }
  return null;
}
