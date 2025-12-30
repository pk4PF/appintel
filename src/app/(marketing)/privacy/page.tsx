export default function PrivacyPage() {
    return (
        <div className="px-8 py-32 max-w-4xl mx-auto leading-relaxed">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                <p>We collect information you provide directly to us when you create an account, such as your email address and name.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. How We Use Information</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li>To provide and maintain our Service.</li>
                    <li>To process your payments and prevent fraud.</li>
                    <li>To communicate with you about updates or support.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Data Sharing</h2>
                <p>We do not sell your personal data. We share data only with trusted partners like Supabase and Stripe to provide the service.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Security</h2>
                <p>We take reasonable measures to protect your information, but no service is 100% secure.</p>
            </section>
        </div>
    );
}
