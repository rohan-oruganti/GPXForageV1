import { auth0 } from '@/lib/auth0';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Settings, LogOut } from 'lucide-react';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth0.getSession();

    if (!session?.user) {
        redirect('/');
    }

    // Check role in DB
    const user = await db.user.findUnique({
        where: { auth0Sub: session.user.sub },
    });

    if (user?.role !== 'admin') {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Admin Header */}
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <span className="bg-red-600 text-white px-2 py-0.5 rounded text-sm">ADMIN</span>
                    GPXForage
                </div>
                <nav className="flex items-center gap-6 ml-6 text-sm font-medium">
                    <Link href="/admin/jobs" className="transition-colors hover:text-foreground/80 text-foreground/60">Jobs</Link>
                    {/* Future admin links: Users, Settings */}
                    <Link href="/admin/users" className="transition-colors hover:text-foreground/80 text-foreground/60">Users & Analytics</Link>
                    <Link href="/admin/settings" className="transition-colors hover:text-foreground/80 text-foreground/60">Settings</Link>
                </nav>
                <div className="ml-auto flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm">Exit to User App</Button>
                    </Link>
                    <a href="/api/auth/logout">
                        <Button variant="outline" size="sm">Logout</Button>
                    </a>
                </div>
            </header>

            <main className="flex-1 p-6 md:p-8 pt-6">
                {children}
            </main>
        </div>
    );
}
