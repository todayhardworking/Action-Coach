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
  generateMoreActions,
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const userId = uid?.trim();

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
    setSuccess(null);
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
    setSuccess(null);
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
    setSuccess(null);
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

  const handleGenerateMoreActions = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const generatedActions = await generateMoreActions(goalTitle.trim(), smart, actions);
      setActions((current) => {
        const existingTitles = new Set(current.map((action) => action.title.toLowerCase()));
        const filtered = generatedActions.filter(
          (action) => !existingTitles.has(action.title.toLowerCase()),
        );
        return [...current, ...filtered];
      });
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to generate actions.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (!userId) {
        throw new Error("Please sign in again before saving your goal.");
      }

      const trimmedSmart: SmartFields = {
        specific: smart.specific.trim(),
        measurable: smart.measurable.trim(),
        achievable: smart.achievable.trim(),
        relevant: smart.relevant.trim(),
        timebound: smart.timebound.trim(),
      };

      const payload: SaveGoalPayload = {
        uid: userId,
        goalTitle: goalTitle.trim(),
        smart: trimmedSmart,
        actions: actions.map((action) => ({
          ...action,
          title: action.title.trim(),
          description: (action.description || "").trim(),
          userDeadline: (action.userDeadline || "").trim(),
        })),
        questions,
        createdAt: new Date().toISOString(),
      };

      const hasSmartGaps = Object.values(trimmedSmart).some((value) => !value);
      if (!payload.goalTitle) {
        throw new Error("Goal title is required before saving.");
      }

      if (hasSmartGaps) {
        throw new Error("Please complete your SMART details before saving.");
      }

      if (payload.actions.length === 0) {
        throw new Error("Generate actions before saving.");
      }

      const hasValidActionTitles = payload.actions.every((action) => action.title.length > 0);
      if (!hasValidActionTitles) {
        throw new Error("Please add a title for each action before saving.");
      }

      const hasValidActionDescriptions = payload.actions.every(
        (action) => (action.description ?? "").length > 0,
      );
      if (!hasValidActionDescriptions) {
        throw new Error("Please add a description for each action before saving.");
      }

      const hasValidDates = payload.actions.every((action) => {
        const deadline = action.userDeadline;
        return deadline && !Number.isNaN(new Date(deadline).getTime());
      });

      if (!hasValidDates) {
        throw new Error("Please add a calendar date for each action.");
      }

      const response = await saveGoalData(payload);
      if (!response.success) {
        throw new Error(response.error || "Unable to save your goal.");
      }

      setSuccess("Your goal plan has been saved. You can revisit it anytime in your dashboard.");
      setError(null);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "Unable to save your goal.");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1Goal
            goalTitle={goalTitle}
            onGoalTitleChange={setGoalTitle}
            onNext={handleGenerateQuestions}
            loading={loading}
          />
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
            onDelete={(index) => setActions((current) => current.filter((_, idx) => idx !== index))}
            onGenerateMore={handleGenerateMoreActions}
            onSave={handleSave}
            loading={loading}
            saving={saving}
            successMessage={success}
            errorMessage={error}
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
        <div key={step} className={styles.fadeSlideIn}>
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
