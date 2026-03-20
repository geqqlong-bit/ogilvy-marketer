"use client";

import { useState } from "react";
import type { AgentStatus, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AgentConsoleProps {
  agentStatus: AgentStatus;
}

export function AgentConsole({ agentStatus }: AgentConsoleProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulated assistant response — in production this connects to OpenClaw
    setTimeout(() => {
      const reply: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "收到，正在处理你的请求...",
        timestamp: new Date().toISOString(),
        skill: agentStatus.currentSkill ?? undefined,
      };
      setMessages((prev) => [...prev, reply]);
    }, 500);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Status bar */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            agentStatus.status === "running"
              ? "bg-amber-500 animate-pulse"
              : agentStatus.status === "done"
                ? "bg-emerald-500"
                : "bg-slate-300"
          )}
        />
        <span className="text-[11px] font-medium text-slate-500">
          {agentStatus.status === "running" && agentStatus.currentSkill
            ? `Running ${agentStatus.currentSkill}`
            : agentStatus.status === "done"
              ? "Completed"
              : "Ready"}
        </span>
      </div>

      {/* Log / Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {/* Agent log entries */}
        {agentStatus.log.map((entry, i) => (
          <div
            key={i}
            className={cn(
              "log-entry flex items-start gap-2 text-[12px]",
              entry.level === "error" && "text-rose-600",
              entry.level === "warn" && "text-amber-600",
              entry.level === "done" && "text-emerald-600",
              entry.level === "info" && "text-slate-500",
              entry.level === "step" && "text-slate-700 font-medium"
            )}
          >
            <span className="flex-shrink-0 font-mono text-[10px] text-slate-400 mt-0.5">
              {new Date(entry.time).toLocaleTimeString("zh-CN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
            <span>{entry.message}</span>
          </div>
        ))}

        {/* Chat messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "animate-slide-in rounded-lg px-3 py-2 text-[13px]",
              msg.role === "user"
                ? "ml-8 bg-brand-50 text-brand-900"
                : "mr-8 bg-slate-50 text-slate-700"
            )}
          >
            {msg.skill && (
              <span className="mb-1 block text-[10px] font-medium text-brand-500">
                {msg.skill}
              </span>
            )}
            {msg.content}
          </div>
        ))}

        {/* Empty state */}
        {agentStatus.log.length === 0 && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-[12px] text-slate-400">
              输入指令开始工作
            </p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="输入 brief 或指令..."
            className="input flex-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              input.trim()
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : "bg-slate-100 text-slate-400"
            )}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
