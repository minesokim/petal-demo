// /os/documents — server entry. Fetches the firm's document library (real
// RLS-scoped data when authed, else fixtures) and renders the unchanged view.
import { loadFirmDocuments } from "@/lib/server/firm-documents";
import { DocumentsView } from "@/components/os/documents-view";

export default async function DocumentsPage() {
  const data = await loadFirmDocuments();
  return <DocumentsView {...data} />;
}
