import { redirect } from "next/navigation";

// Returns folded into the Clients surface as a view. Keep the route alive for deep links.
export default function ReturnsPage() {
  redirect("/os/clients");
}
