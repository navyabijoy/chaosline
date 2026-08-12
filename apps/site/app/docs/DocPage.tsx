import Link from "next/link";
import { docNavItems, docNavGroups } from "./docNavConfig";
import { ChevronRight } from "lucide-react";

interface Props {
  title: string;
  content: string;
  slug: string;
}

// Helper to find which group a slug belongs to
function getGroupForSlug(slug: string) {
  const targetSlug = slug || "";
  for (const group of docNavGroups) {
    if (group.items.some((item) => item.slug === targetSlug)) {
      return group.title;
    }
  }
  return "Documentation";
}

function getBreadcrumb(slug: string) {
  const item = docNavItems.find((i) => i.slug === slug || (slug === "" && i.slug === ""));
  return item?.label ?? slug;
}

function getAdjacentPages(slug: string) {
  const idx = docNavItems.findIndex((i) => i.slug === slug || (slug === "" && i.slug === ""));
  return {
    prev: idx > 0 ? docNavItems[idx - 1] : null,
    next: idx < docNavItems.length - 1 ? docNavItems[idx + 1] : null,
  };
}

// Function to parse HTML, add IDs to headings, and extract the TOC
function processContentForTOC(html: string) {
  const headings: { level: number; id: string; text: string }[] = [];
  let modifiedHtml = html;

  // Regex to find <h2> and <h3> tags
  const regex = /<(h[23])([^>]*)>(.*?)<\/\1>/gi;
  modifiedHtml = modifiedHtml.replace(regex, (match, tag, attrs, innerText) => {
    // Basic text extraction for ID generation
    const cleanText = innerText.replace(/<[^>]+>/g, "").trim();
    const id = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    
    headings.push({
      level: tag.toLowerCase() === "h2" ? 2 : 3,
      id,
      text: cleanText,
    });

    // Inject id into the tag if it doesn't have one
    if (!attrs.includes("id=")) {
      return `<${tag} id="${id}"${attrs}>${innerText}</${tag}>`;
    }
    return match;
  });

  return { html: modifiedHtml, headings };
}

export default function DocPage({ title, content, slug }: Props) {
  const { next } = getAdjacentPages(slug);
  const { html, headings } = processContentForTOC(content);
  const groupName = getGroupForSlug(slug);
  const pageTitle = getBreadcrumb(slug);

  return (
    <div className="flex flex-col xl:flex-row relative">
      {/* Main Content Area */}
      <article className="flex-1 min-w-0 max-w-[800px] py-10 px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-ink/40 mb-8 font-medium">
          <Link href="/docs" className="hover:text-ink transition-colors">{groupName}</Link>
          <ChevronRight size={14} className="opacity-50" />
          <span className="text-ink/80">{pageTitle}</span>
        </nav>

        {/* Title */}
        <h1 className="text-[32px] font-semibold text-ink tracking-tight mb-8">
          {pageTitle}
        </h1>

        {/* Content */}
        <div
          className="prose prose-slate max-w-none
            prose-headings:font-display prose-headings:text-ink prose-headings:font-semibold prose-headings:tracking-tight
            prose-h1:hidden prose-hr:hidden
            prose-h2:text-[24px] prose-h2:mt-12 prose-h2:mb-6
            prose-h3:text-[18px] prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-[15px] prose-p:text-ink/80 prose-p:leading-[1.7]
            prose-li:text-[15px] prose-li:text-ink/80
            prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px]
            prose-pre:bg-[#111111] prose-pre:text-[#e0e0e0] prose-pre:rounded-xl prose-pre:border prose-pre:border-black/10 shadow-sm
            prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
            prose-strong:text-ink prose-strong:font-semibold
            prose-blockquote:border-l-2 prose-blockquote:border-ink/20 prose-blockquote:text-ink/70 prose-blockquote:italic
            prose-table:text-[14px] prose-table:w-full
            prose-th:text-left prose-th:font-medium prose-th:text-ink/70 prose-th:pb-3 prose-th:border-b prose-th:border-hairline
            prose-td:py-3 prose-td:border-b prose-td:border-hairline/50"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* What's Next Section */}
        {next && (
          <div className="mt-16 pt-8">
            <h3 className="text-[18px] font-semibold text-ink mb-6">What's next</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link 
                href={next.slug ? `/docs/${next.slug}` : "/docs"}
                className="group flex flex-col p-6 rounded-2xl border border-hairline hover:border-ink/20 hover:shadow-md transition-all bg-white"
              >
                <div className="text-primary mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                </div>
                <h4 className="text-[15px] font-semibold text-ink mb-1 group-hover:text-primary transition-colors">
                  {next.label}
                </h4>
                <p className="text-[14px] text-ink/60 line-clamp-2">
                  Continue reading about {next.label.toLowerCase()} in the next section.
                </p>
              </Link>
            </div>
          </div>
        )}

        {/* Edit on GitHub */}
        <div className="mt-16 pt-8 border-t border-hairline">
          <a
            href={`https://github.com/navyabijoy/chaosline/edit/main/docs-website/${
              slug === "" ? "00-index.md" : `0${docNavItems.findIndex(i => i.slug === slug)}-${slug}.md`
            }`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-ink/40 hover:text-ink text-[13px] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.4.6.1.82-.26.82-.57v-2c-3.34.73-4.03-1.6-4.03-1.6-.55-1.4-1.33-1.77-1.33-1.77-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.3-1.23 3.3-1.23.64 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.68.82.57C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Edit this page on GitHub
          </a>
        </div>

      </article>

      {/* Right Sidebar (Table of Contents) */}
      <aside className="hidden xl:block w-64 flex-shrink-0 relative">
        <div className="sticky top-32 pt-10 pl-6 border-l border-hairline/50 min-h-[calc(100vh-8rem)]">
          {headings.length > 0 ? (
            <>
              <h4 className="text-[12px] font-semibold text-ink mb-4 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                  <line x1="21" y1="10" x2="3" y2="10"></line>
                  <line x1="21" y1="6" x2="3" y2="6"></line>
                  <line x1="21" y1="14" x2="3" y2="14"></line>
                  <line x1="21" y1="18" x2="3" y2="18"></line>
                </svg>
                On this page
              </h4>
              <ul className="space-y-2.5">
                {headings.map((heading) => (
                  <li 
                    key={heading.id}
                    style={{ paddingLeft: heading.level === 3 ? "12px" : "0" }}
                  >
                    <a
                      href={`#${heading.id}`}
                      className="text-[13px] text-ink/60 hover:text-primary transition-colors line-clamp-2"
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="text-[13px] text-ink/40">No headings on this page.</div>
          )}
        </div>
      </aside>
    </div>
  );
}
