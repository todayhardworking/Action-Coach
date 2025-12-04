"use client";

import Link from "next/link";
import { AppBarTop } from "../../components/md3/AppBarTop";
import { RequireAuth } from "../../components/auth/RequireAuth";
import { StepCard } from "../../components/md3/StepCard";
import { StepDescription } from "../../components/md3/StepDescription";
import { StepTitle } from "../../components/md3/StepTitle";
import styles from "../../components/md3/md3.module.css";

const features = [
  {
    title: "Add Goal",
    description: "Launch the goal wizard to turn a new intention into a SMART action plan.",
    href: "/goal-wizard",
    status: "Available now",
    cta: "Start a goal",
  },
  {
    title: "View Goals List",
    description: "See every goal you've created and jump back into the details when you're ready.",
    href: "/goals-list",
    status: "Available now",
    cta: "View goals",
  },
  {
    title: "View Actions List",
    description: "Review the action steps across all of your goals to keep work moving forward.",
    href: "/actions-list",
    status: "Available now",
    cta: "View actions",
  },
  {
    title: "Delete Account & Data",
    description: "Manage your data footprint and request removal of your account and saved items.",
    href: null,
    status: "In development",
    cta: "Delete account",
  },
];

export default function DashboardPage() {
  return (
    <RequireAuth>
      <div className={styles.surfaceContainer}>
        <div className={styles.wizardShell}>
          <AppBarTop title="Your Dashboard" />
          <StepCard>
            <StepTitle>Your goals at a glance</StepTitle>
            <StepDescription>
              Use these quick actions to create new goals, review your plans, and manage your account.
            </StepDescription>
          </StepCard>
          <div className={styles.contentStack}>
            {features.map(({ title, description, href, status, cta }) => (
              <StepCard key={title}>
                <div className={styles.featureCardContent}>
                  <div>
                    <div className={styles.chip}>{status}</div>
                    <h3 className={styles.featureTitle}>{title}</h3>
                    <p className={styles.featureDescription}>{description}</p>
                  </div>
                  <div className={styles.featureActions}>
                    {href ? (
                      <Link href={href} className={`${styles.filledButton} ${styles.linkButton}`}>
                        {cta}
                      </Link>
                    ) : (
                      <button type="button" className={styles.tonalButton} disabled>
                        Coming soon
                      </button>
                    )}
                  </div>
                </div>
              </StepCard>
            ))}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
