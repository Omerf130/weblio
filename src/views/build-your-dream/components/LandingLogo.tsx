import styles from "./LandingLogo.module.scss";

export default function LandingLogo() {
  return (
    <span className={styles.logo} aria-label="Weblio">
      <span className={styles.mark} aria-hidden />
      <span className={styles.text}>
        <em>web</em>lio
      </span>
    </span>
  );
}
