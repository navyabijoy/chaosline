"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export default function CTAFooter() {
  return (
    <section
      className="bg-[#111] section-padding"
      aria-label="Call to action"
    >
      <div className="max-w-[1120px] mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-[38px] font-[400] text-white leading-[1.1] tracking-[-0.04em] mb-4">
            Ready to test your agent?
          </h2>
          <p className="text-[15px] text-white/50 mb-10 max-w-md mx-auto leading-relaxed">
            Zero-setup demo. Full integration needs your API key.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="https://github.com/navyabijoy/chaosline"
              target="_blank"
              rel="noopener noreferrer"
              id="cta-try-demo"
              className="text-[14px] text-[#111] bg-white hover:bg-[#f0f0f0] rounded-[8px] px-6 py-2.5 font-medium transition-colors"
            >
              Try the Demo
            </a>
            <Link
              href="/docs"
              id="cta-read-docs"
              className="text-[14px] text-white border border-white/25 hover:border-white/50 rounded-[8px] px-6 py-2.5 transition-colors"
            >
              Read the Docs
            </Link>
            <a
              href="https://github.com/navyabijoy/chaosline"
              target="_blank"
              rel="noopener noreferrer"
              id="cta-github"
              className="text-[14px] text-white/60 hover:text-white rounded-[8px] px-6 py-2.5 transition-colors"
            >
              GitHub
            </a>
          </div>

          <p className="mt-8 text-white/25 text-[12px] font-mono">
            npx chaosline demo -- no API key, under 2 minutes
          </p>
        </motion.div>
      </div>
    </section>
  );
}
