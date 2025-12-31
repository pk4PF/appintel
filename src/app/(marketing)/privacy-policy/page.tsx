import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'App Intel Privacy Policy - How we collect, use, and protect your data.',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[#171717] text-white">
            {/* Header */}
            <header className="border-b border-white/10">
                <div className="max-w-3xl mx-auto px-6 py-4">
                    <Link href="/" className="text-xl font-bold">App Intel</Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
                <p className="text-[#86868b] mb-8">Last updated: December 31, 2025</p>

                <div className="prose prose-invert prose-gray max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">1. Information We Collect</h2>
                        <p className="text-[#a1a1a1] leading-relaxed">
                            When you use App Intel, we collect the following information:
                        </p>
                        <ul className="list-disc list-inside text-[#a1a1a1] mt-4 space-y-2">
                            <li><strong className="text-white">Account Information:</strong> Email address and password when you create an account.</li>
                            <li><strong className="text-white">Usage Data:</strong> Information about how you use our service.</li>
                            <li><strong className="text-white">Payment Information:</strong> Processed securely through our payment provider (Stripe). We do not store your full payment details.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">2. How We Use Your Information</h2>
                        <p className="text-[#a1a1a1] leading-relaxed">
                            We use your information to:
                        </p>
                        <ul className="list-disc list-inside text-[#a1a1a1] mt-4 space-y-2">
                            <li>Provide and maintain our service</li>
                            <li>Process your transactions</li>
                            <li>Send you important updates about your account</li>
                            <li>Improve our product based on usage patterns</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">3. Data Storage & Security</h2>
                        <p className="text-[#a1a1a1] leading-relaxed">
                            Your data is stored securely using industry-standard encryption. We use Supabase for authentication
                            and database services, which provides enterprise-grade security measures.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">4. Cookies & Tracking</h2>
                        <p className="text-[#a1a1a1] leading-relaxed mb-4">
                            We use cookies to improve your experience and understand how our service is used. We categorize our cookies into five functional groups:
                        </p>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-white mb-2">4.1 Product Experience Cookies</h3>
                                <p className="text-[#a1a1a1]">Used to remember your preferences, accessibility settings, and interface choices to provide a consistent and responsive experience.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white mb-2">4.2 Conversion & Funnel Intelligence</h3>
                                <p className="text-[#a1a1a1]">Helps us understand where users are in their journey, from landing to purchase, allowing us to optimize our onboarding and support flows.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white mb-2">4.3 Personalization & Segmentation</h3>
                                <p className="text-[#a1a1a1]">Enables us to tailor content and recommendations based on your user profile type (e.g., founder, developer) and previous interactions.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white mb-2">4.4 Performance & Stability</h3>
                                <p className="text-[#a1a1a1]">Essential for the basic functioning of the site, including authentication tokens, load balancing, and session continuity.</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white mb-2">4.5 Analytics & Marketing</h3>
                                <p className="text-[#a1a1a1]">Used sparingy to track high-level usage metrics and attribute marketing campaigns. We prefer privacy-preserving, first-party analytics where possible.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">5. Your Rights</h2>
                        <p className="text-[#a1a1a1] leading-relaxed">
                            You have the right to:
                        </p>
                        <ul className="list-disc list-inside text-[#a1a1a1] mt-4 space-y-2">
                            <li>Access your personal data</li>
                            <li>Request correction of your data</li>
                            <li>Request deletion of your account and data</li>
                            <li>Withdraw consent for non-essential data processing</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">6. Contact Us</h2>
                        <p className="text-[#a1a1a1] leading-relaxed">
                            If you have questions about this Privacy Policy or your data, please contact us at:
                            <span className="text-[#8b5cf6]"> paolosoftware13@gmail.com</span>
                        </p>
                    </section>
                </div>

                {/* Back link */}
                <div className="mt-12 pt-8 border-t border-white/10">
                    <Link href="/" className="text-sm text-[#6e6e73] hover:text-white transition-colors">
                        ← Back to home
                    </Link>
                </div>
            </main>
        </div>
    );
}
