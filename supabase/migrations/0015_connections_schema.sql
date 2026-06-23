CREATE TABLE "connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"toolkit" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"composio_connection_id" text,
	"account_label" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "connections_firm_toolkit_uq" UNIQUE("firm_id","toolkit")
);
--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;