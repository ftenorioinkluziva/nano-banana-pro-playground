import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  serial,
  integer,
  decimal,
  jsonb,
  index,
  unique,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ============================================================
// ENUMS
// ============================================================

export const userRoleEnum = pgEnum("user_role", ["admin", "creator", "viewer"])

export const generationModeEnum = pgEnum("generation_mode", [
  "text-to-image",
  "image-editing",
])

export const generationStatusEnum = pgEnum("generation_status", [
  "loading",
  "complete",
  "error",
])

export const videoModeEnum = pgEnum("video_mode", [
  "Text to Video",
  "Frames to Video",
  "References to Video",
  "Extend Video",
])

export const videoResolutionEnum = pgEnum("video_resolution", ["720p", "1080p"])

export const videoAspectRatioEnum = pgEnum("video_aspect_ratio", ["16:9", "9:16"])

export const videoDurationEnum = pgEnum("video_duration", ["4s", "6s", "8s"])

export const capabilityAspectRatioEnum = pgEnum("capability_aspect_ratio", [
  "16:9",
  "9:16",
])

export const generationTypeEnum = pgEnum("generation_type", [
  "TEXT_2_VIDEO",
  "FIRST_AND_LAST_FRAMES_2_VIDEO",
  "REFERENCE_2_VIDEO",
])

export const scriptToneEnum = pgEnum("script_tone", [
  "natural_friendly",
  "energetic",
  "serious",
])

export const scriptStatusEnum = pgEnum("script_status", [
  "generating",
  "complete",
  "error",
])

export const transactionTypeEnum = pgEnum("transaction_type", [
  "purchase",
  "topup",
  "usage",
  "bonus",
  "refund",
])

// ============================================================
// AUTH TABLES (Better Auth)
// ============================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("creator"),
  credits: integer("credits").notNull().default(10),
  stripeCustomerId: text("stripe_customer_id").unique(),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  expiresAt: timestamp("expiresAt"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
})

export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// ============================================================
// BUSINESS TABLES
// ============================================================

// Generations (image generation history)
export const generations = pgTable(
  "generations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    enhancedPrompt: text("enhanced_prompt"),
    mode: generationModeEnum("mode").notNull(),
    status: generationStatusEnum("status").notNull().default("complete"),
    imageUrl: text("image_url"),
    imageUrls: text("image_urls").array(),
    aspectRatio: text("aspect_ratio").default("1:1"),
    model: text("model").default("nano-banana-pro"),
    description: text("description"),
    cost: integer("cost"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_generations_user_id").on(table.userId),
    index("idx_generations_created_at").on(table.createdAt),
  ]
)

// Brands (for UGC content)
export const brands = pgTable(
  "brands",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull().unique(),
    tone: text("tone"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("idx_brands_user_id").on(table.userId)]
)

// Products (for UGC content)
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    brandId: integer("brand_id").references(() => brands.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    slug: text("slug").unique(),
    price: decimal("price", { precision: 10, scale: 2 }),
    category: text("category"),
    format: text("format"),
    quantityLabel: text("quantity_label"),
    description: text("description"),
    usageInstructions: text("usage_instructions"),
    contraindications: text("contraindications"),
    ingredients: text("ingredients"),
    benefits: jsonb("benefits"),
    nutritionalInfo: jsonb("nutritional_info"),
    imageUrl: text("image_url"),
    targetAudience: text("target_audience"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_products_user_id").on(table.userId),
    index("idx_products_brand_id").on(table.brandId),
  ]
)

// Capabilities (UGC generation templates)
export const capabilities = pgTable(
  "capabilities",
  {
    id: text("id").primaryKey(),
    label: text("label").notNull(),
    description: text("description").notNull(),
    iconName: text("icon_name").default("video"),
    basePromptTemplate: text("base_prompt_template").notNull(),
    recommendedAspectRatio: capabilityAspectRatioEnum(
      "recommended_aspect_ratio"
    ).default("9:16"),
    defaultNegativePrompt: text("default_negative_prompt"),
    generationType: generationTypeEnum("generation_type").default("TEXT_2_VIDEO"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("idx_capabilities_is_active").on(table.isActive)]
)

// Videos (video generation history)
export const videos = pgTable(
  "videos",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    negativePrompt: text("negative_prompt"),
    mode: videoModeEnum("mode").notNull(),
    status: generationStatusEnum("status").notNull().default("complete"),
    videoUri: text("video_uri"),
    videoUrl: text("video_url"),
    resolution: videoResolutionEnum("resolution").default("720p"),
    aspectRatio: videoAspectRatioEnum("aspect_ratio").default("16:9"),
    duration: videoDurationEnum("duration").default("6s"),
    model: text("model").default("veo-3.1-fast-generate-preview"),
    taskId: text("task_id"),
    capabilityId: text("capability_id").references(() => capabilities.id, {
      onDelete: "set null",
    }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    enhancedPrompt: text("enhanced_prompt"),
    originalUserRequest: text("original_user_request"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_videos_user_id").on(table.userId),
    index("idx_videos_created_at").on(table.createdAt),
    index("idx_videos_task_id").on(table.taskId),
    index("idx_videos_capability_id").on(table.capabilityId),
    index("idx_videos_product_id").on(table.productId),
  ]
)

// Scripts (UGC video scripts)
export const scripts = pgTable(
  "scripts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "cascade",
    }),
    personaImageBase64: text("persona_image_base64").notNull(),
    productName: text("product_name").notNull(),
    painPoint: text("pain_point").notNull(),
    context: text("context"),
    tone: scriptToneEnum("tone").notNull(),
    projectSummary: text("project_summary").notNull(),
    scriptJson: jsonb("script_json").notNull(),
    status: scriptStatusEnum("status").notNull().default("complete"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_scripts_user_id").on(table.userId),
    index("idx_scripts_product_id").on(table.productId),
    index("idx_scripts_created_at").on(table.createdAt),
  ]
)

