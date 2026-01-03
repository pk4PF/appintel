import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

export async function POST(request: Request) {
    if (!stripe) {
        console.error('❌ STRIPE_SECRET_KEY is missing in .env.local');
        return NextResponse.json({ error: 'Stripe is not configured. Please add your secret key.' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { email, userId } = body;

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Create Stripe Checkout Session (no auth required)
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'App Intel - Lifetime Access',
                            description: 'Unlimited access to app insights and spinoff ideas.',
                        },
                        unit_amount: 1200, // $12.00 Lifetime Access
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${request.headers.get('origin')}/complete-signup?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.headers.get('origin')}/#pricing`,
            customer_email: email,
            metadata: {
                email: email,
                userId: userId || '', // Pass through if available
                app_name: 'App Intel',
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: unknown) {
        const err = error as Error & { type?: string };
        console.error('❌ Error creating checkout session:', {
            message: err.message,
            name: err.name,
            type: err.type,
            stack: err.stack
        });
        return NextResponse.json({
            error: 'Internal Server Error',
            details: err.message
        }, { status: 500 });
    }
}
