import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/web3-provider";
import { ACTIVE_NETWORK_LABEL } from "@/lib/arc";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "ArcPay — USDC Payment Links on Arc";
const description =
  "Create a USDC payment request, share a link, and get paid on Arc. Fast settlement, USDC-native payments.";

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://arc-payments.vercel.app",
  ),
  icons: {
    icon: "/favicon.ico",
    apple: "/logo-192.png",
  },
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "ArcPay",
    images: ["/logo-512.png"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/logo-512.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("arcpay-theme");var d=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <div className="sr-only">{ACTIVE_NETWORK_LABEL}</div>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
