import { redirect } from "next/navigation";

// Saved lists merged into one /os/lists surface (tab switcher). Keep slug routes as redirects.
export default function ListSlugPage() {
  redirect("/os/lists");
}
