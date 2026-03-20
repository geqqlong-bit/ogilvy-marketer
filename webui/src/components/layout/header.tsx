"use client";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-100 px-6">
      <div className="flex items-baseline gap-3">
        <h1 className="text-[15px] font-semibold text-slate-900">{title}</h1>
        {subtitle && (
          <span className="text-[13px] text-slate-400">{subtitle}</span>
        )}
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
