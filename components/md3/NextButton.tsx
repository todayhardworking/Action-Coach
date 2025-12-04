import { ReactNode } from "react";
import styles from "./md3.module.css";

interface NextButtonProps {
  label: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}

export function NextButton({ label, onClick, disabled, type = "button" }: NextButtonProps) {
  return (
    <button type={type} className={styles.filledButton} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
