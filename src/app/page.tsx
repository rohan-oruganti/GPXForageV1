"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Map, Zap, Layers, ArrowRight } from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0/client";

export default function Home() {
  const { user, isLoading } = useUser();

  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-orange-500/30">
      {/* Header */}
      <header className="px-6 h-16 flex items-center justify-between border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <Layers className="size-6 text-green-500" />
          <span>GPX<span className="text-green-500">Forage</span></span>
        </div>
        <nav className="flex items-center gap-4">
          {!isLoading && user ? (
            <Link href="/dashboard">
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/api/auth/login">
              <Button className="bg-green-600 hover:bg-green-700 text-black font-bold">
                Sign In / Join
              </Button>
            </Link>
          )}
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        <section className="relative py-24 lg:py-32 px-6 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-green-600/40 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-emerald-600/20 rounded-full blur-[120px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 max-w-4xl mx-auto space-y-6"
          >
            <div className="inline-block px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-4">
              Multi-Device Support
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              Combine Your Route <br /> Into One Epic Story.
            </h1>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Battery died mid-hike? Tracking across two watches?
              Effortlessly merge scattered GPX fragments into a single, continuous file
              based on matching timestamps and coordinates.
            </p>
            <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={user ? "/dashboard" : "/api/auth/login"}>
                <Button size="lg" className="h-12 px-8 text-base bg-green-600 hover:bg-green-500 text-black font-bold rounded-full shadow-lg shadow-green-900/20 transition-all hover:scale-105 active:scale-95">
                  {user ? "Go to Dashboard" : "Start Foraging"} <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="py-24 px-6 bg-neutral-900/50">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="size-6 text-green-400" />}
              title="Seamless Merge"
              description="Combine Hike, Run, Swim, or Cycle tracks. We intelligently stitch fragments using elevation, time, and distance markers."
            />
            <FeatureCard
              icon={<Map className="size-6 text-emerald-400" />}
              title="Interactive Maps"
              description="Preview your full unified route on detailed maps to ensure every turn is captured correctly."
            />
            <FeatureCard
              icon={<Layers className="size-6 text-teal-400" />}
              title="Multi-Device Ready"
              description="Did your Garmin die and you switched to Strava? No problem. We handle different sources gracefully."
            />
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-neutral-600 text-sm border-t border-white/5">
        &copy; {new Date().getFullYear()} GPXForage. Built with Next.js & Auth0.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
      <div className="mb-4 size-12 rounded-lg bg-white/5 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-neutral-400">{description}</p>
    </div>
  )
}
