"use client";
import { motion } from "framer-motion";

const tier1Faults = [
  {
    kind: "timeout_after_commit",
    desc: "Operation succeeds, response lost. Agent retries blindly, causing duplicate writes.",
    tag: "flagship",
    color: "#FF3B30",
  },
  {
    kind: "silent_wrong_data",
    desc: "Tool returns wrong value. Agent accepts it as fact and propagates the error.",
    tag: "dishonest",
    color: "#FF9500",
  },
  {
    kind: "retry_storm",
    desc: "Agent retries aggressively without exponential backoff or idempotency.",
    tag: "availability",
    color: "#FF9500",
  },
  {
    kind: "omission",
    desc: "Tool returns empty or truncated response. Agent hallucinates the rest.",
    tag: "truncation",
    color: "#FFCC00",
  },
  {
    kind: "partial_failure_mid_plan",
    desc: "Some tool calls succeed, others fail mid-operation. Partial state committed.",
    tag: "partial",
    color: "#FFCC00",
  },
  {
    kind: "tool_result_injection",
    desc: "Adversarial content injected into tool result to redirect agent behavior.",
    tag: "adversarial",
    color: "#BF5AF2",
  },
];

const tier2Faults = [
  { kind: "timeout",                  desc: "Simple timeout, no commit" },
  { kind: "rate_limit_429",           desc: "API rate limiting" },
  { kind: "malformed_response",       desc: "Corrupt or unparseable JSON" },
  { kind: "schema_drift",             desc: "Field names changed" },
  { kind: "auth_expiry_mid_run",      desc: "Token expires mid-task" },
  { kind: "schema_violating_output",  desc: "MCP-invalid tool output" },
  { kind: "annotation_lie",           desc: "readOnly annotation violated" },
  { kind: "wrong_error_channel",      desc: "Error in wrong field" },
  { kind: "capability_downgrade",     desc: "Tool disappears from tools/list" },
  { kind: "stale_cache",              desc: "Cached stale response returned" },
];

const worlds = [
  { name: "payments",   color: "#FF3B30" },
  { name: "database",   color: "#0066CC" },
  { name: "email",      color: "#34C759" },
  { name: "filesystem", color: "#FF9500" },
  { name: "http",       color: "#BF5AF2" },
  { name: "search",     color: "#64D2FF" },
];

export default function FaultKindsSection() {
  return (
    <section
      className="bg-white section-pad border-t border-[#E5E7EB]"
      id="faults"
      aria-label="Fault kinds"
    >
      <div className="section-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <p className="section-label mb-4">Fault catalog</p>
          <h2 className="heading-md mb-5">16 fault kinds across 6 worlds.</h2>
          <p className="text-[17px] text-[#6B7280] leading-[1.7] max-w-[560px]">
            38 preset scenarios tagged <code className="font-mono text-[15px] bg-[#F3F4F6] px-1.5 py-0.5 rounded-[5px] text-[#374151]">smoke</code>{" "}
            / <code className="font-mono text-[15px] bg-[#F3F4F6] px-1.5 py-0.5 rounded-[5px] text-[#374151]">full</code>{" "}
            / <code className="font-mono text-[15px] bg-[#F3F4F6] px-1.5 py-0.5 rounded-[5px] text-[#374151]">critical</code>.
            Run only what you need.
          </p>
        </motion.div>

        {/* High-impact faults */}
        <div className="mb-12">
          <p className="font-mono text-[11px] text-[#9CA3AF] uppercase tracking-widest mb-5">
            High impact — require behavioral investigation
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tier1Faults.map((f, i) => (
              <motion.div
                key={f.kind}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className="bg-[#F9F9F8] border border-[#E5E7EB] hover:border-[#D1D5DB] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] rounded-[14px] p-4 flex gap-3.5 transition-all duration-200 group"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[6px]"
                  style={{ backgroundColor: f.color }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <code className="font-mono text-[12px] text-[#0066CC] break-all">{f.kind}</code>
                    {f.tag === "flagship" && (
                      <span className="font-mono text-[9px] text-[#FF3B30] border border-[#FF3B30]/30 bg-[#FF3B30]/[0.06] px-1.5 py-0.5 rounded-[4px] tracking-wider uppercase flex-shrink-0">
                        flagship
                      </span>
                    )}
                  </div>
                  <p className="text-[#6B7280] text-[12px] leading-[1.6]">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Infrastructure faults */}
        <div className="mb-12">
          <p className="font-mono text-[11px] text-[#9CA3AF] uppercase tracking-widest mb-5">
            Infrastructure &amp; MCP semantics
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {tier2Faults.map((f, i) => (
              <motion.div
                key={f.kind}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="bg-[#F9F9F8] border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-[10px] p-3 transition-colors cursor-default"
              >
                <code className="font-mono text-[11px] text-[#374151] break-all block leading-snug">{f.kind}</code>
                <p className="text-[#9CA3AF] text-[10px] mt-1.5 leading-[1.5]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Worlds */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="pt-8 border-t border-[#F3F4F6]"
        >
          <p className="font-mono text-[11px] text-[#9CA3AF] uppercase tracking-widest mb-5 text-center">
            6 mock worlds
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {worlds.map((w) => (
              <div
                key={w.name}
                className="flex items-center gap-2 bg-[#F9F9F8] border border-[#E5E7EB] rounded-full px-4 py-1.5 hover:border-[#D1D5DB] transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: w.color }}
                />
                <span className="font-mono text-[12px] font-medium text-[#374151]">{w.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
