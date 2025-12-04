import { ReactNode } from "react";
import styles from "./md3.module.css";

interface StepCardProps {
  children: ReactNode;
  elevated?: boolean;
  className?: string;
}

export function StepCard({ children, elevated = false, className }: StepCardProps) {
  const classNames = [styles.stepCard, elevated ? styles.stepCardElevated : "", className]
    .filter(Boolean)
    .join(" ");

  return <section className={classNames}>{children}</section>;
}
