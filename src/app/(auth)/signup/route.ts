import { NextResponse } from 'next/server';

export async function GET() {
    // Force users to the pricing page. 
    // The only way to sign up is through the /complete-signup flow after payment.
    return NextResponse.redirect(new URL('/#pricing', process.env.NEXT_PUBLIC_APP_URL || 'https://appintel-pi.vercel.app'));
}
