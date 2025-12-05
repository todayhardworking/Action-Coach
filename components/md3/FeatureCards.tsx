import styles from "./md3.module.css";

const features = [
  {
    title: "Action tracking",
    description: "Capture daily moves in a calm interface. Each action links back to the goal it serves.",
  },
  {
    title: "Goal breakdown",
    description: "Turn big ambitions into structured targets and step-by-step checklists.",
  },
  {
    title: "Weekly summaries",
    description: "See momentum build with summaries that highlight wins and areas to adjust.",
  },
  {
    title: "AI insights",
    description: "Get prompts that clarify next steps and reflections that stay true to your intent.",
  },
  {
    title: "MD3 interface",
    description: "Material Design 3 surfaces, elevations, and typography for a premium SaaS feel.",
  },
  {
    title: "Cloud sync",
    description: "Firebase-ready foundation to keep your goals and actions available everywhere.",
  },
];

export function FeatureCards() {
  return (
    <section className={styles.sectionShell}>
      <div className={styles.contentContainer}>
        <div className={styles.sectionHeader}>
          <p className={styles.pill}>Capabilities</p>
          <h2 className={styles.sectionTitle}>What Stepvia delivers</h2>
          <p className={styles.sectionSubtitle}>
            Built for entrepreneurs, students, and anyone who wants an AI-supported productivity
            system grounded in clarity and momentum.
          </p>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <article key={feature.title} className={`${styles.surfaceCard} ${styles.featureCard}`}>
              <div className={styles.featureIcon} aria-hidden>
                <span className={styles.dot} />
              </div>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardCopy}>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
