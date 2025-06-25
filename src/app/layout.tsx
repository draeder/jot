import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import JsonLd from "@/components/json-ld";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jot-app.com"), // Update with your actual domain
  title: {
    default: "Jot - Visual Note Taking",
    template: "%s | Jot"
  },
  description: "Create connected visual notes with rich text editing. Organize your thoughts in an infinite canvas with drag-and-drop cards, syntax highlighting, and seamless connections. Free forever, completely private.",
  keywords: [
    "visual notes", 
    "note taking", 
    "mind mapping", 
    "canvas", 
    "productivity", 
    "rich text", 
    "visual thinking", 
    "knowledge management",
    "infinite canvas",
    "card-based notes",
    "visual workspace",
    "drag and drop",
    "privacy-first",
    "offline notes"
  ],
  authors: [{ name: "Jot Team", url: "https://jot-app.com" }],
  creator: "Jot",
  publisher: "Jot",
  
  // Open Graph metadata for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jot-app.com",
    siteName: "Jot",
    title: "Jot - Visual Note Taking Workspace",
    description: "Create connected visual notes with rich text editing. Organize your thoughts in an infinite canvas with drag-and-drop cards, syntax highlighting, and seamless connections. Free forever, completely private.",
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
    title: "Jot - Visual Note Taking Workspace",
    description: "Create connected visual notes with rich text editing. Organize your thoughts in an infinite canvas. Free forever, completely private.",
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
      <head>
        <JsonLd />
      </head>
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
