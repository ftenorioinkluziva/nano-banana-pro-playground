/**
 * Centralized configuration for usage costs in credits.
 * Managed strictly in code without database dependency.
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
 * Updated to include only models actually used in the system.
 */
export const USAGE_COSTS: UsageCostsConfig = {
    VIDEO: {
        DEFAULT: 60,
        MODELS: {
            // Google Veo
            "veo-fast": {
                default: 60,
                "text-to-video": 60,
                "image-to-video": 60,
                "reference-to-video": 60,
                "extend-video": 60,
                "1080p": 5,
                "4k": 120
            },
            "veo3_fast": { // Alias
                default: 60,
                "text-to-video": 60,
                "image-to-video": 60,
                "reference-to-video": 60,
                "extend-video": 60,
                "1080p": 5,
                "4k": 120
            },
            "veo": {
                default: 250,
                "text-to-video": 250,
                "image-to-video": 250,
                "reference-to-video": 250,
                "extend-video": 60, // Base extend
                "extend-video-quality": 250,
                "fallback": 100,
                "1080p": 5,
                "4k": 120
            },
            "veo3": { // Alias
                default: 250,
                "text-to-video": 250,
                "image-to-video": 250,
                "reference-to-video": 250,
                "extend-video": 60,
                "extend-video-quality": 250,
                "1080p": 5,
                "4k": 120
            },
            // Wan 2.6
            "wan-2-6": {
                default: 70, // 720p 5s
                "720p:5s": 70,
                "720p:5": 70,
                "720p:10s": 140,
                "720p:10": 140,
                "720p:15s": 210,
                "720p:15": 210,
                "1080p:5s": 105,
                "1080p:5": 105,
                "1080p:10s": 210,
                "1080p:10": 210,
                "1080p:15s": 315,
                "1080p:15": 315
            },
            // Sora 2 Pro
            "sora-2-pro": {
                default: 150, // Standard 10s
                "standard:10": 150,
                "standard:15": 270,
                "high:10": 330,
                "high:15": 630,
                // Storyboard
                "storyboard:standard:10": 150,
                "storyboard:standard:15": 270,
                "storyboard:standard:25": 270
            }
        }
    },
    IMAGE: {
        DEFAULT: 5,
        MODELS: {
            "nano-banana-pro": {
                default: 18,
                "1k": 18,
                "2k": 18,
                "4k": 24
            },
            "z-image": {
                default: 0.8,
                "1": 0.8,
                "2": 1.6,
                "3": 2.4,
                "4": 3.2
            }
        }
    },
    PROMPT_ENHANCEMENT: 1 // Cost for enhancing prompts
}

/**
 * Get the cost for a specific video model.
 * Supports checking for specific capabilities (type, resolution, duration).
 */
export async function getVideoCost(modelId?: string, options?: { type?: string, resolution?: string, duration?: string }): Promise<number> {
    const costs = USAGE_COSTS
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

    // 1. Try generic combined keys
    const keysToTry = [
        `${type}:${resolution}:${duration}`,
        `${type}:${resolution}`,
        `${resolution}:${duration}`,
        `${type}:${duration}`,
        type,
        resolution,
        duration
    ]

    for (const key of keysToTry) {
        if (key) {
            const val = tryKey(key)
            if (val !== undefined) return val
        }
    }

    // Return default for this model
    return modelConfig.default ?? defaultCost
}

/**
 * Get the cost for a specific image model.
 */
export async function getImageCost(modelId?: string, options?: { type?: string, resolution?: string }): Promise<number> {
    const costs = USAGE_COSTS
    const defaultCost = costs.IMAGE.DEFAULT

    if (!modelId) return defaultCost

    const modelConfig = costs.IMAGE.MODELS[modelId]
    if (!modelConfig) {
        console.warn(`[getImageCost] Model '${modelId}' not found in configuration. Available models:`, Object.keys(costs.IMAGE.MODELS))
        return defaultCost
    }

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
 * Get the cost for prompt enhancement.
 */
export async function getPromptEnhancementCost(): Promise<number> {
    return USAGE_COSTS.PROMPT_ENHANCEMENT
}
