import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export default function ScenariosPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F8] text-[#0A0A0A]">
      <Nav />

      <main className="pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative px-6 py-20 overflow-hidden border-b border-[#E5E7EB]">
          {/* Subtle grid texture */}
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
                    Fault Taxonomy
                  </span>
                </div>
            </div>
            
            <h1
              className="font-sans font-[600] text-[#0A0A0A] leading-[1.05] tracking-[-0.04em] mb-6 animate-slide-up"
              style={{ fontSize: "clamp(36px, 5vw, 64px)", animationDelay: "100ms", animationFillMode: "both" }}
            >
              16 fault kinds across 6 worlds
            </h1>
            <p
              className="text-[17px] text-[#6B7280] max-w-[600px] mx-auto leading-[1.7] animate-slide-up"
              style={{ animationDelay: "200ms", animationFillMode: "both" }}
            >
              Every fault isolates a specific failure mode. Deterministic seeding ensures your agent faces the same challenge every run.
            </p>
          </div>
        </section>

        {/* Tier 1 - Deep Dives */}
        <section className="px-6 py-24">
          <div className="max-w-[1120px] mx-auto">
            <div className="mb-14">
               <p className="section-label mb-4">Tier 1 Faults</p>
               <h2 className="font-sans font-[600] text-[#0A0A0A] leading-[1.08] tracking-[-0.03em] mb-4" style={{ fontSize: "clamp(28px, 3vw, 40px)" }}>
                 High-Impact Failure Modes
               </h2>
               <p className="text-[16px] text-[#6B7280] max-w-[700px]">
                 These faults reveal critical flaws in agent reasoning. A well-built agent can safely handle them, but most default setups will fail catastrophically.
               </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Timeout after commit */}
              <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all">
                <div className="flex items-center gap-2 mb-6">
                  <span className="font-mono text-[11px] font-semibold text-[#FF3B30] bg-[#FF3B30]/[0.08] border border-[#FF3B30]/20 px-2.5 py-1 rounded-[6px] tracking-wider uppercase">
                    HARMFUL_ACTION
                  </span>
                  <span className="font-mono text-[13px] font-bold text-[#0A0A0A]">timeout_after_commit</span>
                </div>
                <p className="text-[14px] text-[#6B7280] mb-4 leading-[1.6]">
                  Applies the tool's side effect (e.g., executing a charge), but drops the response. The agent sees a timeout and cannot distinguish "never happened" from "happened, response lost."
                </p>
                <div className="bg-[#F9F9F8] border border-[#F3F4F6] rounded-[12px] p-4 font-mono text-[12px]">
                   <span className="text-[#3B82F6]">Why it matters:</span> Tests the classic non-idempotent-retry bug. LLM agents are structurally predisposed to blindly retrying failed calls.
                </div>
              </div>

              {/* Silent Wrong Data */}
              <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all">
                 <div className="flex items-center gap-2 mb-6">
                  <span className="font-mono text-[11px] font-semibold text-[#FF9500] bg-[#FF9500]/[0.08] border border-[#FF9500]/20 px-2.5 py-1 rounded-[6px] tracking-wider uppercase">
                    SILENT_FAILURE
                  </span>
                  <span className="font-mono text-[13px] font-bold text-[#0A0A0A]">silent_wrong_data</span>
                </div>
                <p className="text-[14px] text-[#6B7280] mb-4 leading-[1.6]">
                  Returns a well-formed, schema-valid response containing incorrect values (wrong magnitude, wrong entity, or stale data).
                </p>
                <div className="bg-[#F9F9F8] border border-[#F3F4F6] rounded-[12px] p-4 font-mono text-[12px]">
                   <span className="text-[#3B82F6]">Why it matters:</span> Tests if the agent sanity-checks data against independent sources or flags implausibility, rather than blindly acting on bad data.
                </div>
              </div>

               {/* Omission */}
               <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all">
                 <div className="flex items-center gap-2 mb-6">
                  <span className="font-mono text-[11px] font-semibold text-[#FF9500] bg-[#FF9500]/[0.08] border border-[#FF9500]/20 px-2.5 py-1 rounded-[6px] tracking-wider uppercase">
                    SILENT_FAILURE
                  </span>
                  <span className="font-mono text-[13px] font-bold text-[#0A0A0A]">omission</span>
                </div>
                <p className="text-[14px] text-[#6B7280] mb-4 leading-[1.6]">
                  Returns empty or truncated results, dropping array elements, or omitting optional fields. Bypasses error handling entirely since the response is valid.
                </p>
                <div className="bg-[#F9F9F8] border border-[#F3F4F6] rounded-[12px] p-4 font-mono text-[12px]">
                   <span className="text-[#3B82F6]">Why it matters:</span> Agents often assume absence of data means truth, leading to hallucinations if they fabricate content to fill gaps.
                </div>
              </div>

              {/* Partial Failure */}
              <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all">
                 <div className="flex items-center gap-2 mb-6">
                  <span className="font-mono text-[11px] font-semibold text-[#FF3B30] bg-[#FF3B30]/[0.08] border border-[#FF3B30]/20 px-2.5 py-1 rounded-[6px] tracking-wider uppercase">
                    HARMFUL_ACTION
                  </span>
                  <span className="font-mono text-[13px] font-bold text-[#0A0A0A]">partial_failure_mid_plan</span>
                </div>
                <p className="text-[14px] text-[#6B7280] mb-4 leading-[1.6]">
                  Fails a task mid-execution (e.g., step 3 of 7), after initial steps have already mutated the world state.
                </p>
                <div className="bg-[#F9F9F8] border border-[#F3F4F6] rounded-[12px] p-4 font-mono text-[12px]">
                   <span className="text-[#3B82F6]">Why it matters:</span> The most common cause of weird data states. Tests if the agent rolls back, retries sanely, or abandons the task silently.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MCP Semantics */}
        <section className="px-6 py-24 bg-[#0A0A0C] border-t border-white/[0.06] text-white">
          <div className="max-w-[1120px] mx-auto">
             <div className="mb-12">
               <p className="font-mono text-[11px] font-medium text-white/50 tracking-widest uppercase mb-4">The Differentiator</p>
               <h2 className="font-sans font-[600] leading-[1.08] tracking-[-0.03em] mb-4" style={{ fontSize: "clamp(28px, 3vw, 40px)" }}>
                 MCP Semantics Awareness
               </h2>
               <p className="text-[16px] text-white/60 max-w-[800px] leading-[1.6]">
                 Unlike simple byte-matching proxies, Chaosline understands the Model Context Protocol (MCP). It can inject structural and semantic faults that traditional proxies are blind to.
               </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {[
                 { name: "schema_violating_output", desc: "Returns structuredContent that violates the tool's declared outputSchema. Most clients don't validate, causing invisible failures." },
                 { name: "annotation_lie", desc: "Flips readOnlyHint on destructive tools, testing if an agent reasons based on lies." },
                 { name: "wrong_error_channel", desc: "Swaps isError channels with JSON-RPC errors, testing disparate error handling paths." },
                 { name: "capability_downgrade", desc: "Strips advertised capabilities from meta, testing graceful degradation." },
                 { name: "stale_cache", desc: "Manipulates ttlMs to make the agent act on expired tool lists." },
                 { name: "tool_list_drift", desc: "Removes or renames a tool between list and call phases." }
               ].map(fault => (
                  <div key={fault.name} className="bg-white/[0.03] border border-white/[0.08] p-6 rounded-[16px]">
                     <p className="font-mono text-[13px] font-bold text-[#64D2FF] mb-2">{fault.name}</p>
                     <p className="text-[13px] text-white/50 leading-[1.6]">{fault.desc}</p>
                  </div>
               ))}
            </div>
          </div>
        </section>
        
        {/* Tier 2 & Coverage Grid */}
        <section className="px-6 py-24">
          <div className="max-w-[1120px] mx-auto">
             <div className="mb-12">
               <h2 className="font-sans font-[600] text-[#0A0A0A] leading-[1.08] tracking-[-0.03em] mb-4" style={{ fontSize: "clamp(24px, 2.5vw, 32px)" }}>
                 Essential Coverage
               </h2>
               <p className="text-[16px] text-[#6B7280]">Foundational tests for basic robustness and retry discipline.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-[#E5E7EB] rounded-[18px] overflow-hidden bg-white">
                {[
                  { name: "timeout / hang", desc: "Tests basic retry and backoff discipline." },
                  { name: "rate_limit_429", desc: "Tests respect for Retry-After headers." },
                  { name: "malformed_response", desc: "Tests parser robustness against bad JSON." },
                  { name: "schema_drift", desc: "Reaction to a changed tool contract." },
                  { name: "auth_expiry", desc: "Tests mid-run token expiration handling." },
                  { name: "empty_result", desc: "Distinguishing 'no data' from 'broken'." },
                  { name: "slow_but_ok", desc: "Latency tolerance without false failure." },
                  { name: "retry_storm", desc: "Cost blowup detection on persistent failures." },
                ].map((f, i) => (
                  <div
                    key={f.name}
                    className={`p-6 border-b border-r border-[#E5E7EB] hover:bg-[#F9F9F8] transition-colors ${
                      (i + 1) % 4 === 0 ? "lg:border-r-0" : ""
                    } ${
                       (i + 1) % 2 === 0 ? "sm:border-r-0 lg:border-r" : ""
                    } ${i >= 4 ? "border-b-0" : ""}`}
                  >
                    <p className="font-mono text-[13px] font-bold text-[#0A0A0A] mb-2">{f.name}</p>
                    <p className="text-[13px] text-[#6B7280] leading-[1.55]">{f.desc}</p>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* Mock Worlds */}
        <section className="px-6 py-24 border-t border-[#E5E7EB]">
           <div className="max-w-[1120px] mx-auto text-center">
              <h2 className="font-sans font-[600] text-[#0A0A0A] leading-[1.08] tracking-[-0.03em] mb-12" style={{ fontSize: "clamp(28px, 3vw, 40px)" }}>
                 Mock Worlds
               </h2>
               <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                  {[
                    { name: "Payments", desc: "Payment processing, refunds, transactions. Tests idempotency and financial risk." },
                    { name: "Database", desc: "Data integrity, reads, writes, consistency. Tests rollback logic." },
                    { name: "Email", desc: "Message delivery, inbox state. Tests sensitive outbound comms." },
                    { name: "Filesystem", desc: "File operations, directory state." },
                    { name: "HTTP", desc: "API responses, status codes, timeouts." },
                    { name: "Search", desc: "Query results, indexing, handling absence of data." },
                  ].map(world => (
                     <div key={world.name} className="bg-white border border-[#E5E7EB] p-6 rounded-[16px] shadow-sm">
                        <h3 className="font-semibold text-[15px] text-[#0A0A0A] mb-2">{world.name}</h3>
                        <p className="text-[14px] text-[#6B7280]">{world.desc}</p>
                     </div>
                  ))}
               </div>
           </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
