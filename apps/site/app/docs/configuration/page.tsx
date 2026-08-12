import { getDocContent } from "../../../lib/markdown";
import DocPage from "../DocPage";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const doc = await getDocContent("configuration");
  return { title: doc.title };
}

export default async function Page() {
  const doc = await getDocContent("configuration");
  return <DocPage title={doc.title} content={doc.content} slug="configuration" />;
}
