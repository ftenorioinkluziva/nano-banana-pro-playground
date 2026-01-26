import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-session"
import { stripe } from "@/lib/stripe"

export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth()
        const userId = session.user.id

        // For now, we simulate a "Credits Package"
        // Ideally user sends a priceId or packageId
        const { priceId, creditAmount } = await request.json()

        console.log(`[Checkout] Creating session for user ${userId} with ${creditAmount || '500'} credits`)

        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId || process.env.STRIPE_PRICE_ID_CREDITS_PACK,
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/settings/billing?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/settings/billing?canceled=true`,
            metadata: {
                userId: userId,
                credits: creditAmount || "500", // Default amount if not specified
            },
        })

        console.log(`[Checkout] Session created: ${checkoutSession.id}, URL: ${checkoutSession.url}`)

        return NextResponse.json({ url: checkoutSession.url })
    } catch (error) {
        console.error("Stripe Checkout Error:", error)
        return NextResponse.json(
            { error: "Error creating checkout session" },
            { status: 500 }
        )
    }
}
