"use client";

import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { LogOut, LayoutDashboard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useUser();

    return (
        <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
            {/* Sidebar */}
            <aside className="w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hidden md:flex flex-col">
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <Link href="/" className="font-bold text-xl tracking-tighter flex items-center gap-2">
                        <span>GPX<span className="text-orange-600">Forage</span></span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                            <LayoutDashboard className="size-4" />
                            My Jobs
                        </Button>
                    </Link>
                </nav>

                <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        {user?.picture && <img src={user.picture} alt="User" className="size-8 rounded-full" />}
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{user?.name}</p>
                            <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <Link href="/api/auth/logout">
                        <Button variant="outline" className="w-full gap-2">
                            <LogOut className="size-4" /> Sign Out
                        </Button>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between px-6 md:hidden">
                    <Link href="/" className="font-bold text-xl">GPXForage</Link>
                    <Link href="/api/auth/logout">
                        <LogOut className="size-5" />
                    </Link>
                </header>
                <main className="flex-1 p-6 md:p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
