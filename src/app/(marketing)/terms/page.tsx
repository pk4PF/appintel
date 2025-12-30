export default function TermsPage() {
    return (
        <div className="px-8 py-32 max-w-4xl mx-auto leading-relaxed">
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
            <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p>By using AppIntel, you agree to these terms. If you don&apos;t agree, please do not use the service.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                <p>AppIntel provides market gap analysis for iOS apps, including revenue estimates and spinoff ideas.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Payments and Refunds</h2>
                <p>Payments for lifetime access are one-time. Refunds are generally not provided unless required by law, as the service provides digital insights immediately upon purchase.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Prohibited Uses</h2>
                <p>Users may not scrape our data, reverse engineer the service, or use it for any illegal purpose.</p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
                <p>We provide the service "as is" and do not guarantee the accuracy of revenue estimates or AI ideas.</p>
            </section>
        </div>
    );
}
