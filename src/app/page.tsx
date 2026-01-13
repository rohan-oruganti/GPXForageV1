"use client";

import { useUser } from "@auth0/nextjs-auth0";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Assuming you have an input component
import { ArrowRight, Apple, Facebook, Globe, Loader2, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const { user, isLoading } = useUser();

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="animate-spin size-8 text-foreground" />
    </div>
  );

  // Auto-redirect to dashboard if logged in? 
  // User asked to mimic login page, so we show this state even for logged-out
  // But if logged in, we might want to show "Go to Dashboard" instead of "Login".

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Column: Form / Actions */}
      <div className="flex flex-col justify-center p-8 lg:p-16 xl:p-24 bg-background relative">
        {/* Logo */}
        <div className="absolute top-8 left-8 lg:top-12 lg:left-12">
          <img src="/logo.png" alt="GPXForage" className="h-16 w-16 object-cover rounded-full shadow-lg" />
        </div>

        <div className="max-w-sm w-full mx-auto space-y-8 mt-12 lg:mt-0">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Welcome back!</h1>
            <p className="text-muted-foreground">
              Simplify your route planning and boost your adventure. Get started for free.
            </p>
          </div>

          {!user ? (
            <div className="space-y-4">


              {/* Real Action */}
              <Link href="/api/auth/login" className="block">
                <Button className="w-full h-12 rounded-full text-base font-bold shadow-xl shadow-black/5" size="lg">
                  Login / Register
                </Button>
              </Link>

              <div className="text-center text-sm text-muted-foreground pt-4 pb-8">
                Not a member? <Link href="/api/auth/login" className="font-bold text-accent-foreground hover:underline">Register now</Link>
              </div>

              {/* Animated Illustrations Carousel - Absolutely positioned to bottom */}
              <div className="absolute bottom-16 left-0 right-0 h-64 w-full flex items-center justify-center overflow-visible pointer-events-none">
                <CyclingIllustrations />
              </div>

            </div>
          ) : (
            <div className="space-y-6 text-center lg:text-left">
              <div className="p-6 rounded-3xl bg-secondary/30 border border-secondary flex items-center gap-4">
                <img src={user.picture || ''} className="size-16 rounded-full border-2 border-background shadow-sm" />
                <div>
                  <p className="font-bold text-lg text-foreground">Hi, {user.name}</p>
                  <p className="text-sm text-muted-foreground">Ready to start?</p>
                </div>
              </div>
              <Link href="/dashboard" className="block">
                <Button className="w-full h-14 rounded-full text-lg font-bold shadow-xl shadow-secondary/20" size="lg">
                  Go to Dashboard <ArrowRight className="ml-2 size-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Hero Image */}
      <div className="bg-secondary relative hidden lg:flex items-center justify-center overflow-hidden">
        {/* Decorative Circles/Blobs mimicking the reference */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/40 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <img
            src="/runner-hero.png"
            alt="Runner"
            className="w-[500px] h-auto object-contain drop-shadow-2xl"
          />

          {/* Floating 'Canva Design' Card mimic -> 'Activity Stats' */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="absolute top-1/2 -left-12 bg-white p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-48 border border-white/50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-sm">Morning Run</div>
              <Activity className="size-4 text-accent" />
            </div>
            <div className="text-xs text-muted-foreground mb-4">10k Job • <span className="text-accent font-bold">84%</span></div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-black w-[84%] rounded-full" />
            </div>
            <div className="mt-4 px-4 py-2 bg-secondary/50 rounded-xl text-xs font-bold text-center">
              Processing
            </div>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-12 text-center max-w-md px-6">
          <h2 className="text-xl font-bold mb-2">GPXForage:</h2>
          <p className="text-muted-foreground">Tracks That Make Sense.</p>
        </div>
      </div>
    </div>
  );
}


function CyclingIllustrations() {
  const [index, setIndex] = require("react").useState(0);
  const images = [
    "/illustration-dog-walker.png",
    "/illustration-biker.png",
    "/illustration-boater.png"
  ];

  require("react").useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev: number) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-[400px] h-full flex items-center justify-center">
      {images.map((src, i) => {
        const offset = (i - index + images.length) % images.length;

        let x = 0;
        let scale = 1;
        let zIndex = 10;
        let opacity = 1;
        let blur = 0;

        if (offset === 0) {
          x = 0;
          scale = 1.25;
          zIndex = 20;
          opacity = 1;
        } else if (offset === 1) {
          x = 100;
          scale = 0.7;
          zIndex = 10;
          opacity = 0.5;
          blur = 1;
        } else {
          x = -100;
          scale = 0.7;
          zIndex = 10;
          opacity = 0.5;
          blur = 1;
        }

        return (
          <motion.img
            key={src}
            src={src}
            className="absolute w-32 h-32 object-contain"
            initial={false}
            animate={{
              x,
              scale,
              zIndex,
              opacity,
              filter: `blur(${blur}px)`
            }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          />
        );
      })}
    </div>
  );
}

