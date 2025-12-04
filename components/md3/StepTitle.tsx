import { ReactNode } from "react";
import styles from "./md3.module.css";

interface StepTitleProps {
  children: ReactNode;
}

export function StepTitle({ children }: StepTitleProps) {
  return <h2 className={styles.stepTitle}>{children}</h2>;
}
