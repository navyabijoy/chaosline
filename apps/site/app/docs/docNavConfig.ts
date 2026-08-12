// Shared doc navigation config — used by both DocsSidebar (client) and DocPage (server)

export type DocNavItem = {
  slug: string;
  label: string;
};

export type DocNavGroup = {
  title: string;
  items: DocNavItem[];
};

export const docNavGroups: DocNavGroup[] = [
  {
    title: "Get started",
    items: [
      { slug: "", label: "Introduction" },
      { slug: "quickstart", label: "Quickstart" },
    ],
  },
  {
    title: "Guides",
    items: [
      { slug: "running-tests", label: "Running tests" },
      { slug: "writing-scenarios", label: "Writing scenarios" },
      { slug: "understanding-results", label: "Understanding results" },
    ],
  },
  {
    title: "Reference",
    items: [
      { slug: "configuration", label: "Configuration" },
      { slug: "architecture", label: "Architecture" },
      { slug: "framework-adapters", label: "Framework adapters" },
    ],
  },
];

export const docNavItems: DocNavItem[] = docNavGroups.flatMap(group => group.items);
