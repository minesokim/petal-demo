import { Webhook } from "svix";
import { headers } from "next/headers";
import { getServiceDb } from "@/lib/db/client";
import { handleClerkEvent, type ClerkEvent } from "@/lib/auth/clerk-webhook";

// Clerk -> Petal sync. Verifies the svix signature, then upserts firms/members.
// Runs in the service context (RLS-bypassing) since it crosses firm boundaries.
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) return new Response("webhook not configured", { status: 500 });

  const body = await req.text();
  const h = await headers();
  let evt: ClerkEvent;
  try {
    evt = new Webhook(secret).verify(body, {
      "svix-id": h.get("svix-id") ?? "",
      "svix-timestamp": h.get("svix-timestamp") ?? "",
      "svix-signature": h.get("svix-signature") ?? "",
    }) as ClerkEvent;
  } catch {
    return new Response("invalid signature", { status: 400 });
  }

  await handleClerkEvent(getServiceDb(), evt);
  return new Response("ok", { status: 200 });
}
