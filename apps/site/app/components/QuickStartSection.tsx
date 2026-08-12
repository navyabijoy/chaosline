"use client";
import { motion } from "framer-motion";
import { useState } from "react";

const codeBlocks = [
  {
    id: "demo",
    step: "01",
    label: "Zero-setup demo",
    comment: "# No API key required",
    code: "npx chaosline demo",
    note: "Shows the flagship finding: 3× charge from 1 intended refund.",
  },
  {
    id: "run",
    step: "02",
    label: "Test your agent",
    comment: "# Run against your agent",
    code: `npx chaosline run \\
  --scenario payments/timeout-after-commit \\
  -- python agent.py`,
    note: "Swap python agent.py with any command that runs your agent.",
  },
  {
    id: "ci",
    step: "03",
    label: "Run in CI",
    comment: "# All critical scenarios — blocks PR if unsafe",
    code: `npx chaosline run \\
  --tag critical \\
  --report-dir ./reports \\
  -- node agent.ts`,
    note: "Exit 0 = safe. Exit 1 = agent unsafe. Exit 2 = harness error.",
  },
];

const otherCommands = [
  ["npx chaosline list",                                   "# See all 38 scenarios"],
  ["npx chaosline list --tag smoke",                       "# Filter by tag"],
  ["npx chaosline replay --bundle ./repro/trial_0.json",   "# Debug a failure"],
  ["npx chaosline report-diff --base a.json --head b.json","# Compare runs"],
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={copy}
      title="Copy"
      className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/70 flex-shrink-0"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
    </button>
  );
}

export default function QuickStartSection() {
  return (
    <section
      className="bg-[#F9F9F8] section-pad border-t border-[#E5E7EB]"
      id="quickstart"
      aria-label="Quick start"
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
          <p className="section-label mb-4">Quick start</p>
          <h2 className="heading-md mb-5">Get started in 2 minutes.</h2>
          <p className="text-[17px] text-[#6B7280] leading-[1.7] max-w-[520px]">
            Demo needs no API key. Full integration needs{" "}
            <code className="font-mono text-[15px] bg-white border border-[#E5E7EB] px-1.5 py-0.5 rounded-[5px] text-[#374151]">
              ANTHROPIC_API_KEY
            </code>{" "}
            or{" "}
            <code className="font-mono text-[15px] bg-white border border-[#E5E7EB] px-1.5 py-0.5 rounded-[5px] text-[#374151]">
              OPENAI_API_KEY
            </code>.
          </p>
        </motion.div>

        {/* Terminal blocks */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {codeBlocks.map((block, i) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className="flex flex-col"
            >
              {/* Terminal window */}
              <div className="terminal-window flex-1 group">
                {/* Titlebar */}
                <div className="terminal-titlebar">
                  <div className="flex gap-1.5">
                    <div className="terminal-dot terminal-dot-red" />
                    <div className="terminal-dot terminal-dot-yellow" />
                    <div className="terminal-dot terminal-dot-green" />
                  </div>
                  <div className="flex-1 flex items-center justify-between ml-2">
                    <span className="font-mono text-[11px] text-white/35">{block.step} · {block.label}</span>
                    <CopyButton text={block.code} />
                  </div>
                </div>

                {/* Code body */}
                <div className="terminal-body">
                  <div className="text-white/30 mb-1">{block.comment}</div>
                  <pre className="font-mono text-[13px] whitespace-pre-wrap">
                    <code>
                      {block.code.split("\n").map((line, li) => {
                        if (li === 0) {
                          // first line: "npx" part
                          const parts = line.split(" ");
                          return (
                            <span key={li} className="block">
                              <span className="text-[#34C759]">{parts[0]}</span>
                              {" "}
                              <span className="text-[#E0E0E0]">{parts.slice(1).join(" ")}</span>
                            </span>
                          );
                        }
                        return (
                          <span key={li} className="block">
                            {line.startsWith("  --") ? (
                              <>
                                <span className="text-white/30">{"  "}</span>
                                <span className="text-[#64D2FF]">{line.trim()}</span>
                              </>
                            ) : line.startsWith("  --") || line.startsWith("  ") ? (
                              <span className="text-[#64D2FF]">{line}</span>
                            ) : (
                              <span className="text-[#E0E0E0]">{line}</span>
                            )}
                          </span>
                        );
                      })}
                    </code>
                  </pre>
                </div>
              </div>

              {/* Note */}
              <p className="mt-10 font-mono text-[11.5px] text-[#6B7280] px-1 leading-[1.6] relative z-10">{block.note}</p>
            </motion.div>
          ))}
        </div>

        {/* Other commands */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.45 }}
          className="max-w-2xl"
        >
          <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-5">
            <p className="text-[#6B7280] text-[12px] font-semibold mb-4 uppercase tracking-wider font-mono">Other commands</p>
            <div className="space-y-2.5">
              {otherCommands.map(([cmd, comment]) => (
                <div key={cmd} className="flex gap-3 flex-wrap items-start">
                  <code className="font-mono text-[12px] text-[#0066CC] leading-relaxed">{cmd}</code>
                  <span className="font-mono text-[12px] text-[#9CA3AF] leading-relaxed">{comment}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
