"use client";

import Link from "next/link";
import { useState } from "react";

/* ─────────────────────────────────────────────────────────────── */
/* Without Chaosline card                                          */
/* ─────────────────────────────────────────────────────────────── */
function WithoutCard() {
  return (
    <div className="flex flex-col h-full bg-white border border-[#E5E7EB] rounded-[24px] overflow-hidden shadow-sm">
      <div className="px-6 pt-5 pb-4 border-b border-[#F3F4F6] flex items-center justify-between bg-[#FAFAFA]">
        <span className="font-mono text-[11px] font-medium text-[#6B7280] tracking-wider uppercase">Without Chaosline</span>
        <span className="font-mono text-[11px] text-[#9CA3AF]">unprotected</span>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* User bubble */}
        <div className="flex justify-end">
          <div className="bg-[#F3F4F6] rounded-[18px] rounded-tr-[4px] px-5 py-3 max-w-[85%] text-[#1C1C1E] text-[14px]">
            Refund order #4471 — $84.00
          </div>
        </div>

        {/* Agent bubble (Naive response) */}
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-[#FFE4E6] flex items-center justify-center flex-shrink-0 border border-[#FECDD3]">
            <span className="text-[14px]">🤖</span>
          </div>
          <div className="flex flex-col gap-3">
             <div className="text-[#374151] text-[14px] leading-relaxed">
               I apologize, but I'm experiencing technical difficulties with the refund system - it's timing out when I try to process the refund for order #4471 for $84.00. This could be due to a temporary system issue.
               <br/><br/>
               Please try again in a few moments, or contact technical support if the issue persists.
             </div>
             
             {/* Subtle disaster footprint */}
             <div className="border-t border-[#F3F4F6] pt-3 mt-1">
               <div className="font-mono text-[11px] text-[#9CA3AF] space-y-1">
                 <div>status = <span className="text-[#DC2626]">failed</span></div>
                 <div>source = <span className="text-[#1C1C1E]">unknown</span></div>
                 <div>impact = <span className="text-[#1C1C1E]">customer charged $252</span></div>
               </div>
             </div>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#F3F4F6]">
         <p className="text-[12px] text-[#6B7280] flex items-center gap-2">
           <span className="w-4 h-4 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[10px]">✕</span>
           No safety net. Silent retries. Irreversible side-effects.
         </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* With Chaosline card                                             */
/* ─────────────────────────────────────────────────────────────── */
function WithCard() {
  return (
    <div className="flex flex-col h-full bg-white border border-[#E5E7EB] rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-[#F3F4F6] flex items-center justify-between bg-[#1C1C1E]">
        <span className="font-mono text-[11px] font-medium text-white/80 tracking-wider uppercase">With Chaosline</span>
        <span className="flex items-center gap-2 text-[11px] text-[#34C759] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
          caught in CI
        </span>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* User bubble */}
        <div className="flex justify-end">
           <div className="bg-[#F3F4F6] rounded-[18px] rounded-tr-[4px] px-5 py-3 max-w-[85%] text-[#1C1C1E] text-[14px]">
            Refund order #4471 — $84.00
          </div>
        </div>

        {/* Agent bubble (Intercepted) */}
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-[#1C1C1E] flex items-center justify-center flex-shrink-0 border border-white/10 shadow-sm">
            <span className="text-white font-bold text-[12px]">C</span>
          </div>
          <div className="flex flex-col gap-3 w-full">
             <div className="text-[#374151] text-[14px] leading-relaxed">
               Agent failed safe execution constraints. Evaluation captured.
             </div>
             
             {/* Structured Evaluation Block */}
             <div className="border border-[#E5E7EB] rounded-[12px] bg-[#FAFAFA] p-4 font-mono text-[12px] w-full mt-2">
                <div className="grid grid-cols-[80px_1fr] gap-y-2">
                   <div className="text-[#6B7280]">fault</div>
                   <div className="text-[#1C1C1E]">= timeout_after_commit</div>
                   
                   <div className="text-[#6B7280]">retries</div>
                   <div className="text-[#1C1C1E]">= 3 detected</div>
                   
                   <div className="text-[#6B7280]">invariant</div>
                   <div className="text-[#DC2626]">= ledger.length === 3, expected 1</div>
                   
                   <div className="text-[#6B7280]">verdict</div>
                   <div className="text-[#1C1C1E] flex items-center gap-2">
                     = <span className="bg-[#FEE2E2] text-[#DC2626] px-1.5 py-0.5 rounded-[4px] font-bold text-[10px]">HARMFUL_ACTION</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#F3F4F6]">
         <p className="text-[12px] text-[#34C759] flex items-center gap-2 font-medium">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
           Exit 1. PR blocked. Fix before deployment.
         </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Copyable command                                                */
/* ─────────────────────────────────────────────────────────────── */
function CopyCommand() {
  const [copied, setCopied] = useState(false);
  const cmd = "npx chaosline demo";

  const handleCopy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-[12px] px-4 py-2 shadow-sm hover:border-[#D1D5DB] hover:shadow-md transition-all duration-200 cursor-pointer"
      aria-label="Copy command to clipboard"
    >
      <code className="text-[13px] font-mono text-[#1C1C1E] select-all">{cmd}</code>
      <span className="ml-1 flex items-center justify-center w-5 h-5 rounded-[5px] bg-[#F3F4F6] group-hover:bg-[#E5E7EB] transition-colors">
        {copied ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Hero                                                            */
/* ─────────────────────────────────────────────────────────────── */
export default function Hero() {
  return (
    <section
      className="relative bg-[#F9F9F8] pt-[100px] pb-24 overflow-hidden"
      aria-label="Hero"
    >
      {/* Subtle dot grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #9ca3af 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.35,
        }}
        aria-hidden="true"
      />

      <div className="max-w-[1120px] mx-auto px-6 relative">

        {/* ── Top section: two-column ── */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10 lg:gap-16 mb-16 animate-slide-up" style={{ animationFillMode: "both" }}>
          
          {/* Left: Badge + headline + actions */}
          <div className="flex-1 max-w-[600px]">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-full px-4 py-1.5 shadow-sm mb-6">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span className="font-mono text-[11px] font-medium text-[#6B7280] tracking-wider uppercase">
                Pre-deployment fault injection
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-serif text-[#0A0A0A] leading-[1.05] tracking-[-0.02em] mb-8"
              style={{ fontSize: "clamp(40px, 6.5vw, 76px)" }}
            >
              Test your agent<br />
              against{" "}
              <span className="bg-[#60F16D] text-[#0A0A0A] px-3 pb-1 pt-0.5 rounded-[4px] inline-block">
                real failures
              </span>
            </h1>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <CopyCommand />
              <Link
                href="/docs"
                className="flex items-center gap-2 bg-[#0A0A0C] text-white text-[13px] font-medium px-5 py-2.5 rounded-[12px] hover:bg-[#2A2A2A] transition-colors shadow-sm"
              >
                Read docs
              </Link>
            </div>
          </div>

          {/* Right: Description */}
          <div
            className="lg:max-w-[320px] lg:pt-4 animate-slide-up"
            style={{ animationDelay: "80ms", animationFillMode: "both" }}
          >
            <p className="text-[16px] text-[#9CA3AF] leading-[1.7] font-[450]">
  Inject real failures before you ship and uncover bugs your tests miss. No code changes, any MCP compatible agent.
</p>
          </div>
        </div>

        {/* ── Bottom section: comparison cards ── */}
        <div
          className="grid md:grid-cols-2 gap-6 w-full animate-slide-up relative z-10"
          style={{ animationDelay: "160ms", animationFillMode: "both" }}
        >
          <WithoutCard />
          <WithCard />
        </div>


        {/* Card caption */}
        <p
          className="text-center font-mono text-[11px] text-[#9CA3AF] mt-8 animate-fade-in"
          style={{ animationDelay: "300ms", animationFillMode: "both" }}
        >
          scenario: payments/timeout-after-commit · recorded from unmodified OpenAI Agents SDK
        </p>
      </div>
    </section>
  );
}
