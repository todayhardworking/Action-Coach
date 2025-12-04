"use client";

import { MD3TextField } from "../../../components/md3/MD3TextField";
import { NextButton } from "../../../components/md3/NextButton";
import { StepCard } from "../../../components/md3/StepCard";
import { StepDescription } from "../../../components/md3/StepDescription";
import { StepIndicator } from "../../../components/md3/StepIndicator";
import { StepTitle } from "../../../components/md3/StepTitle";
import styles from "../../../components/md3/md3.module.css";

interface Step2QuestionsProps {
  questions: string[];
  answers: string[];
  onQuestionChange: (index: number, value: string) => void;
  onAnswerChange: (index: number, value: string) => void;
  onBack: () => void;
  onNext: () => void;
  loading?: boolean;
}

export function Step2Questions({
  questions,
  answers,
  onQuestionChange,
  onAnswerChange,
  onBack,
  onNext,
  loading,
}: Step2QuestionsProps) {
  return (
    <StepCard elevated>
      <StepIndicator current={2} total={4} />
      <StepTitle>Reflect on Your Goal</StepTitle>
      <StepDescription>Answer these questions to help refine your direction. Adjust them if you need to.</StepDescription>
      <div className={styles.contentStack}>
        {questions.length === 0 ? (
          <p className={styles.supportText}>No questions yet. Try generating again from the previous step.</p>
        ) : (
          questions.map((question, index) => (
            <div key={`${question}-${index}`} className={`${styles.actionCard} ${styles.fadeSlideIn}`}>
              <MD3TextField label={`Question ${index + 1}`} value={question} onChange={(value) => onQuestionChange(index, value)} />
              <MD3TextField
                label="Your Answer"
                value={answers[index] ?? ""}
                onChange={(value) => onAnswerChange(index, value)}
                multiline
                placeholder="Write a brief response"
              />
            </div>
          ))
        )}
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
                Thinking...
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
