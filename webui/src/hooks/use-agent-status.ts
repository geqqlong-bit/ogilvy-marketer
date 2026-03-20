"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentStatus } from "@/lib/types";

const IDLE: AgentStatus = {
  campaignSlug: null,
  currentSkill: null,
  currentStep: null,
  status: "idle",
  log: [],
};

export function useAgentStatus(campaignSlug?: string): AgentStatus {
  const [status, setStatus] = useState<AgentStatus>(IDLE);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const url = campaignSlug
      ? `/api/agent/status?campaign=${encodeURIComponent(campaignSlug)}`
      : `/api/agent/status`;

    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        setStatus(JSON.parse(event.data));
      } catch { /* ignore malformed */ }
    };

    es.onerror = () => {
      // Reconnect is automatic with EventSource
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [campaignSlug]);

  return status;
}
