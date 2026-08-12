import { getDocContent } from "../../lib/markdown";
import DocPage from "./DocPage";

export const metadata = {
  title: "Chaosline Documentation",
};

export default async function DocsIndexPage() {
  const doc = await getDocContent("index");
  return <DocPage title={doc.title} content={doc.content} slug="" />;
}
