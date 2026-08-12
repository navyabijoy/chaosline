import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

const comparison = [
  {
    aspect: "Observes agent behavior under failure",
    chaosline: "✓",
    observability: "—",
    eval: "—",
    infra: "—",
  },
  {
    aspect: "Grades on side effects + honesty",
    chaosline: "✓",
    observability: "—",
    eval: "—",
    infra: "—",
  },
  {
    aspect: "Deterministic fault injection",
    chaosline: "✓",
    observability: "—",
    eval: "—",
    infra: "✓",
  },
  {
    aspect: "Replayable test bundles",
    chaosline: "✓",
    observability: "—",
    eval: "—",
    infra: "—",
  },
  {
    aspect: "Framework adapters (OpenAI, Anthropic)",
    chaosline: "✓",
    observability: "—",
    eval: "✓",
    infra: "—",
  },
  {
    aspect: "Mock worlds (payments, database, email)",
    chaosline: "✓",
    observability: "—",
    eval: "—",
    infra: "—",
  },
];

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-[#F9F9F8] text-[#0A0A0A]">
      <Nav />

      <main className="pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative px-6 py-20 overflow-hidden border-b border-[#E5E7EB]">
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.018]"
            style={{
              backgroundImage:
                "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
            aria-hidden="true"
          />

          <div className="max-w-[1120px] mx-auto relative text-center">
             <div
                className="flex justify-center mb-6 animate-slide-up"
                style={{ animationFillMode: "both" }}
             >
                <div className="inline-flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-full px-4 py-2 shadow-sm">
                  <span className="font-mono text-[11px] text-[#6B7280] tracking-wider uppercase">
                    How it compares
                  </span>
                </div>
            </div>
            
            <h1
              className="font-sans font-[600] text-[#0A0A0A] leading-[1.05] tracking-[-0.04em] mb-6 animate-slide-up"
              style={{ fontSize: "clamp(36px, 5vw, 64px)", animationDelay: "100ms", animationFillMode: "both" }}
            >
              The only tool that answers:<br/> what does your agent DO?
            </h1>
            <p
              className="text-[17px] text-[#6B7280] max-w-[640px] mx-auto leading-[1.7] animate-slide-up"
              style={{ animationDelay: "200ms", animationFillMode: "both" }}
            >
              Observability platforms, eval frameworks, and infrastructure chaos tools each solve critical, but different problems. Chaosline fills a unique gap in pre-deployment safety testing.
            </p>
          </div>
        </section>

        {/* Detailed Comparisons */}
        <section className="px-6 py-24">
          <div className="max-w-[1120px] mx-auto">
            <div className="mb-14">
               <h2 className="font-sans font-[600] text-[#0A0A0A] leading-[1.08] tracking-[-0.03em] mb-4" style={{ fontSize: "clamp(28px, 3vw, 40px)" }}>
                 Where Chaosline fits
               </h2>
               <p className="text-[16px] text-[#6B7280] max-w-[700px]">
                 Simulation vendors vary conversational inputs. Security vendors vary malicious inputs. Chaosline is the first tool to purposefully vary the failure of the infrastructure the agent depends on.
               </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              
              {/* vs Proxies */}
              <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all">
                <div className="font-mono text-[13px] font-bold text-[#0066CC] mb-4">vs Mocking Proxies</div>
                <h3 className="font-semibold text-[17px] text-[#0A0A0A] mb-3">Semantics over bytes</h3>
                <p className="text-[14px] text-[#6B7280] mb-4 leading-[1.6]">
                  Standard developer proxies operate on raw bytes and JSON fragments. They do not understand MCP semantics, cannot violate schemas safely, and most importantly, do not grade anything.
                </p>
                <div className="bg-[#F9F9F8] border border-[#F3F4F6] rounded-[12px] p-4 text-[13px] text-[#374151]">
                  A proxy can inject a fault. Chaosline tells you whether your agent caused a catastrophic side-effect because of it.
                </div>
              </div>

              {/* vs Observability */}
              <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all">
                 <div className="font-mono text-[13px] font-bold text-[#0066CC] mb-4">vs Observability</div>
                <h3 className="font-semibold text-[17px] text-[#0A0A0A] mb-3">Pre-deployment vs Post-deployment</h3>
                <p className="text-[14px] text-[#6B7280] mb-4 leading-[1.6]">
                  Observability tools and APMs are essential for understanding what happened *after* code is shipped. They alert you when a customer experiences a failure in production.
                </p>
                <div className="bg-[#F9F9F8] border border-[#F3F4F6] rounded-[12px] p-4 text-[13px] text-[#374151]">
                  Chaosline triggers those failures safely in CI, before they ever reach a production environment or impact users.
                </div>
              </div>

               {/* vs Evals */}
               <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all">
                 <div className="font-mono text-[13px] font-bold text-[#0066CC] mb-4">vs Eval Frameworks</div>
                <h3 className="font-semibold text-[17px] text-[#0A0A0A] mb-3">Action vs Quality</h3>
                <p className="text-[14px] text-[#6B7280] mb-4 leading-[1.6]">
                  LLM evaluation frameworks are designed to measure generation quality—whether the agent gives good, accurate, and helpful answers to user prompts.
                </p>
                <div className="bg-[#F9F9F8] border border-[#F3F4F6] rounded-[12px] p-4 text-[13px] text-[#374151]">
                  Chaosline tests whether the agent survives infrastructural chaos, evaluating its actions and resilience rather than its tone or accuracy.
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="px-6 py-24 bg-[#0A0A0C] border-t border-white/[0.06] text-white">
          <div className="max-w-[1120px] mx-auto">
             <div className="mb-12 text-center">
               <h2 className="font-sans font-[600] leading-[1.08] tracking-[-0.03em] mb-4" style={{ fontSize: "clamp(28px, 3vw, 40px)" }}>
                 Feature Comparison
               </h2>
               <p className="text-[16px] text-white/60">
                 Chaosline complements your existing toolchain.
               </p>
            </div>

            <div className="overflow-x-auto rounded-[16px] border border-white/[0.08] bg-[#0F0F11]">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="px-6 py-4 text-left font-semibold text-white/90" style={{ width: "35%" }}>
                      Capability
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-[#64D2FF]">Chaosline</th>
                    <th className="px-6 py-4 text-center font-semibold text-white/40">Observability</th>
                    <th className="px-6 py-4 text-center font-semibold text-white/40">Eval</th>
                    <th className="px-6 py-4 text-center font-semibold text-white/40">Infra Tools</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"}>
                      <td className="border-t border-white/[0.04] px-6 py-4 text-white/80">{row.aspect}</td>
                      <td className="border-t border-white/[0.04] px-6 py-4 text-center text-[#34C759] font-bold">
                        {row.chaosline === "✓" ? "✓" : <span className="text-white/20">—</span>}
                      </td>
                      <td className="border-t border-white/[0.04] px-6 py-4 text-center text-white/40">
                        {row.observability === "✓" ? "✓" : "—"}
                      </td>
                      <td className="border-t border-white/[0.04] px-6 py-4 text-center text-white/40">
                        {row.eval === "✓" ? "✓" : "—"}
                      </td>
                      <td className="border-t border-white/[0.04] px-6 py-4 text-center text-white/40">
                        {row.infra === "✓" ? "✓" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-24 border-t border-[#E5E7EB] bg-[#F9F9F8]">
          <div className="max-w-[700px] mx-auto text-center">
            <h2
              className="font-sans font-[600] text-[#0A0A0A] leading-[1.07] tracking-[-0.035em] mb-6"
              style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
            >
              Use multiple tools.<br/> They work together.
            </h2>
            <p className="mt-6 text-[17px] text-[#6B7280] mb-10 max-w-[480px] mx-auto">
              Chaosline sits in pre-deployment testing. Observability, eval frameworks, and infra chaos serve different stages of the pipeline.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/docs"
                className="inline-flex items-center text-[13px] font-medium text-white bg-[#0A0A0A] hover:bg-[#2A2A2A] rounded-[10px] px-6 py-3 transition-all duration-150 shadow-sm hover:shadow-md"
              >
                Read the docs
              </Link>
               <Link
                href="/"
                className="inline-flex items-center text-[13px] font-medium text-[#1C1C1E] bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] hover:shadow-sm rounded-[10px] px-6 py-3 transition-all duration-150"
              >
                Back to home
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
