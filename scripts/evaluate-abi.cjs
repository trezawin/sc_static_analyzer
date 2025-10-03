// scripts/evaluate-abi.cjs
const fs = require("fs");
const path = require("path");

/** Load JSON helper */
function readJson(p) {
  const full = path.resolve(p);
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

/** Extract function signatures from ABI (name + canonical types) */
function abiFunctions(abi) {
  const fns = new Set();
  for (const e of abi || []) {
    if (e.type === "function") {
      const name = e.name;
      const inputs = (e.inputs || []).map(i => i.type).join(",");
      fns.add(`${name}(${inputs})`);
      // also index by name-only for loose matching
      fns.add(name);
    }
  }
  return fns;
}

/** Evaluate one rule against a function set */
function evalRule(rule, fnSet) {
  const miss = [];

  const hasAll = (arr) => arr.every(sig => fnSet.has(sig));
  const hasAny = (arr) => arr.some(sig => fnSet.has(sig));

  let pass = true;
  let detail = "";

  if (rule.requiresAll && rule.requiresAll.length) {
    pass = pass && hasAll(rule.requiresAll);
    if (!pass) miss.push(...rule.requiresAll.filter(s => !fnSet.has(s)));
  }
  if (rule.requiresAny && rule.requiresAny.length) {
    const ok = hasAny(rule.requiresAny);
    pass = pass && ok;
    if (!ok) miss.push(`one of: ${rule.requiresAny.join(" | ")}`);
  }

  if (!pass) {
    detail = `Missing: ${miss.join(", ")}`;
  }
  return { pass, detail };
}

function main() {
  const root = process.cwd();
  const abipaths = readJson("abipaths.json");
  const rulebook = readJson("rules/baseline.json");

  // Load ABIs and index functions
  const contracts = {};
  for (const [name, rel] of Object.entries(abipaths)) {
    try {
      const abiJson = readJson(rel);
      const abi = abiJson.abi || abiJson; // accept plain ABI or Hardhat artifact
      contracts[name] = { path: rel, fns: abiFunctions(abi) };
    } catch (e) {
      contracts[name] = { path: rel, fns: new Set(), error: String(e.message || e) };
    }
  }

  const items = [];
  let pass=0, warn=0, fail=0, info=0;

  for (const rule of rulebook.rules) {
    const c = contracts[rule.contract];
    if (!c) {
      items.push({
        id: rule.id,
        title: rule.title,
        contract: rule.contract,
        result: "FAIL",
        detail: `ABI path not configured for ${rule.contract}`
      });
      fail++; continue;
    }
    if (c.error) {
      items.push({
        id: rule.id,
        title: rule.title,
        contract: rule.contract,
        result: "FAIL",
        detail: `Could not load ABI (${c.path}): ${c.error}`
      });
      fail++; continue;
    }

    const { pass: ok, detail } = evalRule(rule, c.fns);
    if (ok) {
      items.push({ id: rule.id, title: rule.title, contract: rule.contract, result: "PASS", detail: "" });
      pass++;
    } else {
      // Mark as FAIL by default; you could downgrade to WARN for optional checks
      items.push({ id: rule.id, title: rule.title, contract: rule.contract, result: "FAIL", detail });
      fail++;
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    rulebook: rulebook.metadata,
    summary: { pass, warn, info, fail },
    items
  };

  fs.mkdirSync(path.join(root, "reports"), { recursive: true });
  const outPath = path.join(root, "reports/phase2-results.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log("[phase2] JSON written:", outPath);
}

main();