import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Auth0Provider } from '@auth0/nextjs-auth0';
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GPXForage: Tracks that make sense",
  description: "Easily merge, edit, and visualize your GPX tracks. The ultimate tool for cyclists, runners, and hikers.",
  keywords: ["GPX", "Merge GPX", "Strava", "Garmin", "Running", "Cycling", "Hiking", "Map"],
  authors: [{ name: "Rohan Oruganti", url: "https://gpxforage.com" }],
  openGraph: {
    title: "GPXForage: Tracks that make sense",
    description: "Easily merge, edit, and visualize your GPX tracks.",
    url: "https://gpx-forage-0113.vercel.app",
    siteName: "GPXForage",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GPXForage Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GPXForage",
    description: "Easily merge, edit, and visualize your GPX tracks.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Auth0Provider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
          <Toaster />
        </body>
      </Auth0Provider>
    </html>
  );
}
