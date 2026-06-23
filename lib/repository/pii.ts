import { eq } from "drizzle-orm";
import { people } from "../db/schema";
import { encryptPII, decryptPII } from "../crypto/envelope";
import { writeAudit } from "./audit";
import type { Db, Ctx } from "./types";

// Crown-jewel PII access. SSN is envelope-encrypted at rest and never appears in
// the default people projection (peopleOf) or in audit metadata — only setter/
// getter touch it, and reads are RLS-scoped + audited.

export async function setPersonSsn(db: Db, ctx: Ctx, personId: string, ssnPlaintext: string): Promise<boolean> {
  const rows = await db
    .update(people)
    .set({ ssn: encryptPII(ssnPlaintext), updatedAt: new Date() })
    .where(eq(people.id, personId))
    .returning();
  if (rows.length) {
    await writeAudit(db, ctx, { action: "person.ssn.set", resourceType: "person", resourceId: personId });
  }
  return rows.length > 0;
}

export async function getPersonSsn(db: Db, ctx: Ctx, personId: string): Promise<string | null> {
  const [row] = await db.select({ ssn: people.ssn }).from(people).where(eq(people.id, personId));
  if (!row?.ssn) return null;
  await writeAudit(db, ctx, { action: "person.ssn.read", resourceType: "person", resourceId: personId });
  return decryptPII(row.ssn);
}
