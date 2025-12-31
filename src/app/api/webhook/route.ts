import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
    const body = await request.text();
    const signature = (await headers()).get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerEmail = session.customer_details?.email || session.metadata?.email;

        console.log(`(IS $) Webhook received for ${customerEmail || 'unknown customer'}`);

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        if (userId) {
            // Option 1: Upgrade existing user via ID
            const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                user_metadata: { is_premium: true },
            });

            if (error) {
                console.error(`❌ Error upgrading user ${userId}:`, error);
                return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
            }
            console.log(`(IS $) ✅ User ${userId} upgraded to premium!`);
        } else if (customerEmail) {
            // Option 2: Find user by email and upgrade
            // This handles cases where they were logged in but metadata didn't pass through
            const { data: users, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = users?.users.find(u => u.email === customerEmail);

            if (existingUser) {
                await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
                    user_metadata: { is_premium: true },
                });
                console.log(`(IS $) ✅ Found and upgraded existing user ${existingUser.id} via email ${customerEmail}`);
            } else {
                console.log(`(IS $) ℹ️ No user found for ${customerEmail}. Account will be created during signup flow.`);
            }
        }
    }

    return NextResponse.json({ received: true });
}
