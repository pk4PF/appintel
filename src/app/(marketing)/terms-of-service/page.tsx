import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'App Gap Terms of Service - Rules and conditions for using our service.',
};

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-[#171717] text-white">
            {/* Header */}
            <header className="border-b border-white/10">
                <div className="max-w-3xl mx-auto px-6 py-4">
                    <Link href="/" className="text-xl font-bold">App Gap</Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-6 py-12">
                <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
                <p className="text-[#86868b] mb-8">Last updated: December 30, 2024</p>

                <div className="prose prose-invert prose-gray max-w-none space-y-8">
                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">1. Acceptance of Terms</h2>
                        <p className="text-[#a1a1a1] leading-relaxed">
                            By accessing or using App Gap, you agree to be bound by these Terms of Service.
                            If you do not agree to these terms, please do not use our service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">2. Description of Service</h2>
                        <p className="text-[#a1a1a1] leading-relaxed">
                            App Gap provides iOS App Store market gap analysis and analysis tools to help
                            developers identify opportunities. Our data is derived from publicly available
                            App Store information and should be used as directional guidance, not absolute metrics.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">3. Account Responsibilities</h2>
                        <p className="text-[#a1a1a1] leading-relaxed">
                            You are responsible for:
                        </p>
                        <ul className="list-disc list-inside text-[#a1a1a1] mt-4 space-y-2">
                            <li>Maintaining the confidentiality of your account credentials</li>
                            <li>All activities that occur under your account</li>
                            <li>Notifying us immediately of any unauthorized use</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">4. Acceptable Use</h2>
                        <p className="text-[#a1a1a1] leading-relaxed">
                            You agree not to:
                        </p>
                        <ul className="list-disc list-inside text-[#a1a1a1] mt-4 space-y-2">
                            <li>Use the service for any illegal purpose</li>
                            <li>Attempt to gain unauthorized access to our systems</li>
                            <li>Scrape, copy, or redistribute our data without permission</li>
                            <li>Share your account with others</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">5. Payment & Refunds</h2>
                        <p className="text-[#a1a1a1] leading-relaxed">
                            Lifetime access purchases are one-time payments. We offer a 7-day refund policy
                            if you are not satisfied with the service. Contact us to request a refund.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">6. Data Accuracy Disclaimer</h2>
                        <p className="text-[#a1a1a1] leading-relaxed">
                            App Store data provided through App Gap is estimated and directional. We do not
                            guarantee the accuracy of download counts, revenue figures, or other metrics.
                            Use this information as one input among many when making business decisions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">7. Limitation of Liability</h2>
                        <p className="text-[#a1a1a1] leading-relaxed">
                            App Gap is provided &quot;as is&quot; without warranties of any kind. We are not liable
                            for any damages arising from your use of the service or decisions made based
                            on information provided by the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">8. Changes to Terms</h2>
                        <p className="text-[#a1a1a1] leading-relaxed">
                            We may update these terms at any time. Continued use of the service after
                            changes constitutes acceptance of the new terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-white">9. Contact</h2>
                        <p className="text-[#a1a1a1] leading-relaxed">
                            For questions about these Terms, contact us at:
                            <span className="text-[#8b5cf6]"> support@appgap.io</span>
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
