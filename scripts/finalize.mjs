#!/usr/bin/env node
/**
 * finalize.mjs — Post-processing wrapper
 *
 * Usage:
 *   node scripts/finalize.mjs \
 *     --slug    <campaign-slug>      required
 *     --step    <step-id>            required  (e.g. "strategy", "content")
 *     --file    <relative-path>      required  (e.g. "strategy.md")
 *     --input   <temp-file-path>     optional  (read from file instead of stdin)
 *     --skill   <skill-name>         optional  (for log labeling)
 *     --done                         optional  (mark full campaign as done)
 *
 * What this does:
 *   1. Reads the full markdown content from --input file or stdin
 *   2. Writes it to campaigns/{slug}/{file}
 *   3. Updates campaigns/{slug}/.status.json  →  powers the WebUI SSE
 *   4. Extracts the delivery card (━━━ block) from the content
 *   5. Prints ONLY the delivery card to stdout  (suppresses full doc from chat)
 *
 * The calling agent must output ONLY what this script prints — this is the
 * code-level enforcement that full documents stay in files, not in chat.
 */

import {
  writeFileSync,
  readFileSync,
  mkdirSync,
  existsSync,
  unlinkSync,
} from "fs";
import { resolve, join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CAMPAIGNS_DIR = resolve(__dirname, "..", "campaigns");

// ── Signature verification ──────────────────────────────────────────────────
// Checks that the calling skill's SKILL.md has a valid fingerprint and
// matches the installation manifest. Logs warnings but does NOT block execution.

const ZW_START = "\u200D";
const ZW_END   = "\uFEFF";
const ZW_ZERO  = "\u200B";
const ZW_ONE   = "\u200C";

function extractFingerprint(text) {
  const startIdx = text.indexOf(ZW_START);
  if (startIdx < 0) return null;
  const endIdx = text.indexOf(ZW_END, startIdx + 1);
  if (endIdx < 0) return null;
  const zwBlock = text.slice(startIdx + 1, endIdx);
  let binary = "";
  for (const ch of zwBlock) {
    if (ch === ZW_ZERO) binary += "0";
    else if (ch === ZW_ONE) binary += "1";
  }
  if (binary.length === 0) return null;
  try {
    return BigInt("0b" + binary).toString(16).padStart(binary.length / 4, "0");
  } catch { return null; }
}

function stripFingerprint(text) {
  return text.replace(new RegExp(`[${ZW_START}][${ZW_ZERO}${ZW_ONE}]*[${ZW_END}]`, "g"), "");
}

function verifyInstallation(skillName) {
  // Find the skills directory (sibling of scripts/)
  const skillsDir = resolve(__dirname, "..", "skills");
  const manifestPath = join(skillsDir, ".mc-manifest.json");

  if (!existsSync(manifestPath)) {
    process.stderr.write("[finalize] ⚠ No installation manifest found — unverified copy\n");
    return { verified: false, reason: "no-manifest" };
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch {
    process.stderr.write("[finalize] ⚠ Corrupt manifest — unverified copy\n");
    return { verified: false, reason: "corrupt-manifest" };
  }

  // Check the specific skill file
  const target = skillName || "mc-dispatch";
  const skillMd = join(skillsDir, target, "SKILL.md");
  if (!existsSync(skillMd)) {
    return { verified: false, reason: "skill-not-found" };
  }

  const content = readFileSync(skillMd, "utf-8");
  const fpId = extractFingerprint(content);

  if (!fpId) {
    process.stderr.write("[finalize] ⚠ No fingerprint in SKILL.md — possible unauthorized copy\n");
    return { verified: false, reason: "no-fingerprint" };
  }

  if (fpId !== manifest.installationId) {
    process.stderr.write("[finalize] ⚠ Fingerprint mismatch — possible tampered copy\n");
    return { verified: false, reason: "fingerprint-mismatch" };
  }

  // Verify content hash
  const meta = manifest.files?.[target];
  if (meta) {
    const hash = createHash("sha256").update(stripFingerprint(content)).digest("hex").slice(0, 16);
    if (hash !== meta.hash) {
      process.stderr.write("[finalize] ⚠ Content hash mismatch — skill file modified\n");
      return { verified: false, reason: "hash-mismatch" };
    }
  }

  return { verified: true, installationId: fpId };
}

// ── Arg parsing ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] ?? null : null;
};
const has = (flag) => args.includes(flag);

const slug = get("--slug");
const step = get("--step");
const file = get("--file");
const inputPath = get("--input");
const skill = get("--skill");
const markDone = has("--done");

if (!slug || !step || !file) {
  process.stderr.write(
    "Usage: finalize.mjs --slug <slug> --step <step> --file <filename> [--input <file>]\n"
  );
  process.exit(1);
}

// ── Verify installation signature ─────────────────────────────────────────────

const verification = verifyInstallation(skill);
if (!verification.verified) {
  // Log warning but continue — soft enforcement
  process.stderr.write(
    `[finalize] Installation verification: ${verification.reason}\n`
  );
}

// ── Read content ──────────────────────────────────────────────────────────────

let content;

if (inputPath) {
  if (!existsSync(inputPath)) {
    process.stderr.write(`[finalize] Input file not found: ${inputPath}\n`);
    process.exit(1);
  }
  content = readFileSync(inputPath, "utf-8");
  // Clean up temp file
  try {
    unlinkSync(inputPath);
  } catch {
    // Non-fatal
  }
} else {
  // Read from stdin
  const chunks = [];
  process.stdin.setEncoding("utf-8");
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  content = chunks.join("");
}

if (!content.trim()) {
  process.stderr.write("[finalize] Warning: empty content received\n");
}

// ── Write to campaign directory ───────────────────────────────────────────────

const campaignDir = join(CAMPAIGNS_DIR, slug);
const targetPath = join(campaignDir, file);
const targetDir = dirname(targetPath);

// Safety: prevent directory traversal
if (!targetPath.startsWith(campaignDir)) {
  process.stderr.write("[finalize] Error: file path escapes campaign directory\n");
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });
writeFileSync(targetPath, content, "utf-8");

