import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.redirect(new URL('/privacy-policy', process.env.NEXT_PUBLIC_APP_URL || 'https://appintel-pi.vercel.app'));
}
