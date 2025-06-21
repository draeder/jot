import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jot - Visual Note Taking",
  description: "Create connected visual notes with rich text editing. Organize your thoughts in an infinite canvas with drag-and-drop cards, syntax highlighting, and seamless connections.",
  keywords: ["notes", "visual", "canvas", "mind mapping", "productivity", "rich text", "collaboration"],
  authors: [{ name: "Jot Team" }],
  creator: "Jot",
  publisher: "Jot",
  
  // Open Graph metadata for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jot-ooo-c032f6516eeb.herokuapp.com/",
    siteName: "Jot",
    title: "Jot - Visual Note Taking",
    description: "Create connected visual notes with rich text editing. Organize your thoughts in an infinite canvas with drag-and-drop cards, syntax highlighting, and seamless connections.",
    images: [
      {
        url: "/jotlogo.png",
        width: 1200,
        height: 630,
        alt: "Jot - Visual Note Taking App",
        type: "image/png",
      },
    ],
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    site: "@jot",
    creator: "@jot",
    title: "Jot - Visual Note Taking",
    description: "Create connected visual notes with rich text editing. Organize your thoughts in an infinite canvas.",
    images: ["/jotlogo.png"],
  },
  
  // Favicon and app icons
  icons: {
    icon: [
      { url: "/jotlogo.png", type: "image/png" },
    ],
    apple: "/jotlogo.png",
    shortcut: "/jotlogo.png",
  },
  
  // App manifest
  manifest: "/manifest.json",
  
  // Additional metadata
  applicationName: "Jot",
  category: "productivity",
  classification: "Business",
  
  // Verification for search engines
  verification: {
    // Add verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
  
  // Robots directives
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
