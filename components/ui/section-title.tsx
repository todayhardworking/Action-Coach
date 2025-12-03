import type { PropsWithChildren } from "react";

import { cn } from "../../lib/utils";

type SectionTitleProps = PropsWithChildren<{ title: string; className?: string; description?: string }>;

export function SectionTitle({ title, description, className, children }: SectionTitleProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-neutral-700">{title}</p>
          {description ? <p className="text-sm text-neutral-600">{description}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
