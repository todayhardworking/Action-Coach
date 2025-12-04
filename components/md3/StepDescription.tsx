import { ReactNode } from "react";
import styles from "./md3.module.css";

interface StepDescriptionProps {
  children: ReactNode;
}

export function StepDescription({ children }: StepDescriptionProps) {
  return <p className={styles.stepDescription}>{children}</p>;
}
