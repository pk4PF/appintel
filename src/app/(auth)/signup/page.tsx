'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                setError(error.message);
            } else {
                // Redirect to verify email page
                router.push('/verify-email');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#171717] text-white flex items-center justify-center px-6">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="text-2xl font-bold">App Intel</Link>
                    <p className="text-[#a1a1a1] mt-2">Create your account</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-[#ff453a]/10 border border-[#ff453a]/20 rounded-lg text-sm text-[#ff453a]">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm text-[#86868b] mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-[#242424] border border-white/10 rounded-xl text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#8b5cf6] transition-colors"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm text-[#86868b] mb-2">
                            Password
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
                        <p className="text-xs text-[#6e6e73] mt-1">Minimum 6 characters</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[#8b5cf6] hover:bg-[#a78bfa] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                {/* Terms */}
                <p className="mt-4 text-xs text-[#6e6e73] text-center">
                    By signing up, you agree to our{' '}
                    <Link href="/terms-of-service" className="text-[#8b5cf6] hover:underline">
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy-policy" className="text-[#8b5cf6] hover:underline">
                        Privacy Policy
                    </Link>.
                </p>

                {/* Links */}
                <div className="mt-6 text-center text-sm">
                    <p className="text-[#a1a1a1]">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[#8b5cf6] hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Back to home */}
                <div className="mt-8 text-center">
                    <Link href="/" className="text-sm text-[#6e6e73] hover:text-white transition-colors">
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}
