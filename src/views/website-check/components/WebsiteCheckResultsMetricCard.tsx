"use client";



import type { IconType } from "react-icons";

import {

  MdAccessibility,

  MdBolt,

  MdDesktopMac,

  MdSearch,

} from "react-icons/md";

import type { WebsiteCheckResultsMetricView } from "../website-check-results-content";



const METRIC_ICONS: Record<WebsiteCheckResultsMetricView["id"], IconType> = {

  performance: MdBolt,

  seo: MdSearch,

  accessibility: MdAccessibility,

  ux: MdDesktopMac,

};



type WebsiteCheckResultsMetricCardProps = {

  metric: WebsiteCheckResultsMetricView;

};



export default function WebsiteCheckResultsMetricCard({ metric }: WebsiteCheckResultsMetricCardProps) {

  const Icon = METRIC_ICONS[metric.id];

  const unavailable = metric.score === null;



  return (

    <li

      className={`website-check-results-metric website-check-results-metric--${metric.accent}${unavailable ? " website-check-results-metric--unavailable" : ""}`}

    >

      <div className="website-check-results-metric__top">

        <span className="website-check-results-metric__icon-wrap" aria-hidden>

          <Icon className="website-check-results-metric__icon" />

        </span>

        {unavailable ? (
          <span
            className={`website-check-results-metric__score website-check-results-metric__score--na${metric.id === "ux" ? " website-check-results-metric__score--ux-na" : ""}`}
            aria-label={metric.statusLabel}
          >
            {metric.id === "ux" ? "לא נבדקה" : "-"}
          </span>
        ) : (

          <span className="website-check-results-metric__score" dir="ltr">

            {metric.score}

          </span>

        )}

      </div>

      <p className="website-check-results-metric__label" dir={metric.id === "seo" ? "ltr" : undefined}>

        {metric.label}

      </p>

      <p className="website-check-results-metric__desc">{metric.description}</p>

      <span className="website-check-results-metric__status">{metric.statusLabel}</span>

    </li>

  );

}

