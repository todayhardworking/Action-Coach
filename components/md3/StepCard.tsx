import { ReactNode } from "react";
import styles from "./md3.module.css";

interface StepCardProps {
  children: ReactNode;
  elevated?: boolean;
}

export function StepCard({ children, elevated = false }: StepCardProps) {
  return <section className={`${styles.stepCard} ${elevated ? styles.stepCardElevated : ""}`}>{children}</section>;
}
