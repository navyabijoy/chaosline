"use client";
import { motion } from "framer-motion";

const tools = [
  {
    name: "Observability",
    examples: "Langfuse, LangSmith",
    question: "What happened, after the fact, in production",
    chaosline: false,
  },
  {
    name: "Eval frameworks",
    examples: "promptfoo, DeepEval",
    question: "Was the answer good or correct",
    chaosline: false,
  },
  {
    name: "Infra chaos",
    examples: "Gremlin, Chaos Mesh",
    question: "What if the network partitions",
    chaosline: false,
  },
  {
    name: "Chaosline",
    examples: "",
    question: "What does the agent DO when its tools break, and does it admit it",
    chaosline: true,
  },
];

export default function ComparisonTableSection() {
  return (
    <section
      className="bg-white section-pad border-t border-[#E5E7EB]"
      id="comparison"
      aria-label="Why existing tooling does not cover this"
    >
      <div className="section-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <p className="section-label mb-4">Comparison</p>
          <h2 className="heading-md mb-5">Why existing tooling doesn't cover this.</h2>
          <p className="text-[17px] text-[#6B7280] leading-[1.7] max-w-[520px]">
            Four categories of tool. Four different questions. Only one asks whether
            the agent causes irreversible harm.
          </p>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-5xl"
        >
          <div className="overflow-x-auto rounded-[18px] border border-[#E5E7EB] shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            <table className="w-full text-left" role="table">
              <thead>
                <tr className="bg-[#F9F9F8] border-b border-[#E5E7EB]">
                  <th className="px-5 py-3.5 font-mono text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Tool class
                  </th>
                  <th className="px-5 py-3.5 font-mono text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Examples
                  </th>
                  <th className="px-5 py-3.5 font-mono text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Question answered
                  </th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool) => (
                  <tr
                    key={tool.name}
                    className={`border-b border-[#F3F4F6] last:border-0 transition-colors ${
                      tool.chaosline
                        ? "bg-[#F0F5FF]"
                        : "bg-white hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {tool.chaosline && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0066CC] flex-shrink-0" />
                        )}
                        <span
                          className={`font-semibold text-[14px] ${
                            tool.chaosline ? "text-[#0066CC]" : "text-[#374151]"
                          }`}
                        >
                          {tool.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-[#9CA3AF] text-[12px]">
                      {tool.examples || (
                        <span className="text-[#D1D5DB]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[13px]">
                      {tool.chaosline ? (
                        <strong className="text-[#0A0A0A] font-semibold">{tool.question}</strong>
                      ) : (
                        <span className="text-[#6B7280]">{tool.question}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-[#9CA3AF] text-[12px] font-mono">
            These are complementary, not competing. Chaosline answers the question none of them ask.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
