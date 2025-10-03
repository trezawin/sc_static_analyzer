import fs from "fs";
import path from "path";

type AbiItem = { type: string; name?: string };
type Artifact = { abi: AbiItem[] };
type MapPaths = Record<string, string>;

const root = process.cwd();
const abipathsPath = path.join(root, "abipaths.json");

const map: MapPaths = JSON.parse(fs.readFileSync(abipathsPath, "utf8"));

for (const [label, rel] of Object.entries(map)) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    console.error(`❌ Missing: ${label} → ${rel}`);
    continue;
  }
  const art: Artifact = JSON.parse(fs.readFileSync(p, "utf8"));
  const fnNames = (art.abi || [])
    .filter(i => i.type === "function" && i.name)
    .slice(0, 6)
    .map(i => i.name);
  console.log(`✅ ${label}: ${fnNames.join(", ") || "(no functions?)"}`);
}