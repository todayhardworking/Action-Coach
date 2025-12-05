import styles from "./md3.module.css";

const steps = [
  {
    title: "Set targets",
    description: "Define clear goals for your week or quarter. Keep them visible so every action has intent.",
    icon: (
      <svg viewBox="0 0 24 24" role="img" aria-hidden focusable="false">
        <rect x="5" y="5" width="14" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 12h8M8 9h5M8 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Take daily actions",
    description: "Break goals into small, confident steps. Capture progress with lightweight MD3 cards.",
    icon: (
      <svg viewBox="0 0 24 24" role="img" aria-hidden focusable="false">
        <path
          d="M6 17.5 10 12l2.8 2.8L18 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="6" cy="17.5" r="1.2" fill="currentColor" />
        <circle cx="10" cy="12" r="1.2" fill="currentColor" />
        <circle cx="12.8" cy="14.8" r="1.2" fill="currentColor" />
        <circle cx="18" cy="8" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Reflect & improve",
    description: "Review wins, see patterns, and adjust the path. Weekly insights turn motion into momentum.",
    icon: (
      <svg viewBox="0 0 24 24" role="img" aria-hidden focusable="false">
        <path
          d="M5 15.5c1 .9 2.3 1.5 3.7 1.5 2.6 0 4.8-2 4.8-4.5 0-2.5-2.1-4.5-4.8-4.5-1.5 0-2.8.6-3.7 1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path d="M14.5 7.5v-3m0 0h-3m3 0 2.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="m13.5 13.5 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="17.5" cy="17" r="1.2" fill="currentColor" />
      </svg>
    ),
  },
];

export function ConceptSection() {
  return (
    <section className={`${styles.sectionShell} ${styles.sectionMuted}`}>
      <div className={styles.contentContainer}>
        <div className={styles.sectionHeader}>
          <p className={styles.pill}>How Stepvia works</p>
          <h2 className={styles.sectionTitle}>A calm, three-step rhythm</h2>
          <p className={styles.sectionSubtitle}>
            Stepvia is a personal action, goal, and reflection system built for entrepreneurs,
            students, and self-improvement enthusiasts. It keeps you moving with simplicity,
            structure, and weekly momentum.
          </p>
        </div>
        <div className={styles.cardGrid}>
          {steps.map((step) => (
            <article key={step.title} className={`${styles.surfaceCard} ${styles.elevatedCard}`}>
              <div className={styles.cardIcon} aria-hidden>
                {step.icon}
              </div>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardCopy}>{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
