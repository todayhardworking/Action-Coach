import styles from "./md3.module.css";

export function BrandStorySection() {
  return (
    <section id="brand" className={styles.sectionShell}>
      <div className={styles.contentContainer}>
        <div className={styles.sectionHeader}>
          <p className={styles.pill}>Brand story</p>
          <h2 className={styles.sectionTitle}>Why the name Stepvia?</h2>
          <p className={styles.sectionSubtitle}>
            Stepvia blends “step” and “via” (Latin: path). It is a promise that every small action
            moves you along a clear, guided route toward meaningful transformation.
          </p>
        </div>
        <div className={styles.brandGrid}>
          <div className={styles.brandCard}>
            <div className={styles.brandIcon} aria-hidden>
              <svg viewBox="0 0 24 24" role="img" aria-hidden focusable="false">
                <path
                  d="M5 18c4-2 10-2 14 0M7 14c3-1.6 7-1.6 10 0M9 10c2-.8 4-.8 6 0M11 6c1-.3 2-.3 2 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className={styles.brandTitle}>Progress through clarity</h3>
            <p className={styles.brandCopy}>
              Every move is a deliberate step. Stepvia keeps the route visible so you never wonder
              what comes next.
            </p>
          </div>
          <div className={styles.brandCard}>
            <div className={styles.brandIcon} aria-hidden>
              <svg viewBox="0 0 24 24" role="img" aria-hidden focusable="false">
                <path
                  d="M5.5 18.5 10 8.8l2.8 5L16.5 6l3 6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="5.5" cy="18.5" r="1.2" fill="currentColor" />
                <circle cx="10" cy="8.8" r="1.2" fill="currentColor" />
                <circle cx="12.8" cy="13.8" r="1.2" fill="currentColor" />
                <circle cx="16.5" cy="6" r="1.2" fill="currentColor" />
                <circle cx="19.5" cy="12.5" r="1.2" fill="currentColor" />
              </svg>
            </div>
            <h3 className={styles.brandTitle}>Guided path</h3>
            <p className={styles.brandCopy}>
              From intention to outcome, Stepvia gives you a calm, structured way to plan, act, and
              reflect without clutter.
            </p>
          </div>
          <div className={styles.brandCard}>
            <div className={styles.brandIcon} aria-hidden>
              <svg viewBox="0 0 24 24" role="img" aria-hidden focusable="false">
                <path
                  d="M12 4c-4 2.5-6 5-6 8a6 6 0 0 0 12 0c0-3-2-5.5-6-8Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path d="M12 8v4l2.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <h3 className={styles.brandTitle}>Momentum with meaning</h3>
            <p className={styles.brandCopy}>
              Stepvia turns daily steps into powerful transformation, aligning your actions with the
              story you want to write.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
