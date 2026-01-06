"use client";

import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user } = useUser();

    return (
        <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/30">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <img
                                src="/logo.png"
                                alt="GPXForage"
                                className="h-12 w-12 object-cover rounded-full transition-transform duration-300 group-hover:scale-105 shadow-md"
                            />
                            <span className="font-bold text-xl tracking-tighter">GPXForage</span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-6">
                            <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                                Route Library
                            </Link>
                        </nav>
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="hidden md:block text-right">
                                <p className="text-sm font-medium leading-none">{user?.name}</p>
                            </div>
                            {user?.picture ? (
                                <img src={user.picture} alt="User" className="size-9 rounded-full ring-2 ring-border" />
                            ) : (
                                <div className="size-9 rounded-full bg-secondary" />
                            )}
                        </div>
                        <Link href="/api/auth/logout" title="Log Out">
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                <LogOut className="size-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8">
                {children}
            </main>
        </div>
    );
}
