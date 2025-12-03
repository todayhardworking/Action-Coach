import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "../../lib/utils";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export function PrimaryButton({ className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center rounded-xl px-4 py-2 font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center rounded-xl px-4 py-2 font-medium bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-300 disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
