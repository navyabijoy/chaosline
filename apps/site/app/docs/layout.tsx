import type { Metadata } from "next";
import DocsTopNav from "./components/DocsTopNav";
import DocsLayoutClient from "./DocsLayoutClient";

export const metadata: Metadata = {
  title: {
    template: "%s — Chaosline Docs",
    default: "Chaosline Documentation",
  },
  description: "Documentation for Chaosline — pre-deployment fault injection testing for AI agents.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <DocsTopNav />
      <DocsLayoutClient>{children}</DocsLayoutClient>
    </div>
  );
}
