'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function CompleteSignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [sessionValid, setSessionValid] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const verifySession = async () => {
            const sessionId = searchParams.get('session_id');

            if (!sessionId) {
                setError('No payment session found. Please complete checkout first.');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/verify-session?session_id=${sessionId}`);
                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || 'Invalid payment session');
                    setLoading(false);
                    return;
                }

                setEmail(data.email);
                setSessionValid(true);
            } catch {
                setError('Failed to verify payment. Please contact support.');
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setCreating(true);

        try {
            // Create the account
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        is_premium: true, // Set premium status on signup
                    },
                },
            });

            if (signUpError) {
                // If user already exists, try to sign in
                if (signUpError.message.includes('already registered')) {
                    setError('An account with this email already exists. Please sign in instead.');
                    return;
                }
                setError(signUpError.message);
                return;
            }

            if (data.user) {
                // Successfully created account, redirect to dashboard
                router.push('/dashboard');
                router.refresh();
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#171717] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#86868b]">Verifying your payment...</p>
                </div>
            </div>
        );
    }

    if (!sessionValid) {
        return (
            <div className="min-h-screen bg-[#171717] text-white flex items-center justify-center px-6">
                <div className="w-full max-w-sm text-center">
                    <div className="w-16 h-16 mx-auto bg-[#ff453a]/20 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-[#ff453a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold mb-2">Payment Not Found</h1>
                    <p className="text-[#a1a1a1] mb-6">{error}</p>
                    <Link
                        href="/#pricing"
                        className="inline-block px-6 py-3 bg-[#8b5cf6] hover:bg-[#a78bfa] text-white font-semibold rounded-xl transition-colors"
                    >
                        Go to Pricing
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#171717] text-white flex items-center justify-center px-6">
            <div className="w-full max-w-sm">
                {/* Success Icon */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-[#30d158]/20 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-[#30d158]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
                    <p className="text-[#a1a1a1]">Create your password to access App Gap</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-[#ff453a]/10 border border-[#ff453a]/20 rounded-lg text-sm text-[#ff453a]">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm text-[#86868b] mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            disabled
                            className="w-full px-4 py-3 bg-[#242424] border border-white/10 rounded-xl text-[#86868b] cursor-not-allowed"
                        />
                        <p className="text-xs text-[#6e6e73] mt-1">From your payment</p>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm text-[#86868b] mb-2">
                            Create Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-3 bg-[#242424] border border-white/10 rounded-xl text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#8b5cf6] transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm text-[#86868b] mb-2">
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-3 bg-[#242424] border border-white/10 rounded-xl text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#8b5cf6] transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={creating}
                        className="w-full py-3 bg-[#8b5cf6] hover:bg-[#a78bfa] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                    >
                        {creating ? 'Creating Account...' : 'Complete Setup'}
                    </button>
                </form>

                {/* Terms */}
                <p className="mt-4 text-xs text-[#6e6e73] text-center">
                    By creating an account, you agree to our{' '}
                    <Link href="/terms-of-service" className="text-[#8b5cf6] hover:underline">
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy-policy" className="text-[#8b5cf6] hover:underline">
                        Privacy Policy
                    </Link>.
                </p>
            </div>
        </div>
    );
}
