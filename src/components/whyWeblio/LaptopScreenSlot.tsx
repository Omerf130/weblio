import { LAPTOP_BUILD_PHASES } from "./whyWeblio-content";

export default function LaptopScreenSlot() {
  return (
    <div className="laptop-screen" dir="ltr">
      <div className="laptop-screen__topbar">
        <div className="laptop-screen__brand">
          <span className="laptop-screen__brand-mark" aria-hidden />
          <span className="laptop-screen__brand-text">
            WEBLIO <em>/ BUILD</em>
          </span>
        </div>
        <div className="laptop-screen__status">
          <span className="laptop-screen__status-dot" aria-hidden />
          Workspace
        </div>
      </div>

      <nav className="laptop-screen__phases" aria-hidden>
        {LAPTOP_BUILD_PHASES.map((phase, index) => (
          <span
            key={phase.id}
            className={`laptop-screen__phase${index === 1 ? " laptop-screen__phase--active" : ""}`}
          >
            {phase.labelHe}
          </span>
        ))}
      </nav>

      <div className="laptop-screen__workspace">
        <div className="laptop-screen__preview">
          <div className="laptop-screen__preview-header">
            <span />
            <span />
            <span />
          </div>
          <div className="laptop-screen__preview-body">
            <div className="laptop-screen__preview-block laptop-screen__preview-block--hero" />
            <div className="laptop-screen__preview-grid">
              <div className="laptop-screen__preview-block" />
              <div className="laptop-screen__preview-block" />
              <div className="laptop-screen__preview-block" />
            </div>
          </div>
        </div>

        <div className="laptop-screen__side">
          <p className="laptop-screen__side-title">Pipeline</p>
          <ul className="laptop-screen__checks">
            <li>Performance</li>
            <li>Responsive</li>
            <li>SEO Ready</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
