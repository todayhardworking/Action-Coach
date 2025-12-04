"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebaseClient";
import { useAuth } from "../../components/auth/AuthProvider";
import styles from "./auth.module.css";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  const redirectTarget = (() => {
    const redirect = searchParams.get("redirect");
    return redirect ? decodeURIComponent(redirect) : "/dashboard";
  })();

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
      <div className={styles.card}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Welcome</p>
          <h1 className={styles.title}>{mode === "signin" ? "Sign in" : "Create an account"}</h1>
          <p className={styles.subtitle}>Use your e-mail address and password to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={styles.input}
              autoComplete="email"
              required
            />
          </label>

          <label className={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={styles.input}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
            />
          </label>

          {mode === "signup" ? (
            <label className={styles.label}>
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={styles.input}
                autoComplete="new-password"
                required
                minLength={6}
              />
            </label>
          ) : null}

          {error ? <p className={styles.error}>{error}</p> : null}

          <button type="submit" className={styles.primaryButton} disabled={submitting}>
            {submitting ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className={styles.footer}>
          <p>{mode === "signin" ? "Need an account?" : "Already registered?"}</p>
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
      </div>
    </main>
  );
}
