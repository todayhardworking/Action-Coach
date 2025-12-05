import { BrandStorySection } from "../components/md3/BrandStorySection";
import { ConceptSection } from "../components/md3/ConceptSection";
import { CTASection } from "../components/md3/CTASection";
import { FeatureCards } from "../components/md3/FeatureCards";
import { HeroSection } from "../components/md3/HeroSection";
import styles from "../components/md3/md3.module.css";

export default function HomePage() {
  return (
    <div className={styles.homePage}>
      <HeroSection />
      <BrandStorySection />
      <ConceptSection />
      <FeatureCards />
      <CTASection />
    </div>
  );
}
