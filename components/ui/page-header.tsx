import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "../../lib/utils";

type PageHeaderProps = PropsWithChildren<{
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}>;

export function PageHeader({ title, description, actions, className, children }: PageHeaderProps) {
  return (
    <header className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
          {description ? <p className="text-sm text-neutral-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </div>
      {children}
    </header>
  );
}
