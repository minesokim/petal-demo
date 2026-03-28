import { redirect } from "next/navigation";

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  redirect(`/dashboard/clients/${params.id}/overview`);
}
