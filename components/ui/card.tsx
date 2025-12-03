import type { PropsWithChildren } from "react";

import { cn } from "../../lib/utils";

type CardProps = PropsWithChildren<{ className?: string }>;

type StatCardProps = {
  label: string;
  value: string;
  description?: string;
  className?: string;
};

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn("rounded-2xl bg-white shadow-sm border border-neutral-200 p-6", className)}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, description, className }: StatCardProps) {
  return (
    <Card className={className}>
      <p className="text-sm text-neutral-600">{label}</p>
      <p className="mt-2 text-3xl font-bold text-neutral-900">{value}</p>
      {description ? <p className="mt-2 text-sm text-neutral-500">{description}</p> : null}
    </Card>
  );
}
