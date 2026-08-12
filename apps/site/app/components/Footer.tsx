import Link from "next/link";
import Logo from "./Logo";

const footerLinks = [
  {
    heading: "Product",
    links: [
      { label: "Documentation",   href: "/docs"                                     },
      { label: "Scenarios",       href: "/scenarios"                                 },
      { label: "Compare",         href: "/compare"                                   },
      { label: "Quick start",     href: "/docs/quickstart"                           },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "GitHub",          href: "https://github.com/navyabijoy/chaosline", external: true },
      { label: "Writing scenarios", href: "/docs/writing-scenarios"                },
      { label: "Replay bundles",  href: "/docs/replay"                              },
      { label: "CI / CD guide",   href: "/docs/ci"                                  },
    ],
  },
  {
    heading: "Faults",
    links: [
      { label: "16 fault kinds",  href: "/#faults"                                  },
      { label: "6 mock worlds",   href: "/#faults"                                  },
      { label: "Verdict model",   href: "/#verdicts"                                },
      { label: "Grading rules",   href: "/docs/grading"                             },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0C] border-t border-white/[0.06]">
      {/* Main footer content */}
      <div className="max-w-[1120px] mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            {/* Wordmark */}
            <div className="mb-5">
              <Logo light={true} />
            </div>

            <p className="text-white/45 text-[13px] leading-[1.75] max-w-[220px] mb-8">
              Pre-deployment fault injection testing for AI agents.
              Find safety bugs before your users do.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/navyabijoy/chaosline"
                target="_blank"
                rel="noreferrer"
                title="GitHub"
                className="w-8 h-8 rounded-[8px] bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.1] transition-all duration-150"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href="https://twitter.com/"
                target="_blank"
                rel="noreferrer"
                title="Twitter / X"
                className="w-8 h-8 rounded-[8px] bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.1] transition-all duration-150"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.heading}>
              <p className="font-mono text-[11px] font-medium text-white/25 uppercase tracking-[0.12em] mb-5">
                {col.heading}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[14px] text-white/50 hover:text-white transition-colors duration-150"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-[14px] text-white/50 hover:text-white transition-colors duration-150"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.06]">
        <div className="max-w-[1120px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="font-mono text-[12px] text-white/25">
            © {new Date().getFullYear()} Chaosline. Open source.
          </p>
          <div className="flex items-center gap-6">
            <code className="font-mono text-[11px] text-white/20">
              npx chaosline demo
            </code>
            <a
              href="https://github.com/navyabijoy/chaosline"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[12px] text-white/30 hover:text-white/60 transition-colors duration-150"
            >
              View on GitHub →
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
