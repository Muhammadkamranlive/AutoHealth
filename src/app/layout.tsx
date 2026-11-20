import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { NavigationProvider } from "@/components/navigation-provider";
import { brand, brandTitle } from "@/lib/brand";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  applicationName: brand.name,
  title: {
    default: brandTitle,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  keywords: [
    "telehealth",
    "virtual clinic",
    "patient portal",
    "clinician workspace",
    "referral partners",
    "HIPAA",
    brand.name,
  ],
  openGraph: {
    title: brandTitle,
    description: brand.description,
    siteName: brand.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: brandTitle,
    description: brand.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} safe-top safe-bottom font-sans antialiased`}
        suppressHydrationWarning
      >
        <NavigationProvider>
          {children}
        </NavigationProvider>
      </body>
    </html>
  );
}
