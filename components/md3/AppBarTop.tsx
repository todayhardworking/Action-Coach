"use client";

import { useEffect, useState } from "react";
import styles from "./md3.module.css";

interface AppBarTopProps {
  title: string;
  onBack?: () => void;
}

export function AppBarTop({ title, onBack }: AppBarTopProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 4);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`${styles.appBar} ${scrolled ? styles.appBarScrolled : ""}`}>
      {onBack ? (
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="Back">
          ←
        </button>
      ) : null}
      <h1 className={styles.appBarTitle}>{title}</h1>
    </header>
  );
}
