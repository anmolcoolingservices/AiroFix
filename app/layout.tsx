// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const siteUrl = "https://airofix.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AiroFix – AC & Electrician Services in Delhi NCR",
    template: "%s | AiroFix",
  },
  description:
    "AiroFix provides premium AC service, repair, installation and electrician services across Delhi NCR. Slot-based booking, verified technicians and clear Urban Company style rate card – all from your mobile browser.",
  keywords: [
    "AiroFix",
    "AC service Delhi",
    "AC repair Dwarka",
    "AC installation",
    "electrician near me",
    "electrician Delhi NCR",
    "split AC service",
    "window AC service",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "AiroFix – AC & Electrician Services in Delhi NCR",
    description:
      "Book AC & electrician services in seconds. Slot-based booking, verified technicians and transparent pricing – AiroFix for Delhi NCR homes and offices.",
    siteName: "AiroFix",
    images: [
      {
        url: "/og/airofix-home-v1.png", // jo bhi aapne OG banner path rakha hai
        width: 1200,
        height: 630,
        alt: "AiroFix – AC & Electrician Services · Delhi NCR",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AiroFix – AC & Electrician Services in Delhi NCR",
    description:
      "Book AC & electrician services with AiroFix. Quick slot-based booking, transparent prices and verified technicians.",
    images: ["/og/airofix-home-v1.png"],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900">
        {children}
      </body>
    </html>
  );
}
