import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
        return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
            return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
        }

        return NextResponse.json({
            email: session.customer_email,
            paymentStatus: session.payment_status,
        });
    } catch (error: unknown) {
        const err = error as Error;
        console.error('Error retrieving session:', err.message);
        return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }
}
