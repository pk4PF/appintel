'use client';

import Link from 'next/link';

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-[#171717] text-white flex items-center justify-center px-6">
            <div className="w-full max-w-sm text-center">
                {/* Logo */}
                <div className="mb-8">
                    <Link href="/" className="text-2xl font-bold">App Intel</Link>
                </div>

                {/* Email Icon */}
                <div className="mb-6">
                    <div className="w-16 h-16 mx-auto bg-[#8b5cf6]/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>

                {/* Message */}
                <h1 className="text-xl font-semibold mb-2">Check your email</h1>
                <p className="text-[#a1a1a1] mb-6">
                    We&apos;ve sent a confirmation link to your email address.
                    Click the link to verify your account and get started.
                </p>

                {/* Tips */}
                <div className="bg-[#242424] border border-white/10 rounded-xl p-4 mb-6 text-left">
                    <p className="text-sm text-[#86868b] mb-2">Didn&apos;t receive the email?</p>
                    <ul className="text-sm text-[#a1a1a1] space-y-1">
                        <li>• Check your spam or junk folder</li>
                        <li>• Make sure you entered the correct email</li>
                    </ul>
                </div>

                {/* Links */}
                <div className="space-y-3">
                    <Link
                        href="/login"
                        className="block text-sm text-[#8b5cf6] hover:underline"
                    >
                        Back to login
                    </Link>
                    <Link
                        href="/"
                        className="block text-sm text-[#6e6e73] hover:text-white transition-colors"
                    >
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}
