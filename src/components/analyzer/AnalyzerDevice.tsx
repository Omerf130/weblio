import "./WebsiteAnalyzer.scss";

/**
 * Polished mock website preview rendered inside the laptop screen.
 * Resembles a real premium business website. Purely decorative.
 */
function ScreenPreview() {
  return (
    <div className="analyzer-screen" dir="ltr" aria-hidden>
      {/* ── Navigation ── */}
      <div className="analyzer-screen__nav">
        <div className="analyzer-screen__nav-logo">
          <span className="analyzer-screen__logo-mark" />
          <span className="analyzer-screen__logo-text">Brand</span>
        </div>
        <div className="analyzer-screen__nav-links">
          <span>Home</span>
          <span>Services</span>
          <span>About</span>
          <span>Contact</span>
        </div>
        <span className="analyzer-screen__nav-cta">Get Started</span>
      </div>

      {/* ── Hero area ── */}
      <div className="analyzer-screen__hero">
        <span className="analyzer-screen__hero-badge">Award-Winning Agency</span>
        <h3 className="analyzer-screen__hero-h">
          We Build Digital
          <br />
          Experiences
        </h3>
        <p className="analyzer-screen__hero-p">
          Premium websites designed to grow your business
        </p>
        <div className="analyzer-screen__hero-actions">
          <span className="analyzer-screen__hero-btn">View Work</span>
          <span className="analyzer-screen__hero-btn analyzer-screen__hero-btn--ghost">
            Learn More
          </span>
        </div>
      </div>

      {/* ── Feature cards ── */}
      <div className="analyzer-screen__features">
        <div className="analyzer-screen__feature">
          <span className="analyzer-screen__feature-icon" />
          <span className="analyzer-screen__feature-title" />
          <span className="analyzer-screen__feature-desc" />
        </div>
        <div className="analyzer-screen__feature">
          <span className="analyzer-screen__feature-icon" />
          <span className="analyzer-screen__feature-title" />
          <span className="analyzer-screen__feature-desc" />
        </div>
        <div className="analyzer-screen__feature">
          <span className="analyzer-screen__feature-icon" />
          <span className="analyzer-screen__feature-title" />
          <span className="analyzer-screen__feature-desc" />
        </div>
      </div>
    </div>
  );
}

/**
 * Laptop device composition with a dynamic HTML screen overlay.
 *
 * The asset (public/pics/analyzer.png, 1660×948) is nearly front-facing.
 * The overlay is positioned as percentages of that image box and clipped
 * to the inner glass, which is slightly wider at the bottom. The frame
 * locks the same aspect ratio so the mapping stays aligned at every size.
 */
export default function AnalyzerDevice() {
  return (
    <div className="analyzer-device">
      <div className="analyzer-device__frame">
        <img
          className="analyzer-device__asset"
          src="/pics/analyzer.png"
          alt="מחשב נייד עם תצוגת ניתוח אתר"
          width={1660}
          height={948}
          loading="lazy"
          decoding="async"
        />

        <div className="analyzer-device__screen-mount" aria-hidden>
          <div className="analyzer-device__screen">
            <ScreenPreview />
          </div>
        </div>
      </div>
    </div>
  );
}
