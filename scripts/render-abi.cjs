// scripts/render-abi.cjs
const fs = require("fs");
const path = require("path");

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function badge(result) {
  const colors = {
    PASS: "#10B981",
    FAIL: "#EF4444",
    WARN: "#F59E0B",
    INFO: "#3B82F6"
  };
  const bg = colors[result] || "#6B7280";
  return `<span style="background:${bg};color:white;border-radius:4px;padding:2px 8px;font-weight:600">${result}</span>`;
}

function main() {
  const root = process.cwd();
  const inPath = path.join(root, "reports/phase2-results.json");
  const data = JSON.parse(fs.readFileSync(inPath, "utf8"));

  const rows = (data.items || []).map(it => {
    return `<tr>
      <td style="padding:8px;border-top:1px solid #eee">${esc(it.id)}</td>
      <td style="padding:8px;border-top:1px solid #eee">${esc(it.title)}</td>
      <td style="padding:8px;border-top:1px solid #eee">${esc(it.contract)}</td>
      <td style="padding:8px;border-top:1px solid #eee;text-align:center">${badge(it.result)}</td>
      <td style="padding:8px;border-top:1px solid #eee">${esc(it.detail || "")}</td>
    </tr>`;
  }).join("\n");

  const { pass=0, warn=0, info=0, fail=0 } = data.summary || {};

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Phase 2 (ABI) — ${esc(data.rulebook?.name || "Report")}</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; padding:24px; color:#111">
  <h1 style="margin:0 0 8px">Phase 2 (ABI) — ${esc(data.rulebook?.name || "ERC-3643 Baseline")}</h1>
  <div style="color:#6B7280">Generated: ${esc(data.generatedAt)}</div>
  <div style="display:flex; gap:12px; margin:16px 0">
    <div>✅ Pass: <strong>${pass}</strong></div>
    <div>⚠️ Warn: <strong>${warn}</strong></div>
    <div>ℹ️ Info: <strong>${info}</strong></div>
    <div>❌ Fail: <strong>${fail}</strong></div>
  </div>

  <table style="border-collapse:collapse; width:100%; font-size:14px">
    <thead>
      <tr style="text-align:left;border-bottom:2px solid #e5e7eb">
        <th style="padding:8px">Rule</th>
        <th style="padding:8px">Description</th>
        <th style="padding:8px">Contract</th>
        <th style="padding:8px">Result</th>
        <th style="padding:8px">Detail</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  const outPath = path.join(root, "reports/phase2-report.html");
  fs.writeFileSync(outPath, html);
  console.log("[phase2] HTML written:", outPath);
}

main();