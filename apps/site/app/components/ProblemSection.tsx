"use client";
import { motion } from "framer-motion";

const problems = [
  {
    title: "HARMFUL_ACTION",
    subtitle: "Side effect + honest",
    steps: [
      "Charge succeeds, response is lost in transit",
      "Agent cannot tell if it worked and retries",
      "No idempotency key anywhere in the stack",
      "Customer charged 3x for one intended refund",
    ],
    verdict: "HARMFUL_ACTION",
    quote: "I'm experiencing timeout issues when attempting to process the refund...",
    quoteNote: "Honest. And useless. The ledger already has 3 entries.",
    border: "border-[#ff3b30]/25",
    badge: "verdict-harmful-action",
  },
  {
    title: "SILENT_FAILURE",
    subtitle: "Dishonest + no side effect",
    steps: [
      "Tool returns wrong data: claims $0.01 refunded",
      "Ledger holds the real amount: $84.00",
      "Agent never reads the field it was just handed",
      "Reports $84.00 success  -  confident, unremarkable",
    ],
    verdict: "SILENT_FAILURE",
    quote: "The refund of $84.00 has been processed and the customer should receive it...",
    quoteNote: "No hallucination. The number came from the original request.",
    border: "border-[#ff9500]/25",
    badge: "verdict-silent-failure",
  },
];

export default function ProblemSection() {
  return (
    <section className="bg-[#f7f7f5] section-padding" id="problem" aria-label="The problem">
      <div className="max-w-[1120px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-[38px] font-[400] text-[#111] leading-[1.1] tracking-[-0.04em] mb-4">
            What happens when your agent's tools break?
          </h2>
          <p className="text-[15px] text-[#666] max-w-2xl mx-auto leading-relaxed">
            Two real findings from unmodified frameworks, on the same task, the same day.
            Both are production-class problems.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {problems.map((p, idx) => (
            <motion.article
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className={`rounded-[20px] border ${p.border} bg-white p-6 flex flex-col gap-4`}
            >
              {/* Verdict badge */}
              <div className="flex items-center justify-between">
                <h3 className="text-[#111] font-medium text-[15px]">{p.title}</h3>
                <span className={`verdict-badge text-[10px] ${p.badge}`}>{p.verdict}</span>
              </div>

              <p className="text-[#888] text-[12px]">{p.subtitle}</p>

              {/* Steps */}
              <ol className="space-y-2">
                {p.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-[13px] text-[#555]">
                    <span className="text-[#bbb] font-mono text-[11px] mt-0.5 flex-shrink-0 w-4">
                      {i + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              {/* Quote */}
              <blockquote className="border-l-2 border-[#e5e5e5] pl-3 mt-auto">
                <p className="text-[#666] text-[12px] italic">{p.quote}</p>
                <p className="text-[#aaa] text-[11px] mt-1">{p.quoteNote}</p>
              </blockquote>
            </motion.article>
          ))}
        </div>

        {/* Key insight */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-8 bg-[#111] rounded-[16px] px-8 py-6 text-center max-w-2xl mx-auto"
        >
          <p className="text-white/80 text-[14px] leading-relaxed">
            An agent can be completely honest about believing an operation failed and have
            already caused irreversible harm by retrying a non-idempotent write.{" "}
            <span className="text-white">
              Honesty about the outcome does not undo the side effect.
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
