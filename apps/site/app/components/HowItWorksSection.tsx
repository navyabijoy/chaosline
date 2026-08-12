"use client";
import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Intercept at boundaries",
    desc: "Model proxy + tool proxy sit transparently between your agent and its dependencies. Activated by a single environment variable — zero code changes to your agent.",
    detail: "CHAOSLINE_MODE=active npx chaosline run ...",
  },
  {
    num: "02",
    title: "Inject deterministic faults",
    desc: "16 fault kinds applied across 6 mock worlds: timeouts, rate limits, corrupted data, schema drift, auth expiry, silent wrong data, and more.",
    detail: "payments/timeout-after-commit → ledger committed, response dropped",
  },
  {
    num: "03",
    title: "Observe the world state",
    desc: "Chaosline records what actually changed in the ledger, database, filesystem, and inbox while the agent tries to recover — independent of what the agent reports.",
    detail: "ledger.entries: 3 · agent_claim: 'one refund processed'",
  },
  {
    num: "04",
    title: "Grade the outcome",
    desc: "Every trial produces a verdict: SAFE_FAILURE, DEGRADED, SILENT_FAILURE, or HARMFUL_ACTION. A repro bundle is saved for replaying and debugging.",
    detail: "exit 1 — HARMFUL_ACTION detected · bundle saved to ./repro/trial_0.json",
  },
];

const proxyFlow = [
  { label: "Your agent", sub: "unmodified" },
  { label: "Model Proxy", sub: "intercepts LLM calls", highlight: true },
  { label: "LLM", sub: "Claude / GPT / etc." },
];

const toolFlow = [
  { label: "Your agent", sub: "unmodified" },
  { label: "Tool Proxy", sub: "injects faults", highlight: true },
  { label: "Mock World", sub: "payments · db · email" },
];

export default function HowItWorksSection() {
  return (
    <section
      className="bg-white section-pad border-t border-[#E5E7EB]"
      id="how-it-works"
      aria-label="How it works"
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
          <p className="section-label mb-4">How it works</p>
          <h2 className="heading-md max-w-2xl mb-5">
            Two-boundary interception,<br />zero code changes.
          </h2>
          <p className="text-[17px] text-[#6B7280] leading-[1.7] max-w-[560px]">
            Chaosline sits between your agent and its tools. Grading is based on
            observable world state, not LLM opinions.
          </p>
        </motion.div>

        {/* Proxy diagrams */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-16 grid sm:grid-cols-2 gap-4"
        >
          {[{ title: "LLM boundary", flow: proxyFlow }, { title: "Tool boundary", flow: toolFlow }].map(
            ({ title, flow }) => (
              <div key={title} className="bg-[#F9F9F8] border border-[#E5E7EB] rounded-[16px] p-6">
                <p className="font-mono text-[11px] text-[#9CA3AF] uppercase tracking-widest mb-5">{title}</p>
                <div className="flex items-center gap-2">
                  {flow.map((node, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className={`rounded-[10px] px-3 py-2 text-center ${
                          node.highlight
                            ? "bg-[#0A0A0A] text-white border border-[#0A0A0A]"
                            : "bg-white border border-[#E5E7EB] text-[#374151]"
                        }`}
                      >
                        <p className={`text-[12px] font-semibold ${node.highlight ? "text-white" : "text-[#1C1C1E]"}`}>
                          {node.label}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${node.highlight ? "text-white/60" : "text-[#9CA3AF]"}`}>
                          {node.sub}
                        </p>
                      </div>
                      {i < flow.length - 1 && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="flex-shrink-0 text-[#D1D5DB]">
                          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </motion.div>

        {/* Steps */}
        <div className="space-y-0 divide-y divide-[#F3F4F6]">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="flex gap-8 py-8 group"
            >
              {/* Step number */}
              <p className="flex-shrink-0 font-mono text-[11px] font-medium text-[#D1D5DB] w-8 pt-1 group-hover:text-[#9CA3AF] transition-colors">
                {step.num}
              </p>

              {/* Content */}
              <div className="flex-1 grid sm:grid-cols-[1fr_auto] gap-4 items-start">
                <div>
                  <h3 className="text-[16px] font-semibold text-[#0A0A0A] mb-2">{step.title}</h3>
                  <p className="text-[14px] text-[#6B7280] leading-[1.65]">{step.desc}</p>
                </div>
                <div className="sm:max-w-[260px] bg-[#F9F9F8] border border-[#E5E7EB] rounded-[10px] px-3 py-2.5 flex-shrink-0">
                  <code className="font-mono text-[11px] text-[#6B7280] break-all leading-relaxed">
                    {step.detail}
                  </code>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
