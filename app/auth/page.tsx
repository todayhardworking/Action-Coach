"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { StepCard } from "@/components/md3/StepCard";
import { StepTitle } from "@/components/md3/StepTitle";
import { StepDescription } from "@/components/md3/StepDescription";
import { MD3TextField } from "@/components/md3/MD3TextField";
import md3Styles from "@/components/md3/md3.module.css";
import styles from "./auth.module.css";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.shell}>
            <StepCard elevated>
              <div className={styles.header}>
                <p className={styles.eyebrow}>Welcome</p>
                <StepTitle>Loading…</StepTitle>
                <StepDescription>Preparing the sign-in experience.</StepDescription>
              </div>
            </StepCard>
          </div>
        </main>
      }
    >
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const redirectTarget = useMemo(() => {
    const redirect = searchParams.get("redirect");
    return redirect ? decodeURIComponent(redirect) : "/dashboard";
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTarget);
    }
  }, [user, loading, router, redirectTarget]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter your e-mail and password.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.replace(redirectTarget);
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Unable to complete request.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <StepCard elevated>
          <div className={styles.header}>
            <p className={styles.eyebrow}>Welcome</p>
            <StepTitle>{mode === "signin" ? "Sign in" : "Create an account"}</StepTitle>
            <StepDescription>Use your e-mail address and password to continue.</StepDescription>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <MD3TextField
              label="E-mail"
              value={email}
              onChange={setEmail}
              type="email"
              name="email"
              autoComplete="email"
              required
            />

            <MD3TextField
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              name="password"
              placeholder={mode === "signin" ? "••••••" : "At least 6 characters"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
            />

            {mode === "signup" ? (
              <MD3TextField
                label="Confirm password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                type="password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
                minLength={6}
              />
            ) : null}

            {error ? <p className={`${md3Styles.supportText} ${styles.error}`}>{error}</p> : null}

            <div className={styles.actions}>
              <button type="submit" className={`${md3Styles.filledButton} ${styles.primaryButton}`} disabled={submitting}>
                {submitting ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </div>
          </form>

          <div className={styles.footer}>
            <p className={md3Styles.supportText}>{mode === "signin" ? "Need an account?" : "Already registered?"}</p>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => {
                setError(null);
                setMode((current) => (current === "signin" ? "signup" : "signin"));
              }}
              disabled={submitting}
            >
              {mode === "signin" ? "Create one" : "Sign in instead"}
            </button>
          </div>
        </StepCard>
      </div>
    </main>
  );
}
