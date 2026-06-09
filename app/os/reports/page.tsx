import { redirect } from "next/navigation";

// Reports moved — the practice overview lives at /os/practice.
export default function ReportsPage() {
  redirect("/os/practice");
}
