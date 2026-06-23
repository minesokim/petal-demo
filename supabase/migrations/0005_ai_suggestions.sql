CREATE TABLE "ai_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending_review' NOT NULL,
	"model" text,
	"confidence" integer,
	"rationale" text,
	"created_by" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;