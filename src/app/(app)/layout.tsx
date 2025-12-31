import Sidebar from "../components/Sidebar";

export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen bg-black">
            <Sidebar />
            <main className="flex-1 min-h-screen relative overflow-x-hidden pt-14 md:pt-0">
                {/* Dark Horizon Glow - Global Background */}
                <div
                    className="fixed inset-0 pointer-events-none"
                    style={{
                        background: "radial-gradient(ellipse 80% 50% at 50% 100%, #0d1a36 0%, transparent 60%)",
                        zIndex: 0,
                    }}
                />
                <div className="relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
