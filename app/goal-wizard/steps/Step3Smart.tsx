"use client";

import { MD3TextField } from "../../../components/md3/MD3TextField";
import { NextButton } from "../../../components/md3/NextButton";
import { StepCard } from "../../../components/md3/StepCard";
import { StepDescription } from "../../../components/md3/StepDescription";
import { StepIndicator } from "../../../components/md3/StepIndicator";
import { StepTitle } from "../../../components/md3/StepTitle";
import styles from "../../../components/md3/md3.module.css";
import { SmartFields } from "../../../lib/goalWizardApi";

interface Step3SmartProps {
  goalTitle: string;
  smart: SmartFields;
  onGoalTitleChange: (value: string) => void;
  onUpdateField: (key: keyof SmartFields, value: string) => void;
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
}

export function Step3Smart({
  goalTitle,
  smart,
  onGoalTitleChange,
  onUpdateField,
  onBack,
  onNext,
  loading,
}: Step3SmartProps) {
  const smartKeys: { key: keyof SmartFields; label: string }[] = [
    { key: "specific", label: "Specific" },
    { key: "measurable", label: "Measurable" },
    { key: "achievable", label: "Achievable" },
    { key: "relevant", label: "Relevant" },
    { key: "timebound", label: "Time-bound" },
  ];

  return (
    <StepCard elevated>
      <StepIndicator current={3} total={4} />
      <StepTitle>Make It SMART</StepTitle>
      <StepDescription>We’ll help break down your goal into actionable components. Feel free to edit any field.</StepDescription>
      <div className={styles.contentStack}>
        <MD3TextField label="Goal title" value={goalTitle} onChange={onGoalTitleChange} />
        {smartKeys.map(({ key, label }) => (
          <MD3TextField
            key={key}
            label={label}
            value={smart[key]}
            onChange={(value) => onUpdateField(key, value)}
            multiline
          />
        ))}
      </div>
      <div className={`${styles.bottomBar} ${styles.inlineActions}`}>
        <button type="button" className={styles.tonalButton} onClick={onBack} disabled={loading}>
          Back
        </button>
        <NextButton
          label={
            loading ? (
              <span className={styles.listRow}>
                <span className={styles.loader} aria-hidden />
                Shaping actions...
              </span>
            ) : (
              "Next"
            )
          }
          onClick={onNext}
          disabled={loading}
        />
      </div>
    </StepCard>
  );
}
