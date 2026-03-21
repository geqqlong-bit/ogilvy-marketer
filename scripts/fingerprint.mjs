#!/usr/bin/env node
/**
 * fingerprint.mjs — Zero-width Unicode watermarking for SKILL.md files
 *
 * Usage:
 *   node scripts/fingerprint.mjs --embed <skills-dir> [--id <hex-id>]
 *   node scripts/fingerprint.mjs --extract <file>
 *   node scripts/fingerprint.mjs --verify <skills-dir>
 *
 * Encoding scheme:
 *   - \u200B (zero-width space)      = binary 0
 *   - \u200C (zero-width non-joiner) = binary 1
 *   - \u200D (zero-width joiner)     = start marker
 *   - \uFEFF (BOM / zero-width no-break space) = end marker
 *
 * The fingerprint is injected after the YAML frontmatter closing "---" line.
 * It is completely invisible in rendered markdown and most editors.
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  statSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash, randomBytes } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Zero-width encoding ─────────────────────────────────────────────────────

const ZW_ZERO = "\u200B";   // zero-width space
const ZW_ONE  = "\u200C";   // zero-width non-joiner
const ZW_START = "\u200D";  // zero-width joiner (start marker)
const ZW_END  = "\uFEFF";   // BOM (end marker)

/**
 * Encode a hex string (installation ID) into zero-width characters.
 * Format: START + binary-encoded-hex + END
 */
function encode(hexId) {
  const binary = BigInt("0x" + hexId).toString(2).padStart(hexId.length * 4, "0");
  const encoded = binary
    .split("")
    .map((b) => (b === "0" ? ZW_ZERO : ZW_ONE))
    .join("");
  return ZW_START + encoded + ZW_END;
}

/**
 * Extract and decode the fingerprint from text content.
 * Returns the hex ID or null if not found.
 */
function decode(text) {
  const startIdx = text.indexOf(ZW_START);
  if (startIdx < 0) return null;

  const endIdx = text.indexOf(ZW_END, startIdx + 1);
  if (endIdx < 0) return null;

  const zwBlock = text.slice(startIdx + 1, endIdx);
  let binary = "";
  for (const ch of zwBlock) {
    if (ch === ZW_ZERO) binary += "0";
    else if (ch === ZW_ONE) binary += "1";
    // ignore any other chars
  }

  if (binary.length === 0) return null;

  try {
    const hex = BigInt("0b" + binary).toString(16).padStart(binary.length / 4, "0");
    return hex;
  } catch {
    return null;
  }
}

/**
 * Strip any existing fingerprint from text.
 */
function strip(text) {
  const re = new RegExp(
    `[${ZW_START}][${ZW_ZERO}${ZW_ONE}]*[${ZW_END}]`,
    "g"
  );
  return text.replace(re, "");
}

/**
 * Inject fingerprint into SKILL.md content (after frontmatter closing ---).
 */
function inject(content, hexId) {
  // Strip any existing fingerprint first
  const clean = strip(content);
  const marker = encode(hexId);

  // Find the closing --- of YAML frontmatter
  // Frontmatter: first line is ---, find next ---
  const lines = clean.split("\n");
  if (lines[0].trim() !== "---") {
    // No frontmatter, inject at very start
    return marker + clean;
  }

  // Find closing ---
  let closingIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      closingIdx = i;
      break;
    }
  }

  if (closingIdx < 0) {
    return marker + clean;
  }

  // Insert fingerprint at the end of the closing --- line (invisible)
  lines[closingIdx] = lines[closingIdx] + marker;
  return lines.join("\n");
}

// ── File-level hashing ──────────────────────────────────────────────────────

function hashContent(content) {
  return createHash("sha256").update(strip(content)).digest("hex").slice(0, 16);
}

// ── Commands ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];

function getArg(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] ?? null : null;
}

