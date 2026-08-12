import Link from "next/link";
import Logo from "../../components/Logo";

export default function DocsTopNav() {
  return (
    <div className="sticky top-0 z-50 w-full border-b border-hairline bg-white/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-6 mx-auto max-w-[1440px]">
        {/* Left: Brand */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="Chaosline home"
          >
            <Logo />
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/navyabijoy/chaosline"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex text-[13px] text-white bg-[#0A0A0C] hover:bg-[#2A2A2A] shadow-sm px-4 py-1.5 rounded-[10px] transition-colors font-medium"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
