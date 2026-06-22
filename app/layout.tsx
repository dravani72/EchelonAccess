import type { Metadata, Viewport } from "next";
import { withBasePath } from "@/lib/base-path";
import "./globals.css";

export const metadata: Metadata = {
  title: "EchelonAccess",
  description: "Private relationship intelligence for elite-network deal origination",
  manifest: withBasePath("/manifest.webmanifest"),
  appleWebApp: {
    capable: true,
    title: "EchelonAccess",
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  themeColor: "#0d1117"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
