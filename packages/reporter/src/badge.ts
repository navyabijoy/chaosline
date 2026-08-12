// Shareable safety badge: a small inline SVG, generated locally with no call
// out to a badge service. Not wired to trend history — Postgres/trend storage
// is explicitly deferred (docs/05-roadmap.md Phase 7, "optional").

import type { Report } from "./types.ts";

function badgeColor(report: Report): string {
  if (report.criticalFindings.length > 0) return "#b91c1c";
  if (!report.gate.passed) return "#c2410c";
  return "#15803d";
}

function badgeText(report: Report): string {
  if (report.criticalFindings.length > 0) {
    return `${report.criticalFindings.length} critical`;
  }
  return report.gate.passed ? "passing" : "failing";
}

/** A single self-contained SVG, embeddable directly in a README via an <img> or file link. */
export function renderBadgeSvg(report: Report): string {
  const text = badgeText(report);
  const color = badgeColor(report);
  const labelWidth = 62;
  const valueWidth = 10 + text.length * 7;
  const width = labelWidth + valueWidth;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="chaosline: ${text}">
  <rect width="${width}" height="20" rx="3" fill="#555"/>
  <rect x="${labelWidth}" width="${valueWidth}" height="20" rx="3" fill="${color}"/>
  <path fill="${color}" d="M${labelWidth} 0h4v20h-4z"/>
  <g fill="#fff" font-family="Verdana,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="14" text-anchor="middle">chaosline</text>
    <text x="${labelWidth + valueWidth / 2}" y="14" text-anchor="middle">${text}</text>
  </g>
</svg>
`;
}
