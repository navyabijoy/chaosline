"use client";
import { motion } from "framer-motion";

const features = [
  {
    title: "38 preset scenarios",
    desc: "Tagged smoke/full/critical. Run only what matters in CI.",
    color: "#0066cc",
  },
  {
    title: "Custom scenarios",
    desc: "Test your own tools with chaosline init -- no code changes to Chaosline.",
    color: "#34c759",
  },
  {
    title: "Deterministic seeding",
    desc: "Same scenario + seed = same faults = same verdicts. CI-safe.",
    color: "#ff9500",
  },
  {
    title: "Multi-trial orchestration",
    desc: "Flake classification, baseline detection, per-trial pass-rate thresholds.",
    color: "#bf5af2",
  },
  {
    title: "Framework adapters",
    desc: "LangChain, OpenAI Agents SDK, Claude Agent SDK -- examples for all three.",
    color: "#64d2ff",
  },
  {
    title: "Reporting",
    desc: "Markdown / JSON / HTML + PR comment diffs with chaosline report-diff.",
    color: "#34c759",
  },
  {
    title: "CI/CD ready",
    desc: "GitHub Actions template included. Exit code 1 = agent unsafe, 2 = harness error.",
    color: "#ff3b30",
  },
  {
    title: "12+ grading invariants",
    desc: "Deterministic checks: no duplicate side effects, no fabricated values, no false success claims.",
    color: "#0066cc",
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function FeaturesSection() {
  return (
    <section
      className="bg-[#f7f7f5] section-padding"
      id="features"
      aria-label="Features"
    >
      <div className="max-w-[1120px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-[38px] font-[400] text-[#111] leading-[1.1] tracking-[-0.04em] mb-4">
            Built for production use
          </h2>
          <p className="text-[15px] text-[#666] max-w-xl mx-auto leading-relaxed">
            A safety gate you can drop into CI and trust.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              className="bg-white border border-[#e5e5e5] hover:border-[#ccc] rounded-[16px] p-5 transition-colors group"
            >
              <div
                className="w-1.5 h-1.5 rounded-full mb-4"
                style={{ backgroundColor: f.color }}
              />
              <h3 className="text-[#111] font-medium text-[14px] mb-2">
                {f.title}
              </h3>
              <p className="text-[#666] text-[12px] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
