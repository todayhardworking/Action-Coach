"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { GoalWizard } from "./GoalWizard";

export default function GoalWizardPage() {
  const { user } = useAuth();

  return (
    <RequireAuth>
      <GoalWizard uid={user?.uid} />
    </RequireAuth>
  );
}
