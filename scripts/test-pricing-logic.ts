
import "dotenv/config"
import { db } from "@/db"
import { user, transactions } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getVideoCost, getImageCost } from "@/lib/usage-costs"
import { addCredits, checkCredits, deductCredits } from "@/lib/credits"

async function runTest() {
    console.log("🧪 Starting Comprehensive Pricing & Transactions Test...\n")

    // 1. Setup Test User
    const TEST_EMAIL = "test_pricing_script@example.com"
    console.log(`👤 Setting up test user: ${TEST_EMAIL}`)

    let testUser = await db.query.user.findFirst({
        where: eq(user.email, TEST_EMAIL)
    })

    if (!testUser) {
        console.log("  → Creating new test user...")
        const [newUser] = await db.insert(user).values({
            id: crypto.randomUUID(),
            email: TEST_EMAIL,
            name: "Pricing Test User",
            emailVerified: true,
            credits: 0,
            image: "",
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning()
        testUser = newUser
    }

    const STARTING_CREDITS = 100000
    console.log(`  → Resetting credits to ${STARTING_CREDITS}...`)
    await db.update(user).set({ credits: STARTING_CREDITS }).where(eq(user.id, testUser.id))

    testUser = await db.query.user.findFirst({ where: eq(user.id, testUser.id) })
    if (!testUser) throw new Error("User not found after update")
    console.log(`  ✓ User ready. Balance: ${testUser.credits}\n`)


    // 2. Comprehensive Test Cases
    console.log("� Testing Deductions for ALL Model Configurations...")

    const testCases = [
        // --- VEO FAMILY ---
        { category: 'video', model: "veo-fast", opts: { type: "text-to-video" }, expected: 60, desc: "Veo Fast (Text-to-Video)" },
        { category: 'video', model: "veo-fast", opts: { type: "image-to-video" }, expected: 60, desc: "Veo Fast (Image-to-Video)" },
        { category: 'video', model: "veo-fast", opts: { type: "reference-to-video" }, expected: 60, desc: "Veo Fast (Ref-to-Video)" },
        { category: 'video', model: "veo-fast", opts: { type: "extend-video" }, expected: 60, desc: "Veo Fast (Extend)" },
        { category: 'video', model: "veo-fast", opts: { resolution: "1080p" }, expected: 5, desc: "Veo Fast (1080p Upscale)" },
        { category: 'video', model: "veo-fast", opts: { resolution: "4k" }, expected: 120, desc: "Veo Fast (4K Upscale)" },

        { category: 'video', model: "veo3_fast", opts: { type: "text-to-video" }, expected: 60, desc: "Veo3 Fast (Alias Check)" },

        { category: 'video', model: "veo", opts: { type: "text-to-video" }, expected: 250, desc: "Veo Quality (Text-to-Video)" },
        { category: 'video', model: "veo", opts: { type: "image-to-video" }, expected: 250, desc: "Veo Quality (Image-to-Video)" },
        { category: 'video', model: "veo", opts: { type: "reference-to-video" }, expected: 250, desc: "Veo Quality (Ref-to-Video)" },
        { category: 'video', model: "veo", opts: { type: "extend-video" }, expected: 60, desc: "Veo Quality (Extend Base)" },
        { category: 'video', model: "veo", opts: { type: "extend-video-quality" }, expected: 250, desc: "Veo Quality (Extend Quality)" },
        { category: 'video', model: "veo", opts: { type: "fallback" }, expected: 100, desc: "Veo Quality (Fallback)" },
        { category: 'video', model: "veo", opts: { resolution: "1080p" }, expected: 5, desc: "Veo Quality (1080p Upscale)" },
        { category: 'video', model: "veo", opts: { resolution: "4k" }, expected: 120, desc: "Veo Quality (4K Upscale)" },

        { category: 'video', model: "veo3", opts: { type: "text-to-video" }, expected: 250, desc: "Veo3 (Alias Check)" },

        // --- WAN 2.6 FAMILY ---
        { category: 'video', model: "wan-2-6", opts: { resolution: "720p", duration: "5s" }, expected: 70, desc: "Wan 2.6 (720p 5s)" },
        { category: 'video', model: "wan-2-6", opts: { resolution: "720p", duration: "10s" }, expected: 140, desc: "Wan 2.6 (720p 10s)" },
        { category: 'video', model: "wan-2-6", opts: { resolution: "720p", duration: "15s" }, expected: 210, desc: "Wan 2.6 (720p 15s)" },
        { category: 'video', model: "wan-2-6", opts: { resolution: "1080p", duration: "5s" }, expected: 105, desc: "Wan 2.6 (1080p 5s)" },
        { category: 'video', model: "wan-2-6", opts: { resolution: "1080p", duration: "10s" }, expected: 210, desc: "Wan 2.6 (1080p 10s)" },
        { category: 'video', model: "wan-2-6", opts: { resolution: "1080p", duration: "15s" }, expected: 315, desc: "Wan 2.6 (1080p 15s)" },

        // --- SORA 2 PRO FAMILY ---
        { category: 'video', model: "sora-2-pro", opts: { resolution: "standard", duration: "10" }, expected: 150, desc: "Sora 2 Pro (Standard 10s)" },
        { category: 'video', model: "sora-2-pro", opts: { resolution: "standard", duration: "15" }, expected: 270, desc: "Sora 2 Pro (Standard 15s)" },
        { category: 'video', model: "sora-2-pro", opts: { resolution: "high", duration: "10" }, expected: 330, desc: "Sora 2 Pro (High 10s)" },
        { category: 'video', model: "sora-2-pro", opts: { resolution: "high", duration: "15" }, expected: 630, desc: "Sora 2 Pro (High 15s)" },

        // --- IMAGE MODELS ---
        { category: 'image', model: "nano-banana-pro", opts: { resolution: "1k" }, expected: 18, desc: "Nano Banana Pro (1K)" },
        { category: 'image', model: "nano-banana-pro", opts: { resolution: "2k" }, expected: 18, desc: "Nano Banana Pro (2K)" },
        { category: 'image', model: "nano-banana-pro", opts: { resolution: "4k" }, expected: 24, desc: "Nano Banana Pro (4K)" },

        { category: 'image', model: "z-image", opts: { resolution: "1" }, expected: 0.8, desc: "Z-Image (1 image)" },
        { category: 'image', model: "z-image", opts: { resolution: "2" }, expected: 1.6, desc: "Z-Image (2 images)" },
        { category: 'image', model: "z-image", opts: { resolution: "3" }, expected: 2.4, desc: "Z-Image (3 images)" },
        { category: 'image', model: "z-image", opts: { resolution: "4" }, expected: 3.2, desc: "Z-Image (4 images)" },
    ]

    let currentBalance = STARTING_CREDITS
    let passedCount = 0

    for (const test of testCases) {
        // 1. Get Cost
        let cost: number
        if (test.category === 'image') {
            cost = await getImageCost(test.model, test.opts as any)
        } else {
            cost = await getVideoCost(test.model, test.opts as any)
        }

        if (cost !== test.expected) {
            console.error(`  ❌ [COST CHECK] ${test.desc}: Expected ${test.expected}, Got ${cost}`)
            continue
        }

        // 2. Perform Deduction
        const description = `Test: ${test.desc}`
        const success = await deductCredits(testUser.id, cost, description)

        if (!success) {
            console.error(`  ❌ [DEDUCT CHECK] ${test.desc}: Failed to deduct ${cost} credits. Balance: ${currentBalance}`)
            continue
        }

        currentBalance -= cost
        passedCount++
        console.log(`  ✅ ${test.desc.padEnd(40)} | Cost: ${cost.toString().padEnd(4)} | Balance: ${currentBalance}`)
    }

    // Final Verification
    const finalUser = await db.query.user.findFirst({ where: eq(user.id, testUser.id) })

    console.log(`\n----------------------------------------`)
    console.log(`Summary: ${passedCount}/${testCases.length} Tests Passed`)
    console.log(`Calculated Final Balance: ${currentBalance}`)
    console.log(`Actual DB Final Balance:  ${finalUser?.credits}`)

    if (finalUser?.credits === currentBalance && passedCount === testCases.length) {
        console.log(`\n� ALL TESTS PASSED SUCCESSFULLY!`)
    } else {
        console.error(`\n⚠️  SOME TESTS FAILED OR BALANCE MISMATCH!`)
        process.exit(1)
    }

    process.exit(0)
}

runTest().catch(err => {
    console.error("Test Failed:", err)
    process.exit(1)
})
