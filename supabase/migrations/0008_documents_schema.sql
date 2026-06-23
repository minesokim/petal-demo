CREATE TABLE "firm_files" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" uuid NOT NULL,
	"folder_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"size" text,
	"modified" text,
	"ts" integer NOT NULL,
	"owner" text,
	"starred" boolean DEFAULT false NOT NULL,
	"storage_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firm_folders" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "firm_files" ADD CONSTRAINT "firm_files_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_files" ADD CONSTRAINT "firm_files_folder_id_firm_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."firm_folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_folders" ADD CONSTRAINT "firm_folders_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;