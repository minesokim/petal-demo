import { redirect } from "next/navigation";

// The dedicated Returns board was retired from the sidebar — the firm-wide returns
// view now lives in the Clients page (Returns view), and each client's returns live
// on their record's Returns tab. Individual return detail stays at /os/returns/[id].
export default function ReturnsPage() {
  redirect("/os/clients");
}
