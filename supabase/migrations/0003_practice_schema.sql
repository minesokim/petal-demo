CREATE TABLE "engagements" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" uuid NOT NULL,
	"entity_id" text NOT NULL,
	"household_id" text NOT NULL,
	"form" text NOT NULL,
	"tax_year" integer NOT NULL,
	"stage" text NOT NULL,
	"statutory_deadline" text NOT NULL,
	"extended_deadline" text,
	"fee" integer NOT NULL,
	"deposit_paid" boolean DEFAULT false NOT NULL,
	"preparer" text,
	"blocked_by" text,
	"k1_flows_to" text,
	"e_filed_on" text,
	"accepted_on" text,
	"refund" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" uuid NOT NULL,
	"household_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"form" text NOT NULL,
	"ein" text,
	"owners" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expected_docs" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" uuid NOT NULL,
	"engagement_id" text NOT NULL,
	"type" text NOT NULL,
	"source" text,
	"status" text NOT NULL,
	"prior_year_value" text,
	"fields" jsonb,
	"received_via" text,
	"when" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"service_tier" text NOT NULL,
	"since" integer NOT NULL,
	"has_8821" boolean DEFAULT false NOT NULL,
	"has_books" boolean DEFAULT false NOT NULL,
	"catch_up" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notices" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" uuid NOT NULL,
	"type" text NOT NULL,
	"household_id" text NOT NULL,
	"tax_year" integer NOT NULL,
	"received" text,
	"respond_by" text,
	"status" text NOT NULL,
	"amount" text,
	"drafted_response" text,
	"run_id" text,
	"linked_transcript_run_id" text,
	"resolved_by" text,
	"resolved_on" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" uuid NOT NULL,
	"household_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"trust" integer NOT NULL,
	"description" text,
	"trigger" text,
	"steps" jsonb,
	"channels" jsonb,
	"tone" text,
	"escalation" text,
	"variants" jsonb,
	"graduation" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" uuid NOT NULL,
	"household_id" text NOT NULL,
	"engagement_id" text,
	"status" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"why" text,
	"skill_id" text,
	"run_id" text,
	"proposed_actions" jsonb,
	"recommended_action" text,
	"recommendation" text,
	"draft_text" text,
	"deadline" text,
	"fee_context" text,
	"flagged" boolean,
	"estimated_min" integer,
	"notice_id" text,
	"origin" text,
	"assignee_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expected_docs" ADD CONSTRAINT "expected_docs_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expected_docs" ADD CONSTRAINT "expected_docs_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;