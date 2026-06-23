CREATE TABLE "intake_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"token" text NOT NULL,
	"prospect_name" text,
	"prospect_email" text,
	"status" text DEFAULT 'sent' NOT NULL,
	"engagement_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "intake_links_token_unique" UNIQUE("token")
);
ALTER TABLE "intake_links" ADD CONSTRAINT "intake_links_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;
