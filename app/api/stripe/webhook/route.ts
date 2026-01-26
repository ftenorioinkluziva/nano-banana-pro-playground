import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { addCredits } from "@/lib/credits"
import { headers } from "next/headers"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    const body = await request.text()
    const sig = (await headers()).get("Stripe-Signature") as string

    let event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err: any) {
        console.error(`Webhook signature verification failed.`, err.message)
        return NextResponse.json({ error: "Webhook Error" }, { status: 400 })
    }

    try {
        console.log(`[Webhook] Processing event: ${event.type}`)

        switch (event.type) {
            case "checkout.session.completed":
                const session = event.data.object as any
                const userId = session.metadata?.userId
                const creditAmount = parseInt(session.metadata?.credits || "0")

                console.log(`[Webhook] Checkout completed - userId: ${userId}, credits: ${creditAmount}`)

                if (userId && creditAmount > 0) {
                    await addCredits(
                        userId,
                        creditAmount,
                        "purchase",
                        `Purchased ${creditAmount} credits`,
                        session.id
                    )
                    console.log(`[Webhook] ✅ Credits added for user ${userId}: ${creditAmount}`)
                } else {
                    console.log(`[Webhook] ⚠️ Missing userId or creditAmount - userId: ${userId}, credits: ${creditAmount}`)
                }
                break

            default:
                console.log(`[Webhook] Unhandled event type ${event.type}`)
        }
    } catch (error) {
        console.error("[Webhook] Error processing webhook:", error)
        return NextResponse.json({ error: "Processing Error" }, { status: 500 })
    }

    return NextResponse.json({ received: true })
}
