import { listCampaigns } from "@/lib/campaigns";
import { Header } from "@/components/layout/header";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { CampaignCard } from "@/components/dashboard/campaign-card";
import { SKILLS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const campaigns = listCampaigns();

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={`${campaigns.length} campaigns`}
        action={
          <button className="btn-primary text-[13px]">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Campaign
          </button>
        }
      />

      <div className="space-y-6 p-6">
        {/* Stats */}
        <StatsOverview campaigns={campaigns} />

        {/* Campaigns grid */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Campaigns</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search..."
                className="input w-48 text-[12px]"
              />
            </div>
          </div>

          {campaigns.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((c) => (
                <CampaignCard key={c.slug} campaign={c} />
              ))}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">还没有 Campaign</p>
                <p className="mt-1 text-[12px] text-slate-400">
                  创建你的第一个营销作战计划
                </p>
              </div>
              <button className="btn-primary mt-2 text-[13px]">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Campaign
              </button>
            </div>
          )}
        </section>

        {/* Skills overview */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Skills</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {SKILLS.map((skill) => (
              <div key={skill.id} className="card-hover px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-[10px] font-bold text-brand-600">
                    {skill.name.charAt(0)}
                  </div>
                  <span className="text-[13px] font-medium text-slate-700">
                    {skill.name}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
                  {skill.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
