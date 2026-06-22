import { redirect } from "next/navigation";

// "Skills" is no longer a user-facing concept. Petal's specialists (the Agents
// roster) own their capabilities; you supervise them there, you never pick a
// skill. Any old link lands on the roster.
export default function SkillsPage() {
  redirect("/os/agents");
}
