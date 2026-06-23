CREATE TABLE "intake_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intake_link_id" uuid NOT NULL,
	"firm_id" uuid NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"current_step" text DEFAULT 'welcome' NOT NULL,
	"answers_ciphertext" text,
	"deposit_status" text DEFAULT 'unpaid' NOT NULL,
	"deposit_session_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "intake_sessions_link_uq" UNIQUE("intake_link_id")
);
ALTER TABLE "intake_sessions" ADD CONSTRAINT "intake_sessions_intake_link_id_fk" FOREIGN KEY ("intake_link_id") REFERENCES "public"."intake_links"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "intake_sessions" ADD CONSTRAINT "intake_sessions_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;