// Scene Videos (generated videos from script scenes)
export const sceneVideos = pgTable(
  "scene_videos",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    scriptId: text("script_id")
      .notNull()
      .references(() => scripts.id, { onDelete: "cascade" }),
    sceneId: integer("scene_id").notNull(),
    videoUrl: text("video_url"),
    videoBase64: text("video_base64"),
    taskId: text("task_id"),
    promptUsed: text("prompt_used").notNull(),
    model: text("model").notNull().default("veo3_fast"),
    aspectRatio: text("aspect_ratio").notNull().default("9:16"),
    resolution: text("resolution").notNull().default("720p"),
    duration: text("duration").notNull(),
    mode: text("mode").notNull().default("TEXT_2_VIDEO"),
    status: scriptStatusEnum("status").notNull().default("generating"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_scene_videos_script_id").on(table.scriptId),
    index("idx_scene_videos_status").on(table.status),
  ]
)

// Transactions (credit history)
export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(), // Positive for add, negative for spend
    type: transactionTypeEnum("type").notNull(),
    description: text("description").notNull(),
    stripePaymentId: text("stripe_payment_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_transactions_user_id").on(table.userId),
    index("idx_transactions_created_at").on(table.createdAt),
  ]
)

// ============================================================
// RELATIONS
// ============================================================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  generations: many(generations),
  videos: many(videos),
  brands: many(brands),
  products: many(products),
  scripts: many(scripts),
  transactions: many(transactions),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

export const generationsRelations = relations(generations, ({ one }) => ({
  user: one(user, { fields: [generations.userId], references: [user.id] }),
}))

export const brandsRelations = relations(brands, ({ one, many }) => ({
  user: one(user, { fields: [brands.userId], references: [user.id] }),
  products: many(products),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(user, { fields: [products.userId], references: [user.id] }),
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  videos: many(videos),
  scripts: many(scripts),
}))

export const capabilitiesRelations = relations(capabilities, ({ many }) => ({
  videos: many(videos),
}))

export const videosRelations = relations(videos, ({ one }) => ({
  user: one(user, { fields: [videos.userId], references: [user.id] }),
  capability: one(capabilities, {
    fields: [videos.capabilityId],
    references: [capabilities.id],
  }),
  product: one(products, {
    fields: [videos.productId],
    references: [products.id],
  }),
}))

export const scriptsRelations = relations(scripts, ({ one, many }) => ({
  user: one(user, { fields: [scripts.userId], references: [user.id] }),
  product: one(products, {
    fields: [scripts.productId],
    references: [products.id],
  }),
  sceneVideos: many(sceneVideos),
}))

export const sceneVideosRelations = relations(sceneVideos, ({ one }) => ({
  script: one(scripts, {
    fields: [sceneVideos.scriptId],
    references: [scripts.id],
  }),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(user, { fields: [transactions.userId], references: [user.id] }),
}))

// ============================================================
// TYPE EXPORTS
// ============================================================

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
export type Session = typeof session.$inferSelect
export type Account = typeof account.$inferSelect
export type Verification = typeof verification.$inferSelect
export type SystemSettings = typeof systemSettings.$inferSelect
export type NewSystemSettings = typeof systemSettings.$inferInsert

export type Generation = typeof generations.$inferSelect
export type NewGeneration = typeof generations.$inferInsert
export type Brand = typeof brands.$inferSelect
export type NewBrand = typeof brands.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type Capability = typeof capabilities.$inferSelect
export type Video = typeof videos.$inferSelect
export type NewVideo = typeof videos.$inferInsert
export type Script = typeof scripts.$inferSelect
export type NewScript = typeof scripts.$inferInsert
export type SceneVideo = typeof sceneVideos.$inferSelect
export type NewSceneVideo = typeof sceneVideos.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
