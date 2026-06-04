import { redirect } from "next/navigation";

// Contacts/People folded into the Clients surface as a view. Keep the route alive for deep links.
export default function ContactsPage() {
  redirect("/os/clients");
}
