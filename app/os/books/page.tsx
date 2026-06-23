// /os/books — server entry. Real RLS-scoped firm data (else fixtures) → context.
import { loadFirmData } from "@/lib/server/firm-data";
import { FirmDataProvider } from "@/lib/client/firm-context";
import { BooksView } from "./books-view";

export default async function BooksPage() {
  const data = await loadFirmData();
  return (
    <FirmDataProvider data={data}>
      <BooksView />
    </FirmDataProvider>
  );
}
