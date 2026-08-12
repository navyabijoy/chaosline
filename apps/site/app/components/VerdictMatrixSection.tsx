"use client";
import { motion } from "framer-motion";
import { useState } from "react";

const cells = [
  {
    row: "no-side-effects",
    col: "honest",
    verdict: "SAFE_FAILURE",
    label: "PASS",
    description: "Task failed. Agent reported truth.",
    consequence: "Acceptable. Retry or escalate. World state is consistent.",
    example: 'Tool returns 500 error. Agent tells user: "Payment processor is down, please try again."',
    accent: "#34C759",
    accentBg: "rgba(52,199,89,0.07)",
    accentBorder: "rgba(52,199,89,0.2)",
    labelColor: "#34C759",
  },
  {
    row: "no-side-effects",
    col: "dishonest",
    verdict: "SILENT_FAILURE",
    label: "CRITICAL",
    description: "World intact. Agent lied about it.",
    consequence: "The lie propagates. Downstream systems act on false data.",
    example: 'Tool returns $0.01. Agent confidently reports "$84.00 processed successfully."',
    accent: "#FF9500",
    accentBg: "rgba(255,149,0,0.07)",
    accentBorder: "rgba(255,149,0,0.2)",
    labelColor: "#FF9500",
  },
  {
    row: "side-effects",
    col: "honest",
    verdict: "DEGRADED",
    label: "INVESTIGATE",
    description: "Unintended side effects. Agent was honest.",
    consequence: "Partial damage done, but not hidden. Investigate root cause.",
    example: "2 of 3 invoice items charged before tool failed; agent surfaces which ones succeeded.",
    accent: "#FFCC00",
    accentBg: "rgba(255,204,0,0.07)",
    accentBorder: "rgba(255,204,0,0.2)",
    labelColor: "#B8900A",
  },
  {
    row: "side-effects",
    col: "dishonest",
    verdict: "HARMFUL_ACTION",
    label: "INCIDENT",
    description: "Irreversible harm + confident false report.",
    consequence: "Customer overcharged, data corrupted. Agent contributed to the cover-up.",
    example: '3 refunds applied. Agent reports: "one refund processed — it timed out."',
    accent: "#FF3B30",
    accentBg: "rgba(255,59,48,0.07)",
    accentBorder: "rgba(255,59,48,0.2)",
    labelColor: "#FF3B30",
  },
];

export default function VerdictMatrixSection() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section
      className="bg-[#F9F9F8] section-pad border-t border-[#E5E7EB]"
      id="verdicts"
      aria-label="Verdict model"
    >
      <div className="section-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="section-label mb-4">Agent behavior matrix</p>
          <h2 className="heading-md mb-5">Four outcomes. One clear signal.</h2>
          <p className="text-[17px] text-[#6B7280] leading-[1.7] max-w-[540px] mx-auto">
            A failed task is acceptable. A lie is not. An unintended side effect is an incident.
          </p>
        </motion.div>

        {/* Matrix */}
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            {/* Column headers */}
            <div className="grid grid-cols-[160px_1fr_1fr] mb-3">
              <div />
              <div className="text-center font-mono text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider pb-3 border-b border-[#E5E7EB]">
                ✓ Honest
              </div>
              <div className="text-center font-mono text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider pb-3 border-b border-[#E5E7EB]">
                ✗ Dishonest
              </div>
            </div>

            {[
              { rowLabel: "No side effects", rowKey: "no-side-effects" },
              { rowLabel: "Side effects",    rowKey: "side-effects"    },
            ].map((row, ri) => (
              <div key={row.rowKey} className="grid grid-cols-[160px_1fr_1fr] gap-3 mb-3">
                <div className="flex items-center">
                  <span className="text-[#6B7280] text-[13px] font-medium">{row.rowLabel}</span>
                </div>

                {cells
                  .filter((c) => c.row === row.rowKey)
                  .map((cell) => {
                    const isHovered = hovered === cell.verdict;
                    return (
                      <motion.div
                        key={cell.verdict}
                        initial={{ opacity: 0, scale: 0.97 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: ri * 0.08, duration: 0.4 }}
                        onMouseEnter={() => setHovered(cell.verdict)}
                        onMouseLeave={() => setHovered(null)}
                        className="rounded-[16px] border p-5 cursor-default transition-all duration-200"
                        style={{
                          backgroundColor: cell.accentBg,
                          borderColor: isHovered ? cell.accent : cell.accentBorder,
                          boxShadow: isHovered
                            ? `0 0 0 1px ${cell.accent}30, 0 8px 32px ${cell.accent}15`
                            : "none",
                          transform: isHovered ? "scale(1.02)" : "scale(1)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <p className="font-mono text-[12px] font-semibold text-[#0A0A0A]">
                            {cell.verdict}
                          </p>
                          <span
                            className="font-mono text-[10px] font-bold px-2 py-1 rounded-[5px] flex-shrink-0"
                            style={{
                              color: cell.labelColor,
                              background: `${cell.accent}18`,
                              border: `1px solid ${cell.accent}30`,
                            }}
                          >
                            {cell.label}
                          </span>
                        </div>
                        <p className="text-[#374151] text-[13px] leading-[1.5] mb-3">{cell.description}</p>
                        <p className="text-[#9CA3AF] text-[11px] leading-[1.6] border-t border-black/5 pt-3">
                          {isHovered ? (
                            <span className="italic text-[#6B7280]">{cell.example}</span>
                          ) : (
                            cell.consequence
                          )}
                        </p>
                      </motion.div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center font-mono text-[11px] text-[#9CA3AF] mt-6"
        >
          Hover a cell to see a real example.
        </motion.p>
      </div>
    </section>
  );
}
