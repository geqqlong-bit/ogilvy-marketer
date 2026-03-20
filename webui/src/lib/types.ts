// ── Workflow ──

export type StepStatus = "done" | "running" | "pending" | "error";

export interface WorkflowStep {
  id: string;
  name: string;
  nameCn: string;
  file: string;
  skill: string;
  optional?: boolean;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: "brief", name: "Brief", nameCn: "需求分诊", file: "brief.md", skill: "mc-campaign" },
  { id: "research", name: "Research", nameCn: "市场调研", file: "research.md", skill: "mc-research", optional: true },
  { id: "strategy", name: "Strategy", nameCn: "策略规划", file: "strategy.md", skill: "mc-campaign" },
  { id: "content", name: "Content", nameCn: "内容生产", file: "content/", skill: "mc-content" },
  { id: "geo", name: "GEO", nameCn: "GEO 优化", file: "geo.md", skill: "mc-geo", optional: true },
  { id: "automation", name: "Automation", nameCn: "营销自动化", file: "automation.md", skill: "mc-automation", optional: true },
  { id: "dtc", name: "DTC", nameCn: "独立站蓝图", file: "dtc.md", skill: "mc-dtc", optional: true },
  { id: "channel", name: "Channel", nameCn: "渠道排布", file: "channel.md", skill: "mc-campaign" },
  { id: "analytics", name: "Analytics", nameCn: "数据分析", file: "analytics.md", skill: "mc-analytics", optional: true },
  { id: "compete", name: "Compete", nameCn: "竞品情报", file: "compete.md", skill: "mc-compete", optional: true },
  { id: "review", name: "Review", nameCn: "品牌+合规审核", file: "review.md", skill: "mc-review" },
  { id: "report", name: "Report", nameCn: "复盘报告", file: "report.md", skill: "mc-report", optional: true },
];

// ── Campaign ──

export interface CampaignMeta {
  slug: string;
  name: string;
  updatedAt: string;
  steps: Record<string, StepStatus>;
  platforms: string[];
  activeSkill?: string;
}

export interface CampaignDetail extends CampaignMeta {
  files: CampaignFile[];
}

export interface CampaignFile {
  name: string;
  path: string;
  stepId: string;
  size: number;
  updatedAt: string;
}

// ── Agent ──

export interface AgentStatus {
  campaignSlug: string | null;
  currentSkill: string | null;
  currentStep: string | null;
  status: "idle" | "running" | "done" | "error";
  log: AgentLogEntry[];
}

export interface AgentLogEntry {
  time: string;
  level: "info" | "step" | "warn" | "error" | "done";
  message: string;
}

// ── Chat ──

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  skill?: string;
}

// ── Skills ──

export interface SkillInfo {
  id: string;
  name: string;
  description: string;
  standalone: boolean;
}

export const SKILLS: SkillInfo[] = [
  { id: "mc-campaign", name: "Campaign", description: "全流程作战编排", standalone: true },
  { id: "mc-research", name: "Research", description: "市场调研", standalone: true },
  { id: "mc-content", name: "Content", description: "单平台内容生产", standalone: true },
  { id: "mc-geo", name: "GEO", description: "AI 搜索引擎优化", standalone: true },
  { id: "mc-automation", name: "Automation", description: "营销自动化", standalone: true },
  { id: "mc-dtc", name: "DTC", description: "海外独立站全栈蓝图", standalone: true },
  { id: "mc-analytics", name: "Analytics", description: "数据分析与诊断", standalone: true },
  { id: "mc-review", name: "Review", description: "品牌调性+合规双审", standalone: true },
  { id: "mc-compete", name: "Compete", description: "竞品情报分析", standalone: true },
  { id: "mc-report", name: "Report", description: "Campaign 复盘与周报", standalone: true },
];
