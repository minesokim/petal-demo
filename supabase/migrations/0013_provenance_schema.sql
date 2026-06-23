CREATE TABLE "activity" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" uuid NOT NULL,
	"day" integer NOT NULL,
	"at" text,
	"kind" text NOT NULL,
	"label" text NOT NULL,
	"actor" text NOT NULL,
	"household_id" text,
	"run_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" uuid NOT NULL,
	"engagement_id" text NOT NULL,
	"household_id" text NOT NULL,
	"issue" text NOT NULL,
	"authority_level" text,
	"confidence" double precision,
	"documentation" jsonb,
	"status" text NOT NULL,
	"resolved_by" text,
	"resolved_on" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" uuid NOT NULL,
	"skill_id" text,
	"household_id" text NOT NULL,
	"engagement_id" text,
	"started_at" text,
	"status" text NOT NULL,
	"inputs" jsonb,
	"outputs" jsonb,
	"extracted" jsonb,
	"rule" text,
	"confidence" double precision,
	"trust_tier_at_run" integer,
	"approved_by" text,
	"approved_at" text,
	"summary" text,
	"reasoning" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" uuid NOT NULL,
	"household_id" text NOT NULL,
	"client_name" text,
	"channel" text NOT NULL,
	"subject" text,
	"preview" text,
	"time" text,
	"unread" boolean DEFAULT false NOT NULL,
	"status" text NOT NULL,
	"waiting_on_firm_since" text,
	"messages" jsonb,
	"petal_draft" jsonb,
	"extraction" jsonb,
	"petal_can_answer" jsonb,
	"transcript" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_engagement_id_engagements_id_fk" FOREIGN KEY ("engagement_id") REFERENCES "public"."engagements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_runs" ADD CONSTRAINT "skill_runs_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_runs" ADD CONSTRAINT "skill_runs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;