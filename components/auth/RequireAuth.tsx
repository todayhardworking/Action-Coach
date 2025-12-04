"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const redirectPath = encodeURIComponent(pathname);
      router.replace(`/auth?redirect=${redirectPath}`);
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <div className="auth-loading">
        <div className="auth-loading__card">
          <p>Checking your session…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
