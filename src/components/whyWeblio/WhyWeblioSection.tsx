import WhyWeblioEditorialDecor from "./WhyWeblioEditorialDecor";
import WhyWeblioIntro from "./WhyWeblioIntro";
import WhyWeblioMetricsStrip from "./WhyWeblioMetricsStrip";
import WhyWeblioReasons from "./WhyWeblioReasons";
import WhyWeblioVisual from "./WhyWeblioVisual";
import "./WhyWeblio.scss";

export default function WhyWeblioSection() {
  return (
    <section className="why-weblio" id="whyme" dir="rtl" aria-labelledby="why-weblio-heading">
      <div className="why-weblio__atmosphere" aria-hidden>
        <div className="why-weblio__bridge-glow" />
        <div className="why-weblio__scene-flow" />
        <div className="why-weblio__orb why-weblio__orb--a" />
        <div className="why-weblio__orb why-weblio__orb--b" />
        <div className="why-weblio__orb why-weblio__orb--c" />
        <div className="why-weblio__floor-glow" />
        <div className="why-weblio__perspective-grid" />
        <div className="why-weblio__scene-stars" />
        <WhyWeblioEditorialDecor />
      </div>

      <div className="why-weblio__inner">
        <div className="why-weblio__scene">
          <div className="why-weblio__intro-zone">
            <WhyWeblioIntro />
          </div>

          <div className="why-weblio__reasons-zone">
            <WhyWeblioReasons />
          </div>

          <div className="why-weblio__laptop-zone">
            <WhyWeblioVisual />
          </div>
        </div>

        <WhyWeblioMetricsStrip />
      </div>
    </section>
  );
}
