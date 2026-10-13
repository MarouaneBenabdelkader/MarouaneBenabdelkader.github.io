// Fails if any bilingual field is empty on one side or any content contains a forbidden name.
import { findForbidden } from "./forbidden.mjs";
import { projects } from "../content/projects";
import { profile } from "../content/profile";
import { ui } from "../content/ui";

const problems: string[] = [];

function walk(value: unknown, path: string) {
  if (typeof value === "string") {
    const word = findForbidden(value);
    if (word) problems.push(`${path}: forbidden name "${word}"`);
    return;
  }
  if (Array.isArray(value)) return value.forEach((v, i) => walk(v, `${path}[${i}]`));
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 2 && "en" in obj && "fr" in obj) {
      if (!String(obj.en).trim()) problems.push(`${path}.en is empty`);
      if (!String(obj.fr).trim()) problems.push(`${path}.fr is empty`);
    }
    for (const k of keys) walk(obj[k], `${path}.${k}`);
  }
}

walk(projects, "projects");
walk(profile, "profile");
walk(ui, "ui");

if (projects.length !== 6) problems.push(`expected 6 projects, got ${projects.length}`);

if (problems.length) {
  console.error(`FAIL (${problems.length}):\n- ` + problems.join("\n- "));
  process.exit(1);
}
console.log(`PASS: content check (${projects.length} projects)`);
