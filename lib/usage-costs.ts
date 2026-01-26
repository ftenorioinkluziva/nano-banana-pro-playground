import { db } from "@/db"
import { systemSettings } from "@/db/schema"
import { eq } from "drizzle-orm"

/**
 * Centralized configuration for usage costs in credits.
 * This object serves as the DEFAULT/FALLBACK if DB config is missing.
 */



// Type definitions for more granular cost control
export type DetailedCostConfig = {
    default: number
    [key: string]: number // Allows for keys like "text-to-video", "4k", "text-to-video:4k"
}

export type UsageCostsConfig = {
    VIDEO: {
        DEFAULT: number
        MODELS: Record<string, number | DetailedCostConfig>
    }
    IMAGE: {
        DEFAULT: number
        MODELS: Record<string, number | DetailedCostConfig>
    }
    PROMPT_ENHANCEMENT: number
}

/**
 * Centralized configuration for usage costs in credits.
 * This object serves as the DEFAULT/FALLBACK if DB config is missing.
 */
export const USAGE_COSTS: UsageCostsConfig = {
    VIDEO: {
        DEFAULT: 60,
        MODELS: {
            "wan-2-6": {
                default: 105,
                "720p:5": 70,
                "1080p:5": 105, // 104.5 rounded
                "720p:10": 140,
                "1080p:10": 210, // 209.5 rounded
                "720p:15": 210,
                "1080p:15": 315
            },
            "sora-2-pro": {
                default: 150,
                // Standard (720p)
                "standard:10": 150,
                "standard:15": 270,
                "720p:10": 150,
                "720p:15": 270,
                // High (1080p)
                "high:10": 330,
                "high:15": 630,
                "1080p:10": 330,
                "1080p:15": 630
            },
            "veo": { // Google veo 3.1 (Quality)
                default: 250,
                "text-to-video": 250,
                "image-to-video": 250,
                "extend-video": 60,
                "reference-to-video": 60, // Image shows "reference-to-video, Fast: 60", assuming it falls back or is specific
                "1080p": 5,   // "Get 1080P Video"
                "4k": 120     // "Get 4K Video"
            },
            "veo-fast": { // Google veo 3.1 Fast
                default: 60,
                "text-to-video": 60,
                "image-to-video": 60,
                "reference-to-video": 60,
                "extend-video": 60
            },
            "veo3": { // Alias for veo
                default: 250,
                "text-to-video": 250,
                "image-to-video": 250,
                "extend-video": 60,
                "1080p": 5,
                "4k": 120
            },
            "veo3_fast": 60, // Alias for veo-fast
        }
    },
    IMAGE: {
        DEFAULT: 5,
        MODELS: {
            "nano-banana-pro": 5,
            "z-image": 5,
        }
    },
    PROMPT_ENHANCEMENT: 1 // Cost for enhancing prompts
}

/**
 * Fetch the dynamic usage costs from DB, falling back to default constants.
 */
export async function getDynamicUsageCosts(): Promise<UsageCostsConfig> {
    try {
        const setting = await db.query.systemSettings.findFirst({
            where: eq(systemSettings.key, "usage_costs"),
        })

        if (setting && setting.value) {
            return setting.value as unknown as UsageCostsConfig
        }
    } catch (error) {
        console.error("Failed to fetch dynamic usage costs, using defaults:", error)
    }
    return USAGE_COSTS
}

/**
 * Get the cost for a specific video model (Async).
 * Supports checking for specific capabilities (type, resolution, duration).
 */
export async function getVideoCost(modelId?: string, options?: { type?: string, resolution?: string, duration?: string }): Promise<number> {
    const costs = await getDynamicUsageCosts()
    const defaultCost = costs.VIDEO.DEFAULT

    if (!modelId) return defaultCost

    const modelConfig = costs.VIDEO.MODELS[modelId]
    if (!modelConfig) return defaultCost

    // If simple number, return it
    if (typeof modelConfig === 'number') return modelConfig

    // If detailed config, try to match most specific key
    const type = options?.type
    const resolution = options?.resolution
    const duration = options?.duration

    // Helper to try keys
    const tryKey = (key: string) => {
        if (modelConfig[key] !== undefined) return modelConfig[key]
        return undefined
    }

    // 1. Try "type:resolution:duration"
    if (type && resolution && duration) {
        const val = tryKey(`${type}:${resolution}:${duration}`)
        if (val !== undefined) return val
    }

    // 2. Try "resolution:duration"
    if (resolution && duration) {
        const val = tryKey(`${resolution}:${duration}`)
        if (val !== undefined) return val
    }

    // 3. Try "type:resolution"
    if (type && resolution) {
        const val = tryKey(`${type}:${resolution}`)
        if (val !== undefined) return val
    }

    // 4. Try "type"
    if (type) {
        const val = tryKey(type)
        if (val !== undefined) return val
    }

    // 5. Try "resolution"
    if (resolution) {
        const val = tryKey(resolution)
        if (val !== undefined) return val
    }

    // 6. Try "duration"
    if (duration) {
        const val = tryKey(duration)
        if (val !== undefined) return val
    }

    // 7. Return default for this model
    return modelConfig.default ?? defaultCost
}

/**
 * Get the cost for a specific image model (Async).
 */
export async function getImageCost(modelId?: string, options?: { type?: string, resolution?: string }): Promise<number> {
    const costs = await getDynamicUsageCosts()
    const defaultCost = costs.IMAGE.DEFAULT

    if (!modelId) return defaultCost

    const modelConfig = costs.IMAGE.MODELS[modelId]
    if (!modelConfig) return defaultCost

    if (typeof modelConfig === 'number') return modelConfig

    const type = options?.type
    const resolution = options?.resolution

    if (type && resolution) {
        const key = `${type}:${resolution}`
        if (modelConfig[key] !== undefined) return modelConfig[key]
    }
    if (type && modelConfig[type] !== undefined) return modelConfig[type]
    if (resolution && modelConfig[resolution] !== undefined) return modelConfig[resolution]

    return modelConfig.default ?? defaultCost
}

/**
 * Get the cost for prompt enhancement (Async).
 */
export async function getPromptEnhancementCost(): Promise<number> {
    const costs = await getDynamicUsageCosts()
    return costs.PROMPT_ENHANCEMENT
}
