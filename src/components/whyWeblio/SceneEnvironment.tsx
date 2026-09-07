import "./WhyWeblio.scss";

export default function SceneEnvironment() {
  return (
    <div className="why-weblio__scene-env" aria-hidden>
      <span className="why-weblio__scene-light why-weblio__scene-light--core" />
      <span className="why-weblio__scene-light why-weblio__scene-light--base" />
      <span className="why-weblio__scene-light why-weblio__scene-light--spread" />
      <span className="why-weblio__scene-light why-weblio__scene-light--bridge" />
      <span className="why-weblio__scene-light why-weblio__scene-light--spill-center" />
      <span className="why-weblio__scene-light why-weblio__scene-light--spill-reasons" />
      <span className="why-weblio__scene-floor-bloom" />
      <span className="why-weblio__scene-ground-grid" />
      <span className="why-weblio__scene-contact-shadow" />
    </div>
  );
}
