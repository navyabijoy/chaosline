import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

// The docs-website directory is at the monorepo root
const DOCS_DIR = path.join(process.cwd(), "..", "..", "docs-website");

export interface DocMeta {
  slug: string;
  title: string;
  content: string;
}

const slugToFile: Record<string, string> = {
  index: "00-index.md",
  quickstart: "01-quickstart.md",
  "running-tests": "02-running-tests.md",
  "writing-scenarios": "03-writing-scenarios.md",
  "understanding-results": "04-understanding-results.md",
  "framework-adapters": "05-framework-adapters.md",
  configuration: "06-configuration.md",
  architecture: "07-architecture.md",
};

export async function getDocContent(slug: string): Promise<DocMeta> {
  const filename = slugToFile[slug] ?? slugToFile["index"];
  const filePath = path.join(DOCS_DIR, filename);

  let raw: string;
  try {
    raw = fs.readFileSync(filePath, "utf-8");
  } catch {
    raw = `# Not Found\n\nThe page \`${slug}\` does not exist.`;
  }

  const { data, content } = matter(raw);

  const processed = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(content);

  // Extract title from first h1 if not in frontmatter
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title =
    (data.title as string | undefined) ?? titleMatch?.[1] ?? slug;

  return {
    slug,
    title,
    content: processed.toString(),
  };
}

export function getAllDocSlugs(): string[] {
  return Object.keys(slugToFile);
}
