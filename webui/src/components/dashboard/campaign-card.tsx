import Link from "next/link";
import type { CampaignMeta } from "@/lib/types";
import { completionPercent, relativeTime, statusDot, cn } from "@/lib/utils";

interface CampaignCardProps {
  campaign: CampaignMeta;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const pct = completionPercent(campaign.steps);
  const isRunning = Object.values(campaign.steps).some((s) => s === "running");

  return (
    <Link href={`/campaigns/${campaign.slug}`}>
      <div className="card-hover group flex flex-col gap-3 px-5 py-4">
        {/* Top row: name + status */}
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
              {campaign.name}
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {relativeTime(campaign.updatedAt)}
            </p>
          </div>
          {isRunning && (
            <span className="badge border-amber-200 bg-amber-50 text-amber-600">
              <span className={cn("h-1.5 w-1.5 rounded-full", statusDot("running"))} />
              Running
            </span>
          )}
        </div>

        {/* Platforms */}
        {campaign.platforms.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {campaign.platforms.map((p) => (
              <span
                key={p}
                className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500"
              >
                {p}
              </span>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Progress</span>
            <span className="font-medium tabular-nums text-slate-600">{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                pct === 100 ? "bg-emerald-500" : "bg-brand-500"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Step dots */}
        <div className="flex gap-1">
          {Object.entries(campaign.steps).map(([stepId, status]) => (
            <div
              key={stepId}
              className={cn("h-1.5 flex-1 rounded-full", statusDot(status))}
              title={stepId}
            />
          ))}
        </div>
      </div>
    </Link>
  );
}
