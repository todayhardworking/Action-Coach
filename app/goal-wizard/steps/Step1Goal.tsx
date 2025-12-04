"use client";

import { MD3TextField } from "../../../components/md3/MD3TextField";
import { NextButton } from "../../../components/md3/NextButton";
import { StepCard } from "../../../components/md3/StepCard";
import { StepDescription } from "../../../components/md3/StepDescription";
import { StepIndicator } from "../../../components/md3/StepIndicator";
import { StepTitle } from "../../../components/md3/StepTitle";
import styles from "../../../components/md3/md3.module.css";

interface Step1GoalProps {
  goalTitle: string;
  onGoalTitleChange: (value: string) => void;
  onNext: () => void;
  loading?: boolean;
}

export function Step1Goal({ goalTitle, onGoalTitleChange, onNext, loading }: Step1GoalProps) {
  return (
    <StepCard elevated>
      <StepIndicator current={1} total={4} />
      <StepTitle>What goal do you want to achieve?</StepTitle>
      <StepDescription>
        This helps us generate personalized guidance for you. Keep it simple and focused on the outcome you want.
      </StepDescription>
      <div className={styles.topSpacing}>
        <MD3TextField label="Your Goal" value={goalTitle} onChange={onGoalTitleChange} placeholder="e.g. Improve my fitness" multiline />
      </div>
      <div className={`${styles.bottomBar} ${styles.fadeSlideIn}`}>
        <NextButton
          label={
            loading ? (
              <span className={styles.listRow}>
                <span className={styles.loader} aria-hidden />
                Generating...
              </span>
            ) : (
              "Next"
            )
          }
          onClick={onNext}
          disabled={loading || goalTitle.trim().length === 0}
        />
      </div>
    </StepCard>
  );
}
