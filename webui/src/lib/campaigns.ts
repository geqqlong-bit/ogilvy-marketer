import fs from "fs";
import path from "path";
import type {
  CampaignMeta,
  CampaignDetail,
  CampaignFile,
  StepStatus,
  AgentStatus,
} from "./types";
import { WORKFLOW_STEPS } from "./types";

const CAMPAIGNS_DIR = path.resolve(process.cwd(), "..", "campaigns");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Map a campaign directory to step statuses by checking which files exist. */
function resolveSteps(campaignDir: string): Record<string, StepStatus> {
  const steps: Record<string, StepStatus> = {};

  // Read .status.json if present (agent writes this at runtime)
  const statusPath = path.join(campaignDir, ".status.json");
  let runtimeStatus: Record<string, string> = {};
  if (fs.existsSync(statusPath)) {
    try {
      runtimeStatus = JSON.parse(fs.readFileSync(statusPath, "utf-8")).steps ?? {};
    } catch { /* ignore malformed */ }
  }

  for (const step of WORKFLOW_STEPS) {
    // Runtime status takes precedence
    if (runtimeStatus[step.id]) {
      steps[step.id] = runtimeStatus[step.id] as StepStatus;
      continue;
    }

    const target = path.join(campaignDir, step.file);
    if (step.file.endsWith("/")) {
      // Directory step (content/) — done if dir exists and has files
      steps[step.id] = fs.existsSync(target) &&
        fs.readdirSync(target).filter((f) => f.endsWith(".md")).length > 0
        ? "done"
        : "pending";
    } else {
      steps[step.id] = fs.existsSync(target) ? "done" : "pending";
    }
  }

  return steps;
}

/** Detect platforms from content directory file names. */
function detectPlatforms(campaignDir: string): string[] {
  const contentDir = path.join(campaignDir, "content");
  if (!fs.existsSync(contentDir)) return [];
  return fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(".md", ""));
}

/** Get the most recent mtime among all files in a directory. */
function latestMtime(dir: string): Date {
  let latest = new Date(0);
  if (!fs.existsSync(dir)) return latest;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = latestMtime(full);
      if (sub > latest) latest = sub;
    } else {
      const stat = fs.statSync(full);
      if (stat.mtime > latest) latest = stat.mtime;
    }
  }
  return latest;
}

// ── Public API ──

export function listCampaigns(): CampaignMeta[] {
  ensureDir(CAMPAIGNS_DIR);

  const dirs = fs
    .readdirSync(CAMPAIGNS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."));

  return dirs
    .map((d) => {
      const dir = path.join(CAMPAIGNS_DIR, d.name);
      const steps = resolveSteps(dir);
      return {
        slug: d.name,
        name: d.name,
        updatedAt: latestMtime(dir).toISOString(),
        steps,
        platforms: detectPlatforms(dir),
      } satisfies CampaignMeta;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getCampaign(slug: string): CampaignDetail | null {
  const dir = path.join(CAMPAIGNS_DIR, slug);
  if (!fs.existsSync(dir)) return null;

  const steps = resolveSteps(dir);
  const files: CampaignFile[] = [];

  // Collect all markdown files and map to steps
  function collect(base: string, rel: string) {
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      const full = path.join(base, entry.name);
      const relPath = path.join(rel, entry.name);
      if (entry.isDirectory()) {
        collect(full, relPath);
      } else if (entry.name.endsWith(".md")) {
        const stat = fs.statSync(full);
        const stepId = matchStep(relPath);
        files.push({
          name: entry.name,
          path: relPath,
          stepId,
          size: stat.size,
          updatedAt: stat.mtime.toISOString(),
        });
      }
    }
  }

  collect(dir, "");

  return {
    slug,
    name: slug,
    updatedAt: latestMtime(dir).toISOString(),
    steps,
    platforms: detectPlatforms(dir),
    files,
  };
}

export function readCampaignFile(slug: string, filePath: string): string | null {
  const full = path.join(CAMPAIGNS_DIR, slug, filePath);
  // Prevent directory traversal
  if (!full.startsWith(CAMPAIGNS_DIR)) return null;
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf-8");
}

export function getAgentStatus(slug?: string): AgentStatus {
  if (slug) {
    const statusPath = path.join(CAMPAIGNS_DIR, slug, ".status.json");
    if (fs.existsSync(statusPath)) {
      try {
        return JSON.parse(fs.readFileSync(statusPath, "utf-8"));
      } catch { /* fallthrough */ }
    }
  }

  return {
    campaignSlug: slug ?? null,
    currentSkill: null,
    currentStep: null,
    status: "idle",
    log: [],
  };
}

/** Match a relative file path to its workflow step id. */
function matchStep(relPath: string): string {
  for (const step of WORKFLOW_STEPS) {
    if (step.file.endsWith("/")) {
      if (relPath.startsWith(step.file) || relPath.startsWith(step.file.slice(0, -1))) {
        return step.id;
      }
    } else if (relPath === step.file) {
      return step.id;
    }
  }
  return "other";
}
