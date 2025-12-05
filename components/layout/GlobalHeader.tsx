"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { useAuth } from "../auth/AuthProvider";
import { auth } from "../../lib/firebaseClient";
import styles from "../md3/md3.module.css";

type NavigationItem = {
  label: string;
  href?: string;
  icon: ReactNode;
  action?: () => Promise<void> | void;
  type: "link" | "action" | "placeholder";
};

export function GlobalHeader() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const menuIcon = (
    <svg
      aria-hidden="true"
      className={styles.iconGlyph}
      viewBox="0 0 24 24"
      role="img"
      focusable="false"
    >
      <path
        d="M4.5 7.5h15M4.5 12h15M4.5 16.5h15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  }, [router]);

  const navigationItems: NavigationItem[] = useMemo(() => {
    if (loading) {
      return [
        {
          label: "Loading",
          icon: "hourglass_empty",
          type: "placeholder",
        },
      ];
    }

    if (user?.uid) {
      return [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: (
            <svg className={styles.iconGlyph} viewBox="0 0 24 24" role="img" aria-hidden focusable="false">
              <rect x="4" y="4" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
              <rect x="13" y="4" width="7" height="5" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
              <rect x="13" y="11" width="7" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
              <rect x="4" y="13" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
            </svg>
          ),
          type: "link",
        },
        {
          label: "Goals",
          href: "/goals-list",
          icon: (
            <svg className={styles.iconGlyph} viewBox="0 0 24 24" role="img" aria-hidden focusable="false">
              <path
                d="M5 19V5.5a1.5 1.5 0 0 1 2.4-1.2l3.6 2.7h5a1 1 0 0 1 1 1V19"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 19h14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="16" cy="10.5" r="1.1" fill="currentColor" />
            </svg>
          ),
          type: "link",
        },
        {
          label: "Logout",
          icon: (
            <svg className={styles.iconGlyph} viewBox="0 0 24 24" role="img" aria-hidden focusable="false">
              <path
                d="M13 5.5V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M10.5 12h7m0 0-2-2m2 2-2 2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          type: "action",
          action: handleLogout,
        },
      ];
    }

    return [
      {
        label: "Home",
        href: "/",
        icon: (
          <svg className={styles.iconGlyph} viewBox="0 0 24 24" role="img" aria-hidden focusable="false">
            <path
              d="m4 12 8-6 8 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6.5 10.5v8.5h11v-8.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
        type: "link",
      },
      {
        label: "Login",
        href: "/login",
        icon: (
          <svg className={styles.iconGlyph} viewBox="0 0 24 24" role="img" aria-hidden focusable="false">
            <path
              d="M10 5.5V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-1.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M13.5 12h-7m0 0 2 2m-2-2 2-2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
        type: "link",
      },
    ];
  }, [handleLogout, loading, user?.uid]);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  return (
    <>
      <header className={`${styles.appBar} ${styles.globalHeaderBar}`}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Open navigation menu"
          onClick={() => setIsDrawerOpen(true)}
        >
          {menuIcon}
        </button>
        <div className={styles.headerTitle} aria-label="Stepvia">
          Stepvia
        </div>
        <div className={styles.headerActions} aria-hidden="true" />
      </header>

      <div
        className={`${styles.drawerScrim} ${isDrawerOpen ? styles.drawerScrimVisible : ""}`}
        role="presentation"
        onClick={() => setIsDrawerOpen(false)}
      />

      <aside
        className={`${styles.drawer} ${isDrawerOpen ? styles.drawerOpen : ""}`}
        aria-label="Navigation menu"
      >
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>{user?.uid ? "Account" : "Welcome"}</span>
          <span className={styles.drawerSubtitle}>
            {user?.email || "Access your Stepvia journey"}
          </span>
        </div>

        <nav className={styles.drawerList} aria-label="Primary navigation">
          {navigationItems.map((item) => {
            const isActive = item.href ? pathname === item.href : false;

            if (item.type === "link" && item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${styles.drawerItem} ${isActive ? styles.drawerItemActive : ""}`}
                >
                  <span aria-hidden="true" className={styles.drawerIcon}>
                    {item.icon}
                  </span>
                  <span className={styles.drawerLabel}>{item.label}</span>
                </Link>
              );
            }

            if (item.type === "action" && item.action) {
              return (
                <button
                  key={item.label}
                  type="button"
                  className={styles.drawerItem}
                  onClick={item.action}
                >
                  <span aria-hidden="true" className={styles.drawerIcon}>
                    {item.icon}
                  </span>
                  <span className={styles.drawerLabel}>{item.label}</span>
                </button>
              );
            }

            return (
              <div key={item.label} className={`${styles.drawerItem} ${styles.drawerItemDisabled}`}>
                <span aria-hidden="true" className={styles.drawerIcon}>
                  {item.icon}
                </span>
                <span className={styles.drawerLabel}>{item.label}</span>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
