"use client";

import { MD3TextField } from "../../../components/md3/MD3TextField";
import { NextButton } from "../../../components/md3/NextButton";
import { StepCard } from "../../../components/md3/StepCard";
import { StepDescription } from "../../../components/md3/StepDescription";
import { StepIndicator } from "../../../components/md3/StepIndicator";
import { StepTitle } from "../../../components/md3/StepTitle";
import styles from "../../../components/md3/md3.module.css";
import { ActionPlanItem } from "../../../lib/goalWizardApi";

export type EditableActionField = "title" | "description" | "userDeadline";

interface Step4ActionsProps {
  actions: ActionPlanItem[];
  onUpdateAction: (index: number, key: EditableActionField, value: string) => void;
  onDelete: (index: number) => void;
  onGenerateMore: () => void;
  onSave: () => void;
  loading?: boolean;
  saving?: boolean;
  successMessage?: string | null;
  errorMessage?: string | null;
}

export function Step4Actions({
  actions,
  onUpdateAction,
  onDelete,
  onGenerateMore,
  onSave,
  loading,
  saving,
  successMessage,
  errorMessage,
}: Step4ActionsProps) {
  return (
    <StepCard elevated>
      <StepIndicator current={4} total={4} />
      <StepTitle>Your Action Plan</StepTitle>
      <StepDescription>
        These steps help you stay consistent and accountable. Edit or remove anything and request more suggestions before saving.
      </StepDescription>
      <div className={styles.contentStack}>
        {actions.map((action, index) => (
          <div key={action.actionId || `${action.title}-${index}`} className={`${styles.actionCard} ${styles.fadeSlideIn}`}>
            <div className={styles.listRow}>
              <span className={styles.iconDot} aria-hidden />
              <span className={styles.inlineLabel}>Action {index + 1}</span>
            </div>
            <MD3TextField
              label="Action title"
              value={action.title}
              onChange={(value) => onUpdateAction(index, "title", value)}
            />
            <MD3TextField
              label="Description"
              value={action.description ?? ""}
              onChange={(value) => onUpdateAction(index, "description", value)}
              multiline
              placeholder="(MD3 TextField with visible description)"
            />
            <div className={styles.inlineWrap}>
              <MD3TextField
                label="Propose timeline"
                value={action.userDeadline ?? ""}
                onChange={(value) => onUpdateAction(index, "userDeadline", value)}
                type="date"
              />
              <div className={styles.chip}>
                Suggested cadence: {action.frequency || "Set your pace"}
              </div>
            </div>
            <div className={styles.reorderButtons}>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={() => onDelete(index)}
                aria-label={`Delete action ${index + 1}`}
                disabled={loading}
              >
                ✕ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.bottomBar}>
        <div className={styles.bottomActions}>
          <button
            type="button"
            className={styles.tonalButton}
            onClick={onGenerateMore}
            disabled={loading || saving || Boolean(successMessage)}
          >
            {loading ? (
              <span className={styles.listRow}>
                <span className={styles.loader} aria-hidden />
                Generating more...
              </span>
            ) : (
              "Generate more action suggestions"
            )}
          </button>
          <NextButton
            label={
              saving ? (
                <span className={styles.listRow}>
                  <span className={styles.loader} aria-hidden />
                  Saving...
                </span>
              ) : (
                "Save Goal"
              )
            }
            onClick={onSave}
            disabled={loading || saving || Boolean(successMessage)}
          />
        </div>
        {successMessage ? (
          <div className={`${styles.stepCard} ${styles.statusCard} ${styles.statusSuccess}`} role="status">
            <span className={styles.statusIcon} aria-hidden>
              ✓
            </span>
            <div>
              <p className={styles.statusTitle}>Goal saved</p>
              <p className={styles.supportText}>{successMessage}</p>
            </div>
          </div>
        ) : null}
        {errorMessage ? (
          <div className={`${styles.stepCard} ${styles.statusCard} ${styles.statusError}`} role="alert">
            <span className={styles.statusIcon} aria-hidden>
              !
            </span>
            <div>
              <p className={styles.statusTitle}>Unable to save</p>
              <p className={styles.supportText}>{errorMessage}</p>
            </div>
          </div>
        ) : null}
      </div>
    </StepCard>
  );
}
