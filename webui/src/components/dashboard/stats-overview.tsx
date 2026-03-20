import type { CampaignMeta } from "@/lib/types";
import { SKILLS } from "@/lib/types";

interface StatsOverviewProps {
  campaigns: CampaignMeta[];
}

export function StatsOverview({ campaigns }: StatsOverviewProps) {
  const totalFiles = campaigns.reduce(
    (acc, c) => acc + Object.values(c.steps).filter((s) => s === "done").length,
    0
  );

  const activeCampaigns = campaigns.filter((c) =>
    Object.values(c.steps).some((s) => s === "running")
  ).length;

  const stats = [
    { label: "Campaigns", value: campaigns.length, accent: "text-slate-900" },
    { label: "Active", value: activeCampaigns, accent: "text-amber-600" },
    { label: "Files", value: totalFiles, accent: "text-emerald-600" },
    { label: "Skills", value: SKILLS.length, accent: "text-brand-600" },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="card px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {s.label}
          </p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${s.accent}`}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
