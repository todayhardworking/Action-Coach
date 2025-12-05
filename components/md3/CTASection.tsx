import Link from "next/link";
import styles from "./md3.module.css";

export function CTASection() {
  return (
    <section className={`${styles.sectionShell} ${styles.ctaSection}`}>
      <div className={styles.contentContainer}>
        <div className={styles.ctaCard}>
          <div>
            <p className={styles.pill}>Ready to move</p>
            <h2 className={styles.sectionTitle}>Start your journey, one step at a time.</h2>
            <p className={styles.sectionSubtitle}>
              Create an account or sign in to begin turning daily actions into lasting progress with
              Stepvia.
            </p>
          </div>
          <div className={styles.heroActions}>
            <Link href="/login" className={`${styles.filledButton} ${styles.heroButton}`}>
              Create an Account
            </Link>
            <Link href="/login" className={`${styles.tonalButton} ${styles.heroButton}`}>
              Login
            </Link>
          </div>
        </div>
        <footer className={styles.footer}>
          <p className={styles.footerText}>© {new Date().getFullYear()} Stepvia — built to help you grow.</p>
        </footer>
      </div>
    </section>
  );
}
