"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { WorkflowPipeline } from "@/components/campaign/workflow-pipeline";
import { FileViewer } from "@/components/campaign/file-viewer";
import { AgentConsole } from "@/components/campaign/agent-console";
import { useAgentStatus } from "@/hooks/use-agent-status";
import { completionPercent } from "@/lib/utils";
import type { CampaignDetail, StepStatus } from "@/lib/types";
import { useEffect } from "react";

export default function CampaignPage() {
  const { slug } = useParams<{ slug: string }>();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [activeStep, setActiveStep] = useState<string>("brief");
  const [showConsole, setShowConsole] = useState(true);
  const agentStatus = useAgentStatus(slug);

  useEffect(() => {
    fetch(`/api/campaigns/${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setCampaign(data);
      })
      .catch(() => {});
  }, [slug]);

  // Use agent status steps if available, else fall back to campaign data
  const steps: Record<string, StepStatus> = campaign?.steps ?? {};
  const pct = completionPercent(steps);

  return (
    <>
      <Header
        title={slug}
        subtitle={`${pct}% complete`}
        action={
          <div className="flex items-center gap-2">
            <Link href="/" className="btn-secondary text-[13px]">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
            <button
              onClick={() => setShowConsole(!showConsole)}
              className={`btn-secondary text-[13px] ${showConsole ? "bg-brand-50 text-brand-700 border-brand-200" : ""}`}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Console
            </button>
          </div>
        }
      />

      <div className="flex h-[calc(100vh-56px)]">
        {/* Left: Pipeline */}
        <div className="w-[240px] flex-shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4 scrollbar-thin">
          <WorkflowPipeline
            steps={steps}
            activeStep={activeStep}
            onSelectStep={setActiveStep}
          />
        </div>

        {/* Center: File viewer */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {campaign ? (
            <FileViewer campaignSlug={slug} stepId={activeStep} />
          ) : (
            <div className="flex h-64 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading campaign...
              </div>
            </div>
          )}
        </div>

        {/* Right: Agent console */}
        {showConsole && (
          <div className="w-[340px] flex-shrink-0 border-l border-slate-200 bg-white">
            <AgentConsole agentStatus={agentStatus} />
          </div>
        )}
      </div>
    </>
  );
}
