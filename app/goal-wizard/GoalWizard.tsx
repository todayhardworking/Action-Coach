"use client";

import { useMemo, useState } from "react";
import { AppBarTop } from "../../components/md3/AppBarTop";
import { StepDescription } from "../../components/md3/StepDescription";
import { StepTitle } from "../../components/md3/StepTitle";
import styles from "../../components/md3/md3.module.css";
import {
  ActionPlanItem,
  SaveGoalPayload,
  SmartFields,
  generateActions,
  generateQuestions,
  generateSmart,
  saveGoalData,
} from "../../lib/goalWizardApi";
import { Step1Goal } from "./steps/Step1Goal";
import { Step2Questions } from "./steps/Step2Questions";
import { Step3Smart } from "./steps/Step3Smart";
import { Step4Actions } from "./steps/Step4Actions";

const initialSmart: SmartFields = {
  specific: "",
  measurable: "",
  achievable: "",
  relevant: "",
  timebound: "",
};

interface GoalWizardProps {
  uid?: string;
}

export function GoalWizard({ uid }: GoalWizardProps) {
  const [step, setStep] = useState(1);
  const [goalTitle, setGoalTitle] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [smart, setSmart] = useState<SmartFields>({ ...initialSmart });
  const [actions, setActions] = useState<ActionPlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = uid || "demo-user";

  const progressTitle = useMemo(() => {
    switch (step) {
      case 1:
        return "Goal";
      case 2:
        return "Questions";
      case 3:
        return "SMART";
      case 4:
        return "Actions";
      default:
        return "Goal";
    }
  }, [step]);

  const handleGenerateQuestions = async () => {
    if (!goalTitle.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const generated = await generateQuestions(goalTitle.trim());
      setQuestions(generated);
      setAnswers(generated.map(() => ""));
      setStep(2);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to generate questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSmart = async () => {
    setLoading(true);
    setError(null);
    try {
      const { goalTitle: generatedTitle, smart: generatedSmart } = await generateSmart(goalTitle.trim(), answers);
      setGoalTitle(generatedTitle || goalTitle);
      setSmart(generatedSmart);
      setStep(3);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to generate SMART details.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateActions = async () => {
    setLoading(true);
    setError(null);
    try {
      const generatedActions = await generateActions(goalTitle.trim(), smart);
      setActions(generatedActions);
      setStep(4);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to generate actions.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: SaveGoalPayload = {
        uid: userId,
        goalTitle: goalTitle.trim(),
        smart,
        actions,
        questions,
        createdAt: new Date().toISOString(),
      };

      if (!payload.goalTitle) {
        throw new Error("Goal title is required before saving.");
      }

      if (payload.actions.length === 0) {
        throw new Error("Generate actions before saving.");
      }

      const hasValidDates = payload.actions.every((action) => {
        const deadline = (action.userDeadline || "").trim();
        return deadline && !Number.isNaN(new Date(deadline).getTime());
      });

      if (!hasValidDates) {
        throw new Error("Please add a calendar date for each action.");
      }

      await saveGoalData(payload);
      setError(null);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to save your goal.");
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (index: number, direction: "up" | "down") => {
    setActions((current) => {
      const next = [...current];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1Goal goalTitle={goalTitle} onGoalTitleChange={setGoalTitle} onNext={handleGenerateQuestions} loading={loading} />
        );
      case 2:
        return (
          <Step2Questions
            questions={questions}
            answers={answers}
            onAnswerChange={(index, value) =>
              setAnswers((current) => current.map((answer, idx) => (idx === index ? value : answer)))
            }
            onNext={handleGenerateSmart}
            loading={loading}
          />
        );
      case 3:
        return (
          <Step3Smart
            goalTitle={goalTitle}
            smart={smart}
            onGoalTitleChange={setGoalTitle}
            onUpdateField={(key, value) => setSmart((current) => ({ ...current, [key]: value }))}
            onNext={handleGenerateActions}
            loading={loading}
          />
        );
      case 4:
        return (
          <Step4Actions
            actions={actions}
            onUpdateAction={(index, key, value) =>
              setActions((current) => current.map((action, idx) => (idx === index ? { ...action, [key]: value } : action)))
            }
            onMove={handleReorder}
            onSave={handleSave}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.surfaceContainer}>
      <div className={styles.wizardShell}>
        <AppBarTop title="Set a New Goal" />
        <div className={styles.stepCard}>
          <StepTitle>{progressTitle}</StepTitle>
          <StepDescription>Follow the 4-step flow to turn your intention into an action-ready plan.</StepDescription>
        </div>
        {error ? (
          <div className={`${styles.stepCard} ${styles.textFieldError}`}>
            <p className={styles.supportText}>{error}</p>
          </div>
        ) : null}
        <div key={step} className={styles.fadeSlideIn}>
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
