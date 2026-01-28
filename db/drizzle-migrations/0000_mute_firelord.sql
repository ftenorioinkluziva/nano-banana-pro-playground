CREATE TYPE "public"."capability_aspect_ratio" AS ENUM('16:9', '9:16');--> statement-breakpoint
CREATE TYPE "public"."generation_mode" AS ENUM('text-to-image', 'image-editing');--> statement-breakpoint
CREATE TYPE "public"."generation_status" AS ENUM('loading', 'complete', 'error');--> statement-breakpoint
CREATE TYPE "public"."generation_type" AS ENUM('TEXT_2_VIDEO', 'FIRST_AND_LAST_FRAMES_2_VIDEO', 'REFERENCE_2_VIDEO');--> statement-breakpoint
CREATE TYPE "public"."script_status" AS ENUM('generating', 'complete', 'error');--> statement-breakpoint
CREATE TYPE "public"."script_tone" AS ENUM('natural_friendly', 'energetic', 'serious');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('purchase', 'topup', 'usage', 'bonus', 'refund');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'creator', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."video_aspect_ratio" AS ENUM('16:9', '9:16');--> statement-breakpoint
CREATE TYPE "public"."video_duration" AS ENUM('4s', '6s', '8s');--> statement-breakpoint
CREATE TYPE "public"."video_mode" AS ENUM('Text to Video', 'Frames to Video', 'References to Video', 'Extend Video');--> statement-breakpoint
CREATE TYPE "public"."video_resolution" AS ENUM('720p', '1080p');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"expiresAt" timestamp,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"tone" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "brands_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "capabilities" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text NOT NULL,
	"icon_name" text DEFAULT 'video',
	"base_prompt_template" text NOT NULL,
	"recommended_aspect_ratio" "capability_aspect_ratio" DEFAULT '9:16',
	"default_negative_prompt" text,
	"generation_type" "generation_type" DEFAULT 'TEXT_2_VIDEO',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "generations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"prompt" text NOT NULL,
	"enhanced_prompt" text,
	"mode" "generation_mode" NOT NULL,
	"status" "generation_status" DEFAULT 'complete' NOT NULL,
	"image_url" text,
	"image_urls" text[],
	"aspect_ratio" text DEFAULT '1:1',
	"model" text DEFAULT 'nano-banana-pro',
	"description" text,
	"cost" integer,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"brand_id" integer,
	"name" text NOT NULL,
	"slug" text,
	"price" numeric(10, 2),
	"category" text,
	"format" text,
	"quantity_label" text,
	"description" text,
	"usage_instructions" text,
	"contraindications" text,
	"ingredients" text,
	"benefits" jsonb,
	"nutritional_info" jsonb,
	"image_url" text,
	"target_audience" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "scene_videos" (
	"id" text PRIMARY KEY NOT NULL,
	"script_id" text NOT NULL,
	"scene_id" integer NOT NULL,
	"video_url" text,
	"video_base64" text,
	"task_id" text,
	"prompt_used" text NOT NULL,
	"model" text DEFAULT 'veo3_fast' NOT NULL,
	"aspect_ratio" text DEFAULT '9:16' NOT NULL,
	"resolution" text DEFAULT '720p' NOT NULL,
	"duration" text NOT NULL,
	"mode" text DEFAULT 'TEXT_2_VIDEO' NOT NULL,
	"status" "script_status" DEFAULT 'generating' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scripts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"product_id" integer,
	"persona_image_base64" text NOT NULL,
	"product_name" text NOT NULL,
	"pain_point" text NOT NULL,
	"context" text,
	"tone" "script_tone" NOT NULL,
	"project_summary" text NOT NULL,
	"script_json" jsonb NOT NULL,
	"status" "script_status" DEFAULT 'complete' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"type" "transaction_type" NOT NULL,
	"description" text NOT NULL,
	"stripe_payment_id" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'creator' NOT NULL,
	"credits" integer DEFAULT 10 NOT NULL,
	"stripe_customer_id" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"prompt" text NOT NULL,
	"negative_prompt" text,
	"mode" "video_mode" NOT NULL,
	"status" "generation_status" DEFAULT 'complete' NOT NULL,
	"video_uri" text,
	"video_url" text,
	"resolution" "video_resolution" DEFAULT '720p',
	"aspect_ratio" "video_aspect_ratio" DEFAULT '16:9',
	"duration" "video_duration" DEFAULT '6s',
	"model" text DEFAULT 'veo-3.1-fast-generate-preview',
	"task_id" text,
	"capability_id" text,
	"product_id" integer,
	"enhanced_prompt" text,
	"original_user_request" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_videos" ADD CONSTRAINT "scene_videos_script_id_scripts_id_fk" FOREIGN KEY ("script_id") REFERENCES "public"."scripts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_capability_id_capabilities_id_fk" FOREIGN KEY ("capability_id") REFERENCES "public"."capabilities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_brands_user_id" ON "brands" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_capabilities_is_active" ON "capabilities" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_generations_user_id" ON "generations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_generations_created_at" ON "generations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_products_user_id" ON "products" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_products_brand_id" ON "products" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_scene_videos_script_id" ON "scene_videos" USING btree ("script_id");--> statement-breakpoint
CREATE INDEX "idx_scene_videos_status" ON "scene_videos" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_scripts_user_id" ON "scripts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_scripts_product_id" ON "scripts" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_scripts_created_at" ON "scripts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_transactions_user_id" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_created_at" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_videos_user_id" ON "videos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_videos_created_at" ON "videos" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_videos_task_id" ON "videos" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_videos_capability_id" ON "videos" USING btree ("capability_id");--> statement-breakpoint
CREATE INDEX "idx_videos_product_id" ON "videos" USING btree ("product_id");