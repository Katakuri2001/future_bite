import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXT_PUBLIC_VERCEL_URL)
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  if (process.env.NEXT_PUBLIC_URL) return process.env.NEXT_PUBLIC_URL;
  if (process.env.URL) return process.env.URL;
  if (process.env.DEPLOY_URL) return process.env.DEPLOY_URL;
  return "http://localhost:3000";
}

export const metadata: Metadata = {
  metadataBase: new URL(resolveSiteUrl()),
  title: {
    default: "FutureBite — Dining, Reimagined.",
    template: "%s | FutureBite",
  },
  description:
    "An extraordinary dining experience where precision, atmosphere, and cuisine converge. Premium restaurant in Yangon, Myanmar.",
  keywords: ["restaurant", "fine dining", "Yangon", "Myanmar", "premium dining", "reservation"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "FutureBite",
    title: "FutureBite — Dining, Reimagined.",
    description: "An extraordinary dining experience where precision, atmosphere, and cuisine converge.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FutureBite Restaurant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FutureBite — Dining, Reimagined.",
    description: "An extraordinary dining experience where precision, atmosphere, and cuisine converge.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
