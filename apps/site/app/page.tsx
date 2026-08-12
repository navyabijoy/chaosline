import Link from "next/link";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import HowItWorksSection from "./components/HowItWorksSection";
import VerdictMatrixSection from "./components/VerdictMatrixSection";
import FaultKindsSection from "./components/FaultKindsSection";
import QuickStartSection from "./components/QuickStartSection";
import ComparisonTableSection from "./components/ComparisonTableSection";
import Footer from "./components/Footer";

/* ─────────────────────────────────────────────────────────────── */
/* Problem Section — inline                                        */
/* ─────────────────────────────────────────────────────────────── */
function ProblemSection() {
  return (
    <section
      className="bg-[#F9F9F8] border-t border-[#E5E7EB] section-pad"
      id="problem"
      aria-label="The core problem"
    >
      <div className="section-container">
        {/* Header */}
        <div className="mb-14">
          <p className="section-label mb-4">The core insight</p>
          <h2
            className="font-sans font-[600] text-[#0A0A0A] leading-[1.08] tracking-[-0.03em] mb-6"
            style={{ fontSize: "clamp(32px, 4.5vw, 52px)" }}
          >
            What happens when your agent's tools break?
          </h2>
          <p className="text-[17px] text-[#6B7280] leading-[1.7] max-w-[600px]">
            An agent can truthfully report that an API timed out. But if it retried a
            non-idempotent write, like processing a refund, the customer is charged twice.
            The truth arrives too late.
          </p>
        </div>

        {/* Two failure cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {/* HARMFUL_ACTION */}
          <div className="bg-white border border-[#FECACA] rounded-[18px] p-6 shadow-[0_0_40px_rgba(255,59,48,0.05)]">
            <div className="flex items-center gap-2 mb-5">
              <span className="font-mono text-[11px] font-semibold text-[#FF3B30] bg-[#FF3B30]/[0.08] border border-[#FF3B30]/20 px-2.5 py-1 rounded-[6px] tracking-wider uppercase">
                HARMFUL_ACTION
              </span>
              <span className="text-[12px] text-[#9CA3AF]">Incident</span>
            </div>

            <div className="space-y-2 font-mono text-[12px] mb-5">
              <div className="bg-[#F9F9F8] border border-[#F3F4F6] rounded-[8px] px-3 py-2.5 text-[#6B7280]">
                <span className="text-[#3B82F6]">→ create_refund</span>{" "}
                <span className="text-[#374151]">{"{ order: '#4471', amount: 8400 }"}</span>
              </div>
              <div className="bg-[#FFF5F5] border border-[#FECACA] rounded-[8px] px-3 py-2.5 text-[#DC2626]">
                timeout — response lost · charge committed
              </div>
              <div className="bg-[#F9F9F8] border border-[#F3F4F6] rounded-[8px] px-3 py-2.5 text-[#6B7280]">
                <span className="text-[#3B82F6]">→ create_refund</span>{" "}
                <span className="text-[#DC2626]">× 3 retries</span>
              </div>
            </div>

            <div className="bg-[#FFF5F5] border border-[#FECACA] rounded-[10px] p-4">
              <p className="text-[#DC2626] text-[13px] font-semibold mb-1">Side effect + Honest</p>
              <p className="text-[#374151] text-[13px] leading-[1.6]">
                Agent double-charges the customer ($252 from $84), then honestly says
                <em> "I had a timeout."</em> The truth arrived too late.
              </p>
            </div>
          </div>

          {/* SILENT_FAILURE */}
          <div className="bg-white border border-[#FED7AA] rounded-[18px] p-6 shadow-[0_0_40px_rgba(255,149,0,0.05)]">
            <div className="flex items-center gap-2 mb-5">
              <span className="font-mono text-[11px] font-semibold text-[#FF9500] bg-[#FF9500]/[0.08] border border-[#FF9500]/20 px-2.5 py-1 rounded-[6px] tracking-wider uppercase">
                SILENT_FAILURE
              </span>
              <span className="text-[12px] text-[#9CA3AF]">Critical</span>
            </div>

            <div className="space-y-2 font-mono text-[12px] mb-5">
              <div className="bg-[#F9F9F8] border border-[#F3F4F6] rounded-[8px] px-3 py-2.5 text-[#6B7280]">
                <span className="text-[#3B82F6]">→ get_balance</span>{" "}
                <span className="text-[#374151]">{"{ account: 'main' }"}</span>
              </div>
              <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-[8px] px-3 py-2.5 text-[#92400E]">
                tool returns: <span className="font-semibold">$0.01</span>
                <span className="text-[#9CA3AF] ml-2">← wrong data, no error</span>
              </div>
              <div className="bg-[#F9F9F8] border border-[#F3F4F6] rounded-[8px] px-3 py-2.5 text-[#6B7280]">
                agent: <span className="text-[#374151]">"$84.00 processed successfully"</span>
              </div>
            </div>

            <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-[10px] p-4">
              <p className="text-[#92400E] text-[13px] font-semibold mb-1">Dishonest + No side effect</p>
              <p className="text-[#374151] text-[13px] leading-[1.6]">
                Tool returns wrong data silently. Agent blindly accepts it and reports
                confident false success to the user.
              </p>
            </div>
          </div>
        </div>

        {/* Takeaway */}
        <div className="bg-[#0A0A0C] border border-white/[0.08] rounded-[16px] px-7 py-6 flex items-start gap-4">
          <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-[11px] font-bold">!</span>
          </div>
          <div>
            <p className="text-white text-[15px] font-semibold mb-1">
              Honesty about the outcome does not undo the side effect.
            </p>
            <p className="text-white/50 text-[14px] leading-[1.65]">
              Chaosline grades failures on two independent axes: Side-effects (did it break the world?)
              and Honesty (did it lie?). Only by measuring both can you ship safely.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Features Section — inline                                       */
/* ─────────────────────────────────────────────────────────────── */
const features = [
  { icon: "38", label: "Preset scenarios",    desc: "Ready-to-run across 6 worlds"           },
  { icon: "✦",  label: "Custom scenarios",    desc: "Write your own in YAML or TypeScript"   },
  { icon: "⊙",  label: "Deterministic seed",  desc: "Perfectly reproducible every time"      },
  { icon: "⇉",  label: "Multi-trial",         desc: "Run N trials, aggregate results"        },
  { icon: "⊞",  label: "Framework adapters",  desc: "OpenAI Agents SDK, LangGraph & more"   },
  { icon: "▤",  label: "HTML / JSON reports", desc: "CI-ready, human-readable output"        },
  { icon: "⬡",  label: "CI / CD native",      desc: "Exit codes, --report-dir, GitHub Actions"},
  { icon: "12+", label: "Grading invariants",  desc: "Ledger, inbox, db, fs observers"       },
];

function FeaturesSection() {
  return (
    <section
      className="bg-white section-pad border-t border-[#E5E7EB]"
      id="features"
      aria-label="Features"
    >
      <div className="section-container">
        {/* Header */}
        <div className="mb-14">
          <p className="section-label mb-4">Built for production</p>
          <h2
            className="font-sans font-[600] text-[#0A0A0A] leading-[1.08] tracking-[-0.03em]"
            style={{ fontSize: "clamp(32px, 4.5vw, 52px)" }}
          >
            38 scenarios. 6 worlds. 16 faults.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#E5E7EB] rounded-[18px] overflow-hidden">
          {features.map((f, i) => (
            <div
              key={f.label}
              className={`p-6 border-b border-r border-[#E5E7EB] hover:bg-[#F9F9F8] transition-colors group ${
                // Remove right border on last in each row, bottom border on last row
                (i + 1) % 4 === 0 ? "border-r-0" : ""
              } ${i >= features.length - 4 ? "border-b-0" : ""}`}
            >
              <div className="font-mono text-[18px] font-bold text-[#0A0A0A] mb-3 group-hover:text-[#0066CC] transition-colors">
                {f.icon}
              </div>
              <p className="text-[14px] font-semibold text-[#1C1C1E] mb-1">{f.label}</p>
              <p className="text-[13px] text-[#6B7280] leading-[1.55]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* CTA Section — inline                                            */
/* ─────────────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section
      className="bg-[#0A0A0C] border-t border-white/[0.06] section-pad"
      aria-label="Ready to test your agent"
    >
      <div className="section-container">
        <div className="max-w-[680px] mx-auto text-center">
          {/* Heading */}
          <h2
            className="font-sans font-[600] text-white leading-[1.07] tracking-[-0.035em] mb-6"
            style={{ fontSize: "clamp(36px, 5vw, 60px)" }}
          >
            Ready to test your agent?
          </h2>
          <p className="text-[17px] text-white/50 leading-[1.7] mb-10 max-w-[480px] mx-auto">
            No setup required. See a real failure, like a double-charge from a single refund, in under 2 minutes.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <a
              href="https://github.com/navyabijoy/chaosline"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-white text-[#0A0A0A] rounded-[10px] px-6 py-3 text-[14px] font-semibold hover:bg-white/90 transition-all shadow-[0_0_0_1px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_24px_rgba(255,255,255,0.12)]"
            >
              Try the demo
            </a>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 bg-white/[0.07] text-white border border-white/[0.1] rounded-[10px] px-6 py-3 text-[14px] font-medium hover:bg-white/[0.12] hover:border-white/[0.18] transition-all"
            >
              Read the docs
            </Link>
            <a
              href="https://github.com/navyabijoy/chaosline"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-white/[0.07] text-white border border-white/[0.1] rounded-[10px] px-6 py-3 text-[14px] font-medium hover:bg-white/[0.12] hover:border-white/[0.18] transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </a>
          </div>

          {/* Command hint */}
          <code className="inline-block font-mono text-[13px] text-white/30">
            npx chaosline demo — no API key, under 2 minutes
          </code>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Page                                                            */
/* ─────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen bg-[#F9F9F8] text-[#0A0A0A]">
      <Nav />

      <main>
        {/* 1. Hero */}
        <Hero />

        {/* 2. Problem */}
        <ProblemSection />

        {/* 3. How It Works */}
        <HowItWorksSection />

        {/* 4. Verdict Matrix */}
        <VerdictMatrixSection />

        {/* 5. Fault Catalog */}
        <FaultKindsSection />

        {/* 6. Features Grid */}
        <FeaturesSection />

        {/* 7. Quick Start */}
        <QuickStartSection />

        {/* 8. Comparison Table */}
        <ComparisonTableSection />

        {/* 9. CTA */}
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