function findSkillFiles(skillsDir) {
  const files = [];
  for (const entry of readdirSync(skillsDir)) {
    const skillMd = join(skillsDir, entry, "SKILL.md");
    if (existsSync(skillMd) && statSync(skillMd).isFile()) {
      files.push({ name: entry, path: skillMd });
    }
  }
  return files;
}

if (command === "--embed") {
  const skillsDir = args[1];
  if (!skillsDir || !existsSync(skillsDir)) {
    process.stderr.write("Usage: fingerprint.mjs --embed <skills-dir> [--id <hex>]\n");
    process.exit(1);
  }

  // Generate or use provided installation ID (8 hex chars = 32 bits)
  let installId = getArg("--id");
  if (!installId) {
    installId = randomBytes(4).toString("hex"); // 8 hex chars
  }

  const timestamp = new Date().toISOString();
  const files = findSkillFiles(skillsDir);
  const manifest = {
    installationId: installId,
    installedAt: timestamp,
    version: "2.0",
    files: {},
  };

  for (const { name, path } of files) {
    const content = readFileSync(path, "utf-8");
    const watermarked = inject(content, installId);
    writeFileSync(path, watermarked, "utf-8");
    manifest.files[name] = {
      hash: hashContent(content),
      size: watermarked.length,
    };
  }

  // Write manifest
  const manifestPath = join(skillsDir, ".mc-manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

  process.stdout.write(JSON.stringify({ installationId: installId, filesProcessed: files.length }) + "\n");
}

else if (command === "--extract") {
  const filePath = args[1];
  if (!filePath || !existsSync(filePath)) {
    process.stderr.write("Usage: fingerprint.mjs --extract <file>\n");
    process.exit(1);
  }

  const content = readFileSync(filePath, "utf-8");
  const id = decode(content);

  if (id) {
    process.stdout.write(JSON.stringify({ found: true, installationId: id }) + "\n");
  } else {
    process.stdout.write(JSON.stringify({ found: false }) + "\n");
  }
}

else if (command === "--verify") {
  const skillsDir = args[1];
  if (!skillsDir || !existsSync(skillsDir)) {
    process.stderr.write("Usage: fingerprint.mjs --verify <skills-dir>\n");
    process.exit(1);
  }

  const manifestPath = join(skillsDir, ".mc-manifest.json");
  if (!existsSync(manifestPath)) {
    process.stdout.write(JSON.stringify({ valid: false, reason: "no manifest" }) + "\n");
    process.exit(0);
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch {
    process.stdout.write(JSON.stringify({ valid: false, reason: "corrupt manifest" }) + "\n");
    process.exit(0);
  }

  const results = { valid: true, installationId: manifest.installationId, files: {} };

  for (const [name, meta] of Object.entries(manifest.files)) {
    const skillMd = join(skillsDir, name, "SKILL.md");
    if (!existsSync(skillMd)) {
      results.files[name] = { status: "missing" };
      results.valid = false;
      continue;
    }

    const content = readFileSync(skillMd, "utf-8");
    const extractedId = decode(content);
    const currentHash = hashContent(content);

    if (extractedId !== manifest.installationId) {
      results.files[name] = { status: "fingerprint_mismatch", expected: manifest.installationId, found: extractedId };
      results.valid = false;
    } else if (currentHash !== meta.hash) {
      results.files[name] = { status: "content_modified", expectedHash: meta.hash, currentHash };
      results.valid = false;
    } else {
      results.files[name] = { status: "ok" };
    }
  }

  process.stdout.write(JSON.stringify(results, null, 2) + "\n");
}

else {
  process.stderr.write(
    "fingerprint.mjs — Zero-width Unicode watermarking\n\n" +
    "Commands:\n" +
    "  --embed  <skills-dir> [--id <hex>]  Watermark all SKILL.md files\n" +
    "  --extract <file>                     Extract fingerprint from a file\n" +
    "  --verify  <skills-dir>               Verify installation integrity\n"
  );
  process.exit(1);
}
