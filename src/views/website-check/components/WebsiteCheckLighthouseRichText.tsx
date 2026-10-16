"use client";

import { parseLighthouseTextSegments } from "@/lib/website-check/lighthouse-text";

type WebsiteCheckLighthouseRichTextProps = {
  text: string;
  className?: string;
  learnMoreLabel?: string;
  documentationUrl?: string | null;
};

export default function WebsiteCheckLighthouseRichText({
  text,
  className,
  learnMoreLabel = "למידע נוסף",
  documentationUrl,
}: WebsiteCheckLighthouseRichTextProps) {
  const segments = parseLighthouseTextSegments(text);
  const hasInlineLinks = segments.some((segment) => segment.type === "link");

  if (segments.length === 0 && !documentationUrl) {
    return null;
  }

  return (
    <div className={className} dir="auto">
      {segments.length > 0 ? (
        <p className="website-check-results__rich-text">
          {segments.map((segment, index) =>
            segment.type === "link" ? (
              <a
                key={`${segment.href}-${index}`}
                href={segment.href}
                className="website-check-results__doc-link"
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
              >
                {segment.label}
              </a>
            ) : (
              <span key={`text-${index}`}>{segment.value}</span>
            )
          )}
        </p>
      ) : (
        <p className="website-check-results__rich-text">{text}</p>
      )}
      {!hasInlineLinks && documentationUrl ? (
        <p className="website-check-results__doc-link-wrap">
          <a
            href={documentationUrl}
            className="website-check-results__doc-link website-check-results__doc-link--cta"
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
          >
            {learnMoreLabel}
          </a>
        </p>
      ) : null}
    </div>
  );
}
