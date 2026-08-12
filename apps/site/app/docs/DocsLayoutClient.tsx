"use client";
import { useState, useEffect } from "react";
import DocsSidebar from "./components/DocsSidebar";
import { usePathname } from "next/navigation";

export default function DocsLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="bg-ink text-white rounded-full p-3 shadow-lg"
          aria-label="Toggle navigation"
          id="docs-mobile-menu-btn"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <DocsSidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop layout */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8 flex items-start">
        {/* Left sidebar */}
        <aside className="hidden lg:block w-60 xl:w-64 flex-shrink-0 sticky top-[6.5rem] h-[calc(100vh-6.5rem)] overflow-y-auto no-scrollbar">
          <DocsSidebar />
        </aside>

        {/* Main content area (which will include the right TOC inside it) */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </>
  );
}
