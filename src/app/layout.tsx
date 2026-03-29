import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import AuthModal from "@/components/AuthModal";
import AgeVerification from "@/components/AgeVerification";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "RadarBuds - Rate & Discover Cannabis Strains",
  description: "Rate cannabis strains with an interactive effect radar. Build your effect profile and discover strains that match your preferences.",
  keywords: ["cannabis", "strain rating", "effect profile", "strain discovery", "marijuana", "weed rating", "strain recommendations"],
  authors: [{ name: "RadarBuds" }],
  creator: "RadarBuds",
  publisher: "RadarBuds",
  metadataBase: new URL("https://radarbuds.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://radarbuds.com",
    siteName: "RadarBuds",
    title: "RadarBuds - Rate & Discover Cannabis Strains",
    description: "Rate cannabis strains with an interactive effect radar. Build your effect profile and discover strains you'll love.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "RadarBuds - Interactive Strain Rating",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RadarBuds - Rate & Discover Cannabis Strains",
    description: "Rate cannabis strains with an interactive effect radar. Build your effect profile and discover strains you'll love.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f0f0f]`}
      >
        <AuthProvider>
          <AgeVerification />
          <Header />
          <AuthModal />
          <div className="pt-14">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
