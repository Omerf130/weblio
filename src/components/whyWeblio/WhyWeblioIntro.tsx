import { MdArrowBack } from "react-icons/md";
import Reveal from "../motion/Reveal";
import {
  WHY_WEBLIO_CTA,
  WHY_WEBLIO_CTA_HREF,
  WHY_WEBLIO_EYEBROW,
  WHY_WEBLIO_HEADING,
  WHY_WEBLIO_INTRO,
  WHY_WEBLIO_PROCESS_WORDS,
} from "./whyWeblio-content";

export default function WhyWeblioIntro() {
  return (
    <header className="why-weblio__intro">
      <Reveal as="p" className="why-weblio__eyebrow" y={16} delay={0.05}>
        {WHY_WEBLIO_EYEBROW}
      </Reveal>

      <Reveal as="h2" className="why-weblio__heading" y={28} delay={0.12} id="why-weblio-heading">
        {WHY_WEBLIO_HEADING}
      </Reveal>

      <Reveal as="p" className="why-weblio__intro-copy" y={22} delay={0.2}>
        {WHY_WEBLIO_INTRO}
      </Reveal>

      <Reveal y={18} delay={0.28}>
        <a className="why-weblio__cta" href={WHY_WEBLIO_CTA_HREF}>
          <span className="why-weblio__cta-icon" aria-hidden>
            <MdArrowBack />
          </span>
          {WHY_WEBLIO_CTA}
        </a>
      </Reveal>

      <ul className="why-weblio__process-words" aria-hidden>
        {WHY_WEBLIO_PROCESS_WORDS.map((word) => (
          <li key={word}>{word}</li>
        ))}
      </ul>
    </header>
  );
}
