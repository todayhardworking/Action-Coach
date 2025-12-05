import Link from "next/link";
import styles from "./md3.module.css";

export function HeroSection() {
  return (
    <section className={`${styles.sectionShell} ${styles.heroSection}`}>
      <div className={styles.contentContainer}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>Material Design 3 · Calm focus</div>
          <h1 className={styles.heroTitle}>Stepvia</h1>
          <p className={styles.heroSubtitle}>
            The guided path that turns everyday steps into meaningful momentum.
            Plan with clarity, act with intention, and see your progress unfold.
          </p>
          <div className={styles.heroActions}>
            <Link href="/login" className={`${styles.filledButton} ${styles.heroButton}`}>
              Get Started
            </Link>
            <a href="#brand" className={`${styles.tonalButton} ${styles.heroButton}`}>
              Learn More
            </a>
          </div>
          <div className={styles.heroHighlights}>
            <div className={styles.highlightItem}>
              <span className={styles.iconGlyph} aria-hidden>
                <svg viewBox="0 0 24 24" role="img" aria-hidden focusable="false">
                  <path
                    d="M4.5 14.5 9.3 9l3.2 3.7 6-7.2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.5 5.5h3v3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <p className={styles.highlightTitle}>One step at a time</p>
                <p className={styles.highlightCopy}>Small, confident moves become transformation.</p>
              </div>
            </div>
            <div className={styles.highlightItem}>
              <span className={styles.iconGlyph} aria-hidden>
                <svg viewBox="0 0 24 24" role="img" aria-hidden focusable="false">
                  <path
                    d="M5 12h4.5l2 5 3-10 2 5H19"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="5" cy="12" r="1.3" fill="currentColor" />
                  <circle cx="10.8" cy="17" r="1.3" fill="currentColor" />
                  <circle cx="14.5" cy="7" r="1.3" fill="currentColor" />
                  <circle cx="18.5" cy="12" r="1.3" fill="currentColor" />
                </svg>
              </span>
              <div>
                <p className={styles.highlightTitle}>Clarity and momentum</p>
                <p className={styles.highlightCopy}>Every action connects to the path ahead.</p>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.heroCard}>
          <p className={styles.cardLabel}>Stepvia concept</p>
          <h2 className={styles.cardTitle}>Structure, focus, and calm execution.</h2>
          <p className={styles.cardCopy}>
            Build targets, turn them into daily actions, and let weekly reflections keep you in a
            steady rhythm. Stepvia gives you a guided route without the noise.
          </p>
          <div className={styles.heroList}>
            <div className={styles.heroListItem}>
              <span className={styles.dot} />
              <div>
                <p className={styles.heroListTitle}>Guided action system</p>
                <p className={styles.heroListCopy}>From goals to steps with AI-supported prompts.</p>
              </div>
            </div>
            <div className={styles.heroListItem}>
              <span className={styles.dot} />
              <div>
                <p className={styles.heroListTitle}>MD3 experience</p>
                <p className={styles.heroListCopy}>Soft elevation, adaptive surfaces, and calm typography.</p>
              </div>
            </div>
            <div className={styles.heroListItem}>
              <span className={styles.dot} />
              <div>
                <p className={styles.heroListTitle}>Sync-ready foundation</p>
                <p className={styles.heroListCopy}>Cloud-first architecture prepared for Firebase Auth.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
