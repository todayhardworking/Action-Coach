import styles from "./md3.module.css";

interface StepIndicatorProps {
  current: number;
  total: number;
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
  return <p className={styles.stepIndicator}>Step {current} of {total}</p>;
}