// ── Update .status.json ───────────────────────────────────────────────────────

const statusPath = join(campaignDir, ".status.json");
let status = {};

if (existsSync(statusPath)) {
  try {
    status = JSON.parse(readFileSync(statusPath, "utf-8"));
  } catch {
    // Reset on corrupt
  }
}

const now = new Date().toISOString();

if (!status.steps) status.steps = {};
status.steps[step] = { status: "done", completedAt: now, file };

status.updatedAt = now;
status.currentStep = step;
status.currentSkill = skill ?? status.currentSkill ?? null;

if (markDone) {
  status.status = "done";
  status.completedAt = now;
} else {
  // Keep running unless all non-optional steps are done
  status.status = "running";
}

if (!status.log) status.log = [];
status.log.push({
  time: now,
  level: "done",
  message: `✓ ${step} → ${file} (${formatBytes(content.length)})`,
});

if (status.log.length > 200) {
  status.log = status.log.slice(-200);
}

writeFileSync(statusPath, JSON.stringify(status, null, 2), "utf-8");

// ── Extract and print delivery card ──────────────────────────────────────────
//
// Looks for the delivery card block bounded by ━━━━━ lines.
// If not found, prints a minimal fallback card.

const BORDER = "━";
// Greedy match: from first ━━━ border to the LAST ━━━ border in the content
const cardPattern = /━{5,}[\s\S]*━{5,}/;
const cardMatch = content.match(cardPattern);

if (cardMatch) {
  process.stdout.write(cardMatch[0].trim() + "\n");
} else {
  // Fallback delivery card
  const fileSize = formatBytes(content.length);
  const fallback = [
    "━".repeat(40),
    `✅ ${skill ?? step} · 执行完成`,
    "━".repeat(40),
    `📁 文件：campaigns/${slug}/${file}  (${fileSize})`,
    ``,
    `📌 执行摘要`,
    `   · 内容已写入文件，请打开查看完整产出`,
    ``,
    `➡️  下一步：查看文件后继续`,
    "━".repeat(40),
  ].join("\n");
  process.stdout.write(fallback + "\n");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(n) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}
